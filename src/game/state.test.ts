import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isNightHour, loadSky, pickStart, pickWeather, radioWanted, readSky, resolveTime, rideTimeFrom, setSky, timeFromRide, type SkyChoice } from './state';

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

describe('the shared sky', () => {
  const fresh = (): SkyChoice => ({ weather: null, theme: null, time: null });
  it('stays unpicked until the address or a button says otherwise', () => {
    expect(readSky('', fresh())).toEqual({ weather: null, theme: null, time: null });
    expect(readSky('?weather=lava&theme=moon&time=noon', fresh())).toEqual({ weather: null, theme: null, time: null });
  });
  it('reads weather, theme and time, with ?night and ?day as short forms', () => {
    expect(readSky('?weather=snow&theme=xp&time=dusk', fresh())).toEqual({ weather: 'snow', theme: 'xp', time: 'dusk' });
    expect(readSky('?night', fresh()).time).toBe('night');
    expect(readSky('?day', fresh()).time).toBe('day');
    expect(readSky('?time=day&night', fresh()).time).toBe('day');
  });
  it('the door and the garage take the pick, then the visitor\'s lights, then the clock', () => {
    expect(resolveTime('day', true, 23)).toBe('day');
    expect(resolveTime(null, false, 23)).toBe('dusk');
    expect(resolveTime(null, true, 12)).toBe('night');
    expect(resolveTime(null, null, 23)).toBe('night');
    expect(resolveTime(null, null, 12)).toBe('dusk');
  });
  it('a ride that was never set arrives at dusk, and a day or night ride arrives as it rode', () => {
    expect(rideTimeFrom(null)).toBe('auto');
    expect(rideTimeFrom('dusk')).toBe('auto');
    expect(rideTimeFrom('day')).toBe('day');
    expect(rideTimeFrom('night')).toBe('night');
    expect(timeFromRide('auto')).toBe('dusk');
    expect(timeFromRide('day')).toBe('day');
    expect(timeFromRide('night')).toBe('night');
  });
});

describe('the sky across page loads', () => {
  const store = new Map<string, string>();
  const fresh = (): SkyChoice => ({ weather: null, theme: null, time: null });
  beforeEach(() => { store.clear(); (globalThis as unknown as { sessionStorage: unknown }).sessionStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) }; });
  afterEach(() => { delete (globalThis as unknown as { sessionStorage?: unknown }).sessionStorage; });
  it('is remembered for the tab, so a link back into the ride keeps it', () => {
    setSky({ weather: 'snow', theme: 'xp', time: 'night' }, fresh());
    expect(loadSky(fresh())).toEqual({ weather: 'snow', theme: 'xp', time: 'night' });
  });
  it('the address wins over what was remembered, and says nothing about the rest', () => {
    const s = fresh(); setSky({ weather: 'snow', theme: 'xp', time: 'night' }, s);
    const next = loadSky(fresh()); readSky('?weather=fog&day', next);
    expect(next).toEqual({ weather: 'fog', theme: 'xp', time: 'day' });
  });
  it('ignores junk in storage and works with no storage at all', () => {
    store.set('rs:sky', '{"weather":"lava","theme":7,"time":"noon"}');
    expect(loadSky(fresh())).toEqual({ weather: null, theme: null, time: null });
    store.set('rs:sky', 'not json');
    expect(loadSky(fresh())).toEqual({ weather: null, theme: null, time: null });
    delete (globalThis as unknown as { sessionStorage?: unknown }).sessionStorage;
    expect(() => setSky({ weather: 'rain' }, fresh())).not.toThrow();
    expect(loadSky(fresh())).toEqual({ weather: null, theme: null, time: null });
  });
});
