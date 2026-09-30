// The finishing pass over the ride: the grade, the vignette, a warm bloom on the sun's side and a fine grain, all drawn once into
// a cached overlay so it costs a single drawImage per frame. This is what makes flat vector shapes feel photographed and lit.
import { rnd } from './draw';

let cache: { W: number; H: number; HZ: number; tod: number; night: boolean; canvas: HTMLCanvasElement } | null = null;

function build(W: number, H: number, HZ: number, tod: number, night: boolean) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  // warm bloom from the low sun on the right, cooler shadow on the left
  const sx = W * 0.74, sy = H * HZ - H * (0.26 - 0.15 * tod) * 0.6;
  const bloom = g.createRadialGradient(sx, sy, 0, sx, sy, Math.max(W, H) * 0.75);
  bloom.addColorStop(0, `rgba(255,214,150,${0.2 + tod * 0.06})`); bloom.addColorStop(0.5, 'rgba(255,170,110,0.06)'); bloom.addColorStop(1, 'rgba(255,170,110,0)');
  if (!night) { g.fillStyle = bloom; g.fillRect(0, 0, W, H); }
  // shafts of light fanning out from the sun through the haze, stronger toward evening
  const ry = H * HZ - H * (0.26 - 0.15 * tod);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 0; !night && k < 9; k++) {
    const a = 1.75 + (k - 4) * 0.21 + rnd(k * 3.3) * 0.08, wd = 0.035 + rnd(k * 1.9) * 0.05, len = Math.hypot(W, H);
    const gr = g.createRadialGradient(sx, ry, 0, sx, ry, len * 0.8);
    gr.addColorStop(0, `rgba(255,214,150,${0.07 + tod * 0.05})`); gr.addColorStop(1, 'rgba(255,214,150,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(sx, ry);
    g.lineTo(sx + Math.cos(a - wd) * len, ry + Math.sin(a - wd) * len); g.lineTo(sx + Math.cos(a + wd) * len, ry + Math.sin(a + wd) * len); g.closePath(); g.fill();
  }
  g.restore();
  const cool = g.createLinearGradient(0, 0, W * 0.5, 0);
  cool.addColorStop(0, 'rgba(40,44,90,0.1)'); cool.addColorStop(1, 'rgba(40,44,90,0)');
  g.fillStyle = cool; g.fillRect(0, 0, W * 0.5, H);
  // vignette: dark corners, and a soft dark band at the bottom that seats the bike in the road
  const v = g.createRadialGradient(W / 2, H * 0.52, Math.min(W, H) * 0.42, W / 2, H * 0.52, Math.hypot(W, H) * 0.6);
  v.addColorStop(0, 'rgba(20,10,6,0)'); v.addColorStop(1, 'rgba(20,10,6,0.3)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  const b = g.createLinearGradient(0, H * 0.82, 0, H);
  b.addColorStop(0, 'rgba(20,10,6,0)'); b.addColorStop(1, 'rgba(20,10,6,0.22)');
  g.fillStyle = b; g.fillRect(0, H * 0.82, W, H * 0.18);
  // grain: a small tile of noise, repeated
  const T = 128, n = document.createElement('canvas'); n.width = n.height = T;
  const ng = n.getContext('2d')!, id = ng.createImageData(T, T);
  for (let i = 0; i < T * T; i++) { const v0 = rnd(i * 1.37 + 5) > 0.5 ? 255 : 0, a = 4 + rnd(i * 2.1) * 9; id.data[i * 4] = v0; id.data[i * 4 + 1] = v0; id.data[i * 4 + 2] = v0; id.data[i * 4 + 3] = a; }
  ng.putImageData(id, 0, 0);
  g.fillStyle = g.createPattern(n, 'repeat')!; g.fillRect(0, 0, W, H);
  return c;
}

/** Draw the finishing pass. `tod` 0..1 shifts the bloom slightly as the day goes on; it is rebuilt only when the size or the hour changes noticeably. */
export function finish(ctx: CanvasRenderingContext2D, W: number, H: number, HZ: number, tod: number, night = false) {
  const q = Math.round(tod * 6) / 6;
  if (!cache || cache.W !== W || cache.H !== H || cache.HZ !== HZ || cache.tod !== q || cache.night !== night) cache = { W, H, HZ, tod: q, night, canvas: build(W, H, HZ, q, night) };
  ctx.drawImage(cache.canvas, 0, 0);
}
