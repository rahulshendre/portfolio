import { describe, expect, it } from 'vitest';
import { LEVELS, lowSize, quantise } from './pixel';

describe('lowSize', () => {
  it('keeps the screen aspect on 270 rows in landscape', () => {
    expect(lowSize(1920, 1080)).toEqual({ W: 480, H: 270 });
    expect(lowSize(2560, 1080).H).toBe(270);
  });
  it('uses more rows on a portrait phone so the view is not a sliver', () => {
    const s = lowSize(390, 844);
    expect(s.H).toBe(420);
    expect(s.W).toBeCloseTo((420 * 390) / 844, 0);
  });
});

describe('quantise', () => {
  const step = 255 / (LEVELS - 1);
  const onGrid = (v: number) => Math.abs(v - Math.round(v / step) * step) <= 0.5; // stored as whole numbers, so within half a unit of the shade
  it('leaves only palette shades in each channel and never touches alpha', () => {
    const w = 8, h = 8, d = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) { d[i * 4] = i * 4; d[i * 4 + 1] = 255 - i * 3; d[i * 4 + 2] = 100; d[i * 4 + 3] = 200; }
    quantise(d, w, h);
    for (let i = 0; i < w * h; i++) {
      expect(onGrid(d[i * 4]) && onGrid(d[i * 4 + 1]) && onGrid(d[i * 4 + 2])).toBe(true);
      expect(d[i * 4 + 3]).toBe(200);
    }
  });
  it('keeps pure black and white exactly', () => {
    const d = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]);
    quantise(d, 2, 1);
    expect([...d]).toEqual([0, 0, 0, 255, 255, 255, 255, 255]);
  });
  it('dithers a flat mid-tone into more than one shade, so a gradient does not band', () => {
    const w = 4, h = 4, d = new Uint8ClampedArray(w * h * 4).fill(255);
    for (let i = 0; i < w * h; i++) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = Math.round(step * 2.5); }
    quantise(d, w, h);
    expect(new Set(Array.from({ length: w * h }, (_, i) => d[i * 4])).size).toBeGreaterThan(1);
  });
});
