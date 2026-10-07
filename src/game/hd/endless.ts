// The endless road. The three chapters of the Ladakh track are dealt out in a shuffled order, round after round, with the trees, rocks, houses and animals of every stretch rolled afresh,
// so the ride never runs out and never repeats itself exactly. Stretches are built a little ahead of the bike and let go once it is well past.
import type { Sky } from './air';
import type { Extra } from './meadow';
import { nextSeason, weatherFor, winterK, type Season } from './season';
import { buildTrack, CHAPTERS, FINISH, LANE_FROM, LANE_G, type ChapterId, type Segment } from './track-ladakh';

/** A segment of the endless road. `i` counts from the start of the ride; `src` is where the same stretch lies in the Ladakh track, for everything that depends on the place (towns, river, lake, altitude). */
export interface VSeg extends Segment {
  src: number;
  /** the dice that rolled this stretch's scenery */
  salt: number;
  /** which lap of the ride this stretch is in (0 for the first), the season and weather of that lap, and, in the last stretch of a lap, the season it is easing toward and how far (0 to 1) */
  round: number;
  season: Season;
  weather: Sky;
  nextSeason?: Season;
  blend?: number;
  /** what the renderer has already worked out for this stretch, kept so a frame never repeats the work */
  extras?: readonly Extra[];
  merged?: readonly unknown[];
}

interface Planned { id: ChapterId; v0: number; len: number; built: boolean }

/** A small seeded dice, so a ride can be replayed (`?seed=`) and the tests can be exact. */
export function dice(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const CANON: ChapterId[] = ['leh', 'valley', 'high'];
const GARAGE_AT = FINISH - CHAPTERS[2].from;

export class World {
  /** Sparse: segments far behind the bike are dropped to keep memory flat. */
  readonly segs: (VSeg | undefined)[] = [];
  private plan: Planned[] = [];
  private end = 0;                    // where the planned road ends
  private built = 0;                  // how many planned chapters have segments
  private dropped = 0;
  private msN = 0;
  private last: ChapterId | null = null;
  private queue: ChapterId[] = [];
  /** The season and weather of each lap, rolled as the ride reaches it. The first lap is summer and clear, the road as designed. */
  private rounds: { season: Season; weather: Sky }[];

  /**
   * @param milestones the career markers that line the road; they keep their story order however the chapters fall
   * @param rand the dice
   * @param fixed deal the first round in the original order (Leh, the valley, the pass), as the share card and `?at=` jumps expect
   */
  constructor(private milestones: readonly { top: string; label: string }[], private rand: () => number = Math.random, fixed = false, opts: { season?: Season } = {}) {
    this.rounds = [{ season: opts.season ?? 'green', weather: 'clear' }];
    if (fixed) { this.queue = [...CANON]; this.last = 'high'; }
    else { const rest = this.shuffle<ChapterId>(['valley', 'high']); this.queue = ['leh', ...rest]; }   // a ride always starts in Leh
    this.planTo(1);
  }

  private shuffle<T>(a: T[]): T[] {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  private nextId(): ChapterId {
    if (!this.queue.length) {
      const round = this.shuffle([...CANON]);
      if (round[0] === this.last) [round[0], round[2]] = [round[2], round[0]];           // never the same chapter twice running
      this.queue = round;
    }
    this.last = this.queue.shift()!;
    return this.last;
  }
  /** Make sure lap `r` has its season and weather. */
  private roundTo(r: number) {
    while (this.rounds.length <= r) {
      const prev = this.rounds[this.rounds.length - 1], season = nextSeason(prev.season, this.rand());
      this.rounds.push({ season, weather: weatherFor(season, this.rand()) });
    }
  }
  /** Decide the order of chapters until at least `n` are planned beyond the ones already built. */
  private planTo(n: number) {
    while (this.plan.length < this.built + n) {
      const id = this.nextId(), c = CHAPTERS.find((q) => q.id === id)!;
      this.plan.push({ id, v0: this.end, len: c.to - c.from, built: false });
      this.end += c.to - c.from;
    }
  }

  /** Make sure segment `i` exists. */
  ensure(i: number) {
    while (this.segs.length <= i) this.build();
  }
  private build() {
    this.planTo(2);
    const idx = this.built, p = this.plan[this.built++], c = CHAPTERS.find((q) => q.id === p.id)!;
    const round = Math.floor(idx / 3);                                                          // three chapters make a lap
    this.roundTo(round + 1);
    const salt = p.v0 === 0 ? 0 : 1 + Math.floor(this.rand() * 90000);                        // the first stretch is the track as designed; every later one is rolled afresh
    const src = buildTrack(this.milestones, { salt, from: c.from, to: c.to });
    for (let k = c.from; k < c.to; k++) {
      const s = src[k];
      const props = s.props.some((q) => q.type === 'ms') ? s.props.map((q) => (q.type === 'ms' ? this.marker(q) : q)) : s.props;
      const into = idx % 3 === 2 ? (k - (c.to - 40)) / 40 : 0;                                  // the last 40 segments of a lap ease toward the next lap's season
      const blend = into > 0 ? into * into * (3 - 2 * Math.min(1, into)) : 0;
      const dressed = { season: this.rounds[round].season, ...(blend > 0 ? { nextSeason: this.rounds[round + 1].season, blend } : {}) };
      const r = Math.abs(Math.sin((k * 4.17 + salt * 0.31) * 12.9898) * 43758.5453) % 1;           // in deep winter, drifts of snow settle along the verge (not by the exit lane)
      const drifted = winterK(dressed) > 0.5 && r < 0.2 && !(k >= LANE_FROM - 2 && k <= LANE_G + 4) ? [...props, { o: (r > 0.1 ? 1 : -1) * (1.5 + ((r * 37) % 1) * 1.1), type: 'snow' as const, v: Math.floor((r * 53) % 3) }] : props;
      this.segs.push({ ...s, props: drifted, i: p.v0 + k - c.from, src: k, salt, round, weather: this.rounds[round].weather, ...dressed });
    }
    p.built = true;
    this.planTo(2);
  }
  /** The next career marker in story order, whichever chapter it falls in. */
  private marker<T extends { label?: string; sub?: string }>(q: T): T {
    const m = this.milestones[this.msN++ % this.milestones.length];
    return m ? { ...q, label: m.top, sub: m.label } : q;
  }

  /** Where in the Ladakh track segment `i` will lie, even before it is built: the plan knows the order of chapters well ahead. */
  srcAt(i: number): number {
    while (this.end <= i) this.planTo(this.plan.length - this.built + 1);
    for (let n = this.plan.length - 1; n >= 0; n--) {
      const p = this.plan[n];
      if (i >= p.v0) return CHAPTERS.find((q) => q.id === p.id)!.from + (i - p.v0);
    }
    return 0;
  }

  /** Let go of everything before segment `i`. */
  trim(i: number) {
    for (; this.dropped < i && this.dropped < this.segs.length; this.dropped++) this.segs[this.dropped] = undefined;
  }

  /** Where the closed garage next stands at or after segment `i`: planned ahead, so it is known long before it is built. */
  nextGarage(i: number): number {
    for (;;) {
      const g = this.plan.find((p) => p.id === 'high' && p.v0 + GARAGE_AT >= i);
      if (g) return g.v0 + GARAGE_AT;
      this.planTo(this.plan.length - this.built + 1);
    }
  }
  /** The garage before segment `i`, if the ride has passed one. */
  prevGarage(i: number): number | undefined {
    let out: number | undefined;
    for (const p of this.plan) if (p.id === 'high' && p.v0 + GARAGE_AT < i) out = p.v0 + GARAGE_AT;
    return out;
  }
}
