// Bigger pieces of the country: a hillside village, the double-humped camels of the Nubra dunes, a speed-limit sign.
import { at, box, circle, g, label, oval, poly, rrect, stroke } from './draw';
import { flagString } from './flags';

const SH = 'rgba(40,24,10,0.2)';

/** A village stacked up a sunlit hill: whitewashed flat-roofed houses, a stupa on top and a string of flags. */
export function drawVillage(sx: number, sy: number, k: number) {
  if (k < 0.05) return;
  at(sx, sy, k, () => {
    const w = 210, h = 130;
    poly([-w, 0, -w * 0.75, -h * 0.42, -w * 0.35, -h * 0.86, 0.05 * w, -h, w * 0.4, -h * 0.82, w * 0.78, -h * 0.4, w, 0], '#a97b56');
    poly([w * 0.05, -h, w * 0.4, -h * 0.82, w * 0.78, -h * 0.4, w, 0, w * 0.3, -h * 0.1], '#c99a70');
    poly([-w, 0, -w * 0.75, -h * 0.42, -w * 0.35, -h * 0.86, -w * 0.2, -h * 0.4, -w * 0.45, 0], '#7d573c');
    for (const [x, y, bw, bh, tone] of [[-120, -14, 34, 24, 0], [-78, -36, 30, 22, 1], [-36, -58, 34, 24, 0], [4, -76, 30, 22, 2], [44, -62, 34, 24, 1], [84, -38, 30, 22, 0], [120, -16, 34, 24, 2], [-16, -22, 28, 20, 2], [60, -22, 28, 20, 1]] as const) {
      const wall = ['#f0ebe0', '#e8d8c0', '#d8c8a8'][tone];
      box(x - bw / 2, y - bh, bw, bh, wall); box(x - bw / 2 - 1.5, y - bh - 3, bw + 3, 4, '#c8b898');    // wall and its roof edge
      box(x + bw / 2 - 8, y - bh, 8, bh, 'rgba(60,36,20,0.16)');                                        // the shaded end
      box(x - 8, y - bh * 0.7, 6, 8, '#3a4a58'); box(x + 3, y - bh * 0.7, 6, 8, '#3a4a58');
      box(x - bw * 0.2, y - bh - 9, 4, 6, '#3a3a3e');                                                    // a water tank
    }
    box(-6, -h - 18, 12, 18, '#f0eadc'); poly([-9, -h - 18, 0, -h - 34, 9, -h - 18], '#d9a441'); circle(0, -h - 36, 3, '#f4c95a');   // the stupa on top
    flagString(0, -h - 30, -90, -h * 0.55, 10, 1, 0.05); flagString(0, -h - 30, 84, -h * 0.5, 10, 3, 0.05);
  });
}

/** Two Bactrian camels, standing about on the sand. */
export function drawCamel(sx: number, sy: number, k: number, v = 0) {
  if (k < 0.16) return;
  at(sx, sy, k, () => {
    for (const [x, sc, f] of [[-24, 1, 1], [28, 0.85, -1]] as const) {
      g.save(); g.translate(x, 0); g.scale(sc * f, sc);
      oval(0, 0, 32, 4, SH);
      for (const lx of [-16, -10, 10, 16]) stroke([lx, -22, lx + (lx > 0 ? 1 : -1), 0], '#6d4a30', 3.4);      // long legs
      oval(0, -34, 28, 12, '#a07850'); oval(2, -28, 24, 7, '#b48c60');                                          // body
      oval(-10, -50, 8, 12, '#8a6440'); oval(9, -49, 8, 11, '#8a6440');                                          // two humps
      oval(-10, -55, 4, 5, '#a07850'); oval(9, -54, 4, 5, '#a07850');
      poly([20, -40, 26, -40, 34, -68, 28, -70], '#93704a');                                                     // the neck
      oval(34, -72, 8, 5.4, '#93704a'); oval(40, -70, 4.6, 3.4, '#7a5a3a'); circle(36, -74, 0.9, '#1b1712');  // head
      stroke([-26, -38, -31, -22], '#6d4a30', 2.6);                                                              // tail
      stroke([22, -48, 28, -50], '#7a5a3a', 3);                                                                  // a shaggy mane
      g.restore();
    }
  });
}

/** A round speed-limit sign on a post. */
export function drawLimit(sx: number, sy: number, k: number, kmh = 40) {
  if (k < 0.16) return;
  at(sx, sy, k, () => {
    oval(0, 0, 9, 1.6, SH);
    box(-1.8, -74, 3.6, 74, '#5a5048'); box(-1.8, -74, 1.2, 74, '#7a6e64');
    circle(0, -92, 20, '#c8312a'); circle(0, -92, 15, '#f7f5ef');
    label(String(kmh), 0, -86, 19, '#1b1712', { align: 'center', weight: 800 });
    rrect(-22, -62, 44, 12, 3, '#f7f5ef'); label('BRO', 0, -53, 8, '#1b1712', { align: 'center', weight: 700 });
  });
}

/** An orange traffic cone. */
export function drawCone(sx: number, sy: number, k: number) {
  if (k < 0.16) return;
  at(sx, sy, k, () => {
    oval(2, 0, 9, 1.8, SH);
    box(-6, -2.5, 12, 2.5, '#2a2622');
    poly([-5, -2.5, -1.6, -26, 1.6, -26, 5, -2.5], '#ee6a1c'); poly([-3.4, -13, -2.4, -19, 2.4, -19, 3.4, -13], '#f7f5ef');
    poly([1.6, -26, 5, -2.5, 1.6, -2.5], 'rgba(0,0,0,0.16)');
  });
}

