import { describe, expect, it } from 'vitest';
import { buildTrack, FINISH, BOARDS, MILESTONE_SEGS, N, PASS_TOP, altitude, calm, zoneAt } from './track-ladakh';
import { autopilotLane, capBehind, carAhead, LEFT, RIGHT, type Car } from './traffic';
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
  it('autopilot pulls right to overtake', () => {
    expect(autopilotLane(cars, 1000)).toBe(RIGHT);
    expect(autopilotLane(cars, 1600)).toBe(LEFT);
  });
  it('caps speed while stuck behind', () => {
    expect(capBehind(cars, 1000, LEFT, 9000, 9600).speed).toBeCloseTo(0.3 * 9600);
  });
});
