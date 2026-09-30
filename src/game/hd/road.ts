// Smooth OutRun-style road for the Ladakh track.
import { CAM_DEPTH, project, type Projected } from '../ride/project';
import { drawBackground, type Env } from './background';
import { mix, poly as fillPoly, smooth, use } from './draw';
import { drawProp, setTod } from './props';
import { altitude, FINISH, LAKE_FROM, N, shore, ROAD_W, SEG_L, type Prop, type Segment } from './track-ladakh';
import { drawCar, type Car } from './traffic';

/** Wear on the near ground and road: pebbles and dust on the verge, cracks and patches, tyre tracks in the lane, darker edges. */
function texture(g: CanvasRenderingContext2D, i: number, p1: Projected, p2: Projected, W: number, alt: number, near: number) {
  const h = p1.y - p2.y, a = 1 - near / 34, r = (n: number) => Math.abs(Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1;
  g.globalAlpha = 0.5 * a;
  for (let k = 0; k < 7; k++) {                               // pebbles and dust on the verge, either side
    const side = k % 2 ? 1 : -1, x = p1.x + side * (p1.w * (1.45 + r(k) * 4.5)), y = p2.y + r(k + 9) * h, sz = 1 + r(k + 3) * 2.4 * (1 + a);
    g.fillStyle = r(k + 5) > 0.5 ? '#7a5a3c' : '#e0c8a0'; g.fillRect(x, y, sz * 1.5, sz);
  }
  g.globalAlpha = 0.16 * a;
  for (const off of [-0.3, 0.3]) trap2(g, p1, p2, off, 0.055, '#141210');                  // tyre tracks polished into the road
  g.globalAlpha = 0.5 * a;
  if (r(1) > 0.82) { g.strokeStyle = '#2a2622'; g.lineWidth = Math.max(1, p1.w * 0.006); g.beginPath();   // a crack across the road
    const x0 = p1.x + (r(2) - 0.5) * p1.w * 1.4; g.moveTo(x0, p1.y); g.lineTo(x0 + (r(3) - 0.5) * p1.w * 0.5, (p1.y + p2.y) / 2); g.lineTo(x0 + (r(4) - 0.5) * p1.w * 0.6, p2.y); g.stroke(); }
  if (r(6) > 0.9) { g.globalAlpha = 0.3 * a; trap2(g, p1, p2, (r(7) - 0.5) * 1.3, 0.08 + r(8) * 0.1, '#2e2b28'); } // a darker tarmac patch, in perspective with the road
  g.globalAlpha = 1;
}
function trap2(g: CanvasRenderingContext2D, p1: Projected, p2: Projected, off: number, wd: number, col: string) {
  fillPoly([p1.x + p1.w * (off - wd), p1.y, p1.x + p1.w * (off + wd), p1.y, p2.x + p2.w * (off + wd), p2.y, p2.x + p2.w * (off - wd), p2.y], col);
}

export interface View {
  W: number; H: number; HZ: number;
  pos: number; px: number; camH: number;
  bgOff: number; t: number; env: Env; lite?: boolean;
  /** Multiplies the distance haze: about 2.4 in fog. */
  fogK?: number;
  /** the colour distant land fades to (matches the sky at the horizon) */
  haze: string;
}

type Seg = Segment & { p1?: Projected; clip?: number };

export const DRAW_DIST = 180;
/** Props are drawn in a unit space about 55 units to a house, against a road 2200 units across, so they scale up from the road's own scale. */
const PROP_K = ROAD_W / 55;
/** Signs and boards were drawn in bigger units than houses, so each gets its own size against the road (a board is about the road's half-width). */
const PROP_SIZE: Record<string, number> = { board: 0.42, bro: 0.42, sign: 0.5, stone: 0.26, chevron: 0.3, pole: 0.9, gompa: 3, palace: 3, stupahill: 3, ms: 0.75, lamp: 0.9, kiang: 1.5, marmot: 1.6, darchog: 0.9, cone: 0.5, crew: 0.9, summit: 0.6, camp: 1.1, village: 3, camel: 1.5, limit: 0.5, flagmound: 1.1, dog: 1.2 };

const NEAR_HIDE = new Set(['chevron', 'pole', 'scrub', 'tuft', 'reed', 'cairn', 'lamp', 'cone']);

function trap(a: { x: number; y: number; w: number }, b: { x: number; y: number; w: number }, fill: string) {
  fillPoly([a.x - a.w, a.y + 1, a.x + a.w, a.y + 1, b.x + b.w, b.y, b.x - b.w, b.y], fill);   // one pixel of overlap toward the camera hides the seam between strips
}

const scaled = (p: Projected, k: number, dx = 0) => ({ x: p.x + p.w * dx, y: p.y, w: p.w * k });

function groundCols(i: number) {
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

export function renderRoad(g: CanvasRenderingContext2D, segs: Seg[], v: View, cars: Car[]) {
  use(g);
  setTod(v.env.tod);
  drawBackground(g, v.W, v.H, v.HZ, v.bgOff, v.t, v.env);
  const { W, H, HZ } = v;
  const baseI = Math.floor(v.pos / SEG_L), pct = (v.pos % SEG_L) / SEG_L;
  const pz = v.pos + v.camH * CAM_DEPTH;
  const pl = segs[Math.min(N - 1, Math.floor(pz / SEG_L))];
  const camY = pl.y1 + (pl.y2 - pl.y1) * ((pz % SEG_L) / SEG_L) + v.camH;
  let dx = -(segs[baseI].curve * pct), cx = 0, maxy = H;
  const last = Math.min(N - 1, baseI + DRAW_DIST);

  for (let i = baseI; i <= last; i++) {
    const s = segs[i];
    const p1 = project(s.y1, i * SEG_L, v.px * ROAD_W - cx, camY, v.pos, W, H, HZ, ROAD_W);
    const p2 = project(s.y2, (i + 1) * SEG_L, v.px * ROAD_W - cx - dx, camY, v.pos, W, H, HZ, ROAD_W);
    cx += dx; dx += s.curve; s.p1 = p1; s.clip = maxy;
    if (p1.cz <= CAM_DEPTH || p2.y >= p1.y || p2.y >= maxy) continue;
    const alt = Math.floor(i / 3) % 2, c = groundCols(i);
    const a = altitude(i);
    const road0 = mix('#5a5854', '#6a6864', a * 0.3);
    const road1 = mix('#54524e', '#646260', a * 0.3);
    // land, kerb and road fade toward the horizon haze with distance, so the ground has depth
    const fog = Math.min(0.97, Math.pow(Math.min(1, (i - baseI) / DRAW_DIST), 0.75) * 0.72 * (v.fogK ?? 1)), F = (col: string) => mix(col, v.haze, fog);
    g.fillStyle = F(c.grass[alt]);
    g.fillRect(0, p2.y, W, p1.y - p2.y + 1);
    if (i >= 990 && i < 1200 && i - baseI < 110) {               // pasture and marsh on the left by the lake: patches of green in the dry ground
      const fa = smooth(990, 1030, i), blk = Math.floor(i / 6);
      for (let b = 0; b < 3; b++) {
        const r = Math.abs(Math.sin(blk * 2.3 + b * 9.1) * 43758.5453) % 1;
        if (r < 0.3) continue;
        const o0 = 2.4 + b * 4.2 + r * 1.5;
        trap(scaled(p1, 1.2 + r * 1.6, -(o0 + 1.6)), scaled(p2, 1.2 + r * 1.6, -(o0 + 1.6)), F(mix(c.grass[alt], r > 0.7 ? '#8fa858' : '#a7a862', fa * 0.75)));
      }
    }
    if (i >= 6 && i < 300 && i - baseI < 110) {                                     // Leh's terraced fields: barley, stubble and potatoes in blocks, split by low stone walls
      const fa = smooth(6, 30, i) * (1 - smooth(250, 300, i)), blk = Math.floor(i / 5);
      for (const side of [-1, 1]) for (let b = 0; b < 3; b++) {
        const r = Math.abs(Math.sin(blk * 3.1 + b * 7.7 + side * 13.3) * 43758.5453) % 1;
        if (r < 0.22) continue;                                  // fallow ground
        const o0 = 1.55 + b * 3.4, mid = side * (o0 + 1.6), col = r > 0.78 ? '#cdb04c' : r > 0.55 ? '#8fae4c' : r > 0.4 ? '#6f9142' : '#b9a45c';
        trap(scaled(p1, 1.6, mid), scaled(p2, 1.6, mid), F(mix(c.grass[alt], mix(col, '#3a4a1a', alt ? 0.14 : 0), fa * 0.92)));   // crop rows
        trap(scaled(p1, 0.05, side * (o0 - 0.1)), scaled(p2, 0.05, side * (o0 - 0.1)), F(mix(c.grass[alt], '#7a6a56', fa * 0.8)));  // the wall
      }
    }
    if (i >= 425 && i < 585) {                                   // the dunes of Nubra: pale sand in long ridges on the right
      const da = smooth(425, 455, i) * (1 - smooth(545, 585, i)), r = Math.abs(Math.sin(Math.floor(i / 4) * 5.9) * 9301.3) % 1;
      trap(scaled(p1, 22, 4.2 + 22), scaled(p2, 22, 4.2 + 22), F(mix(c.grass[alt], alt ? '#e2cf9c' : '#dcc78e', da)));
      trap(scaled(p1, 1.5 + r * 2.5, 6 + r * 9), scaled(p2, 1.5 + r * 2.5, 6 + r * 9), F(mix(c.grass[alt], '#f0e2b8', da * 0.9)));   // a sunlit ridge
      trap(scaled(p1, 1 + r, 9 + r * 12), scaled(p2, 1 + r, 9 + r * 12), F(mix(c.grass[alt], '#c9b27a', da * 0.7)));                 // and its shadow side
    }
    if (i >= LAKE_FROM - 30) {                                   // the lake on the right: sandy shore, pale shallows, deep turquoise
      const m = shore(i), wa = smooth(LAKE_FROM - 30, LAKE_FROM + 20, i);
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
    if (i >= 270 && i < 700) {                                   // the Indus, winding along the left of the valley
      const m = -5.4 + 1.5 * Math.sin(i * 0.045), wd = 2.1 + 0.5 * Math.sin(i * 0.09 + 1), a = smooth(270, 300, i) * (1 - smooth(670, 700, i));
      trap(scaled(p1, wd + 0.3, m), scaled(p2, wd + 0.3, m), F(mix(c.grass[alt], '#dfe6cc', a)));   // pale shore
      trap(scaled(p1, wd, m), scaled(p2, wd, m), F(mix(c.grass[alt], alt ? '#3fb0b6' : '#46b9be', a)));
      trap(scaled(p1, wd * 0.45, m + wd * 0.3), scaled(p2, wd * 0.45, m + wd * 0.3), F(mix(c.grass[alt], '#8fdadd', a * 0.8))); // a lighter current down the middle
    }
    if (i >= FINISH - 18 && i <= FINISH + 12) {                  // the forecourt: a concrete apron in front of the garage, with painted bays
      const ap = smooth(FINISH - 18, FINISH - 12, i) * (1 - smooth(FINISH + 8, FINISH + 12, i));
      trap(scaled(p1, 3.2, -4.4), scaled(p2, 3.2, -4.4), F(mix(c.grass[alt], alt ? '#8d8983' : '#96918a', ap)));
      for (const o of [-2.4, -3.6, -4.8, -6.0]) trap(scaled(p1, 0.02, o), scaled(p2, 0.02, o), F(mix(c.grass[alt], '#e9e3d1', ap * 0.85)));
    }
    trap(scaled(p1, 1.35), scaled(p2, 1.35), F(c.shoulder[alt]));
    trap(scaled(p1, 1.08), scaled(p2, 1.08), F(alt ? '#e8b923' : '#222'));
    trap(p1, p2, F(alt ? road0 : road1));
    trap(scaled(p1, 0.012, -0.93), scaled(p2, 0.012, -0.93), F('#e9e3d1'));
    trap(scaled(p1, 0.012, 0.93), scaled(p2, 0.012, 0.93), F('#e9e3d1'));
    if (alt) trap(scaled(p1, 0.02), scaled(p2, 0.02), F('#e9e3d1'));
    if (!v.lite && i - baseI < 34 && p1.y - p2.y > 1.5) texture(g, i, p1, p2, W, alt, i - baseI);
    maxy = p1.y;
  }

  const bySeg = new Map<number, Car[]>();
  for (const car of cars) {
    const i = Math.floor(car.z / SEG_L);
    bySeg.set(i, [...(bySeg.get(i) ?? []), car]);
  }
  let lastPole: { x: number; y: number; s: number } | null = null;
  for (let i = last; i > baseI; i--) {
    const s = segs[i];
    if (!s.p1 || s.p1.cz <= CAM_DEPTH) continue;
    const k = (s.p1.s * W) / 2, here = bySeg.get(i);
    if (!s.props.length && !here) continue;                    // nothing to draw here: no clip to set up
    g.save();
    g.beginPath();
    g.rect(0, 0, W, s.clip!);
    g.clip();
    for (const p of s.props) {
      if (i - baseI < 6 && NEAR_HIDE.has(p.type)) continue;                       // small roadside things vanish just before they'd swallow the screen
      const ks = k * PROP_K * (PROP_SIZE[p.type] ?? 1), px = s.p1.x + k * p.o * ROAD_W;
      drawProp(p.type, px, s.p1.y, ks, p);
      if (p.type === 'pole') {                                                     // wires sag from this pole back to the last (farther) one
        if (lastPole && ks < 0.9) wires(g, px, s.p1.y - 121 * ks, ks, lastPole.x, lastPole.y, lastPole.s);
        lastPole = { x: px, y: s.p1.y - 121 * ks, s: ks };
      }
    }
    if (here) for (const car of here) drawCar(car.kind, s.p1.x + k * car.o * ROAD_W, s.p1.y, k * PROP_K * 0.5, v.t);
    g.restore();
  }
}

export type { Prop, Segment };
