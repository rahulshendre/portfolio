// Hand-placed pixel art, painted once into offscreen canvases with the crisp primitives.
// Sizes are in pixels at the 480x270 resolution; `ww` is the width in road units for scaling.
import { C } from './palette';
import { paint, type Sprite } from '../engine/sprites';
import { rect, disc, ellipse, line, poly } from '../engine/pixel';
import { text, textC, textW } from '../engine/font';

/** Rahul on the white Scrambler 400 X, seen from behind. Black helmet, dark jacket. */
export function riderRear(): Sprite {
  return paint(56, 64, () => {
    // rear tyre, knobby, with the hugger above it
    rect(23, 46, 10, 18, C.tyre);
    for (let y = 47; y < 63; y += 3) { rect(22, y, 1, 2, C.tyreKnob); rect(33, y, 1, 2, C.tyreKnob); }
    rect(26, 47, 4, 16, '#202020');
    rect(21, 44, 14, 3, C.black);
    // Indian private number plate: white with black characters
    rect(19, 36, 18, 9, C.ink); rect(20, 37, 16, 7, '#f4f2ea');
    for (const x of [21, 24, 28, 31]) rect(x, 39, 2, 3, C.ink);
    // tail light and indicators
    rect(23, 32, 10, 3, C.red); rect(25, 33, 6, 1, '#ff8a6a');
    rect(15, 33, 3, 2, C.reflector); rect(38, 33, 3, 2, C.reflector);
    // exhaust sits on the right
    rect(38, 37, 7, 10, C.steelDark); rect(39, 37, 5, 9, C.steel); rect(40, 45, 3, 2, C.ink);
    // brown seat tail
    rect(20, 29, 16, 4, C.seat); rect(20, 29, 16, 1, '#6e4c36');
    // white tank peeking out beside the hips
    rect(13, 23, 6, 9, C.white); rect(37, 23, 6, 9, C.white);
    rect(13, 30, 6, 2, C.whiteShade); rect(37, 30, 6, 2, C.whiteShade);
    // legs, boots on the pegs
    poly([[11, 25], [20, 25], [21, 40], [15, 42], [11, 34]], C.jeans);
    poly([[36, 25], [45, 25], [45, 34], [41, 42], [35, 40]], C.jeans);
    rect(12, 26, 2, 9, C.jeansLight);
    rect(10, 40, 9, 5, C.black); rect(37, 40, 9, 5, C.black);
    rect(8, 43, 3, 2, C.steelDark); rect(45, 43, 3, 2, C.steelDark);
    // jacket
    poly([[14, 12], [42, 12], [40, 30], [16, 30]], C.jacket);
    poly([[14, 12], [19, 12], [19, 29], [16, 30]], C.jacketLight);
    rect(27, 13, 2, 15, C.jacketLight);
    rect(17, 28, 22, 2, '#23252c');
    // arms out to the bars, gloves, handguards
    poly([[15, 13], [21, 14], [10, 23], [5, 22]], C.jacket);
    poly([[41, 13], [35, 14], [46, 23], [51, 22]], C.jacket);
    rect(3, 20, 6, 5, C.black); rect(47, 20, 6, 5, C.black);
    rect(0, 18, 4, 8, '#2a2a2e'); rect(52, 18, 4, 8, '#2a2a2e');
    // round mirrors on stalks
    line(5, 19, 4, 11, C.black); line(50, 19, 51, 11, C.black);
    disc(4, 8, 3, C.black); disc(51, 8, 3, C.black);
    rect(3, 7, 2, 2, '#8fb3bf'); rect(50, 7, 2, 2, '#8fb3bf');
    // collar and black helmet with a highlight
    rect(22, 11, 12, 3, '#23252c');
    disc(28, 7, 7, C.black);
    rect(23, 2, 4, 2, '#4a4d57'); rect(22, 4, 2, 3, '#4a4d57');
    rect(26, 12, 4, 1, C.reflector);
  }, 233);
}

