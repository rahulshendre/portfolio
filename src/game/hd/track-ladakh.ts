// The road: a finite list of segments in four chapters across Ladakh, ending at the garage.
//   leh     whitewashed houses, chortens, golden poplars, mani walls, prayer flags
//   valley  the Indus valley: open desert road, ochre mountains, army convoys
//   pass    the Khardung La climb: hairpins, snow, a canopy of prayer flags at the top
//   lake    down to a turquoise high-altitude lake, and the garage at dusk
export const SEG_L = 200;
export const ROAD_W = 1100;
export const N = 1400; // road keeps going past the garage so the horizon never runs out
export const FINISH = 1180; // garage sits here
export const MILESTONE_SEGS = [150, 420, 690, 960];
export const PASS_TOP = 900;
export const BOARDS = [
  { i: 95, id: 'pipecd', o: -2.1 },
  { i: 230, id: 'github', o: 2.1 },
  { i: 360, id: 'youtube', o: -2.1 },
  { i: 480, id: 'x', o: 2.1 },
  { i: 600, id: 'linkedin', o: -2.1 },
] as const;
// Border Roads Organisation signs: yellow stones, black paint, famously witty.
export const BRO = [
  { i: 320, lines: ['BE GENTLE', 'ON MY CURVES'] },
  { i: 545, lines: ['AFTER WHISKY', 'DRIVING RISKY'] },
  { i: 700, lines: ["IT'S NOT A RALLY", 'ENJOY THE VALLEY'] },
  { i: PASS_TOP - 12, lines: ['KHARDUNG LA', 'TOP 18380 FT'] },
  { i: 1010, lines: ['PEEP PEEP', "DON'T SLEEP"] },
] as const;

export type Zone = 'leh' | 'valley' | 'pass' | 'lake';
export type PropType =
  | 'house' | 'chorten' | 'poplar' | 'flags' | 'canopy' | 'mani' | 'boulder' | 'bro' | 'ms' | 'board' | 'stone' | 'snow' | 'yak' | 'garage' | 'sign';
export interface Prop { o: number; type: PropType; label?: string; sub?: string; lines?: readonly string[]; v?: number }
export interface Segment { i: number; y1: number; y2: number; curve: number; props: Prop[]; zone: Zone }

const TAU = Math.PI * 2;
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export const zoneAt = (i: number): Zone => (i < 270 ? 'leh' : i < 640 ? 'valley' : i < 1060 ? 'pass' : 'lake');
/** 0 in the valley, 1 near the top of the pass. Drives snow, peaks, curves and the colder light. */
export const altitude = (i: number) => smooth(620, PASS_TOP, i) * (1 - smooth(PASS_TOP + 40, 1080, i));
/** 1 on the open road, easing to 0 so the last stretch before the garage is flat and straight. */
export const calm = (i: number) => (1 - smooth(1040, 1140, i)) * smooth(0, 60, i);

const hill = (i: number) => (1200 * Math.sin((i * TAU * 3) / N) + 520 * Math.sin((i * TAU * 7) / N)) * calm(i) * (0.55 + 1.1 * altitude(i));
const bend = (i: number) =>
  ((2.8 * Math.sin((i * TAU * 4) / N) + 1.3 * Math.sin((i * TAU * 9) / N)) * (0.7 + 0.6 * altitude(i)) + 3.2 * altitude(i) * Math.sin((i * TAU * 21) / N)) * calm(i);
const rnd = (i: number) => Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;

