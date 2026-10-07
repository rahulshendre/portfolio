// Rahul on the Scrambler, seen from the side and facing right, for the door scene. Drawn on the bike sprite's own pixel grid so the two read as one picture.
//
// The proportions come from real numbers, not by eye. The Triumph Scrambler 400 X has a 1418 mm wheelbase and an 835 mm seat; on the 152 px sprite that is 70 px between the axles, so one metre
// is about 49 px and the seat top sits 41 px above the ground. A 1.72 m rider is then 85 px tall standing: head 0.23 m (a full-face helmet 0.30), hip to shoulder 0.50 m, thigh and shin
// 0.44 m each, upper arm 0.32 m, elbow to grip 0.40 m. The seating is the standard upright one (about 15 degrees of forward lean, a knee bent near 70 degrees, hands a little below the elbows).
// Limbs are solved with two-bone IK from where the hip, grip and peg are, so every bone keeps its length whatever the bike's numbers are.
import { bayer, rect } from '../engine/pixel';
import { dim, GEAR, type Ramp } from './gear';

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

const INK = GEAR.ink;
/** Light from the upper left and in front, like the bike sprite's own lighting. */
const LIGHT = ((v) => { const n = Math.hypot(v[0], v[1], v[2]); return [v[0] / n, v[1] / n, v[2] / n]; })([-0.52, -0.62, 0.58]);

/** The ramp step a surface turned to (nx, ny, and so a depth) shows at pixel (x, y): ordered dither blends neighbouring steps, so a curve reads as a curve and not a banded cut-out. */
function tone(nx: number, ny: number, x: number, y: number, ramp: Ramp, soft = 0.5): string {
  const z = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
  const lam = nx * LIGHT[0] + ny * LIGHT[1] + z * LIGHT[2], t = Math.min(1, Math.max(0, 0.5 + (lam - LIGHT[2]) * 0.95));   // a face turned straight at you sits on the body tone; toward the light climbs the ramp, away from it falls
  const i = Math.floor(t * 4 + (bayer(x, y) - 0.5) * soft + 0.5);
  return ramp[Math.max(0, Math.min(4, i))];
}
const px = (x: number, y: number, col: string) => rect(x, y, 1, 1, col);

/** A shaded round bar from a to b (radius ra to rb): lit like a cylinder, with an ink edge that turns to the ramp's own shadow where it faces the light. */
function bar(a: P, b: P, ra: number, rb: number, ramp: Ramp, only?: (x: number, y: number) => boolean) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len2 = dx * dx + dy * dy || 1;
  const R = Math.max(ra, rb) + 1.5, x0 = Math.floor(Math.min(a[0], b[0]) - R), x1 = Math.ceil(Math.max(a[0], b[0]) + R), y0 = Math.floor(Math.min(a[1], b[1]) - R), y1 = Math.ceil(Math.max(a[1], b[1]) + R);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const cx = x + 0.5, cy = y + 0.5, t = Math.min(1, Math.max(0, ((cx - a[0]) * dx + (cy - a[1]) * dy) / len2)), qx = a[0] + dx * t, qy = a[1] + dy * t, r = ra + (rb - ra) * t;
    const d = Math.hypot(cx - qx, cy - qy);
    if (d > r + 1) continue;
    if (only && !only(x, y)) continue;
    const nx = (cx - qx) / (d || 1), ny = (cy - qy) / (d || 1);
    if (d > r) px(x, y, nx * LIGHT[0] + ny * LIGHT[1] > 0.25 ? ramp[0] : INK);
    else px(x, y, tone((cx - qx) / r, (cy - qy) / r, x, y, ramp));
  }
}

/** A shaded ellipsoid, for the helmet. */
function ball(c: P, rx: number, ry: number, ramp: Ramp) {
  for (let y = Math.floor(c[1] - ry - 2); y <= Math.ceil(c[1] + ry + 2); y++) for (let x = Math.floor(c[0] - rx - 2); x <= Math.ceil(c[0] + rx + 2); x++) {
    const ux = (x + 0.5 - c[0]) / rx, uy = (y + 0.5 - c[1]) / ry, d = Math.hypot(ux, uy);
    if (d > 1 + 1 / Math.min(rx, ry)) continue;
    if (d > 1) px(x, y, (ux * LIGHT[0] + uy * LIGHT[1]) / (d || 1) > 0.25 ? ramp[0] : INK);
    else px(x, y, tone(ux, uy, x, y, ramp, 0.4));
  }
}
const inBall = (c: P, rx: number, ry: number) => (x: number, y: number) => Math.hypot((x + 0.5 - c[0]) / rx, (y + 0.5 - c[1]) / ry) <= 0.97;

