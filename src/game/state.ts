// Where the home page starts, and remembering that someone has already ridden in.
export type Start = 'ride' | 'door' | 'garage';
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
