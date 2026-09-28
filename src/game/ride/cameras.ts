// What the player sees of themselves in each camera: rider from behind, handlebars, or top-down.
import { C } from '../art/palette';
import { disc, ellipse, line, poly, rect } from '../engine/pixel';
import { text, textW } from '../engine/font';
import { blit, type Sprite } from '../engine/sprites';
import { N, SEG_L, FINISH, type Segment } from './track';
import type { Car } from './traffic';

export type Cam = 'behind' | 'pov' | 'top';
export const CAMS: Cam[] = ['behind', 'pov', 'top'];
export const CAM_NAMES: Record<Cam, string> = { behind: 'BEHIND', pov: 'RIDER POV', top: 'TOP DOWN' };
export const CAM_HEIGHT: Record<Cam, number> = { behind: 900, pov: 430, top: 900 };

/** Rider sprite from behind. The upper body leans into the steer, the bike buzzes a little with speed. */
export function drawRear(g: CanvasRenderingContext2D, rider: Sprite, W: number, H: number, lean: number, t: number, speedFrac: number) {
  const bob = speedFrac > 0.05 ? Math.round(Math.sin(t * 28)) : 0;
  const x = Math.round(W / 2 - rider.width / 2), y = H - rider.height - 6 + bob;
  ellipse(W / 2, H - 5, 20, 2, '#3a3834');
  const split = 31, lx = Math.round(lean * 4);
  g.drawImage(rider, 0, split, rider.width, rider.height - split, x, y + split, rider.width, rider.height - split);
  g.drawImage(rider, 0, 0, rider.width, split, x + lx, y, rider.width, split);
}

/** From the seat: white tank, gold fork caps, bars with handguards, round mirrors, round clock. */
export function drawPOV(W: number, H: number, speedFrac: number, t: number, kmh: number) {
  const u = Math.max(0.62, W / 480), m = W / 2;
  const b = H + (speedFrac > 0.05 ? Math.round(Math.sin(t * 22) * 0.7) : 0);
  const U = (n: number) => Math.round(n * u);
  poly([[m - U(70), H], [m - U(36), b - U(28)], [m + U(36), b - U(28)], [m + U(70), H]], C.white);
  poly([[m + U(20), b - U(28)], [m + U(36), b - U(28)], [m + U(70), H], [m + U(44), H]], C.whiteShade);
  rect(m - U(4), b - U(28), U(8), U(28), '#2a2a2e');
  disc(m, b - U(14), U(6), C.steel); disc(m, b - U(14), U(3), C.steelDark);
  rect(m - U(52), b - U(47), U(104), U(8), '#2a2a2e');
  disc(m - U(44), b - U(43), U(6), C.gold); disc(m + U(44), b - U(43), U(6), C.gold);
  for (let i = -U(150); i <= U(150); i++) rect(m + i, b - U(54) - Math.round(Math.pow(Math.abs(i) / U(150), 2) * U(14)), 1, Math.max(2, U(3)), C.black);
  for (const sd of [-1, 1]) {
    const ex = m + sd * U(150);
    rect(ex - (sd < 0 ? U(22) : 0), b - U(70), U(22), U(8), '#3a3a3e');
    poly([[ex, b - U(84)], [ex + sd * U(26), b - U(80)], [ex + sd * U(26), b - U(62)], [ex, b - U(66)]], '#26262a');
    line(m + sd * U(118), b - U(62), m + sd * U(136), b - U(104), C.black);
    line(m + sd * U(119), b - U(62), m + sd * U(137), b - U(104), C.black);
    disc(m + sd * U(140), b - U(112), U(12), C.black);
    disc(m + sd * U(140), b - U(112), U(9), '#9cc4d4');
    rect(m + sd * U(140) - U(5), b - U(118), U(4), U(2), '#d6ecf2');
  }
  const cy = b - U(66);
  disc(m, cy, U(21), '#2a2a2e'); disc(m, cy, U(19), C.steel); disc(m, cy, U(17), '#101012');
  for (let k = 0; k <= 10; k++) {
    const a = Math.PI * (0.8 + 1.4 * (k / 10));
    line(m + Math.cos(a) * U(13), cy + Math.sin(a) * U(13), m + Math.cos(a) * U(15), cy + Math.sin(a) * U(15), '#d8d4ca');
  }
  const lcd = String(Math.round(kmh)).padStart(3, '0');
  rect(m - U(11), cy + U(3), U(22), U(10), '#9bd4a0');
  if (u >= 0.95) text(lcd, m - textW(lcd) / 2, cy + U(4), '#1d3b22');
  const a = Math.PI * (0.8 + 1.4 * speedFrac);
  line(m, cy, m + Math.cos(a) * U(14), cy + Math.sin(a) * U(14), C.reflector);
  disc(m, cy, U(2), C.reflector);
}

