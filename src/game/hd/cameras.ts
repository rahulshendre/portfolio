// Rider cameras in smooth style: behind (leaning), handlebar POV, top-down.
import { at, box, circle, g, label, oval, poly, rrect, stroke, use } from './draw';

export type Cam = 'behind' | 'high' | 'pov' | 'top';
export const CAMS: Cam[] = ['behind', 'high', 'pov', 'top'];
export const CAM_NAMES: Record<Cam, string> = { behind: 'BEHIND', high: 'CHASE', pov: 'RIDER POV', top: 'TOP DOWN' };
export const CAM_HEIGHT: Record<Cam, number> = { behind: 900, high: 1700, pov: 430, top: 900 };
/** How big the rider is drawn in each camera. */
export const RIDER_SCALE: Record<Cam, number> = { behind: 1, high: 0.72, pov: 1, top: 1 };

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
  box(m - U(7), b - U(36), U(14), U(36), '#17181c'); // the black centre stripe on the white tank
  rrect(m - U(48), b - U(30), U(14), U(30), U(5), '#17181c'); rrect(m + U(34), b - U(30), U(14), U(30), U(5), '#17181c'); // rubber knee pads
  circle(m, b - U(18), U(7), '#b8bcc2');
  // the gold upside-down forks running down from the yokes either side of the tank: the Scrambler's signature
  for (const sd of [-1, 1]) {
    poly([m + sd * U(34), b - U(36), m + sd * U(52), b - U(36), m + sd * U(66), b - U(6), m + sd * U(48), b - U(6)], '#d9a233');
    poly([m + sd * U(34), b - U(36), m + sd * U(40), b - U(36), m + sd * U(54), b - U(6), m + sd * U(48), b - U(6)], '#f0c766');
    box(m + sd * U(34) - (sd < 0 ? U(20) : 0), b - U(42), U(20), U(8), '#1a1b20');
  }
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
  // gloved hands on the grips, with the jacket sleeves running back toward your shoulders
  for (const sd of [-1, 1]) {
    const hx = m + sd * U(178), hy = b - U(70);
    poly([hx - U(19), hy + U(2), hx + U(19), hy + U(2), hx + sd * U(96), H, hx - sd * U(20) + sd * U(34), H], '#2f3747');
    poly([hx - U(19), hy + U(2), hx - U(4), hy + U(2), hx + sd * U(60), H, hx + sd * U(34), H], '#465066');
    rrect(hx - U(21), hy - U(17), U(42), U(29), U(11), '#141518'); rrect(hx - U(17), hy - U(15), U(26), U(8), U(4), '#2a2c32');
    for (let k = 0; k < 3; k++) stroke([hx - U(14) + k * U(14), hy - U(4), hx - U(14) + k * U(14), hy + U(8)], '#050506', 1.2);
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

export { drawTop } from './topview';
