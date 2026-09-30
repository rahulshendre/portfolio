// Rider cameras in smooth style: behind (leaning), handlebar POV, top-down.
import { at, box, circle, g, label, oval, poly, stroke, use } from './draw';
import { FINISH, N, SEG_L, type Segment } from './track-ladakh';
import type { Car } from './traffic';

export type Cam = 'behind' | 'pov' | 'top';
export const CAMS: Cam[] = ['behind', 'pov', 'top'];
export const CAM_NAMES: Record<Cam, string> = { behind: 'BEHIND', pov: 'RIDER POV', top: 'TOP DOWN' };
export const CAM_HEIGHT: Record<Cam, number> = { behind: 900, pov: 430, top: 900 };

/** From the seat: tank, bars, mirrors, round speedo. */
export function drawPOV(ctx: CanvasRenderingContext2D, W: number, H: number, speedFrac: number, t: number, kmh: number) {
  use(ctx);
  const u = Math.max(0.7, W / 1100);
  const m = W / 2;
  const b = H + (speedFrac > 0.05 ? Math.sin(t * 22) * 1.2 : 0);
  const U = (n: number) => n * u;
  // tank
  poly([m - U(90), H, m - U(42), b - U(36), m + U(42), b - U(36), m + U(90), H], '#f1efe9');
  poly([m + U(18), b - U(36), m + U(42), b - U(36), m + U(90), H, m + U(50), H], '#c9c6bd');
  box(m - U(5), b - U(36), U(10), U(36), '#2a2a2e'); // stripe
  circle(m, b - U(18), U(7), '#b8bcc2');
  // bars
  box(m - U(60), b - U(58), U(120), U(10), '#2a2a2e');
  circle(m - U(52), b - U(53), U(7), '#d9a441');
  circle(m + U(52), b - U(53), U(7), '#d9a441');
  for (let i = -U(170); i <= U(170); i += 2) {
    const y = b - U(66) - Math.pow(Math.abs(i) / U(170), 2) * U(16);
    box(m + i, y, 2, Math.max(2, U(3)), '#121214');
  }
  for (const sd of [-1, 1]) {
    const ex = m + sd * U(170);
    box(ex - (sd < 0 ? U(26) : 0), b - U(84), U(26), U(10), '#3a3a3e');
    poly([ex, b - U(100), ex + sd * U(30), b - U(94), ex + sd * U(30), b - U(74), ex, b - U(80)], '#26262a');
    stroke([m + sd * U(130), b - U(74), m + sd * U(155), b - U(120)], '#121214', U(3));
    circle(m + sd * U(160), b - U(130), U(14), '#121214');
    circle(m + sd * U(160), b - U(130), U(11), '#9cc4d4');
  }
  // speedo
  const cy = b - U(80);
  circle(m, cy, U(26), '#2a2a2e');
  circle(m, cy, U(23), '#b8bcc2');
  circle(m, cy, U(20), '#101012');
  for (let k = 0; k <= 10; k++) {
    const a = Math.PI * (0.8 + 1.4 * (k / 10));
    stroke([m + Math.cos(a) * U(15), cy + Math.sin(a) * U(15), m + Math.cos(a) * U(18), cy + Math.sin(a) * U(18)], '#d8d4ca', 1.5);
  }
  const lcd = String(Math.round(kmh)).padStart(3, '0');
  box(m - U(14), cy + U(4), U(28), U(12), '#9bd4a0');
  label(lcd, m, cy + U(14), U(11), '#1d3b22', { align: 'center', weight: 600 });
  const needle = Math.PI * (0.8 + 1.4 * Math.min(1, speedFrac));
  stroke([m, cy, m + Math.cos(needle) * U(16), cy + Math.sin(needle) * U(16)], '#e8641f', 2.5);
  circle(m, cy, U(3), '#e8641f');
}

