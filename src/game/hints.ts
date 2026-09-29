// What the garage's bottom bar says while you are not pointing at anything: who this is, then a nudge
// toward things people miss (the TV terminal, the cord, the radio) until they have tried each.
import { site } from '../data/site';

export type Feature = 'tv' | 'cord' | 'radio';
const STEP = 3.5; // seconds per message

export function idleMessages(tried: ReadonlySet<string>, touch: boolean, narrow: boolean): string[] {
  const who = narrow ? site.name : `${site.name} · ${site.badge}`;
  const list = [who];
  if (!tried.has('tv')) list.push(touch ? 'TRY: TAP THE TV' : narrow ? 'TRY: PRESS /' : 'TRY: CLICK THE TV OR PRESS /');
  if (!tried.has('cord')) list.push('TRY: PULL THE CORD');
  if (!tried.has('radio')) list.push(narrow ? 'TRY: THE RADIO' : 'TRY: TURN ON THE RADIO');
  if (narrow) list.push('< SWIPE >');
  else if (touch) list.push('SWIPE TO LOOK AROUND');
  return list.map((m) => m.toUpperCase());
}

export function idleMessage(t: number, tried: ReadonlySet<string>, touch: boolean, narrow: boolean): string {
  const list = idleMessages(tried, touch, narrow);
  return list[Math.floor(Math.max(0, t) / STEP) % list.length];
}
