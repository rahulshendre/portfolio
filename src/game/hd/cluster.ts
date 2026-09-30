// The instrument cluster: a round speedometer with a sweeping arc, the gear, and altitude and air temperature that follow the climb.
import { box, circle, label, rrect } from './draw';

const INK = 'rgba(27,23,18,0.88)', HUD = '#fff6e0', ACCENT = '#e8b923', DIM = '#a89d8b', ORANGE = '#e8641f';
const MONO = '"IBM Plex Mono", ui-monospace, monospace';

export interface Gauges { kmh: number; frac: number; gear: number; elev: number; temp: number; trip: number; lights: boolean }

/** Draws the cluster with its top-left corner at (x, y). `compact` is the phone version: dial and gear only. Returns its size. */
export function drawCluster(g: CanvasRenderingContext2D, x: number, y: number, s: number, d: Gauges, compact: boolean) {
  const w = (compact ? 118 : 236) * s, h = 96 * s;
  rrect(x, y, w, h, 10 * s, INK);
  box(x, y + 8 * s, 4 * s, h - 16 * s, ACCENT);
  const cx = x + 58 * s, cy = y + 50 * s, r = 40 * s;
  // dial: a dark face, ticks every 20 km/h, an arc that fills with speed, a needle
  circle(cx, cy, r, '#101012'); circle(cx, cy, r - 3 * s, '#17171a');
  const a0 = Math.PI * 0.75, span = Math.PI * 1.5;
  g.lineCap = 'round';
  g.strokeStyle = '#2c2c30'; g.lineWidth = 5 * s; g.beginPath(); g.arc(cx, cy, r - 8 * s, a0, a0 + span); g.stroke();
  g.strokeStyle = d.frac > 0.86 ? ORANGE : ACCENT; g.beginPath(); g.arc(cx, cy, r - 8 * s, a0, a0 + span * Math.min(1, d.frac)); g.stroke();
  for (let k = 0; k <= 7; k++) {
    const a = a0 + span * (k / 7), c = Math.cos(a), sn = Math.sin(a);
    g.strokeStyle = DIM; g.lineWidth = 1.4 * s; g.beginPath(); g.moveTo(cx + c * (r - 15 * s), cy + sn * (r - 15 * s)); g.lineTo(cx + c * (r - 19 * s), cy + sn * (r - 19 * s)); g.stroke();
  }
  const na = a0 + span * Math.min(1, d.frac);
  g.strokeStyle = ORANGE; g.lineWidth = 2 * s; g.beginPath(); g.moveTo(cx + Math.cos(na) * 8 * s, cy + Math.sin(na) * 8 * s); g.lineTo(cx + Math.cos(na) * (r - 20 * s), cy + Math.sin(na) * (r - 20 * s)); g.stroke();
  circle(cx, cy, 3.5 * s, ORANGE);
  label(String(Math.round(d.kmh)).padStart(3, '0'), cx, cy + 15 * s, 17 * s, HUD, { font: MONO, weight: 600, align: 'center' });
  label('KM/H', cx, cy + 27 * s, 8 * s, DIM, { font: MONO, align: 'center' });
  // gear: a yellow box, N at a standstill
  const gx = x + (compact ? 100 : 118) * s;
  if (compact) { rrect(gx - 8 * s, y + 8 * s, 22 * s, 22 * s, 4 * s, ACCENT); label(d.gear ? String(d.gear) : 'N', gx + 3 * s, y + 25 * s, 16 * s, '#1b1712', { font: MONO, weight: 700, align: 'center' }); return { w, h }; }
  rrect(gx, y + 12 * s, 30 * s, 34 * s, 5 * s, ACCENT); label(d.gear ? String(d.gear) : 'N', gx + 15 * s, y + 39 * s, 24 * s, '#1b1712', { font: MONO, weight: 700, align: 'center' });
  label('GEAR', gx + 15 * s, y + 58 * s, 8 * s, DIM, { font: MONO, align: 'center' });
  if (d.lights) { circle(gx + 5 * s, y + 74 * s, 3.2 * s, '#7fd0ff'); label('LT', gx + 11 * s, y + 77 * s, 8 * s, DIM, { font: MONO }); }
  const rx = gx + 42 * s;
  label('SCRAMBLER 400 X', x + w - 10 * s, y + 12 * s, 7.5 * s, DIM, { font: MONO, align: 'right' });
  label('ALT', rx, y + 24 * s, 8 * s, DIM, { font: MONO }); label(d.elev.toLocaleString('en-US') + ' m', rx, y + 38 * s, 12 * s, HUD, { font: MONO, weight: 500 });
  label('TEMP', rx, y + 56 * s, 8 * s, DIM, { font: MONO }); label(Math.round(d.temp) + ' C', rx, y + 70 * s, 12 * s, d.temp < 0 ? '#9cc4d4' : HUD, { font: MONO, weight: 500 });
  label('TRIP', rx, y + 86 * s, 8 * s, DIM, { font: MONO }); label(d.trip.toFixed(1) + ' km', rx + 30 * s, y + 86 * s, 9 * s, HUD, { font: MONO });
  return { w, h };
}

/** Big round touch buttons: throttle on the right, brake on the left. `held` lights them. */
export function drawPedals(g: CanvasRenderingContext2D, W: number, H: number, gas: boolean, brake: boolean) {
  for (const [x, txt, on, col] of [[W - 50, 'GAS', gas, ACCENT], [50, 'BRAKE', brake, '#d8342b']] as const) {
    const y = H - 100;
    g.globalAlpha = on ? 0.95 : 0.6;
    circle(x, y, 32, on ? col : INK); g.strokeStyle = col; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, 32, 0, Math.PI * 2); g.stroke();
    label(txt, x, y + 4, 11, on ? '#1b1712' : HUD, { font: MONO, weight: 700, align: 'center' });
    g.globalAlpha = 1;
  }
}
/** Where the pedals are, in the same units, for hit tests. */
export const pedalAt = (W: number, H: number, x: number, y: number): 'gas' | 'brake' | null =>
  Math.hypot(x - (W - 50), y - (H - 100)) < 40 ? 'gas' : Math.hypot(x - 50, y - (H - 100)) < 40 ? 'brake' : null;
