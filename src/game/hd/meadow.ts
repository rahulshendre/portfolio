// The roadside of the Bliss land (the old Windows XP wallpaper): round green trees, bushes, drifts of wildflowers. Same smooth shapes and the same low
// light from the right as the rest of the ride. In this land the dry things of Ladakh (boulders, scrub, snow, cairns, yaks, camels) are swapped for these.
import { at, box, circle, g, oval, rnd, stroke } from './draw';
import { BOARDS, BRO, FINISH, GARAGE_BOARDS, LAKE_FROM, shore, TOWNS } from './track-ladakh';
import { drawArch, drawBarn, drawBlossom as drawBlossomC, drawCastle, drawChurch, drawCottage, drawFolly, drawHamlet, drawHaystack, drawManor, drawPicnic, drawScarecrow, drawSignpost, drawStoneWall, drawTeaRoom, drawWell, drawWindmill } from './country';
import { drawBicycle, drawLampPost, drawProduceStand, drawShopfront, drawTollhouse, drawVillager, drawWelcomeArch } from './village';
import { drawPond } from './pond';
import { drawCollie, drawCows, drawDeer, drawFlock, drawHens, drawHorses, drawPaddock, drawRabbits } from './farm';

const SH = 'rgba(20,48,10,0.22)';
const LEAF: [string, string, string, string][] = [   // shaded base, body, lit top, highlight
  ['#35692a', '#4f9a35', '#86c64e', '#b4e36c'],
  ['#3a6e2a', '#5ba63a', '#9acf56', '#c6ea78'],
  ['#2f5f28', '#478f33', '#74b84a', '#a0d868'],
  ['#44722a', '#68ac3a', '#a8d45a', '#d2ee80'],
];
const BLOOM = ['#ffffff', '#ffe14a', '#ff9ac2', '#ffffff', '#8ab8ff', '#ffb04a'];

/** A round tree: a trunk, then a canopy of overlapping lobes, darkest on the left and catching the sun on the right. */
export function drawTree(sx: number, sy: number, k: number, v = 0) {
  const s = k * (0.85 + (v % 4) * 0.1);
  if (s < 0.1) return;
  const [a, b, c, d] = LEAF[v % LEAF.length];
  if (s < 0.2) {                                                                  // far off: a trunk, a dark canopy and its lit side are all that show
    at(sx, sy, s, () => { box(-3, -40, 6, 40, '#5a4030'); oval(0, -66, 36, 30, a); oval(10, -72, 26, 22, b); });
    return;
  }
  at(sx, sy, s, () => {
    oval(-20, 1, 42, 5, SH);                                                       // the shadow falls away from the sun
    box(-3.5, -40, 7, 40, '#5a4030'); box(1, -40, 2.5, 40, '#7a5a40');
    oval(0, -66, 38, 32, a); oval(-16, -58, 22, 20, a);
    oval(5, -70, 32, 28, b); oval(-8, -78, 18, 15, b);
    oval(14, -80, 20, 17, c); oval(0, -90, 15, 11, c);
    oval(20, -86, 9, 7, d); oval(8, -96, 6, 4, d);
  });
}

/** A low bush; some carry flowers. */
export function drawBush(sx: number, sy: number, k: number, v = 0) {
  const s = k * (0.7 + (v % 3) * 0.16);
  if (s < 0.12) return;
  const [a, b, c, d] = LEAF[v % LEAF.length];
  if (s < 0.22) { at(sx, sy, s, () => { oval(-6, -10, 26, 12, a); oval(8, -14, 18, 11, b); }); return; }
  at(sx, sy, s, () => {
    oval(-8, 1, 30, 4, SH);
    oval(-10, -10, 16, 11, a); oval(10, -10, 18, 13, b); oval(0, -17, 17, 12, b); oval(8, -21, 10, 7, c); oval(11, -23, 4, 3, d);
    if (v % 3 === 0) for (let i = 0; i < 6; i++) circle(-14 + rnd(v + i) * 30, -8 - rnd(v * 2 + i) * 16, 1.9, BLOOM[(v + i) % BLOOM.length]);
  });
}

