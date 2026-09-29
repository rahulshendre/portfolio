import { describe, expect, it } from 'vitest';
import { istHMS, istLabel } from './ist';

describe('ist', () => {
  const d = new Date('2026-09-29T09:00:05Z'); // 14:30:05 in India
  it('reads India time whatever the machine timezone is', () => {
    expect(istHMS(d)).toEqual({ h: 14, m: 30, s: 5 });
  });
  it('formats both faces', () => {
    expect(istLabel(d)).toBe('IST 14:30:05');
    expect(istLabel(d, false)).toBe('IST 2:30:05 PM');
    expect(istLabel(new Date('2026-09-29T18:30:00Z'))).toBe('IST 00:00:00');
    expect(istLabel(new Date('2026-09-29T18:30:00Z'), false)).toBe('IST 12:00:00 AM');
  });
});
