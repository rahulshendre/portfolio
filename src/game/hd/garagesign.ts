// The huge signs that count the road down to the garage: tall hoardings on steel posts, and a gantry that spans the road just before the shutter. Drawn in local units through at(),
// (0, 0) at ground level in the middle of the structure, like every other prop.
import { at, box, circle, g, glow, label, poly, rrect, stroke, vgrad } from './draw';

const PIXEL = '"Silkscreen", ui-monospace, monospace';
const MONO = '"IBM Plex Mono", ui-monospace, monospace';

/** Pixel-font text, shrunk until it fits `maxW`, optionally with a tube glow. */
function neon(text: string, x: number, y: number, maxW: number, px: number, color: string, glowColor = '') {
  g.font = `400 ${px}px ${PIXEL}`;
  while (px > 5 && g.measureText(text).width > maxW) { px -= 1; g.font = `400 ${px}px ${PIXEL}`; }
  if (glowColor) { g.save(); g.shadowColor = glowColor; g.shadowBlur = 14; label(text, x, y, px, color, { align: 'center', font: PIXEL }); g.restore(); }
  else label(text, x, y, px, color, { align: 'center', font: PIXEL });
}

/** A lamp head on a short arm, throwing a faint cone down the face of the sign. */
function floodlight(x: number, y: number, dir: number, cone: number) {
  stroke([x, y, x + dir * 9, y - 8], '#17130f', 2.2); poly([x + dir * 6, y - 11, x + dir * 16, y - 11, x + dir * 14, y - 5, x + dir * 8, y - 5], '#17130f');
  circle(x + dir * 11, y - 7, 2.4, '#fff2c0'); poly([x + dir * 11, y - 6, x + dir * 11 - cone, y + 46, x + dir * 11 + cone, y + 46], 'rgba(255,236,170,0.1)');
}

/** A hoarding as tall as a four-storey house: SHENDRE in amber pixel letters on a dark board, the distance under it, three floodlights along the top. */
export function drawBillboard(sx: number, sy: number, k: number, label1 = 'SHENDRE', sub = 'GARAGE') {
  if (k < 0.1) return;
  const near = k > 0.3;
  at(sx, sy, k, () => {
    poly([-70, 0, 70, 0, 120, 26, -120, 26], 'rgba(24,18,12,0.2)');                                                            // its shadow on the ground
    for (const x of [-64, 64]) { box(x - 4.5, -222, 9, 222, '#2a2622'); box(x - 4.5, -222, 2.6, 222, '#4a443c'); box(x - 7, -6, 14, 6, '#3a342c'); }   // the steel posts on their footings
    if (near) { stroke([-64, -140, 64, -92], '#2a2622', 2.2); stroke([64, -140, -64, -92], '#2a2622', 2.2); box(-64, -118, 128, 3, '#2a2622'); }       // cross-bracing
    rrect(-112, -232, 224, 100, 5, '#2a2622'); rrect(-108, -228, 216, 92, 3, vgrad(-228, -136, [[0, '#241a14'], [1, '#150f0b']]));
    box(-104, -224, 208, 2, '#e8b923'); box(-104, -140, 208, 2, '#e8b923');                                                     // amber piping top and bottom
    neon(label1, 0, -188, 192, 46, '#ffb23a', '#ff8a2a');
    neon(sub, 0, -157, 192, 16, '#fff0d0');
    if (near) { for (let i = 0; i < 5; i++) circle(-90 + i * 45, -229, 1.6, '#e8b923'); for (const x of [-72, 0, 72]) floodlight(x, -232, x < 0 ? -1 : 1, 18); }
    else glow(0, -182, 150, '#ffc878', 0.18);
  });
}

/** A gantry across the road: two lattice legs, a beam, and a green board hung from it, "SHENDRE GARAGE" and an arrow to the left. */
export function drawGantry(sx: number, sy: number, k: number, label1 = 'SHENDRE', sub = 'GARAGE') {
  if (k < 0.1) return;
  const near = k > 0.25;
  at(sx, sy, k, () => {
    for (const x of [-116, 116]) {
      box(x - 6, -206, 12, 206, '#3a3e44'); box(x - 6, -206, 3, 206, '#6a6f76'); box(x - 10, -8, 20, 8, '#2a2622');
      if (near) for (let y = -196; y < -10; y += 28) stroke([x - 5, y, x + 5, y + 28], '#4a4f56', 1.6);
    }
    box(-124, -214, 248, 14, '#3a3e44'); box(-124, -214, 248, 3, '#7a8088'); box(-124, -201, 248, 2, 'rgba(0,0,0,0.3)');            // the beam
    for (const x of [-70, 70]) stroke([x, -200, x, -190], '#2a2622', 3);                                                          // hangers
    rrect(-98, -192, 196, 70, 4, '#e8e4d8'); rrect(-95, -189, 190, 64, 3, vgrad(-189, -125, [[0, '#0d6a46'], [1, '#094f34']]));     // the board, with its white edge
    neon(`${label1} ${sub}`, 8, -160, 160, 22, '#ffffff');
    poly([-86, -143, -70, -153, -70, -147, -56, -147, -56, -139, -70, -139, -70, -133], '#f6d24a');                                // an arrow pointing left
    label('NEXT LEFT', 14, -134, 11, '#f6d24a', { align: 'center', font: MONO, weight: 700 });
    if (near) for (const x of [-60, 0, 60]) { stroke([x, -214, x, -222], '#17130f', 2.2); poly([x - 7, -222, x + 7, -222, x + 4, -216, x - 4, -216], '#17130f'); circle(x, -217, 1.8, '#fff2c0'); }
  });
}
