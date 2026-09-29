// Smooth OutRun-style road for the Ladakh track.
import { CAM_DEPTH, project, type Projected } from '../ride/project';
import { drawBackground, type Env } from './background';
import { mix, poly as fillPoly, use } from './draw';
import { drawProp } from './props';
import { altitude, N, ROAD_W, SEG_L, type Prop, type Segment } from './track-ladakh';
import { drawCar, type Car } from './traffic';

export interface View {
  W: number; H: number; HZ: number;
  pos: number; px: number; camH: number;
  bgOff: number; t: number; env: Env;
}

type Seg = Segment & { p1?: Projected; clip?: number };

export const DRAW_DIST = 180;

function trap(a: { x: number; y: number; w: number }, b: { x: number; y: number; w: number }, fill: string) {
  fillPoly([a.x - a.w, a.y, a.x + a.w, a.y, b.x + b.w, b.y, b.x - b.w, b.y], fill);
}

const scaled = (p: Projected, k: number, dx = 0) => ({ x: p.x + p.w * dx, y: p.y, w: p.w * k });

function groundCols(i: number) {
  const a = altitude(i);
  const dust0 = mix('#b8a078', '#d0c8b8', a * 0.4);
  const dust1 = mix('#a89068', '#c8c0b0', a * 0.4);
  const sh0 = mix('#9a8868', '#c0b8a8', a);
  const sh1 = mix('#8a7858', '#b0a898', a);
  return { grass: [dust0, dust1] as [string, string], shoulder: [sh0, sh1] as [string, string] };
}

export function renderRoad(g: CanvasRenderingContext2D, segs: Seg[], v: View, cars: Car[]) {
  use(g);
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
    // ground strip
    g.fillStyle = c.grass[alt];
    g.fillRect(0, p2.y, W, p1.y - p2.y);
    trap(scaled(p1, 1.35), scaled(p2, 1.35), c.shoulder[alt]);
    trap(scaled(p1, 1.08), scaled(p2, 1.08), alt ? '#e8b923' : '#222');
    trap(p1, p2, alt ? road0 : road1);
    trap(scaled(p1, 0.012, -0.93), scaled(p2, 0.012, -0.93), '#e9e3d1');
    trap(scaled(p1, 0.012, 0.93), scaled(p2, 0.012, 0.93), '#e9e3d1');
    if (alt) trap(scaled(p1, 0.02), scaled(p2, 0.02), '#e9e3d1');
    maxy = p1.y;
  }

  const bySeg = new Map<number, Car[]>();
  for (const car of cars) {
    const i = Math.floor(car.z / SEG_L);
    bySeg.set(i, [...(bySeg.get(i) ?? []), car]);
  }
  for (let i = last; i > baseI; i--) {
    const s = segs[i];
    if (!s.p1 || s.p1.cz <= CAM_DEPTH) continue;
    const k = (s.p1.s * W) / 2;
    g.save();
    g.beginPath();
    g.rect(0, 0, W, s.clip!);
    g.clip();
    for (const p of s.props) drawProp(p.type, s.p1.x + k * p.o * ROAD_W, s.p1.y, k, p);
    for (const car of bySeg.get(i) ?? []) {
      drawCar(car.kind, s.p1.x + k * car.o * ROAD_W, s.p1.y, k * 0.9);
    }
    g.restore();
  }
}

export type { Prop, Segment };
