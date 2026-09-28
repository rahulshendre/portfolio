// Pseudo-3D road renderer (the OutRun / Road Rash technique) drawn with crisp primitives.
import { C } from '../art/palette';
import { poly, rect, trap, type Edge } from '../engine/pixel';
import { text, textW } from '../engine/font';
import { blit, type Sprite } from '../engine/sprites';
import { drawBackground, mix, type Env } from './background';
import { CAM_DEPTH, project, type Projected } from './project';
import { ghatness, N, ROAD_W, SEG_L, TUNNEL, type Prop, type Segment } from './track';
import type { Car, Kind } from './traffic';

export interface RoadArt {
  trees: Sprite[]; stall: Record<string, Sprite>; signs: Record<string, Sprite>; garage: Sprite;
  cars: Record<Kind, Sprite>; hoardings: Record<string, Sprite>; house: (v: number, shop: string) => Sprite;
  cow: Sprite; rocks: Sprite[]; monkey: Sprite;
}
export interface View { W: number; H: number; HZ: number; pos: number; px: number; camH: number; bgOff: number; t: number; env: Env }
type Seg = Segment & { p1?: Projected; clip?: number };

export const DRAW_DIST = 170;
const TUNNEL_H = 1750;
const scaled = (p: Projected, k: number, dx = 0): Edge => ({ x: p.x + p.w * dx, y: p.y, w: p.w * k });
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Ground colours per segment, blended between chapters (dusty town, green plains, lush monsoon ghats).
const ground: { grass: [string, string]; shoulder: [string, string] }[] = [];
function colours(i: number) {
  if (!ground[i]) {
    const town = 1 - smooth(230, 300, i), ghat = ghatness(i);
    const g0 = mix(mix('#7c9a43', '#a3976a', town), '#5a873b', ghat), g1 = mix(mix('#73913d', '#9a8f64', town), '#527f38', ghat);
    const s0 = mix(mix('#a39473', '#b3a37c', town), '#7d7263', ghat), s1 = mix(mix('#9a8b6b', '#aa9a74', town), '#756a5c', ghat);
    ground[i] = { grass: [g0, g1], shoulder: [s0, s1] };
  }
  return ground[i];
}

export function renderRoad(g: CanvasRenderingContext2D, segs: Seg[], v: View, cars: Car[], art: RoadArt) {
  const { W, H, HZ } = v;
  drawBackground(g, W, H, HZ, v.bgOff, v.t, v.env);
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
    const alt = Math.floor(i / 3) % 2, c = colours(i);
    if (s.tunnel) {
      rect(0, p2.y, W, p1.y - p2.y, '#2e2a26');
      trap(scaled(p1, 1.08), scaled(p2, 1.08), C.kerb[alt]);
      trap(p1, p2, alt ? '#46433f' : '#42403c');
      if (alt) trap(scaled(p1, 0.02), scaled(p2, 0.02), '#b8b2a2');
    } else {
      rect(0, p2.y, W, p1.y - p2.y, c.grass[alt]);
      trap(scaled(p1, 1.3), scaled(p2, 1.3), c.shoulder[alt]);
      trap(scaled(p1, 1.08), scaled(p2, 1.08), C.kerb[alt]);
      trap(p1, p2, C.road[alt]);
      trap(scaled(p1, 0.012, -0.93), scaled(p2, 0.012, -0.93), C.lane);
      trap(scaled(p1, 0.012, 0.93), scaled(p2, 0.012, 0.93), C.lane);
      if (alt) trap(scaled(p1, 0.02), scaled(p2, 0.02), C.lane);
    }
    maxy = p1.y;
  }

  const bySeg = new Map<number, Car[]>();
  for (const car of cars) { const i = Math.floor(car.z / SEG_L); bySeg.set(i, [...(bySeg.get(i) ?? []), car]); }
  for (let i = last; i > baseI; i--) {
    const s = segs[i];
    if (!s.p1 || s.p1.cz <= CAM_DEPTH) continue;
    const k = (s.p1.s * W) / 2;
    g.save(); g.beginPath(); g.rect(0, 0, W, s.clip!); g.clip();
    if (s.tunnel) {
      // Outside: only the portal (a mountain with a dark mouth). Inside: ceiling and walls, slice by slice.
      if (baseI < TUNNEL[0]) { if (i === TUNNEL[0]) drawPortal(s.p1, k); }
      else drawTunnel(i, s.p1, k, W);
    }
    for (const p of s.props) drawProp(p, s.p1.x + k * p.o * ROAD_W, s.p1.y, k, art);
    for (const car of bySeg.get(i) ?? []) {
      const img = art.cars[car.kind], dw = k * img.ww!, dh = (dw * img.height) / img.width;
      blit(img, s.p1.x + k * car.o * ROAD_W - dw / 2, s.p1.y - dh, dw, dh);
    }
    g.restore();
  }
}

