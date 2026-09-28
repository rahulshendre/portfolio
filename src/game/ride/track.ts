// The road: a finite list of segments in four chapters, ending at the garage.
//   town    Pune outskirts: houses with rooftop tanks, shops, hoardings
//   plains  open highway: fields, cows, wind farm, milestones
//   ghat    the Sahyadri climb: basalt cliffs, waterfalls, parapets, monkeys, a tunnel
//   plateau the last stretch to the garage
export const SEG_L = 200;
export const ROAD_W = 1100;
export const N = 1400; // road keeps going past the garage so the horizon never runs out
export const FINISH = 1180; // garage sits here
export const MILESTONE_SEGS = [150, 420, 690, 960];
export const TUNNEL: [number, number] = [850, 900];
export const HOARDINGS = [
  { i: 95, id: 'pipecd', o: -2.2 },
  { i: 230, id: 'github', o: 2.2 },
  { i: 345, id: 'youtube', o: -2.2 },
  { i: 470, id: 'x', o: 2.2 },
  { i: 590, id: 'linkedin', o: -2.2 },
] as const;
/** Keep a clear view of each hoarding: nothing big planted just before it. */
const nearHoarding = (i: number) => HOARDINGS.some((h) => i > h.i - 14 && i <= h.i + 2);

export type Zone = 'town' | 'plains' | 'ghat' | 'plateau';
export type PropType =
  | 'post' | 'pole' | 'tree' | 'stall' | 'ms' | 'sign' | 'garage' | 'house' | 'hoarding' | 'cow' | 'rock' | 'rail' | 'monkey' | 'cateye';
export interface Prop { o: number; type: PropType; label?: string; sub?: string; v?: number }
export interface Segment { i: number; y1: number; y2: number; curve: number; props: Prop[]; tunnel: boolean; zone: Zone }

const TAU = Math.PI * 2;
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export const zoneAt = (i: number): Zone => (i < 270 ? 'town' : i < 640 ? 'plains' : i < 1060 ? 'ghat' : 'plateau');
/** 0 on the plains, 1 deep in the ghats. Drives mountain height, curve strength and colours. */
export const ghatness = (i: number) => smooth(560, 700, i) * (1 - smooth(1030, 1110, i));
/** 1 on the open road, easing to 0 so the last stretch before the garage is flat and straight. */
export const calm = (i: number) => (1 - smooth(1040, 1140, i)) * smooth(0, 60, i);
const inTunnel = (i: number) => smooth(TUNNEL[0] - 25, TUNNEL[0], i) * (1 - smooth(TUNNEL[1], TUNNEL[1] + 25, i));
const shape = (i: number) => calm(i) * (1 - inTunnel(i));

const hill = (i: number) => (1300 * Math.sin((i * TAU * 3) / N) + 480 * Math.sin((i * TAU * 7) / N)) * shape(i) * (0.6 + 0.9 * ghatness(i));
const bend = (i: number) =>
  ((3 * Math.sin((i * TAU * 4) / N) + 1.4 * Math.sin((i * TAU * 9) / N)) * (0.7 + 0.8 * ghatness(i)) + 2.6 * ghatness(i) * Math.sin((i * TAU * 23) / N)) * shape(i);
const rnd = (i: number) => Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;

export function buildTrack(milestones: readonly { top: string; label: string }[]): Segment[] {
  const segs: Segment[] = [];
  for (let i = 0; i < N; i++)
    segs.push({ i, y1: hill(i), y2: hill(i + 1), curve: bend(i), props: [], tunnel: i >= TUNNEL[0] && i < TUNNEL[1], zone: zoneAt(i) });
  const add = (i: number, p: Prop) => { if (segs[i] && !segs[i].tunnel) segs[i].props.push(p); };
  const addAny = (i: number, p: Prop) => segs[i]?.props.push(p);

  MILESTONE_SEGS.forEach((i, k) => milestones[k] && add(i, { o: -1.5, type: 'ms', label: milestones[k].top, sub: milestones[k].label }));
  for (let i = 0; i < FINISH + 60; i += 3) addAny(i, { o: 0, type: 'cateye' });
  for (let i = 0; i < N; i += 4) {
    add(i, { o: -1.16, type: 'post' });
    if (zoneAt(i) !== 'ghat') add(i, { o: 1.16, type: 'post' });
  }
  for (let i = 0; i < N; i++) {
    const z = zoneAt(i), r = rnd(i);
    if (nearHoarding(i)) continue;
    if (z === 'town') {
      if (i % 6 === 0 && i > 12) add(i, { o: (i % 12 ? 1 : -1) * (2.15 + r * 0.5), type: 'house', v: Math.floor(r * 4), label: ['MEDICAL', 'CYCLE MART', 'KIRANA', 'XEROX'][Math.floor(rnd(i + 3) * 4)] });
      if (i % 10 === 4) add(i, { o: 1.6, type: 'pole' });
    } else if (z === 'plains') {
      if (i % 5 === 0 && r > 0.25) add(i, { o: (rnd(i + 7) > 0.5 ? 1 : -1) * (2 + r * 2.2), type: 'tree', v: Math.floor(rnd(i + 1) * 2) });
      if (i % 16 === 8) add(i, { o: 1.6, type: 'pole' });
      if (i % 53 === 0) add(i, { o: (r > 0.5 ? 1 : -1) * 1.5, type: 'cow' });
    } else if (z === 'ghat') {
      if (i % 3 === 0) add(i, { o: -1.9 - r * 0.25, type: 'rock', v: i % 27 === 0 ? 1 : 0 });
      add(i, { o: 1.12, type: 'rail' });
      if (i % 97 === 11) add(i, { o: 1.12, type: 'monkey' });
      if (i % 6 === 0 && r > 0.3) add(i, { o: 2.4 + r * 2, type: 'tree', v: 0 });
    } else if (i < FINISH - 20) {
      if (i % 5 === 0 && r > 0.3) add(i, { o: (rnd(i + 7) > 0.5 ? 1 : -1) * (2 + r * 2), type: 'tree', v: Math.floor(rnd(i + 1) * 2) });
    }
  }
  add(200, { o: -2.3, type: 'stall', label: 'CHAI' });
  add(560, { o: 2.3, type: 'stall', label: 'VADA PAV' });
  for (const h of HOARDINGS) add(h.i, { o: h.o, type: 'hoarding', label: h.id });
  add(40, { o: 1.9, type: 'sign', label: 'GARAGE', sub: '24 KM' });
  add(655, { o: 1.9, type: 'sign', label: 'GHAT SECTION', sub: 'DRIVE SLOW' });
  add(TUNNEL[0] - 40, { o: -1.9, type: 'sign', label: 'TUNNEL', sub: 'LIGHTS ON' });
  add(FINISH - 90, { o: 1.9, type: 'sign', label: 'GARAGE', sub: 'NEXT LEFT' });
  add(FINISH, { o: -2.4, type: 'garage' });
  return segs;
}
