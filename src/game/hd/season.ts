// The seasons of the road. Every lap of the endless ride (a round: the three chapters, then the next three) wears one season, rolled when the lap is planned; the first lap is always green, the
// road as designed. In the last stretch of a lap the road eases toward the next season, and each tree picks its own side of the change, so autumn creeps in over a few hundred metres and never pops.
// The weather of the lap is rolled with it, so winter brings snow and a damp autumn brings fog: the lap has a mood, not just a tint.
import type { Sky } from './air';

export type Season = 'green' | 'gold' | 'frost';
export const SEASONS: readonly Season[] = ['green', 'gold', 'frost'];
/** What the banner calls them (the Himalaya has no spring to speak of, and the Bliss hills do not mind). */
export const SEASON_NAMES: Record<Season, string> = { green: 'SUMMER', gold: 'AUTUMN', frost: 'WINTER' };

let CURRENT: Season = 'green';
/** The season the props about to be drawn belong to (set per prop by the road, read by the trees and flowers, like the land). */
export const getSeason = () => CURRENT;
export const setSeason = (s: Season) => { CURRENT = s; };

/** The next lap's season from a roll in [0, 1): never the same twice running; autumn and summer are likelier than a hard winter. */
export function nextSeason(prev: Season, roll: number): Season {
  const pool: [Season, number][] = prev === 'green' ? [['gold', 0.6], ['frost', 0.4]] : prev === 'gold' ? [['green', 0.45], ['frost', 0.55]] : [['green', 0.45], ['gold', 0.55]];
  return roll < pool[0][1] ? pool[0][0] : pool[1][0];
}

/** The weather of a lap from a roll in [0, 1): winter is mostly snow, autumn is misty, summer is mostly clear with the odd storm. */
export function weatherFor(season: Season, roll: number): Sky {
  const table: Record<Season, [Sky, number][]> = {
    green: [['clear', 0.62], ['fog', 0.2], ['rain', 0.18]],
    gold: [['clear', 0.5], ['fog', 0.32], ['rain', 0.18]],
    frost: [['snow', 0.55], ['fog', 0.2], ['clear', 0.25]],
  };
  let acc = 0;
  for (const [sky, p] of table[season]) { acc += p; if (roll < acc) return sky; }
  return table[season][0][0];
}

/** What a stretch of road is wearing: its season, easing toward the next one by `blend` (0 to 1). */
export interface Dressed { season: Season; nextSeason?: Season; blend?: number }

/** The season one prop wears: past the lap's change, a share of the trees (the share grows with `blend`) have already turned. `key` is any stable number for that prop. */
export function seasonFor(s: Partial<Dressed>, key: number): Season {
  if (!s.blend || !s.nextSeason) return s.season ?? 'green';
  const r = Math.abs(Math.sin(key * 12.9898 + 78.233) * 43758.5453) % 1;
  return r < s.blend ? s.nextSeason : s.season ?? 'green';
}

/** A ground colour dressed for a season: autumn pulls it toward ochre, winter toward snow. `warm` and `cold` are the colours it leans toward; `a` is how hard (0 to 1). */
export function leanSeason(mixFn: (a: string, b: string, t: number) => string, col: string, season: Season, ochre: string, snow: string, a = 1): string {
  return season === 'gold' ? mixFn(col, ochre, 0.4 * a) : season === 'frost' ? mixFn(col, snow, 0.55 * a) : col;
}

/** How deep in winter a stretch of road is (0 to 1): all the way in a winter lap, and easing in or out across the change at a lap's end. */
export function winterK(s: Partial<Dressed>): number {
  const b = s.blend ?? 0;
  return (s.season === 'frost' ? 1 - b : 0) + (s.nextSeason === 'frost' ? b : 0);
}
