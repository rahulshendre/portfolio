// Sky, sun, clouds, birds and the Sahyadri: flat-topped basalt mesas in hazy layers.
// The light moves from afternoon to dusk as the ride goes on, so you arrive at the garage at sunset.
import { bayer, disc, line, rect } from '../engine/pixel';

export interface Env {
  tod: number;    // 0 afternoon .. 1 dusk
  ghat: number;   // 0 plains .. 1 deep in the ghats
  plains: number; // wind farm visibility
}

const SKIES = [
  ['#8fbcd0', '#a6c9d6', '#c2d7d3', '#dcdcc6', '#eedbb0', '#f5d7a2'],
  ['#7fa8c8', '#9db6c6', '#c6c0ad', '#e6c698', '#f2b880', '#f6a96c'],
  ['#58739b', '#7888a8', '#a495ab', '#d6a58c', '#eca676', '#f2985e'],
];
const HILL_DAY = ['#aebccb', '#90a4b1', '#708b80', '#58725f'];
const HILL_DUSK = ['#8d8aa6', '#737596', '#586379', '#465654'];

export function mix(a: string, b: string, t: number): string {
  const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const c = [0, 1, 2].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * Math.min(1, Math.max(0, t))));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------- sky, cached per size and palette
const skyCache = new Map<string, HTMLCanvasElement>();
function sky(W: number, H: number, HZ: number, k: number): HTMLCanvasElement {
  const key = `${W}x${H}x${HZ}x${k}`;
  const hit = skyCache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const img = g.createImageData(W, H);
  const cols = SKIES[k].map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
  const n = cols.length - 1, hz = H * (HZ + 0.06);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = Math.min(1, y / hz) * n, i = Math.min(n - 1, Math.floor(t));
      const [r, gg, b] = cols[t - i > bayer(x, y) ? i + 1 : i];
      const o = (y * W + x) * 4;
      img.data[o] = r; img.data[o + 1] = gg; img.data[o + 2] = b; img.data[o + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  skyCache.set(key, c);
  return c;
}

// ---------------------------------------------------------------- mesa profiles, built once
const PERIOD = 1400;
const rnd = (i: number) => Math.abs(Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1;
function mesas(seed: number, count: number, wMin: number, wMax: number, slope: number, rough: number): Float32Array {
  const out = new Float32Array(PERIOD);
  const list = Array.from({ length: count }, (_, k) => ({
    c: rnd(seed + k * 3.1) * PERIOD, w: wMin + rnd(seed + k * 7.7) * (wMax - wMin), h: 0.45 + rnd(seed + k * 1.3) * 0.55,
  }));
  for (let x = 0; x < PERIOD; x++) {
    let h = 0.12 + 0.08 * Math.sin((x / PERIOD) * Math.PI * 2 * 3 + seed);
    for (const m of list) {
      const d = Math.min(Math.abs(x - m.c), PERIOD - Math.abs(x - m.c));
      h = Math.max(h, m.h * Math.min(1, Math.max(0, (m.w / 2 + slope - d) / slope)));
    }
    out[x] = h + (rnd(seed + x * 0.37) - 0.5) * rough;
  }
  return out;
}
const LAYERS = [
  { par: 0.05, amp: 64, prof: mesas(1, 7, 140, 300, 34, 0.01), strata: 0, ampG: [0.7, 0.45] },
  { par: 0.14, amp: 48, prof: mesas(2, 9, 90, 210, 16, 0.015), strata: 7, ampG: [0.55, 0.8] },
  { par: 0.3, amp: 34, prof: mesas(3, 13, 50, 150, 8, 0.02), strata: 5, ampG: [0.35, 1.25] },
  { par: 0.58, amp: 16, prof: mesas(4, 18, 30, 90, 20, 0.01), strata: 0, ampG: [0.8, 0.7] },
];
const MILLS = [120, 380, 610, 900, 1180];
const FALLS = [200, 470, 760, 1040, 1290];

export function drawBackground(g: CanvasRenderingContext2D, W: number, H: number, HZ: number, off: number, t: number, env: Env) {
  // sky: blend between the two nearest palettes
  const f = env.tod * (SKIES.length - 1), a = Math.min(SKIES.length - 2, Math.floor(f));
  g.drawImage(sky(W, H, HZ, a), 0, 0);
  g.globalAlpha = f - a; g.drawImage(sky(W, H, HZ, a + 1), 0, 0); g.globalAlpha = 1;

  const sunX = W * 0.72, sunY = H * HZ - 34 + env.tod * 30;
  disc(sunX, sunY, 19 + env.tod * 6, mix('#fbe8bf', '#f6b27a', env.tod));
  disc(sunX, sunY, 13, mix('#fff4d6', '#ffd49a', env.tod));

  const cloud = mix('#f7f1e3', '#f1c3a8', env.tod), cloudShade = mix('#e4d8c3', '#c99a92', env.tod), span = W + 140;
  for (const [cx0, cy0, s] of [[40, 0.1, 1], [170, 0.2, 1.4], [300, 0.07, 1], [420, 0.16, 1.2], [560, 0.12, 0.9]]) {
    const cx = (((cx0 - off * 0.05 - t * 2) % span) + span) % span - 70, cy = cy0 * H;
    disc(cx, cy, 6 * s, cloud); disc(cx + 8 * s, cy - 3 * s, 8 * s, cloud); disc(cx + 18 * s, cy, 6 * s, cloud);
    rect(cx - 6 * s, cy + 3 * s, 30 * s, 3 * s, cloud); rect(cx - 5 * s, cy + 6 * s, 28 * s, 1, cloudShade);
  }
  // a few birds drifting across
  for (let k = 0; k < 4; k++) {
    const bx = ((t * (9 + k) + k * 90 - off * 0.02) % (W + 60)) - 30, by = H * (0.16 + k * 0.03) + Math.sin(t * 2 + k) * 2;
    const flap = Math.floor(t * 6 + k) % 2;
    line(bx - 3, by - flap, bx, by, '#3d3a45'); line(bx, by, bx + 3, by - flap, '#3d3a45');
  }

  const base = Math.round(H * (HZ + 0.04));
  LAYERS.forEach((L, k) => {
    const col = mix(HILL_DAY[k], HILL_DUSK[k], env.tod);
    const band = mix(col, '#1b1712', 0.12);
    const amp = L.amp * (L.ampG[0] + L.ampG[1] * env.ghat);
    const hAt = (i: number) => {
      const u = Math.floor(((i + off * L.par) % PERIOD + PERIOD) % PERIOD);
      return Math.round(L.prof[u] * amp);
    };
    g.fillStyle = col;
    for (let i = 0; i < W; i++) { const h = hAt(i); g.fillRect(i, base - h, 1, h + 90); }
    if (L.strata) { // basalt bands on the cliff faces
      g.fillStyle = band;
      for (let i = 0; i < W; i++) { const h = hAt(i); for (let y = L.strata; y < h - 2; y += L.strata) g.fillRect(i, base - y, 1, 1); }
    }
    if (k === 1 && env.plains > 0.05) {
      for (const wx of MILLS) {
        const p = Math.round((((wx - off * L.par) % PERIOD) + PERIOD) % PERIOD);
        if (p > W + 20) continue;
        const foot = base - hAt(p), top = foot - Math.round(24 * env.plains);
        line(p, foot, p, top, '#ece8dd');
        for (let b = 0; b < 3; b++) { const ang = t * 2 + wx + (b * Math.PI * 2) / 3; line(p, top, p + Math.cos(ang) * 11 * env.plains, top + Math.sin(ang) * 11 * env.plains, '#f4f1e8'); }
      }
    }
    if (k === 2 && env.ghat > 0.35) { // monsoon waterfalls down the nearer cliffs
      for (const fx of FALLS) {
        const p = Math.round((((fx - off * L.par) % PERIOD) + PERIOD) % PERIOD);
        if (p > W) continue;
        const top = base - hAt(p) + 2;
        for (let y = top; y < base + 4; y++) if ((y + Math.floor(t * 20)) % 4 !== 0) rect(p, y, 1, 1, '#e8f0f2');
      }
    }
    if (k === 1 && env.ghat > 0.2) { // mist hanging between the ridges
      const mid = base - 10, strength = env.ghat * 0.55;
      g.fillStyle = mix('#e8e6dc', '#e2c6b8', env.tod);
      for (let y = mid - 7; y <= mid + 7; y++) {
        const tt = strength * (1 - Math.abs(y - mid) / 8);
        for (let x = 0; x < W; x++) if (tt > bayer(x + Math.floor(t * 3), y)) g.fillRect(x, y, 1, 1);
      }
    }
  });
}
