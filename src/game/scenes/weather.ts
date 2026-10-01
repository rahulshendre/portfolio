// Weather for the door scene: clear dusk, rain with a lightning flash, snow, or fog. Drawn over the finished frame
// (a colour grade first, then falling things), so the same painted scene serves every weather.
import type { Theme, Time, Weather } from '../state';

const W = 640, H = 270, OX = 80;
export const FLASH_AT = 1.6, THUNDER_AT = 2.3; // seconds into the scene

/** How much brighter the headlight beam reads in each weather (it shows in wet air, snow and fog). */
export const BEAM: Record<Weather, number> = { clear: 1, rain: 1.25, snow: 1.3, fog: 1.7 };

const frac = (v: number) => v - Math.floor(v);
const hash = (i: number, s = 0) => frac(Math.sin(i * 127.1 + s * 311.7) * 43758.5453);

function vgrad(g: CanvasRenderingContext2D, stops: [number, string][]) {
  const gr = g.createLinearGradient(0, 0, 0, H);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  return gr;
}

/** Colour grade over the whole frame. */
export function grade(g: CanvasRenderingContext2D, w: Weather, t: number) {
  if (w === 'clear') return;
  g.save();
  if (w === 'rain') {
    g.globalCompositeOperation = 'saturation'; g.globalAlpha = 0.55; g.fillStyle = '#808080'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 0.34; g.fillStyle = '#1d2a44'; g.fillRect(0, 0, W, H);
    g.globalAlpha = 1; g.fillStyle = vgrad(g, [[0, 'rgba(38,48,68,0.5)'], [0.7, 'rgba(38,48,68,0)']]); g.fillRect(0, 0, W, H);
    const f = Math.max(0, 1 - Math.abs(t - FLASH_AT) / 0.07, 0.65 - Math.abs(t - FLASH_AT - 0.14) / 0.12); // lightning: a flash and a weaker second
    if (f > 0) { g.globalAlpha = f * 0.5; g.fillStyle = '#e8eeff'; g.fillRect(0, 0, W, H); }
  } else if (w === 'snow') {
    g.globalCompositeOperation = 'saturation'; g.globalAlpha = 0.3; g.fillStyle = '#808080'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 0.18; g.fillStyle = '#b8c6e4'; g.fillRect(0, 0, W, H);
    // snow settled along the roof
    g.globalAlpha = 1;
    g.fillStyle = '#eef2fa'; g.fillRect(OX + 82, 30, 316, 5); g.fillRect(OX + 90, 28, 300, 3);
    g.fillStyle = '#d5deee'; g.fillRect(OX + 82, 35, 316, 1);
  } else {
    g.globalCompositeOperation = 'saturation'; g.globalAlpha = 0.4; g.fillStyle = '#808080'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.fillStyle = vgrad(g, [[0, 'rgba(206,212,224,0.4)'], [0.4, 'rgba(206,212,224,0.78)'], [0.75, 'rgba(206,212,224,0.55)'], [1, 'rgba(206,212,224,0.3)']]); g.fillRect(0, 0, W, H);
  }
  g.restore();
}

/** Snow lying on the valley floor. Painted before the bike and the door so they stand on it. */
export function ground(g: CanvasRenderingContext2D, w: Weather) {
  if (w !== 'snow') return;
  g.save();
  for (const [x0, x1] of [[0, OX + 90], [OX + 390, W]]) {
    for (let x = x0; x < x1; x++) {
      const top = 204 + Math.round(hash(Math.floor(x / 3), 9) * 6); // a lumpy edge
      for (let y = top; y < 248; y++) { g.fillStyle = `rgba(234,240,250,${(0.62 - (y - top) * 0.004).toFixed(2)})`; g.fillRect(x, y, 1, 1); }
    }
  }
  g.restore();
}

