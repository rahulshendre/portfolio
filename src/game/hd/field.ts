// Smooth, repeatable noise for scattering things beside the road. Groves, boulder fields and clearings come from it: the old `i % n` schedules gave every
// stretch the same even beat, and the eye reads an even beat as something a machine laid out.

const hash = (n: number) => Math.abs(Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1;

/** Smooth value noise, 0 to 1: a fresh random value at every whole number, eased between them. */
export function noise(x: number): number {
  const i = Math.floor(x), f = x - i, t = f * f * (3 - 2 * f);
  return hash(i) + (hash(i + 1) - hash(i)) * t;
}

/** Three layers of it, so a drift has long swells and small ripples. 0 to 1, mostly between a quarter and three quarters. */
export function drift(x: number, seed = 0): number {
  const s = seed * 17.31;
  return noise(x + s) * 0.62 + noise(x * 2.13 + s + 8.1) * 0.28 + noise(x * 4.27 + s - 4.3) * 0.1;
}

/**
 * How thick the cover is beside segment `i` on one side (-1 left, 1 right): high is a grove, low is a clearing. `wave` is the length of a typical clump in
 * segments. The two sides drift apart, and `salt` gives each kind of thing its own pattern so trees and boulders do not land in the same places.
 */
export const grove = (i: number, side: number, wave: number, salt = 0) => drift(i / wave + side * 41.7, salt);
