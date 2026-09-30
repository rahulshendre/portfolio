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
  { i: 95, id: 'pipecd', o: -1.9 },
  { i: 230, id: 'github', o: 1.9 },
  { i: 360, id: 'youtube', o: -1.9 },
  { i: 480, id: 'x', o: 1.9 },
  { i: 600, id: 'linkedin', o: -1.9 },
] as const;
// Border Roads Organisation signs: yellow stones, black paint, famously witty.
export const BRO = [
  { i: 320, lines: ['BE GENTLE', 'ON MY CURVES'] },
  { i: 545, lines: ['AFTER WHISKY', 'DRIVING RISKY'] },
  { i: 700, lines: ["IT'S NOT A RALLY", 'ENJOY THE VALLEY'] },
  { i: PASS_TOP - 12, lines: ['KHARDUNG LA', 'TOP 18380 FT'] },
  { i: 1010, lines: ['PEEP PEEP', "DON'T SLEEP"] },
  { i: 190, lines: ['HURRY BURRY', 'SPOIL THE CURRY'] },
  { i: 270, lines: ['DARLING I LIKE YOU', 'BUT NOT SO FAST'] },
  { i: 640, lines: ['IF MARRIED', 'DIVORCE SPEED'] },
  { i: 820, lines: ['BE GENTLE ON', 'THE ACCELERATOR'] },
  { i: 1110, lines: ['HOME IS NEAR', 'CHAI IS READY'] },
  { i: 105, lines: ['BE MISTER LATE', 'THAN LATE MISTER'] },
  { i: 250, lines: ['LIFE IS SHORT', "DON'T MAKE IT SHORTER"] },
  { i: 290, lines: ['ON THE CURVE', 'BE NERVE'] },
  { i: 385, lines: ['SPEED THRILLS', 'BUT KILLS'] },
  { i: 455, lines: ['SAFETY ON ROAD', 'SAFE TEA AT HOME'] },
  { i: 520, lines: ['DO NOT GOSSIP', 'LET HIM DRIVE'] },
  { i: 580, lines: ['NO HURRY', 'NO WORRY'] },
  { i: 665, lines: ['DRIVE LIKE HELL', 'YOU WILL BE THERE'] },
  { i: 745, lines: ['I AM CURVACEOUS', 'BE SLOW'] },
  { i: 780, lines: ['THIN AIR AHEAD', 'BREATHE AND BREAK'] },
  { i: 850, lines: ['ALWAYS END YOUR DRIVE', 'BEFORE THE DRIVE ENDS YOU'] },
  { i: 935, lines: ['WATCH THE EDGE', 'ENJOY THE LEDGE'] },
  { i: 970, lines: ['ALTITUDE IS A GIFT', 'OPEN IT SLOWLY'] },
  { i: 1040, lines: ['HORN OK PLEASE', 'PEEP PEEP'] },
] as const;

export const LAKE_FROM = 990;
/** Where the lake shore lies, in road half-widths to the right of the centre line. */
export const shore = (i: number) => 3.7 + 1.0 * Math.sin(i * 0.03) + 0.4 * Math.sin(i * 0.11);

export type Zone = 'leh' | 'valley' | 'pass' | 'lake';
export type PropType =
  | 'house' | 'chorten' | 'poplar' | 'flags' | 'canopy' | 'mani' | 'boulder' | 'bro' | 'ms' | 'board' | 'stone' | 'snow' | 'yak' | 'garage' | 'sign' | 'pole' | 'scrub' | 'tuft' | 'cairn' | 'chevron' | 'gompa' | 'palace' | 'stupahill' | 'reed' | 'duck' | 'dhaba' | 'parked' | 'kiang' | 'marmot' | 'lamp' | 'dog' | 'darchog' | 'flagmound' | 'village' | 'camel' | 'limit' | 'cone' | 'crew' | 'summit' | 'camp';
export interface Prop { o: number; type: PropType; label?: string; sub?: string; lines?: readonly string[]; v?: number }
export interface Segment { i: number; y1: number; y2: number; curve: number; props: Prop[]; zone: Zone }

