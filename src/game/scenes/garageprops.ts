// Things that make the garage feel lived in and lit: depth shading, light shafts, floor detail, wall fittings and small props.
// Every function draws with the current pixel context (garage.ts paints them once into the room sprite, or per frame for the live bits).
import { C } from '../art/palette';
import { bayer, ctx, disc, ellipse, line, poly, rect } from '../engine/pixel';
import { text } from '../engine/font';
import { bevel, hash, speckle, stain, streaks, woodGrain } from '../art/wear';
import { paint, type Sprite } from '../engine/sprites';
import type { Weather } from '../state';

export const TUBES = [140, 340];
export const SUN = { x0: 10, x1: 82, y0: 96, y1: 234, px: 206, pw: 30, gap: 6 }; // window edge, and where its light lands on the floor

/** Corners, the wall meeting the floor and the strip under the beam go dim, so the room reads as a box with depth. Painted before the lighting pass. */
export function depthShading() {
  const shade = (x: number, y: number, d: number, col: string) => { if (d > bayer(x, y)) rect(x, y, 1, 1, col); };
  for (let y = 182; y < 198; y++) for (let x = 0; x < 480; x++) shade(x, y, ((y - 182) / 16) * 0.6, '#00000030'); // where wall meets floor
  for (let y = 19; y < 46; y++) for (let x = 0; x < 480; x++) shade(x, y, (1 - (y - 19) / 27) * 0.55, '#00000030'); // under the beam
  for (let y = 19; y < 198; y++) for (let x = 0; x < 34; x++) { const d = (1 - x / 34) * 0.4; shade(x, y, d, '#00000028'); shade(479 - x, y, d, '#00000028'); } // corners
}

/** Soft visible shafts of tube light falling from each fitting. Painted after the lighting pass, so they add to it. */
export function tubeBeams() {
  const g = ctx();
  g.globalAlpha = 0.08;
  for (const cx of TUBES) for (let y = 17; y < 198; y++) {
    const t = (y - 17) / 181, hw = 18 + t * 74;
    for (let x = Math.round(cx - hw); x < cx + hw; x++) if ((1 - Math.abs(x - cx) / hw) * (1 - t * 0.7) * 0.75 > bayer(x, y)) rect(x, y, 1, 1, '#ffeec0');
  }
  g.globalAlpha = 1;
}

/** Sunlight (or moonlight-grey daylight) through the window: a dithered shaft and a window-shaped patch on the floor. Weather sets how strong it is. */
export const sunStrength = (w: Weather) => (w === 'clear' ? 1 : w === 'snow' ? 0.55 : w === 'fog' ? 0.4 : 0.22);
export function sunSprite(weather: Weather): Sprite {
  const k = sunStrength(weather), col = weather === 'clear' ? '#ffe6a0' : weather === 'snow' ? '#dbe6ff' : '#e2e6ee';
  return paint(480, 270, () => {
    const g = ctx(), { x0, x1, y0, y1, px, pw, gap } = SUN;
    for (let y = y0; y < y1; y++) { // flat translucent bands, brighter in the middle: reads as light, not as a dot screen
      const t = (y - y0) / (y1 - y0), a = Math.round(x0 + t * (px - x0)), b = Math.round(x1 + t * (px + pw * 2 + gap - x1)), fade = 1 - t * 0.5;
      g.globalAlpha = 0.045 * k * fade; rect(a, y, b - a, 1, col);
      g.globalAlpha = 0.045 * k * fade; rect(a + 4, y, b - a - 8, 1, col);
      g.globalAlpha = 0.035 * k * fade; rect(a + 9, y, b - a - 18, 1, col);
    }
    g.globalAlpha = 0.3 * k;
    for (let y = 234; y < 254; y++) { // the window's four panes, squashed and slanted onto the floor, with the frame's cross in shadow
      if (y >= 243 && y < 246) continue;
      const skew = Math.round((y - 234) * 0.7);
      rect(px + skew, y, pw, 1, col); rect(px + skew + pw + gap, y, pw, 1, col);
    }
    g.globalAlpha = 1;
  });
}

