// Rain puddles on the Bliss land's road and verge. Where they lie depends only on the segment, so the road can paint them and the bike can find out it rode through one.
import { rnd } from './draw';
import { FINISH } from './track-ladakh';

/** Puddles sit one to a block of this many segments, in about one block in four. */
export const BLOCK = 6;
export interface Puddle {
  /** the first segment it covers, and how many */
  from: number; len: number;
  /** the middle of it across the road (road half-widths from the centre line) and its half-width */
  o: number; w: number;
}

const cache = new Map<number, Puddle | null>();

/** The puddle in block `b`, if there is one. */
export function puddleIn(b: number): Puddle | null {
  if (cache.has(b)) return cache.get(b)!;
  const r = rnd(b * 3.7 + 11), start = b * BLOCK, len = 3 + Math.floor(rnd(b * 5.3 + 2) * 3);                 // three to five segments long
  let p: Puddle | null = null;
  if (r < 0.25 && start > 14 && start < FINISH - 24) {
    const side = rnd(b * 7.9 + 5), w = 0.15 + rnd(b * 2.9 + 8) * 0.2;
    const o = side < 0.8 ? (rnd(b * 4.1 + 3) - 0.5) * 1.7 : (rnd(b * 6.1 + 9) > 0.5 ? 1 : -1) * (1.3 + rnd(b * 1.7) * 0.5);   // mostly on the tarmac, now and then on the verge
    p = { from: start + 1, len, o, w };
  }
  cache.set(b, p);
  return p;
}

/** The puddle covering segment `i`, if any. */
export function puddleAt(i: number): Puddle | null {
  const p = puddleIn(Math.floor(i / BLOCK));
  return p && i >= p.from && i < p.from + p.len ? p : null;
}

/** How wide the puddle is a fraction `f` (0 to 1) of the way along it: an ellipse, so a round puddle in perspective. */
export const puddleHalf = (p: Puddle, f: number) => p.w * Math.sqrt(Math.max(0, 1 - (2 * f - 1) ** 2));

/** The puddle the bike is in, at world position `z` (in segments, fractions allowed) and road offset `px`, if any. `half` is the bike's own half-width. */
export function inPuddle(z: number, px: number, half = 0.1): Puddle | null {
  const p = puddleAt(Math.floor(z));
  if (!p) return null;
  const f = (z - p.from) / p.len;
  return Math.abs(px - p.o) < puddleHalf(p, f) + half * 0.5 ? p : null;
}
