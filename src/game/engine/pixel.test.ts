import { describe, expect, it } from 'vitest';
import { trapRows } from './pixel';

describe('trapRows', () => {
  it('fills one row per scanline between far and near edges', () => {
    const rows = trapRows({ x: 100, y: 110, w: 40 }, { x: 100, y: 100, w: 10 });
    expect(rows).toHaveLength(10);
    expect(rows[0]).toEqual([90, 100, 20]);
    expect(rows.at(-1)![2]).toBeGreaterThan(rows[0][2]);
  });

  it('draws nothing when edges share a row', () => {
    expect(trapRows({ x: 0, y: 5, w: 3 }, { x: 0, y: 5, w: 3 })).toEqual([]);
  });
});
