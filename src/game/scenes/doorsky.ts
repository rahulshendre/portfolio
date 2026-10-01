// What lies behind the garage in the door scene: the sky, the land and the hour. Three hours (day, dusk, night) and two lands (the Himalaya, or the
// old Windows XP "Bliss" wallpaper), all painted in the same pixel steps, so the arrival matches whatever the ride and the garage window are showing.
import { bayer, ctx, disc, rect } from '../engine/pixel';
import { glow } from '../engine/light';
import { blit } from '../engine/sprites';
import type { Theme, Time, Weather } from '../state';

const frac = (v: number) => v - Math.floor(v);
const hash = (i: number, s = 0) => frac(Math.sin(i * 127.1 + s * 311.7) * 43758.5453);

/** A colour from a list of stops, stepping between neighbours with a fine dither so the gradient stays pixel art. */
const stepped = (stops: readonly string[], t: number, x: number, y: number) => {
  const u = Math.min(1, Math.max(0, t)) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(u));
  return u - i > bayer(x, y) ? stops[i + 1] : stops[i];
};

const SKY: Record<Theme, Record<Time, string[]>> = {
  himalaya: {
    dusk: ['#58739b', '#7888a8', '#a495ab', '#d6a58c', '#eca676', '#f2985e'],
    day: ['#2f6bc4', '#4a86d8', '#6fa6e8', '#9ac4f0', '#c2dcf6', '#dceafa'],
    night: ['#040816', '#08102e', '#0f1a48', '#18265c', '#243370', '#34447e'],
  },
  xp: {
    day: ['#2a68cc', '#4a86dc', '#74a8ec', '#9cc6f4', '#b8d8f8'],
    dusk: ['#2b3f86', '#4a559a', '#8a6aa2', '#d88a88', '#f0a878'],
    night: ['#040816', '#08102e', '#0f1a48', '#18265c', '#243370'],
  },
};
const HAZE: Record<Time, string> = { dusk: '#eca676', day: '#d8e6f4', night: '#26336a' };
const FOOT: Record<Time, [string, string]> = { dusk: ['#4b415f', '#6a5876'], day: ['#6e6a66', '#948c80'], night: ['#151b3a', '#222a52'] };
const SOIL: Record<Time, string[]> = {
  dusk: ['#a58a6f', '#977c64', '#87705b', '#75604f'],
  day: ['#c8ab80', '#bb9d74', '#a98d6a', '#957a5b'],
  night: ['#2a2f4c', '#252943', '#20233a', '#1b1e32'],
};
const SCREE: Record<Time, [string, string]> = { dusk: ['#6a5747', '#b79c80'], day: ['#7d6548', '#dcc7a2'], night: ['#12152a', '#3a4268'] };
const GRASS: Record<Time, string[]> = {
  day: ['#b4e05c', '#8cc63f', '#5fa32c', '#3f8a20'],
  dusk: ['#a8b04a', '#80943a', '#5c7c2c', '#446420'],
  night: ['#1c3a30', '#173128', '#122a22', '#0e2019'],
};
const CLOUD: Record<Time, [string, string]> = { day: ['#ffffff', '#e8f0fb'], dusk: ['#ffd9c8', '#e6a8b0'], night: ['#2a3868', '#1e2a56'] };

/** The stars: fixed, so every visit shows the same sky. Some twinkle (see `twinklers`). */
const STARS = Array.from({ length: 110 }, (_, i) => ({ x: Math.round(hash(i, 1) * 640) - 80, y: Math.round(Math.pow(hash(i, 2), 1.3) * 150), b: hash(i, 3) }));
export const twinklers = STARS.filter((_, i) => i % 6 === 0);

export interface Hour { theme: Theme; time: Time; weather: Weather; mountains: Record<Time, HTMLImageElement>; X0: number; X1: number }

