// Where the home page starts, and remembering that someone has already ridden in.
export type Start = 'ride' | 'garage';
const KEY = 'rs:visited';

export function pickStart(search: string, visited: boolean, reducedMotion: boolean): Start {
  const q = new URLSearchParams(search);
  if (q.has('ride')) return 'ride';
  if (q.has('garage')) return 'garage';
  if (reducedMotion || visited) return 'garage';
  return 'ride';
}

export function hasVisited(): boolean {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

export function markVisited() {
  try { localStorage.setItem(KEY, '1'); } catch { /* private mode: no memory, no problem */ }
}
