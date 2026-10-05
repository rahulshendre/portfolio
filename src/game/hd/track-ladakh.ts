// The road, built from three chapters across Ladakh that the ride shuffles into a road that never ends. Every chapter starts and ends flat and straight with its rivers, fields and
// lake faded out, so any one can follow any other. The garage stands once in the last chapter, closed, with huge boards counting down to it.
//   leh     whitewashed houses, chortens, golden poplars, mani walls, prayer flags
//   valley  the Indus valley: open desert road, ochre mountains, army convoys
//   pass    the Khardung La climb: hairpins, snow, a canopy of prayer flags at the top
//   lake    down to a turquoise high-altitude lake, and the garage at dusk
import { grove } from './field';

export const SEG_L = 200;
export const ROAD_W = 1100;
export const N = 1400; // road keeps going past the garage so the horizon never runs out
export const FINISH = 1180; // garage sits here
export const MILESTONE_SEGS = [150, 420, 690, 960, 1110];
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
  { i: PASS_TOP - 12, lines: ['KHARDUNG LA', 'TOP 17582 FT'] },
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

/** The named towns along the way: a welcome gate, a street of shops either side, and a card as you ride in. `sparse` towns are villages. */
export interface Town { name: string; gate: number; to: number; sub: string; sparse?: boolean; leftOnly?: boolean }
export const TOWNS: Town[] = [
  { name: 'LEH', gate: 16, to: 62, sub: '' },
  { name: 'SHEY', gate: 224, to: 264, sub: 'THE OLD ROYAL PALACE', sparse: true },
  { name: 'THIKSEY', gate: 322, to: 352, sub: 'THE MONASTERY ON THE HILL' },
  { name: 'HUNDER', gate: 436, to: 472, sub: 'DUNES AND TWO-HUMPED CAMELS', sparse: true },
  { name: 'DISKIT', gate: 556, to: 606, sub: 'THE 32 M MAITREYA BUDDHA' },
  { name: 'SPANGMIK', gate: 1066, to: 1102, sub: 'HOMESTAYS ON THE LAKE SHORE', sparse: true, leftOnly: true },
];
/** The town a segment lies in or is just about to enter, if any. */
export const townAt = (i: number) => TOWNS.find((t) => i >= t.gate - 8 && i <= t.to)?.name;

export const LAKE_FROM = 990;
/** Where the lake shore lies, in road half-widths to the right of the centre line. */
export const shore = (i: number) => 3.7 + 1.0 * Math.sin(i * 0.03) + 0.4 * Math.sin(i * 0.11);

export type Zone = 'leh' | 'valley' | 'pass' | 'lake';
export type ChapterId = 'leh' | 'valley' | 'high';
/** The three stretches of road the endless ride is shuffled from: the town and its fields, the river valley with its villages and dunes, and the climb over the pass down to the lake and the garage. */
export const CHAPTERS: readonly { id: ChapterId; from: number; to: number }[] = [
  { id: 'leh', from: 0, to: 270 }, { id: 'valley', from: 270, to: 620 }, { id: 'high', from: 620, to: 1260 },
];
/** How many segments the road takes to straighten out at each end of a chapter. */
export const SEAM = 40;
export type PropType =
  | 'billboard' | 'gantry' | 'house' | 'chorten' | 'poplar' | 'flags' | 'canopy' | 'mani' | 'boulder' | 'bro' | 'ms' | 'board' | 'stone' | 'snow' | 'yak' | 'garage' | 'sign' | 'pole' | 'scrub' | 'tuft' | 'cairn' | 'chevron' | 'gompa' | 'palace' | 'stupahill' | 'reed' | 'duck' | 'dhaba' | 'parked' | 'kiang' | 'marmot' | 'lamp' | 'dog' | 'darchog' | 'flagmound' | 'village' | 'camel' | 'limit' | 'cone' | 'crew' | 'summit' | 'camp' | 'shop' | 'gate' | 'stall' | 'monk' | 'buddha' | 'monastery' | 'tourer' | 'gurdwara' | 'checkpost';