/** Things that fall or drift, drawn on top of everything. `dim` fades them (rain and snow read fainter in the dark). */
export function fall(g: CanvasRenderingContext2D, w: Weather, t: number, dim = 1) {
  if (w === 'clear') return;
  g.save(); g.globalAlpha = dim;
  if (w === 'rain') {
    g.fillStyle = 'rgba(190,206,230,0.28)';
    for (let i = 0; i < 90; i++) { // far, short, slow
      const y = (hash(i, 1) * H + t * 300) % (H + 12) - 6, x = (hash(i, 2) * (W + 60) - y * 0.18 + W) % W;
      g.fillRect(Math.round(x), Math.round(y), 1, 2);
    }
    g.fillStyle = 'rgba(210,224,244,0.55)';
    for (let i = 0; i < 110; i++) { // near, long, fast
      const y = (hash(i, 3) * H + t * (520 + hash(i, 4) * 120)) % (H + 20) - 10, x = (hash(i, 5) * (W + 60) - y * 0.2 + W) % W;
      g.fillRect(Math.round(x), Math.round(y), 1, 3); g.fillRect(Math.round(x) - 1, Math.round(y) + 3, 1, 3);
    }
    for (let i = 0; i < 46; i++) { // splashes on the road
      const ph = frac(t * 2.6 + hash(i, 6)), x = Math.round(hash(i, 7) * W), y = 250 + Math.round(hash(i, 8) * 16);
      if (ph < 0.32) { g.fillStyle = `rgba(215,228,246,${(0.5 * (1 - ph / 0.32)).toFixed(2)})`; g.fillRect(x - 2 - Math.round(ph * 6), y, 5 + Math.round(ph * 12), 1); }
    }
  } else if (w === 'snow') {
    for (let i = 0; i < 170; i++) {
      const big = i % 4 === 0, sp = 16 + hash(i, 1) * 26 + (big ? 14 : 0);
      const y = (hash(i, 2) * H + t * sp) % (H + 8) - 4, x = (hash(i, 3) * W + Math.sin(t * 0.9 + i) * 10 + t * 9) % W;
      g.fillStyle = big ? 'rgba(255,255,255,0.9)' : 'rgba(240,246,255,0.65)';
      g.fillRect(Math.round(x), Math.round(y), big ? 2 : 1, big ? 2 : 1);
    }
  } else {
    for (let i = 0; i < 6; i++) { // slow banks of mist
      const x = ((hash(i, 1) * (W + 320) + t * (5 + i * 1.5)) % (W + 320)) - 160, y = 130 + hash(i, 2) * 120;
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, 'rgba(226,231,240,0.42)'); gr.addColorStop(1, 'rgba(226,231,240,0)');
      g.save(); g.translate(x, y); g.scale(150 + hash(i, 3) * 60, 22 + hash(i, 4) * 12); g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); g.restore();
    }
  }
  g.restore();
}

// ---- the garage window: the same weather, seen from inside
// Each theme's view, with the weather's tint laid over it.
const TINT: Record<Weather, string> = { clear: 'rgba(255,226,170,0.14)', rain: 'rgba(38,50,72,0.52)', snow: 'rgba(222,232,246,0.42)', fog: 'rgba(214,220,230,0.66)' };

const mix = (a: string, b: string, t: number) => {
  const p = (c: string, i: number) => parseInt(c.slice(1 + i * 2, 3 + i * 2), 16);
  return `rgb(${[0, 1, 2].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * t)).join(',')})`;
};

