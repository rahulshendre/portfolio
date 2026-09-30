import { describe, expect, it } from 'vitest';
import { step, V_CRUISE, V_TOP } from './physics';

const run = (v: number, seconds: number, o: Partial<Parameters<typeof step>[2]> = {}) => {
  for (let t = 0; t < seconds; t += 0.02) v = step(v, 0.02, { gas: false, brake: false, grade: 0, cruise: V_CRUISE, top: 40, ...o });
  return v;
};

describe('bike physics', () => {
  it('settles at the cruise speed with nothing pressed', () => {
    expect(run(0, 30)).toBeCloseTo(V_CRUISE, 0);
  });
  it('full throttle tops out at 110 km/h, set by drag and not by a cap', () => {
    const top = run(V_CRUISE, 90, { gas: true });
    expect(top * 3.6).toBeGreaterThan(105);
    expect(top * 3.6).toBeLessThanOrEqual(110.5);
  });
  it('takes a believable time to reach 100 km/h from a standstill', () => {
    let v = 0, t = 0;
    while (v * 3.6 < 100 && t < 60) { v = step(v, 0.02, { gas: true, brake: false, grade: 0, cruise: V_CRUISE, top: 40 }); t += 0.02; }
    expect(t).toBeGreaterThan(5);
    expect(t).toBeLessThan(14);
  });
  it('lifting off from top speed coasts back down to the cruise', () => {
    const v = run(V_TOP, 40);
    expect(v).toBeCloseTo(V_CRUISE, 0);
  });
  it('brakes hard and stops', () => {
    const v = run(V_TOP, 6, { brake: true });
    expect(v).toBe(0);
  });
  it('a climb slows a bike on full throttle, a descent speeds it up', () => {
    const up = run(20, 60, { gas: true, grade: 0.12 });
    const down = run(20, 60, { gas: true, grade: -0.06, top: 60 });
    expect(up).toBeLessThan(V_TOP - 2);
    expect(up).toBeGreaterThan(V_CRUISE);
    expect(down).toBeGreaterThan(V_TOP);
  });
  it('never exceeds the ceiling', () => {
    expect(run(0, 60, { gas: true, grade: -0.2, top: V_TOP })).toBeLessThanOrEqual(V_TOP);
  });
});

import { agility, lateralStep } from './physics';
describe('steering physics', () => {
  it('does not slide sideways when the bike is stopped', () => {
    let vx = 0;
    for (let i = 0; i < 100; i++) vx = lateralStep(vx, 0.02, { v: 0, steer: 1, laneError: 0 });
    expect(vx).toBe(0);
    for (let i = 0; i < 100; i++) vx = lateralStep(vx, 0.02, { v: 0, steer: 0, laneError: 0.9 });
    expect(vx).toBe(0);
  });
  it('answers the bars more the faster it goes', () => {
    expect(agility(2)).toBeLessThan(agility(10));
    expect(agility(30)).toBe(1);
    const at = (v: number) => { let vx = 0; for (let i = 0; i < 50; i++) vx = lateralStep(vx, 0.02, { v, steer: 1, laneError: 0 }); return vx; };
    expect(at(1)).toBeLessThan(at(15));
  });
  it('eases toward the target lane and settles, without snapping', () => {
    let vx = 0, px = 0;
    const first = lateralStep(0, 0.02, { v: 15, steer: 0, laneError: 0.9 });
    expect(first).toBeLessThan(0.3);
    for (let i = 0; i < 400; i++) { vx = lateralStep(vx, 0.02, { v: 15, steer: 0, laneError: 0.9 - px }); px += vx * 0.02; }
    expect(px).toBeCloseTo(0.9, 1);
  });
});

describe('grip', () => {
  it('a wet road lengthens the stopping distance and slows the getaway', () => {
    const stop = (grip: number) => { let v = V_TOP, d = 0; for (let i = 0; i < 2000 && v > 0; i++) { v = step(v, 0.01, { gas: false, brake: true, grade: 0, cruise: V_CRUISE, top: 40, grip }); d += v * 0.01; } return d; };
    expect(stop(0.65)).toBeGreaterThan(stop(1) * 1.3);
    const t100 = (grip: number) => { let v = 0, t = 0; while (v * 3.6 < 100 && t < 60) { v = step(v, 0.02, { gas: true, brake: false, grade: 0, cruise: V_CRUISE, top: 40, grip }); t += 0.02; } return t; };
    expect(t100(0.6)).toBeGreaterThan(t100(1));
  });
});

describe('the edges of the road', () => {
  it('gravel drags the bike down to a crawl-ish pace even with the throttle open', () => {
    const v = run(V_CRUISE, 30, { gas: true, rough: 1 });
    expect(v * 3.6).toBeLessThan(60);
    expect(v * 3.6).toBeGreaterThan(25);
  });
  it('swerving costs speed', () => {
    const straight = run(V_TOP, 3, { gas: true, top: 40 });
    const swerve = run(V_TOP, 3, { gas: true, top: 40, side: 1.4 });
    expect(swerve).toBeLessThan(straight);
  });
});
