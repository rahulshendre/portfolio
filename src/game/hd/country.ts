// The buildings and landmarks of the Bliss land: thatched and tiled cottages, a red barn, windmills, a village church, a hilltop castle and manor, a wishing well.
// Drawn in the same local unit space and the same low light (the sun is on the right) as the Himalayan ones they stand in for.
import { drawBlossomTree } from './foliage';
import { at, box, circle, g, hgrad, label, oval, poly, rrect, stroke, use, vgrad } from './draw';

export const SH = 'rgba(24,52,12,0.22)';
const hash = (n: number) => Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;
const clock = () => performance.now() / 1000;

const HILLS = new Map<string, HTMLCanvasElement>();
/**
 * A rounded green hill for the landmarks to stand on: shaded across, patchwork fields and hedgerows on its slope, a pale lane winding up the middle.
 * It never changes, so each shape is painted once into a small canvas (at twice the size, so it stays sharp) and stamped from then on.
 */
export function meadowHill(w: number, h: number, seed = 0) {
  const key = `${w}:${h}:${seed}`, R = 2, pad = 4;
  let c = HILLS.get(key);
  if (!c) {
    c = document.createElement('canvas'); c.width = Math.ceil((w * 2 + pad * 2) * R); c.height = Math.ceil((h * 1.2 + pad * 2) * R);
    const ctx = c.getContext('2d'); if (!ctx) return;
    const keep = g; use(ctx); ctx.scale(R, R); ctx.translate(w + pad, h * 1.2 + pad - 2);
    paintHill(w, h, seed);
    use(keep);
    HILLS.set(key, c);
  }
  g.drawImage(c, -w - pad, -(h * 1.2 + pad - 2), c.width / R, c.height / R);
}

function paintHill(w: number, h: number, seed: number) {
  const path = () => { g.beginPath(); g.moveTo(-w, 0); g.bezierCurveTo(-w * 0.62, -h * 1.22, w * 0.62, -h * 1.22, w, 0); g.closePath(); };
  path(); g.fillStyle = hgrad(-w, w, [[0, '#4a8a2e'], [0.5, '#74b43c'], [1, '#9ccd52']]); g.fill();
  g.save(); path(); g.clip();
  for (let i = 0; i < 7; i++) {                                                                                   // fields: tilted strips of slightly different greens and straw
    const y0 = -h * (0.12 + i * 0.13), c = ['rgba(210,190,90,0.22)', 'rgba(40,110,30,0.2)', 'rgba(255,255,255,0.1)', 'rgba(150,200,70,0.22)'][(i + seed) % 4];
    poly([-w, y0 + h * 0.06, w, y0 - h * 0.04, w, y0 - h * 0.11, -w, y0 - h * 0.02], c);
    stroke([-w, y0 + h * 0.06, w, y0 - h * 0.04], 'rgba(30,70,20,0.35)', 1.1);                                       // a hedgerow
  }
  poly([-w * 0.05, 0, w * 0.1, 0, w * 0.02, -h * 0.55, -w * 0.02, -h * 0.55], 'rgba(244,236,200,0.5)');          // the lane
  g.restore();
  path(); g.strokeStyle = 'rgba(220,255,160,0.55)'; g.lineWidth = 1.6; g.stroke();
}

/** A string of little triangular pennants between two points, sagging, fluttering a touch. */
export function bunting(x1: number, y1: number, x2: number, y2: number, n: number, seed = 0, sag = 0.08) {
  const t0 = clock(), len = Math.hypot(x2 - x1, y2 - y1), dip = len * sag, cols = ['#e8503a', '#f4c430', '#4aa0d8', '#f4f2ea', '#58b050', '#e878a8'];
  g.strokeStyle = '#4a3a2a'; g.lineWidth = 1; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + dip * 2, x2, y2); g.stroke();
  const w = (len / n) * 0.78;
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, px = x1 + (x2 - x1) * u, py = y1 + (y2 - y1) * u + dip * 4 * u * (1 - u), sw = Math.sin(t0 * 2.6 + i * 0.9 + seed) * w * 0.12;
    poly([px - w / 2, py, px + w / 2, py, px + sw, py + w * 1.05], cols[(i + seed) % cols.length]);
    g.globalAlpha = 0.22; poly([px, py, px + w / 2, py, px + sw, py + w * 1.05], '#000'); g.globalAlpha = 1;
  }
}

/** Smoke from a chimney, curling up and away. */
function smoke(x: number, y: number, a = 0.34) {
  const t = clock();
  for (let i = 0; i < 4; i++) { const p = (t * 0.22 + i / 4) % 1; g.globalAlpha = (1 - p) * a; circle(x + Math.sin(p * 4 + i) * 4 + p * 8, y - p * 46, 3 + p * 8, '#f2f0ec'); }
  g.globalAlpha = 1;
}

