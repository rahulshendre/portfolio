// Crisp pixel primitives: integer coordinates only, no anti-aliasing anywhere.
// Draw calls go to whichever context was bound last (the screen, or an offscreen sprite canvas).

let g: CanvasRenderingContext2D;
export const bind = (ctx: CanvasRenderingContext2D) => { g = ctx; };
export const ctx = () => g;

const r = Math.round;

export function rect(x: number, y: number, w: number, h: number, col: string) {
  const x0 = r(x), y0 = r(y), w0 = r(x + w) - x0, h0 = r(y + h) - y0;
  if (w0 <= 0 || h0 <= 0) return;
  g.fillStyle = col;
  g.fillRect(x0, y0, w0, h0);
}

export function disc(cx: number, cy: number, radius: number, col: string) {
  g.fillStyle = col;
  const rr = r(radius), x0 = r(cx), y0 = r(cy);
  for (let dy = -rr; dy <= rr; dy++) {
    const w = Math.floor(Math.sqrt(rr * rr - dy * dy + rr * 0.8));
    g.fillRect(x0 - w, y0 + dy, w * 2 + 1, 1);
  }
}

/** Filled ellipse, handy for tyres seen from behind and shadows. */
export function ellipse(cx: number, cy: number, rx: number, ry: number, col: string) {
  g.fillStyle = col;
  const ryr = Math.max(1, r(ry));
  for (let dy = -ryr; dy <= ryr; dy++) {
    const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ryr * ryr + 0.5))));
    g.fillRect(r(cx) - w, r(cy) + dy, w * 2 + 1, 1);
  }
}

export function line(x0: number, y0: number, x1: number, y1: number, col: string) {
  g.fillStyle = col;
  x0 = r(x0); y0 = r(y0); x1 = r(x1); y1 = r(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx + dy;
  for (;;) {
    g.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * e;
    if (e2 >= dy) { e += dy; x0 += sx; }
    if (e2 <= dx) { e += dx; y0 += sy; }
  }
}

export interface Edge { x: number; y: number; w: number }

/** Rows of a trapezoid between a near edge `a` (lower on screen) and a far edge `b`. Pure, for tests. */
export function trapRows(a: Edge, b: Edge): [number, number, number][] {
  const rows: [number, number, number][] = [];
  for (let yy = b.y; yy < a.y; yy++) {
    const t = (yy - b.y) / (a.y - b.y), cx = b.x + (a.x - b.x) * t, w = b.w + (a.w - b.w) * t;
    const l = r(cx - w), rr = r(cx + w);
    if (rr > l) rows.push([l, yy, rr - l]);
  }
  return rows;
}

export function trap(a: Edge, b: Edge, col: string) {
  g.fillStyle = col;
  for (const [x, y, w] of trapRows(a, b)) g.fillRect(x, y, w, 1);
}

/** Any polygon, scanline filled (even-odd), so shapes stay crisp. */
export function poly(pts: [number, number][], col: string) {
  g.fillStyle = col;
  const ys = pts.map((p) => p[1]);
  const y0 = Math.ceil(Math.min(...ys)), y1 = Math.floor(Math.max(...ys));
  for (let y = y0; y <= y1; y++) {
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      if ((ay <= y + 0.5 && by > y + 0.5) || (by <= y + 0.5 && ay > y + 0.5)) xs.push(ax + ((y + 0.5 - ay) / (by - ay)) * (bx - ax));
    }
    xs.sort((p, q) => p - q);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const l = r(xs[i]), rr = r(xs[i + 1]);
      if (rr > l) g.fillRect(l, y, rr - l, 1);
    }
  }
}

// 4x4 ordered dither: fills a rect with two colours in a checker-like ratio (0..1 of `b`).
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export function dither(x: number, y: number, w: number, h: number, a: string, b: string, t: number) {
  rect(x, y, w, h, a);
  g.fillStyle = b;
  const x0 = r(x), y0 = r(y);
  for (let yy = y0; yy < y0 + r(h); yy++)
    for (let xx = x0; xx < x0 + r(w); xx++)
      if (t > (BAYER[((yy & 3) << 2) | (xx & 3)] + 0.5) / 16) g.fillRect(xx, yy, 1, 1);
}
export const bayer = (x: number, y: number) => (BAYER[((y & 3) << 2) | (x & 3)] + 0.5) / 16;
