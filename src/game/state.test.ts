import { describe, expect, it } from 'vitest';
import { pickStart } from './state';

describe('pickStart', () => {
  it('first visit rides', () => expect(pickStart('', false, false)).toBe('ride'));
  it('returning visitors land in the garage', () => expect(pickStart('', true, false)).toBe('garage'));
  it('reduced motion skips the ride', () => expect(pickStart('', false, true)).toBe('garage'));
  it('?ride always rides, ?garage always skips', () => {
    expect(pickStart('?ride', true, true)).toBe('ride');
    expect(pickStart('?garage', false, false)).toBe('garage');
  });
});
