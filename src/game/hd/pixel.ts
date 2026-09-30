// Pixel look for the ride: the world is drawn small, snapped to a limited palette with an ordered dither, then scaled up with hard
// edges. The HUD is drawn afterwards at full resolution, so text stays sharp.

/** Rows of pixels the world is drawn at. Landscape matches the garage's 480x270 frame. */
export const PIXEL_ROWS = { land: 270, port: 420 };
/** Shades per colour channel. 10 gives 1,000 colours: enough for the sky gradients to read, few enough to look like a palette. */
export const LEVELS = 10;

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export function lowSize(fw: number, fh: number): { W: number; H: number } {
  const rows = fh > fw * 1.1 ? PIXEL_ROWS.port : PIXEL_ROWS.land;
  return { W: Math.max(1, Math.round((rows * fw) / fh)), H: rows };
}

/** Snap RGBA data to `levels` shades per channel, nudged by a 4x4 ordered dither so gradients stay smooth. Alpha is left alone. */
export function quantise(d: Uint8ClampedArray, w: number, h: number, levels = LEVELS) {
  const step = 255 / (levels - 1);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nudge = ((BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 - 0.5) * step * 0.7;
      const i = (y * w + x) * 4;
      d[i] = Math.round((d[i] + nudge) / step) * step;
      d[i + 1] = Math.round((d[i + 1] + nudge) / step) * step;
      d[i + 2] = Math.round((d[i + 2] + nudge) / step) * step;
    }
  }
}

/** The small canvas the world is drawn on. It is read back every frame, so it lives on the CPU. */
export class LowRes {
  readonly cv = document.createElement('canvas');
  readonly ctx = this.cv.getContext('2d', { alpha: false, willReadFrequently: true })!;
  get W() { return this.cv.width; }
  get H() { return this.cv.height; }

  fit(fw: number, fh: number) {
    const s = lowSize(fw, fh);
    if (this.cv.width !== s.W || this.cv.height !== s.H) { this.cv.width = s.W; this.cv.height = s.H; }
    return s;
  }

  /** Palette and dither the finished frame, then draw it over `dest` at full size with hard edges. */
  blit(dest: CanvasRenderingContext2D, fw: number, fh: number) {
    const img = this.ctx.getImageData(0, 0, this.W, this.H);
    quantise(img.data, this.W, this.H);
    this.ctx.putImageData(img, 0, 0);
    const was = dest.imageSmoothingEnabled;
    dest.imageSmoothingEnabled = false;
    dest.drawImage(this.cv, 0, 0, fw, fh);
    dest.imageSmoothingEnabled = was;
  }
}
