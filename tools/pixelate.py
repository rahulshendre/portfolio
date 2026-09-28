"""Turn a photo into a palette-limited pixel-art sprite.

Usage:
  python3 tools/pixelate.py IN.png OUT.png --width 150 --colors 20 [--recolor-orange-white] [--outline] [--flip]

Works best on a side-profile shot with a transparent or plain background. With a plain
background, pass --key-bg to drop pixels close to the corner colour.
"""
import argparse
import colorsys

from PIL import Image, ImageFilter

INK = (27, 23, 18, 255)  # #1b1712, same ink as the site


def key_background(im, tol=38):
    """Make pixels close to the top-left corner colour transparent (for photos without alpha)."""
    im = im.convert("RGBA")
    bg = im.getpixel((0, 0))[:3]
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) < tol:
                px[x, y] = (r, g, b, 0)
    return im


def recolor_orange_to_white(im, skip=None):
    """Repaint saturated orange panels as pearl white, keeping the photo's shading.
    `skip` is an (x0, x1) pixel column range left alone (the gold forks)."""
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0 or (skip and skip[0] <= x < skip[1]):
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if 0.02 < h < 0.105 and s > 0.55 and v > 0.4:  # orange paint and its yellow-ish edge highlights; brown seat is darker
                lum = 0.70 + 0.30 * v  # keep highlights and shadows, just desaturated and lifted
                c = int(255 * lum)
                px[x, y] = (c, c, min(255, c + 4), a)  # hint of cool pearl
    return im


def keep_accent(src, out, lo, hi, cols):
    """Thin coloured parts (gold forks) vanish in quantisation. Find them in the full-size
    image, shrink that mask to sprite size and paint the covered sprite pixels back."""
    mask = Image.new("L", src.size, 0)
    mp, sp = mask.load(), src.load()
    tot, n = [0, 0, 0], 0
    for y in range(src.height):
        for x in range(src.width):
            r, g, b, a = sp[x, y]
            if a < 200 or not cols[0] <= x < cols[1]:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if lo <= h < hi and s > 0.45 and v > 0.35:
                mp[x, y] = 255
                tot[0] += r; tot[1] += g; tot[2] += b; n += 1
    if not n:
        return out
    base = tuple(c // n for c in tot)
    light = tuple(min(255, int(c * 1.25)) for c in base)
    small = mask.resize(out.size, Image.Resampling.BOX).load()
    op = out.load()
    for y in range(out.height):
        for x in range(out.width):
            if op[x, y][3] and small[x, y] > 70:
                op[x, y] = (*(light if small[x, y] > 150 else base), 255)
    return out


def pixelate(im, width, colors):
    height = max(1, round(im.height * width / im.width))
    small = im.resize((width, height), Image.Resampling.BOX)
    alpha = small.getchannel("A").point(lambda a: 255 if a > 110 else 0)
    rgb = small.convert("RGB").quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out


def add_outline(im):
    """1px ink outline around the silhouette, padded so it never gets clipped."""
    pad = Image.new("RGBA", (im.width + 2, im.height + 2), (0, 0, 0, 0))
    pad.paste(im, (1, 1))
    grown = pad.getchannel("A").filter(ImageFilter.MaxFilter(3))
    outline = Image.new("RGBA", pad.size, INK)
    outline.putalpha(grown)
    outline.alpha_composite(pad)
    return outline


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--width", type=int, default=150)
    ap.add_argument("--colors", type=int, default=20)
    ap.add_argument("--key-bg", action="store_true", help="drop a plain background colour")
    ap.add_argument("--recolor-orange-white", action="store_true")
    ap.add_argument("--outline", action="store_true")
    ap.add_argument("--flip", action="store_true", help="mirror horizontally")
    ap.add_argument("--keep-hue", help="hue range to keep vivid, e.g. 0.088:0.16 for gold forks")
    ap.add_argument("--keep-box", default="0:1", help="width fractions where --keep-hue applies, e.g. 0.645:0.73")
    a = ap.parse_args()

    im = Image.open(a.src).convert("RGBA")
    if a.key_bg:
        im = key_background(im)
    im = im.crop(im.getchannel("A").getbbox())
    k0, k1 = (float(v) for v in a.keep_box.split(":"))
    cols = (int(k0 * im.width), int(k1 * im.width))
    if a.recolor_orange_white:
        im = recolor_orange_to_white(im, cols if a.keep_hue else None)
    out = pixelate(im, a.width, a.colors)
    if a.keep_hue:
        lo, hi = (float(v) for v in a.keep_hue.split(":"))
        out = keep_accent(im, out, lo, hi, cols)
    if a.outline:
        out = add_outline(out)
    if a.flip:
        out = out.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    out.save(a.dst)
    print(f"{a.dst}: {out.width}x{out.height}")


if __name__ == "__main__":
    main()
