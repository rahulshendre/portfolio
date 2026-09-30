// The last shot of the ride, from the side: the garage across its forecourt at dusk, and your bike (the garage's own sprite) rolling in to the bay.
import { at, box, g, label, oval, poly, use, vgrad } from './draw';
import { drawGarage } from './props';

/** Seconds the bike takes to roll in, and how long the whole shot lasts before the door opens. */
export const ROLL = 2.4;
export const HOME_LEN = 4.4;
const SPRITE_W = 242, SPRITE_H = 114;

export function drawHome(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, bike: HTMLImageElement | null, still = false) {
  use(ctx);
  const y0 = H * 0.8;
  box(0, 0, W, y0, vgrad(0, y0, [[0, '#2b3260'], [0.5, '#a05a78'], [0.86, '#f0a460'], [1, '#f8c880']]));            // dusk over the hills
  poly([0, y0, 0, y0 - H * 0.16, W * 0.18, y0 - H * 0.27, W * 0.34, y0 - H * 0.14, W * 0.55, y0 - H * 0.3, W * 0.78, y0 - H * 0.16, W, y0 - H * 0.24, W, y0], '#6a5a86');
  poly([0, y0, 0, y0 - H * 0.07, W * 0.25, y0 - H * 0.13, W * 0.5, y0 - H * 0.06, W * 0.8, y0 - H * 0.12, W, y0 - H * 0.05, W, y0], '#463c60');
  box(0, y0, W, H - y0, vgrad(y0, H, [[0, '#3a322c'], [1, '#1e1a16']]));                                          // the forecourt
  const k = Math.min((W * 0.72) / 340, (H * 0.66) / 175);
  drawGarage(W / 2, y0, k / 0.95, false);                                                                          // the bay is empty: the bike is about to fill it
  const p = still ? 1 : Math.min(1, t / ROLL), e = 1 - Math.pow(1 - p, 3);
  const x = -300 + 300 * e, dip = still ? 0 : Math.sin(Math.min(1, Math.max(0, (p - 0.55) / 0.45)) * Math.PI) * 0.035;   // the nose dips as it stops
  at(W / 2, y0, k, () => {
    oval(x, -1, 48, 4, 'rgba(0,0,0,0.4)');
    if (!bike) return;
    const s = 92 / SPRITE_W;
    g.save(); g.imageSmoothingEnabled = false;
    g.translate(x, -3); g.rotate(dip);
    g.drawImage(bike, -46, -SPRITE_H * s + 2, 92, SPRITE_H * s);
    g.restore();
  });
  const a = Math.min(1, Math.max(0, (t - ROLL) / 0.6));
  if (a > 0) { g.globalAlpha = a; label('WELCOME HOME', W / 2, H * 0.1, Math.max(22, Math.round(H / 13)), '#fff6e0', { font: '"Fraunces", Georgia, serif', align: 'center', shadow: '#1b1712' }); g.globalAlpha = 1; }
}