export function buildTrack(milestones: readonly { top: string; label: string }[]): Segment[] {
  const segs: Segment[] = [];
  for (let i = 0; i < N; i++) segs.push({ i, y1: hill(i), y2: hill(i + 1), curve: bend(i), props: [], zone: zoneAt(i) });
  const add = (i: number, p: Prop) => segs[i]?.props.push(p);
  const clear = (i: number) => BOARDS.some((b) => i > b.i - 12 && i <= b.i + 2) || BRO.some((b) => i > b.i - 8 && i <= b.i + 1);

  MILESTONE_SEGS.forEach((i, k) => milestones[k] && add(i, { o: -1.45, type: 'ms', label: milestones[k].top, sub: milestones[k].label }));
  for (const b of BOARDS) add(b.i, { o: b.o, type: 'board', label: b.id });
  for (const b of BRO) add(b.i, { o: b.i % 2 ? 1.75 : -1.75, type: 'bro', lines: b.lines });

  for (let i = 4; i < FINISH + 80; i++) {
    const z = zoneAt(i), r = rnd(i), r2 = rnd(i + 17);
    // BRO-painted edge stones, black and yellow on the drop side of the pass
    if (i % 2 === 0) { add(i, { o: -1.13, type: 'stone', v: 0 }); add(i, { o: 1.13, type: 'stone', v: z === 'pass' ? 1 : 0 }); }
    if (clear(i)) continue;
    if (z === 'leh') {
      if (i % 7 === 0 && i > 14) add(i, { o: (i % 14 ? 1 : -1) * (2.2 + r * 0.7), type: 'house', v: Math.floor(r2 * 3) });
      if (i % 4 === 2) add(i, { o: (r > 0.5 ? 1 : -1) * (1.7 + r2 * 1.6), type: 'poplar', v: r2 > 0.3 ? 1 : 0 });
      if (i % 31 === 0) add(i, { o: (r > 0.5 ? 1 : -1) * 2.6, type: 'chorten' });
      if (i % 23 === 11) add(i, { o: (r > 0.5 ? 1 : -1) * 1.7, type: 'flags' });
      if (i >= 170 && i < 190) add(i, { o: -1.6, type: 'mani' });
    } else if (z === 'valley') {
      if (i % 5 === 0 && r > 0.4) add(i, { o: (r2 > 0.5 ? 1 : -1) * (1.8 + r * 3), type: 'boulder', v: Math.floor(r2 * 3) });
      if (i % 40 < 6 && i % 2 === 0) add(i, { o: (i % 80 < 40 ? 1 : -1) * (1.8 + r * 1.2), type: 'poplar', v: 1 });
      if (i % 47 === 0) add(i, { o: -1.7, type: 'flags' });
    } else if (z === 'pass') {
      const a = altitude(i);
      if (i % 4 === 0 && r > 0.35) add(i, { o: (r2 > 0.4 ? -1 : 1) * (1.8 + r * 2.4), type: 'boulder', v: Math.floor(r2 * 3) });
      if (r < a * 0.55) add(i, { o: (r2 > 0.5 ? 1 : -1) * (1.35 + r2 * 1.8), type: 'snow', v: Math.floor(r * 3) });
      if (i % 61 === 7) add(i, { o: (r > 0.5 ? 1 : -1) * 2.6, type: 'yak' });
      if (i > PASS_TOP - 14 && i < PASS_TOP + 10 && i % 3 === 0) add(i, { o: 0, type: 'canopy' });
      if (i === PASS_TOP + 4) add(i, { o: 2.4, type: 'chorten' });
      if (i % 29 === 0) add(i, { o: -1.7, type: 'flags' });
    } else {
      if (i % 5 === 0 && r > 0.45 && i < FINISH - 12) add(i, { o: (r2 > 0.5 ? 1 : -1) * (1.8 + r * 2.5), type: 'boulder', v: Math.floor(r2 * 3) });
      if (i === FINISH - 6) add(i, { o: -1.8, type: 'flags' });
    }
  }
  add(40, { o: 1.8, type: 'sign', label: 'GARAGE', sub: '140 KM' });
  add(FINISH - 90, { o: 1.8, type: 'sign', label: 'GARAGE', sub: 'NEXT LEFT' });
  add(FINISH, { o: -2.4, type: 'garage' });
  return segs;
}
