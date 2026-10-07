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
function tone(nx: number, ny: number, x: number, y: number, ramp: Ramp, soft = 0.5, bias = 0): string {
  const z = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
  const lam = nx * LIGHT[0] + ny * LIGHT[1] + z * LIGHT[2], t = Math.min(1, Math.max(0, 0.5 + bias + (lam - LIGHT[2]) * 0.95));   // a face turned straight at you sits on the body tone; toward the light climbs the ramp, away from it falls
  const i = Math.floor(t * 4 + (bayer(x, y) - 0.5) * soft + 0.5);
  return ramp[Math.max(0, Math.min(4, i))];
}
const px = (x: number, y: number, col: string) => rect(x, y, 1, 1, col);

/** One round piece of a figure: where a pixel falls on it (inside, on its outline, or neither), and which way the surface there faces. */
type Piece = { box: [number, number, number, number]; at: (cx: number, cy: number) => { in: boolean; ring: boolean; nx: number; ny: number } | null };

/** A tube from a to b whose radius runs ra to rb. */
function tube(a: P, b: P, ra: number, rb: number): Piece {
  const dx = b[0] - a[0], dy = b[1] - a[1], len2 = dx * dx + dy * dy || 1, R = Math.max(ra, rb) + 1.5;
  return {
    box: [Math.floor(Math.min(a[0], b[0]) - R), Math.floor(Math.min(a[1], b[1]) - R), Math.ceil(Math.max(a[0], b[0]) + R), Math.ceil(Math.max(a[1], b[1]) + R)],
    at: (cx, cy) => {
      const t = Math.min(1, Math.max(0, ((cx - a[0]) * dx + (cy - a[1]) * dy) / len2)), qx = a[0] + dx * t, qy = a[1] + dy * t, r = ra + (rb - ra) * t, d = Math.hypot(cx - qx, cy - qy);
      if (d > r + 1) return null;
      return { in: d <= r, ring: d > r, nx: (cx - qx) / (d > r ? d : r), ny: (cy - qy) / (d > r ? d : r) };
    },
  };
}
/** An egg-shaped piece, for the helmet. */
function egg(c: P, rx: number, ry: number): Piece {
  const e = 1 / Math.min(rx, ry);
  return {
    box: [Math.floor(c[0] - rx - 2), Math.floor(c[1] - ry - 2), Math.ceil(c[0] + rx + 2), Math.ceil(c[1] + ry + 2)],
    at: (cx, cy) => {
      const ux = (cx - c[0]) / rx, uy = (cy - c[1]) / ry, d = Math.hypot(ux, uy);
      if (d > 1 + e) return null;
      return { in: d <= 1, ring: d > 1, nx: d > 1 ? ux / d : ux, ny: d > 1 ? uy / d : uy };
    },
  };
}

/**
 * Paint pieces of one material as a single solid. The outline of the whole group goes down first and the fills over it, so where two pieces overlap (the hem and the torso, the thigh and the
 * shin) there is no seam, only the silhouette. The outline turns to the ramp's own shadow where it faces the light, so the lit side is soft and the dark side crisp. `bias` brightens or darkens the group.
 */
