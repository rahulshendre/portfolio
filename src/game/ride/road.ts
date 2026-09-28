// Pseudo-3D road renderer (the OutRun / Road Rash technique) drawn with crisp primitives.
import { C } from '../art/palette';
import { rect, trap, type Edge } from '../engine/pixel';
import { text, textW } from '../engine/font';
import { blit, type Sprite } from '../engine/sprites';
import { drawBackground } from './background';
import { CAM_DEPTH, project, type Projected } from './project';
import { N, ROAD_W, SEG_L, type Prop, type Segment } from './track';
import type { Car } from './traffic';

export interface RoadArt { trees: Sprite[]; stall: Sprite; signs: Record<string, Sprite>; garage: Sprite; auto: Sprite; truck: Sprite }
export interface View { W: number; H: number; HZ: number; pos: number; px: number; camH: number; bgOff: number; t: number }
type Seg = Segment & { p1?: Projected; clip?: number };

export const DRAW_DIST = 170;
const scaled = (p: Projected, k: number, dx = 0): Edge => ({ x: p.x + p.w * dx, y: p.y, w: p.w * k });

export function renderRoad(g: CanvasRenderingContext2D, segs: Seg[], v: View, cars: Car[], art: RoadArt) {
  const { W, H, HZ } = v;
  drawBackground(g, W, H, HZ, v.bgOff, v.t);
  const baseI = Math.floor(v.pos / SEG_L), pct = (v.pos % SEG_L) / SEG_L;
  const pz = v.pos + v.camH * CAM_DEPTH, pl = segs[Math.min(N - 1, Math.floor(pz / SEG_L))];
  const camY = pl.y1 + (pl.y2 - pl.y1) * ((pz % SEG_L) / SEG_L) + v.camH;
  let dx = -(segs[baseI].curve * pct), cx = 0, maxy = H;
  const last = Math.min(N - 1, baseI + DRAW_DIST);

  for (let i = baseI; i <= last; i++) {
    const s = segs[i];
    const p1 = project(s.y1, i * SEG_L, v.px * ROAD_W - cx, camY, v.pos, W, H, HZ, ROAD_W);
    const p2 = project(s.y2, (i + 1) * SEG_L, v.px * ROAD_W - cx - dx, camY, v.pos, W, H, HZ, ROAD_W);
    cx += dx; dx += s.curve; s.p1 = p1; s.clip = maxy;
    if (p1.cz <= CAM_DEPTH || p2.y >= p1.y || p2.y >= maxy) continue;
    const alt = Math.floor(i / 3) % 2;
    rect(0, p2.y, W, p1.y - p2.y, C.grass[alt]);
    trap(scaled(p1, 1.3), scaled(p2, 1.3), alt ? '#a39473' : '#9a8b6b'); // dusty shoulder
    trap(scaled(p1, 1.08), scaled(p2, 1.08), C.kerb[alt]);                // black-yellow kerb
    trap(p1, p2, C.road[alt]);
    trap(scaled(p1, 0.012, -0.93), scaled(p2, 0.012, -0.93), C.lane);      // edge lines
    trap(scaled(p1, 0.012, 0.93), scaled(p2, 0.012, 0.93), C.lane);
    if (alt) trap(scaled(p1, 0.02), scaled(p2, 0.02), C.lane);             // dashed centre line
    maxy = p1.y;
  }

  const bySeg = new Map<number, Car[]>();
  for (const c of cars) { const i = Math.floor(c.z / SEG_L); bySeg.set(i, [...(bySeg.get(i) ?? []), c]); }
  for (let i = last; i > baseI; i--) {
    const s = segs[i];
    if (!s.p1 || s.p1.cz <= CAM_DEPTH) continue;
    const k = (s.p1.s * W) / 2;
    g.save(); g.beginPath(); g.rect(0, 0, W, s.clip!); g.clip();
    for (const p of s.props) drawProp(p, s.p1.x + k * p.o * ROAD_W, s.p1.y, k, art);
    for (const c of bySeg.get(i) ?? []) {
      const img = c.kind === 'auto' ? art.auto : art.truck, dw = k * img.ww!;
      blit(img, s.p1.x + k * c.o * ROAD_W - dw / 2, s.p1.y - (dw * img.height) / img.width, dw, (dw * img.height) / img.width);
    }
    g.restore();
  }
}

function drawProp(p: Prop, sx: number, sy: number, k: number, art: RoadArt) {
  switch (p.type) {
    case 'post': {
      const w = Math.max(1, k * 30), h = k * 220;
      if (h < 3) return;
      rect(sx - w / 2, sy - h, w, h, '#ece6d6'); rect(sx - w / 2, sy - h, w, Math.max(1, h * 0.22), C.reflector);
      return;
    }
    case 'pole': {
      const w = Math.max(1, k * 40), h = k * 1500;
      if (h < 4) return;
      rect(sx - w / 2, sy - h, w, h, '#4a4038'); rect(sx - k * 240, sy - h, k * 480, Math.max(1, k * 36), '#4a4038');
      return;
    }
    case 'ms': { // Indian milestone: white stone, yellow top
      const w = k * 240, h = k * 360;
      if (w < 2) return;
      const top = sy - h;
      rect(sx - w / 2, top + h * 0.12, w, h * 0.88, '#f2f0ea');
      rect(sx - w / 2, top + h * 0.12, w, h * 0.3, C.accent);
      rect(sx - w / 2 + w * 0.15, top, w * 0.7, h * 0.13, C.accent);
      rect(sx - w / 2, top + h * 0.95, w, h * 0.05, '#c9c3b5');
      if (p.label && w > textW(p.label) + 4) text(p.label, sx - textW(p.label) / 2, top + h * 0.15, C.ink);
      if (p.sub && w > textW(p.sub) + 4 && h > 40) text(p.sub, sx - textW(p.sub) / 2, top + h * 0.58, C.ink);
      return;
    }
    default: {
      const img = p.type === 'tree' ? art.trees[Math.floor(Math.abs(p.o) * 10) % art.trees.length]
        : p.type === 'stall' ? art.stall : p.type === 'garage' ? art.garage : art.signs[`${p.label}|${p.sub}`];
      if (!img) return;
      const dw = k * img.ww!, dh = (dw * img.height) / img.width;
      blit(img, sx - dw / 2, sy - dh, dw, dh);
    }
  }
}
