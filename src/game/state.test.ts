import { describe, expect, it } from 'vitest';
import { isNightHour, pickStart, pickWeather, radioWanted } from './state';

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

describe('pickWeather', () => {
  it('honours ?weather=', () => {
    for (const w of ['clear', 'rain', 'snow', 'fog']) expect(pickWeather(`?weather=${w}`)).toBe(w);
  });
  it('is rain unless told otherwise', () => {
    expect(pickWeather('')).toBe('rain');
    expect(pickWeather('?weather=lava')).toBe('rain');
  });
});

describe('radioWanted', () => {
  it('plays by default', () => expect(radioWanted(null)).toBe(true));
  it('plays if it was left on', () => expect(radioWanted('1')).toBe(true));
  it('stays off only if the visitor turned it off', () => expect(radioWanted('0')).toBe(false));
});