/** A window: frame, glass with a streak of sky, a cross of bars, optional shutters and a box of flowers. */
function win(x: number, y: number, w: number, h: number, o: { shutter?: string; flowers?: boolean; lit?: boolean; frame?: string } = {}) {
  const f = o.frame ?? '#f6f1e6';
  if (o.shutter) { box(x - w * 0.42, y, w * 0.4, h, o.shutter); box(x + w * 1.02, y, w * 0.4, h, o.shutter); for (let i = 1; i < 5; i++) { box(x - w * 0.42, y + (h / 5) * i, w * 0.4, 0.8, 'rgba(0,0,0,0.25)'); box(x + w * 1.02, y + (h / 5) * i, w * 0.4, 0.8, 'rgba(0,0,0,0.25)'); } }
  box(x - 1.5, y - 1.5, w + 3, h + 3, f);
  box(x, y, w, h, o.lit ? vgrad(y, y + h, [[0, '#ffe29a'], [1, '#ffb860']]) : vgrad(y, y + h, [[0, '#8fb4d4'], [1, '#4f6f8f']]));
  if (!o.lit) poly([x, y + h * 0.5, x + w * 0.5, y, x + w * 0.8, y, x, y + h * 0.75], 'rgba(255,255,255,0.28)');
  box(x + w / 2 - 0.7, y, 1.4, h, f); box(x, y + h / 2 - 0.7, w, 1.4, f);
  if (o.flowers) { box(x - 2, y + h, w + 4, 4, '#7a4a2e'); for (let i = 0; i < 5; i++) circle(x + 1 + (i * (w - 2)) / 4, y + h - 1, 2.2, ['#e8503a', '#f4c430', '#ff9ac2', '#ffffff', '#e8503a'][i]); for (let i = 0; i < 5; i++) circle(x + 1 + (i * (w - 2)) / 4 + 1, y + h + 1, 1.6, '#4a8a34'); }
}

/** An arched wooden door with a step. */
function door(x: number, y: number, w: number, h: number, col: string) {
  box(x - 2, y - h - 2, w + 4, h + 2, '#f0e8d4'); oval(x + w / 2, y - h, w / 2 + 2, w / 2 + 2, '#f0e8d4');
  box(x, y - h, w, h, col); oval(x + w / 2, y - h, w / 2, w / 2, col);
  box(x + w / 2 - 0.6, y - h - w / 2, 1.2, h + w / 2, 'rgba(0,0,0,0.22)');
  circle(x + w * 0.78, y - h * 0.45, 1.3, '#e8c060');
  box(x - 3, y - 2, w + 6, 2, '#a8a090');
}

/** A hip roof seen from the front, with its rows of tiles (or thatch) and a lit right-hand slope. */
function roof(x0: number, x1: number, yEave: number, yRidge: number, inset: number, col: string, lit: string, o: { thatch?: boolean; ridge?: string } = {}) {
  poly([x0, yEave, x1, yEave, x1 - inset, yRidge, x0 + inset, yRidge], col);
  poly([(x0 + x1) / 2, yEave, x1, yEave, x1 - inset, yRidge, (x0 + x1) / 2, yRidge], lit);
  const rows = Math.max(3, Math.round((yEave - yRidge) / 4.2));
  for (let r = 1; r < rows; r++) {
    const u = r / rows, y = yRidge + (yEave - yRidge) * u, xl = x0 + inset * (1 - u), xr = x1 - inset * (1 - u);
    g.globalAlpha = o.thatch ? 0.12 : 0.22; stroke([xl, y, xr, y], '#000', 0.8); g.globalAlpha = 1;
    if (!o.thatch) for (let x = xl + ((r % 2) * 3.5); x < xr; x += 7) { g.globalAlpha = 0.1; stroke([x, y, x, y + (yEave - yRidge) / rows], '#000', 0.6); g.globalAlpha = 1; }
  }
  if (o.thatch) { for (let x = x0; x < x1; x += 4) box(x, yEave - 1, 3, 3 + hash(x) * 2.5, col); }   // the ragged eave of the thatch
  box(x0 + inset - 1, yRidge - 3, x1 - x0 - inset * 2 + 2, 3, o.ridge ?? lit);
}

interface Cottage { wall: string; lit: string; roof: string; roofLit: string; shutter: string; doorCol: string; kind: 'plain' | 'thatch' | 'tudor' | 'inn' }
const COTTAGES: Cottage[] = [
  { wall: '#f6efe0', lit: '#fffaf0', roof: '#bd4f36', roofLit: '#dd6b4a', shutter: '#4f8a4f', doorCol: '#3c6e8e', kind: 'plain' },
  { wall: '#d8c294', lit: '#ead8aa', roof: '#b99a50', roofLit: '#d8bc6a', shutter: '#3c6e8e', doorCol: '#8a3a2e', kind: 'thatch' },
  { wall: '#f2e8cc', lit: '#fbf3dc', roof: '#7a4636', roofLit: '#9a5c46', shutter: '#3b2a20', doorCol: '#3b2a20', kind: 'tudor' },
  { wall: '#b4553f', lit: '#cc6a52', roof: '#56626e', roofLit: '#74828f', shutter: '#f0e8d4', doorCol: '#2f4a3a', kind: 'inn' },
];

