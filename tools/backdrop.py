"""Turn a mountain photo into a dusk pixel-art backdrop for the door scene.

Usage:
  python3 tools/backdrop.py tools/reference/ama-dablam.jpg public/sprites/mountains.png \
      --crop 617,107,1760,583 --width 480 --colors 26

What it does:
  1. crops the region you give (source pixels, x0,y0,x1,y1) and resizes it to --width (height keeps the ratio)
  2. drops the blue sky (the game paints its own dusk sky behind the sprite)
  3. regrades the rest with a dusk ramp: shadows go indigo, lit snow goes gold and pink
  4. reduces it to a small palette, so it reads as pixel art next to the rest of the scene

The photo is not committed (tools/reference/ is gitignored). Credit is kept in src/data/site.ts (`credits`).
"""
import argparse
import colorsys

from PIL import Image, ImageFilter

# luminance 0..1 -> colour. Indigo shadows up to gold highlights, like the last light on snow.
RAMP = [(0.00, (26, 28, 58)), (0.28, (64, 62, 106)), (0.52, (140, 106, 148)), (0.74, (226, 152, 130)), (1.00, (255, 226, 176))]


def ramp(lum):
    for (a, ca), (b, cb) in zip(RAMP, RAMP[1:]):
        if lum <= b:
            t = (lum - a) / (b - a)
            return tuple(round(ca[i] + (cb[i] - ca[i]) * t) for i in range(3))
    return RAMP[-1][1]


def sky_mask(im, step=16, sat=0.25):
    """White where the pixel is sky. Region-grows down from the top edge over blue pixels, stepping only between
    similar colours, so it stops at the ridge line. (A plain 'is it blue' test also eats the blue-lit snow faces.)"""
    from collections import deque

    w, h = im.size
    px = im.load()

    def blue(c):
        hh, ss, vv = colorsys.rgb_to_hsv(c[0] / 255, c[1] / 255, c[2] / 255)
        return 0.5 < hh < 0.72 and ss > sat and vv > 0.25

    seen = [[False] * w for _ in range(h)]
    q = deque()
    for x in range(w):
        if blue(px[x, 0]):
            seen[0][x] = True
            q.append((x, 0))
    while q:
        x, y = q.popleft()
        c = px[x, y]
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx]:
                n = px[nx, ny]
                if blue(n) and sum((c[i] - n[i]) ** 2 for i in range(3)) ** 0.5 < step:
                    seen[ny][nx] = True
                    q.append((nx, ny))
    mask = Image.new("L", im.size, 0)
    mp = mask.load()
    for y in range(h):
        for x in range(w):
            if seen[y][x]:
                mp[x, y] = 255
    return mask.filter(ImageFilter.MaxFilter(3))  # grow a pixel so no blue fringe survives


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--crop", required=True, help="x0,y0,x1,y1 in source pixels")
    ap.add_argument("--width", type=int, default=480)
    ap.add_argument("--colors", type=int, default=26)
    ap.add_argument("--step", type=float, default=7, help="sky region-grow: max colour jump between neighbours (lower = stops sooner)")
    ap.add_argument("--sat", type=float, default=0.38, help="sky region-grow: minimum saturation to count as sky")
    ap.add_argument("--mix", type=float, default=0.18, help="how much of the photo's own colour survives the regrade")
    a = ap.parse_args()

    x0, y0, x1, y1 = (int(v) for v in a.crop.split(","))
    im = Image.open(a.src).convert("RGB").crop((x0, y0, x1, y1))
    im = im.resize((a.width, round(im.height * a.width / im.width)), Image.LANCZOS)

    sky = sky_mask(im, a.step, a.sat)
    graded = Image.new("RGB", im.size)
    src, out, sm = im.load(), graded.load(), sky.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = src[x, y]
            lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
            lum = min(1, max(0, (lum - 0.12) * 1.25))  # a little contrast so the ridges separate
            c = ramp(lum)
            out[x, y] = tuple(round(c[i] * (1 - a.mix) + (r, g, b)[i] * a.mix) for i in range(3))

    # palette from the mountain pixels only, then put the sky back as transparent
    flat = Image.new("RGB", im.size, RAMP[1][1])
    flat.paste(graded, mask=sky.point(lambda v: 255 - v))
    q = flat.quantize(colors=a.colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    result = q.convert("RGBA")
    rp = result.load()
    for y in range(im.height):
        for x in range(im.width):
            if sm[x, y] > 127:
                rp[x, y] = (0, 0, 0, 0)
    result.save(a.dst, optimize=True)
    print(f"{a.dst}: {result.size[0]}x{result.size[1]}, {a.colors} colours")


if __name__ == "__main__":
    main()