/** Sky, mountains or hills, the haze where they meet the land, and the ground down to the driveway (y 248). Painted in garage coordinates. */
export function paintBackdrop({ theme, time, weather, mountains, X0, X1 }: Hour) {
  const sky = SKY[theme][time];
  for (let y = 0; y < 200; y++) for (let x = X0; x < X1; x++) rect(x, y, 1, 1, stepped(sky, y / (theme === 'xp' ? 200 : 190), x, y));
  if (time === 'night') {
    if (weather === 'clear' || weather === 'snow') for (const s of STARS) { const a = 0.35 + s.b * 0.65; rect(s.x, s.y, 1, 1, a > 0.8 ? '#f4f2ea' : a > 0.55 ? '#b8c2e0' : '#6c78a8'); if (s.b > 0.93) { rect(s.x - 1, s.y, 3, 1, '#8c98c4'); rect(s.x, s.y - 1, 1, 3, '#8c98c4'); } }
    moon();
  }
  if (theme === 'xp') return bliss(time, X0, X1);

  // the sun low and orange at dusk, small and white high up by day, in the clear sky to the right of the garage
  if (time === 'dusk') {
    disc(400, 176, 18, '#f6b27a'); disc(400, 176, 12, '#ffd49a');
    glow(ctx(), 400, 176, 90, 60, '255,170,110', 0.32);
  } else if (time === 'day') {
    glow(ctx(), 506, 46, 46, 46, '255,250,220', 0.45);
    disc(506, 46, 11, '#fff3c0'); disc(506, 46, 8, '#fffbe6');
  }
  if (time === 'day') clouds([[30, 58, 46], [330, 24, 52], [540, 90, 40]], time, 0.8);
  // the Himalaya: a real photo, regraded to the hour and reduced to a pixel palette (tools/backdrop.py)
  blit(mountains[time], X0, 0);
  // haze: the mountains melt into the light where they meet the valley
  for (let y = 120; y < 200; y++) for (let x = X0; x < X1; x++) if (Math.pow((y - 120) / 80, 2.2) * 0.65 > bayer(x, y)) rect(x, y, 1, 1, HAZE[time]);
  // foothills either side of the garage, in the colour of the shadowed faces
  const hill = (x: number, cx: number, w: number, h: number) => Math.max(0, h * (1 - Math.abs(x - cx) / w));
  const [fa, fb] = FOOT[time];
  for (let x = X0; x < X1; x++) {
    const h = Math.round(Math.max(hill(x, -30, 100, 20), hill(x, 545, 90, 18), hill(x, 20, 90, 22), hill(x, 130, 70, 12), hill(x, 440, 80, 20), hill(x, 340, 60, 10)));
    if (h > 0) { rect(x, 200 - h, 1, h + 1, fa); if (h > 3) rect(x, 200 - h, 1, 2, fb); }
  }
  // valley floor, darker toward the road, with scree
  const soil = SOIL[time], [dark, pale] = SCREE[time];
  for (let y = 200; y < 248; y++) for (let x = X0; x < X1; x++) rect(x, y, 1, 1, stepped(soil, (y - 200) / 48, x, y));
  for (let x = X0; x < X1; x += 3) if (bayer(x, 210) > 0.5) rect(x, 202 + (((x % 7) + 7) % 7) * 5, 2, 1, dark);
  for (let x = X0 + 1; x < X1; x += 5) if (bayer(x, 77) > 0.6) rect(x, 206 + ((((x * 7) % 34) + 34) % 34), 1, 1, pale);
}

/** The moon, high on the right, with a cool halo and the dark patches of its seas. */
function moon() {
  glow(ctx(), 506, 50, 44, 44, '190,210,255', 0.35);
  disc(506, 50, 9, '#dfe6f6'); disc(506, 50, 8, '#eef2fb');
  disc(503, 47, 2, '#c4cde6'); disc(509, 53, 2, '#cdd5ea'); disc(508, 46, 1, '#c4cde6');
}

/** Chunky pixel clouds: a flat white body with a shaded base and a bump or two on top. */
function clouds(list: readonly (readonly [number, number, number])[], time: Time, k = 1) {
  const [lit, base] = CLOUD[time];
  for (const [cx, cy, w] of list) {
    const cw = Math.round(w * k);
    rect(cx - cw / 2, cy + 4, cw, 6, lit); rect(cx - cw / 2 + 4, cy + 10, cw - 8, 3, base);
    rect(cx - cw / 2 + 8, cy, cw - 16, 4, lit); rect(cx - cw / 2 + 4, cy - 3, cw / 2, 3, lit);
  }
}

/** The Windows XP wallpaper: a blue sky, white clouds and one big green hill rolling down to the road. At dusk the sky warms, at night it fills with stars. */
function bliss(time: Time, X0: number, X1: number) {
  if (time === 'dusk') glow(ctx(), 470, 186, 190, 70, '255,170,110', 0.3);                     // the last light along the horizon
  clouds([[-30, 34, 70], [90, 76, 90], [300, 30, 80], [470, 60, 100], [590, 96, 60], [200, 110, 60]], time);
  const grass = GRASS[time];
  for (let x = X0; x < X1; x++) {
    const top = 112 + Math.round(((x - X0) / (X1 - X0)) * 34 + Math.sin((x - X0) / 120) * 8);
    for (let y = top; y < 248; y++) rect(x, y, 1, 1, stepped(grass, Math.min(1, ((y - top) / (248 - top)) * 1.2), x, y));
  }
  farmland(time, X0, X1);
}

