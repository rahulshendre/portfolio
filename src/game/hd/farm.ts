// The animals and farm vehicles of the Bliss land: cows, sheep, horses, deer, rabbits, hens, a sheepdog; and on the road a tractor with a hay trailer, a hay truck,
// a camper van and a little red Mini. Each stands where a Himalayan yak, kiang, marmot, camel or army truck stood. Animals move a little: tails swish, heads dip to graze.
import { at, box, circle, g, hgrad, oval, poly, rrect, stroke, vgrad } from './draw';

const SH = 'rgba(24,52,12,0.22)';
const clock = () => performance.now() / 1000;
const hash = (n: number) => Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;

// ------------------------------------------------------------------------------------------------------------------ single animals (side on, facing right; `f` -1 flips them)

/** A Holstein or a Jersey cow, grazing now and then, tail swishing. */
function cow(x: number, y: number, sc: number, f: number, ph: number, coat = 0) {
  const t = clock(), dip = Math.max(0, Math.sin(t * 0.45 + ph * 2)) ** 1.5, sw = Math.sin(t * 2.2 + ph) * 3;
  g.save(); g.translate(x, y); g.scale(sc * f, sc);
  oval(0, 0, 28, 3.6, SH);
  const base = coat === 1 ? '#c48a52' : '#f2eee4', shade = coat === 1 ? '#a06a3a' : '#cfc8b8', patch = coat === 1 ? '#8a5428' : '#23211f';
  for (const lx of [-15, -10, 9, 14]) { box(lx - 1.7, -15, 3.4, 15, lx > 0 ? '#e0dacb' : '#c8c1b0'); box(lx - 1.9, -2.4, 3.8, 2.4, '#2a2420'); }
  oval(0, -24, 25, 13.5, base); oval(1, -17, 22, 7, shade);                                    // body and its shaded belly
  g.save(); g.beginPath(); g.ellipse(0, -24, 25, 13.5, 0, 0, Math.PI * 2); g.clip();             // the patches stay inside the coat
  if (coat !== 1) { oval(-13, -29, 8, 7, patch); oval(3, -20, 9, 6, patch); oval(15, -31, 6, 5, patch); oval(-22, -22, 5, 8, patch); }
  oval(8, -34, 15, 4, 'rgba(255,255,255,0.22)'); g.restore();
  oval(-6, -11.5, 5, 3.4, '#f0b8b0');                                                          // the udder
  const hx = 25 + dip * 3, hy = -31 + dip * 22;
  poly([14, -36, 20, -37, hx + 1, hy - 4, hx - 6, hy + 4], base);                                // the neck
  oval(hx + 2, hy, 8.5, 6, coat === 1 ? '#b87a46' : (ph > 1.5 ? patch : base)); oval(hx + 8, hy + 2, 4.6, 3.6, '#f0c0b8'); circle(hx + 9, hy + 2.6, 0.8, '#5a3030');
  circle(hx + 1, hy - 2, 1, '#1a1410'); poly([hx - 4, hy - 3, hx - 9, hy - 7, hx - 2, hy - 5], patch); poly([hx - 1, hy - 5, hx - 2, hy - 9, hx + 1, hy - 6], '#e8dcc0');   // an ear and a short horn
  stroke([-24, -32, -27 + sw, -22, -27 + sw * 1.3, -11], base, 2.2); circle(-27 + sw * 1.3, -10, 2.6, patch);   // the tail with its dark tuft
  g.restore();
}

/** A sheep: a cloud of wool on thin dark legs with a dark face. */
function sheep(x: number, y: number, sc: number, f: number, ph: number, lamb = false) {
  const t = clock(), dip = Math.max(0, Math.sin(t * 0.7 + ph * 3)) ** 2;
  g.save(); g.translate(x, y); g.scale(sc * f * (lamb ? 0.62 : 1), sc * (lamb ? 0.62 : 1));
  oval(0, 0, 15, 2.6, SH);
  for (const lx of [-7, -3.5, 4, 7.5]) { stroke([lx, -9, lx, -0.5], '#3a342e', 1.7); box(lx - 1.1, -1.4, 2.2, 1.4, '#2a2420'); }
  for (const [cx, cy, r, c] of [[-9, -15, 6.4, '#e8e0d0'], [-2, -12, 7.2, '#e0d8c6'], [7, -13, 6.6, '#e8e0d0'], [-6, -19, 6.4, '#f2ecde'], [3, -20, 6.8, '#f8f4ea'], [10, -18, 5, '#f2ecde'], [-12, -19, 4.4, '#ece6d8'], [0, -16, 7, '#f6f1e6']] as const) circle(cx, cy, r, c);
  oval(2, -22, 5, 2.4, 'rgba(255,255,255,0.45)');
  const hx = 16 + dip * 1.5, hy = -17 + dip * 8;
  oval(hx, hy, 4.8, 3.8, '#3e3832'); oval(hx + 3.6, hy + 1.4, 2.6, 2.2, '#524a42'); circle(hx + 0.4, hy - 1.2, 0.8, '#f4f2ea');
  poly([hx - 3, hy - 2, hx - 7, hy - 1, hx - 3, hy], '#3e3832'); circle(-17, -16, 2.6, '#f2ecde');
  g.restore();
}

