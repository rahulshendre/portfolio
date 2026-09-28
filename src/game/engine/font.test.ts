import { describe, expect, it } from 'vitest';
import { glyph, hasGlyph, textW } from './font';
import { milestones, site } from '../../data/site';

const GAME_STRINGS = [
  site.name, site.links.xHandle, 'PRESS ANY KEY', 'TAP TO RIDE', 'SKIP >', 'ODO 000.0', 'HORN OK PLEASE', 'STEER TO OVERTAKE',
  'CAM 1', 'BEHIND', 'RIDER POV', 'TOP DOWN', 'LOOK AT: PIPECD SIGN', 'RIDE AGAIN', "RAHUL'S GARAGE", 'SHENDRE',
  ...milestones.flatMap((m) => [m.top, m.label]),
];

describe('5x7 font', () => {
  it('every glyph is exactly 7 rows of 5', () => {
    for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:->·!?\'/+@ <') expect(glyph(ch), ch).toHaveLength(35);
  });

  it('covers every character the game draws', () => {
    for (const s of GAME_STRINGS) for (const ch of s) expect(hasGlyph(ch), `"${ch}" in "${s}"`).toBe(true);
  });

  it('measures text with a 1px gap and no trailing gap', () => {
    expect(textW('A')).toBe(5);
    expect(textW('AB')).toBe(11);
    expect(textW('AB', 2)).toBe(22);
  });
});