/** A country cottage: whitewashed with clay tiles, honey stone under thatch, a half-timbered one, or a brick inn with a hanging sign. */
export function drawCottage(sx: number, sy: number, k: number, v = 0) {
  const s = k * 0.95;
  if (s < 0.16) return;
  const P = COTTAGES[v % COTTAGES.length];
  at(sx, sy, s, () => {
    oval(0, 0, 42, 5, SH); poly([-30, 0, 30, 0, -76, 24, -110, 24], 'rgba(24,52,12,0.12)');
    box(-31, -46, 62, 46, P.wall); box(10, -46, 21, 46, P.lit); box(-31, -6, 62, 6, '#a29a8a');                       // walls, the lit end, a stone footing
    if (P.kind === 'tudor') {                                                                                              // black timber framing over cream plaster
      for (const x of [-31, -10, 10, 29]) box(x - 1.3, -46, 2.6, 40, P.shutter);
      box(-31, -46, 62, 2.4, P.shutter); box(-31, -28, 62, 2.2, P.shutter); box(-31, -8, 62, 2.2, P.shutter);
      stroke([-31, -28, -10, -46], P.shutter, 2); stroke([31, -28, 10, -46], P.shutter, 2);
    }
    if (P.kind === 'inn') for (let r = 0; r < 9; r++) for (let c = 0; c < 8; c++) box(-31 + c * 8 + (r % 2) * 4, -45 + r * 5, 7, 0.7, 'rgba(0,0,0,0.18)');   // brick courses
    roof(-41, 41, -44, P.kind === 'thatch' ? -84 : -76, P.kind === 'thatch' ? 18 : 15, P.roof, P.roofLit, { thatch: P.kind === 'thatch' });
    const cx = P.kind === 'thatch' ? -20 : 17;
    box(cx, -94, 10, 22, '#9a5a46'); box(cx - 1.5, -96, 13, 3.5, '#6a3a2e'); box(cx, -94, 3, 22, 'rgba(255,255,255,0.14)');   // the chimney, and its smoke
    smoke(cx + 5, -98);
    win(-24, -36, 13, 15, { shutter: P.kind === 'inn' ? undefined : P.shutter, flowers: P.kind !== 'inn', lit: P.kind === 'inn' });
    win(11, -36, 13, 15, { shutter: P.kind === 'inn' ? undefined : P.shutter, flowers: P.kind !== 'inn', lit: P.kind === 'inn' });
    if (P.kind !== 'thatch') win(-6, -66, 12, 11, { frame: '#f6f1e6' });
    door(-6, -6, 12, 26, P.doorCol);
    if (P.kind === 'inn') {                                                                                                // a hanging sign on an iron arm
      stroke([31, -44, 52, -44], '#2a2420', 2); rrect(40, -42, 20, 16, 2, '#f0e0a0'); circle(50, -34, 5, '#b4553f'); box(46, -37, 8, 1.6, '#fff'); box(44, -43, 1.2, 3, '#2a2420'); box(56, -43, 1.2, 3, '#2a2420');
    } else {
      for (let x = -52; x < 52; x += 7) { if (Math.abs(x) < 36) continue; box(x, -12, 4, 12, '#f6f1e6'); poly([x, -12, x + 2, -16, x + 4, -12], '#f6f1e6'); }     // picket fence either side
      for (const [fx, c] of [[-44, '#e8503a'], [-38, '#f4c430'], [40, '#ff9ac2'], [46, '#ffffff']] as const) { stroke([fx, 0, fx, -8], '#3f7a2a', 1.4); circle(fx, -9, 2.6, c); }
    }
  });
}

/** A red barn with white-braced double doors and a hayloft, and a silo beside it. */
export function drawBarn(sx: number, sy: number, k: number) {
  if (k < 0.16) return;
  at(sx, sy, k * 0.9, () => {
    oval(0, 0, 76, 7, SH);
    box(40, -78, 22, 78, hgrad(40, 62, [[0, '#c8c4bc'], [0.5, '#ece8e0'], [1, '#aaa69e']])); oval(51, -78, 11, 5, '#d8d4cc');   // the silo and its dome
    poly([40, -78, 62, -78, 56, -92, 46, -92], '#9a9690');
    box(-58, -56, 100, 56, '#a63a2c'); box(10, -56, 32, 56, '#c04a38'); box(-58, -6, 100, 6, '#8a2e22');
    for (let x = -56; x < 42; x += 6) box(x, -56, 0.8, 50, 'rgba(0,0,0,0.12)');                                          // boards
    poly([-64, -56, 48, -56, 34, -92, -50, -92], '#7a8590'); poly([-7, -56, 48, -56, 34, -92, -7, -92], '#98a4b0');      // the gambrel roof
    for (let r = 0; r < 5; r++) stroke([-62 + r * 3, -58 - r * 7, 46 - r * 3, -58 - r * 7], 'rgba(0,0,0,0.18)', 0.8);
    box(-14, -34, 38, 34, '#8a2e22'); box(-12, -32, 17, 32, '#c04a38'); box(6, -32, 17, 32, '#c04a38');                    // the big doors
    for (const x of [-12, 6]) { box(x, -32, 17, 2, '#f6f1e6'); box(x, -2, 17, 2, '#f6f1e6'); stroke([x, -32, x + 17, -2], '#f6f1e6', 2.2); stroke([x + 17, -32, x, -2], '#f6f1e6', 2.2); }
    box(-14, -36, 38, 2.4, '#f6f1e6'); box(-14, -36, 2.4, 36, '#f6f1e6'); box(22, -36, 2.4, 36, '#f6f1e6');
    box(-8, -80, 22, 16, '#2a1a14'); box(-8, -80, 22, 2, '#f6f1e6'); stroke([-8, -64, 14, -80], '#f6f1e6', 1.6);            // the hayloft hatch
    for (let i = 0; i < 4; i++) stroke([-6 + i * 5, -64, -4 + i * 5 + (i % 2) * 3, -58], '#d8b860', 1.6);                   // hay poking out
    box(-52, -20, 22, 20, '#f4c430'); box(-50, -18, 18, 16, '#d8a820');                                                      // a stack of bales
  });
}