/** A horse: bay, grey or chestnut, tail swishing, head dipping to the grass. */
function horse(x: number, y: number, sc: number, f: number, ph: number, coat = 0) {
  const t = clock(), dip = Math.max(0, Math.sin(t * 0.4 + ph * 2)) ** 1.5, sw = Math.sin(t * 1.9 + ph) * 3;
  const [body, shade, mane] = [['#8a4a2a', '#6a3418', '#1e1410'], ['#d8d8d2', '#b4b4ae', '#9a9a96'], ['#b86a30', '#8e4c20', '#e8c880']][coat % 3];
  g.save(); g.translate(x, y); g.scale(sc * f, sc);
  oval(0, 0, 30, 3.8, SH);
  for (const [lx, back] of [[-16, 1], [-11, 0], [11, 0], [16, 1]] as const) { poly([lx - 2.4, -22, lx + 2.4, -22, lx + 1.6, -2, lx - 1.6, -2], back ? shade : body); box(lx - 2, -3, 4, 3, coat === 1 ? '#6a6a64' : '#2a2420'); }
  oval(0, -30, 27, 12.5, body); oval(2, -23, 23, 6, shade);
  const hx = 29 + dip * 8, hy = -52 + dip * 34;
  poly([14, -42, 24, -46, hx + 1, hy - 3, hx - 7, hy + 6, 12, -30], body);                      // a long neck
  poly([hx - 5, hy - 4, hx - 3, hy + 6, hx + 8, hy + 9, hx + 12, hy + 2, hx + 4, hy - 5], body); oval(hx + 11, hy + 6, 4, 3.4, '#4a3a30'); circle(hx + 1, hy, 1.1, '#140e0a');
  poly([hx - 3, hy - 4, hx - 2, hy - 10, hx + 1, hy - 4], shade);                                  // ear
  poly([12, -44, 22, -48, hx - 4, hy - 2, hx - 7, hy + 8], mane);                                  // mane
  stroke([-26, -38, -33 + sw, -28, -32 + sw * 1.4, -10], mane, 4.2); stroke([-26, -38, -31 + sw, -30, -30 + sw * 1.4, -12], body === '#d8d8d2' ? '#c8c8c2' : mane, 2);
  g.restore();
}