/** A drift of wildflowers in the grass. */
export function drawFlowers(sx: number, sy: number, k: number, v = 0) {
  const s = k * (0.5 + (v % 3) * 0.1);
  if (s < 0.1) return;
  at(sx, sy, s, () => {                                                          // ten flowers, painted as three paths: stems, then the blooms by colour, then their yellow hearts
    g.strokeStyle = '#3f7a2a'; g.lineWidth = 1.5; g.lineCap = 'round'; g.beginPath();
    for (let i = 0; i < 10; i++) { const x = (rnd(v * 7 + i) - 0.5) * 44, h = 5 + rnd(v * 3 + i) * 8; g.moveTo(x, 1); g.lineTo(x + (rnd(i + v) - 0.5) * 3, -h); }
    g.stroke();
    for (let c = 0; c < BLOOM.length; c++) {
      g.beginPath();
      for (let i = 0; i < 10; i++) if ((v + i) % BLOOM.length === c) { const x = (rnd(v * 7 + i) - 0.5) * 44 + (rnd(i + v) - 0.5) * 3, h = 5 + rnd(v * 3 + i) * 8; g.moveTo(x + 2.4, -h - 1); g.arc(x, -h - 1, 2.4, 0, Math.PI * 2); }
      g.fillStyle = BLOOM[c]; g.fill();
    }
    g.beginPath();
    for (let i = 0; i < 10; i++) { const x = (rnd(v * 7 + i) - 0.5) * 44 + (rnd(i + v) - 0.5) * 3, h = 5 + rnd(v * 3 + i) * 8; g.moveTo(x + 0.9, -h - 1); g.arc(x, -h - 1, 0.9, 0, Math.PI * 2); }
    g.fillStyle = '#f8d84a'; g.fill();
  });
}

/** What a prop is called by the track, as the Bliss land draws it. */
export interface PropArgs { label?: string; sub?: string; lines?: readonly string[]; v?: number; o?: number }
type XpDraw = (sx: number, sy: number, k: number, p: PropArgs) => void;

/**
 * The Bliss land's version of every Himalayan prop that would look out of place on green hills: homes become cottages, shops, a church, a castle and windmills;
 * the monastery's prayer flags become bunting and blossom; yaks, camels, kiang and marmots become cows, sheep, deer and rabbits. A `null` means "nothing here".
 * Anything not listed (the road's signs, the poles, the garage, the lake's reeds and ducks) is drawn as it is.
 */
export const XP_DRAW: Record<string, XpDraw | null> = {
  // homes and streets
  house: (x, y, k, p) => drawCottage(x, y, k, p.v ?? 0),
  shop: (x, y, k, p) => drawShopfront(x, y, k, p.v ?? 0),
  gate: (x, y, k, p) => drawWelcomeArch(x, y, k, p.label ?? ''),
  stall: (x, y, k, p) => drawProduceStand(x, y, k, p.v ?? 0),
  monk: (x, y, k, p) => drawVillager(x, y, k, p.v ?? 0, p.o ?? 0),
  tourer: (x, y, k, p) => drawBicycle(x, y, k, p.v ?? 0),
  lamp: (x, y, k) => drawLampPost(x, y, k),
  dhaba: (x, y, k) => drawTeaRoom(x, y, k),
  camp: (x, y, k) => drawPicnic(x, y, k),
  summit: (x, y, k) => drawSignpost(x, y, k * 1.6),
  canopy: (x, y, k) => drawArch(x, y, k),
  // landmarks on the hills
  village: (x, y, k) => drawHamlet(x, y, k),
  gompa: (x, y, k) => drawChurch(x, y, k),
  palace: (x, y, k) => drawManor(x, y, k),
  monastery: (x, y, k) => drawCastle(x, y, k),
  stupahill: (x, y, k) => drawFolly(x, y, k),
  buddha: (x, y, k, p) => (p.v ? drawBlossomC(x, y, k * 2.6, 1) : drawWindmill(x, y, k * 1.1, true)),
  gurdwara: (x, y, k) => drawBarn(x, y, k),
  checkpost: (x, y, k) => drawTollhouse(x, y, k),
  // the little things the Himalaya puts at the roadside
  chorten: (x, y, k) => drawWell(x, y, k),
  mani: (x, y, k) => drawStoneWall(x, y, k),
  flags: (x, y, k, p) => drawBlossomC(x, y, k, p.v ?? 0),
  darchog: (x, y, k) => drawScarecrow(x, y, k),
  flagmound: (x, y, k) => drawHaystack(x, y, k),
  boulder: (x, y, k, p) => drawBush(x, y, k, p.v ?? 0),
  scrub: (x, y, k, p) => drawBush(x, y, k, p.v ?? 0),
  tuft: (x, y, k, p) => drawFlowers(x, y, k, p.v ?? 0),
  cairn: (x, y, k, p) => drawBush(x, y, k, p.v ?? 0),
  snow: null,
  // animals
  yak: (x, y, k, p) => drawCows(x, y, k, p.v ?? 0),
  camel: (x, y, k, p) => drawFlock(x, y, k * 0.75, p.v ?? 0),
  kiang: (x, y, k, p) => drawDeer(x, y, k * 0.55, p.v ?? 0),
  marmot: (x, y, k, p) => drawRabbits(x, y, k * 0.45, p.v ?? 0),
  dog: (x, y, k, p) => ((p.v ?? 0) % 2 ? drawCollie(x, y, k, p.v ?? 0) : drawHens(x, y, k, p.v ?? 0)),
  // what the Bliss land adds of its own (see xpExtras)
  tree: (x, y, k, p) => drawTree(x, y, k, p.v ?? 0),
  bush: (x, y, k, p) => drawBush(x, y, k, p.v ?? 0),
  flowers: (x, y, k, p) => drawFlowers(x, y, k, p.v ?? 0),
  cows: (x, y, k, p) => drawCows(x, y, k, p.v ?? 0),
  flock: (x, y, k, p) => drawFlock(x, y, k, p.v ?? 0),
  horses: (x, y, k, p) => drawHorses(x, y, k, p.v ?? 0),
  paddock: (x, y, k, p) => drawPaddock(x, y, k, p.v ?? 0),
  pond: (x, y, k, p) => drawPond(x, y, k * 1.1, p.v ?? 0),
  deer: (x, y, k, p) => drawDeer(x, y, k, p.v ?? 0),
  hens: (x, y, k, p) => drawHens(x, y, k, p.v ?? 0),
  windmill: (x, y, k) => drawWindmill(x, y, k * 0.8),
  farm: (x, y, k, p) => ((p.v ?? 0) % 2 ? drawBarn(x, y, k * 1.1) : drawCottage(x, y, k * 1.1, (p.v ?? 0) % 4)),
  wall: (x, y, k) => drawStoneWall(x, y, k),
};

