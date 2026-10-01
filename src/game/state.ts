// Where the home page starts, and remembering that someone has already ridden in.
export type Start = 'ride' | 'door' | 'garage';
// The weather outside: rain by default (the garage looks best in it). Pick another with ?weather=rain|snow|fog|clear, or click the window.
export type Weather = 'clear' | 'rain' | 'snow' | 'fog';
export const WEATHERS: Weather[] = ['clear', 'rain', 'snow', 'fog'];

export function pickWeather(search: string): Weather {
  const w = new URLSearchParams(search).get('weather');
  return w && (WEATHERS as string[]).includes(w) ? (w as Weather) : 'rain';
}

// The look of the land: the Himalaya by default, or the old Windows XP wallpaper (Bliss). Pick one with ?theme=xp|himalaya.
export type Theme = 'himalaya' | 'xp';
export const THEMES: Theme[] = ['himalaya', 'xp'];
export const pickTheme = (search: string): Theme => {
  const t = new URLSearchParams(search).get('theme');
  return t && (THEMES as string[]).includes(t) ? (t as Theme) : 'himalaya';
};

// The hour outside. The ride has one more setting on top of these (AUTO: the afternoon that slides into dusk as you go), which arrives as dusk.
export type Time = 'day' | 'dusk' | 'night';
export const TIMES: Time[] = ['day', 'dusk', 'night'];

/**
 * The sky outside, shared by the ride, the arrival at the door and the garage window, so what you rode in is what you arrive in. A field is
 * null until somebody picks it (the address, a button, a key in the ride); each scene then falls back to its own default: rain and dusk by
 * the garage, a clear afternoon on the road.
 */
export interface SkyChoice { weather: Weather | null; theme: Theme | null; time: Time | null }
export const sky: SkyChoice = { weather: null, theme: null, time: null };

/** Fill the shared sky from the address: ?weather=, ?theme=, ?time=day|dusk|night, or the short ?day and ?night. Anything the address does not say is left as it was. */
export function readSky(search: string, into: SkyChoice = sky): SkyChoice {
  const q = new URLSearchParams(search), one = <T extends string>(v: string | null, all: readonly T[]) => (v && (all as readonly string[]).includes(v) ? (v as T) : null);
  into.weather = one(q.get('weather'), WEATHERS) ?? into.weather;
  into.theme = one(q.get('theme'), THEMES) ?? into.theme;
  into.time = one(q.get('time'), TIMES) ?? (q.has('night') ? 'night' : q.has('day') ? 'day' : into.time);
  return into;
}

const SKY_KEY = 'rs:sky';
/** Pick up the sky chosen earlier in this tab, so a link back into the ride from the garage (a fresh page load) keeps the weather, land and hour. */
export function loadSky(into: SkyChoice = sky): SkyChoice {
  try {
    const v = JSON.parse(sessionStorage.getItem(SKY_KEY) ?? '{}') ?? {};
    const one = <T extends string>(x: unknown, all: readonly T[]) => ((all as readonly unknown[]).includes(x) ? (x as T) : null);
    into.weather = one(v.weather, WEATHERS); into.theme = one(v.theme, THEMES); into.time = one(v.time, TIMES);
  } catch { /* no storage, or nothing saved: the defaults stand */ }
  return into;
}
/** Change the shared sky, and remember it for this tab. */
export function setSky(patch: Partial<SkyChoice>, into: SkyChoice = sky) {
  Object.assign(into, patch);
  try { sessionStorage.setItem(SKY_KEY, JSON.stringify(into)); } catch { /* private mode: no memory, no problem */ }
}

/** The hour for the door and the garage: what was picked, else the visitor's own choice of lights, else their clock (dark from 7pm to 6am, dusk otherwise). */
export const resolveTime = (picked: Time | null, saved: boolean | null, hour: number): Time => picked ?? ((saved ?? isNightHour(hour)) ? 'night' : 'dusk');

/** The ride's three clocks: afternoon sliding into dusk (the default), all day, or all night. */
export type RideTime = 'auto' | 'day' | 'night';
export const RIDE_TIMES: RideTime[] = ['auto', 'night', 'day'];
export const rideTimeFrom = (t: Time | null): RideTime => (t === 'day' ? 'day' : t === 'night' ? 'night' : 'auto');
/** What the door sees when the ride ends: the auto ride has reached dusk. */
export const timeFromRide = (r: RideTime): Time => (r === 'day' ? 'day' : r === 'night' ? 'night' : 'dusk');

const KEY = 'rs:seen-door';
const NIGHT = 'rs:night';

export function pickStart(search: string, visited: boolean, reducedMotion: boolean): Start {
  const q = new URLSearchParams(search);
  if (q.has('ride')) return 'ride';
  if (q.has('door')) return 'door';
  if (q.has('garage')) return 'garage';
  if (reducedMotion || visited) return 'garage';
  return 'door';
}

// Once per tab session: the arrival plays on a fresh visit, links back to "/" go straight to the garage.
export function hasVisited(): boolean {
  try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; }
}

export function markVisited() {
  try { sessionStorage.setItem(KEY, '1'); } catch { /* private mode: no memory, no problem */ }
}

/** null = never chosen, so the room follows the visitor's clock. */
export function loadNight(): boolean | null {
  try { const v = localStorage.getItem(NIGHT); return v === null ? null : v === '1'; } catch { return null; }
}

export const isNightHour = (hour: number) => hour >= 19 || hour < 6;

export function loadTried(): string[] {
  try { const v = JSON.parse(localStorage.getItem('rs:tried') ?? '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []; } catch { return []; }
}

export function saveTried(list: string[]) {
  try { localStorage.setItem('rs:tried', JSON.stringify(list)); } catch { /* fine */ }
}

export function saveNight(on: boolean) {
  try { localStorage.setItem(NIGHT, on ? '1' : '0'); } catch { /* fine */ }
}

// The radio plays by default. Only a visitor turning it off keeps it quiet on later visits.
export const radioWanted = (saved: string | null) => saved !== '0';

export function loadRadio(): boolean {
  try { return radioWanted(localStorage.getItem('rs:radio')); } catch { return true; }
}

export function saveRadio(on: boolean) {
  try { localStorage.setItem('rs:radio', on ? '1' : '0'); } catch { /* fine */ }
}

// Master sound switch (the speaker button). Off by default so nothing changes for people who never touch it.
export function loadMute(): boolean {
  try { return localStorage.getItem('rs:mute') === '1'; } catch { return false; }
}

export function saveMute(on: boolean) {
  try { localStorage.setItem('rs:mute', on ? '1' : '0'); } catch { /* fine */ }
}