/** A deer: a doe, a spotted fawn and a stag with antlers, watching the road. */
function deer(x: number, y: number, sc: number, f: number, ph: number, kind: 'doe' | 'fawn' | 'stag') {
  const t = clock(), ear = Math.sin(t * 3 + ph * 4) > 0.9 ? 3 : 0, graze = kind !== 'stag' && Math.sin(t * 0.35 + ph * 2) > 0.5;
  g.save(); g.translate(x, y); g.scale(sc * f * (kind === 'fawn' ? 0.58 : 1), sc * (kind === 'fawn' ? 0.58 : 1));
  oval(0, 0, 22, 3, SH);
  for (const lx of [-12, -8, 8, 12]) { stroke([lx, -18, lx + (lx > 0 ? 1 : -1) * 0.6, -1], '#7a5230', 2.2); box(lx - 1.2, -2, 2.4, 2, '#2a2420'); }
  oval(0, -26, 20, 9.5, '#b4824e'); oval(1, -21, 17, 5, '#ead8b4');
  if (kind === 'fawn') for (const [sx2, sy2] of [[-10, -29], [-3, -31], [5, -30], [12, -28], [-6, -26], [3, -26], [-13, -25]] as const) circle(sx2, sy2, 1.1, '#f4ecd8');
  const hx = graze ? 24 : 22, hy = graze ? -14 : -44;
  poly([12, -30, 18, -33, hx, hy + 2, hx - 6, hy + 5], '#b4824e');
  oval(hx + 2, hy, 5.8, 4.2, '#b4824e'); oval(hx + 7, hy + 1.4, 3, 2.4, '#4a3a2c'); circle(hx + 2.4, hy - 1.2, 0.9, '#1a1410');
  poly([hx - 2, hy - 3, hx - 7 - ear * 0.4, hy - 8 + ear * 0.4, hx, hy - 5], '#8a5a34');
  if (kind === 'stag') { stroke([hx - 1, hy - 3, hx - 6, hy - 16], '#e8dcc0', 1.6); stroke([hx - 4, hy - 10, hx - 10, hy - 12], '#e8dcc0', 1.4); stroke([hx - 3, hy - 13, hx + 1, hy - 20], '#e8dcc0', 1.4); stroke([hx + 1, hy - 3, hx + 2, hy - 16], '#e8dcc0', 1.6); stroke([hx + 2, hy - 11, hx + 8, hy - 14], '#e8dcc0', 1.4); }
  poly([-19, -30, -23, -33, -21, -26], '#f2ecde');                                                // the white scut
  g.restore();
}

/** A rabbit sitting up, ears high, nose twitching, beside a log. */
function rabbit(x: number, y: number, sc: number, f: number, ph: number, tilt = 0) {
  const t = clock(), tw = Math.sin(t * 18 + ph) * 0.5;
  g.save(); g.translate(x, y); g.scale(sc * f, sc);
  oval(0, 0, 11, 2, SH);
  oval(-1, -7, 8.5, 6.5, '#a89078'); oval(1, -5, 5.5, 4.2, '#ddd0b8'); circle(-8, -7, 2.6, '#f4f0e8');          // body, pale belly, white tail
  oval(5, -15, 4.4, 4.8, '#a89078');                                                                          // head
  oval(3.4 + tilt, -26, 1.9, 6.4, '#a89078'); oval(7 + tilt * 0.6, -25.5, 1.9, 6, '#98806a'); oval(3.4 + tilt, -26, 0.9, 4.6, '#e8b4a8');   // ears
  circle(7.6, -16, 0.9, '#1a1410'); circle(9.6 + tw * 0.3, -13.4, 0.8, '#d8808a');
  oval(5, -2, 3.2, 1.6, '#98806a'); oval(-4, -1.6, 4, 1.8, '#98806a');                                       // paws
  g.restore();
}

/** A hen with her chicks, pecking. */
function hen(x: number, y: number, sc: number, f: number, ph: number, rooster = false) {
  const peck = Math.max(0, Math.sin(clock() * 5 + ph * 3)) ** 3;
  g.save(); g.translate(x, y); g.scale(sc * f, sc);
  oval(0, 0, 12, 2, SH);
  stroke([-1, -6, -1, -0.5], '#e8a830', 1.4); stroke([3, -6, 3, -0.5], '#e8a830', 1.4);
  const body = rooster ? '#a8481c' : '#c8803a';
  oval(0, -11, 9.5, 7, body); oval(-3, -12, 6, 4, rooster ? '#7a2e12' : '#a8642a');
  poly([-8, -12, -15, rooster ? -26 : -20, -11, -9], rooster ? '#2a5a3a' : '#a8642a'); if (rooster) poly([-9, -13, -17, -22, -12, -9], '#d8a830');
  const hx = 8 + peck * 3, hy = -19 + peck * 9;
  poly([5, -14, 7, -17, hx, hy, hx - 3, hy + 2], body); circle(hx + 1, hy - 1, 3.2, '#f4ecd8'); poly([hx + 3, hy - 1, hx + 7, hy, hx + 3, hy + 1.2], '#e8a020');
  poly([hx - 1, hy - 3.5, hx + 1, hy - 6.5, hx + 2.6, hy - 3.5], '#d8301c'); circle(hx + 1.6, hy - 1.4, 0.7, '#1a1410');
  g.restore();
}
function chick(x: number, y: number, ph: number) {
  const hop = Math.abs(Math.sin(clock() * 6 + ph)) * 2;
  oval(x, y, 5, 1, SH); circle(x, y - 3.4 - hop, 3.4, '#f6d850'); circle(x + 2.8, y - 5.4 - hop, 2.2, '#f6d850'); poly([x + 4.6, y - 5.4 - hop, x + 7, y - 5 - hop, x + 4.6, y - 4.4 - hop], '#e8a020'); circle(x + 3.4, y - 5.8 - hop, 0.5, '#1a1410');
}

