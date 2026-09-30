import { describe, expect, it } from 'vitest';
import { buildTrack, FINISH, HOARDINGS, MILESTONE_SEGS, N, TUNNEL, calm, zoneAt } from './track';
import { project, CAM_DEPTH } from './project';
import { autopilotLane, capBehind, carAhead, LEFT, RIGHT, type Car } from './traffic';
import { milestones } from '../../data/site';

describe('track', () => {
  const segs = buildTrack(milestones);
  it('is continuous: each segment starts where the last ended', () => {
    for (let i = 1; i < N; i++) expect(segs[i].y1).toBeCloseTo(segs[i - 1].y2, 6);
  });
  it('places milestones in story order', () => {
    const labels = MILESTONE_SEGS.map((i) => segs[i].props.find((p) => p.type === 'ms')?.label);
    expect(labels).toEqual(milestones.slice(0, MILESTONE_SEGS.length).map((m) => m.top));
  });
  it('has a straight, flat tunnel with nothing growing inside it', () => {
    for (let i = TUNNEL[0]; i < TUNNEL[1]; i++) {
      expect(segs[i].tunnel).toBe(true);
      expect(Math.abs(segs[i].curve)).toBeLessThan(0.01);
      expect(segs[i].props.every((p) => p.type === 'cateye')).toBe(true);
    }
  });
  it('tells the story in chapters, with a hoarding for every social', () => {
    expect([0, 300, 700, 1100].map(zoneAt)).toEqual(['town', 'plains', 'ghat', 'plateau']);
    expect(HOARDINGS.map((h) => h.id).sort()).toEqual(['github', 'linkedin', 'pipecd', 'x', 'youtube']);
    for (const h of HOARDINGS) expect(segs[h.i].props.some((p) => p.type === 'hoarding' && p.label === h.id)).toBe(true);
  });
  it('ends flat and straight at the garage', () => {
    expect(calm(FINISH)).toBe(0);
    expect(segs[FINISH].props.some((p) => p.type === 'garage')).toBe(true);
    expect(segs[FINISH].curve).toBeCloseTo(0);
  });
});

describe('project', () => {
  it('puts a point level with the camera on the horizon line', () => {
    const p = project(1000, 5000, 0, 1000, 0, 480, 270, 0.5, 1100);
    expect(p.y).toBe(135);
    expect(p.x).toBe(240);
  });
  it('shrinks with distance', () => {
    const near = project(0, 1000, 0, 1000, 0, 480, 270, 0.5, 1100);
    const far = project(0, 8000, 0, 1000, 0, 480, 270, 0.5, 1100);
    expect(far.w).toBeLessThan(near.w);
    expect(near.s).toBeCloseTo(CAM_DEPTH / 1000);
  });
});

describe('traffic', () => {
  const cars: Car[] = [{ z: 1500, o: LEFT, v: 0.3, kind: 'truck' }];
  it('finds the car ahead in your lane only', () => {
    expect(carAhead(cars, 1000, LEFT, 2000)).toBe(cars[0]);
    expect(carAhead(cars, 1000, RIGHT, 2000)).toBeUndefined();
    expect(carAhead(cars, 2000, LEFT, 2000)).toBeUndefined();
  });
  it('autopilot pulls right to overtake, then returns left', () => {
    expect(autopilotLane(cars, 1000)).toBe(RIGHT);
    expect(autopilotLane(cars, 1600)).toBe(LEFT);
  });
  it('caps speed while stuck behind', () => {
    expect(capBehind(cars, 1000, LEFT, 9000, 9600).speed).toBeCloseTo(0.3 * 9600);
    expect(capBehind(cars, 1000, RIGHT, 9000, 9600).speed).toBe(9000);
  });
});
