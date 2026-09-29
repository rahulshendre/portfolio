// Things that make the garage feel lived in and lit: depth shading, light shafts, floor detail, wall fittings and small props.
// Every function draws with the current pixel context (garage.ts paints them once into the room sprite, or per frame for the live bits).
import { C } from '../art/palette';
import { bayer, ctx, disc, ellipse, line, poly, rect } from '../engine/pixel';
import { text, textC } from '../engine/font';
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
  ellipse(303, 246, 13, 2, '#7c8494'); ellipse(303, 246, 10, 1, '#98a0b0'); rect(298, 246, 5, 1, '#f3f0e2'); // puddle and the tube light in it
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
  ellipse(396, 246, 11, 2, '#0000003a');
  poly([[387, 232], [405, 232], [403, 246], [389, 246]], '#6b7075'); rect(387, 232, 18, 1, '#8b9096'); rect(389, 245, 14, 1, '#4a4e53');
  ellipse(396, 232, 9, 2, '#3a3d42'); ellipse(396, 232, 7, 1, '#2a4a70');
  line(400, 232, 412, 194, '#a5764a'); line(401, 232, 413, 194, '#8a5a36');
  for (let k = 0; k < 6; k++) line(394 + k, 231, 392 + k * 2, 236, '#d8d2c4');
}