/** A rubber stall mat under the bike, a shadow of the bike thrown on the wall behind it, and dark contact patches under the wheels. */
export function bikeGrounding(bike: HTMLImageElement, bx: number, by: number, bw: number, bh: number, k = 1.4) {
  poly([[132, 238], [292, 238], [302, 254], [122, 254]], '#33323a');
  rect(132, 238, 160, 1, '#4c4b54'); rect(122, 254, 180, 1, '#1f1f24');
  for (let y = 240; y < 254; y += 3) rect(126 + (y - 238) / 2, y, 170 - (y - 238), 1, '#3b3a43'); // ribs
  speckle(126, 239, 172, 15, '#26252b', 0.08, 130); speckle(126, 239, 172, 15, '#55545e', 0.03, 131);
  const sil = document.createElement('canvas'); sil.width = bw; sil.height = bh;
  const sg = sil.getContext('2d')!; sg.imageSmoothingEnabled = false;
  sg.drawImage(bike, 0, 0, bw, bh); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#20180f'; sg.fillRect(0, 0, bw, bh);
  const g = ctx();
  g.save(); g.beginPath(); g.rect(0, 20, 480, 178); g.clip(); g.globalAlpha = 0.28; g.drawImage(sil, bx + 12, by - 3); g.restore(); // on the wall, not the floor
  const cy = by + Math.round(69 * k); // the wheels touch down at row 69 of the sprite, at columns 43 and 111
  for (const cx of [bx + Math.round(43 * k), bx + Math.round(111 * k)]) { ellipse(cx, cy, 20, 3, '#00000066'); ellipse(cx, cy, 14, 2, '#00000066'); }
}

/** Slab tones, a patched repair, a drain, a puddle that catches the tube light, and a drum and bucket to the right. */
export function floorDetail() {
  const g = ctx();
  g.globalAlpha = 0.07;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) if ((r + c) % 2 === 0) rect(c * 80, 199 + r * 19, 80, 19, '#000000');
  g.globalAlpha = 1;
  rect(56, 224, 40, 14, '#9d9686'); bevel(56, 224, 40, 14, '#aca596', '#7c7568'); speckle(56, 224, 40, 14, '#8a8374', 0.12, 140); // a patched repair in the slab
  rect(110, 218, 70, 1, '#4c463d'); rect(110, 219, 70, 1, '#b1a999');                                                          // tar-filled joint
  rect(436, 236, 28, 14, '#3a3a3c'); bevel(436, 236, 28, 14, '#5a5a5e', '#1c1c1e');                                            // drain grate
  for (let x = 439; x < 462; x += 4) rect(x, 238, 2, 10, '#141416');
  stain(450, 243, 20, 6, '#6a6357', 141, 0.6);
  ellipse(410, 226, 20, 3, '#7c8494'); ellipse(410, 226, 17, 2, '#98a0b0'); rect(400, 225, 8, 1, '#f3f0e2'); rect(414, 226, 4, 1, '#e6e2d2'); // puddle and the tube light in it
}

export function floorProps() {
  // oil drum
  ellipse(458, 245, 21, 4, '#0000003a');
  rect(444, 208, 28, 34, '#2e4f7d'); rect(446, 208, 3, 34, '#4a72a8'); rect(466, 208, 6, 34, '#213a60');
  for (const y of [214, 226, 236]) { rect(444, y, 28, 2, '#26406a'); rect(446, y, 20, 1, '#4a72a8'); }
  ellipse(458, 208, 14, 4, '#3b6191'); ellipse(458, 208, 10, 2, '#2a4a78'); disc(451, 208, 1, '#1c3050');
  ellipse(458, 242, 14, 3, '#1c3050');
  poly([[458, 216], [464, 222], [458, 228], [452, 222]], C.accent); poly([[458, 219], [461, 222], [458, 225], [455, 222]], '#2c2a26');
  streaks(444, 230, 28, 12, '#5a3a22', 5, 142); speckle(444, 208, 28, 34, '#8a3d1c', 0.03, 143); rect(456, 243, 2, 6, '#141210');
  // bucket and a mop
  ellipse(410, 246, 11, 2, '#0000003a');
  poly([[401, 232], [419, 232], [417, 246], [403, 246]], '#6b7075'); rect(401, 232, 18, 1, '#8b9096'); rect(403, 245, 14, 1, '#4a4e53');
  ellipse(410, 232, 9, 2, '#3a3d42'); ellipse(410, 232, 7, 1, '#2a4a70');
  line(414, 232, 426, 194, '#a5764a'); line(415, 232, 427, 194, '#8a5a36');
  for (let k = 0; k < 6; k++) line(408 + k, 231, 406 + k * 2, 236, '#d8d2c4');
}

