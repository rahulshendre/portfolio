// Shared ways of making a flat pixel surface look like a real material: pores, streaks, stains, cracks, bevels, grain.
// Everything is deterministic (seeded hashes), so a surface looks the same on every visit. Draws with the current pixel context.
import { bayer, rect } from '../engine/pixel';

// How worn everything looks: 1 is the full battered look (the door), lower is a cared-for room. Scenes set it around their painting with withWear.
let level = 1;
export function withWear<T>(k: number, paintIt: () => T): T {
  const before = level;
  level = k;
  try { return paintIt(); } finally { level = before; }
}

const frac = (v: number) => v - Math.floor(v);
export const hash = (i: number, s = 0) => frac(Math.sin(i * 127.1 + s * 311.7) * 43758.5453);
const at = (x: number, y: number, s = 0) => hash(x * 57 + y * 131, s);

/** Random pixels of one colour over an area: pores, grit, flecks, chipped paint. */
export function speckle(x: number, y: number, w: number, h: number, col: string, density: number, seed = 0) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (at(x + i, y + j, seed) < density * level) rect(x + i, y + j, 1, 1, col);
}

/** Rain and grime streaks running down from the top edge of an area, broken up as they go. */
export function streaks(x: number, y: number, w: number, h: number, col: string, count: number, seed = 0) {
  for (let k = 0; k < Math.ceil(count * level * level); k++) {
    const sx = x + Math.floor(hash(k, seed) * w), len = Math.floor(6 + hash(k, seed + 1) * (h - 6)), wide = hash(k, seed + 2) > 0.75 ? 2 : 1;
    for (let j = 0; j < len; j++) if (hash(k * 97 + j, seed + 3) > 0.15 + (j / len) * 0.45) rect(sx, y + j, wide, 1, col);
  }
}

/** A soft dithered blob with an uneven edge: damp patches, oil, soot. */
export function stain(cx: number, cy: number, rx: number, ry: number, col: string, seed = 0, strength = 0.9) {
  for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) {
    const d = Math.hypot(i / rx, j / ry), wob = 0.85 + 0.3 * hash(Math.floor(i / 3) * 31 + Math.floor(j / 3), seed);
    if (d < wob && (1 - d / wob) * strength * level > bayer(cx + i, cy + j)) rect(cx + i, cy + j, 1, 1, col);
  }
}

/** A jagged crack that wanders downward (dir leans it left or right), with a branch now and then. */
export function crack(x: number, y: number, len: number, col: string, seed = 0, dir = 1) {
  if (level < 0.5) return; // a cared-for room has no cracks
  let cx = x, cy = y;
  for (let k = 0; k < len; k++) {
    rect(cx, cy, 1, 1, col);
    cy += 1; cx += Math.round((hash(k, seed) - 0.5 + dir * 0.18) * 2);
    if (hash(k, seed + 5) > 0.92) rect(cx + 1, cy, 2, 1, col);
  }
}

/** A lit edge on top and left, a shadow on bottom and right: turns a flat rectangle into an object. */
export function bevel(x: number, y: number, w: number, h: number, light: string, dark: string) {
  rect(x, y, w, 1, light); rect(x, y, 1, h, light); rect(x, y + h - 1, w, 1, dark); rect(x + w - 1, y, 1, h, dark);
}

/** Wood: dark grain lines that wave a little, a lit top edge, and a knot or two on long pieces. */
export function woodGrain(x: number, y: number, w: number, h: number, base: string, dark: string, light: string, seed = 0) {
  rect(x, y, w, h, base);
  for (let j = 2; j < h - 1; j += 3) for (let i = 0; i < w; i++) if (hash(i * 3 + j, seed) > 0.35) rect(x + i, y + j + Math.round(Math.sin(i * 0.11 + j) * 0.6), 1, 1, dark);
  rect(x, y, w, 1, light);
  for (let k = 0; k < Math.floor(w / 60); k++) {
    const kx = x + 8 + Math.floor(hash(k, seed + 9) * (w - 16)), ky = y + 2 + Math.floor(hash(k, seed + 8) * Math.max(1, h - 5));
    rect(kx, ky, 3, 2, dark); rect(kx + 1, ky, 1, 1, base);
  }
}

/** Cobweb across a corner: fine light threads from the corner point, with arcs between them. */
export function cobweb(cx: number, cy: number, r: number, sx: number, sy: number, col: string) {
  if (level < 0.5) return;
  for (let k = 0; k < 3; k++) {
    const a = (k / 2) * (Math.PI / 2), ex = cx + Math.round(sx * Math.cos(a) * r), ey = cy + Math.round(sy * Math.sin(a) * r);
    const n = Math.max(Math.abs(ex - cx), Math.abs(ey - cy));
    for (let t = 0; t <= n; t++) rect(cx + Math.round(((ex - cx) * t) / n), cy + Math.round(((ey - cy) * t) / n), 1, 1, col);
  }
  for (const f of [0.45, 0.75]) for (let t = 0; t < 8; t++) {
    const a0 = (t / 8) * (Math.PI / 2) * 1, sag = Math.sin((t / 8) * Math.PI) * 1.5;
    rect(cx + Math.round(sx * Math.cos(a0) * r * f), cy + Math.round(sy * (Math.sin(a0) * r * f + sag)), 1, 1, col);
  }
}