/** The colour of a farm thing at this hour: the same paint, warmed at dusk, and deep blue-grey at night. */
const tone = (hex: string, time: Time) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)), m = time === 'night' ? [0.28, 0.36, 0.62] : time === 'dusk' ? [0.96, 0.82, 0.74] : [1, 1, 1];
  return '#' + [r * m[0], g * m[1], b * m[2]].map((v) => Math.round(Math.min(255, v)).toString(16).padStart(2, '0')).join('');
};

/** A little farm on the green hills behind the garage: a windmill, a barn, a cottage, trees, cows and sheep, a fence and a lane. Pixel scale. */
function farmland(time: Time, X0: number, X1: number) {
  const c = (hex: string) => tone(hex, time), px = (x: number, y: number, w: number, h: number, hex: string) => rect(x, y, w, h, c(hex));
  const tree = (x: number, y: number, r: number) => { px(x - 1, y - 2, 2, r + 2, '#5a4030'); disc(x, y - r - 1, r, c('#3f7a2a')); disc(x + 1, y - r - 2, Math.max(2, r - 2), c('#5ea23a')); };
  // the lane winding up the right-hand hill
  for (let y = 150; y < 248; y++) { const x = Math.round(486 + Math.sin(y / 14) * 9 - (y - 150) * 0.12); px(x - Math.round((y - 150) / 24) - 1, y, 3 + Math.round((y - 150) / 12), 1, '#d8cca0'); }
  // a fence along each hill
  for (const [a, b, y] of [[X0, 80, 196], [398, X1, 192]] as const) { px(a, y, b - a, 1, '#c8b890'); px(a, y + 4, b - a, 1, '#c8b890'); for (let x = a; x < b; x += 9) px(x, y - 2, 1, 9, '#d8c8a0'); }
  // the windmill on the left-hand hill, its sails still
  px(-48, 118, 12, 14, '#f4efe4'); px(-47, 126, 10, 6, '#a25a44'); px(-45, 128, 4, 4, '#6a4a34'); px(-48, 114, 12, 4, '#b99a50');
  for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) for (let i = 2; i < 13; i++) px(-42 + dx * i, 114 + dy * i, 1, 1, '#8a6a40');
  for (let i = 4; i < 12; i++) { px(-42 + i - 1, 114 - i, 2, 1, '#f0e8d0'); px(-42 - i, 114 + i - 1, 2, 1, '#f0e8d0'); }
  // a red barn with a silo, and a cottage on the right
  px(24, 136, 22, 12, '#a63a2c'); px(22, 134, 26, 3, '#7a8590'); px(30, 140, 8, 8, '#8a2e22'); px(31, 140, 6, 1, '#f6f1e6'); px(48, 128, 6, 20, '#d8d4cc'); px(48, 126, 6, 3, '#9a9690');
  px(520, 140, 22, 14, '#f4e6c8'); for (let i = 0; i < 6; i++) px(517 + i * 2, 134 + i * 2, 28 - i * 4, 2, '#bd4f36'); px(526, 146, 5, 8, '#3c6e8e'); px(534, 144, 5, 5, time === 'night' ? '#ffd070' : '#6c8fb0'); px(540, 128, 4, 8, '#9a5a46');
  for (const [x, y, r] of [[-70, 134, 6], [-58, 138, 5], [4, 142, 5], [66, 148, 7], [76, 142, 5], [506, 150, 6], [470, 144, 5], [556, 146, 6]] as const) tree(x, y, r);
  // cows on the left, sheep on the right
  for (const [x, y, f] of [[-20, 168, 1], [-4, 172, -1], [12, 166, 1]] as const) { px(x, y, 8, 4, '#f2eee4'); px(x + 1, y, 3, 2, '#23211f'); px(x + 5, y + 2, 2, 2, '#23211f'); px(x + (f > 0 ? 8 : -2), y - 1, 3, 3, '#f2eee4'); px(x + 1, y + 4, 1, 3, '#c8c1b0'); px(x + 6, y + 4, 1, 3, '#c8c1b0'); }
  for (const [x, y] of [[418, 170], [432, 176], [452, 168], [464, 178], [536, 182], [552, 176]] as const) { px(x, y, 6, 4, '#f6f1e6'); px(x + 5, y + 1, 3, 3, '#3e3832'); px(x + 1, y + 4, 1, 2, '#3a342e'); px(x + 4, y + 4, 1, 2, '#3a342e'); }
}
