// Prayer flags, done properly: strings that sag between real poles, cloth that ripples in the wind and glows in the low sun,
// tall darchog banner poles, and the flag-covered cairns you find at every pass.
import { at, box, circle, g, oval, poly, stroke } from './draw';

/** The traditional order: blue, white, red, green, yellow. */
export const FLAG_COLS = ['#2c6eb0', '#f4f2ea', '#d8342b', '#3c8a48', '#e8b923'];
const hash = (n: number) => Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;

/** A wooden pole with a little spear tip. */
function pole(x: number, h: number) {
  box(x - 1.8, -h, 3.6, h, '#6b4b30'); box(x - 1.8, -h, 1.2, h, '#8f6c46');
  poly([x - 2.4, -h, x, -h - 9, x + 2.4, -h], '#d9a441');
}

/** A string of flags between two points: local units, y up is negative. `sag` is the dip at the middle as a share of the span. */
export function flagString(x1: number, y1: number, x2: number, y2: number, n: number, seed = 0, sag = 0.09) {
  const now = performance.now() / 1000, len = Math.hypot(x2 - x1, y2 - y1), dip = len * sag;
  g.strokeStyle = '#33291f'; g.lineWidth = 1.1; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + dip * 2, x2, y2); g.stroke();
  const w = (len / n) * 0.8;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.55) / (n + 0.1), px = x1 + (x2 - x1) * t, py = y1 + (y2 - y1) * t + dip * 4 * t * (1 - t);
    const h = w * 1.2 * (0.9 + 0.2 * hash(i + seed * 7)), ph = now * 3.4 + i * 0.85 + seed;
    const sway = Math.sin(ph) * w * 0.24 - w * 0.16, curl = Math.sin(ph * 1.7 + 1) * h * 0.07;      // the wind streams them a little to the left
    const col = FLAG_COLS[(i + seed) % 5];
    poly([px - w / 2, py, px + w / 2, py, px + w / 2 + sway * 0.6, py + h * 0.5 + curl, px + w / 2 + sway, py + h, px - w / 2 + sway, py + h + curl * 0.6, px - w / 2 + sway * 0.6, py + h * 0.5], col);
    g.globalAlpha = 0.32; poly([px - w / 2, py, px - w * 0.1, py, px - w * 0.1 + sway, py + h, px - w / 2 + sway, py + h], '#ffffff');       // the cloth glows where the sun comes through
    g.globalAlpha = 0.16; poly([px + w * 0.2, py, px + w / 2, py, px + w / 2 + sway, py + h, px + w * 0.2 + sway, py + h], '#000000'); g.globalAlpha = 1;
    circle(px, py, 0.9, '#33291f');
  }
}

/** Two poles and two strings: the flags you meet at the roadside. */
export function drawFlags(sx: number, sy: number, k: number) {
  if (k < 0.16) return;
  at(sx, sy, k, () => {
    oval(0, 0, 60, 5, 'rgba(40,24,10,0.2)');
    pole(-46, 104); pole(46, 94);
    flagString(-46, -102, 46, -92, 15, 0, 0.09);
    flagString(-46, -84, 46, -76, 14, 2, 0.08);
  });
}

/** The canopy at the top of the pass: poles either side of the road and three strings across it. */
export function drawCanopy(sx: number, sy: number, k: number) {
  if (k < 0.16) return;
  at(sx, sy, k, () => {
    pole(-94, 124); pole(94, 118);
    flagString(-94, -122, 94, -116, 15, 0, 0.1);
    flagString(-94, -102, 94, -98, 15, 2, 0.09);
    flagString(-94, -82, 94, -80, 14, 4, 0.08);
  });
}

/** A darchog: one tall pole with a great banner, and strings running from its top down to the ground. */
export function drawDarchog(sx: number, sy: number, k: number) {
  if (k < 0.16) return;
  const now = performance.now() / 1000;
  at(sx, sy, k, () => {
    oval(0, 0, 22, 3, 'rgba(40,24,10,0.22)');
    poly([-0.6, 0, 0.6, 0, 60, 6, -60, 6], 'rgba(40,24,10,0.12)');
    box(-2.4, -190, 4.8, 190, '#6b4b30'); box(-2.4, -190, 1.6, 190, '#8f6c46');
    poly([-3, -190, 0, -206, 3, -190], '#d9a441'); circle(0, -191, 2.6, '#e8b923');
    for (let i = 0; i < 5; i++) {                                                                  // the banner: five colour blocks, rippling from the pole outward
      const y = -184 + i * 20, w0 = Math.sin(now * 2.6 + i * 0.7) * 3, w1 = Math.sin(now * 2.6 + i * 0.7 + 1) * 3;
      poly([2.4, y, 26 + w0, y + 1, 27 + w1, y + 20, 2.4, y + 20], FLAG_COLS[i]);
      g.globalAlpha = 0.3; poly([2.4, y, 10, y, 11 + w1 * 0.4, y + 20, 2.4, y + 20], '#ffffff'); g.globalAlpha = 1;
    }
    flagString(0, -186, -74, -10, 12, 1, 0.03); flagString(0, -186, 66, -8, 11, 3, 0.03);
  });
}

/** A cairn heaped with stones, a pole in its top and strings of flags flying from it: what every pass has. */
export function drawFlagMound(sx: number, sy: number, k: number) {
  if (k < 0.16) return;
  at(sx, sy, k, () => {
    oval(0, 0, 60, 6, 'rgba(40,24,10,0.25)');
    oval(0, -10, 44, 16, '#8f8a82'); oval(-14, -20, 24, 12, '#a29c92'); oval(14, -22, 22, 12, '#b0aaa0'); oval(2, -32, 16, 9, '#c0bab0'); oval(0, -6, 30, 6, '#7d7870');
    box(-2, -120, 4, 92, '#6b4b30'); poly([-3, -120, 0, -134, 3, -120], '#d9a441');
    for (const [ex, ey, n, sd] of [[-110, -4, 12, 0], [-70, -30, 9, 1], [96, -8, 12, 2], [64, -34, 9, 3]] as const) flagString(0, -118, ex, ey, n, sd, 0.05);
  });
}
