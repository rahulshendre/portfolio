import { describe, expect, it } from 'vitest';
import { meowAllowed } from './audio';

describe('meowAllowed', () => {
  it('allows the first meow', () => expect(meowAllowed(-Infinity, 0)).toBe(true));
  it('blocks a second meow within 1.5 seconds', () => expect(meowAllowed(10, 11)).toBe(false));
  it('allows another once 1.5 seconds have passed', () => expect(meowAllowed(10, 11.5)).toBe(true));
});
