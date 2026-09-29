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

export function loadNight(): boolean {
  try { return localStorage.getItem(NIGHT) === '1'; } catch { return false; }
}

export function saveNight(on: boolean) {
  try { localStorage.setItem(NIGHT, on ? '1' : '0'); } catch { /* fine */ }
}
