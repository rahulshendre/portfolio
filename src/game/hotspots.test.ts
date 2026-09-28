import { describe, expect, it } from 'vitest';
import { BAR, HOTSPOTS, toPct } from './hotspots';
import { hasGlyph } from './engine/font';
import { nav } from '../data/site';

describe('hotspots', () => {
  it('converts world rects to stage percentages', () => {
    expect(toPct([0, 0, 480, 270])).toEqual({ left: '0%', top: '0%', width: '100%', height: '100%' });
    expect(toPct([240, 135, 48, 27])).toEqual({ left: '50%', top: '50%', width: '10%', height: '10%' });
  });

  it('stays inside the 480x270 world', () => {
    for (const h of [...HOTSPOTS, BAR.list, BAR.ride]) {
      const [x, y, w, hh] = h.rect;
      expect(x >= 0 && y >= 0 && x + w <= 480 && y + hh <= 270, h.id).toBe(true);
    }
  });

  it('reaches every section of the site', () => {
    const hrefs = HOTSPOTS.map((h) => h.href.split('#')[0]);
    for (const n of nav) expect(hrefs, n.href).toContain(n.href);
  });

  it('only uses characters the pixel font can draw', () => {
    for (const h of HOTSPOTS) for (const ch of 'LOOK AT: ' + h.label + h.tag) expect(hasGlyph(ch), `${h.id} "${ch}"`).toBe(true);
  });
});