/** A black-and-white sheepdog, sitting, tongue out, tail sweeping. */
function sheepdog(x: number, y: number, sc: number, f: number, ph: number) {
  const wag = Math.sin(clock() * 7 + ph) * 5;
  g.save(); g.translate(x, y); g.scale(sc * f, sc);
  oval(0, 0, 16, 2.6, SH);
  stroke([-9, -5, -16 + wag * 0.3, -2 + wag * 0.5], '#2a2622', 3.4); circle(-16 + wag * 0.3, -2 + wag * 0.5, 2.4, '#f4f0e8');
  poly([-9, -3, -8, -18, 1, -26, 5, -3], '#2a2622'); oval(-1, -11, 8, 8, '#2a2622'); oval(2, -9, 5, 7, '#f4f0e8');
  oval(3, -24, 4, 8, '#2a2622'); circle(5, -32, 5.6, '#2a2622'); oval(9.4, -30.6, 3.6, 2.6, '#f4f0e8'); poly([5, -32, 6, -38, 9, -33], '#f4f0e8');
  circle(5.6, -33, 1, '#e8a830'); circle(11.6, -31, 0.9, '#1a1410'); poly([11, -29.4, 12.5, -27, 10, -28], '#e86a7a');
  box(1, -8, 3, 8, '#f4f0e8'); box(5, -8, 3, 8, '#f4f0e8');
  g.restore();
}

// ------------------------------------------------------------------------------------------------------------------ roadside groups (what the Himalayan props become)

/** A small herd of cows by the road, one grazing, one looking up (the yaks of the pass). */
export function drawCows(sx: number, sy: number, k: number, v = 0) {
  if (k < 0.16) return;
  if (k < 0.3) { at(sx, sy, k * 0.95, () => { for (const [x, c] of [[-40, '#f2eee4'], [0, '#c48a52'], [40, '#f2eee4']] as const) { oval(x, 0, 26, 3, SH); oval(x, -24, 25, 13, c); oval(x + 20, -30, 8, 6, c); } }); return; }
  at(sx, sy, k * 0.95, () => { cow(-40, 0, 0.92, 1, v, 0); cow(0, -4, 1, -1, v + 1.7, 1); cow(40, 1, 0.86, 1, v + 3.1, 0); });
}
/** Sheep and lambs on the verge (the camels of the dunes). */
export function drawFlock(sx: number, sy: number, k: number, v = 0) {
  if (k < 0.16) return;
  if (k < 0.3) { at(sx, sy, k * 1.1, () => { for (const x of [-44, -18, 10, 36, 52]) { oval(x, 0, 14, 2.4, SH); oval(x, -14, 14, 9, '#f2ecde'); oval(x + 15, -15, 4.6, 3.6, '#3e3832'); } }); return; }
  at(sx, sy, k * 1.1, () => { sheep(-44, 0, 1, 1, v); sheep(-18, -3, 0.95, -1, v + 1.1); sheep(10, 1, 1.05, 1, v + 2.3); sheep(36, -2, 0.9, -1, v + 3.4); sheep(52, 1, 1, 1, v + 4.6, true); sheep(-30, 2, 1, 1, v + 5.1, true); });
}
/** Two horses and a foal (the wild kiang of the plain). */
export function drawHorses(sx: number, sy: number, k: number, v = 0) {
  if (k < 0.16) return;
  at(sx, sy, k * 0.9, () => { horse(-40, 0, 0.95, 1, v, v % 3); horse(26, -3, 1, -1, v + 1.6, (v + 1) % 3); horse(64, 2, 0.5, 1, v + 2.7, 2); });
}
/** A doe, her fawn and a stag at the edge of the wood (the marmots on the rocks). */
export function drawDeer(sx: number, sy: number, k: number, v = 0) {
  if (k < 0.16) return;
  at(sx, sy, k * 1.2, () => { deer(-30, 0, 1, 1, v, 'doe'); deer(0, 2, 1, 1, v + 1, 'fawn'); deer(34, -2, 1.1, -1, v + 2, 'stag'); });
}
/** A rabbit by a log. */
export function drawRabbits(sx: number, sy: number, k: number, v = 0) {
  if (k < 0.16) return;
  at(sx, sy, k * 1.4, () => {
    oval(-12, -3, 17, 5, '#6a4a30'); oval(-12, -3, 17, 5, 'rgba(255,255,255,0.1)'); circle(-28, -3, 4.6, '#d8b890'); circle(-28, -3, 2.6, '#a88858');
    for (let i = 0; i < 4; i++) stroke([-18 + i * 7, -7, -18 + i * 7 + 2, -3], 'rgba(0,0,0,0.25)', 0.8);
    rabbit(8, 0, 1, 1, v); rabbit(26, 2, 0.7, -1, v + 2, 1);
  });
}
/** Hens and chicks round a farm (the stray dogs of the shops). */
export function drawHens(sx: number, sy: number, k: number, v = 0) {
  if (k < 0.16) return;
  at(sx, sy, k * 1.5, () => { hen(-16, 0, 1, 1, v); hen(14, 2, 1, -1, v + 1.5, true); chick(-2, 3, v); chick(-8, 5, v + 1); chick(26, 4, v + 2); });
}
/** A sheepdog sitting by a fence post. */
export function drawCollie(sx: number, sy: number, k: number, v = 0) {
  if (k < 0.16) return;
  at(sx, sy, k * 1.3, () => { sheepdog(0, 0, 1, v % 2 ? 1 : -1, v); });
}
/** A horse and a cart-load of milk churns... just a pair of horses nosing the fence. Used by the farm. */
export function drawPaddock(sx: number, sy: number, k: number, v = 0) {
  if (k < 0.16) return;
  at(sx, sy, k, () => {
    for (const x of [-70, -26, 18, 62]) { box(x - 2, -26, 4, 26, '#7a5a3c'); box(x - 2, -26, 1.4, 26, '#9a7a56'); }
    box(-72, -22, 138, 3.4, '#8a6a46'); box(-72, -12, 138, 3.4, '#8a6a46');
    horse(-24, 0, 0.8, 1, v, 0); horse(26, 2, 0.74, -1, v + 1.4, 1);
  });
}

