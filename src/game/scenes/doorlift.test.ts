import { describe, expect, it } from 'vitest';
import { panelSlots } from './doorlift';

const H = 176, N = 4;

describe('panelSlots', () => {
  it('closed: the panels tile the whole opening', () => {
    const s = panelSlots(0, N, H);
    expect(s[0].y).toBe(0);
    expect(s.reduce((a, p) => a + p.h, 0)).toBeCloseTo(H);
    s.forEach((p) => expect(p.h).toBeCloseTo(H / N));
  });

  it('fully open: nothing is left in the opening', () => {
    panelSlots(H, N, H).forEach((p) => expect(p.h).toBe(0));
  });

  it('panels stay stacked: each starts where the one above ends', () => {
    for (let up = 0; up <= H; up += 7) {
      const s = panelSlots(up, N, H);
      for (let i = 1; i < N; i++) expect(s[i].y).toBeCloseTo(s[i - 1].y + s[i - 1].h);
    }
  });

  it('a panel is never taller than itself, and shrinks as it tilts onto the curve', () => {
    const s = panelSlots(60, N, H);
    s.forEach((p) => expect(p.h).toBeLessThanOrEqual(H / N + 1e-9));
    expect(s[0].h).toBe(0);
    expect(s[1].h).toBeLessThan(H / N);
  });

  it('the visible height only shrinks as the door rises', () => {
    let prev = Infinity;
    for (let up = 0; up <= H; up += 4) {
      const total = panelSlots(up, N, H).reduce((a, p) => a + p.h, 0);
      expect(total).toBeLessThanOrEqual(prev + 1e-9);
      prev = total;
    }
  });
});
