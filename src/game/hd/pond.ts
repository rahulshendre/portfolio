// A Bliss roadside pond: a patch of sky in the grass with reeds, lily pads and a few ducks that paddle about, dabble for weed, and stretch their necks at the horn.
import { at, circle, g, hgrad, oval, poly, stroke } from './draw';
import { startled } from './stir';

const clock = () => performance.now() / 1000;
const SH = 'rgba(24,52,12,0.22)';

/** A ring spreading on the water: `a` (0 to 1) is how far it has grown. */
function ring(x: number, y: number, rx: number, ry: number, a: number, alpha = 0.55) {
  g.globalAlpha = Math.max(0, (1 - a) * alpha); g.strokeStyle = '#ffffff'; g.lineWidth = 0.8;
  g.beginPath(); g.ellipse(x, y, rx * (0.3 + a), ry * (0.3 + a), 0, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1;
}

/** A duck afloat, side on, facing right. `dab` tips it head-down with its tail in the air; `s` (0 to 1) is how startled it is by the horn: neck up, wings flicking. */
function duck(x: number, y: number, f: number, ph: number, drake: boolean, dab: number, s: number, t: number) {
  const flick = s > 0.15 ? Math.max(0, Math.sin(t * 24 + ph * 5)) * s : 0, rise = flick * 1.6;
  g.save(); g.translate(x, y); g.scale(f, 1);
  const body = drake ? '#b4b0a2' : '#a8803c', chest = drake ? '#7a4a2a' : '#8a6228', wing = drake ? '#8d897c' : '#7a5a24';
  poly([-8, -5 - rise, -16, -7 - dab * 9 - rise, -9, -2], drake ? '#2a2a2e' : '#7a5a24');                                       // tail, up when dabbling
  oval(0, -4 - rise, 10, 5, body); oval(6, -4 - rise, 5, 4.6, chest); oval(-1.5, -5.4 - rise, 6.6, 3 + flick * 1.4, wing);          // body, breast, folded wing
  if (!drake) { circle(-3, -6 - rise, 0.8, '#5a4018'); circle(1, -4, 0.8, '#5a4018'); circle(-6, -4, 0.7, '#5a4018'); }
  const hx = 10 + dab * 5, hy = -12 + dab * 10 - s * 3.2;
  stroke([6, -7 - rise, hx - 1, hy + 2], drake ? '#1f6a4a' : '#9a7434', 3.2);                                                    // neck
  if (drake) stroke([6.4, -8.6 - rise, hx - 1.4, hy + 3.4], '#f4f2ea', 1.2);                                                     // white collar
  circle(hx, hy, 3.5, drake ? '#1f6a4a' : '#b08a44'); circle(hx + 1.4, hy - 0.8, 0.8, '#f4f2ea'); circle(hx + 1.7, hy - 0.8, 0.45, '#111');
  poly([hx + 2.8, hy - 0.8, hx + 8, hy + 0.4, hx + 2.8, hy + 1.8], drake ? '#e8c020' : '#d09a30');                                  // the bill
  oval(0, -0.6, 11.4, 2.3, 'rgba(116,176,206,0.82)');                                                                         // the water over its belly
  g.restore();
}

function reeds(x: number, y: number, n: number, h: number, t: number, ph: number) {
  for (let i = 0; i < n; i++) {
    const bx = x + (i - n / 2) * 3.2, sw = Math.sin(t * 1.3 + ph + i * 1.7) * 1.6, top = h * (0.7 + ((i * 37 + ph * 11) % 10) / 30);
    stroke([bx, y, bx + sw * 0.5, y - top * 0.5, bx + sw, y - top], '#4e8a34', 1.5);
    if (i % 2 === 0) { stroke([bx + sw, y - top * 0.82, bx + sw, y - top - 1.5], '#6a4228', 3); }                                 // a cattail
  }
}

/** A pond about a hundred and thirty units across: ducks come in twos to fours by `v`. */
export function drawPond(sx: number, sy: number, k: number, v = 0) {
  if (k < 0.16) return;
  const t = clock();
  if (k < 0.3) { at(sx, sy, k, () => { oval(0, 2, 70, 16, '#7f9a4c'); oval(0, 1, 60, 11.5, '#8cc2de'); for (const x of [-22, 6, 28]) circle(x, -3, 3, '#f2eee2'); }); return; }
  at(sx, sy, k, () => {
    oval(0, 3, 72, 17, SH);
    oval(0, 2, 70, 16, '#7f9a4c'); oval(0, 1.6, 66, 14, '#a69a68');                                                        // grass bank and muddy edge
    oval(0, 1, 61, 12, hgrad(-60, 60, [[0, '#6aa6c8'], [0.5, '#a4d4e8'], [1, '#6aa6c8']]));                                  // the water holds the sky
    oval(0, -3, 56, 6.4, 'rgba(36,84,116,0.22)');                                                                           // shade under the far bank
    oval(-16, 0, 20, 2.2, 'rgba(255,255,255,0.4)'); oval(22, 4, 12, 1.5, 'rgba(255,255,255,0.3)');
    for (const [x, y, r] of [[-38, 5, 5.6], [-30, 7, 4.2], [30, -1, 5], [38, 3, 4], [-6, 8, 3.6]] as const) {              // lily pads, one with a flower
      oval(x, y, r, r * 0.42, '#3f8a3a'); oval(x - r * 0.2, y - 0.5, r * 0.6, r * 0.2, '#58a548');
    }
    circle(-30, 6, 1.7, '#ff9ac2'); circle(-30, 5.6, 0.7, '#f8d84a');
    reeds(-52, 4, 5, 28, t, v); reeds(50, 2, 5, 32, t, v + 2); reeds(8, -9, 4, 20, t, v + 5);
    const n = 2 + (v % 3), s0 = startled(v * 0.37);
    for (let i = 0; i < n; i++) {
      const cx = [-24, 4, 26, -2][i], cy = [1, -4, 3, 6][i], r = 9 + (i % 2) * 5, sp = 0.16 + i * 0.05, a = t * sp + v + i * 2.1;
      const x = cx + Math.sin(a) * r, y = cy + Math.cos(a * 0.7) * 1.8, f = Math.cos(a) >= 0 ? 1 : -1;
      const dab = s0 > 0.05 ? 0 : Math.max(0, Math.sin(t * 0.5 + i * 2.3 + v) - 0.62) / 0.38;
      const wake = (t * 0.55 + i * 0.37) % 1;
      ring(x - f * 6, y, 14, 3, wake); if (s0 > 0.2) ring(x, y, 12, 3, (t * 2.4 + i * 0.5) % 1, 0.7 * s0);
      duck(x, y, f, v + i, i % 3 === 0, dab, startled(v * 0.37 + i * 0.21), t);
    }
    reeds(-60, 12, 3, 14, t, v + 7); reeds(58, 13, 3, 12, t, v + 9);                                                         // a few in front, at the near corners
  });
}