function solid(pieces: Piece[], ramp: Ramp, bias = 0) {
  for (const p of pieces) for (let y = p.box[1]; y <= p.box[3]; y++) for (let x = p.box[0]; x <= p.box[2]; x++) {
    const h = p.at(x + 0.5, y + 0.5);
    if (h && h.ring) px(x, y, h.nx * LIGHT[0] + h.ny * LIGHT[1] > 0.25 ? ramp[0] : INK);
  }
  for (const p of pieces) for (let y = p.box[1]; y <= p.box[3]; y++) for (let x = p.box[0]; x <= p.box[2]; x++) {
    const h = p.at(x + 0.5, y + 0.5);
    if (h && h.in) px(x, y, tone(h.nx, h.ny, x, y, ramp, 0.5, bias));
  }
}
/** A patch on top of a garment: fill only, no outline, so it sits on the cloth. */
function patch(p: Piece, ramp: Ramp) {
  for (let y = p.box[1]; y <= p.box[3]; y++) for (let x = p.box[0]; x <= p.box[2]; x++) { const h = p.at(x + 0.5, y + 0.5); if (h && h.in) px(x, y, tone(h.nx, h.ny, x, y, ramp)); }
}
const bar = (a: P, b: P, ra: number, rb: number, ramp: Ramp) => solid([tube(a, b, ra, rb)], ramp);
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
  const jacket = GEAR.jacket, jeans = GEAR.jeans, leather = GEAR.leather, helmet = GEAR.helmet, accent = GEAR.accent;
  const farJeans = dim(jeans, INK, 0.5), farLeather = dim(leather, INK, 0.5), farJacket = dim(jacket, INK, 0.5);

  // ---- the far side: a shade darker and nudged forward, so it sits behind the bike's near side
  const farKnee: P = [knee[0] + 2, knee[1] - 1], farAnkle: P = [ankle[0] + 3, ankle[1] - 1];
  solid([tube(add(hip, [1, 0]), farKnee, 3.4, 3), tube(farKnee, farAnkle, 2.9, 2.1)], farJeans);
  solid([tube([farAnkle[0] - 1, farAnkle[1] - 5], farAnkle, 2.6, 2.6), tube([farAnkle[0] - 1, farAnkle[1] + 2], [farAnkle[0] + 8, farAnkle[1] + 3], 2.2, 2.2)], farLeather);
  solid([tube(add(sh, [2, 1]), add(elbow, [2, -1]), 2.4, 2.1), tube(add(elbow, [2, -1]), add(hand, [2, -1]), 2.1, 1.9)], farJacket);
  solid([tube(add(hand, [0, -1]), add(hand, [4, 0]), 2.2, 2.2)], farLeather);

  // ---- the rolled tail bag strapped over the pillion seat, the same one the rider carries in the ride's rear view
  { const t0: P = [44 + x, 23.5 + y], t1: P = [56 + x, 24 + y];
    bar(t0, t1, 3.4, 3.4, GEAR.canvas);
    across(t0, t1, 0.28, 3, leather[2]); across(t0, t1, 0.78, 3, leather[2]);                                       // two leather straps
    px(Math.floor(t0[0] + 1), Math.floor(t0[1] - 3), accent[3]); px(Math.floor(t0[0] + 7), Math.floor(t0[1] - 2), accent[3]); }   // a catch of light on the buckles

  // ---- the jacket: the hem hanging over the seat, the body leaning from the hip, the rounded shoulder, as one solid
  solid([tube(add(hip, [-5, 0]), add(hip, [-1, 3]), 3, 3), tube(hip, sh, 6.3, 7.2), tube(add(sh, [-2, 1]), add(sh, [1, -1]), 5.2, 5.2)], jacket);
  const fwd: P = [Math.cos(LEAN), Math.sin(LEAN)];
  across(hip, sh, 0.08, 6, jacket[1]);                                                                              // the hem band
  for (let i = 0; i <= 14; i++) { const q = mid(hip, sh, 0.1 + (i / 14) * 0.82); px(Math.floor(q[0] + fwd[0] * 5), Math.floor(q[1] + fwd[1] * 5), jacket[0]); }   // the zip down the front
  across(hip, sh, 0.38, 6, GEAR.band, 3);                                                                           // broken reflective tape across the kidneys
  across(hip, sh, 0.86, 6, accent[2]);                                                                              // piping along the yoke

  // ---- neck, and a leather collar
  solid([tube(add(sh, [2.5, -3]), add(head, [-1, 6]), 2.4, 2.4)], GEAR.skin);
  solid([tube(add(sh, [-1, -1]), add(sh, [3.5, -3.5]), 3, 2.6)], leather, 0.08);
  across(add(sh, [-1, -1]), add(sh, [3.5, -3.5]), 0.95, 3, accent[2]);

  // ---- the near leg: thigh across the tank and shin back to the peg as one solid, then the boot
  solid([tube(hip, knee, 3.6, 3.1), tube(knee, ankle, 3.0, 2.2)], jeans);
  px(Math.floor(knee[0] - 1), Math.floor(knee[1] - 3), jeans[4]); px(Math.floor(knee[0]), Math.floor(knee[1] - 3), jeans[3]);   // a catch of light on the knee
  solid([tube([ankle[0] - 1, ankle[1] - 6], ankle, 2.7, 2.7), tube([ankle[0] - 2, ankle[1] + 1.5], [ankle[0] + 8, ankle[1] + 2.5], 2.4, 2.1)], leather);
  across([ankle[0] - 1, ankle[1] - 6], ankle, 0.1, 3, accent[1]);                                                  // the boot's top strap
  rect(ankle[0] - 4, ankle[1] + 4, 14, 1, '#0e0a08');                                                              // the sole

  // ---- the near arm, upper arm and forearm as one sleeve, a leather elbow patch, piping, tape, then the glove
  solid([tube(sh, elbow, 2.9, 2.4), tube(elbow, hand, 2.4, 2.0)], jacket);
  patch(tube(add(elbow, [-1, 0]), add(elbow, [0, 1]), 1.7, 1.7), leather);
  across(sh, elbow, 0.72, 3, accent[2]);
  across(elbow, hand, 0.55, 3, GEAR.band, 2);
  solid([tube(add(hand, [-2, -0.5]), add(hand, [2.5, 1]), 2.5, 2.3)], leather);
  across(add(hand, [-2, -0.5]), add(hand, [2.5, 1]), 0.05, 3, accent[2]);                                          // a gold cuff

  // ---- the head: a full-face helmet in the tank's cream, a smoked visor, a gold stripe over the crown
  const rx = 7.3, ry = 7.6, hx = head[0], hy = head[1], shell = inBall(head, rx, ry);
  solid([egg(head, rx, ry), tube([hx + 0.5, hy + 4.6], [hx + 6, hy + 5.4], 2.6, 2.2)], helmet, 0.1);
  const vc: P = [hx + 4.1, hy - 0.5];                                                                              // the visor, a rounded window across the front
  for (let yy = Math.floor(vc[1] - 5); yy <= Math.ceil(vc[1] + 5); yy++) for (let xx = Math.floor(vc[0] - 6); xx <= Math.ceil(vc[0] + 6); xx++) {
    const ux = (xx + 0.5 - vc[0]) / 4.8, uy = (yy + 0.5 - vc[1]) / 3.3, d = Math.hypot(ux, uy);
    if (d > 1.2 || !shell(xx, yy)) continue;
    if (d > 1) { px(xx, yy, uy < -0.2 ? helmet[3] : helmet[1]); continue; }                                       // the seal: lit on top, shaded below
    px(xx, yy, GEAR.visor[Math.min(4, Math.max(0, Math.floor(1.1 + uy * 1.4 + (bayer(xx, yy) - 0.5) * 0.7)))]);
    if (Math.abs(ux * 0.8 + uy * 0.9 + 0.4) < 0.13) px(xx, yy, GEAR.visor[4]);                                     // a glint across it
  }
  for (let k = 0; k <= 28; k++) {                                                                                  // the stripe, riding the curve of the dome
    const th = Math.PI * (0.84 + (k / 28) * 0.86), sx = Math.floor(hx + Math.cos(th) * (rx - 0.6)), sy = Math.floor(hy + Math.sin(th) * (ry - 0.6));
    if (!shell(sx, sy)) continue;
    px(sx, sy - 1, accent[3]); px(sx, sy, accent[2]); px(sx, sy + 1, accent[1]);
  }
  px(Math.floor(hx + 2), Math.floor(hy + 7), helmet[0]); px(Math.floor(hx + 3), Math.floor(hy + 7), helmet[0]); px(Math.floor(hx + 4), Math.floor(hy + 7), helmet[0]);          // a vent in the chin bar
  px(Math.floor(hx - 4), Math.floor(hy - 5), helmet[4]); px(Math.floor(hx - 3), Math.floor(hy - 6), helmet[4]); px(Math.floor(hx - 3), Math.floor(hy - 5), helmet[4]);          // a bright spot on the dome
}