/** A Dutch windmill: a tapering white tower on a brick footing, a thatched cap and four turning sails. */
export function drawWindmill(sx: number, sy: number, k: number, big = false) {
  if (k < 0.05) return;
  at(sx, sy, k, () => {
    if (big) meadowHill(190, 84, 1);
    oval(0, big ? -10 : 0, 52, 6, SH);
    const base = big ? -62 : 0;
    poly([-34, base, 34, base, 22, base - 150, -22, base - 150], hgrad(-34, 34, [[0, '#d8d2c4'], [0.55, '#f8f4ea'], [1, '#c4bdae']]));   // the tower
    poly([-36, base, 36, base, 33, base - 22, -33, base - 22], '#a25a44');                                                              // brick footing
    for (let r = 0; r < 3; r++) stroke([-34 + r, base - 6 - r * 6, 34 - r, base - 6 - r * 6], 'rgba(0,0,0,0.18)', 0.8);
    box(-8, base - 44, 16, 34, '#6a4a34'); oval(0, base - 44, 8, 7, '#6a4a34');                                                         // the door
    win(-6, base - 100, 12, 14);
    poly([-26, base - 150, 26, base - 150, 14, base - 172, -14, base - 172], '#b99a50'); poly([0, base - 150, 26, base - 150, 14, base - 172, 0, base - 172], '#d8bc6a');   // the thatched cap
    const hubY = base - 160, a0 = clock() * 0.5;
    g.save(); g.translate(0, hubY);
    for (let i = 0; i < 4; i++) {                                                                                                    // sails: a spar with a latticed blade
      g.save(); g.rotate(a0 + (i * Math.PI) / 2);
      box(-1.6, -92, 3.2, 92, '#5a4030');
      for (let q = 0; q < 6; q++) { box(2, -86 + q * 12, 17, 9, 'rgba(250,244,230,0.92)'); box(2, -86 + q * 12, 17, 1, '#7a6048'); }
      box(2, -88, 1.6, 82, '#7a6048'); box(18, -88, 1.6, 82, '#7a6048');
      g.restore();
    }
    circle(0, 0, 6, '#4a3424'); circle(0, 0, 2.4, '#d8bc6a');
    g.restore();
  });
}

/** A village church with a square tower, a slender spire and a weathercock, stone-built on a green hill. */
export function drawChurch(sx: number, sy: number, k: number) {
  if (k < 0.05) return;
  at(sx, sy, k, () => {
    meadowHill(230, 124, 2);
    for (const [x, y, sc] of [[-150, -8, 1], [-120, -12, 0.8], [140, -10, 0.9], [168, -6, 1.1]] as const) { box(x - 3, y - 36 * sc, 6 * sc, 36 * sc, '#5a4030'); oval(x, y - 54 * sc, 22 * sc, 26 * sc, '#3f7a2a'); oval(x + 6 * sc, y - 60 * sc, 14 * sc, 16 * sc, '#6aaa44'); }
    const base = -92;
    box(-86, base - 60, 104, 60, '#b4aa98'); box(-10, base - 60, 28, 60, '#cfc6b4'); box(-90, base - 64, 112, 6, '#8e8574');   // the nave
    poly([-96, base - 62, 28, base - 62, 14, base - 100, -82, base - 100], '#6a5a52'); poly([-30, base - 62, 28, base - 62, 14, base - 100, -30, base - 100], '#82726a');
    for (const x of [-70, -44, -18]) { rrect(x, base - 52, 11, 30, 5, '#2f4a6a'); rrect(x + 2, base - 50, 7, 26, 3, '#7a9ec0'); }   // tall arched windows
    box(34, base - 150, 54, 150, hgrad(34, 88, [[0, '#b4aa98'], [0.6, '#d4cbb8'], [1, '#a29886']]));                       // the tower
    for (const y of [-40, -80, -120]) box(34, base + y, 54, 2.4, '#8e8574');
    rrect(51, base - 40, 20, 40, 10, '#4a3224'); rrect(54, base - 36, 14, 36, 7, '#6a4a34');                             // the great door
    circle(61, base - 112, 12, '#f4f0e4'); circle(61, base - 112, 10, '#ffffff'); stroke([61, base - 112, 61, base - 119], '#2a2420', 1.4); stroke([61, base - 112, 66, base - 110], '#2a2420', 1.4);   // a clock
    rrect(54, base - 142, 14, 18, 7, '#2a2420'); box(30, base - 152, 62, 5, '#8e8574');                                  // the belfry louvre and its cornice
    poly([34, base - 152, 88, base - 152, 61, base - 244], '#5a6a72'); poly([61, base - 152, 88, base - 152, 61, base - 244], '#74868e');   // the spire
    stroke([61, base - 244, 61, base - 262], '#2a2420', 1.6); poly([54, base - 262, 68, base - 262, 61, base - 266], '#e8c060');   // a weathercock
    stroke([61, base - 258, 72, base - 258], '#2a2420', 1.4);
  });
}

