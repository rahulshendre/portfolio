import { describe, expect, it } from 'vitest';
import { dim, mixHex, OUTFITS, type Ramp } from './gear';

const lum = (c: string) => 0.2126 * parseInt(c.slice(1, 3), 16) + 0.7152 * parseInt(c.slice(3, 5), 16) + 0.0722 * parseInt(c.slice(5, 7), 16);
const RAMPS = ['jacket', 'jeans', 'leather', 'helmet', 'accent', 'visor', 'canvas', 'skin'] as const;

describe('outfits', () => {
  for (const [name, o] of Object.entries(OUTFITS)) {
    it(`${name}: every ramp climbs from shadow to highlight`, () => {
      for (const r of RAMPS) {
        const ramp = o[r] as Ramp;
        for (let i = 1; i < 5; i++) expect(lum(ramp[i]), `${name}.${r}[${i}]`).toBeGreaterThan(lum(ramp[i - 1]));
      }
    });
    it(`${name}: value runs light head, mid body, dark legs, darkest boots`, () => {
      expect(lum(o.helmet[3])).toBeGreaterThan(lum(o.jacket[2]));
      expect(lum(o.jeans[2])).toBeLessThan(lum(o.jacket[3]));
      expect(lum(o.leather[1])).toBeLessThan(lum(o.jeans[2]) + 12);
    });
  }
  it('the helmet is the tank cream, a warm white, not a cold one', () => {
    const [r, , b] = [1, 3, 5].map((i) => parseInt(OUTFITS.rust.helmet[3].slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(b);
  });
});

describe('colour helpers', () => {
  it('mixes and dims', () => {
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(lum(dim(OUTFITS.rust.jacket, '#000000', 0.5)[2])).toBeLessThan(lum(OUTFITS.rust.jacket[2]));
  });
});
