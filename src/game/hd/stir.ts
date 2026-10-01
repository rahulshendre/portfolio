// The roadside hears your horn. Cows lift their heads, sheep hop, villagers wave, ducks scatter their rings. Nothing here is kept per animal: the ride says when and where it honked,
// the road says which segment it is about to draw, and each animal asks how startled it should look right now.
const clock = () => performance.now() / 1000;

/** How far ahead of the bike a honk carries, in segments, and how far behind (the ones just passing still look round). */
export const REACH_AHEAD = 26;
export const REACH_BEHIND = 3;
/** How long a honk keeps the roadside stirred, in seconds. */
export const LASTS = 2.6;

let seg = 0, honkT = -99, honkSeg = 0;

/** The road sets this just before it draws whatever stands on segment `i`. */
export const setStirSeg = (i: number) => { seg = i; };
/** The rider honked while on segment `at`. */
export function honkNow(at: number, t = clock()) { honkT = t; honkSeg = at; }
/** Forget any honk (a new ride). */
export const calmDown = () => { honkT = -99; };

/**
 * How startled whatever is being drawn now should look, 0 (calm) to 1 (head up, ears pricked). It rises fast, holds, then settles. `ph` is the animal's own number, so a herd
 * does not all look up on the same frame: each one notices a moment apart, and the farther ones a little later.
 */
export function startled(ph = 0, t = clock(), at = seg): number {
  if (at < honkSeg - REACH_BEHIND || at > honkSeg + REACH_AHEAD) return 0;
  const age = t - honkT - (ph % 1) * 0.3 - Math.max(0, at - honkSeg) * 0.012;
  if (age < 0 || age > LASTS) return 0;
  return Math.min(1, age / 0.12) * Math.min(1, (LASTS - age) / 0.9);
}