/** A hilltop castle: a curtain wall with battlements, round towers under pointed roofs with pennants, a keep and a gatehouse. */
export function drawCastle(sx: number, sy: number, k: number) {
  if (k < 0.05) return;
  at(sx, sy, k, () => {
    meadowHill(250, 142, 3);
    const wall = hgrad(-120, 120, [[0, '#968c7c'], [0.55, '#c0b6a2'], [1, '#a29886']]), t0 = clock();
    box(-120, -170, 240, 80, wall);                                                                                       // the curtain wall
    for (let x = -120; x < 118; x += 16) { box(x, -184, 10, 14, '#b0a692'); box(x + 3, -184, 4, 14, 'rgba(0,0,0,0.12)'); }   // battlements
    box(-120, -172, 240, 3, '#8a8070');
    for (const x of [-80, -30, 40, 90]) { box(x, -150, 5, 14, '#2a2420'); box(x - 1, -148, 7, 4, '#2a2420'); }                // arrow slits
    box(-34, -250, 68, 160, hgrad(-34, 34, [[0, '#968c7c'], [0.55, '#c8bea8'], [1, '#a29886']]));                              // the keep behind
    for (let x = -34; x < 32; x += 14) box(x, -262, 9, 13, '#b0a692');
    rrect(-12, -208, 24, 36, 12, '#2a2420'); for (let i = 0; i < 5; i++) box(-10 + i * 5, -200, 1, 28, '#6a5a4a');           // the gate and portcullis
    for (const x of [-120, 120]) {                                                                                         // two round towers
      box(x - 26, -230, 52, 140, hgrad(x - 26, x + 26, [[0, '#8a8070'], [0.5, '#cbc1ac'], [1, '#948a78']]));
      poly([x - 34, -230, x + 34, -230, x, -300], '#9a3a30'); poly([x, -230, x + 34, -230, x, -300], '#b84a3e');             // the conical roof
      stroke([x, -300, x, -326], '#4a3a2a', 1.6);
      const wv = Math.sin(t0 * 3 + x) * 2; poly([x, -324, x + 24 + wv, -320, x + 22 + wv, -314, x, -312], x < 0 ? '#e8503a' : '#4aa0d8');   // pennants
      rrect(x - 4, -200, 8, 18, 4, '#2a2420');
    }
    box(-134, -168, 28, 3, '#8a8070'); box(106, -168, 28, 3, '#8a8070');
  });
}

/** A grand manor house on a rise: brick, white stone dressings, a pediment, rows of tall windows, chimney stacks. */
export function drawManor(sx: number, sy: number, k: number) {
  if (k < 0.05) return;
  at(sx, sy, k, () => {
    meadowHill(220, 112, 0);
    for (const x of [-170, 170]) { box(x - 3, -64, 6, 60, '#5a4030'); oval(x, -92, 26, 34, '#3f7a2a'); oval(x + 8, -98, 16, 22, '#6aaa44'); }
    const base = -88;
    box(-96, base - 100, 192, 100, hgrad(-96, 96, [[0, '#9a4a38'], [0.55, '#b85c46'], [1, '#a04c3a']]));                     // the main block
    for (let r = 0; r < 20; r++) box(-96, base - 100 + r * 5, 192, 0.7, 'rgba(0,0,0,0.14)');
    poly([-104, base - 100, 104, base - 100, 80, base - 140, -80, base - 140], '#4e5a66'); poly([0, base - 100, 104, base - 100, 80, base - 140, 0, base - 140], '#6a7886');   // slate roof
    poly([-30, base - 100, 30, base - 100, 0, base - 124], '#f2ece0');                                                         // the pediment
    for (const x of [-60, -18, 18, 60]) { box(x - 6, base - 168, 12, 30, '#8a4a38'); box(x - 8, base - 170, 16, 4, '#5a2e22'); }  // chimney stacks
    for (const x of [-72, 56]) { poly([x, base - 112, x + 16, base - 112, x + 14, base - 128, x + 2, base - 128], '#4e5a66'); win(x + 3, base - 124, 10, 10); }
    for (let row = 0; row < 3; row++) for (const x of [-80, -56, -32, 16, 40, 64]) win(x, base - 86 + row * 30 + (row === 2 ? 4 : 0), 14, 18);
    box(-14, base - 36, 28, 36, '#f2ece0'); rrect(-9, base - 30, 18, 30, 9, '#2f4a3a'); poly([-20, base - 36, 20, base - 36, 0, base - 48], '#f2ece0');   // the front door and porch
    for (let i = 0; i < 5; i++) box(-24 + i * 0, base + i * 2, 48 + i * 5, 2, '#d8d2c4');                                      // steps
    box(-100, base - 4, 200, 4, '#d8d2c4');
  });
}

/** A round stone folly tower on a hill, battlemented, with a flag. */
export function drawFolly(sx: number, sy: number, k: number) {
  if (k < 0.05) return;
  at(sx, sy, k, () => {
    meadowHill(200, 122, 1);
    for (const [x, sc] of [[-110, 1], [96, 0.9], [130, 0.7]] as const) { box(x - 3, -20 - 30 * sc, 6, 30 * sc, '#5a4030'); oval(x, -64 * sc - 10, 24 * sc, 28 * sc, '#3f7a2a'); oval(x + 6 * sc, -70 * sc - 10, 14 * sc, 18 * sc, '#6aaa44'); }
    const base = -118;
    box(-34, base - 130, 68, 130, hgrad(-34, 34, [[0, '#8a8070'], [0.55, '#cbc1ac'], [1, '#948a78']]));
    for (let y = 0; y < 130; y += 12) stroke([-34, base - y, 34, base - y], 'rgba(0,0,0,0.14)', 0.8);
    box(-42, base - 142, 84, 14, '#a29886'); for (let x = -42; x < 40; x += 16) box(x, base - 156, 10, 14, '#a29886');
    rrect(-8, base - 28, 16, 28, 8, '#3a2a20'); rrect(-5, base - 100, 10, 18, 5, '#2a2420');
    stroke([0, base - 156, 0, base - 190], '#4a3a2a', 1.8); const wv = Math.sin(clock() * 3) * 2; poly([0, base - 190, 26 + wv, base - 184, 0, base - 176], '#e8503a');
  });
}