/** Bird's-eye road ribbon with Ladakh props. */
export function drawTop(ctx: CanvasRenderingContext2D, segs: Segment[], cars: Car[], W: number, H: number, pos: number, px: number) {
  use(ctx);
  const U = 30, half = W > H ? 70 : 58, total = N * SEG_L;
  const rc = (z: number) => W / 2 + (W > H ? 70 : 40) * Math.sin((z * Math.PI * 2 * 4) / total) * Math.min(1, Math.max(0, (FINISH * SEG_L - z) / 8000));
  const bottom = H - 50;
  for (let y = 0; y < H; y++) {
    const z = pos + (bottom - y) * U, r = rc(z), alt = Math.floor(z / 600) % 2;
    ctx.fillStyle = alt ? '#b8a078' : '#a89068';
    ctx.fillRect(0, y, W, 1);
    ctx.fillStyle = alt ? '#9a8868' : '#8a7858';
    ctx.fillRect(Math.round(r - half - 14), y, (half + 14) * 2, 1);
    ctx.fillStyle = alt ? '#e8b923' : '#222';
    ctx.fillRect(Math.round(r - half - 4), y, (half + 4) * 2, 1);
    ctx.fillStyle = alt ? '#5a5854' : '#54524e';
    ctx.fillRect(Math.round(r - half), y, half * 2, 1);
    ctx.fillStyle = '#e9e3d1';
    ctx.fillRect(Math.round(r - half + 4), y, 1, 1);
    ctx.fillRect(Math.round(r + half - 5), y, 1, 1);
    if (Math.floor(z / 300) % 2) ctx.fillRect(Math.round(r), y, 2, 1);
  }
  const i0 = Math.floor(pos / SEG_L) - 3, i1 = Math.floor((pos + bottom * U) / SEG_L) + 2;
  for (let i = Math.max(0, i0); i < Math.min(N, i1); i++) {
    const z = i * SEG_L, y = bottom - (z - pos) / U, r = rc(z);
    for (const p of segs[i].props) {
      const sx = r + Math.sign(p.o || 1) * (half + 8 + Math.abs(p.o) * 14);
      if (p.type === 'poplar') { circle(sx, y, 8, '#c8a848'); box(sx - 1, y, 2, 10, '#5a4030'); }
      else if (p.type === 'house') { box(sx - 14, y - 10, 28, 20, '#f0ebe0'); circle(sx + 6, y - 2, 3, '#1d1d1d'); }
      else if (p.type === 'chorten') { box(sx - 6, y - 14, 12, 14, '#ebe4d4'); circle(sx, y - 16, 3, '#e8b923'); }
      else if (p.type === 'boulder') circle(sx, y, 10, '#8a7060');
      else if (p.type === 'snow') oval(sx, y, 12, 5, '#f0f4f8');
      else if (p.type === 'yak') oval(sx, y, 10, 6, '#3a3028');
      else if (p.type === 'flags' || p.type === 'canopy') stroke([sx - 16, y - 8, sx + 16, y - 4], '#d8342b', 2);
      else if (p.type === 'ms') { box(sx - 5, y - 8, 10, 12, '#f2f0ea'); box(sx - 5, y - 8, 10, 4, '#e8b923'); }
      else if (p.type === 'bro') box(sx - 10, y - 6, 20, 10, '#e8b923');
      else if (p.type === 'board') box(sx - 20, y - 2, 40, 4, '#2a2a2e');
      else if (p.type === 'garage') { box(sx - 40, y - 28, 80, 50, '#d9cbb2'); box(sx - 28, y - 20, 56, 36, '#8b8f94'); }
      else if (p.type === 'stone') box(sx - 2, y - 3, 4, 4, p.v ? '#e8b923' : '#a89880');
    }
  }
  for (const c of cars) {
    const y = bottom - (c.z - pos) / U;
    if (y < -40 || y > H + 40) continue;
    const x = rc(c.z) + c.o * half * 1.1;
    if (c.kind === 'army') { box(x - 10, y - 20, 20, 36, '#4a5a38'); box(x - 8, y - 24, 16, 8, '#3a4a30'); }
    else if (c.kind === 'suv') { box(x - 8, y - 14, 16, 26, '#d8dce0'); box(x - 6, y - 18, 12, 6, '#c0c4c8'); }
    else { circle(x, y, 5, '#2b2e36'); circle(x, y - 8, 4, '#f4f2ea'); }
  }
  // player bike
  const bx = rc(pos) + px * half * 1.1;
  circle(bx - 8, bottom, 6, '#121214');
  circle(bx + 8, bottom, 6, '#121214');
  stroke([bx - 8, bottom, bx, bottom - 14, bx + 8, bottom], '#c8c4bc', 2);
  circle(bx, bottom - 28, 7, '#f4f2ea');
  oval(bx, bottom - 16, 8, 10, '#2b2e36');
}