export interface Prop { o: number; type: PropType; label?: string; sub?: string; lines?: readonly string[]; v?: number }
export interface Segment { i: number; y1: number; y2: number; curve: number; props: Prop[]; zone: Zone }

const TAU = Math.PI * 2;
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export const zoneAt = (i: number): Zone => (i < 270 ? 'leh' : i < 640 ? 'valley' : i < 1060 ? 'pass' : 'lake');
/** 0 in the valley, 1 near the top of the pass. Drives snow, peaks, curves and the colder light. */
export const altitude = (i: number) => smooth(620, PASS_TOP, i) * (1 - smooth(PASS_TOP + 40, 1080, i));
/** Metres above sea level: Leh at 3500, the valley climbing, Khardung La at its real 5359 at the top, down to the lake at 4,225 m, where the garage is. */
export const elevation = (i: number) => Math.round(3500 + 200 * smooth(0, 620, i) + 1659 * altitude(i) + 525 * smooth(990, 1050, i));
/** 1 inside a chapter, easing to 0 at both its ends, so the seam between any two chapters is flat and straight and the heights meet exactly. */
const seam = (i: number) => { const c = CHAPTERS.find((q) => i >= q.from && i < q.to); return c ? smooth(c.from, c.from + SEAM, i) * (1 - smooth(c.to - SEAM, c.to, i)) : 0; };
/** 1 on the open road, easing to 0 at the chapter seams and on the last stretch before the garage, which is flat and straight. */
export const calm = (i: number) => (1 - smooth(1040, 1140, i)) * seam(i);

// How far each landscape feature has grown at a stretch of road, 0 (none) to 1 (full). Each lives inside one chapter and fades in and out within it.
export const terraceK = (i: number) => smooth(6, 30, i) * (1 - smooth(240, 270, i));
export const riverK = (i: number) => smooth(270, 300, i) * (1 - smooth(590, 620, i));
export const duneK = (i: number) => smooth(425, 455, i) * (1 - smooth(545, 585, i));
export const lakeK = (i: number) => smooth(LAKE_FROM - 30, LAKE_FROM + 20, i) * (1 - smooth(1215, 1255, i));
/** Huge boards on the way to the garage, counting it down. `back` is how many segments before the garage each stands. */
export const GARAGE_BOARDS = [{ back: 380, o: 7.4 }, { back: 260, o: -7.6 }, { back: 160, o: 7.4 }, { back: 90, o: -7.6 }] as const;
/** The distance the odometer would read to cover `segs` segments, in km. */
export const kmOf = (segs: number) => (segs * SEG_L) / 9000;

const hill = (i: number) => (1200 * Math.sin((i * TAU * 3) / N) + 520 * Math.sin((i * TAU * 7) / N)) * calm(i) * (0.55 + 1.1 * altitude(i)) + 3400 * altitude(i) * calm(i); // the climb up to the pass is real
const bend = (i: number) =>
  ((2.8 * Math.sin((i * TAU * 4) / N) + 1.3 * Math.sin((i * TAU * 9) / N)) * (0.7 + 0.6 * altitude(i)) + 3.2 * altitude(i) * Math.sin((i * TAU * 21) / N)) * calm(i);
let SALT = 0;
/** The same dice every time for a given salt; a new salt rolls the trees, rocks, houses and animals of a stretch afresh. */
const rnd = (i: number) => Math.abs(Math.sin((i + SALT) * 12.9898) * 43758.5453) % 1;

/** The whole road, or with `from` and `to` just that stretch of it (the rest left empty), its scenery rolled afresh by `salt`. */
export function buildTrack(milestones: readonly { top: string; label: string }[], opts: { salt?: number; from?: number; to?: number } = {}): Segment[] {
  const prev = SALT;
  SALT = opts.salt ?? 0;
  try { return build(milestones, opts.from ?? 0, Math.min(N, opts.to ?? N)); } finally { SALT = prev; }
}

