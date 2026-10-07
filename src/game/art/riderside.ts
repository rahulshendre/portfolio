// Rahul on the Scrambler, seen from the side and facing right, for the door scene. Drawn on the bike sprite's own pixel grid so the two read as one picture.
//
// The proportions come from real numbers, not by eye. The Triumph Scrambler 400 X has a 1418 mm wheelbase and an 835 mm seat; on the 152 px sprite that is 70 px between the axles, so one metre
// is about 49 px and the seat top sits 41 px above the ground. A 1.72 m rider is then 85 px tall standing: head 0.23 m (a full-face helmet 0.30), hip to shoulder 0.50 m, thigh and shin
// 0.44 m each, upper arm 0.32 m, elbow to grip 0.40 m. The seating is the standard upright one (about 15 degrees of forward lean, a knee bent near 70 degrees, hands a little below the elbows).
// Limbs are solved with two-bone IK from where the hip, grip and peg are, so every bone keeps its length whatever the bike's numbers are.
import { C } from './palette';
import { disc, poly, rect } from '../engine/pixel';

export type P = [number, number];

/** Pixels per metre on the bike sprite (70 px between the axles, 1.418 m apart). */
export const PX_PER_M = 49.4;
const m = (metres: number) => metres * PX_PER_M;

/** The rider's bones, in pixels. */
export const BONE = { torso: m(0.5), thigh: m(0.44), shin: m(0.44), upper: m(0.32), fore: m(0.4), head: m(0.15) } as const;
/** Where the rider meets the bike, in sprite pixels (top-left of the bike sprite is 0, 0). */
export const SEAT: P = [61, 23];       // the hip joint, a hand above the seat
export const GRIP: P = [97, 15];       // the near hand grip
export const PEG: P = [75, 50];        // the near footpeg, where the sole rests
const LEAN = (15 * Math.PI) / 180;

const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const mul = (a: P, k: number): P => [a[0] * k, a[1] * k];
const mid = (a: P, b: P, t = 0.5): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** The joint between `a` and `b` whose two bones are `l1` (from a) and `l2` (to b). `side` 1 bends it forward and up of the line a to b, -1 back and down. A target out of reach is clamped to a straight limb. */
export function bend(a: P, b: P, l1: number, l2: number, side: 1 | -1): P {
  const d = sub(b, a), len = Math.hypot(d[0], d[1]) || 1e-6, reach = Math.min(len, l1 + l2 - 1e-3);
  const x = (l1 * l1 - l2 * l2 + reach * reach) / (2 * reach), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  const u: P = [d[0] / len, d[1] / len];
  return [a[0] + u[0] * x + u[1] * h * side, a[1] + u[1] * x - u[0] * h * side];
}

export interface Pose {
  hip: P; shoulder: P; head: P; elbow: P; hand: P; knee: P; ankle: P;
}
/** Every joint of the near side. The torso leans 15 degrees forward from the hip; the arm reaches the grip and the leg the peg. */
export function pose(): Pose {
  const hip = SEAT, shoulder: P = [hip[0] + Math.sin(LEAN) * BONE.torso, hip[1] - Math.cos(LEAN) * BONE.torso];
  const head: P = [shoulder[0] + 3.5, shoulder[1] - m(0.2)];
  const hand = GRIP, ankle: P = [PEG[0] - 2, PEG[1] - m(0.1)];
  return { hip, shoulder, head, hand, ankle, elbow: bend(shoulder, hand, BONE.upper, BONE.fore, -1), knee: bend(hip, ankle, BONE.thigh, BONE.shin, 1) };
}

const INK = '#14161c';
const K = {
  jacket: '#46557c', jacketLit: '#6a80ac', jacketDark: '#2c3753', band: '#cfd6df', zip: '#1a2132',
  pants: '#2b3446', pantsLit: '#46526f', pantsDark: '#1b212e',
  boot: '#1b1c21', bootLit: '#3a3d46', glove: '#17181c', gloveLit: '#33363f',
  helmet: C.white, helmetShade: '#b9b7b0', helmetDark: '#8e8c86', stripe: C.red, visor: '#1a1d25', visorLit: '#6f8fa8', skin: '#b87a52',
};
const shadeFar = (c: string) => c;                   // placeholder so the far side can be darkened in one place below
void shadeFar;

