import { describe, expect, it } from 'vitest';
import { pickStart } from './state';

describe('pickStart', () => {
  it('first visit sees the arrival at the door', () => expect(pickStart('', false, false)).toBe('door'));
  it('the same session lands in the garage', () => expect(pickStart('', true, false)).toBe('garage'));
  it('reduced motion skips the arrival', () => expect(pickStart('', false, true)).toBe('garage'));
  it('?ride always rides, ?garage always skips', () => {
    expect(pickStart('?ride', true, true)).toBe('ride');
    expect(pickStart('?garage', false, false)).toBe('garage');
    expect(pickStart('?door', true, true)).toBe('door');
  });
});