// ------------------------------------------------------------------------------------------------------------------ on the road, from behind

/** The Bliss land's traffic. `kind` is the Himalayan vehicle it replaces. Returns false for kinds it does not dress (riders). */
export function drawBlissCar(kind: string, sx: number, sy: number, s: number, t: number): boolean {
  if (s < 0.14) return true;
  if (kind === 'army') tractor(sx, sy, s, t);
  else if (kind === 'tanker') hayTruck(sx, sy, s);
  else if (kind === 'tempo') camper(sx, sy, s);
  else if (kind === 'suv') mini(sx, sy, s);
  else if (kind === 'yak') at(sx, sy, s, () => { for (const [x, sc, c] of [[-24, 0.9, 0], [4, 1, 1], [30, 0.84, 0]] as const) cowBehind(x, sc, c, t); });
  else if (kind === 'goats') at(sx, sy, s, () => { for (const [x, sc, f, ph] of [[-34, 1, 1, 0], [-14, 0.9, -1, 1.3], [6, 1.05, 1, 2.1], [26, 0.85, -1, 3.2], [44, 0.95, 1, 4.1]] as const) sheepWalk(x, sc, f, ph, t); });
  else if (kind === 'marmot') at(sx, sy, s * 1.1, () => { const hop = Math.abs(Math.sin(t * 9)) * 6; g.save(); g.translate(0, -hop); rabbit(0, 0, 1.2, 1, 0); g.restore(); oval(0, 0, 8, 1.6, '#00000030'); });
  else return false;
  return true;
}