/** Same rider from above, for the top-down camera. */
export function riderTop(): Sprite {
  return paint(22, 44, () => {
    rect(9, 0, 4, 9, C.tyre); rect(9, 35, 4, 9, C.tyre);
    rect(8, 8, 1, 3, C.gold); rect(13, 8, 1, 3, C.gold);
    rect(2, 10, 18, 2, C.black);
    rect(0, 9, 3, 4, '#2a2a2e'); rect(19, 9, 3, 4, '#2a2a2e');
    disc(3, 6, 1, C.black); disc(18, 6, 1, C.black);
    ellipse(11, 16, 5, 5, C.white); rect(10, 12, 2, 8, C.whiteShade);
    rect(8, 22, 6, 12, C.seat);
    ellipse(11, 23, 8, 4, C.jacket);
    line(4, 22, 3, 12, C.jacket); line(5, 22, 4, 12, C.jacket);
    line(18, 22, 19, 12, C.jacket); line(17, 22, 18, 12, C.jacket);
    rect(9, 26, 5, 6, C.jacket);
    disc(11, 20, 4, C.black); rect(9, 17, 2, 2, '#4a4d57');
    rect(10, 34, 2, 2, C.red);
  }, 233);
}

/** Auto-rickshaw from behind: yellow canopy, black body, yellow commercial plate. */
export function autoRear(): Sprite {
  return paint(48, 44, () => {
    poly([[4, 15], [8, 3], [40, 3], [44, 15]], C.accent);
    rect(9, 3, 30, 2, '#f3cf52');
    rect(3, 15, 42, 3, C.accent);
    rect(3, 18, 42, 2, C.black);
    rect(7, 20, 34, 9, '#2a2620');
    disc(16, 24, 3, '#3b2f27'); disc(29, 23, 3, '#3b2f27');
    rect(12, 26, 9, 3, '#6a4e8a'); rect(25, 26, 9, 3, '#b8563a');
    rect(3, 29, 42, 9, '#1f1f1f'); rect(3, 29, 42, 1, '#3a3a3a');
    rect(17, 31, 14, 5, C.accent); for (const x of [19, 22, 26, 28]) rect(x, 33, 1, 2, C.ink);
    rect(5, 31, 4, 3, C.red); rect(39, 31, 4, 3, C.red);
    rect(4, 37, 7, 7, C.tyre); rect(37, 37, 7, 7, C.tyre);
    rect(6, 39, 3, 3, C.steelDark); rect(39, 39, 3, 3, C.steelDark);
  }, 380);
}

/** Indian goods truck from behind, painted tailgate and all. */
export function truckRear(): Sprite {
  return paint(64, 76, () => {
    rect(10, 0, 44, 6, '#e86a1f'); rect(12, 1, 40, 2, '#f08a45');
    rect(2, 6, 60, 50, '#c8312b');
    rect(4, 8, 56, 5, C.accent); for (let x = 6; x < 58; x += 6) rect(x, 9, 3, 3, '#2c5aa0');
    rect(4, 14, 56, 18, C.white);
    textC('HORN OK', 32, 15, C.red);
    textC('PLEASE', 32, 24, '#2c5aa0');
    rect(4, 33, 56, 3, '#2f8f4e');
    rect(4, 37, 56, 14, '#2c5aa0');
    disc(14, 44, 3, C.accent); disc(32, 44, 4, '#e86a1f'); disc(50, 44, 3, C.accent);
    rect(4, 51, 56, 3, C.accent);
    rect(0, 56, 64, 5, '#1f1f1f');
    rect(3, 57, 6, 3, C.red); rect(55, 57, 6, 3, C.red);
    rect(26, 57, 12, 3, C.accent);
    rect(4, 61, 16, 11, C.tyre); rect(44, 61, 16, 11, C.tyre);
    rect(16, 61, 32, 3, '#111');
    rect(6, 61, 10, 12, C.black); rect(48, 61, 10, 12, C.black);
    for (let x = 7; x < 16; x += 2) { rect(x, 73, 1, 3, C.red); rect(x + 42, 73, 1, 3, C.red); }
  }, 680);
}

