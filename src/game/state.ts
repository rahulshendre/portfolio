// Where the home page starts, and remembering that someone has already ridden in.
export type Start = 'ride' | 'door' | 'garage';
// The weather outside: rain by default (the garage looks best in it). Pick another with ?weather=rain|snow|fog|clear, or click the window.
export type Weather = 'clear' | 'rain' | 'snow' | 'fog';
export const WEATHERS: Weather[] = ['clear', 'rain', 'snow', 'fog'];

export function pickWeather(search: string): Weather {
  const w = new URLSearchParams(search).get('weather');
  return w && (WEATHERS as string[]).includes(w) ? (w as Weather) : 'rain';
}

// The arrival's look: the Himalaya by default, or the old Windows XP wallpaper. Pick one with ?theme=xp|himalaya.
export type Theme = 'himalaya' | 'xp';
export const THEMES: Theme[] = ['himalaya', 'xp'];
export const pickTheme = (search: string): Theme => {
  const t = new URLSearchParams(search).get('theme');
  return t && (THEMES as string[]).includes(t) ? (t as Theme) : 'himalaya';
};

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