/** Conduit along the top of the wall, with a drop to the fuse box, clipped to the plaster every so often. */
export function conduit() {
  const pipe = '#8b9096', hi = '#b4b9be', lo = '#4a4e53', clip = '#3a3d42';
  rect(298, 19, 182, 3, pipe); rect(298, 19, 182, 1, hi); rect(298, 21, 182, 1, lo);
  rect(298, 19, 2, 99, pipe); rect(298, 19, 1, 99, hi); rect(299, 19, 1, 99, lo);
  for (let x = 312; x < 480; x += 26) { rect(x, 18, 3, 5, clip); rect(x, 18, 3, 1, '#6b6f79'); }
  for (let y = 38; y < 116; y += 20) { rect(297, y, 4, 2, clip); rect(297, y, 4, 1, '#6b6f79'); }
  rect(342, 16, 10, 7, '#7d8288'); bevel(342, 16, 10, 7, '#a0a5aa', '#4a4e53'); rect(346, 19, 2, 1, '#2a2c30'); // junction box
  stain(300, 60, 3, 30, '#6b5a44', 150, 0.5);
}

/** A breaker panel with its door hanging open, a warning sticker, and three wires running down into the wall. */
export function fuseBox() {
  rect(276, 120, 22, 26, '#7d8288'); bevel(276, 120, 22, 26, '#a0a5aa', '#4a4e53');
  rect(279, 123, 16, 20, '#17181b'); bevel(279, 123, 16, 20, '#0a0a0c', '#34363c');
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
    const x = 281 + i * 3.6, y = 125 + r * 9;
    rect(x, y, 3, 6, '#2a2c30'); rect(x, y + (i + r) % 2 * 3, 3, 3, '#d8d2c4'); rect(x, y + 6, 3, 1, (i + r) % 3 ? '#3d8b4f' : C.red);
  }
  poly([[271, 119], [276, 121], [276, 143], [271, 146]], '#8f949a'); rect(271, 119, 1, 27, '#b4b9be');            // the door, swung open
  poly([[286, 137], [290, 137], [288, 140]], C.accent); rect(288, 138, 1, 1, '#17181b');                           // warning triangle
  for (const [x, c] of [[282, C.red], [286, '#2c5aa0'], [290, C.accent]] as const) { rect(x, 146, 1, 8, c); rect(x + 1, 152, 1, 3, c); }
  speckle(276, 120, 22, 26, '#5a4a38', 0.06, 151);
}

/** A wall clock face; the hands are drawn each frame by clockHands. */
export const CLOCK = { x: 172, y: 112, r: 9 };
export function clockFace() {
  const { x, y, r } = CLOCK;
  ellipse(x + 2, y + 2, r + 1, r + 1, '#00000033');
  disc(x, y, r + 1, '#2a2a2e'); disc(x, y, r, '#f0ecdf');
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; rect(Math.round(x + Math.sin(a) * (r - 2)), Math.round(y - Math.cos(a) * (r - 2)), 1, 1, k % 3 ? '#8a8578' : '#2a2a2e'); }
  speckle(x - r, y - r, r * 2, r * 2, '#d2cdbb', 0.06, 152);
}
export function clockHands(t: { h: number; m: number; s: number }) {
  const { x, y } = CLOCK, s = t.s, m = t.m + s / 60, h = (t.h % 12) + m / 60;
  const hand = (turn: number, len: number, col: string) => line(x, y, Math.round(x + Math.sin(turn * Math.PI * 2) * len), Math.round(y - Math.cos(turn * Math.PI * 2) * len), col);
  hand(h / 12, 4, '#2a2a2e'); hand(m / 60, 6, '#2a2a2e'); hand(s / 60, 7, C.red); disc(x, y, 1, '#2a2a2e');
}

/** A bike battery charger on top of the toolbox, cables hanging over the edge. The charge bars and lights are redrawn each frame by chargerLive. */
export function charger() {
  rect(352, 150, 30, 2, '#00000033');
  line(379, 146, 382, 150, C.red); line(382, 150, 383, 159, C.red); line(379, 148, 384, 152, '#26262a'); line(384, 152, 385, 162, '#26262a'); // the leads
  rect(382, 158, 3, 4, C.red); rect(384, 161, 3, 4, '#3a3d42'); rect(382, 158, 1, 1, '#f08a80');                                    // clamps
  rect(356, 133, 20, 3, '#3a3d42'); bevel(356, 133, 20, 3, '#5a5d66', '#1b1c20');                                                    // carry handle
  rect(352, 136, 28, 14, C.accent); bevel(352, 136, 28, 14, '#f5d35c', '#a07f10'); speckle(352, 136, 28, 14, '#a07f10', 0.05, 180);
  rect(355, 139, 15, 8, '#17181b'); bevel(355, 139, 15, 8, '#0a0a0c', '#3a3d42');                                                     // charge display
  rect(354, 148, 24, 1, '#1b1712'); rect(353, 149, 4, 1, '#3a3d42'); rect(375, 149, 4, 1, '#3a3d42');                                 // label stripe and feet
}
export function chargerLive(t: number) {
  const level = Math.floor((t * 0.7) % 7); // bars fill up, then start again
  for (let i = 0; i < level; i++) rect(356 + i * 2, 146 - (2 + i), 1, 2 + i, i < 5 ? '#5fdc7a' : '#8ff0a8');
  const full = level >= 6;
  rect(373, 139, 3, 2, full ? '#3a3d42' : Math.floor(t * 2) % 2 ? '#f5a623' : '#7a4e10'); // charging light
  rect(373, 143, 3, 2, full ? '#5fdc7a' : '#1f4a2a');                                     // full light
}

