import { describe, expect, it } from 'vitest';
import { dice, World, type VSeg } from './endless';
import { CHAPTERS, FINISH, LANE_G } from './track-ladakh';
import { milestones } from '../../data/site';

const LEN = CHAPTERS.map((c) => c.to - c.from);
/** The chapters of the first `n` segments, in the order they come. */
function chapters(w: World, n: number) {
  w.ensure(n);
  const out: string[] = [], idOf = (src: number) => CHAPTERS.find((c) => src >= c.from && src < c.to)!.id;
  for (let i = 0; i < n; i++) { const s = w.segs[i]!, p = w.segs[i - 1]; if (!p || s.src !== p.src + 1 || idOf(s.src) !== idOf(p.src)) out.push(idOf(s.src)); }
  return out;
}

describe('the endless road', () => {
  const total = 3 * (LEN[0] + LEN[1] + LEN[2]) + 50;
  const w = new World(milestones, dice(7));
  w.ensure(total);

  it('has no gap: the heights meet at every seam, however the chapters fall', () => {
    for (let i = 1; i < total; i++) expect(w.segs[i]!.y1, `segment ${i}`).toBeCloseTo(w.segs[i - 1]!.y2, 6);
  });
  it('is flat and straight where one chapter meets the next', () => {
    for (let i = 1; i < total; i++) if (w.segs[i]!.src !== w.segs[i - 1]!.src + 1) {
      expect(Math.abs(w.segs[i]!.y1)).toBeLessThan(1e-6);
      expect(Math.abs(w.segs[i]!.curve)).toBeLessThan(0.05);
      expect(Math.abs(w.segs[i - 1]!.curve)).toBeLessThan(0.05);
    }
  });
  it('starts in Leh and deals every chapter in each round of three', () => {
    const order = chapters(w, total - 50);
    expect(order[0]).toBe('leh');
    for (let r = 0; r + 3 <= order.length; r += 3) expect([...order.slice(r, r + 3)].sort()).toEqual(['high', 'leh', 'valley']);
  });
  it('never runs the same chapter twice in a row, across rounds too', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const x = new World(milestones, dice(seed));
      const o = chapters(x, 12 * 1260);
      for (let i = 1; i < o.length; i++) expect(o[i], `seed ${seed} chapter ${i}`).not.toBe(o[i - 1]);
    }
  });
  it('puts the closed garage once in every pass over the lake, and knows where before it is built', () => {
    const x = new World(milestones, dice(3));
    const first = x.nextGarage(0);
    expect(x.segs.length).toBeLessThan(first);                       // planned, not built
    x.ensure(first + 20);
    const at = first + (LANE_G - FINISH);                              // the garage stands at the end of the exit lane, a little past where the plan counts it
    expect(x.segs[at]!.lane!.some((p) => p.type === 'garage')).toBe(true);
    expect(x.segs[at]!.src).toBe(LANE_G);
    x.ensure(20 * 1260);
    const found = x.segs.flatMap((s, i) => (s!.lane?.some((p) => p.type === 'garage') ? [i] : []));
    const highs = chapters(x, x.segs.length).filter((c) => c === 'high').length;
    expect(found.length).toBe(highs);
    expect(found[1] - (LANE_G - FINISH)).toBe(x.nextGarage(found[0] - (LANE_G - FINISH) + 1));
    expect(x.prevGarage(found[1] - (LANE_G - FINISH) + 1)).toBe(found[1] - (LANE_G - FINISH));
  });
  it('keeps the career markers in story order whichever chapter they fall in', () => {
    const labels = w.segs.flatMap((s) => s!.props.filter((p) => p.type === 'ms').map((p) => p.label));
    expect(labels.length).toBeGreaterThan(milestones.length);
    labels.forEach((l, k) => expect(l).toBe(milestones[k % milestones.length].top));
  });
  it('rolls the scenery afresh each time a chapter comes round', () => {
    const x = new World(milestones, dice(11));
    x.ensure(30 * 1260);
    const sig = (s: VSeg[]) => JSON.stringify(s.map((q) => q.props.map((p) => [p.type, +p.o.toFixed(2)])));
    const lehs: VSeg[][] = [];
    for (let i = 0; i < x.segs.length; i++) if (x.segs[i]!.src === 0) lehs.push(x.segs.slice(i, i + 270) as VSeg[]);
    expect(lehs.length).toBeGreaterThan(3);
    expect(new Set(lehs.map(sig)).size).toBe(lehs.length);
  });
  it('replays exactly from the same seed, and differs from another', () => {
    const a = new World(milestones, dice(5)), b = new World(milestones, dice(5)), c = new World(milestones, dice(6));
    for (const x of [a, b, c]) x.ensure(4000);
    const ids = (x: World) => chapters(x, 4000).join();
    expect(ids(a)).toBe(ids(b));
    expect(ids(a) === ids(c) && JSON.stringify(a.segs[3000]!.props) === JSON.stringify(c.segs[3000]!.props)).toBe(false);
  });
  it('can deal the original order for share cards and jumps', () => {
    const x = new World(milestones, dice(9), true);
    expect(chapters(x, 1260).slice(0, 3)).toEqual(['leh', 'valley', 'high']);
    expect(x.segs[400]!.src).toBe(400);
  });
  it('lets go of the road behind the bike', () => {
    const x = new World(milestones, dice(2));
    x.ensure(2000); x.trim(1500);
    expect(x.segs[1499]).toBeUndefined();
    expect(x.segs[1500]).toBeDefined();
    x.ensure(2600);
    expect(x.segs[2600]).toBeDefined();
  });
});

