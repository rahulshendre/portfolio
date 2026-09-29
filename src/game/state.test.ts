import { describe, expect, it } from 'vitest';
import { countFound, isNightHour, pickStart, pickWeather } from './state';

describe('pickStart', () => {
  it('first visit sees the arrival at the door', () => expect(pickStart('', false, false)).toBe('door'));
  it('the same session lands in the garage', () => expect(pickStart('', true, false)).toBe('garage'));
  it('reduced motion skips the arrival', () => expect(pickStart('', false, true)).toBe('garage'));
  it('?ride always rides, ?garage always skips', () => {
    expect(pickStart('?ride', true, true)).toBe('ride');
    expect(pickStart('?garage', false, false)).toBe('garage');
    expect(pickStart('?door', true, true)).toBe('door');
  });
});

describe('isNightHour', () => {
  it('is dark from 7pm until 6am', () => {
    for (const h of [19, 22, 23, 0, 3, 5]) expect(isNightHour(h), String(h)).toBe(true);
    for (const h of [6, 9, 12, 18]) expect(isNightHour(h), String(h)).toBe(false);
  });
});

describe('countFound', () => {
  it('counts only ids that still exist, once each', () => {
    expect(countFound(['a', 'b', 'a', 'gone'], ['a', 'b', 'c'])).toBe(2);
    expect(countFound([], ['a'])).toBe(0);
  });
});

describe('pickWeather', () => {
  it('honours ?weather=', () => {
    for (const w of ['clear', 'rain', 'snow', 'fog']) expect(pickWeather(`?weather=${w}`, () => 0)).toBe(w);
  });
  it('ignores unknown values and rolls by chance', () => {
    expect(pickWeather('?weather=lava', () => 0.1)).toBe('clear');
    expect(pickWeather('', () => 0.5)).toBe('rain');
    expect(pickWeather('', () => 0.7)).toBe('snow');
    expect(pickWeather('', () => 0.95)).toBe('fog');
  });
});