const TAU = Math.PI * 2;
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export const zoneAt = (i: number): Zone => (i < 270 ? 'leh' : i < 640 ? 'valley' : i < 1060 ? 'pass' : 'lake');
/** 0 in the valley, 1 near the top of the pass. Drives snow, peaks, curves and the colder light. */
export const altitude = (i: number) => smooth(620, PASS_TOP, i) * (1 - smooth(PASS_TOP + 40, 1080, i));
/** Metres above sea level: Leh at 3500, the valley climbing, Khardung La at its real 5359 at the top, down to the lake at about 4250. */
export const elevation = (i: number) => Math.round(3500 + 200 * smooth(0, 620, i) + 1659 * altitude(i) + 350 * smooth(1040, 1160, i));
/** 1 on the open road, easing to 0 so the last stretch before the garage is flat and straight. */
export const calm = (i: number) => (1 - smooth(1040, 1140, i)) * smooth(0, 60, i);

const hill = (i: number) => (1200 * Math.sin((i * TAU * 3) / N) + 520 * Math.sin((i * TAU * 7) / N)) * calm(i) * (0.55 + 1.1 * altitude(i)) + 3400 * altitude(i) * calm(i); // the climb up to the pass is real
const bend = (i: number) =>
  ((2.8 * Math.sin((i * TAU * 4) / N) + 1.3 * Math.sin((i * TAU * 9) / N)) * (0.7 + 0.6 * altitude(i)) + 3.2 * altitude(i) * Math.sin((i * TAU * 21) / N)) * calm(i);
const rnd = (i: number) => Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;

