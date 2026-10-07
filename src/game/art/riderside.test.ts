import { describe, expect, it } from 'vitest';
import { bend, BONE, GRIP, PEG, pose, PX_PER_M, SEAT } from './riderside';

const dist = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe('bend', () => {
  it('keeps both bones their length when the target is in reach', () => {
    const a: [number, number] = [0, 0], b: [number, number] = [20, 10], k = bend(a, b, 15, 15, 1);
    expect(dist(a, k)).toBeCloseTo(15, 5);
    expect(dist(k, b)).toBeCloseTo(15, 5);
  });
  it('bends opposite ways for opposite sides', () => {
    const up = bend([0, 0], [20, 0], 15, 15, 1), down = bend([0, 0], [20, 0], 15, 15, -1);
    expect(up[1]).toBeLessThan(0);
    expect(down[1]).toBeGreaterThan(0);
  });
  it('straightens a limb that is out of reach instead of breaking it', () => {
    const k = bend([0, 0], [100, 0], 15, 15, 1);
    expect(Number.isFinite(k[0]) && Number.isFinite(k[1])).toBe(true);
    expect(k[0]).toBeCloseTo(15, 1);
  });
});

describe('the seated pose', () => {
  const J = pose();
  it('puts the hand on the grip and the hip on the seat', () => {
    expect(J.hand).toEqual(GRIP);
    expect(J.hip).toEqual(SEAT);
  });
  it('keeps every bone at its length', () => {
    expect(dist(J.hip, J.shoulder)).toBeCloseTo(BONE.torso, 5);
    expect(dist(J.hip, J.knee)).toBeCloseTo(BONE.thigh, 3);
    expect(dist(J.knee, J.ankle)).toBeCloseTo(BONE.shin, 3);
    expect(dist(J.shoulder, J.elbow)).toBeCloseTo(BONE.upper, 3);
  });
  it('can reach the grip and the peg without locking out', () => {
    expect(dist(J.shoulder, GRIP)).toBeLessThan(BONE.upper + BONE.fore);
    expect(dist(J.hip, J.ankle)).toBeLessThan(BONE.thigh + BONE.shin);
    expect(dist(J.elbow, J.hand)).toBeCloseTo(BONE.fore, 3);
  });
  it('sits upright like a standard bike: leaning forward about 15 degrees, knee forward of the hip, elbow below the hand line', () => {
    const lean = (Math.atan2(J.shoulder[0] - J.hip[0], J.hip[1] - J.shoulder[1]) * 180) / Math.PI;
    expect(lean).toBeGreaterThan(10);
    expect(lean).toBeLessThan(20);
    expect(J.knee[0]).toBeGreaterThan(J.hip[0]);
    expect(J.elbow[1]).toBeGreaterThan(Math.min(J.shoulder[1], J.hand[1]));
  });
  it('is the size of a real rider on a real Scrambler (1.72 m, 835 mm seat)', () => {
    const seated = (SEAT[1] - (J.head[1] - 0.15 * PX_PER_M)) / PX_PER_M;       // from the hip to the helmet top, in metres
    expect(seated).toBeGreaterThan(0.75);
    expect(seated).toBeLessThan(1.05);
    expect(PEG[1]).toBeGreaterThan(SEAT[1]);                                   // feet below the hips
  });
});
