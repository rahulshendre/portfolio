import { bind, ctx } from './pixel';

export type Sprite = HTMLCanvasElement & { ww?: number };

/** Paint a sprite once into an offscreen canvas using the normal pixel primitives. */
export function paint(w: number, h: number, draw: () => void, worldWidth?: number): Sprite {
  const c = document.createElement('canvas') as Sprite;
  c.width = w;
  c.height = h;
  const prev = ctx();
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  bind(g);
  draw();
  if (prev) bind(prev);
  c.ww = worldWidth;
  return c;
}

/** Sprite from rows of palette keys ('.' = transparent). */
export function fromRows(rows: string[], pal: Record<string, string>, worldWidth?: number): Sprite {
  return paint(rows[0].length, rows.length, () => {
    const g = ctx();
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) if (row[x] !== '.') { g.fillStyle = pal[row[x]]; g.fillRect(x, y, 1, 1); }
    });
  }, worldWidth);
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

/** Draw with nearest-neighbour scaling at integer positions. */
export function blit(img: CanvasImageSource & { width: number; height: number }, x: number, y: number, w = img.width, h = img.height, flip = false) {
  const g = ctx();
  if (w < 1 || h < 1) return;
  if (!flip) { g.drawImage(img, Math.round(x), Math.round(y), Math.round(w), Math.round(h)); return; }
  g.save();
  g.translate(Math.round(x + w), Math.round(y));
  g.scale(-1, 1);
  g.drawImage(img, 0, 0, Math.round(w), Math.round(h));
  g.restore();
}
