import { describe, expect, it } from 'vitest';
import { computeSize } from './screen';

describe('computeSize', () => {
  it('hd ride renders at real resolution, capped at 2x', () => {
    expect(computeSize('hd', 1280, 720, 2)).toMatchObject({ W: 2560, H: 1440, cssW: 1280, cssH: 720, dpr: 2 });
    expect(computeSize('hd', 1280, 720, 3).W).toBe(2560);
    expect(computeSize('hd', 390, 844, 1).portrait).toBe(true);
  });

  it('pixel fill mode is 480x270 on a 16:9 desktop', () => {
    const s = computeSize('fill', 1280, 720);
    expect([s.W, s.H, s.portrait]).toEqual([480, 270, false]);
    expect(s.cssW).toBeCloseTo(1280);
  });

  it('ride on a portrait phone is 270 wide and tall', () => {
    const s = computeSize('fill', 390, 844);
    expect(s.W).toBe(270);
    expect(s.H).toBeGreaterThan(400);
    expect(s.portrait).toBe(true);
    expect(s.cssW).toBeGreaterThanOrEqual(390);
    expect(s.cssH).toBeGreaterThanOrEqual(844 - 1);
  });

  it('world scenes letterbox on ultrawide screens', () => {
    const s = computeSize('world', 2560, 1080);
    expect([s.W, s.H]).toEqual([480, 270]);
    expect(s.cssH).toBeCloseTo(1080);
    expect(s.cssW).toBeLessThan(2560);
  });

  it('world scenes fill height and overflow sideways on phones', () => {
    const s = computeSize('world', 390, 844);
    expect(s.cssH).toBeCloseTo(844);
    expect(s.cssW).toBeGreaterThan(390);
  });
});
