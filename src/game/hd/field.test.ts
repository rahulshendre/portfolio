import { describe, expect, it } from 'vitest';
import { drift, grove, noise } from './field';
import { xpExtras } from './meadow';
import { buildTrack } from './track-ladakh';

/** Things of one kind per window of `w` segments. */
function perWindow(items: readonly number[], n: number, w: number) {
  const out = new Array(Math.ceil(n / w)).fill(0);
  for (const i of items) out[Math.floor(i / w)]++;
  return out;
}

describe('noise for scattering things', () => {
  it('stays in 0..1, repeats exactly, and moves smoothly from one segment to the next', () => {
    for (let i = 0; i < 500; i++) {
      const a = grove(i, 1, 18, 3), b = grove(i + 1, 1, 18, 3);
      expect(a).toBeGreaterThanOrEqual(0); expect(a).toBeLessThanOrEqual(1);
      expect(a).toBe(grove(i, 1, 18, 3));
      expect(Math.abs(a - b)).toBeLessThan(0.2);
    }
    expect(noise(4)).toBe(noise(4)); expect(drift(3.3, 2)).toBe(drift(3.3, 2));
  });

  it('lets the two sides of the road, and each kind of thing, drift apart', () => {
    let side = 0, kind = 0;
    for (let i = 0; i < 400; i++) { side += Math.abs(grove(i, 1, 18) - grove(i, -1, 18)); kind += Math.abs(grove(i, 1, 18, 1) - grove(i, 1, 18, 2)); }
    expect(side / 400).toBeGreaterThan(0.08); expect(kind / 400).toBeGreaterThan(0.08);
  });

  it('puts the Bliss trees in groves with clearings between, not at an even beat', () => {
    const at: number[] = [];
    for (let i = 0; i < 1180; i++) for (const e of xpExtras(i, 0)) if (e.type === 'tree' && Math.abs(e.o) < 9) at.push(i);
    const w = perWindow(at, 1180, 20), mean = w.reduce((a, b) => a + b, 0) / w.length;
    expect(Math.min(...w)).toBeLessThanOrEqual(mean * 0.4);      // a clearing
    expect(Math.max(...w)).toBeGreaterThanOrEqual(mean * 1.6);   // a grove
    expect(at.length).toBeGreaterThan(150);                      // and still plenty of trees overall
  });

  it('puts the Ladakh poplars and boulders in clumps too', () => {
    const segs = buildTrack([], {});
    for (const type of ['poplar', 'boulder', 'scrub'] as const) {
      const at: number[] = [];
      segs.forEach((s) => s.props.forEach((p) => p.type === type && at.push(s.i)));
      const w = perWindow(at, 1400, 20), mean = w.reduce((a, b) => a + b, 0) / w.length;
      expect(at.length, type).toBeGreaterThan(30);
      expect(Math.max(...w), type).toBeGreaterThanOrEqual(mean * 1.5);
    }
  });
});