/** A round-ended limb from a to b, radius from `ra` to `rb`, with a one-pixel ink edge. */
function limb(a: P, b: P, ra: number, rb: number, fill: string, edge = INK, lit?: string) {
  const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 1.5) + 1;
  const stamp = (rr: number, col: string, dx = 0, dy = 0) => { for (let i = 0; i <= n; i++) { const t = i / n, p = mid(a, b, t); disc(p[0] + dx, p[1] + dy, Math.max(1, Math.round(ra + (rb - ra) * t) + rr), col); } };
  stamp(1, edge);
  stamp(0, fill);
  if (lit) stamp(-1, lit, -1, -1);                       // the edge facing the light, up and to the left
  if (lit) stamp(-1, fill, 0, 0);
}

/** A polygon with a one-pixel ink edge. */
function shape(pts: P[], fill: string, edge = INK) {
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1]] as const) poly(pts.map((p) => [p[0] + dx, p[1] + dy] as P), edge);
  poly(pts, fill);
}

/** Draw the rider with the sprite's top-left at (x, y). */
export function drawRiderSide(x: number, y: number) {
  const J = pose(), o = (p: P): P => [p[0] + x, p[1] + y];
  const hip = o(J.hip), sh = o(J.shoulder), head = o(J.head), elbow = o(J.elbow), hand = o(J.hand), knee = o(J.knee), ankle = o(J.ankle);
  const up: P = [Math.sin(LEAN), -Math.cos(LEAN)], fwd: P = [Math.cos(LEAN), Math.sin(LEAN)];

  // ---- the far side, a shade darker and nudged forward so it reads as behind
  const farKnee: P = [knee[0] + 2, knee[1] - 1], farAnkle: P = [ankle[0] + 3, ankle[1] - 1];
  limb(add(hip, [1, 0]), farKnee, 3.4, 3, K.pantsDark);
  limb(farKnee, farAnkle, 3, 2, K.pantsDark);
  shape([[farAnkle[0] - 3, farAnkle[1] - 3], [farAnkle[0] + 2, farAnkle[1] - 3], [farAnkle[0] + 10, farAnkle[1] + 2], [farAnkle[0] + 10, farAnkle[1] + 5], [farAnkle[0] - 3, farAnkle[1] + 5]], '#101115');
  limb(add(sh, [2, 1]), add(hand, [2, -1]), 2, 2, K.jacketDark);
  rect(hand[0] + 1, hand[1] - 3, 5, 4, '#0d0e11');

  // ---- the torso: back, belly and chest as one jacket shape, leaning forward from the hip
  const at = (t: number, back: number, front: number): [P, P] => { const c = mid(hip, sh, t); return [sub(c, mul(fwd, back)), add(c, mul(fwd, front))]; };
  const [b0, f0] = at(0, 6.5, 5), [b1, f1] = at(0.45, 6.5, 6.5), [b2, f2] = at(0.85, 7, 7.5), [b3, f3] = at(1, 5, 5.5);
  shape([add(b0, [-1, 3]), b1, b2, b3, f3, f2, f1, f0, add(f0, [0, 2])], K.jacket);
  // light from the upper left: the back and shoulder blade catch it, the belly and under the arm fall into shadow
  poly([b1, b2, b3, add(b3, mul(fwd, 3.5)), add(b2, mul(fwd, 3.5)), add(b1, mul(fwd, 3))], K.jacketLit);
  poly([f0, f1, mid(f1, b1, 0.35), mid(f0, b0, 0.3), add(f0, [0, 2])], K.jacketDark);
  poly([add(b0, [-1, 3]), b0, mid(b0, b1, 0.5), add(mid(b0, b1, 0.5), mul(fwd, 2.5)), add(b0, [3, 3])], K.jacketDark);   // the hem hangs over the seat
  const collar = (t: number): P => mid(sh, add(sh, mul(up, 4)), t);
  poly([sub(collar(0), mul(fwd, 5.5)), add(collar(0), mul(fwd, 5)), add(collar(1), mul(fwd, 3.5)), sub(collar(1), mul(fwd, 4))], K.jacketLit);
  const zipTop = add(f3, mul(fwd, -2)), zipBot = add(f0, mul(fwd, -2));                                            // the zip down the front, a shade darker
  for (let i = 0; i <= 12; i++) { const p = mid(zipTop, zipBot, i / 12); rect(p[0] - 1, p[1], 1, 1, K.zip); }
  { const a = mid(b1, b0, 0.15), c = mid(f1, f0, 0.15); for (let i = 0; i <= 10; i++) { const p = mid(a, c, i / 10); rect(p[0], p[1], 1, 1, K.band); } }   // a reflective band across the kidneys
  disc(sh[0] - 1, sh[1] + 1, 4, K.jacketLit);                                                                       // the shoulder, rounded

  // ---- the near leg: thigh over the tank, shin back to the peg, boot flat on it
  limb(hip, knee, 3.4, 3, K.pants, INK, K.pantsLit);
  disc(knee[0] - 1, knee[1] - 1, 2, K.pantsLit);                                               // the knee pad catches the light
  limb(knee, ankle, 2.7, 2, K.pants, INK, K.pantsLit);
  shape([[ankle[0] - 3, ankle[1] - 4], [ankle[0] + 2, ankle[1] - 4], [ankle[0] + 10, ankle[1] + 1], [ankle[0] + 11, ankle[1] + 4], [ankle[0] - 3, ankle[1] + 4]], K.boot);
  rect(ankle[0] - 2, ankle[1] - 3, 3, 4, K.bootLit);                                           // the shaft of the boot
  rect(ankle[0] + 3, ankle[1] + 1, 7, 1, K.bootLit);                                           // the toe cap

  // ---- the near arm: upper arm from the shoulder, forearm to the grip, a glove round it
  limb(sh, elbow, 2.6, 2, K.jacket, INK, K.jacketLit);
  limb(elbow, hand, 2, 2, K.jacket, INK, K.jacketLit);
  const bandAt = mid(elbow, hand, 0.42);
  rect(bandAt[0] - 1, bandAt[1] - 1, 2, 3, K.band);                                            // a reflective band on the sleeve
  rect(hand[0] - 2, hand[1] - 3, 6, 5, INK); rect(hand[0] - 1, hand[1] - 2, 5, 3, K.glove); rect(hand[0] - 1, hand[1] - 2, 3, 1, K.gloveLit);

  // ---- the head: a full-face helmet, white with a red stripe, the visor to the front
  const hx = head[0], hy = head[1];
  disc(hx, hy, 8, INK);
  poly([[hx - 1, hy + 5], [hx + 8, hy + 3], [hx + 9, hy + 8], [hx + 4, hy + 10], [hx - 2, hy + 8]], INK);        // the chin bar
  disc(hx, hy, 7, K.helmet);
  poly([[hx, hy + 5], [hx + 7, hy + 3], [hx + 8, hy + 7], [hx + 4, hy + 9], [hx - 1, hy + 7]], K.helmet);
  poly([[hx - 7, hy + 1], [hx - 3, hy + 6], [hx + 3, hy + 9], [hx + 4, hy + 7], [hx - 5, hy + 3]], K.helmetShade);   // the underside, in shade
  poly([[hx + 2, hy - 5], [hx + 9, hy - 3], [hx + 9, hy + 3], [hx + 3, hy + 4]], INK);                               // the visor opening
  poly([[hx + 3, hy - 4], [hx + 8, hy - 2], [hx + 8, hy + 2], [hx + 4, hy + 3]], K.visor);
  rect(hx + 4, hy - 3, 3, 1, K.visorLit);
  poly([[hx - 6, hy - 5], [hx - 1, hy - 8], [hx + 5, hy - 7], [hx + 5, hy - 5], [hx - 1, hy - 6], [hx - 6, hy - 3]], K.stripe);   // the racing stripe over the crown
  rect(hx - 4, hy - 7, 3, 1, '#ffffff');                                                       // a highlight on the dome
}
