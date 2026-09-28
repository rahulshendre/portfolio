// Sky (ordered-dithered bands), sun, drifting clouds, layered Sahyadri hills and a wind farm.
import { C } from '../art/palette';
import { bayer, disc, line, rect } from '../engine/pixel';

let skyCache: HTMLCanvasElement | undefined;
let skyKey = '';

function sky(W: number, H: number, HZ: number): HTMLCanvasElement {
  const key = `${W}x${H}x${HZ}`;
  if (skyCache && skyKey === key) return skyCache;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const img = g.createImageData(W, H);
  const cols = C.sky.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  const n = cols.length - 1, hz = H * (HZ + 0.08);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = Math.min(1, y / hz) * n, i = Math.min(n - 1, Math.floor(t));
      const [r, gg, b] = cols[t - i > bayer(x, y) ? i + 1 : i];
      const o = (y * W + x) * 4;
      img.data[o] = r; img.data[o + 1] = gg; img.data[o + 2] = b; img.data[o + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  skyCache = c; skyKey = key;
  return c;
}

const CLOUDS = [{ x: 40, y: 0.1, s: 1 }, { x: 170, y: 0.2, s: 1.4 }, { x: 300, y: 0.07, s: 1 }, { x: 420, y: 0.16, s: 1.2 }];
const MILLS = [60, 150, 260, 380];
const LAYERS: [number, number, number, number][] = [
  [0.12, 34, 0.02, 0.053], // parallax, amplitude, freq1, freq2
  [0.3, 24, 0.035, 0.09],
  [0.55, 15, 0.06, 0.15],
  [0.85, 9, 0.09, 0.23],
];

export function drawBackground(g: CanvasRenderingContext2D, W: number, H: number, HZ: number, off: number, t: number) {
  g.drawImage(sky(W, H, HZ), 0, 0);
  const sunX = W * 0.72, sunY = H * HZ - 22;
  disc(sunX, sunY, 17, C.halo); disc(sunX, sunY, 12, C.sun);
  const span = W + 120;
  for (const cl of CLOUDS) {
    const cx = (((cl.x - off * 0.06 - t * 2) % span) + span) % span - 60, cy = cl.y * H, s = cl.s;
    disc(cx, cy, 6 * s, C.cloud); disc(cx + 8 * s, cy - 3 * s, 8 * s, C.cloud); disc(cx + 18 * s, cy, 6 * s, C.cloud);
    rect(cx - 6 * s, cy + 3 * s, 30 * s, 3 * s, C.cloud); rect(cx - 5 * s, cy + 6 * s, 28 * s, 1, C.cloudShade);
  }
  const base = Math.round(H * (HZ + 0.04));
  LAYERS.forEach(([par, amp, f1, f2], k) => {
    const hAt = (i: number) => { const u = i + off * par; return Math.round(amp * 0.6 + amp * 0.28 * Math.sin(u * f1) + amp * 0.18 * Math.sin(u * f2 + k * 1.7)); };
    g.fillStyle = C.hill[k];
    for (let i = 0; i < W; i++) { const h = hAt(i); g.fillRect(i, base - h, 1, h + 80); }
    if (k === 1) {
      const wspan = W + 60;
      for (const wx of MILLS) {
        const p = Math.round((((wx - off * par) % wspan) + wspan) % wspan - 30), foot = base - hAt(p), top = foot - 22;
        line(p, foot, p, top, '#e9e6dc');
        for (let b = 0; b < 3; b++) { const a = t * 2 + wx + (b * Math.PI * 2) / 3; line(p, top, p + Math.cos(a) * 11, top + Math.sin(a) * 11, '#f4f1e8'); }
        rect(p - 1, top - 1, 3, 2, '#d8d3c6');
      }
    }
  });
}