/** The hill the tunnel goes through, with a concrete-framed dark mouth. */
function drawPortal(p: Projected, k: number) {
  const ceil = p.y - k * TUNNEL_H, lx = p.x - p.w * 1.25, rx = p.x + p.w * 1.25;
  const top = ceil - k * 2400, wide = k * 5200, narrow = k * 1600;
  poly([[lx - wide, p.y], [lx - narrow, top], [rx + narrow, top], [rx + wide, p.y]], '#5d5147');
  for (let b = 1; b < 5; b++) { // basalt bands across the face
    const y = p.y - (p.y - top) * (b / 5), f = b / 5;
    rect(lx - wide + (wide - narrow) * f, y, rx - lx + 2 * (wide - (wide - narrow) * f), Math.max(1, k * 40), '#4a4038');
  }
  poly([[lx - narrow - k * 300, top + k * 220], [lx - narrow, top], [rx + narrow, top], [rx + narrow + k * 300, top + k * 220]], '#4f7d3f');
  rect(lx - k * 140, ceil - k * 180, rx - lx + k * 280, p.y - ceil + k * 180, '#9a9286');
  rect(lx, ceil, rx - lx, p.y - ceil, '#15120f');
  if (k * 60 > 1) rect(p.x - k * 60, ceil + k * 40, k * 120, Math.max(1, k * 20), '#ffe9a8');
}

/** Painted far to near: each slice's ceiling and walls cover the ones behind it. */
function drawTunnel(i: number, p: Projected, k: number, W: number) {
  const ceil = p.y - k * TUNNEL_H, lx = p.x - p.w * 1.25, rx = p.x + p.w * 1.25;
  rect(0, 0, W, ceil, '#26221e');
  rect(0, ceil, lx, p.y - ceil, i % 6 < 3 ? '#3a342e' : '#36302a');
  rect(rx, ceil, W - rx, p.y - ceil, i % 6 < 3 ? '#3a342e' : '#36302a');
  if (i % 4 === 0) rect(p.x - k * 70, ceil + Math.max(1, k * 20), k * 140, Math.max(1, k * 26), '#ffe9a8');
  if (i === TUNNEL[1] - 1) { rect(lx - 2, ceil, 2, p.y - ceil, '#5d5147'); rect(rx, ceil, 2, p.y - ceil, '#5d5147'); }
}

function drawProp(p: Prop, sx: number, sy: number, k: number, art: RoadArt) {
  switch (p.type) {
    case 'cateye': {
      const w = k * 34;
      if (w < 0.8) return;
      rect(sx - w / 2, sy - Math.max(1, k * 14), Math.max(1, w), Math.max(1, k * 14), '#fff2a8');
      return;
    }
    case 'post': {
      const w = Math.max(1, k * 30), h = k * 220;
      if (h < 3) return;
      rect(sx - w / 2, sy - h, w, h, '#ece6d6'); rect(sx - w / 2, sy - h, w, Math.max(1, h * 0.22), C.reflector);
      return;
    }
    case 'rail': { // ghat parapet: low wall painted in black and yellow blocks
      const w = k * 330, h = k * 120;
      if (h < 2) return;
      for (let j = 0; j < 4; j++) rect(sx - w / 2 + (j * w) / 4, sy - h, w / 4 + 1, h, j % 2 ? '#222' : C.accent);
      rect(sx - w / 2, sy - h, w, Math.max(1, h * 0.14), '#d8d2c4');
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
    case 'monkey': { const img = art.monkey, dw = k * img.ww!; blit(img, sx - dw / 2, sy - k * 120 - dw, dw, dw); return; }
    default: {
      const img = spriteFor(p, art);
      if (!img) return;
      const dw = k * img.ww!, dh = (dw * img.height) / img.width;
      blit(img, sx - dw / 2, sy - dh, dw, dh);
    }
  }
}

function spriteFor(p: Prop, art: RoadArt): Sprite | undefined {
  switch (p.type) {
    case 'tree': return art.trees[(p.v ?? 0) % art.trees.length];
    case 'stall': return art.stall[p.label!];
    case 'garage': return art.garage;
    case 'hoarding': return art.hoardings[p.label!];
    case 'house': return art.house(p.v ?? 0, p.label!);
    case 'cow': return art.cow;
    case 'rock': return art.rocks[p.v ?? 0];
    case 'sign': return art.signs[`${p.label}|${p.sub}`];
    default: return undefined;
  }
}
