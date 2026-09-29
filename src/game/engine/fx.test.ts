import { describe, expect, it } from 'vitest';
import { fxWanted } from './fx';

describe('fxWanted', () => {
  it('runs on the pixel-art scenes only', () => {
    expect(fxWanted('world', false, '')).toBe(true);
    expect(fxWanted('wide', false, '')).toBe(true);
    expect(fxWanted('hd', false, '')).toBe(false);
    expect(fxWanted('fill', false, '')).toBe(false);
  });
  it('steps aside on a slow machine or with ?nofx', () => {
    expect(fxWanted('world', true, '')).toBe(false);
    expect(fxWanted('world', false, '?nofx')).toBe(false);
  });
});
