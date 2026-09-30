import { describe, expect, it } from 'vitest';
import { isPanelHref, panelHash, parsePanelHash, titleFor } from './panel';
import { HOTSPOTS } from './hotspots';

describe('panel hrefs', () => {
  it('accepts site pages and anchors', () => {
    for (const h of ['/about', '/open-source', '/open-source#log', '/about#stack', '/garage']) expect(isPanelHref(h), h).toBe(true);
  });

  it('rejects anything that could leave the site or reload the game', () => {
    for (const h of ['/', '/?ride', '//evil.com', 'https://evil.com', 'javascript:alert(1)', '/a b', '/../x', 'mailto:a@b.c', '', '/\\evil'])
      expect(isPanelHref(h), h).toBe(false);
  });

  it('round-trips through the hash and refuses tampered ones', () => {
    for (const h of ['/about', '/open-source#log']) expect(parsePanelHash(panelHash(h))).toBe(h);
    expect(parsePanelHash('#p=' + encodeURIComponent('//evil.com'))).toBeNull();
    expect(parsePanelHash('#p=%E0%A4%A')).toBeNull();
    expect(parsePanelHash('#terminal')).toBeNull();
  });

  it('titles come from the nav', () => {
    expect(titleFor('/open-source#log')).toBe('OPEN SOURCE');
    expect(titleFor('/about')).toBe('ABOUT');
  });

  it('every internal garage hotspot can open as a panel', () => {
    // '/?ride' starts the ride instead of opening a panel
    for (const h of HOTSPOTS.filter((x) => !x.external && !x.action && !x.href.startsWith('/?'))) expect(isPanelHref(h.href), h.id).toBe(true);
  });
});
