// Smooth OutRun-style road for the Ladakh track.
import { CAM_DEPTH, project, type Projected } from '../ride/project';
import { drawBackground, type Env } from './background';
import { mix, poly as fillPoly, smooth, use } from './draw';
import { drawProp, setLand, setTod } from './props';
import { xpExtras } from './meadow';
import { puddleAt, puddleHalf } from './puddles';
import { setStirSeg } from './stir';
export { LIGHTS } from './props';
import { altitude, duneK, laneAt, LANE_END, LANE_FROM, LANE_G, laneShift, lakeK, riverK, shore, ROAD_W, SEG_L, terraceK, type Prop, type Segment } from './track-ladakh';
import type { VSeg } from './endless';
import { drawCar, type Car } from './traffic';

/** Wear on the near ground and road: pebbles and dust on the verge, cracks and patches, tyre tracks in the lane, darker edges. */
function texture(g: CanvasRenderingContext2D, i: number, p1: Projected, p2: Projected, W: number, alt: number, near: number, xp = false) {
  const h = p1.y - p2.y, a = 1 - near / 34, r = (n: number) => Math.abs(Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1;
  g.globalAlpha = 0.5 * a;
  for (let k = 0; k < 7; k++) {                               // pebbles and dust on the verge, either side
    const side = k % 2 ? 1 : -1, x = p1.x + side * (p1.w * (1.45 + r(k) * 4.5)), y = p2.y + r(k + 9) * h, sz = 1 + r(k + 3) * 2.4 * (1 + a);
    g.fillStyle = xp ? (r(k + 5) > 0.5 ? '#3f7a2a' : '#c4e87a') : (r(k + 5) > 0.5 ? '#7a5a3c' : '#e0c8a0'); g.fillRect(x, y, sz * 1.5, sz);
  }
  g.globalAlpha = 0.22 * a;
  for (const sd of [-1, 1]) if (r(10 + sd) > 0.35) trap2(g, p1, p2, sd * (0.975 - r(11 + sd) * 0.05), 0.03 + r(12 + sd) * 0.03, xp ? '#8a9a5a' : '#c8b08a');   // dust and grit drifted in from the verge, thicker in places
  g.globalAlpha = 0.2 * a;
  for (const off of [-0.3, 0.3]) trap2(g, p1, p2, off, 0.055, '#141210');                  // tyre tracks polished into the road
  if (r(13) > 0.86) trap2(g, p1, p2, (r(14) - 0.5) * 0.45, 0.04 + r(15) * 0.05, '#131315');    // an oil stain
  const blk = Math.floor(i / 9), rb = (n: number) => Math.abs(Math.sin(blk * 12.9898 + n * 78.233) * 43758.5453) % 1;
  if (rb(1) > 0.55) { g.globalAlpha = 0.5 * a; trap2(g, p1, p2, (rb(2) - 0.5) * 1.5, 0.007 + rb(3) * 0.006, '#1c1a18'); }  // a seam of tar running down the road for a few segments
  g.globalAlpha = 0.5 * a;
  if (r(1) > 0.82) { g.strokeStyle = '#2a2622'; g.lineWidth = Math.max(1, p1.w * 0.006); g.beginPath();   // a crack across the road
    const x0 = p1.x + (r(2) - 0.5) * p1.w * 1.4; g.moveTo(x0, p1.y); g.lineTo(x0 + (r(3) - 0.5) * p1.w * 0.5, (p1.y + p2.y) / 2); g.lineTo(x0 + (r(4) - 0.5) * p1.w * 0.6, p2.y); g.stroke(); }
  if (r(6) > 0.86) { g.globalAlpha = 0.3 * a; trap2(g, p1, p2, (r(7) - 0.5) * 1.3, 0.08 + r(8) * 0.1, r(9) > 0.5 ? '#2e2b28' : '#8a867e'); } // a patch of fresh tar, or of old bleached tarmac, in perspective with the road
  if (r(16) > 0.93) {                                                                       // a pothole: a dark hollow with the sun catching its far lip
    const px = p1.x + p1.w * (r(17) - 0.5) * 1.3, py = (p1.y + p2.y) / 2, rx = Math.max(1.5, p1.w * (0.05 + r(18) * 0.05)), ry = Math.max(1, h * 0.2);
    g.globalAlpha = 0.75 * a; g.fillStyle = '#161514'; g.beginPath(); g.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 0.22 * a; g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(px + rx * 0.12, py - ry * 0.7, rx * 0.8, Math.max(0.5, ry * 0.2), 0, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
}
function trap2(g: CanvasRenderingContext2D, p1: Projected, p2: Projected, off: number, wd: number, col: string) {
  fillPoly([p1.x + p1.w * (off - wd), p1.y, p1.x + p1.w * (off + wd), p1.y, p2.x + p2.w * (off + wd), p2.y, p2.x + p2.w * (off - wd), p2.y], col);
}

export interface View {
  W: number; H: number; HZ: number;
  pos: number; px: number; camH: number;
  bgOff: number; t: number; env: Env; lite?: boolean;
  /** From this segment on, the exit lane to the garage is the road the bike is on (and the main road is drawn beside it). */
  fork?: number;
  /** Multiplies the distance haze: about 2.4 in fog. */
  fogK?: number;
  /** Rain on the Bliss land: puddles lie on the road and the verge. */
  wet?: boolean;
  /** the colour distant land fades to (matches the sky at the horizon) */
  haze: string;
}

type Seg = VSeg & { p1?: Projected; clip?: number; camX1?: number; camX2?: number };   // camX: the sideways offset from the camera at each end of the segment, so things can be placed part-way along it

export const DRAW_DIST = 180;

type AnyProp = { o: number; type: string; label?: string; sub?: string; lines?: readonly string[]; v?: number };
/** A segment's own props plus the Bliss land's trees and flowers, joined once and kept on the segment (the props never change, so a frame does no allocating). */
export const meadowOf = (s: VSeg): readonly AnyProp[] => (s.merged ??= (() => { const e = (s.extras ??= xpExtras(s.src, s.salt, s.props)); return e.length ? [...s.props, ...e] : s.props; })()) as readonly AnyProp[];
/** Props are drawn in a unit space about 55 units to a house, against a road 2200 units across, so they scale up from the road's own scale. */
const PROP_K = ROAD_W / 55;
/** Signs and boards were drawn in bigger units than houses, so each gets its own size against the road (a board is about the road's half-width). */
const PROP_SIZE: Record<string, number> = { billboard: 1.7, gantry: 1.15, board: 0.46, bro: 0.44, sign: 0.52, stone: 0.26, chevron: 0.3, pole: 0.9, gompa: 3, palace: 3, stupahill: 3, ms: 0.75, lamp: 0.9, kiang: 1.5, marmot: 1.6, darchog: 0.9, cone: 0.5, crew: 0.9, summit: 0.6, camp: 1.1, village: 3, buddha: 1.5, monastery: 1.5, monk: 0.55, tourer: 0.8, stall: 0.85, camel: 1.5, limit: 0.5, flagmound: 1.1, dog: 1.2 };

const NEAR_HIDE = new Set(['chevron', 'pole', 'scrub', 'tuft', 'reed', 'cairn', 'lamp', 'cone', 'monk', 'stall', 'tourer', 'flowers']);

function trap(a: { x: number; y: number; w: number }, b: { x: number; y: number; w: number }, fill: string) {
  fillPoly([a.x - a.w, a.y + 1, a.x + a.w, a.y + 1, b.x + b.w, b.y, b.x - b.w, b.y], fill);   // one pixel of overlap toward the camera hides the seam between strips
}

const scaled = (p: Projected, k: number, dx = 0) => ({ x: p.x + p.w * dx, y: p.y, w: p.w * k });

/** How far to the right of the exit lane the main road lies, `n` segments along the lane, in road half-widths (the lane is 2.5 from the road's middle where it opens out, and pulls away from there). */
const lanesGap = (n: number) => 2.5 + laneShift(n) / ROAD_W;

/**
 * A whole road drawn beside the one you are on: its shoulders, kerbs, tarmac, edge lines and centre dashes. `c1` and `c2` are where its middle lies at the near and far ends of the segment, in road
 * half-widths from the middle of yours, and `k1` and `k2` how wide it is there, as a multiple of the usual.
 */
function roadBand(g: CanvasRenderingContext2D, p1: Projected, p2: Projected, c1: number, c2: number, k1: number, k2: number, alt: number, F: (col: string) => string, shoulder: string, tar: string) {
  const quad = (m: number, fill: string, d1 = 0, d2 = d1) =>
    fillPoly([p1.x + p1.w * (c1 + d1 - k1 * m), p1.y + 1, p1.x + p1.w * (c1 + d1 + k1 * m), p1.y + 1, p2.x + p2.w * (c2 + d2 + k2 * m), p2.y, p2.x + p2.w * (c2 + d2 - k2 * m), p2.y], fill);
  quad(1.35, F(shoulder)); quad(1.08, F(alt ? '#e8b923' : '#222')); quad(1, F(tar));
  if (p1.w > 36) for (const sd of [-1, 1]) quad(0.012, F('#e9e3d1'), sd * 0.93 * k1, sd * 0.93 * k2);
  if (alt) quad(0.02, F('#e9e3d1'));
}

/**
 * The exit lane to the garage, seen from the main road (see `laneAt`): a road of its own opening out beside it, the hatched island between them, and painted arrows. Each segment gets the lane's
 * position at its near end and its far end, so it bends away smoothly. Near its end the tarmac gives way to the garage's concrete forecourt.
 */
function laneRoad(g: CanvasRenderingContext2D, si: number, p1: Projected, p2: Projected, alt: number, F: (col: string) => string, shoulder: string, tar: string) {
  const a = laneAt(si), b = laneAt(Math.min(si + 1, LANE_G + 1));
  if (!a || !b) return;
  const forecourt = si - LANE_FROM >= LANE_END - LANE_FROM - 4;
  roadBand(g, p1, p2, a.c, b.c, a.w / 2, b.w / 2, alt, F, shoulder, forecourt ? '#8d8983' : tar);
  const quad = (o1: number, o2: number, w1: number, w2: number, fill: string) =>
    fillPoly([p1.x + p1.w * (o1 - w1), p1.y + 1, p1.x + p1.w * (o1 + w1), p1.y + 1, p2.x + p2.w * (o2 + w2), p2.y, p2.x + p2.w * (o2 - w2), p2.y], fill);
  const line = F('#e9e3d1');
  if (a.gore > 0.02 || b.gore > 0.02) {                                                   // the island: dark tarmac with white bars across it on every other segment, and a line down its outer side
    const m1 = -(1.08 + a.gore / 2), m2 = -(1.08 + b.gore / 2);
    quad(m1, m2, a.gore / 2, b.gore / 2, F('#4a4846'));
    if (si % 2 === 0) { g.globalAlpha = 0.85; quad(m1, m2, a.gore / 2 * 0.86, b.gore / 2 * 0.86, line); g.globalAlpha = 1; }
    quad(-(1.08 + a.gore), -(1.08 + b.gore), 0.012, 0.012, line);
  }
  if (si % 9 === 4 && a.w > 1.8 && !forecourt) { g.globalAlpha = 0.9; fillPoly([p1.x + p1.w * (a.c - 0.26), p1.y, p1.x + p1.w * (a.c + 0.26), p1.y, p2.x + p2.w * b.c, p2.y], line); g.globalAlpha = 1; }   // an arrow painted on the lane
}

function groundCols(i: number, xp = false) {
  if (xp) return { grass: ['#7cbc3c', '#72b234'] as [string, string], shoulder: ['#b2bf6e', '#a8b564'] as [string, string] };   // Bliss: two greens in bands, and a pale verge
  const a = altitude(i);
  const dust0 = mix('#c49a5e', '#d0c4b2', a * 0.45);
  const dust1 = mix('#b78e54', '#c6bba9', a * 0.45);
  const sh0 = mix('#a98156', '#c0b4a2', a);
  const sh1 = mix('#9a7550', '#b0a494', a);
  return { grass: [dust0, dust1] as [string, string], shoulder: [sh0, sh1] as [string, string] };
}

/** Three wires hanging between two poles: the nearer at (x1, y1), the farther at (x2, y2). */
function wires(g: CanvasRenderingContext2D, x1: number, y1: number, s1: number, x2: number, y2: number, s2: number) {
  const sag = Math.max(1, (s1 + s2) * 0.5 * 9);
  g.strokeStyle = '#2a2622'; g.lineWidth = Math.max(0.7, s1 * 0.7);
  for (const [a, b] of [[-25, 4], [0, 8], [25, 4]] as const) {
    g.beginPath(); g.moveTo(x1 + a * s1, y1 + b * s1);
    g.quadraticCurveTo((x1 + x2) / 2 + a * (s1 + s2) * 0.5, (y1 + y2) / 2 + sag + b * (s1 + s2) * 0.5, x2 + a * s2, y2 + b * s2);
    g.stroke();
  }
}

/** Segments and cars by the segment each stands on, reused every frame. */
const BY_SEG = new Map<number, Car[]>();

export function renderRoad(g: CanvasRenderingContext2D, segs: (Seg | undefined)[], v: View, cars: Car[]) {
  use(g);
  const xp = v.env.theme === 'xp';
  setTod(v.env.tod, v.env.night ?? 0); setLand(v.env.theme ?? 'himalaya');
  drawBackground(g, v.W, v.H, v.HZ, v.bgOff, v.t, v.env);
  const { W, H, HZ } = v;
  const baseI = Math.floor(v.pos / SEG_L), pct = (v.pos % SEG_L) / SEG_L;
  const pz = v.pos + v.camH * CAM_DEPTH;
  const pl = segs[Math.floor(pz / SEG_L)]!;
  const camY = pl.y1 + (pl.y2 - pl.y1) * ((pz % SEG_L) / SEG_L) + v.camH;
  let dx = -(segs[baseI]!.curve * pct), cx = 0, maxy = H;
  const last = baseI + DRAW_DIST;

  for (let i = baseI; i <= last; i++) {
    const s = segs[i]!, si = s.src;
    const p1 = project(s.y1, i * SEG_L, v.px * ROAD_W - cx, camY, v.pos, W, H, HZ, ROAD_W);
    const p2 = project(s.y2, (i + 1) * SEG_L, v.px * ROAD_W - cx - dx, camY, v.pos, W, H, HZ, ROAD_W);
    s.camX1 = v.px * ROAD_W - cx; s.camX2 = s.camX1 - dx;
    cx += dx; dx += s.curve; s.p1 = p1; s.clip = maxy;
    if (p1.cz <= CAM_DEPTH || p2.y >= p1.y || p2.y >= maxy) continue;
    const alt = Math.floor(i / 3) % 2, c = groundCols(si, xp);
    const a = altitude(si);
    const road0 = mix('#5a5854', '#6a6864', a * 0.3);
    const road1 = mix('#54524e', '#646260', a * 0.3);
    // land, kerb and road fade toward the horizon haze with distance, so the ground has depth
    const fog = Math.min(0.97, Math.pow(Math.min(1, (i - baseI) / DRAW_DIST), 0.75) * 0.72 * (v.fogK ?? 1)), F = (col: string) => mix(col, v.haze, fog);
    g.fillStyle = F(c.grass[alt]);
    g.fillRect(0, p2.y, W, p1.y - p2.y + 1);
    if (!xp && si >= 990 && si < 1200 && i - baseI < 110) {      // pasture and marsh on the left by the lake: patches of green in the dry ground
      const fa = smooth(990, 1030, si), blk = Math.floor(i / 6);
      for (let b = 0; b < 3; b++) {
        const r = Math.abs(Math.sin(blk * 2.3 + b * 9.1) * 43758.5453) % 1;
        if (r < 0.3) continue;
        const o0 = 2.4 + b * 4.2 + r * 1.5;
        trap(scaled(p1, 1.2 + r * 1.6, -(o0 + 1.6)), scaled(p2, 1.2 + r * 1.6, -(o0 + 1.6)), F(mix(c.grass[alt], r > 0.7 ? '#8fa858' : '#a7a862', fa * 0.75)));
      }
    }
    const tk = terraceK(si);
    if (tk > 0 && i - baseI < 110) {                                                // Leh's terraced fields: barley, stubble and potatoes in blocks, split by low stone walls
      const fa = tk, blk = Math.floor(i / 5);
      for (const side of [-1, 1]) for (let b = 0; b < 3; b++) {
        const r = Math.abs(Math.sin(blk * 3.1 + b * 7.7 + side * 13.3) * 43758.5453) % 1;
        if (r < 0.22) continue;                                  // fallow ground
        const o0 = 1.55 + b * 3.4, mid = side * (o0 + 1.6), col = r > 0.78 ? '#cdb04c' : r > 0.55 ? '#8fae4c' : r > 0.4 ? '#6f9142' : '#b9a45c';
        trap(scaled(p1, 1.6, mid), scaled(p2, 1.6, mid), F(mix(c.grass[alt], mix(col, '#3a4a1a', alt ? 0.14 : 0), fa * 0.92)));   // crop rows
        if (p1.w > 24) trap(scaled(p1, 0.05, side * (o0 - 0.1)), scaled(p2, 0.05, side * (o0 - 0.1)), F(mix(c.grass[alt], '#7a6a56', fa * 0.8)));  // the wall (too thin to see from far off)
      }
    }
    if (!xp && duneK(si) > 0) {                                  // the dunes of Nubra: pale sand in long ridges on the right
      const da = duneK(si), r = Math.abs(Math.sin(Math.floor(i / 4) * 5.9) * 9301.3) % 1;
      trap(scaled(p1, 22, 4.2 + 22), scaled(p2, 22, 4.2 + 22), F(mix(c.grass[alt], alt ? '#e2cf9c' : '#dcc78e', da)));
      trap(scaled(p1, 1.5 + r * 2.5, 6 + r * 9), scaled(p2, 1.5 + r * 2.5, 6 + r * 9), F(mix(c.grass[alt], '#f0e2b8', da * 0.9)));   // a sunlit ridge
      trap(scaled(p1, 1 + r, 9 + r * 12), scaled(p2, 1 + r, 9 + r * 12), F(mix(c.grass[alt], '#c9b27a', da * 0.7)));                 // and its shadow side
    }
    const wa = lakeK(si);
    if (wa > 0) {                                                // the lake on the right: sandy shore, pale shallows, deep turquoise
      const m = shore(si);
      trap(scaled(p1, 0.7, m - 0.6), scaled(p2, 0.7, m - 0.6), F(mix(c.grass[alt], '#e6d8b4', wa * 0.85)));
      trap(scaled(p1, 45, m + 45), scaled(p2, 45, m + 45), F(mix(c.grass[alt], alt ? '#1d6f9f' : '#2278a8', wa)));   // deep blue out in the middle
      trap(scaled(p1, 6, m + 6), scaled(p2, 6, m + 6), F(mix(c.grass[alt], alt ? '#2aa9b3' : '#31b3bb', wa)));         // turquoise where it shelves
      trap(scaled(p1, 1.1, m + 1.1), scaled(p2, 1.1, m + 1.1), F(mix(c.grass[alt], '#8fe0d8', wa * 0.9)));
      g.globalAlpha = 0.5 * wa * (0.5 + 0.5 * Math.sin(v.t * 1.6 + i * 0.35)); trap(scaled(p1, 0.05, m + 0.05), scaled(p2, 0.05, m + 0.05), F('#ffffff')); g.globalAlpha = 1;   // foam lapping at the edge
      if (!v.lite && i - baseI < 90 && wa > 0.5) {               // sun glints that come and go on the water
        const h = p1.y - p2.y;
        g.fillStyle = '#ffffff';
        for (let q = 0; q < 3; q++) {
          const rr = Math.abs(Math.sin(i * 7.31 + q * 3.7) * 9301.3) % 1;
          g.globalAlpha = (0.25 + 0.45 * Math.abs(Math.sin(v.t * 2.2 + i + q))) * wa;
          g.fillRect(p1.x + p1.w * (m + 1.8 + rr * 26), p2.y + h * ((q + rr) % 1), Math.max(1.5, p1.w * (0.2 + rr * 0.5)), Math.max(1, h * 0.22));
        }
        g.globalAlpha = 1;
      }
    }
    if (riverK(si) > 0) {                                        // the Indus, winding along the left of the valley
      const m = -5.4 + 1.5 * Math.sin(si * 0.045), wd = 2.1 + 0.5 * Math.sin(si * 0.09 + 1), a = riverK(si);
      trap(scaled(p1, wd + 0.3, m), scaled(p2, wd + 0.3, m), F(mix(c.grass[alt], '#dfe6cc', a)));   // pale shore
      trap(scaled(p1, wd, m), scaled(p2, wd, m), F(mix(c.grass[alt], alt ? '#3fb0b6' : '#46b9be', a)));
      trap(scaled(p1, wd * 0.45, m + wd * 0.3), scaled(p2, wd * 0.45, m + wd * 0.3), F(mix(c.grass[alt], '#8fdadd', a * 0.8))); // a lighter current down the middle
    }
    const forked = v.fork !== undefined && i >= v.fork, ln = si - LANE_FROM;
    const onRoad = !forked || ln <= LANE_G - LANE_FROM + 1;                           // once the bike is on the lane, its road ends at the garage
    const tar = forked && ln >= LANE_END - LANE_FROM - 4 ? '#8d8983' : alt ? road0 : road1;   // (the lane ends in the garage's concrete forecourt)
    if (onRoad) {
      trap(scaled(p1, 1.35), scaled(p2, 1.35), F(c.shoulder[alt]));
      trap(scaled(p1, 1.08), scaled(p2, 1.08), F(alt ? '#e8b923' : '#222'));
      trap(p1, p2, F(tar));
      if (p1.w > 36) {                                           // the solid edge lines are under a pixel wide beyond this: not worth painting
        trap(scaled(p1, 0.012, -0.93), scaled(p2, 0.012, -0.93), F('#e9e3d1'));
        trap(scaled(p1, 0.012, 0.93), scaled(p2, 0.012, 0.93), F('#e9e3d1'));
      }
      if (alt) trap(scaled(p1, 0.02), scaled(p2, 0.02), F('#e9e3d1'));
    }
    if (forked) { if (ln >= 0) roadBand(g, p1, p2, lanesGap(ln), lanesGap(ln + 1), 1, 1, alt, F, c.shoulder[alt], alt ? road0 : road1); }   // the road you left, now off to the right
    else laneRoad(g, si, p1, p2, alt, F, c.shoulder[alt], road1);                 // the lane to the garage, where there is one
    if (v.wet && xp) {                                           // rain puddles: a patch of sky on the road or the verge, round in perspective, with rings where the drops land
      const pd = puddleAt(i);
      if (pd) {
        const fa = (i - pd.from) / pd.len, fb = (i + 1 - pd.from) / pd.len, wa = puddleHalf(pd, fa), wb = puddleHalf(pd, fb), h = p1.y - p2.y;
        g.globalAlpha = 0.3; trap(scaled(p1, wa * 1.16, pd.o), scaled(p2, wb * 1.16, pd.o), F('#38444e'));
        g.globalAlpha = 0.92; trap(scaled(p1, wa, pd.o), scaled(p2, wb, pd.o), F(mix(v.haze, '#6d94b4', 0.4)));
        g.globalAlpha = 0.24; trap(scaled(p1, wa * 0.5, pd.o - wa * 0.22), scaled(p2, wb * 0.5, pd.o - wa * 0.22), '#ffffff');   // the glint of the sky
        g.globalAlpha = 1;
        if (!v.lite && i - baseI < 60 && i === pd.from + (pd.len >> 1)) {
          g.strokeStyle = '#ffffff'; g.lineWidth = Math.max(0.6, p1.w * 0.004);
          [[-0.4, 0.2, 0], [0.35, -0.25, 0.37], [0.05, 0.05, 0.71]].forEach(([ox, oy, ph], n) => {
            const a = (v.t * 0.8 + ph + n * 0.13) % 1, cxp = p1.x + p1.w * (pd.o + ox * pd.w), cyp = p1.y - h * (0.5 + oy * pd.len * 0.3);
            g.globalAlpha = (1 - a) * 0.6; g.beginPath(); g.ellipse(cxp, cyp, Math.max(0.5, p1.w * pd.w * 0.3 * a), Math.max(0.3, h * pd.len * 0.12 * a), 0, 0, Math.PI * 2); g.stroke();
          });
          g.globalAlpha = 1;
        }
      }
    }
    if (!v.lite && onRoad && i - baseI < 34 && p1.y - p2.y > 1.5) texture(g, i, p1, p2, W, alt, i - baseI, xp);
    maxy = p1.y;
  }

  BY_SEG.clear();
  for (const car of cars) {
    const i = Math.floor(car.z / SEG_L), here = BY_SEG.get(i);
    if (i < baseI || i > last) continue;
    if (here) here.push(car); else BY_SEG.set(i, [car]);
  }
  let lastPole: { x: number; y: number; s: number } | null = null;
  for (let i = last; i > baseI; i--) {
    const s = segs[i]!;
    if (!s.p1 || s.p1.cz <= CAM_DEPTH) continue;
    const k = (s.p1.s * W) / 2, here = BY_SEG.get(i);
    const main = xp ? meadowOf(s) : s.props, byLane = s.lane;                     // the Bliss land adds trees and flowers of its own
    if (!main.length && !byLane && !here) continue;            // nothing to draw here: no clip to set up
    const forked = v.fork !== undefined && i >= v.fork, lane = forked ? null : laneAt(s.src);
    const mainShift = forked ? lanesGap(s.src - LANE_FROM) * ROAD_W : 0;          // in the lane's view, the main road lies off to the right; in the main road's, the lane lies off to the left
    const laneShiftW = lane ? lane.c * ROAD_W : 0;
    // The clip hides what the next hill crest should hide. Where the ground runs on flat or downhill from the one in front (the usual case) there is nothing to hide, and a clip per segment is dear.
    const hilly = s.clip! < s.p1.y - 1;
    if (hilly) { g.save(); g.beginPath(); g.rect(0, 0, W, s.clip!); g.clip(); }
    setStirSeg(i);                                              // who stands here is asked how startled they are by the horn
    const put = (list: readonly AnyProp[], shift: number) => {
      for (const p of list) {
        if (i - baseI < 6 && NEAR_HIDE.has(p.type)) continue;                       // small roadside things vanish just before they'd swallow the screen
        const ks = k * PROP_K * (PROP_SIZE[p.type] ?? 1), px = s.p1!.x + k * (p.o * ROAD_W + shift);
        if (px < -ks * 190 || px > W + ks * 190) continue;                          // wholly off the side of the screen: nothing to draw
        drawProp(p.type, px, s.p1!.y, ks, p);
        if (p.type === 'pole') {                                                     // wires sag from this pole back to the last (farther) one
          if (lastPole && ks < 0.9) wires(g, px, s.p1!.y - 121 * ks, ks, lastPole.x, lastPole.y, lastPole.s);
          lastPole = { x: px, y: s.p1!.y - 121 * ks, s: ks };
        }
      }
    };
    put(main, mainShift);
    if (byLane) put(byLane, laneShiftW);
    if (here) for (const car of here) {                                            // a vehicle sits part-way along its segment: place it exactly, not at the segment's start, so it glides instead of stepping
      const f = (car.z - i * SEG_L) / SEG_L, cp = project(s.y1 + (s.y2 - s.y1) * f, car.z, s.camX1! + (s.camX2! - s.camX1!) * f, camY, v.pos, W, H, HZ, ROAD_W);
      const near = v.camH * CAM_DEPTH, fade = Math.min(1, (cp.cz - near * 0.55) / (near * 0.4));   // one that is drawing level with the rider melts away rather than popping out
      if (fade <= 0) continue;
      g.globalAlpha = fade;
      drawCar(car.kind, cp.x + ((cp.s * W) / 2) * (car.o * ROAD_W + mainShift), cp.y, ((cp.s * W) / 2) * PROP_K * 0.5, v.t);
      g.globalAlpha = 1;
    }
    if (hilly) g.restore();
  }
}

export type { Prop, Segment };
