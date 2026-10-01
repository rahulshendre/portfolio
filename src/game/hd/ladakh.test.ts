import { describe, expect, it } from 'vitest';
import { buildTrack, CHAPTERS, FINISH, GARAGE_BOARDS, BOARDS, kmOf, LAKE_FROM, MILESTONE_SEGS, N, PASS_TOP, SEAM, TOWNS, altitude, calm, elevation, townAt, zoneAt } from './track-ladakh';
import { capBehind, carAhead, LEFT, RIGHT, trafficAt, type Car } from './traffic';
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
  it('reads the altitudes the cards and boards claim', () => {
    expect(elevation(0)).toBe(3500);
    expect(elevation(PASS_TOP)).toBeGreaterThanOrEqual(5350);
    expect(elevation(PASS_TOP)).toBeLessThanOrEqual(5360);
    expect(elevation(FINISH)).toBe(4225);                                                       // the lake card says 4,225 m and the garage is there
    for (let i = PASS_TOP + 40; i < LAKE_FROM + 60; i++) expect(elevation(i + 1)).toBeLessThanOrEqual(elevation(i));   // a steady descent, no bump, from the pass to the lake
    const top = segs.flatMap((s) => s.props).find((p) => p.type === 'bro' && p.lines?.[0] === 'KHARDUNG LA');
    expect(top?.lines?.[1]).toBe('TOP 17582 FT');                                                // the board agrees with the 5,359 m summit board
  });
  it('climbs at the pass then eases to the garage', () => {
    expect(altitude(PASS_TOP)).toBeGreaterThan(0.9);
    expect(calm(FINISH)).toBe(0);
    expect(segs[FINISH].props.some((p) => p.type === 'garage')).toBe(true);
    expect(segs[FINISH].curve).toBeCloseTo(0);
  });
});

describe('the garage on the endless road', () => {
  const segs = buildTrack(milestones);
  it('is announced by huge boards that count down, a gantry over the road, then the closed building', () => {
    const boards = segs.flatMap((q) => q.props.filter((p) => p.type === 'billboard').map((p) => ({ i: q.i, p })));
    expect(boards.length).toBe(GARAGE_BOARDS.length);
    expect(boards.map((b) => FINISH - b.i)).toEqual(GARAGE_BOARDS.map((b) => b.back));
    const kms = boards.map((b) => Number(b.p.sub!.replace(/[^\d.]/g, '')));
    for (let k = 1; k < kms.length; k++) expect(kms[k]).toBeLessThan(kms[k - 1]);       // each is nearer than the last
    expect(boards.every((b) => b.p.label === 'SHENDRE' && Math.abs(b.p.o) > 4)).toBe(true);
    expect(segs[FINISH - 36].props.some((p) => p.type === 'gantry' && p.label === 'SHENDRE')).toBe(true);
    expect(segs[FINISH].props.some((p) => p.type === 'garage')).toBe(true);
    expect(kmOf(45)).toBeCloseTo(1, 5);
  });
  it('has chapters that tile the road, each flat and straight at both ends', () => {
    expect(CHAPTERS.map((c) => c.from)).toEqual([0, ...CHAPTERS.slice(0, -1).map((c) => c.to)]);
    for (const c of CHAPTERS) {
      expect(segs[c.from].y1).toBeCloseTo(0, 6); expect(segs[c.to - 1].y2).toBeCloseTo(0, 6);
      expect(Math.abs(segs[c.from].curve)).toBeLessThan(0.05); expect(Math.abs(segs[c.to - 1].curve)).toBeLessThan(0.05);
      expect(calm(c.from)).toBe(0); expect(calm(c.from + SEAM)).toBeGreaterThan(0.99);
    }
  });
  it('builds just the stretch asked for, and the same stretch every time for the same salt', () => {
    const a = buildTrack(milestones, { salt: 5, from: 270, to: 620 }), b = buildTrack(milestones, { salt: 5, from: 270, to: 620 }), c = buildTrack(milestones, { salt: 6, from: 270, to: 620 });
    expect(a[269]).toBeUndefined(); expect(a[620]).toBeUndefined(); expect(a[300]).toBeDefined();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(a.map((q) => q?.props))).not.toBe(JSON.stringify(c.map((q) => q?.props)));
  });
});

describe('endless traffic', () => {
  it('puts country vehicles and animals on each kind of road', () => {
    for (const zone of ['leh', 'valley', 'pass', 'lake'] as const) for (let r = 0; r < 1; r += 0.07) {
      const car = trafficAt(zone, 1000, r, 0.4);
      expect(car.z).toBe(1000);
      if (car.kind === 'goats' || car.kind === 'marmot') expect(car.lat).toBeTruthy(); else expect(car.o).toBe(LEFT);
    }
    const yaks = Array.from({ length: 50 }, (_, k) => trafficAt('pass', 0, k / 50, 0.5)).filter((c) => c.kind === 'yak');
    expect(yaks.length).toBeGreaterThan(0);
    expect(Array.from({ length: 50 }, (_, k) => trafficAt('lake', 0, k / 50, 0.5)).some((c) => c.kind === 'yak')).toBe(false);
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
