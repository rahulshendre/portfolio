import { describe, expect, it } from 'vitest';
import { buildTrack, FINISH, BOARDS, MILESTONE_SEGS, N, PASS_TOP, TOWNS, altitude, calm, townAt, zoneAt } from './track-ladakh';
import { capBehind, carAhead, LEFT, RIGHT, type Car } from './traffic';
import { milestones } from '../../data/site';

describe('ladakh track', () => {
  const segs = buildTrack(milestones);
  it('is continuous', () => {
    for (let i = 1; i < N; i++) expect(segs[i].y1).toBeCloseTo(segs[i - 1].y2, 6);
  });
  it('places milestones in story order', () => {
    const labels = MILESTONE_SEGS.map((i) => segs[i].props.find((p) => p.type === 'ms')?.label);
    expect(labels).toEqual(milestones.map((m) => m.top));
  });
  it('tells the story in Ladakh chapters', () => {
    expect([0, 400, 800, 1100].map(zoneAt)).toEqual(['leh', 'valley', 'pass', 'lake']);
    expect(BOARDS.map((b) => b.id).sort()).toEqual(['github', 'linkedin', 'pipecd', 'x', 'youtube']);
    for (const b of BOARDS) expect(segs[b.i].props.some((p) => p.type === 'board' && p.label === b.id)).toBe(true);
  });
  it('has named towns in order, each with a gate, a street of shops and no overlap', () => {
    for (let k = 0; k < TOWNS.length; k++) {
      const t = TOWNS[k];
      expect(segs[t.gate].props.some((p) => p.type === 'gate' && p.label === t.name)).toBe(true);
      expect(segs.slice(t.gate, t.to + 1).flatMap((s) => s.props).filter((p) => p.type === 'shop').length).toBeGreaterThanOrEqual(t.sparse ? 3 : 6);
      expect(t.to).toBeLessThan(FINISH - 60);
      if (k) expect(t.gate).toBeGreaterThan(TOWNS[k - 1].to);
      expect(townAt(t.gate + 4)).toBe(t.name);
    }
    expect(townAt(FINISH - 20)).toBeUndefined();
  });
  it('keeps shops clear of the boards and slogans and off the road', () => {
    for (const s of segs) for (const p of s.props) if (p.type === 'shop') expect(Math.abs(p.o)).toBeGreaterThan(1.8);
    const boardSegs = new Set([...BOARDS.map((b) => b.i)]);
    for (const b of boardSegs) expect(segs[b].props.some((p) => p.type === 'shop' && Math.sign(p.o) === Math.sign(segs[b].props.find((q) => q.type === 'board')!.o))).toBe(false);
  });
  it('climbs at the pass then eases to the garage', () => {
    expect(altitude(PASS_TOP)).toBeGreaterThan(0.9);
    expect(calm(FINISH)).toBe(0);
    expect(segs[FINISH].props.some((p) => p.type === 'garage')).toBe(true);
    expect(segs[FINISH].curve).toBeCloseTo(0);
  });
});

describe('ladakh traffic', () => {
  const cars: Car[] = [{ z: 1500, o: LEFT, v: 0.3, kind: 'army' }];
  it('finds the car ahead in your lane only', () => {
    expect(carAhead(cars, 1000, LEFT, 2000)).toBe(cars[0]);
    expect(carAhead(cars, 1000, RIGHT, 2000)).toBeUndefined();
  });
  it('holds you to its speed when close, easing off as the gap opens', () => {
    const close = capBehind([{ ...cars[0], z: 1100 }], 1000, LEFT, 9000, 9600).speed;
    expect(close).toBeCloseTo(0.3 * 9600);
    const far = capBehind(cars, 1000, LEFT, 9000, 9600).speed;
    expect(far).toBeGreaterThan(close);
    expect(far).toBeLessThan(9000);
  });
});
