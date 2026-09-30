import { describe, expect, it } from 'vitest';
import { SEG_L } from './track-ladakh';
import { BIKE_HALF, capBehind, carAhead, FOLLOW_GAP, HALF, LEFT, overlaps, RIGHT, spawnTraffic, stepTraffic, type Car } from './traffic';

const MAX_S = SEG_L * 37;
const solid = (c: Car) => c.kind !== 'goats' && c.kind !== 'marmot';

describe('traffic', () => {
  it('never lets vehicles drive through each other', () => {
    const cars = spawnTraffic();
    for (let t = 0; t < 240; t += 0.05) {
      stepTraffic(cars, 0, LEFT, 0.05, MAX_S);
      const veh = cars.filter(solid);
      for (const a of veh) for (const b of veh) {
        if (a === b) continue;
        const sideways = Math.abs(a.o - b.o) < HALF[a.kind] + HALF[b.kind] - 0.02, dz = Math.abs(a.z - b.z);
        if (sideways && a.pass !== b && b.pass !== a) expect(dz).toBeGreaterThanOrEqual(FOLLOW_GAP * 0.9);
        if (dz < SEG_L * 0.5) expect(sideways).toBe(false);                                        // alongside each other means in different lanes
      }
    }
  });

  it('pulls a faster vehicle out around a slow herd instead of trapping it behind', () => {
    const yak: Car = { z: 1500 * SEG_L, o: LEFT, v: 0.03, kind: 'yak' };
    const army: Car = { z: 1440 * SEG_L, o: LEFT, v: 0.36, kind: 'army' };
    const cars = [yak, army];
    for (let t = 0; t < 90; t += 0.05) stepTraffic(cars, 0, LEFT, 0.05, MAX_S);
    expect(army.z).toBeGreaterThan(yak.z + 3 * SEG_L);
    expect(army.o).toBeCloseTo(LEFT, 1);                                                          // and it is back in its own lane afterwards
  });

  it('holds back rather than pulling out when the right lane is taken', () => {
    const yak: Car = { z: 1500 * SEG_L, o: LEFT, v: 0.03, kind: 'yak' };
    const army: Car = { z: 1440 * SEG_L, o: LEFT, v: 0.36, kind: 'army' };
    const oncoming: Car = { z: 1470 * SEG_L, o: RIGHT, v: 0.4, kind: 'suv' };
    stepTraffic([yak, army, oncoming], 0, LEFT, 0.05, MAX_S);
    expect(army.pass).toBeUndefined();
  });

  it('blocks and bumps by the width of what is drawn', () => {
    const yak: Car = { z: 5000, o: LEFT, v: 0, kind: 'yak' };
    expect(overlaps(yak, 0.02, BIKE_HALF)).toBe(true);                                             // a yak herd reaches past the middle of the road
    const tanker: Car = { z: 5000, o: LEFT, v: 0, kind: 'tanker' };
    expect(overlaps(tanker, 0.2, BIKE_HALF)).toBe(false);
    expect(overlaps({ ...tanker, kind: 'biker' }, LEFT + 0.3, BIKE_HALF)).toBe(false);
  });

  it('treats a flock of goats in your path as something to stop for', () => {
    const goats: Car = { z: 1000 + SEG_L, o: -0.1, v: 0, kind: 'goats' };
    expect(carAhead([goats], 1000, LEFT, 4 * SEG_L)).toBe(goats);
    expect(capBehind([goats], 1000, LEFT, 9000, MAX_S).blocker).toBe(goats);
  });
});