export function neem(): Sprite {
  return paint(64, 80, () => {
    rect(29, 46, 6, 34, C.trunk); rect(29, 46, 2, 34, '#6e4f36');
    line(32, 52, 20, 40, C.trunk); line(32, 50, 44, 40, C.trunk);
    disc(32, 30, 20, C.leafDark); disc(18, 36, 13, C.leafDark); disc(46, 36, 13, C.leafDark);
    disc(28, 24, 11, C.leaf); disc(41, 29, 9, C.leaf); disc(19, 32, 8, C.leaf);
    disc(24, 19, 5, C.leafLight); disc(36, 22, 4, C.leafLight); disc(15, 29, 3, C.leafLight);
  }, 900);
}

export function eucalyptus(): Sprite {
  return paint(40, 96, () => {
    rect(18, 30, 4, 66, '#d6ccb9'); rect(18, 30, 1, 66, '#efe7d6'); rect(21, 40, 1, 40, '#b3a68f');
    line(20, 44, 10, 30, '#b3a68f'); line(20, 38, 30, 26, '#b3a68f');
    disc(20, 16, 12, C.leafDark); disc(10, 26, 8, C.leafDark); disc(30, 22, 8, C.leafDark);
    disc(18, 12, 7, '#5f8a53'); disc(28, 18, 5, '#5f8a53'); disc(10, 23, 4, '#5f8a53');
  }, 700);
}

export function chaiStall(label: string): Sprite {
  return paint(72, 56, () => {
    rect(18, 0, 36, 11, C.ink); textC(label, 36, 2, C.accent);
    rect(0, 11, 72, 10, C.white);
    for (let x = 0; x < 72; x += 8) rect(x, 11, 4, 10, C.red);
    for (let x = 2; x < 72; x += 8) disc(x, 21, 2, C.red);
    rect(4, 21, 3, 35, C.woodDark); rect(65, 21, 3, 35, C.woodDark);
    rect(7, 22, 58, 13, '#3b2f27');
    rect(6, 35, 60, 14, C.wood); rect(6, 35, 60, 2, C.woodDark); rect(6, 42, 60, 1, C.woodDark);
    disc(20, 31, 3, C.steel); rect(18, 27, 4, 1, C.steelDark);
    for (const x of [30, 34, 38]) rect(x, 30, 2, 5, '#e9dcc0');
    rect(0, 49, 72, 7, '#6b5a45');
  }, 1000);
}

/** Green Indian highway direction board. */
export function highwaySign(label: string, sub: string): Sprite {
  const w = Math.max(textW(label), textW(sub)) + 14;
  return paint(w, 44, () => {
    rect(8, 28, 3, 16, C.steelDark); rect(w - 11, 28, 3, 16, C.steelDark);
    rect(0, 0, w, 28, '#f1efe9'); rect(1, 1, w - 2, 26, '#1f6b3a');
    textC(label, w / 2, 4, '#f1efe9');
    textC(sub, w / 2, 15, C.accent);
  }, 1100);
}

/** The garage at the end of the road, seen from the highway. */
export function garageRoadside(): Sprite {
  return paint(170, 110, () => {
    poly([[0, 24], [85, 0], [170, 24]], '#7a4a32');
    rect(4, 24, 162, 86, '#d9cbb2');
    for (let y = 30; y < 110; y += 8) rect(4, y, 162, 1, '#cbbd9f');
    rect(30, 36, 110, 74, '#3a3833');
    for (let y = 38; y < 110; y += 4) rect(31, y, 108, 3, '#8b8f94');
    graffitiTag(40, 58, 1);
    rect(56, 26, 58, 9, C.ink); textC('GARAGE', 85, 27, C.accent);
    rect(0, 106, 170, 4, '#6b5a45');
  }, 3000);
}

/** SHENDRE in chunky outlined letters with drips, like a spray tag. */
export function graffitiTag(x: number, y: number, s: number) {
  const word = 'SHENDRE';
  const w = textW(word, 2 * s);
  for (const [ox, oy] of [[-s, 0], [s, 0], [0, -s], [0, s], [s, s], [2 * s, 2 * s]]) text(word, x + ox, y + oy, C.ink, 2 * s);
  text(word, x, y, C.reflector, 2 * s);
  for (const [dx, len] of [[4, 5], [23, 8], [41, 4], [60, 7], [76, 5]]) if (dx * s < w) rect(x + dx * s, y + 14 * s, s, len * s, C.reflector);
}