export function buildTrack(milestones: readonly { top: string; label: string }[]): Segment[] {
  const segs: Segment[] = [];
  for (let i = 0; i < N; i++) segs.push({ i, y1: hill(i), y2: hill(i + 1), curve: bend(i), props: [], zone: zoneAt(i) });
  const add = (i: number, p: Prop) => segs[i]?.props.push(p);
  const clear = (i: number) => BOARDS.some((b) => i > b.i - 12 && i <= b.i + 2) || BRO.some((b) => i > b.i - 8 && i <= b.i + 1);

  MILESTONE_SEGS.forEach((i, k) => milestones[k] && add(i, { o: -1.7, type: 'ms', label: milestones[k].top, sub: milestones[k].label }));
  for (const b of BOARDS) add(b.i, { o: b.o, type: 'board', label: b.id });
  for (const b of BRO) add(b.i, { o: b.i % 2 ? 1.55 : -1.55, type: 'bro', lines: b.lines });

  for (let i = 4; i < FINISH + 80; i++) {
    const z = zoneAt(i), r = rnd(i), r2 = rnd(i + 17);
    // BRO-painted edge stones, black and yellow on the drop side of the pass
    if (i % 4 === 0) { add(i, { o: -1.13, type: 'stone', v: 0 }); add(i, { o: 1.13, type: 'stone', v: z === 'pass' ? 1 : 0 }); }
    if (clear(i)) continue;
    if (z === 'leh') {
      if (i % 7 === 0 && i > 14) add(i, { o: (i % 14 ? 1 : -1) * (2.2 + r * 0.7), type: 'house', v: r2 > 0.8 ? 3 : Math.floor(r2 * 3) });
      if (i % 4 === 2) add(i, { o: (r > 0.5 ? 1 : -1) * (1.7 + r2 * 1.6), type: 'poplar', v: r2 > 0.3 ? 1 : 0 });
      if (i % 31 === 0) add(i, { o: (r > 0.5 ? 1 : -1) * 2.6, type: 'chorten' });
      if (i % 23 === 11) add(i, { o: (r > 0.5 ? 1 : -1) * 1.7, type: 'flags' });
      if (i >= 170 && i < 190) add(i, { o: -2.6, type: 'mani' });
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
  // the country around the road: poles marching along one side, scrub and grass, cairns at the pass, chevrons on the bends
  for (let i = 6; i < FINISH + 40; i++) {
    if (clear(i)) continue;
    const z = zoneAt(i), r = rnd(i * 1.7 + 3), r2 = rnd(i * 3.1 + 9);
    if (i % 9 === 3 && (z !== 'pass' || i < 780) && i < FINISH - 20) add(i, { o: 1.72, type: 'pole' });
    if ((z === 'valley' || z === 'lake') && i % 2 === 0 && r > 0.4) add(i, { o: (r2 > 0.5 ? 1 : -1) * (1.5 + r * 5), type: 'scrub', v: Math.floor(r2 * 3) });
    if (z === 'leh' && i % 3 === 1 && r > 0.5) add(i, { o: (r2 > 0.5 ? 1 : -1) * (1.5 + r * 3), type: 'scrub', v: Math.floor(r2 * 3) });
    if (z === 'lake' && i % 2 === 1 && r > 0.3) add(i, { o: (r2 > 0.5 ? 1 : -1) * (1.5 + r * 4), type: 'tuft', v: Math.floor(r2 * 3) });
    if (z === 'pass' && i % 37 === 11) add(i, { o: (r > 0.5 ? 1 : -1) * 1.9, type: 'cairn' });
    if (Math.abs(segs[i].curve) > 2 && i % 8 === 0) add(i, { o: segs[i].curve > 0 ? -1.62 : 1.62, type: 'chevron', v: segs[i].curve > 0 ? 1 : -1 });
  }
  // landmarks on the hills either side of the road
  add(46, { o: 24, type: 'stupahill' });
  add(112, { o: -24, type: 'palace' });
  add(300, { o: -26, type: 'gompa' });
  add(640, { o: 26, type: 'gompa' });
  // keep the left of the valley clear for the river
  for (let i = 270; i < 700; i++) segs[i].props = segs[i].props.filter((p) => !(p.o < -3 && p.o > -8.5 && (p.type === 'boulder' || p.type === 'scrub')));
  // kiang out on the plains, well off the road
  for (const [i, o] of [[330, -12], [560, 8], [1020, -9], [1130, -13]] as const) add(i, { o, type: 'kiang', v: i });
  for (let i = 700; i < 1000; i += 37) add(i, { o: (i % 2 ? 1 : -1) * (2.1 + rnd(i) * 0.9), type: 'marmot', v: i });   // marmots on the rocks up at the pass
  for (const [i, o] of [[36, 2.1], [130, -2.0], [200, 2.2], [414, 2.6], [758, -2.5]] as const) add(i, { o, type: 'dog', v: i });   // a stray dog here and there, by the shops and stalls
  // tall darchog poles by the chortens and monasteries, and flag-heaped cairns at the top of the pass
  for (const [i, o] of [[62, 3.4], [154, -3.6], [186, 3.5], [296, -3.8], [645, 3.9]] as const) add(i, { o, type: 'darchog' });
  for (const [i, o] of [[PASS_TOP - 6, 3.6], [PASS_TOP + 9, -4.6], [PASS_TOP + 14, 4.2]] as const) add(i, { o, type: 'flagmound' });
  // villages on the hills, camels on the Nubra sand, speed limits where the road goes through a town or clings to the mountain
  for (const [i, o] of [[80, -19], [212, 21], [372, 22], [512, -22], [770, 23], [1050, -21]] as const) add(i, { o, type: 'village' });
  for (const [i, o] of [[452, 5.4], [458, 6.8], [503, 5.8], [509, 7.2]] as const) add(i, { o, type: 'camel' });
  for (const [i, v] of [[10, 40], [246, 40], [652, 30], [1004, 40]] as const) add(i, { o: 1.95, type: 'limit', v });
  // the summit board, and a BRO crew mending the road on the climb, with cones marking the edge
  add(PASS_TOP - 3, { o: -3.3, type: 'summit' });
  add(726, { o: -1.9, type: 'crew' });
  for (let i = 712; i < 726; i += 2) add(i, { o: -1.12, type: 'cone' });
  for (const [i, o] of [[1032, -4.6], [1078, -5.2], [1112, -4.4]] as const) add(i, { o, type: 'camp' });   // lakeside camps
  // the tea stalls: one in the valley with a truck parked beside it, one at the foot of the pass
  add(415, { o: 3.6, type: 'dhaba' }); add(420, { o: 1.95, type: 'parked' });
  add(752, { o: -3.6, type: 'dhaba' });
  // the lake: nothing but reeds and ducks in the water, and keep rocks and scrub out of it
  for (let i = LAKE_FROM - 10; i < N; i++) {
    const sh = shore(i);
    segs[i].props = segs[i].props.filter((p) => !(p.o > sh - 0.6 && p.type !== 'flags'));
    if (i > LAKE_FROM && i % 3 === 0 && rnd(i * 5.3) > 0.25) add(i, { o: sh + 0.1 + rnd(i * 2.1) * 0.6, type: 'reed', v: Math.floor(rnd(i) * 3) });
    if (i > LAKE_FROM + 20 && i % 19 === 5) add(i, { o: sh + 2.2 + rnd(i * 7.7) * 5, type: 'duck', v: i });
  }
  add(40, { o: 1.8, type: 'sign', label: 'GARAGE', sub: '140 KM' });
  add(FINISH - 90, { o: 1.8, type: 'sign', label: 'GARAGE', sub: 'NEXT LEFT' });
  add(FINISH, { o: -4.1, type: 'garage' });
  for (let i = FINISH - 44; i < FINISH; i += 8) add(i, { o: -1.75, type: 'lamp' });   // the lit approach
  return segs;
}
