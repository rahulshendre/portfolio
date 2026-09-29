// Weather for the door scene: clear dusk, rain with a lightning flash, snow, or fog. Drawn over the finished frame
// (a colour grade first, then falling things), so the same painted scene serves every weather.
import type { Weather } from '../state';

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

/** Things that fall or drift, drawn on top of everything. */
export function fall(g: CanvasRenderingContext2D, w: Weather, t: number) {
  if (w === 'clear') return;
  g.save();
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
