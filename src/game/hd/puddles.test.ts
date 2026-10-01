import { describe, expect, it } from 'vitest';
import { BLOCK, inPuddle, puddleAt, puddleHalf, puddleIn } from './puddles';
import { FINISH, N } from './track-ladakh';

const all = () => { const out = []; for (let b = 0; b * BLOCK < N; b++) { const p = puddleIn(b); if (p) out.push(p); } return out; };

describe('rain puddles', () => {
  it('lie in the same places every time', () => {
    expect(all()).toEqual(all());
  });
  it('are scattered along the ride, not bunched or missing', () => {
    const n = all().filter((p) => p.from < FINISH).length;
    expect(n).toBeGreaterThan(FINISH / BLOCK / 8);
    expect(n).toBeLessThan(FINISH / BLOCK / 2.5);
  });
  it('keep to the road and its verge, and clear of the start and the garage forecourt', () => {
    for (const p of all()) {
      expect(Math.abs(p.o) + p.w).toBeLessThan(2.1);
      expect(p.from).toBeGreaterThan(14);
      expect(p.from + p.len).toBeLessThan(FINISH - 20);
    }
  });
  it('stay inside their own block, so a segment belongs to at most one', () => {
    for (const p of all()) expect(Math.floor(p.from / BLOCK)).toBe(Math.floor((p.from + p.len - 1) / BLOCK));
  });
  it('are round: widest in the middle, pinched at both ends', () => {
    const p = all()[0];
    expect(puddleHalf(p, 0.5)).toBeCloseTo(p.w, 5);
    expect(puddleHalf(p, 0)).toBe(0);
    expect(puddleHalf(p, 1)).toBeCloseTo(0, 5);
    expect(puddleHalf(p, 0.25)).toBeLessThan(p.w);
  });
  it('splash the bike only when it is over one', () => {
    const p = all()[2], mid = p.from + p.len / 2;
    expect(puddleAt(Math.floor(mid))).toBe(p);
    expect(inPuddle(mid, p.o)).toBe(p);
    expect(inPuddle(mid, p.o + p.w + 0.5)).toBeNull();
    expect(inPuddle(p.from - 1.5, p.o)).toBeNull();
  });
});
