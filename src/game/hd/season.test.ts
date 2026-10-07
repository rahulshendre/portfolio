import { describe, expect, it } from 'vitest';
import { nextSeason, seasonFor, SEASONS, weatherFor, leanSeason, winterK, type Season } from './season';

describe('nextSeason', () => {
  it('never repeats the season before', () => {
    for (const s of SEASONS) for (let i = 0; i < 20; i++) expect(nextSeason(s, i / 20)).not.toBe(s);
  });
  it('can reach every other season', () => {
    const got = new Set<Season>();
    for (let i = 0; i < 100; i++) got.add(nextSeason('green', i / 100));
    expect(got).toEqual(new Set(['gold', 'frost']));
  });
});

describe('weatherFor', () => {
  it('turns winter mostly to snow and keeps snow out of the other seasons', () => {
    let snow = 0;
    for (let i = 0; i < 100; i++) { if (weatherFor('frost', i / 100) === 'snow') snow++; expect(weatherFor('green', i / 100)).not.toBe('snow'); expect(weatherFor('gold', i / 100)).not.toBe('snow'); }
    expect(snow).toBeGreaterThan(40);
  });
  it('is mostly clear in summer', () => {
    let clear = 0;
    for (let i = 0; i < 100; i++) if (weatherFor('green', i / 100) === 'clear') clear++;
    expect(clear).toBeGreaterThan(50);
  });
});

describe('seasonFor', () => {
  it('is the lap season when nothing is changing', () => {
    expect(seasonFor({ season: 'green' }, 5)).toBe('green');
    expect(seasonFor({ season: 'green', nextSeason: 'gold', blend: 0 }, 5)).toBe('green');
  });
  it('turns a growing share of the trees as the change comes on, and all of them at the end', () => {
    const share = (b: number) => { let n = 0; for (let k = 0; k < 400; k++) if (seasonFor({ season: 'green', nextSeason: 'gold', blend: b }, k) === 'gold') n++; return n / 400; };
    expect(share(0.25)).toBeGreaterThan(0.12); expect(share(0.25)).toBeLessThan(0.4);
    expect(share(0.75)).toBeGreaterThan(0.6);
    expect(share(1)).toBe(1);
  });
  it('is stable: the same tree always makes the same choice', () => {
    const a = seasonFor({ season: 'green', nextSeason: 'frost', blend: 0.5 }, 42), b = seasonFor({ season: 'green', nextSeason: 'frost', blend: 0.5 }, 42);
    expect(a).toBe(b);
  });
});

describe('leanSeason', () => {
  const mix = (a: string, b: string, t: number) => (t === 0 ? a : t >= 1 ? b : `${a}>${b}@${t}`);
  it('leaves summer alone and leans autumn and winter toward their colours', () => {
    expect(leanSeason(mix, '#aaaaaa', 'green', '#c88f3c', '#e4eaee')).toBe('#aaaaaa');
    expect(leanSeason(mix, '#aaaaaa', 'gold', '#c88f3c', '#e4eaee')).toContain('#c88f3c');
    expect(leanSeason(mix, '#aaaaaa', 'frost', '#c88f3c', '#e4eaee')).toContain('#e4eaee');
  });
});

describe('winterK', () => {
  it('is 1 in a winter lap, 0 in the others, and eases across a change', () => {
    expect(winterK({ season: 'frost' })).toBe(1);
    expect(winterK({ season: 'green' })).toBe(0);
    expect(winterK({ season: 'gold', nextSeason: 'frost', blend: 0.25 })).toBeCloseTo(0.25);
    expect(winterK({ season: 'frost', nextSeason: 'green', blend: 0.25 })).toBeCloseTo(0.75);
    expect(winterK({ season: 'green', nextSeason: 'gold', blend: 0.9 })).toBe(0);
  });
});