function build(milestones: readonly { top: string; label: string }[], lo: number, hi: number): Segment[] {
  const segs: Segment[] = new Array(N);
  for (let i = lo; i < hi; i++) segs[i] = { i, y1: hill(i), y2: hill(i + 1), curve: bend(i), props: [], zone: zoneAt(i) };
  const add = (i: number, p: Prop) => segs[i]?.props.push(p);
  const clear = (i: number) => BOARDS.some((b) => i > b.i - 12 && i <= b.i + 2) || BRO.some((b) => i > b.i - 8 && i <= b.i + 1);
  /**
   * Scatter `type` beside segment `i` in clumps and clearings instead of on a beat: each side has its own drift of cover (`wave` segments to a clump); where it rises past
   * `from` things may stand, thicker the higher it gets (`rate` scales the chance). `kind` gives the prop's `v` and `reach` how far from the road it stands, both from a roll of the dice.
   */
  const scatter = (i: number, type: PropType, k: { wave: number; from: number; rate: number; salt: number; reach: (r: number) => number; kind?: (r: number) => number }) => {
    for (const side of [-1, 1]) {
      const d = grove(i, side, k.wave, SALT + k.salt);
      if (d < k.from || rnd(i * 2.9 + side * 7.3 + k.salt * 13) >= (d - k.from + 0.12) * k.rate) continue;
      const r = rnd(i * 4.3 + side * 3.1 + k.salt);
      add(i, { o: side * k.reach(r), type, v: k.kind ? k.kind(rnd(i * 6.7 + side + k.salt * 5)) : 0 });
    }
  };
  const third = (r: number) => Math.floor(r * 3);

  MILESTONE_SEGS.forEach((i, k) => milestones[k] && add(i, { o: -1.7, type: 'ms', label: milestones[k].top, sub: milestones[k].label }));
  for (const b of BOARDS) add(b.i, { o: b.o, type: 'board', label: b.id });
  for (const b of BRO) add(b.i, { o: b.i % 2 ? 1.55 : -1.55, type: 'bro', lines: b.lines });

  for (let i = Math.max(4, lo); i < Math.min(FINISH + 80, hi); i++) {
    const z = zoneAt(i), r = rnd(i), r2 = rnd(i + 17);
    // BRO-painted edge stones, black and yellow on the drop side of the pass
    if (i % 4 === 0) { add(i, { o: -1.13, type: 'stone', v: 0 }); add(i, { o: 1.13, type: 'stone', v: z === 'pass' ? 1 : 0 }); }
    if (clear(i)) continue;
    if (z === 'leh') {
      if (i % 7 === 0 && i > 14) add(i, { o: (i % 14 ? 1 : -1) * (2.2 + r * 0.7), type: 'house', v: r2 > 0.8 ? 3 : Math.floor(r2 * 3) });
      scatter(i, 'poplar', { wave: 16, from: 0.45, rate: 1.5, salt: 1, reach: (q) => 1.7 + q * 1.6, kind: (q) => (q > 0.3 ? 1 : 0) + 2 * Math.floor((q * 977) % 12) });   // golden groves by the houses, bare stretches between
      if (i % 31 === 0) add(i, { o: (r > 0.5 ? 1 : -1) * 2.6, type: 'chorten' });
      if (i % 23 === 11) add(i, { o: (r > 0.5 ? 1 : -1) * 1.7, type: 'flags' });
      if (i >= 170 && i < 190) add(i, { o: -2.6, type: 'mani' });
    } else if (z === 'valley') {
      scatter(i, 'boulder', { wave: 10, from: 0.52, rate: 0.8, salt: 2, reach: (q) => 1.8 + q * 3, kind: third });
      if (i % 2 === 0) scatter(i, 'poplar', { wave: 12, from: 0.66, rate: 1.6, salt: 3, reach: (q) => 1.8 + q * 1.2, kind: (q) => 1 + 2 * Math.floor((q * 977) % 12) });
      if (i % 47 === 0) add(i, { o: -1.7, type: 'flags' });
    } else if (z === 'pass') {
      const a = altitude(i);
      scatter(i, 'boulder', { wave: 9, from: 0.5, rate: 1, salt: 2, reach: (q) => 1.8 + q * 2.4, kind: third });
      if (r < a * 0.55) add(i, { o: (r2 > 0.5 ? 1 : -1) * (1.35 + r2 * 1.8), type: 'snow', v: Math.floor(r * 3) });
      if (i % 61 === 7) add(i, { o: (r > 0.5 ? 1 : -1) * 2.6, type: 'yak' });
      if (i > PASS_TOP - 14 && i < PASS_TOP + 10 && i % 3 === 0) add(i, { o: 0, type: 'canopy' });
      if (i === PASS_TOP + 4) add(i, { o: 2.4, type: 'chorten' });
      if (i % 29 === 0) add(i, { o: -1.7, type: 'flags' });
    } else {
      if (i < FINISH - 12) scatter(i, 'boulder', { wave: 10, from: 0.54, rate: 0.8, salt: 2, reach: (q) => 1.8 + q * 2.5, kind: third });
      if (i === FINISH - 6) add(i, { o: -1.8, type: 'flags' });
    }
  }
  // the country around the road: poles marching along one side, scrub and grass, cairns at the pass, chevrons on the bends
  for (let i = Math.max(6, lo); i < Math.min(FINISH + 40, hi); i++) {
    if (clear(i)) continue;
    const z = zoneAt(i), r = rnd(i * 1.7 + 3);
    if (i % 9 === 3 && (z !== 'pass' || i < 780) && i < FINISH - 20) add(i, { o: 1.72, type: 'pole' });                  // poles do march: that beat is real
    if (z === 'valley' || z === 'lake') scatter(i, 'scrub', { wave: 14, from: 0.4, rate: 1.4, salt: 4, reach: (q) => 1.5 + q * 5, kind: third });
    if (z === 'leh') scatter(i, 'scrub', { wave: 14, from: 0.44, rate: 1.3, salt: 4, reach: (q) => 1.5 + q * 3, kind: third });
    if (z === 'lake') scatter(i, 'tuft', { wave: 11, from: 0.4, rate: 1.1, salt: 5, reach: (q) => 1.5 + q * 4, kind: third });
    if (z === 'pass' && i % 37 === 11) add(i, { o: (r > 0.5 ? 1 : -1) * 1.9, type: 'cairn' });
    if (Math.abs(segs[i].curve) > 2 && i % 8 === 0) add(i, { o: segs[i].curve > 0 ? -1.62 : 1.62, type: 'chevron', v: segs[i].curve > 0 ? 1 : -1 });
  }
  // landmarks on the hills either side of the road
  add(46, { o: 24, type: 'stupahill' });
  add(112, { o: -24, type: 'palace' });
  add(300, { o: -26, type: 'gompa' });
  add(640, { o: 26, type: 'gompa' });
  // keep the left of the valley clear for the river
  for (let i = Math.max(270, lo); i < Math.min(620, hi); i++) segs[i].props = segs[i].props.filter((p) => !(p.o < -3 && p.o > -8.5 && (p.type === 'boulder' || p.type === 'scrub')));
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
  for (let i = Math.max(LAKE_FROM - 10, lo); i < Math.min(1215, hi); i++) {
    const sh = shore(i);
    segs[i].props = segs[i].props.filter((p) => !(p.o > sh - 0.6 && p.type !== 'flags'));
    if (i > LAKE_FROM && i % 3 === 0 && rnd(i * 5.3) > 0.25) add(i, { o: sh + 0.1 + rnd(i * 2.1) * 0.6, type: 'reed', v: Math.floor(rnd(i) * 3) });
    if (i > LAKE_FROM + 20 && i % 19 === 5) add(i, { o: sh + 2.2 + rnd(i * 7.7) * 5, type: 'duck', v: i });
  }
  // the towns: a gate across the road, then a street of shops on both sides with stalls, monks and street lamps, the country's own clutter cleared away
  for (const town of TOWNS) {
    const step = town.sparse ? 10 : 6, homey = [1, 6, 5, 3];
    add(town.gate, { o: 0, type: 'gate', label: town.name });
    add(town.gate - 3, { o: 1.95, type: 'limit', v: 30 });
    for (let i = Math.max(town.gate, lo); i <= Math.min(town.to, hi - 1); i++) segs[i].props = segs[i].props.filter((p) => p.type === 'stone' || p.type === 'pole' || p.type === 'gate' || p.type === 'limit' || p.type === 'ms' || p.type === 'board' || p.type === 'bro' || p.type === 'sign' || Math.abs(p.o) > 3.4);
    for (let i = town.gate + 6, n = 0; i <= town.to; i += step, n++) {
      const pick = (s: number) => (town.sparse ? homey[Math.floor(rnd(s) * homey.length)] : Math.floor(rnd(s) * 8));
      if (!clear(i)) add(i, { o: -(1.95 + rnd(i) * 0.15), type: 'shop', v: pick(i * 1.3) });
      if (!town.leftOnly && !clear(i + step / 2)) add(i + Math.floor(step / 2), { o: 1.95 + rnd(i + 5) * 0.15, type: 'shop', v: pick(i * 2.7) });
      if (n % 3 === 1 && !clear(i + 2)) add(i + 2, { o: (n % 2 ? 1 : -1) * (town.leftOnly ? -1 : 1) * 1.45, type: 'stall', v: n });
      if (n % 2 === 0 && !clear(i + 1)) add(i + 1, { o: (n % 4 ? -1 : 1) * (town.leftOnly ? -1 : 1) * 1.38, type: 'monk', v: n });
      if (!town.sparse && n % 2 === 1) add(i, { o: -1.62, type: 'lamp' });
      if (n % 3 === 0 && !clear(i + 4)) for (let b = 0; b < 2; b++) add(i + 3 + b * 2, { o: (n % 2 ? 1 : -1) * (town.leftOnly ? -1 : 1) * 1.36, type: 'tourer', v: n + b });   // a row of touring bikes outside the cafe
    }
    // the way in: a distance board, then a chorten and a mani wall at the edge of town, and a darchog pole once you are through the gate
    const board = MILESTONE_SEGS.some((m) => Math.abs(m - (town.gate - 26)) < 14) ? town.gate - 42 : town.gate - 26;   // keep the distance board off the milestone
    if (!clear(board)) add(board, { o: -1.85, type: 'sign', label: town.name, sub: `${3 + (town.gate % 5)} KM` });
    if (town.gate > 30) { add(town.gate - 7, { o: 2.9, type: 'chorten' }); for (let i = town.gate - 10; i < town.gate - 3; i += 2) add(i, { o: -2.7, type: 'mani' }); add(town.gate + 12, { o: 3.6, type: 'darchog' }); }
  }
  add(236, { o: -9, type: 'buddha', v: 1 }); add(244, { o: 12, type: 'palace' });      // Shey: the gilded Buddha and the old palace above the village
  add(340, { o: 11, type: 'monastery' });                                              // Thiksey, stacked up its hill
  add(578, { o: 10, type: 'buddha', v: 0 }); add(590, { o: 14, type: 'gompa' });       // Diskit: the Maitreya and the gompa above the town
  for (const [i, o] of [[446, 5.8], [468, -5.4]] as const) add(i, { o, type: 'camp' });    // Hunder's dune camps
  add(198, { o: 3.1, type: 'gurdwara' }); add(206, { o: 1.85, type: 'sign', label: 'MAGNETIC HILL', sub: 'ZONE' });   // the Leh-Kargil highway's landmarks
  add(664, { o: 2.3, type: 'checkpost' });                                                                              // the army check post at the foot of the pass
  // the garage: huge boards counting down to it, a gantry over the road just before, then the building itself, shut
  for (const b of GARAGE_BOARDS) add(FINISH - b.back, { o: b.o, type: 'billboard', label: 'SHENDRE', sub: `GARAGE · ${Math.round(kmOf(b.back) * 2) / 2} KM` });
  add(FINISH - 36, { o: 0, type: 'gantry', label: 'SHENDRE', sub: 'GARAGE' });
  add(FINISH, { o: -4.1, type: 'garage' });
  for (let i = FINISH - 44; i < FINISH; i += 8) add(i, { o: -1.75, type: 'lamp' });   // the lit approach
  return segs;
}