/** A hamlet on a green rise: a dozen cottages with red roofs, a church spire, trees, smoke from the chimneys. */
export function drawHamlet(sx: number, sy: number, k: number) {
  if (k < 0.05) return;
  at(sx, sy, k, () => {
    const w = 210, h = 120;
    meadowHill(w, h, 2);
    for (const [x, y, sc] of [[-150, -6, 1], [160, -4, 1.1], [-40, -6, 0.8], [96, -8, 0.9]] as const) { box(x - 2, y - 22 * sc, 4, 22 * sc, '#5a4030'); oval(x, y - 36 * sc, 16 * sc, 18 * sc, '#3f7a2a'); oval(x + 5 * sc, y - 40 * sc, 9 * sc, 11 * sc, '#6aaa44'); }
    for (const [x, y, bw, bh, i] of [[-120, -12, 30, 20, 0], [-80, -32, 28, 18, 1], [-38, -54, 30, 20, 2], [44, -62, 30, 20, 0], [86, -36, 28, 18, 3], [124, -14, 30, 20, 1], [-14, -18, 26, 18, 2], [60, -20, 26, 18, 0]] as const) {
      const P = COTTAGES[i];
      box(x - bw / 2, y - bh, bw, bh, P.wall); box(x + bw / 6, y - bh, bw / 3, bh, P.lit);
      poly([x - bw / 2 - 4, y - bh, x + bw / 2 + 4, y - bh, x + bw / 2 - 4, y - bh - 14, x - bw / 2 + 4, y - bh - 14], P.roof); poly([x, y - bh, x + bw / 2 + 4, y - bh, x + bw / 2 - 4, y - bh - 14, x, y - bh - 14], P.roofLit);
      box(x - 3, y - bh * 0.6, 6, bh * 0.6, P.doorCol); box(x + bw * 0.22, y - bh * 0.78, 5, 5, '#6c8fb0');
    }
    smoke(-80, -52, 0.22); smoke(124, -34, 0.22);
    box(-6, -h - 20, 12, 20, '#cfc6b4'); poly([-8, -h - 20, 0, -h - 46, 8, -h - 20], '#5a6a72'); stroke([0, -h - 46, 0, -h - 54], '#2a2420', 1.2);    // the church spire
  });
}

/** A stone wishing well with a little tiled roof, a bucket on a rope and flowers round the foot. */
export function drawWell(sx: number, sy: number, k: number) {
  const s = k * 0.95;
  if (s < 0.16) return;
  at(sx, sy, s, () => {
    oval(0, 0, 28, 4, SH);
    box(-20, -26, 40, 26, hgrad(-20, 20, [[0, '#948a78'], [0.55, '#c8bea8'], [1, '#a29886']]));
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) box(-20 + c * 8 + (r % 2) * 4, -24 + r * 6.5, 7, 0.8, 'rgba(0,0,0,0.2)');
    oval(0, -26, 20, 5, '#5a5448'); oval(0, -26, 17, 3.6, '#1c2a30');
    box(-19, -60, 3.6, 36, '#5a4030'); box(15.4, -60, 3.6, 36, '#5a4030'); box(-20, -62, 40, 3, '#6a4a34');
    poly([-28, -60, 28, -60, 16, -82, -16, -82], '#bd4f36'); poly([0, -60, 28, -60, 16, -82, 0, -82], '#dd6b4a');
    stroke([0, -62, 0, -38], '#3a2a20', 1); box(-4, -42, 8, 7, '#7a5a3c');
    for (const [x, c] of [[-24, '#e8503a'], [-28, '#f4c430'], [26, '#ff9ac2'], [30, '#ffffff']] as const) { stroke([x, 0, x, -8], '#3f7a2a', 1.4); circle(x, -9, 2.4, c); }
  });
}

/** A round haystack, thatched with a dark cap, a pitchfork leaning in it. */
export function drawHaystack(sx: number, sy: number, k: number) {
  const s = k * 0.9;
  if (s < 0.16) return;
  at(sx, sy, s, () => {
    oval(0, 0, 44, 5, SH);
    for (const [x, sc] of [[-26, 0.78], [26, 0.9]] as const) {
      g.save(); g.translate(x, 0); g.scale(sc, sc);
      poly([-26, 0, -22, -34, -8, -56, 8, -56, 22, -34, 26, 0], hgrad(-26, 26, [[0, '#b8963e'], [0.55, '#e8c860'], [1, '#c8a64a']]));
      for (let i = 0; i < 9; i++) stroke([-22 + i * 5.5, -4, -18 + i * 4.2, -48], 'rgba(120,80,20,0.25)', 0.8);
      poly([-12, -56, 12, -56, 0, -68], '#8a6a30');
      g.restore();
    }
    box(-3, -70, 1.6, 70, '#6a4a30'); stroke([-3, -70, -3, -76], '#6a4a30', 1.4);
    for (const dx of [-5.5, -3, -0.5]) stroke([dx, -70, dx, -58], '#9aa0a8', 1);
  });
}