/** Bird's-eye view, kept chunky on purpose. */
export function drawTop(g: CanvasRenderingContext2D, segs: Segment[], cars: Car[], rider: Sprite, W: number, H: number, pos: number, px: number) {
  const U = 30, half = W > H ? 70 : 58, total = N * SEG_L;
  const rc = (z: number) => W / 2 + (W > H ? 70 : 40) * Math.sin((z * Math.PI * 2 * 4) / total) * Math.min(1, Math.max(0, (FINISH * SEG_L - z) / 8000));
  const bottom = H - 50;
  for (let y = 0; y < H; y++) {
    const z = pos + (bottom - y) * U, r = rc(z), alt = Math.floor(z / 600) % 2;
    g.fillStyle = C.grass[alt]; g.fillRect(0, y, W, 1);
    g.fillStyle = alt ? '#a39473' : '#9a8b6b'; g.fillRect(Math.round(r - half - 14), y, (half + 14) * 2, 1);
    g.fillStyle = C.kerb[alt]; g.fillRect(Math.round(r - half - 4), y, (half + 4) * 2, 1);
    g.fillStyle = C.road[alt]; g.fillRect(Math.round(r - half), y, half * 2, 1);
    g.fillStyle = C.lane;
    g.fillRect(Math.round(r - half + 4), y, 1, 1); g.fillRect(Math.round(r + half - 5), y, 1, 1);
    if (Math.floor(z / 300) % 2) g.fillRect(Math.round(r), y, 2, 1);
  }
  const i0 = Math.floor(pos / SEG_L) - 3, i1 = Math.floor((pos + bottom * U) / SEG_L) + 2;
  for (let i = Math.max(0, i0); i < Math.min(N, i1); i++) {
    const z = i * SEG_L, y = bottom - (z - pos) / U, r = rc(z);
    for (const p of segs[i].props) {
      const sx = r + Math.sign(p.o) * (half + 8 + Math.abs(p.o) * 14);
      if (p.type === 'tree') { disc(sx, y, 9, C.leafDark); disc(sx - 2, y - 2, 6, C.leaf); disc(sx - 3, y - 4, 2, C.leafLight); }
      else if (p.type === 'post') rect(r + Math.sign(p.o) * (half + 9), y, 2, 2, C.reflector);
      else if (p.type === 'ms') { rect(sx - 4, y - 5, 8, 10, '#f2f0ea'); rect(sx - 4, y - 5, 8, 4, C.accent); }
      else if (p.type === 'stall') { rect(sx - 16, y - 10, 32, 20, C.white); for (let k = 0; k < 32; k += 6) rect(sx - 16 + k, y - 10, 3, 20, C.red); }
      else if (p.type === 'garage') { rect(sx - 60, y - 40, 120, 80, '#7a4a32'); rect(sx - 60, y - 2, 120, 4, '#5e3826'); rect(sx + 58, y - 22, 14, 44, '#3a3833'); }
    }
  }
  for (const c of cars) {
    const y = bottom - (c.z - pos) / U;
    if (y < -40 || y > H + 40) continue;
    const x = rc(c.z) + c.o * half * 1.1;
    if (c.kind === 'auto') { rect(x - 6, y - 9, 12, 18, C.black); rect(x - 6, y - 9, 12, 11, C.accent); }
    else { rect(x - 9, y - 22, 18, 12, '#e86a1f'); rect(x - 10, y - 9, 20, 30, '#2c5aa0'); rect(x - 10, y - 9, 20, 3, C.accent); }
  }
  blit(rider, Math.round(rc(pos) + px * half * 1.1 - rider.width / 2), bottom - rider.height / 2);
}