/** Conduit along the top of the wall, clipped to the plaster every so often. */
export function conduit() {
  const pipe = '#8b9096', hi = '#b4b9be', lo = '#4a4e53', clip = '#3a3d42';
  rect(298, 19, 182, 3, pipe); rect(298, 19, 182, 1, hi); rect(298, 21, 182, 1, lo);
  for (let x = 312; x < 480; x += 26) { rect(x, 18, 3, 5, clip); rect(x, 18, 3, 1, '#6b6f79'); }
  rect(342, 16, 10, 7, '#7d8288'); bevel(342, 16, 10, 7, '#a0a5aa', '#4a4e53'); rect(346, 19, 2, 1, '#2a2c30'); // junction box
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

/** A drip pan on the floor in front of the bike. */
export function foreground() {
  // oil drip pan under the engine
  ellipse(227, 254, 26, 2, '#00000040');
  poly([[205, 248], [249, 248], [254, 254], [200, 254]], '#5a5f66'); rect(205, 248, 44, 1, '#8b9096'); rect(201, 253, 52, 1, '#3a3d42');
  ellipse(227, 251, 19, 2, '#17120e'); rect(216, 250, 6, 1, '#6d6690'); rect(233, 251, 3, 1, '#6d6690'); // dark oil with a sheen
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

/** A moth circling the bench lamp, now and then bumping the shade. Its wings flap every other frame. */
export function mothLive(t: number) {
  const a = t * 1.9, r = 8 + Math.sin(t * 0.7) * 3 + Math.sin(t * 5.3) * 1.2;
  const x = Math.round(163 + Math.cos(a) * r), y = Math.round(141 + Math.sin(a * 1.3) * r * 0.55);
  const up = Math.floor(t * 14) % 2 === 0;
  rect(x, y, 1, 1, '#d8ccb0');
  rect(x - 1, y + (up ? -1 : 1), 1, 1, '#f2ead4'); rect(x + 1, y + (up ? -1 : 1), 1, 1, '#f2ead4');
}

/** The door's torsion tube with its big spring and cable drums, running along the top of the wall. */
export function ceilingMech() {
  rect(4, 19, 290, 3, '#6b6f79'); rect(4, 19, 290, 1, '#a0a5aa'); rect(4, 21, 290, 1, '#3a3d42');
  for (let x = 70; x < 150; x += 3) { rect(x, 18, 2, 5, x % 6 ? '#3a3d42' : '#8b9096'); rect(x, 18, 1, 1, '#b4b9be'); } // the spring, coil by coil
  for (const x of [20, 250]) { rect(x - 4, 17, 8, 7, '#4a4e53'); bevel(x - 4, 17, 8, 7, '#6b6f79', '#2a2c30'); for (let y = 18; y < 23; y += 2) rect(x - 3, y, 6, 1, '#2a2c30'); } // cable drums
  for (const x of [46, 176, 286]) { rect(x, 17, 3, 7, '#3a3d42'); rect(x, 17, 3, 1, '#6b6f79'); }                                                   // brackets
}

/** A wall extractor fan: a square steel plate, a round bezel, a wire guard and four blades that turn. Big enough to read as a real one. */
export const FAN = { x: 174, y: 72, half: 14 };
export function fanStatic() {
  const { x, y, half } = FAN;
  rect(x - half + 2, y - half + 2, half * 2, half * 2, '#00000033');
  rect(x - half, y - half, half * 2, half * 2, '#9aa0a6'); bevel(x - half, y - half, half * 2, half * 2, '#c9ced2', '#565b61'); speckle(x - half, y - half, half * 2, half * 2, '#7c8087', 0.04, 240);
  for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) { disc(x + dx * (half - 3), y + dy * (half - 3), 1, '#565b61'); rect(x + dx * (half - 3), y + dy * (half - 3), 1, 1, '#d8dcdf'); } // corner screws
  disc(x, y, 12, '#565b61'); disc(x, y, 11, '#17181b');                                                                       // bezel and the dark tunnel
  rect(x - 9, y + half - 2, 18, 1, '#7c8087');
}
export function fanLive(t: number) {
  const { x, y } = FAN, a = t * 7;
  for (let k = 0; k < 4; k++) { // each blade is a wide paddle; a fainter copy trailing behind gives the blur
    const r = a + (k * Math.PI) / 2;
    for (const [lag, col] of [[-0.28, '#3a3d42'], [0, '#8b9096']] as const) {
      const ang = r + lag;
      poly([[x, y], [Math.round(x + Math.cos(ang - 0.28) * 9), Math.round(y + Math.sin(ang - 0.28) * 9)], [Math.round(x + Math.cos(ang + 0.28) * 9), Math.round(y + Math.sin(ang + 0.28) * 9)]], col);
    }
  }
  disc(x, y, 2, '#d8dcdf'); disc(x, y, 1, '#565b61');
  for (const rad of [5, 8, 11]) for (let k = 0; k < 24; k++) { const ang = (k / 24) * Math.PI * 2; rect(Math.round(x + Math.cos(ang) * rad), Math.round(y + Math.sin(ang) * rad), 1, 1, '#b4b9be'); } // the wire guard: rings
  for (let k = 0; k < 8; k++) { const ang = (k / 8) * Math.PI * 2 + 0.2; line(x, y, Math.round(x + Math.cos(ang) * 11), Math.round(y + Math.sin(ang) * 11), '#9aa0a6'); }                        // and spokes
}

/** One frame for everything hung on the poster wall, so they all read as the same size. */
export const POSTER = { w: 44, h: 42 };
export const POSTER_AT = { x0: 194, x1: 242, y0: 39, y1: 85 }; // the 2 by 2 grid, centred on the wall between the fan and the pegboard
export function posterFrame(x: number, y: number) {
  const { w, h } = POSTER;
  rect(x + 3, y + 3, w, h, '#00000033');
  woodGrain(x, y, w, h, C.wood, C.woodDark, '#a5764a', 70 + x); rect(x, y, w, 1, '#c9a577'); rect(x, y + h - 1, w, 1, '#5e3c24');
  rect(x + 2, y + 2, w - 4, h - 4, '#f4f2ea'); bevel(x + 2, y + 2, w - 4, h - 4, '#d3ccb8', '#fbf9f2');
  speckle(x + 3, y + 3, w - 6, h - 6, '#e2dcc9', 0.03, 71 + x);
}

// A tiny 3 by 5 pixel font for the few places the normal one is too big (only the letters that are needed).
const MICRO: Record<string, string> = {
  W: '101101111111101', O: '010101101101010', R: '110101110101101', K: '101101110101101', I: '111010010010111',
  N: '110101101101101', P: '110101110100100', G: '011100101101011', E: '111100110100111', S: '011100010001110',
};
function microText(str: string, cx: number, y: number, col: string) {
  const w = str.length * 4 - 1;
  let x = Math.round(cx - w / 2);
  for (const ch of str) {
    const bits = MICRO[ch];
    if (bits) for (let i = 0; i < 15; i++) if (bits[i] === '1') rect(x + (i % 3), y + Math.floor(i / 3), 1, 1, col);
    x += 4;
  }
}


/** The fourth frame on the poster wall is kept empty for the rides page: blank paper with dashed lines top and bottom, taped up, saying it is a work in progress. */
export function ridesFrame() {
  const fx = POSTER_AT.x1, fy = POSTER_AT.y1;
  posterFrame(fx, fy);
  rect(fx + 3, fy + 3, POSTER.w - 6, POSTER.h - 6, '#f0ead8');
  for (let x = fx + 5; x < fx + POSTER.w - 5; x += 3) { rect(x, fy + 5, 2, 1, '#b8b09a'); rect(x, fy + POSTER.h - 6, 2, 1, '#b8b09a'); }
  const mid = fx + POSTER.w / 2;
  microText('WORK IN', mid, fy + 15, '#5a4636'); microText('PROGRESS', mid, fy + 23, '#5a4636');
  rect(mid - 10, fy + 31, 20, 1, '#c9c0a8');
  rect(fx + 4, fy + 2, 8, 3, '#e8d9a8aa'); rect(fx + POSTER.w - 12, fy + 2, 8, 3, '#e8d9a8aa'); // tape at the top corners
}

/** A "days since" board like the ones on workshop walls; the number is days since Rahul's last pull request. */
export function incidentBoard(days: number) {
  rect(292, 156, 26, 26, '#00000033');
  rect(290, 154, 26, 26, '#2a2a2e'); bevel(290, 154, 26, 26, '#4a4d55', '#101114');
  rect(291, 155, 24, 7, C.red); textC('PR', 303, 156, '#ffffff');
  rect(291, 162, 24, 11, '#0a0a0c'); textC(String(Math.min(99, days)), 303, 165, C.accent);
  rect(291, 173, 24, 6, '#f1eee4'); textC('DAYS', 303, 174, C.ink);
  for (const [x, y] of [[291, 155], [314, 155], [291, 178], [314, 178]]) rect(x, y, 1, 1, '#9a958b');
}

/** A small wheeled air compressor: blue tank, red pump, a gauge and a brass valve. */
export function compressor() {
  ellipse(426, 247, 19, 3, '#0000003a');
  rect(412, 229, 28, 13, '#4d6b8a'); bevel(412, 229, 28, 13, '#7a9ab8', '#2a3e54'); rect(412, 235, 28, 1, '#3a5570');
  rect(418, 218, 14, 11, '#b32a1b'); bevel(418, 218, 14, 11, '#dc4a3a', '#6e160e'); for (let y = 220; y < 228; y += 2) rect(419, y, 12, 1, '#7e1c12');
  rect(432, 221, 7, 8, '#2a2c30'); rect(432, 221, 7, 1, '#4a4d55');
  disc(415, 226, 3, '#f4f2ea'); disc(415, 226, 2, '#dcd7c8'); rect(415, 224, 1, 3, C.red); rect(412, 232, 3, 2, '#c9a043'); // gauge and the valve
  line(412, 229, 408, 221, '#3a3d42'); line(408, 221, 414, 221, '#3a3d42');                                                     // carry handle
  for (const x of [416, 436]) { disc(x, 244, 3, '#151515'); disc(x, 244, 1, '#6b6f79'); }
  speckle(412, 229, 28, 13, '#00000033', 0.05, 220);
}
/** The blast of air after a click: pale specks streaming out of the valve, fading. */
export function compressorPuff(age: number) {
  if (age < 0 || age > 1.1) return;
  const g = ctx();
  for (let i = 0; i < 14; i++) {
    const p = age * (1.4 + (i % 4) * 0.35), x = 410 - p * 14 - hash(i, 230) * 4, y = 233 + Math.sin(i * 2.1) * (2 + p * 6) + p * 4;
    g.globalAlpha = Math.max(0, 1 - age / 1.1) * 0.8;
    rect(Math.round(x), Math.round(y), i % 3 ? 1 : 2, 1, '#f4f2ea');
  }
  g.globalAlpha = 1;
}

/** A steel flask of chai and two glasses on the bench's lower shelf. The steam is drawn each frame by chaiLive. */
export function chai() {
  rect(100, 171, 9, 15, '#b8bcc2'); bevel(100, 171, 9, 15, '#e6e9ec', '#7c8087'); rect(101, 168, 7, 3, '#b32a1b'); rect(101, 168, 7, 1, '#dc4a3a'); rect(109, 174, 2, 6, '#7c8087');
  for (const x of [113, 120]) { rect(x, 180, 5, 6, '#e8d9a8'); rect(x, 180, 5, 1, '#f6efd2'); rect(x + 1, 181, 3, 3, '#b8621f'); rect(x, 185, 5, 1, '#8a7a4c'); }
}
export function chaiLive(t: number) {
  const g = ctx();
  for (const [x0, seed] of [[100, 0], [115, 1], [122, 2]] as const) for (let k = 0; k < 3; k++) {
    const p = (t * 0.55 + k / 3 + seed * 0.21) % 1;
    g.globalAlpha = (1 - p) * 0.7;
    rect(x0 + 3 + Math.round(Math.sin((p + k + seed) * 6) * 1.5), 178 - Math.round(p * 12), 1, 2, '#f4f2ea');
  }
  g.globalAlpha = 1;
}

/** A floor helmet stand: a steel pole on a three-legged base with a cradle, and the white helmet on top. */
export const HELMET = { x: 104, y: 205 };
export function helmetStand() {
  const { x, y } = HELMET;
  ellipse(x, 249, 12, 2, '#0000003a');
  rect(x - 1, y + 8, 3, 39, '#8b9096'); rect(x - 1, y + 8, 1, 39, '#b4b9be'); rect(x + 1, y + 8, 1, 39, '#4a4e53');
  line(x, 247, x - 11, 250, '#6b6f79'); line(x, 247, x + 11, 250, '#6b6f79'); line(x, 246, x, 250, '#6b6f79'); rect(x - 2, 245, 5, 3, '#4a4e53'); // base
  rect(x - 6, y + 6, 13, 2, '#4a4e53'); rect(x - 6, y + 6, 13, 1, '#8b9096');                                                                  // cradle
  disc(x, y, 9, C.ink); disc(x, y, 8, C.white);                                                                                                 // shell
  rect(x - 8, y + 2, 9, 4, '#20242c'); rect(x - 8, y + 2, 9, 1, '#4a5060'); rect(x - 6, y + 3, 2, 1, '#8fa0c0');                                // visor
  rect(x + 2, y - 1, 5, 6, C.whiteShade); rect(x - 3, y - 7, 4, 2, '#ffffff'); rect(x - 1, y - 9, 6, 1, '#ffffffaa');                           // shade and gloss
  rect(x + 3, y - 3, 3, 1, C.red);                                                                                                               // a red stripe
}