/** The still part of the view: the land's picture for the hour, then the weather's tint, and snow lying along the bottom. At night the garage darkens it itself. */
export function windowSky(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, wt: Weather, theme: Theme = 'himalaya', time: Time = 'dusk') {
  const day = time === 'day';
  if (theme === 'xp') { // the old Windows XP wallpaper: blue sky, white clouds, one green hill (warmer at dusk)
    const skyH = Math.round(h * 0.75), [top, low] = day ? ['#2a68cc', '#a4cdf4'] : ['#2b3f86', '#f0a878'];
    for (let r = 0; r < skyH; r++) { g.fillStyle = mix(top, low, r / (skyH - 1)); g.fillRect(x, y + r, w, 1); }
    g.fillStyle = day ? '#ffffff' : '#ffd9c8';
    for (const [cx, cy, cw] of [[0.28, 0.16, 14], [0.7, 0.3, 18], [0.5, 0.44, 12]]) {
      const px = x + Math.round(w * cx), py = y + Math.round(h * cy);
      g.fillRect(px - cw / 2 + 3, py, cw - 6, 2); g.fillRect(px - cw / 2, py + 2, cw, 3); g.fillRect(px - cw / 2 + 2, py + 5, cw - 4, 1);
    }
    const [hi, lo] = day ? ['#a6d94a', '#3d8420'] : ['#a8b04a', '#446420'];
    for (let c = 0; c < w; c++) {
      const top = y + Math.round(h * 0.5 + (c / w) * h * 0.12 + Math.sin((c / w) * 3.4) * 3), bottom = y + h;
      for (let yy = top; yy < bottom; yy++) { g.fillStyle = mix(hi, lo, Math.min(1, (yy - top) / (bottom - top) * 1.3)); g.fillRect(x + c, yy, 1, 1); }
    }
    const ground = (f: number) => y + Math.round(h * 0.5 + f * h * 0.12 + Math.sin(f * 3.4) * 3);   // where the hill is, a share f of the way across
    const wx = x + Math.round(w * 0.66), wy = ground(0.66) + 3, wall = day ? '#f4efe4' : '#c8b8b0';
    g.fillStyle = wall; g.fillRect(wx - 2, wy - 8, 5, 9); g.fillStyle = '#b99a50'; g.fillRect(wx - 2, wy - 9, 5, 2);       // a windmill on the hill, sails out
    g.fillStyle = '#8a6a40'; for (let i = 3; i < 8; i++) { g.fillRect(wx + i - 1, wy - 10 - i + 1, 1, 1); g.fillRect(wx - i, wy - 10 + i - 1, 1, 1); g.fillRect(wx + i - 1, wy - 10 + i - 1, 1, 1); g.fillRect(wx - i, wy - 10 - i + 1, 1, 1); }
    for (const [f, r] of [[0.22, 4], [0.3, 3], [0.86, 4]] as const) { const tx = x + Math.round(w * f), ty = ground(f) + 4; g.fillStyle = '#5a4030'; g.fillRect(tx, ty - 3, 1, 4); g.fillStyle = day ? '#3f7a2a' : '#3a5a2a'; g.fillRect(tx - r + 1, ty - 3 - r, r * 2 - 1, r + 1); g.fillStyle = day ? '#5ea23a' : '#4a7030'; g.fillRect(tx - r + 2, ty - 3 - r, r - 1, 2); }
  } else { // the Himalaya, like the arrival: a warm dusk sky, or a blue day, snow peaks and a dark valley
    const skyH = Math.round(h * 0.8), [top, low] = day ? ['#3c78cc', '#cfe3f4'] : ['#58739b', '#f2985e'];
    for (let r = 0; r < skyH; r++) { g.fillStyle = mix(top, low, r / (skyH - 1)); g.fillRect(x, y + r, w, 1); }
    if (day) { // a small high sun with a halo
      const sx = x + w - 16, sy = y + 12;
      for (const [r, a] of [[11, 0.12], [8, 0.2], [6, 0.3]]) { g.fillStyle = `rgba(255,252,226,${a})`; g.fillRect(sx - r, sy - r, r * 2 + 1, r * 2 + 1); }
      g.fillStyle = '#fffbe6'; g.fillRect(sx - 3, sy - 3, 7, 7);
    } else if (wt === 'clear') { // a big low sun with a halo
      const sx = x + w - 14, sy = y + h - 24;
      for (const [r, a] of [[13, 0.1], [10, 0.16], [7, 0.24]]) { g.fillStyle = `rgba(255,230,170,${a})`; g.fillRect(sx - r, sy - r, r * 2 + 1, r * 2 + 1); }
      g.fillStyle = '#fff0c4'; g.fillRect(sx - 4, sy - 4, 9, 9); g.fillStyle = '#ffe08a'; g.fillRect(sx - 3, sy - 3, 7, 7);
    } else { g.fillStyle = '#ffd49a'; g.fillRect(x + w - 11, y + h - 22, 6, 6); }
    const [rock, snow] = day ? ['#5e6a8c', '#f6f9ff'] : ['#4b415f', '#e8e2ee'];
    for (let c = 0; c < w; c++) {
      const peak = Math.abs(((c + 6) % 22) - 11) / 11, top = y + Math.round(h * 0.42 + peak * h * 0.2 + hash(Math.floor(c / 4), 4) * 3);
      g.fillStyle = rock; g.fillRect(x + c, top, 1, y + h - top);
      g.fillStyle = snow; g.fillRect(x + c, top, 1, peak < 0.35 ? 3 : 1);
    }
    g.fillStyle = day ? '#a8906f' : '#75604f'; g.fillRect(x, y + h - 5, w, 5);
  }
  if (TINT[wt]) { g.fillStyle = TINT[wt]; g.fillRect(x, y, w, h); }
  if (wt === 'snow') { g.fillStyle = '#eef2fa'; g.fillRect(x, y + h - 5, w, 5); }
}