/** The few roadside ponds, on the open stretches between the towns: the segment, and the side (-1 left, 1 right). */
export const PONDS = [{ i: 100, side: -1 }, { i: 378, side: 1 }, { i: 722, side: -1 }, { i: 850, side: 1 }] as const;
/** How far from the centre line a pond's middle lies (road half-widths): close enough to see from the saddle, clear of the verge. */
export const POND_O = 4.3;

export interface Extra { o: number; type: string; v: number }
/** Half the room each thing takes beside the road, in road half-widths, so nothing grows through it. Soft things (trees, bushes, flowers) give way to the rest. */
const FOOT: Record<string, number> = {
  house: 0.75, shop: 0.8, stall: 0.5, monk: 0.5, tourer: 0.5, lamp: 0.2, mani: 0.5, poplar: 0.35, flags: 0.45, chorten: 0.35, dhaba: 0.7, parked: 0.7, gurdwara: 0.9, camp: 0.5, village: 1.6, palace: 1.6,
  gompa: 1.6, monastery: 1.4, buddha: 0.8, stupahill: 1.6, checkpost: 0.8, board: 1.1, sign: 0.5, bro: 0.5, ms: 0.35, summit: 0.4, crew: 0.4, kiang: 0.8, camel: 0.8, dog: 0.3, darchog: 0.2,
  tree: 0.8, bush: 0.45, flowers: 0.35, cows: 1.3, flock: 1.2, deer: 1.0, hens: 0.55, paddock: 1.3, windmill: 0.7, farm: 0.9, pond: 1.4, flagmound: 0.35, wall: 0.6,
};
const SOFT = new Set(['tree', 'bush', 'flowers']);
export const crowds = (a: { o: number; type: string }, b: { o: number; type: string }) => Math.sign(a.o) === Math.sign(b.o) && Math.abs(a.o - b.o) < (FOOT[a.type] ?? 0) + (FOOT[b.type] ?? 0) && !!FOOT[a.type] && !!FOOT[b.type];
const SIDE = (q: number, salt: number) => (Math.sin(q * 7.7 + salt) > 0 ? 1 : -1);

/**
 * The trees and flowers the Bliss land adds beside segment `i` of the Ladakh track: the same ones for the same `salt`, a fresh roll for another. They keep clear of the town streets, the river,
 * the lake, the roadside boards and the garage with its huge signs. (Callers keep the result; it is not cached here.)
 */