/** Things lying on the floor in front of the bike: a drip pan, a spanner, a parts tray, a creeper board and an extension lead. */
export function foreground() {
  // oil drip pan under the engine
  ellipse(227, 254, 26, 2, '#00000040');
  poly([[205, 248], [249, 248], [254, 254], [200, 254]], '#5a5f66'); rect(205, 248, 44, 1, '#8b9096'); rect(201, 253, 52, 1, '#3a3d42');
  ellipse(227, 251, 19, 2, '#17120e'); rect(216, 250, 6, 1, '#6d6690'); rect(233, 251, 3, 1, '#6d6690'); // dark oil with a sheen
  // spanner on the floor
  line(160, 251, 181, 254, '#00000044'); line(160, 250, 181, 253, C.steel); line(160, 249, 181, 252, '#dfe3e6');
  disc(159, 250, 2, C.steel); disc(159, 250, 1, '#6b6f79');
  // magnetic parts tray with bolts
  rect(98, 250, 22, 5, '#00000040'); rect(97, 249, 22, 4, '#3a3d42'); bevel(97, 249, 22, 4, '#5a5d66', '#1b1c20');
  for (const [x, c] of [[100, '#c9a043'], [103, '#b8bcc2'], [107, '#c9a043'], [111, '#b8bcc2'], [114, '#c9a043']] as const) rect(x, 250, 2, 2, c);
  // creeper board
  ellipse(347, 255, 38, 2, '#00000040');
  woodGrain(312, 248, 70, 5, C.wood, C.woodDark, '#a5764a', 190); rect(312, 248, 16, 5, '#26262a'); bevel(312, 248, 16, 5, '#4a4d55', '#101114');
  for (const x of [316, 336, 360, 378]) { rect(x, 253, 3, 2, '#151515'); rect(x, 253, 1, 1, '#4a4d55'); }
  // extension lead, orange, snaking across the floor
  for (let x = 388; x < 440; x++) {
    const y = 252 + Math.round(Math.sin((x - 388) * 0.22) * 1.5);
    rect(x, y + 1, 1, 1, '#00000040'); rect(x, y, 1, 2, '#e8641f'); rect(x, y, 1, 1, '#f39a5c');
  }
  rect(384, 250, 6, 5, '#1b1712'); rect(384, 250, 6, 1, '#4a4d55'); rect(385, 252, 1, 2, '#c9a043'); rect(388, 252, 1, 2, '#c9a043'); // the plug
}

/** A gooseneck work lamp on the bench, warm against the cool tube light. */
export function benchLamp() {
  rect(166, 158, 11, 2, '#26262a'); rect(166, 158, 11, 1, '#4a4d55');
  line(171, 158, 171, 147, '#3a3d42'); line(171, 147, 167, 140, '#3a3d42'); line(172, 158, 172, 147, '#5a5d66');
  poly([[157, 135], [167, 133], [170, 141], [160, 143]], '#c9531a'); poly([[158, 136], [166, 134], [168, 139], [160, 141]], '#e8641f'); rect(158, 136, 8, 1, '#f39a5c');
  disc(163, 142, 2, '#fff2c0');
}
/** The lamp's pool of light on the bench, added over the lighting. */
export function benchLampGlow() {
  const g = ctx();
  g.globalAlpha = 0.22;
  for (let y = 142; y < 161; y++) {
    const hw = 4 + (y - 142) * 1.3;
    for (let x = Math.round(163 - hw); x < 163 + hw; x++) if ((1 - Math.abs(x - 163) / hw) * (1 - (y - 142) / 24) * 1.1 > bayer(x, y)) rect(x, y, 1, 1, '#ffcf7a');
  }
  g.globalAlpha = 1;
  disc(163, 142, 3, '#ffe9a855');
}