function cowBehind(x: number, sc: number, coat: number, t: number) {
  g.save(); g.translate(x, 0); g.scale(sc, sc);
  const base = coat ? '#c48a52' : '#f2eee4', patch = coat ? '#8a5428' : '#23211f', sw = Math.sin(t * 2 + x) * 4;
  oval(0, 0, 21, 4, '#00000040');
  for (const lx of [-9, 4]) { box(lx, -14, 5.6, 14, '#cfc8b8'); box(lx - 0.3, -2, 6.2, 2.4, '#2a2420'); }
  oval(0, -30, 20, 18, hgrad(-20, 20, [[0, coat ? '#a06a3a' : '#cfc8b8'], [0.5, base], [1, coat ? '#a06a3a' : '#d8d2c2']]));
  if (!coat) { oval(-8, -34, 7, 8, patch); oval(9, -26, 8, 7, patch); oval(2, -42, 6, 4, patch); }
  oval(0, -22, 4.4, 3, '#f0b8b0');
  stroke([0, -40, 1 + sw, -28, 1 + sw * 1.4, -12], base, 2.4); circle(1 + sw * 1.4, -11, 2.8, patch);
  g.restore();
}
function sheepWalk(x: number, sc: number, f: number, ph: number, t: number) {
  const sw = Math.sin(t * 9 + ph) * 3;
  g.save(); g.translate(x, 0); g.scale(sc * f, sc);
  oval(0, 0, 13, 2.4, '#00000040');
  for (const lx of [-7, -3, 3, 7]) stroke([lx, -9, lx + (lx > 0 ? sw : -sw) * 0.6, 0], '#3a342e', 1.6);
  for (const [cx, cy, r] of [[-8, -15, 6], [-1, -12, 7], [7, -14, 6.4], [-5, -19, 6], [3, -20, 6.4], [10, -18, 4.6]] as const) circle(cx, cy, r, '#f0eadc');
  oval(15, -17, 4.6, 3.6, '#3e3832'); circle(-15, -16, 2.4, '#f0eadc');
  g.restore();
}

/** A red tractor from behind, towing a trailer stacked with hay bales, a puff from its exhaust. */
function tractor(sx: number, sy: number, s: number, t: number) {
  at(sx, sy, s, () => {
    oval(0, 0, 40, 5, '#00000055');
    box(-11, -96, 22, 26, '#a02820'); box(-14, -100, 28, 5, '#7a1c16'); box(-8, -92, 16, 14, '#5a7894'); box(-8, -92, 16, 4, 'rgba(255,255,255,0.22)');   // the cab roof and its glass, behind the load
    box(15, -110, 3, 28, '#2a2a2e'); box(14, -112, 5, 3, '#2a2a2e');                                                                                           // the exhaust
    for (let i = 0; i < 3; i++) { const p = (t * 0.8 + i / 3) % 1; g.globalAlpha = (1 - p) * 0.4; circle(16.5 + Math.sin(p * 5 + i) * 3, -114 - p * 22, 3 + p * 6, '#8a8680'); }
    g.globalAlpha = 1;
    box(-26, -16, 52, 6, '#3a3a3e'); box(-28, -20, 56, 5, '#8a5a30');                                                                                          // the trailer bed and its rail
    for (const x of [-30, 20]) { rrect(x, -26, 10, 26, 3, '#17171a'); for (let i = 0; i < 6; i++) box(x + 1, -24 + i * 4, 8, 1.4, '#2c2c30'); box(x + 3, -16, 4, 6, '#a02820'); }   // big treaded wheels
    box(-27, -62, 54, 42, vgrad(-62, -20, [[0, '#e8c660'], [1, '#c8a040']]));                                                                               // the hay
    for (const y of [-50, -38, -26]) { stroke([-27, y, 27, y], 'rgba(120,80,20,0.35)', 1); }
    for (const x of [-14, 0, 14]) stroke([x, -62, x, -20], '#7a5a28', 1.4);
    for (let i = 0; i < 9; i++) stroke([-24 + i * 6, -62, -22 + i * 6 + (i % 2) * 2, -66], '#e8c660', 1.4);
    box(-26, -16, 6, 4, '#d8342b'); box(20, -16, 6, 4, '#d8342b'); rrect(-8, -14, 16, 6, 1, '#f4f2ea');
  });
}

