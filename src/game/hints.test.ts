import { describe, expect, it } from 'vitest';
import { idleMessage, idleMessages } from './hints';
import { hasGlyph } from './engine/font';
import { site } from '../data/site';

describe('idle hints', () => {
  it('starts with who this is, including the role', () => {
    const first = idleMessage(0, new Set(), false, false);
    expect(first).toContain(site.name.toUpperCase());
    expect(first).toContain('PIPECD');
  });

  it('drops a hint once the feature has been tried', () => {
    expect(idleMessages(new Set(), false, false).join('|')).toContain('CORD');
    expect(idleMessages(new Set(['cord']), false, false).join('|')).not.toContain('CORD');
    expect(idleMessages(new Set(['tv', 'cord', 'radio']), false, false)).toHaveLength(1);
  });

  it('cycles and wraps', () => {
    const n = idleMessages(new Set(), false, false).length;
    expect(idleMessage(3.5 * n, new Set(), false, false)).toBe(idleMessage(0, new Set(), false, false));
  });

  it('fits the pixel font and the bar', () => {
    for (const touch of [false, true]) for (const narrow of [false, true]) for (const tried of [new Set<string>(), new Set(['tv', 'cord', 'radio'])])
      for (const m of idleMessages(tried, touch, narrow)) {
        for (const ch of m) expect(hasGlyph(ch), `${m} "${ch}"`).toBe(true);
        if (!narrow) expect(m.length * 6, m).toBeLessThanOrEqual(330); // clear of the two bar buttons
      }
  });

  it('keeps the whiteboard lines on the board', () => {
    expect(site.now).toHaveLength(3);
    for (const l of site.now) { expect(l.length, l).toBeLessThanOrEqual(12); for (const ch of l) expect(hasGlyph(ch), l).toBe(true); }
  });
});