/** A scarecrow on a post in a field of corn, a crow on his arm. */
export function drawScarecrow(sx: number, sy: number, k: number) {
  const s = k * 0.95;
  if (s < 0.16) return;
  const sway = Math.sin(clock() * 1.6) * 1.4;
  at(sx, sy, s, () => {
    oval(0, 0, 26, 3.4, SH);
    for (const [x, h] of [[-26, 30], [-16, 36], [18, 34], [28, 28], [-34, 24], [36, 26]] as const) { stroke([x, 0, x, -h], '#9a8a30', 1.6); poly([x, -h, x - 3, -h - 9, x + 3, -h - 9], '#d8bc50'); }   // corn
    box(-1.8, -82, 3.6, 82, '#6a4a30'); box(-30, -64, 60, 3.4, '#6a4a30');
    poly([-12, -64, 12, -64, 14, -34, -14, -34], '#b8503a'); poly([0, -64, 12, -64, 14, -34, 0, -34], '#d8685a');          // a ragged red shirt
    for (const x of [-12, -4, 4, 12]) stroke([x, -34, x + sway * 0.4, -26], '#d8bc50', 1.6);
    for (const sgn of [-1, 1]) { stroke([sgn * 12, -62, sgn * 30, -62], '#b8503a', 5); for (let i = 0; i < 3; i++) stroke([sgn * (30 + i), -62, sgn * (34 + i), -58 + i * 2], '#d8bc50', 1.4); }
    circle(0, -74, 9, '#d8bc90'); circle(-3, -75, 1.2, '#2a2420'); circle(3, -75, 1.2, '#2a2420'); stroke([-3, -70, 3, -70], '#2a2420', 1);
    poly([-16, -80, 16, -80, 8, -84, 7, -96, -7, -96, -8, -84], '#6a4a30'); box(-16, -82, 32, 3, '#4a3020');                  // a battered hat
    poly([24, -66, 30, -72, 33, -66], '#1a1a22'); oval(28, -70, 5, 3, '#1a1a22'); circle(32, -71, 2, '#1a1a22'); poly([34, -71, 37, -70, 34, -69], '#e8a020');   // the crow
  });
}

/** A cherry tree in full blossom, petals drifting down. */
export function drawBlossom(sx: number, sy: number, k: number, v = 0) {
  const s = k * (0.9 + (v % 3) * 0.08);
  if (s < 0.14) return;
  drawBlossomTree(sx, sy, s, v * 3 + 2);                                                         // the tree itself is painted once and cached; only the petals drifting down are live
  const t = clock();
  at(sx, sy, s, () => {
    for (let i = 0; i < 7; i++) { const p = (t * 0.18 + hash(i + v)) % 1; g.globalAlpha = 1 - p; circle(-30 + hash(i * 2 + v) * 60 + Math.sin(p * 6 + i) * 8, -48 + p * 50, 1.8, '#f8c0d4'); }
    g.globalAlpha = 1;
  });
}

/** A wooden archway over the road at the top of the climb, hung with pennants and baskets of flowers. */
export function drawArch(sx: number, sy: number, k: number) {
  if (k < 0.16) return;
  at(sx, sy, k, () => {
    for (const x of [-110, 110]) { box(x - 5, -150, 10, 150, '#6a4a34'); box(x - 5, -150, 3, 150, '#8a6a4e'); box(x - 8, -8, 16, 8, '#7a7468'); }
    poly([-118, -150, 118, -150, 110, -166, -110, -166], '#7a5640'); box(-118, -154, 236, 4, '#9a7254');
    rrect(-60, -148, 120, 22, 3, '#f0e4c0'); box(-60, -148, 120, 2, '#c8a860'); label('HIGH PASTURE', 0, -132, 12, '#5a3a24', { align: 'center', weight: 800 });
    bunting(-110, -166, -8, -176, 8, 0, 0.07); bunting(110, -166, 8, -176, 8, 3, 0.07);
    for (const x of [-92, 92]) { stroke([x, -150, x, -132], '#4a3a2a', 1); circle(x, -122, 11, '#7a5640'); for (let i = 0; i < 5; i++) circle(x - 8 + i * 4, -127 + (i % 2) * 3, 4, ['#e8503a', '#f4c430', '#ff9ac2', '#ffffff', '#e8503a'][i]); }
  });
}

