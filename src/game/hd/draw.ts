// Small helpers for the smooth (vector) renderer. Everything draws to the context set with use().
export let g: CanvasRenderingContext2D;
export const use = (ctx: CanvasRenderingContext2D) => { g = ctx; };

export function mix(a: string, b: string, t: number): string {
  const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const k = Math.min(1, Math.max(0, t));
  return '#' + [0, 1, 2].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * k).toString(16).padStart(2, '0')).join('');
}

export const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Fill a polygon from a flat [x0, y0, x1, y1, ...] list. */
export function poly(pts: number[], fill: string | CanvasGradient) {
  g.beginPath();
  g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.closePath();
  g.fillStyle = fill;
  g.fill();
}

export function rrect(x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient) {
  g.beginPath();
  g.roundRect(x, y, w, h, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  g.fillStyle = fill;
  g.fill();
}

export function box(x: number, y: number, w: number, h: number, fill: string | CanvasGradient) {
  g.fillStyle = fill;
  g.fillRect(x, y, w, h);
}

export function circle(x: number, y: number, r: number, fill: string | CanvasGradient) {
  g.beginPath();
  g.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
}

export function oval(x: number, y: number, rx: number, ry: number, fill: string | CanvasGradient) {
  g.beginPath();
  g.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
}

export function stroke(pts: number[], color: string, width: number) {
  g.beginPath();
  g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.stroke();
}

export function vgrad(y0: number, y1: number, stops: [number, string][]) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  return gr;
}

export function hgrad(x0: number, x1: number, stops: [number, string][]) {
  const gr = g.createLinearGradient(x0, 0, x1, 0);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  return gr;
}

export function glow(x: number, y: number, r: number, color: string, alpha = 1) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, color);
  gr.addColorStop(1, color + '00');
  g.globalAlpha = alpha;
  g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2);
  g.globalAlpha = 1;
}

/** Run `fn` with the origin at (x, y) and one unit = s pixels. */
export function at(x: number, y: number, s: number, fn: () => void, rot = 0) {
  g.save();
  g.translate(x, y);
  if (rot) g.rotate(rot);
  g.scale(s, s);
  fn();
  g.restore();
}

export function label(s: string, x: number, y: number, px: number, color: string, opts: { font?: string; weight?: number; align?: CanvasTextAlign; shadow?: string } = {}) {
  g.font = `${opts.weight ?? 400} ${px}px ${opts.font ?? '"IBM Plex Mono", ui-monospace, monospace'}`;
  g.textAlign = opts.align ?? 'left';
  g.textBaseline = 'alphabetic';
  if (opts.shadow) { g.fillStyle = opts.shadow; g.fillText(s, x + px * 0.06, y + px * 0.08); }
  g.fillStyle = color;
  g.fillText(s, x, y);
}

export const rnd = (i: number) => Math.abs(Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1;
