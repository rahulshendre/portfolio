import { describe, expect, it } from 'vitest';
import { buildTrack, CHAPTERS, FINISH, GARAGE_BOARDS, BOARDS, inLane, kmOf, laneAt, laneCurve, laneShift, LANE_END, LANE_FROM, LANE_G, ROAD_W, SEG_L, paved, LAKE_FROM, MILESTONE_SEGS, N, PASS_TOP, SEAM, TOWNS, altitude, calm, elevation, townAt, zoneAt } from './track-ladakh';
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
    expect(segs[LANE_G].lane!.some((p) => p.type === 'garage')).toBe(true);
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
    expect(segs[FINISH - 62].props.some((p) => p.type === 'gantry' && p.label === 'SHENDRE')).toBe(true);
    expect(segs[LANE_G].lane!.some((p) => p.type === 'garage')).toBe(true);
    expect(kmOf(45)).toBeCloseTo(1, 5);
  });
  it('leads to the garage down a second road on the left: it opens out beside the main road, bends away to the left, and runs straight to the garage', () => {
    expect(laneAt(LANE_FROM - 1)).toBeNull(); expect(laneAt(LANE_G + 3)).toBeNull();
    expect(laneAt(LANE_FROM)!.w).toBeCloseTo(0, 5);                                                // it starts from nothing
    expect(laneAt(LANE_FROM + 10)!.w).toBeCloseTo(2, 5);                                           // and is a whole road wide soon after
    expect(laneAt(LANE_FROM + 6)!.gore).toBeGreaterThan(0.3);                                      // with a hatched island between it and the main road
    expect(laneCurve(7)).toBe(0); expect(laneCurve(41)).toBe(0); expect(laneCurve(24)).toBeGreaterThan(15);   // it bends only in the middle of its run
    let heading = 0; for (let n = 0; n < 60; n++) heading += laneCurve(n);
    const turn = (Math.atan(heading / SEG_L) * 180) / Math.PI;
    expect(turn).toBeGreaterThan(45); expect(turn).toBeLessThan(75);                               // a real turn: the camera swings through about 58 degrees
    for (let n = 1; n < 70; n++) expect(laneShift(n), `shift ${n}`).toBeGreaterThanOrEqual(laneShift(n - 1));   // it only ever pulls further to the left
    expect(laneShift(LANE_END - LANE_FROM) / ROAD_W).toBeGreaterThan(4);                           // the garage stands well off to the left of the main road
    for (let i = LANE_FROM; i < LANE_G; i++) { const a = laneAt(i)!, b = laneAt(i + 1)!; expect(Math.abs(a.c - b.c), `step ${i}`).toBeLessThan(0.5); expect(a.outer).toBeLessThanOrEqual(a.inner); }   // it bends, never jumps
  });
  it('signs the way to the garage from far off, and keeps the lane clear', () => {
    const signs = segs.flatMap((q) => [...q.props, ...(q.lane ?? [])].filter((p) => (p.type === 'sign' || p.type === 'gantry') && /SHENDRE/.test(p.label ?? '')).map((p) => ({ i: q.i, p })));
    expect(signs.length).toBeGreaterThanOrEqual(5);                                                // a warning, a gantry, a sign for the exit, the big one at its mouth, one near its end
    expect(signs.some((s) => s.p.type === 'sign' && s.p.o < 0 && s.i < LANE_FROM)).toBe(true);    // some on the left, before the lane begins
    expect(segs.some((q) => q.i >= LANE_FROM && q.i <= LANE_G && q.props.some((p) => p.type === 'chevron'))).toBe(true);   // chevrons along the island
    expect(segs.some((q) => q.i >= LANE_FROM && q.i <= LANE_G && q.lane?.some((p) => p.type === 'lamp'))).toBe(true);      // and a lamp-lit lane
    expect(segs.some((q) => q.i < LANE_G && q.lane?.some((p) => p.type === 'garage'))).toBe(false);   // the garage is at the lane's end and nowhere else
    for (const q of segs.filter((s) => s.i >= LANE_FROM && s.i <= LANE_G)) {
      for (const p of q.props.filter((p) => p.o < 0 && ['boulder', 'scrub', 'tuft', 'poplar', 'stone'].includes(p.type))) expect(p.o, `${p.type} at ${q.i}`).toBeLessThan(-14);   // nothing grows by the lane or its verge
    }
  });
  it('counts a bike as in the lane only once it has steered into it, and finds the tarmac out there', () => {
    const z = LANE_FROM + 14, l = laneAt(z)!;
    expect(inLane(z, l.c)).toBe(true);
    expect(inLane(z, -0.45)).toBe(false);                                                          // riding on in the road's own lane is not taking the exit
    expect(inLane(z, 0.9)).toBe(false);
    expect(inLane(LANE_FROM + 4, laneAt(LANE_FROM + 4)!.c)).toBe(false);                           // not before it has opened out enough to ride
    expect(inLane(LANE_END - 4, laneAt(LANE_END - 4)!.c)).toBe(false);                             // nor with it nearly run out
    expect(paved(l, l.c)).toBe(true); expect(paved(laneAt(LANE_FROM + 6)!, -1.3)).toBe(true);     // the lane and the island's hatching are tarmac
    expect(paved(l, l.outer - 1)).toBe(false);                                                     // the ground beyond is not
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
