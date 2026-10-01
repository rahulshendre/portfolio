import { beforeEach, describe, expect, it } from 'vitest';
import { calmDown, honkNow, LASTS, REACH_AHEAD, startled } from './stir';

describe('the roadside hears the horn', () => {
  beforeEach(() => calmDown());

  it('is calm until someone honks', () => {
    expect(startled(0, 100, 50)).toBe(0);
  });
  it('rises quickly after a honk, holds, and settles', () => {
    honkNow(40, 100);
    expect(startled(0, 99.9, 45)).toBe(0);
    expect(startled(0, 100.5, 45)).toBeGreaterThan(0.9);
    expect(startled(0, 100 + LASTS - 0.3, 45)).toBeLessThan(0.5);
    expect(startled(0, 100 + LASTS + 0.1, 45)).toBe(0);
  });
  it('reaches the animals ahead and the ones just passing, not the ones far off or long behind', () => {
    honkNow(40, 100);
    expect(startled(0, 100.6, 40 + REACH_AHEAD)).toBeGreaterThan(0);
    expect(startled(0, 100.6, 40 + REACH_AHEAD + 1)).toBe(0);
    expect(startled(0, 100.6, 38)).toBeGreaterThan(0);
    expect(startled(0, 100.6, 30)).toBe(0);
  });
  it('lets each animal notice at its own moment', () => {
    honkNow(40, 100);
    expect(startled(0.9, 100.15, 41)).toBeLessThan(startled(0, 100.15, 41));
  });
  it('a newer honk starts the reaction again', () => {
    honkNow(40, 100);
    expect(startled(0, 103, 45)).toBe(0);
    honkNow(60, 103);
    expect(startled(0, 103.6, 65)).toBeGreaterThan(0.9);
  });
});