/** A flatbed truck from behind with a tall load of hay bales under a rope net. */
function hayTruck(sx: number, sy: number, s: number) {
  at(sx, sy, s, () => {
    oval(0, 0, 40, 5, '#00000055');
    box(-24, -9, 12, 9, '#141416'); box(12, -9, 12, 9, '#141416');
    box(-30, -15, 60, 7, '#2a2c2e'); box(-30, -24, 60, 11, '#8a5a30'); box(-30, -24, 60, 2, '#a8743c');
    box(-26, -12, 6, 4, '#d8342b'); box(20, -12, 6, 4, '#d8342b'); rrect(-9, -22, 18, 7, 1, '#e8b923');
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3 - (r === 2 ? 1 : 0); c++) { const x = -27 + c * 18 + (r === 2 ? 9 : 0), y = -26 - r * 17; box(x, y - 16, 17, 16, vgrad(y - 16, y, [[0, '#ecd070'], [1, '#c8a444']])); box(x, y - 16, 17, 1.4, '#f6e498'); stroke([x, y - 8, x + 17, y - 8], 'rgba(120,80,20,0.35)', 0.9); }
    g.globalAlpha = 0.55; for (let i = -3; i <= 3; i++) stroke([i * 9, -26, i * 9, -76], '#6a4a2a', 0.9); for (const y of [-40, -58]) stroke([-30, y, 30, y], '#6a4a2a', 0.9); g.globalAlpha = 1;   // the rope net
    for (let i = 0; i < 7; i++) stroke([-26 + i * 9, -76, -24 + i * 9 + (i % 2) * 3, -82], '#ecd070', 1.5);
  });
}

/** A vintage camper van from behind: two-tone, a split rear window, a surfboard and a suitcase on the roof. */
function camper(sx: number, sy: number, s: number) {
  at(sx, sy, s, () => {
    oval(0, 0, 32, 5, '#00000055');
    box(-22, -8, 10, 8, '#141416'); box(12, -8, 10, 8, '#141416');
    rrect(-26, -15, 52, 6, 3, '#d8d8d4');
    rrect(-27, -64, 54, 50, 8, hgrad(-27, 27, [[0, '#4aa49c'], [0.45, '#68c4b8'], [1, '#42948c']]));
    poly([-27, -50, 27, -50, 27, -64, -27, -64], '#f2ead0'); rrect(-27, -64, 54, 16, 8, hgrad(-27, 27, [[0, '#d8cfb4'], [0.45, '#f6efd8'], [1, '#cfc6aa']]));     // the cream roof half
    poly([-27, -50, 0, -43, 27, -50, 27, -47, 0, -39, -27, -47], '#f2ead0');                                                                                       // the V
    rrect(-21, -58, 17, 13, 3, '#26343a'); rrect(4, -58, 17, 13, 3, '#26343a'); poly([-21, -50, -10, -58, -6, -58, -17, -45, -21, -45], 'rgba(255,255,255,0.22)');   // the split window
    for (let i = 0; i < 4; i++) box(-12, -33 + i * 3, 24, 1.2, 'rgba(0,0,0,0.3)');                                                                                  // engine louvres
    box(-25, -40, 4, 12, '#d8342b'); box(21, -40, 4, 12, '#d8342b'); rrect(-8, -26, 16, 7, 1, '#f4f2ea');
    stroke([-22, -66, 22, -66], '#2a2c30', 1.4);
    poly([-18, -68, -6, -68, -10, -92, -14, -92], '#e8503a'); poly([-10, -92, -6, -68, -8, -68, -11, -88], '#f4c430');                                                  // a surfboard poking up
    rrect(2, -80, 22, 14, 3, '#6b4a2a'); stroke([8, -80, 8, -66], '#2a1c10', 1.2); stroke([18, -80, 18, -66], '#2a1c10', 1.2);
  });
}

/** A little red Mini from behind with a white roof. */
function mini(sx: number, sy: number, s: number) {
  at(sx, sy, s, () => {
    oval(0, 0, 30, 5, '#00000055');
    box(-21, -8, 9, 8, '#141416'); box(12, -8, 9, 8, '#141416');
    rrect(-25, -17, 50, 6, 3, '#d8d8d4');
    rrect(-25, -42, 50, 28, 10, hgrad(-25, 25, [[0, '#a82a24'], [0.45, '#d8403a'], [1, '#982620']]));
    rrect(-20, -58, 40, 22, 9, hgrad(-20, 20, [[0, '#d8d4c8'], [0.5, '#f6f2e8'], [1, '#cdc8bc']]));
    rrect(-16, -54, 32, 14, 6, '#26343a'); poly([-16, -46, -6, -54, -2, -54, -12, -40, -16, -40], 'rgba(255,255,255,0.24)');
    circle(-19, -30, 3.6, '#e8503a'); circle(19, -30, 3.6, '#e8503a'); circle(-19, -30, 1.8, '#f4c0b0'); circle(19, -30, 1.8, '#f4c0b0');
    rrect(-8, -27, 16, 7, 1, '#f4f2ea'); box(-25, -18, 50, 2, '#e8e8e4');
  });
}