/** A one-pixel stripe across a bar at fraction t, `half` either side of its axis: tape, piping and cuffs. */
function across(a: P, b: P, t: number, half: number, col: string, gap = 0) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, qx = a[0] + dx * t, qy = a[1] + dy * t;
  for (let s = -half; s <= half; s++) if (!gap || (s + half) % gap !== gap - 1) px(Math.floor(qx + nx * s), Math.floor(qy + ny * s), col);
}

/** Draw the rider with the sprite's top-left at (x, y). */
export function drawRiderSide(x: number, y: number) {
  const J = pose(), o = (p: P): P => [p[0] + x, p[1] + y];
  const hip = o(J.hip), sh = o(J.shoulder), head = o(J.head), elbow = o(J.elbow), hand = o(J.hand), knee = o(J.knee), ankle = o(J.ankle);
  const jacket = GEAR.jacket, jeans = GEAR.jeans, leather = GEAR.leather, helmet = GEAR.helmet, mustard = GEAR.mustard;
  const farJeans = dim(jeans, INK, 0.5), farLeather = dim(leather, INK, 0.5), farJacket = dim(jacket, INK, 0.5);

  // ---- the far side: a shade darker, nudged forward, so it sits behind the bike's near side
  const farKnee: P = [knee[0] + 2, knee[1] - 1], farAnkle: P = [ankle[0] + 3, ankle[1] - 1];
  bar(add(hip, [1, 0]), farKnee, 3.4, 3, farJeans);
  bar(farKnee, farAnkle, 2.9, 2.1, farJeans);
  bar([farAnkle[0] - 1, farAnkle[1] - 5], farAnkle, 2.6, 2.6, farLeather);
  bar([farAnkle[0] - 1, farAnkle[1] + 2], [farAnkle[0] + 8, farAnkle[1] + 3], 2.2, 2.2, farLeather);
  bar(add(sh, [2, 1]), add(elbow, [2, -1]), 2.4, 2.1, farJacket);
  bar(add(elbow, [2, -1]), add(hand, [2, -1]), 2.1, 1.9, farJacket);
  bar(add(hand, [0, -1]), add(hand, [4, 0]), 2.2, 2.2, farLeather);

  // ---- the rolled tail bag strapped over the pillion seat, the same one the rider carries in the ride's rear view
  { const t0: P = [44 + x, 23.5 + y], t1: P = [56 + x, 24 + y];
    bar(t0, t1, 3.4, 3.4, GEAR.canvas);
    across(t0, t1, 0.28, 3, leather[2]); across(t0, t1, 0.78, 3, leather[2]);                                       // two leather straps
    px(Math.floor(t0[0] + 1), Math.floor(t0[1] - 3), mustard[3]); px(Math.floor(t0[0] + 7), Math.floor(t0[1] - 2), mustard[3]); }          // a catch of light on the buckles

  // ---- the torso, a leaning capsule from hip to shoulder (a little deeper at the chest), with the jacket's hem hanging over the seat behind
  bar(add(hip, [-5, 0]), add(hip, [-1, 3]), 3, 3, jacket);
  bar(hip, sh, 6.3, 7.2, jacket);
  bar(add(sh, [-2, 1]), add(sh, [1, -1]), 5.2, 5.2, jacket);                                                     // the shoulder, rounded
  // the hem band, the zip down the front, the reflective tape across the kidneys, the piping at the yoke
  const fwd: P = [Math.cos(LEAN), Math.sin(LEAN)], rear: P = [-fwd[0], -fwd[1]];
  across(hip, sh, 0.08, 6, jacket[1]);
  for (let i = 0; i <= 14; i++) { const t = 0.1 + (i / 14) * 0.82, q = mid(hip, sh, t); px(Math.floor(q[0] + fwd[0] * 5), Math.floor(q[1] + fwd[1] * 5), '#2b1f19'); }
  across(hip, sh, 0.38, 6, GEAR.band, 3);
  across(hip, sh, 0.86, 6, mustard[2]);
  void rear;

  // ---- neck and collar, under the helmet
  bar(add(sh, [2.5, -3]), add(head, [-1, 6]), 2.4, 2.4, GEAR.skin);
  bar(add(sh, [-1, -1]), add(sh, [3.5, -3.5]), 3, 2.6, jacket);
  across(add(sh, [-1, -1]), add(sh, [3.5, -3.5]), 0.95, 3, mustard[2]);

  // ---- the near leg: thigh across the tank, shin back to the peg, the boot on it
  bar(hip, knee, 3.6, 3.1, jeans);
  bar(knee, ankle, 3.0, 2.2, jeans);
  bar(add(knee, [-1, -1]), add(knee, [1, 0]), 2.2, 2.2, jeans, undefined);                                        // the knee, a touch fuller
  bar([ankle[0] - 1, ankle[1] - 6], ankle, 2.7, 2.7, leather);
  bar([ankle[0] - 2, ankle[1] + 1.5], [ankle[0] + 8, ankle[1] + 2.5], 2.4, 2.1, leather);
  across([ankle[0] - 1, ankle[1] - 6], ankle, 0.1, 3, mustard[1]);                                                // the boot's top strap
  rect(ankle[0] - 4, ankle[1] + 4, 14, 1, '#0e0a08');                                                              // the sole

  // ---- the near arm: upper arm from the shoulder, the forearm to the grip, the glove around it
  bar(sh, elbow, 2.9, 2.4, jacket);
  bar(elbow, hand, 2.4, 2.0, jacket);
  across(sh, elbow, 0.72, 3, mustard[2]);                                                                          // piping above the elbow
  across(elbow, hand, 0.45, 3, GEAR.band, 2);
  bar(add(hand, [-2, -0.5]), add(hand, [2.5, 1]), 2.5, 2.3, leather);
  across(add(hand, [-2, -0.5]), add(hand, [2.5, 1]), 0.05, 3, mustard[2]);                                         // a mustard cuff

  // ---- the head: a full-face helmet in the tank's cream, smoked visor, a mustard stripe over the crown
  const rx = 7.3, ry = 7.6, hx = head[0], hy = head[1];
  bar([hx + 0.5, hy + 4.6], [hx + 6, hy + 5.4], 2.6, 2.2, helmet);                                                 // the chin bar
  ball(head, rx, ry, helmet);
  const inShell = inBall(head, rx, ry), vc: P = [hx + 4.4, hy - 0.8];                                              // the visor opening
  for (let yy = Math.floor(vc[1] - 5); yy <= Math.ceil(vc[1] + 5); yy++) for (let xx = Math.floor(vc[0] - 6); xx <= Math.ceil(vc[0] + 6); xx++) {
    const ux = (xx + 0.5 - vc[0]) / 4.7, uy = (yy + 0.5 - vc[1]) / 3.6, d = Math.hypot(ux, uy);
    if (d > 1.18 || !inShell(xx, yy)) continue;
    if (d > 1) { px(xx, yy, helmet[1]); continue; }                                                                // the seal around it, in shadow
    const g = Math.min(4, Math.max(0, Math.floor(1.2 + uy * 1.3 + (bayer(xx, yy) - 0.5) * 0.7)));
    px(xx, yy, GEAR.visor[g]);
    if (Math.abs(ux * 0.7 + uy * 0.9 + 0.35) < 0.14) px(xx, yy, GEAR.visor[4]);                                    // a glint across it
  }
  for (let k = 0; k <= 26; k++) {                                                                                  // the stripe, riding the curve of the dome
    const th = Math.PI * (0.86 + (k / 26) * 0.9), sx = Math.floor(hx + Math.cos(th) * (rx - 0.6)), sy = Math.floor(hy + Math.sin(th) * (ry - 0.6));
    if (!inShell(sx, sy)) continue;
    px(sx, sy - 1, mustard[3]); px(sx, sy, mustard[2]); px(sx, sy + 1, mustard[1]);
  }
  px(Math.floor(hx - 4), Math.floor(hy - 5), helmet[4]); px(Math.floor(hx - 3), Math.floor(hy - 6), helmet[4]); px(Math.floor(hx - 3), Math.floor(hy - 5), helmet[4]);   // a bright spot on the dome
}