/** A BRO road crew at work: hi-vis vests, a steaming tar drum, a shovel and a slow paddle. */
export function drawCrew(sx: number, sy: number, k: number) {
  if (k < 0.16) return;
  const now = performance.now() / 1000;
  at(sx, sy, k, () => {
    oval(0, 0, 52, 5, SH);
    // the tar drum, with smoke
    box(24, -26, 18, 26, '#1d1a17'); box(24, -26, 18, 3, '#3a3530'); box(24, -14, 18, 2, '#3a3530'); oval(33, -26, 9, 2.5, '#0f0d0b');
    for (let i = 0; i < 3; i++) { const p = (now * 0.4 + i / 3) % 1; g.globalAlpha = (1 - p) * 0.3; circle(33 + Math.sin(p * 5 + i) * 4, -30 - p * 34, 4 + p * 8, '#8a8580'); }
    g.globalAlpha = 1;
    // three workers
    for (const [x, pose] of [[-34, 0], [-8, 1], [8, 2]] as const) {
      g.save(); g.translate(x, 0);
      const bend = pose === 1 ? 5 : 0;
      box(-4, -18, 3.4, 18, '#2a3242'); box(0.6, -18, 3.4, 18, '#2a3242'); box(-5, -2, 4.6, 2, '#17130f'); box(0, -2, 4.6, 2, '#17130f');   // legs and boots
      rrect(-6, -36 + bend, 12, 19, 3, '#ee6a1c'); box(-6, -29 + bend, 12, 2.6, '#e8e6d8'); box(-6, -24 + bend, 12, 2, '#e8e6d8');              // the hi-vis vest with reflective bands
      circle(0, -41 + bend, 4.2, '#c8926a'); rrect(-4.8, -46 + bend, 9.6, 4.4, 2, '#f2c318');                                                    // head and hard hat
      if (pose === 0) { stroke([5, -32, 12, -20], '#ee6a1c', 3); stroke([12, -20, 15, 0], '#7a5a3c', 1.6); poly([12, 0, 18, 0, 17, -6, 13, -7], '#8f949c'); }   // shovel
      if (pose === 2) { stroke([5, -33, 12, -46], '#ee6a1c', 3); stroke([12, -46, 12, -58], '#7a5a3c', 1.6); circle(12, -63, 6, '#c8312a'); label('SLOW', 12, -61, 3.6, '#ffffff', { align: 'center', weight: 800 }); }
      if (pose === 1) stroke([5, -28, 10, -16], '#ee6a1c', 3);
      g.restore();
    }
  });
}

/** The summit board at the top of Khardung La. */
export function drawSummit(sx: number, sy: number, k: number) {
  if (k < 0.16) return;
  at(sx, sy, k, () => {
    oval(0, 0, 90, 8, SH);
    poly([-90, 0, -70, -14, -40, -20, -10, -10, 30, -18, 70, -12, 92, 0], '#f2f5f9'); poly([-70, -14, -40, -20, -20, -12, -50, -6], '#dfe8f2');   // a drift of snow round the base
    box(-62, -100, 6, 100, '#5a5048'); box(56, -100, 6, 100, '#5a5048');
    rrect(-76, -146, 152, 78, 6, '#1b1712'); rrect(-72, -142, 144, 70, 4, '#f2c318');
    label('KHARDUNG LA', 0, -114, 19, '#1b1712', { align: 'center', weight: 800 });
    label('5,359 M · 17,582 FT', 0, -96, 11, '#1b1712', { align: 'center', weight: 700 });
    label('BRO · DRIVE SAFE', 0, -80, 8.5, '#3a3020', { align: 'center', weight: 600 });
    box(-76, -68, 152, 3, 'rgba(0,0,0,0.25)');
    flagString(-62, -104, -140, -12, 10, 0, 0.05); flagString(62, -104, 140, -14, 10, 2, 0.05);
  });
}

/** A little camp by the lake: two dome tents and a jeep-side awning, flags on a pole. */
export function drawCamp(sx: number, sy: number, k: number) {
  if (k < 0.16) return;
  at(sx, sy, k, () => {
    oval(0, 0, 80, 6, SH);
    for (const [x, w, h, col, dark] of [[-40, 30, 34, '#e8b923', '#b98f16'], [26, 26, 30, '#ecebe4', '#bfbdb2'], [62, 20, 24, '#d8342b', '#a6231b']] as const) {
      poly([x - w, 0, x - w * 0.55, -h * 0.85, x, -h, x + w * 0.55, -h * 0.85, x + w, 0], col);             // a dome tent, lit on the left
      poly([x, -h, x + w * 0.55, -h * 0.85, x + w, 0, x + w * 0.2, 0], dark);
      poly([x - w * 0.22, 0, x - w * 0.12, -h * 0.55, x + w * 0.12, -h * 0.55, x + w * 0.22, 0], '#2a2622');    // the door flap
      stroke([x - w, 0, x - w - 5, 3], '#5a5048', 1);
    }
    box(-86, -70, 2.6, 70, '#6b4b30'); flagString(-85, -68, -60, -46, 6, 1, 0.08);
  });
}