export function xpExtras(i: number, salt = 0, own: readonly { o: number; type: string }[] = []): Extra[] {
  const qi = i + salt * 1.618, out: Extra[] = [], r = rnd(qi * 1.9 + 4), r2 = rnd(qi * 3.3 + 1), r3 = rnd(qi * 5.1 + 7), side = r2 > 0.5 ? 1 : -1;
  if (i % 3 === 0 && r > 0.35) out.push({ o: side * (3.1 + r3 * 5.2), type: 'tree', v: Math.floor(r * 40) });
  if (i % 7 === 2) out.push({ o: -side * (3.4 + r * 5.5), type: 'tree', v: Math.floor(r3 * 40) });
  if (i % 4 === 1 && r3 > 0.3) out.push({ o: side * (9 + r * 20), type: 'tree', v: Math.floor(r * 90) });      // on the far slopes: small and many
  if (i % 5 === 0) out.push({ o: -side * (1.65 + r3 * 0.5), type: 'flowers', v: Math.floor(r2 * 30) });
  if (i % 11 === 4) out.push({ o: side * (1.7 + r * 1.2), type: 'bush', v: Math.floor(r3 * 30) });
  // the farms: animals in the fields, windmills and barns on the slopes, haystacks and scarecrows, a stone wall running beside the lane in stretches
  if (i % 17 === 5 && r > 0.2) out.push({ o: SIDE(qi, 1) * (6 + r3 * 10), type: 'cows', v: i % 7 });
  if (i % 19 === 8 && r < 0.85) out.push({ o: SIDE(qi, 2) * (5.5 + r2 * 11), type: 'flock', v: i % 5 });
  if (i % 53 === 20) out.push({ o: SIDE(qi, 3) * (3.6 + r * 1.2), type: 'paddock', v: i % 4 });
  if (i % 47 === 33) out.push({ o: SIDE(qi, 4) * (16 + r3 * 12), type: 'deer', v: i % 6 });
  if (i % 41 === 12) out.push({ o: SIDE(qi, 5) * (2.7 + r * 1.2), type: 'hens', v: i % 5 });
  if (i % 31 === 17) out.push({ o: SIDE(qi, 6) * (3.4 + r2 * 3), type: 'flagmound', v: i % 3 });
  if (i % 79 === 40) out.push({ o: SIDE(qi, 7) * (3.4 + r * 2), type: 'darchog', v: 0 });
  if (i % 71 === 11) out.push({ o: SIDE(qi, 8) * (20 + r2 * 14), type: 'windmill', v: 0 });
  if (i % 83 === 61) out.push({ o: SIDE(qi, 9) * (11 + r3 * 9), type: 'farm', v: i % 6 });
  if (Math.floor(i / 60) % 3 === 1 && i % 9 === 0) out.push({ o: (Math.floor(i / 60) % 2 ? 1 : -1) * 1.95, type: 'wall', v: 0 });
  const pond = PONDS.find((pd) => pd.i === i);
  if (pond) {                                                                                  // a pond keeps its own patch of grass: nothing else grows in it
    for (let n = out.length - 1; n >= 0; n--) if (Math.sign(out[n].o) === pond.side && Math.abs(out[n].o - pond.side * POND_O) < 2.8) out.splice(n, 1);
    out.push({ o: pond.side * POND_O, type: 'pond', v: (i >> 3) % 6 });
  }
  const bill = GARAGE_BOARDS.find((b) => i > FINISH - b.back - 45 && i <= FINISH - b.back + 3);         // the huge garage boards stand clear, with an open view of them down the road
  const signed = BOARDS.some((b) => i > b.i - 12 && i <= b.i + 2) || BRO.some((b) => i > b.i - 8 && i <= b.i + 1);   // keep clear of the roadside boards
  const inTown = TOWNS.some((t) => i >= t.gate - 8 && i <= t.to + 4), river = i >= 270 && i < 620, lake = i >= LAKE_FROM - 10 && i < 1260, home = i >= FINISH - 56 && i <= FINISH + 8;
  const hard = out.filter((e) => !SOFT.has(e.type));
  const clear = (e: Extra) => !own.some((q) => crowds(e, q)) && (!SOFT.has(e.type) || !hard.some((h) => h !== e && crowds(e, h)));   // the country's own things and the farm's animals take their place first
  const kept = out.filter((e) => clear(e) && !(bill && Math.sign(e.o) === Math.sign(bill.o) && Math.abs(e.o) > 2.2) && !(signed && Math.abs(e.o) < 3.4) && !(inTown && Math.abs(e.o) < 5) && !(river && e.o < -2.4 && e.o > -9.5) && !(lake && e.o > shore(i) - 1.2 && e.o > 0) && !(home && Math.abs(e.o) < 8));
  return kept;
}