/** A low drystone wall, mossy, with grass and flowers along its top. */
export function drawStoneWall(sx: number, sy: number, k: number) {
  if (k < 0.16) return;
  at(sx, sy, k * 0.9, () => {
    oval(0, 0, 54, 4, SH);
    box(-48, -26, 96, 26, hgrad(-48, 48, [[0, '#8e8574'], [0.55, '#bcb29e'], [1, '#9a907e']]));
    for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) { const w = 10 + hash(r * 9 + c) * 4; box(-47 + c * 12 + (r % 2) * 6, -24 + r * 6.4, w, 5.6, hash(r + c * 3) > 0.5 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'); }
    for (let i = 0; i < 12; i++) oval(-44 + i * 8 + hash(i) * 3, -27, 4.5, 3, '#5a9a38');
    for (const [x, c] of [[-30, '#f4c430'], [-6, '#ffffff'], [22, '#ff9ac2'], [38, '#e8503a']] as const) { stroke([x, -27, x, -34], '#3f7a2a', 1.2); circle(x, -35, 2.2, c); }
  });
}

/** A signboard on two posts: the top of the pass in the Bliss land. */
export function drawSignpost(sx: number, sy: number, k: number) {
  if (k < 0.16) return;
  at(sx, sy, k, () => {
    oval(0, 0, 72, 7, SH);
    for (const x of [-52, 52]) { box(x - 4, -110, 8, 110, '#6a4a34'); box(x - 4, -110, 2.6, 110, '#8a6a4e'); }
    rrect(-70, -138, 140, 60, 6, '#8a6244'); rrect(-66, -134, 132, 52, 4, '#f0e4c0');
    label('HIGH PASTURE', 0, -112, 17, '#5a3a24', { align: 'center', weight: 800 });
    label('5,359 M · YOU MADE IT', 0, -94, 9.5, '#7a5a3a', { align: 'center', weight: 700 });
    label('MIND THE SHEEP', 0, -83, 7.5, '#9a7a56', { align: 'center', weight: 600 });
    bunting(-70, -128, -130, -34, 8, 1, 0.07); bunting(70, -128, 130, -34, 8, 4, 0.07);
    for (const [x, c] of [[-62, '#f4c430'], [-72, '#ffffff'], [64, '#ff9ac2'], [74, '#e8503a']] as const) { stroke([x, 0, x, -10], '#3f7a2a', 1.6); circle(x, -12, 3, c); }
  });
}

/** A picnic by the lake: a check blanket, a basket, a parasol, two folding chairs. */
export function drawPicnic(sx: number, sy: number, k: number) {
  if (k < 0.16) return;
  at(sx, sy, k, () => {
    oval(0, 0, 80, 6, SH);
    poly([-58, -2, 46, -2, 62, 12, -74, 12], '#d8503c'); for (let i = 0; i < 8; i++) { poly([-58 + i * 14 - i * 2, -2, -50 + i * 14 - i * 2, -2, -62 + i * 14 - i * 2, 12, -70 + i * 14 - i * 2, 12], i % 2 ? '#f6f1e6' : '#d8503c'); }
    rrect(-34, -20, 28, 18, 4, '#a07850'); box(-34, -14, 28, 2, '#7a5a38'); stroke([-30, -20, -20, -32, -10, -20], '#7a5a38', 1.6);    // the basket
    circle(10, -6, 5, '#e8503a'); circle(20, -5, 4, '#f4c430'); box(24, -14, 7, 14, '#58b050'); box(24, -17, 7, 3, '#f6f1e6');          // fruit and a bottle
    stroke([54, 4, 54, -90], '#6a4a34', 2.4);
    poly([30, -78, 78, -78, 54, -100], '#e8503a'); poly([54, -78, 78, -78, 54, -100], '#f4f2ea'); for (let i = 0; i < 4; i++) poly([30 + i * 12, -78, 42 + i * 12, -78, 36 + i * 12, -96 + i * 3], i % 2 ? '#f4f2ea' : '#e8503a');
    for (const x of [-72, 66]) { stroke([x, -22, x - 3, 0], '#5a4030', 2); stroke([x, -22, x + 3, 0], '#5a4030', 2); box(x - 9, -26, 18, 5, '#3c6e8e'); box(x - 9, -42, 18, 3, '#3c6e8e'); stroke([x - 8, -42, x - 8, -26], '#5a4030', 1.6); }
  });
}

/** A tea room: a cottage front with a striped awning and little tables out under parasols. */
export function drawTeaRoom(sx: number, sy: number, k: number) {
  const s = k * 0.95;
  if (s < 0.16) return;
  at(sx, sy, s, () => {
    oval(0, 0, 54, 5, SH);
    box(-34, -50, 68, 50, '#f4ecd8'); box(12, -50, 22, 50, '#fffaf0'); box(-34, -6, 68, 6, '#a29a8a');
    roof(-44, 44, -50, -82, 16, '#8a4a60', '#a8607a'); box(-4, -98, 9, 20, '#9a5a46'); smoke(0, -100, 0.28);
    rrect(-24, -76, 48, 15, 3, '#2f4a3a'); rrect(-22, -74, 44, 11, 2, '#f0e4c0'); label('TEA ROOM', 0, -65, 9.5, '#2f4a3a', { align: 'center', weight: 800 });
    win(-26, -42, 16, 20, { lit: true }); win(10, -42, 16, 20, { lit: true });
    for (let i = 0; i < 7; i++) poly([-34 + i * 9.7, -46, -24.3 + i * 9.7, -46, -26.3 + i * 9.7, -36, -36 + i * 9.7, -36], i % 2 ? '#f4f2ea' : '#d8503c');
    door(-6, -6, 12, 24, '#2f4a3a');
    for (const x of [-60, 58]) { stroke([x, 0, x, -50], '#6a4a34', 2); poly([x - 17, -50, x + 17, -50, x, -64], x < 0 ? '#e8c060' : '#e878a8'); box(x - 10, -16, 20, 3, '#f6f1e6'); box(x - 1, -14, 2, 14, '#6a4a34'); }
    for (const x of [-52, 66]) box(x - 3, -8, 6, 8, '#7a5a3c');
  });
}