/** Lightning strength, 0 to 1: a bright flash, then a weaker second one, every 9 seconds. */
export function stormFlash(t: number) {
  const u = (t % 9) - 4;
  return Math.max(0, 1 - Math.abs(u) / 0.1, 0.6 - Math.abs(u - 0.18) / 0.12);
}

/** The moving part of the view, clipped to the glass: rain and a flash, snow, or drifting mist. */
export function windowFall(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, wt: Weather, t: number) {
  if (wt === 'clear') return;
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  if (wt === 'rain') {
    g.fillStyle = 'rgba(214,226,246,0.75)';
    for (let i = 0; i < 44; i++) { // slanted streaks, long and quick
      const yy = (hash(i, 1) * h + t * (110 + hash(i, 2) * 60)) % (h + 10) - 5, xx = (hash(i, 3) * (w + 12) - yy * 0.2 + w + 12) % (w + 12);
      g.fillRect(x + Math.round(xx), y + Math.round(yy), 1, 4); g.fillRect(x + Math.round(xx) - 1, y + Math.round(yy) + 4, 1, 2);
    }
    for (let i = 0; i < 7; i++) { // drops crawling down the glass, each with a short trail
      const yy = (hash(i, 8) * h + t * (4 + hash(i, 9) * 5)) % h, xx = 3 + Math.floor(hash(i, 10) * (w - 6));
      g.fillStyle = 'rgba(230,240,255,0.5)'; g.fillRect(x + xx, y + Math.round(yy) - 4, 1, 4);
      g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(x + xx, y + Math.round(yy), 1, 2);
    }
    for (let i = 0; i < 9; i++) { // splashes bouncing on the sill
      const ph = frac(t * 2.4 + hash(i, 11)), sx = x + Math.round(hash(i, 12) * w);
      if (ph < 0.35) { g.fillStyle = `rgba(225,236,255,${(0.8 * (1 - ph / 0.35)).toFixed(2)})`; g.fillRect(sx - Math.round(ph * 5), y + h - 2, 3 + Math.round(ph * 10), 1); g.fillRect(sx, y + h - 3 - Math.round(ph * 8), 1, 1); }
    }
    const f = stormFlash(t);
    if (f > 0) { g.fillStyle = `rgba(232,238,255,${(f * 0.85).toFixed(2)})`; g.fillRect(x, y, w, h); }
  } else if (wt === 'snow') {
    for (let i = 0; i < 26; i++) {
      const yy = (hash(i, 1) * h + t * (10 + hash(i, 2) * 12)) % (h + 4) - 2, xx = hash(i, 3) * w + Math.sin(t * 0.9 + i) * 3;
      g.fillStyle = i % 4 === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(240,246,255,0.65)';
      g.fillRect(x + Math.round((xx + w) % w), y + Math.round(yy), i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
    }
  } else {
    for (let i = 0; i < 3; i++) {
      const bx = ((hash(i, 1) * (w + 60) + t * (2 + i)) % (w + 60)) - 30, by = y + h * 0.4 + hash(i, 2) * h * 0.5;
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, 'rgba(226,231,240,0.55)'); gr.addColorStop(1, 'rgba(226,231,240,0)');
      g.save(); g.translate(x + bx, by); g.scale(24, 7); g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); g.restore();
    }
  }
  g.restore();
}