describe('the seasons of the endless road', () => {
  const lap = LEN[0] + LEN[1] + LEN[2];
  const mk = (seed: number, n = 5 * lap) => { const x = new World(milestones, dice(seed)); x.ensure(n); return x; };

  it('makes the first lap summer and clear: the road as designed', () => {
    const x = mk(7);
    for (let i = 0; i < lap; i++) { expect(x.segs[i]!.season).toBe('green'); expect(x.segs[i]!.weather).toBe('clear'); expect(x.segs[i]!.round).toBe(0); }
  });
  it('gives every stretch of a lap the same season and weather, apart from the change at its end', () => {
    const x = mk(11);
    for (let i = 0; i < 4 * lap; i++) { const s = x.segs[i]!, first = x.segs.find((q) => q && q.round === s.round)!; expect(s.season).toBe(first.season); expect(s.weather).toBe(first.weather); }
  });
  it('never gives two laps running the same season', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const x = mk(seed, 8 * lap);
      const seasons: string[] = [];
      for (let i = 0; i < 8 * lap; i++) { const s = x.segs[i]!; if (seasons.length <= s.round) seasons.push(s.season); }
      for (let r = 1; r < seasons.length; r++) expect(seasons[r], `seed ${seed} lap ${r}`).not.toBe(seasons[r - 1]);
    }
  });
  it('eases toward the next lap only in the last 40 stretches of a lap, and arrives at the next lap\'s season', () => {
    const x = mk(5);
    for (let i = 0; i < 4 * lap; i++) {
      const s = x.segs[i]!, next = x.segs[i + 1]!;
      if (s.blend) {
        expect(s.nextSeason).toBeDefined();
        expect(s.nextSeason).not.toBe(s.season);
        expect(next.blend === undefined || next.blend >= s.blend - 1e-9 || next.round !== s.round).toBe(true);
      }
    }
    const withBlend = x.segs.slice(0, 2 * lap).filter((s) => s && s.blend);
    expect(withBlend.length).toBeLessThanOrEqual(80);
    expect(withBlend.length).toBeGreaterThan(30);
    const lastOfLap = x.segs[lap - 1]!, firstOfNext = x.segs[lap]!;
    expect(lastOfLap.nextSeason).toBe(firstOfNext.season);
    expect(lastOfLap.blend!).toBeGreaterThan(0.95);
  });
  it('can start in a forced season, for pictures and for tests', () => {
    const x = new World(milestones, dice(3), false, { season: 'frost' });
    x.ensure(100);
    expect(x.segs[10]!.season).toBe('frost');
  });
  it('keeps winter weather to snow, fog or clear', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const x = mk(seed, 10 * lap);
      for (const s of x.segs) if (s && s.season === 'frost') expect(['snow', 'fog', 'clear']).toContain(s.weather);
    }
  });
});
