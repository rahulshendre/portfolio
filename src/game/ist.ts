// The wall clock keeps Indian Standard Time (Pune), whatever the visitor's own timezone is.
const parts = (d: Date, hour12: boolean) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12, hourCycle: hour12 ? 'h12' : 'h23' }).formatToParts(d);
const pick = (p: Intl.DateTimeFormatPart[], type: string) => p.find((x) => x.type === type)?.value ?? '';

/** Hours (0 to 23), minutes and seconds in IST. */
export function istHMS(d: Date) {
  const p = parts(d, false);
  return { h: +pick(p, 'hour') % 24, m: +pick(p, 'minute'), s: +pick(p, 'second') };
}

/** "IST 14:32:05", or "IST 2:32:05 PM" for the 12 hour face. */
export function istLabel(d: Date, h24 = true): string {
  const { h, m, s } = istHMS(d), two = (n: number) => String(n).padStart(2, '0');
  return h24 ? `IST ${two(h)}:${two(m)}:${two(s)}` : `IST ${h % 12 || 12}:${two(m)}:${two(s)} ${h < 12 ? 'AM' : 'PM'}`;
}
