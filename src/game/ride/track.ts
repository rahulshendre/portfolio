// The road: a finite list of segments with curves, hills and roadside props, ending at the garage.
export const SEG_L = 200;
export const ROAD_W = 1100;
export const N = 1400; // road keeps going past the garage so the horizon never runs out
export const FINISH = 1180; // garage sits here
export const MILESTONE_SEGS = [150, 420, 690, 960];

export type PropType = 'post' | 'pole' | 'tree' | 'stall' | 'ms' | 'sign' | 'garage' | 'windbreak';
export interface Prop { o: number; type: PropType; label?: string; sub?: string }
export interface Segment { i: number; y1: number; y2: number; curve: number; props: Prop[] }

const TAU = Math.PI * 2;
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** 1 on the open road, easing to 0 so the last stretch before the garage is flat and straight. */
export const calm = (i: number) => (1 - smooth(1040, 1140, i)) * smooth(0, 60, i);
const hill = (i: number) => (1300 * Math.sin((i * TAU * 3) / N) + 480 * Math.sin((i * TAU * 7) / N)) * calm(i);
const bend = (i: number) => (3 * Math.sin((i * TAU * 4) / N) + 1.4 * Math.sin((i * TAU * 9) / N)) * calm(i);
const rnd = (i: number) => Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;

export function buildTrack(milestones: readonly { top: string; label: string }[]): Segment[] {
  const segs: Segment[] = [];
  for (let i = 0; i < N; i++) segs.push({ i, y1: hill(i), y2: hill(i + 1), curve: bend(i), props: [] });
  const add = (i: number, p: Prop) => segs[i]?.props.push(p);

  MILESTONE_SEGS.forEach((i, k) => milestones[k] && add(i, { o: -1.5, type: 'ms', label: milestones[k].top, sub: milestones[k].label }));
  for (let i = 0; i < N; i += 4) { add(i, { o: -1.16, type: 'post' }); add(i, { o: 1.16, type: 'post' }); }
  for (let i = 8; i < FINISH - 20; i += 16) add(i, { o: 1.6, type: 'pole' });
  for (let i = 10; i < FINISH - 30; i += 5) if (rnd(i) > 0.25) add(i, { o: (rnd(i + 7) > 0.5 ? 1 : -1) * (2 + rnd(i) * 2.2), type: 'tree' });
  [300, 820].forEach((i) => add(i, { o: -2.3, type: 'stall', label: 'CHAI' }));
  add(40, { o: 1.9, type: 'sign', label: 'GARAGE', sub: '24 KM' });
  add(FINISH - 90, { o: 1.9, type: 'sign', label: 'GARAGE', sub: 'NEXT LEFT' });
  add(FINISH, { o: -2.4, type: 'garage' });
  return segs;
}
