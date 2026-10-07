// Ladakh skyline: a big low sun, soft clouds, and five layers of mountains that get hazier and paler with distance.
// Every ridge has a sunlit face and a shaded face (the sun is on the right), so the layers read as solid land, not cut paper.
import { altitude } from './track-ladakh';
import { box, circle, mix, oval, rnd, smooth, stroke, use, vgrad } from './draw';
import { drawRange, massif } from './mountains';

export interface Env {
  tod: number; // 0 afternoon .. 1 dusk
  alt: number; // 0 valley .. 1 pass top
  lake: number; // 0 .. 1 near the lake chapter
  lite?: boolean; // slow device: skip the priciest shading
  night?: number; // 0 day .. 1 full night: a dark navy sky, a moon and cold mountains
  theme?: 'himalaya' | 'xp'; // the land: the Himalaya, or the green hills of the old Windows XP wallpaper
  winter?: number; // 0 .. 1 how deep in winter the lap is: the lower hills go white and the snow line drops
}

const NIGHT_SKY = ['#040816', '#08113a', '#101c50', '#1c2c66', '#2c3c7c', '#425088'];
const NIGHT_HAZE = '#232b58';

// Sky stops from the zenith down to the horizon, blended between afternoon, late light and dusk.
const SKIES = [
  ['#3f86c9', '#5b9bd0', '#8ab8d6', '#bcd2d6', '#e6dcbc', '#f6d9a4'],
  ['#3a75b8', '#5e8fc0', '#a4a8c0', '#e0b8a0', '#f2b080', '#f8c088'],
  ['#2c4a86', '#565c98', '#a06e98', '#e0806c', '#f2985c', '#f8b070'],
];
// The Bliss land: the old Windows XP wallpaper's deep blue sky, the same afternoon-to-dusk slide, and rolling green hills in place of the peaks.
const BLISS_SKIES = [
  ['#1d5cc8', '#2f78d8', '#5a9ae6', '#8abcee', '#b4d6f4', '#d6e8f8'],
  ['#2a5cb0', '#4f80c6', '#9a98c4', '#e2aa9e', '#f4b690', '#f9cca2'],
  ['#27407f', '#4d5a9a', '#a070a0', '#e08c86', '#f4a478', '#fbc490'],
];
const HAZE = ['#f0dcb4', '#f0bc98', '#f0a878']; // the colour distant land fades to
const BLISS_HAZE = ['#d6e8f6', '#f2d4c0', '#f0b090']; // the same, over the green hills: a pale blue day, then the warm light of the evening

const PERIOD = 2400;

/** A repeating ridge line from a few sine waves. `crest` 1 gives sharp ridged peaks, 0 soft rolling hills. */
function ridged(seed: number, crest: number, gain: number): Float32Array {
  const out = new Float32Array(PERIOD);
  const F = [3, 7, 13, 29, 61], ph = F.map((_, k) => rnd(seed * 13.7 + k * 5.1) * Math.PI * 2);
  const raw = new Float32Array(PERIOD);
  let lo = 1e9, hi = -1e9;
  for (let x = 0; x < PERIOD; x++) {
    let s = 0, a = 1, n = 0;
    for (let k = 0; k < F.length; k++) { s += a * Math.sin((F[k] * x * Math.PI * 2) / PERIOD + ph[k]); n += a; a *= 0.56; }
    s /= n;
    const r = 1 - Math.abs(s), soft = 0.5 + 0.5 * s;
    raw[x] = crest * r + (1 - crest) * soft;
    lo = Math.min(lo, raw[x]); hi = Math.max(hi, raw[x]);
  }
  for (let x = 0; x < PERIOD; x++) out[x] = Math.pow((raw[x] - lo) / (hi - lo), gain);
  return out;
}

const GIANTS = massif(11, 3, 7);      // the far white giants
const HIGH = massif(1, 4, 8);         // the snow range
const MIDR = massif(2, 5, 9);         // the nearer, darker range
const HILL_A = ridged(21, 0, 1.5), HILL_B = ridged(22, 0.05, 1.25), HILL_C = ridged(23, 0, 1.05), HILL_D = ridged(24, 0, 0.95);   // the Bliss hills, soft and rolling
const FOOT = ridged(3, 0.5, 1.25);    // ochre foothills
const NEAR = ridged(4, 0.25, 1.1);    // rolling dunes
const CLOSE = ridged(5, 0.1, 1.0);    // low ground swell

const skyFill = (g: CanvasRenderingContext2D, W: number, H: number, HZ: number, cols: string[]) => {
  const gr = g.createLinearGradient(0, 0, 0, H * (HZ + 0.04));
  cols.forEach((c, i) => gr.addColorStop(i / (cols.length - 1), c));
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
};

interface Layer { prof: Float32Array; base: number; amp: number; off: number; lit: string; shade: string; haze: number; snow: number; }

/** One mountain layer: a filled silhouette with a fade toward the haze colour, then sunlit and shaded faces along the crest, then snow. */
function layer(g: CanvasRenderingContext2D, W: number, hazeCol: string, L: Layer, lite = false) {
  // the crest, sampled once every 2px and reused for the body, the faces and the snow
  const n = Math.ceil(W / 2) + 6, ys = new Float32Array(n);
  for (let i = 0; i < n; i++) ys[i] = L.base - L.prof[(((Math.floor((i - 3) * 2 + L.off)) % PERIOD) + PERIOD) % PERIOD] * L.amp;
  const at = (i: number) => ys[i + 3];
  const body = mix(L.shade, hazeCol, L.haze);
  const gr = g.createLinearGradient(0, L.base - L.amp, 0, L.base + 4);
  gr.addColorStop(0, mix(L.lit, hazeCol, L.haze * 0.6));
  gr.addColorStop(1, mix(body, hazeCol, 0.5));
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(0, L.base + 90);
  for (let i = 0; i * 2 <= W; i++) g.lineTo(i * 2, at(i));
  g.lineTo(W, L.base + 90);
  g.closePath();
  g.fill();

  // light and shade on the faces: slopes that fall away to the right face the sun
  const face = L.amp * 0.5, litCol = mix(L.lit, '#fff2d0', 0.4), shadeCol = mix(L.shade, '#20204a', 0.5);
  for (let i = 0; !lite && i * 2 < W; i++) {
    const slope = (at(i + 4) - at(i - 4)) / 3;                   // > 0 means falling to the right, averaged wide so the faces don't flicker
    if (slope > 0.6) { g.globalAlpha = Math.min(0.4, slope * 0.06); g.fillStyle = litCol; g.fillRect(i * 2, at(i), 2, face); }
    else if (slope < -0.6) { g.globalAlpha = Math.min(0.46, -slope * 0.07); g.fillStyle = shadeCol; g.fillRect(i * 2, at(i), 2, face); }
  }
  g.globalAlpha = 1;

  if (L.snow > 0.05) {
    g.fillStyle = mix('#f7f9ff', '#efdcd0', 1 - L.snow);
    const line = L.amp * 0.6;
    let run: number[] = [];
    const flush = () => {
      if (run.length >= 6) {
        g.beginPath();
        g.moveTo(run[0], run[1]);
        for (let i = 2; i < run.length; i += 2) g.lineTo(run[i], run[i + 1]);
        for (let i = run.length - 2; i >= 0; i -= 2) {                          // back along a wavy snow line, so the cap has a natural lower edge
          const x = run[i], d = Math.min(L.amp * 0.2, (L.base - run[i + 1] - line) * 0.7 + 2);
          g.lineTo(x, run[i + 1] + d * (0.8 + 0.2 * Math.sin(x * 0.31)));
        }
        g.closePath(); g.fill();
      }
      run = [];
    };
    for (let i = 0; i * 2 <= W; i++) { const y = at(i); if (L.base - y > line) run.push(i * 2, y); else flush(); }
    flush();
  }
}

function cloud(g: CanvasRenderingContext2D, x: number, y: number, s: number, tod: number, a: number) {
  const top = mix('#ffffff', '#ffe2c8', tod), under = mix('#c2cfe2', '#e0a4a0', tod);
  g.globalAlpha = a;
  oval(x, y + 5 * s, 34 * s, 7 * s, under);                     // flat shadowed base
  for (const [dx, dy, r] of [[-20, 0, 12], [-6, -6, 16], [10, -4, 14], [24, 0, 10]] as const) oval(x + dx * s, y + dy * s, r * s * 1.25, r * s * 0.8, top);
  g.globalAlpha = 1;
}

/** A big soft cumulus, as on the wallpaper: round lobes shaded toward a flat, cool base. */
function puff(g: CanvasRenderingContext2D, x: number, y: number, s: number, tod: number, a: number, lite: boolean) {
  const top = mix('#ffffff', '#ffe4d0', tod), under = mix('#b8cdea', '#dca4a8', tod);
  g.globalAlpha = a;
  oval(x, y + 10 * s, 64 * s, 9 * s, under);
  for (const [dx, dy, r] of [[-44, 3, 20], [-22, -8, 27], [3, -17, 31], [28, -8, 26], [47, 3, 19], [0, 1, 28]] as const) {
    if (lite) { circle(x + dx * s, y + dy * s, r * s, top); continue; }
    const gr = g.createRadialGradient(x + dx * s, y + (dy - r * 0.3) * s, 0, x + dx * s, y + dy * s, r * s);
    gr.addColorStop(0, top); gr.addColorStop(0.6, top); gr.addColorStop(1, mix(top, under, 0.6));
    circle(x + dx * s, y + dy * s, r * s, gr);
  }
  g.globalAlpha = 1;
}

interface Hill { prof: Float32Array; base: number; amp: number; off: number; lit: string; shade: string; haze: number; trees?: number; seed?: number }

/** One rolling hill: bright on top, darker toward its foot, lit along the crest and on the slopes that face the sun, fading into the haze with distance. */
function hillLayer(g: CanvasRenderingContext2D, W: number, hazeCol: string, L: Hill, lite = false) {
  const n = Math.ceil(W / 2) + 6, ys = new Float32Array(n);
  for (let i = 0; i < n; i++) ys[i] = L.base - L.prof[(((Math.floor((i - 3) * 2 + L.off)) % PERIOD) + PERIOD) % PERIOD] * L.amp;
  const at = (i: number) => ys[i + 3];
  const gr = g.createLinearGradient(0, L.base - L.amp, 0, L.base + 6);
  gr.addColorStop(0, mix(L.lit, hazeCol, L.haze * 0.55)); gr.addColorStop(1, mix(L.shade, hazeCol, L.haze));
  g.fillStyle = gr; g.beginPath(); g.moveTo(0, L.base + 90);
  for (let i = 0; i * 2 <= W; i++) g.lineTo(i * 2, at(i));
  g.lineTo(W, L.base + 90); g.closePath(); g.fill();
  if (lite) return;
  const lit = mix(L.lit, '#fffbd0', 0.3), shade = mix(L.shade, '#1a3a1a', 0.45);
  for (let i = 0; i * 2 < W; i++) {                                                  // slopes falling away to the right face the sun
    const slope = (at(i + 5) - at(i - 5)) / 3;
    if (slope > 0.12) { g.globalAlpha = Math.min(0.34, slope * 0.34) * (1 - L.haze * 0.6); g.fillStyle = lit; g.fillRect(i * 2, at(i), 2, L.amp * 0.55); }
    else if (slope < -0.12) { g.globalAlpha = Math.min(0.3, -slope * 0.3) * (1 - L.haze * 0.6); g.fillStyle = shade; g.fillRect(i * 2, at(i), 2, L.amp * 0.55); }
  }
  g.globalAlpha = 0.5 * (1 - L.haze * 0.7); g.strokeStyle = mix(L.lit, '#ffffff', 0.45); g.lineWidth = 1.4; g.lineJoin = 'round';   // the crest catches the light
  g.beginPath(); for (let i = 0; i * 2 <= W; i++) (i ? g.lineTo(i * 2, at(i) + 0.8) : g.moveTo(0, at(0) + 0.8)); g.stroke(); g.globalAlpha = 1;
  if (L.trees) {                                                                      // little round trees dotted along the crest, fixed to the land so they scroll with it
    const cell = 16, c0 = Math.floor(L.off / cell), c1 = Math.floor((L.off + W) / cell) + 1;
    for (let c = c0; c <= c1; c++) {
      const r = rnd(c * 3.7 + (L.seed ?? 0)); if (r > L.trees) continue;
      const x = c * cell - L.off + rnd(c * 1.3) * 10, i = Math.round(x / 2) + 3; if (i < 0 || i >= n) continue;
      const h = (5 + rnd(c * 2.9) * 7) * (L.amp / 60 + 0.6), y = ys[i] + 1, col = mix(mix('#3f7a2a', L.shade, 0.35), hazeCol, L.haze * 0.8);
      box(x - 0.6, y - h * 0.4, 1.2, h * 0.4, col); circle(x, y - h * 0.7, h * 0.46, col); circle(x + h * 0.14, y - h * 0.82, h * 0.26, mix(col, '#b4e36c', 0.18));
    }
  }
}

export function drawBackground(g: CanvasRenderingContext2D, W: number, H: number, HZ: number, off: number, t: number, env: Env) {
  use(g);
  const xp = env.theme === 'xp', skies = xp ? BLISS_SKIES : SKIES;
  const f = env.tod * (skies.length - 1);
  const a = Math.min(skies.length - 2, Math.floor(f));
  skyFill(g, W, H, HZ, skies[a]);
  if (f - a > 0.01) { g.globalAlpha = f - a; skyFill(g, W, H, HZ, skies[a + 1]); g.globalAlpha = 1; }
  const night = env.night ?? 0;
  if (night > 0.01) { g.globalAlpha = night; skyFill(g, W, H, HZ, NIGHT_SKY); g.globalAlpha = 1; }
  const hazeCol = night > 0 ? mix(hazeAt(env.tod, env.theme), NIGHT_HAZE, night) : hazeAt(env.tod, env.theme);

  const horizon = Math.round(H * HZ);
  if ((env.tod > 0.7 || night > 0) && !env.lite) {                                    // the first stars, out at the top of the sky as evening comes, thick at night
    const a = Math.max((env.tod - 0.7) / 0.3, night);
    g.fillStyle = '#fff6e0';
    for (let i = 0, n = night > 0 ? 130 : 46; i < n; i++) {
      const r1 = Math.abs(Math.sin(i * 91.7) * 4375.5) % 1, r2 = Math.abs(Math.sin(i * 47.3 + 2) * 9871.3) % 1;
      g.globalAlpha = a * (0.25 + 0.5 * Math.abs(Math.sin(t * 1.3 + i))) * (1 - r2 * 0.6);
      g.fillRect(r1 * W, r2 * horizon * (night > 0 ? 0.92 : 0.5), i % 7 ? 1.6 : 2.4, i % 7 ? 1.6 : 2.4);
    }
    g.globalAlpha = 1;
  }
  // the sun: a wide warm bloom, a soft ring, then the disc
  const sunX = W * 0.74, sunY = horizon - H * (0.26 - 0.15 * env.tod);   // it sinks toward the peaks as the ride goes on
  if (!env.lite && night < 0.95) {
    g.globalAlpha = 1 - night;
    const bloom = g.createRadialGradient(sunX, sunY, 0, sunX, sunY, H * 0.62);
    bloom.addColorStop(0, mix('#fff2c8', '#ffc890', env.tod) + 'cc'); bloom.addColorStop(0.25, mix('#ffe0a0', '#f8a070', env.tod) + '55'); bloom.addColorStop(1, '#ffd09000');
    g.fillStyle = bloom; g.fillRect(0, 0, W, horizon + 40);
    g.globalAlpha = 1;
  }
  g.globalAlpha = 1 - night;
  circle(sunX, sunY, H * 0.062, mix('#ffe9b0', '#ffb888', env.tod) + '99');
  circle(sunX, sunY, H * 0.044, mix('#fff8dc', '#ffe0b0', env.tod));
  g.globalAlpha = 1;
  if (night > 0.02) {                                                                 // the moon, high and to the left, with a cool halo and a few craters
    const mx = W * 0.3, my = horizon * 0.42, mr = H * 0.05;
    g.globalAlpha = night;
    const halo = g.createRadialGradient(mx, my, 0, mx, my, mr * 7); halo.addColorStop(0, 'rgba(190,210,255,0.35)'); halo.addColorStop(1, 'rgba(190,210,255,0)');
    g.fillStyle = halo; g.fillRect(mx - mr * 7, my - mr * 7, mr * 14, mr * 14);
    circle(mx, my, mr, '#eef2fb'); circle(mx - mr * 0.3, my - mr * 0.2, mr * 0.22, '#d2d9ea'); circle(mx + mr * 0.35, my + mr * 0.25, mr * 0.3, '#d8deee'); circle(mx + mr * 0.05, my - mr * 0.55, mr * 0.14, '#d2d9ea');
    g.globalAlpha = 1;
  }

  // clouds drift slowly and sit higher and thinner toward the top of the sky
  const span = W + 260;
  for (const [cx0, cy0, s, sp] of [[80, 0.14, 1.5, 1.0], [330, 0.08, 1.1, 0.7], [560, 0.19, 1.9, 1.3], [820, 0.11, 1.3, 0.9], [1040, 0.22, 1.6, 1.1]] as const) {
    const cx = (((cx0 - off * 0.03 - t * 2.2 * sp) % span) + span) % span - 130;
    if (xp) puff(g, cx, cy0 * H * 1.15 + H * 0.04, s * (H / 600), env.tod, (0.78 + env.tod * 0.1) * (1 - night * 0.8), !!env.lite);
    else cloud(g, cx, cy0 * H, s * (H / 480), env.tod, (0.5 + env.tod * 0.18) * (1 - night * 0.72));
  }

  // a few birds, riding the air high up
  if (!env.lite) for (let i = 0; i < 4; i++) {
    const bx = (((i * 331 + 120 - off * 0.05 - t * (14 + i * 3)) % (W + 200)) + (W + 200)) % (W + 200) - 100, by = horizon * (0.28 + 0.1 * i) + Math.sin(t * 0.7 + i) * 8, fl = Math.sin(t * 7 + i * 2) * 3.4 * (H / 600);
    g.strokeStyle = mix('#3a3230', '#2a2028', env.tod); g.lineWidth = 1.6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(bx - 9, by + fl); g.quadraticCurveTo(bx - 4, by - 3, bx, by); g.quadraticCurveTo(bx + 4, by - 3, bx + 9, by + fl); g.stroke();
  }

  if (!env.lite) {                                                                    // and one eagle, wheeling on a thermal, wings held wide
    const ex = W * (0.32 + 0.22 * Math.sin(t * 0.09 + 1)) - off * 0.02, ey = horizon * (0.42 + 0.06 * Math.sin(t * 0.17)), sc = H / 600 * 1.3, bank = Math.cos(t * 0.09 + 1) * 0.25, tip = Math.sin(t * 1.4) * 1.5;
    g.save(); g.translate(ex, ey); g.rotate(bank); g.scale(sc, sc);
    g.fillStyle = mix('#3a2e26', '#2a2028', env.tod);
    g.beginPath(); g.moveTo(-34, 2 + tip); g.quadraticCurveTo(-22, -7, -6, -2); g.quadraticCurveTo(0, -5, 6, -2); g.quadraticCurveTo(22, -7, 34, 2 + tip);
    g.quadraticCurveTo(24, 2, 20, 4); g.lineTo(28, 7 + tip); g.quadraticCurveTo(16, 4, 12, 4); g.quadraticCurveTo(0, 8, -12, 4); g.quadraticCurveTo(-16, 4, -28, 7 + tip); g.lineTo(-20, 4); g.quadraticCurveTo(-24, 2, -34, 2 + tip); g.fill();
    g.beginPath(); g.moveTo(-5, 3); g.lineTo(0, 12); g.lineTo(5, 3); g.fill();                                                                       // the tail
    g.restore();
  }

  const base = horizon + 2, tall = Math.max(1, H / 420), snow = smooth(0.2, 0.85, env.alt);
  const lum = (c: string) => (parseInt(c.slice(1, 3), 16) + parseInt(c.slice(3, 5), 16) + parseInt(c.slice(5, 7), 16)) / 3;
  const dusk = (day: string, dk: string, moon?: string) => {                           // day colours slide to dusk ones, then to cold blue at night (lit faces stay lighter than shaded ones)
    const c = mix(day, dk, env.tod);
    return night > 0 ? mix(c, moon ?? (lum(c) > 130 ? '#39457f' : '#141c42'), night * 0.86) : c;   // `moon` lets snow keep a pale glow in the moonlight
  };
  const w = env.winter ?? 0;
  /** A colour pulled toward its winter one (itself dressed for the hour) as the lap goes into winter. */
  const win = (c: string, day: string, dk: string, moon?: string) => (w > 0.01 ? mix(c, dusk(day, dk, moon), w * 0.84) : c);
  if (xp) {                                                                             // Bliss: rolling green hills in place of the Himalaya
    const c = (day: string, dk: string, moon: string) => dusk(day, dk, moon);
    const climb = 1 + env.alt * 0.35;                                                  // the hills swell as the road climbs
    hillLayer(g, W, hazeCol, { prof: HILL_A, base, amp: 92 * tall * climb, off: off * 0.015 + 300, lit: win(c('#9cd47e', '#c8b89a', '#46678a'), '#eef4f4', '#f0e2e2', '#6f86b8'), shade: win(c('#62ac5c', '#7a8668', '#263d5c'), '#c3d3da', '#c7bccb', '#4a6290'), haze: 0.4, trees: 0.5, seed: 1 }, !!env.lite);
    hillLayer(g, W, hazeCol, { prof: HILL_B, base: base + 3, amp: 64 * tall * climb, off: off * 0.04 + 900, lit: win(c('#aadc5e', '#cdb868', '#3f6a58'), '#eef4f4', '#f0e2e2', '#6f86b8'), shade: win(c('#70b440', '#7e8a46', '#223f48'), '#c3d3da', '#c7bccb', '#4a6290'), haze: 0.34, trees: 0.45, seed: 2 }, !!env.lite);
    hillLayer(g, W, hazeCol, { prof: HILL_C, base: base + 7, amp: 42 * tall * climb, off: off * 0.1 + 1500, lit: win(c('#b6e064', '#d0b86a', '#3a6a4c'), '#eef4f4', '#f0e2e2', '#6f86b8'), shade: win(c('#78bc3e', '#80904a', '#1f3f3c'), '#c3d3da', '#c7bccb', '#4a6290'), haze: 0.16, trees: 0.3, seed: 3 }, !!env.lite);
    hillLayer(g, W, hazeCol, { prof: HILL_D, base: base + 12, amp: 22 * tall * climb, off: off * 0.34 + 200, lit: win(c('#a8d84e', '#c4b45c', '#34624a'), '#eef4f4', '#f0e2e2', '#6f86b8'), shade: win(c('#6cac34', '#76843e', '#1b3a38'), '#c3d3da', '#c7bccb', '#4a6290'), haze: 0.05 }, !!env.lite);
    const grass = g.createLinearGradient(0, base + 10, 0, H);                          // the ground under the hills, so the road never shows through
    grass.addColorStop(0, win(c('#82c040', '#8a9a48', '#27484a'), '#e6eef0', '#e8dce0', '#5a7298')); grass.addColorStop(1, win(c('#6aac30', '#68823a', '#1d3a3a'), '#d6e2e6', '#d8ccd4', '#46608a'));
    g.fillStyle = grass; g.fillRect(0, base + 10, W, H - base);
    return;
  }
  const sn = 0.6 + 0.4 * snow;                                                          // the big peaks carry snow all year, more of it as you climb
  drawRange(g, W, hazeCol, { prof: GIANTS, base, amp: (160 + env.alt * 50) * tall, off: off * 0.015 + 700, seed: 11, rockLit: dusk('#9aa6c6', '#a88cb8'), rockShade: dusk('#6a7aa8', '#66588c'), snowLit: dusk('#ffffff', '#ffd8c2', '#8d9cdc'), snowShade: dusk('#b2c0e6', '#a496c8', '#4a5896'), haze: 0.6, snowLine: 0.44 - 0.1 * env.alt - 0.2 * w, snow: sn + (1 - sn) * w, plume: true }, t, env.lite);
  drawRange(g, W, hazeCol, { prof: HIGH, base, amp: (112 + env.alt * 52) * tall, off: off * 0.035 + 300, seed: 1, rockLit: dusk('#b49279', '#bb7f7b'), rockShade: dusk('#6f6680', '#604c72'), snowLit: dusk('#ffffff', '#ffdcc4', '#95a4e0'), snowShade: dusk('#aebde4', '#9c8cc0', '#4e5c9c'), haze: 0.42, snowLine: 0.5 - 0.14 * env.alt - 0.3 * w, snow: sn + (1 - sn) * w }, t, env.lite);
  drawRange(g, W, hazeCol, { prof: MIDR, base: base + 3, amp: (70 + env.alt * 30) * tall, off: off * 0.08, seed: 2, rockLit: win(dusk('#c4926c', '#c8806a'), '#e4ebf5', '#f0d8d4', '#7886c8'), rockShade: win(dusk('#7c5e64', '#6a4858'), '#aebbd4', '#a898b8', '#4a5896'), snowLit: dusk('#fbfcff', '#ffdcc8', '#8494d0'), snowShade: dusk('#b4c0e4', '#a494c4', '#444f8c'), haze: 0.26, snowLine: 0.74 - 0.3 * env.alt - 0.5 * w, snow: Math.min(1, 0.2 + 0.7 * snow + 0.8 * w) }, t, env.lite);
  layer(g, W, hazeCol, { prof: FOOT, base: base + 6, amp: 40 * tall, off: off * 0.18 + 900, lit: win(dusk('#dca062', '#d88a68'), '#e8eef6', '#f2dcd8', '#7a88c0'), shade: win(dusk('#a86c3e', '#8a5058'), '#b4c2da', '#aa9cbc', '#4c5a98'), haze: 0.2, snow: 0.75 * w }, env.lite);
  layer(g, W, hazeCol, { prof: NEAR, base: base + 10, amp: 26 * tall, off: off * 0.34 + 200, lit: win(dusk('#d08a48', '#c87050'), '#e4ebf3', '#eed8d4', '#7482b8'), shade: win(dusk('#98582c', '#784048'), '#aebcd2', '#a496b4', '#4a5894'), haze: 0.1, snow: 0.6 * w }, env.lite);
  layer(g, W, hazeCol, { prof: CLOSE, base: base + 14, amp: 14 * tall, off: off * 0.6 + 1400, lit: win(dusk('#b87a40', '#a85e48'), '#dfe7f0', '#e8d2cf', '#6e7cb0'), shade: win(dusk('#83502a', '#66393e'), '#a6b4cc', '#9c8eac', '#46548c'), haze: 0.04, snow: 0.4 * w }, env.lite);

  // turquoise lake band when in the lake chapter
  if (env.lake > 0.05) {
    const ly = base + 8;
    const gr = vgrad(ly - 20, ly + 40, [
      [0, mix('#6ec4c8', '#4a8898', env.tod) + '00'],
      [0.4, mix('#4eb8c0', '#3a7888', env.tod)],
      [1, mix('#2a8890', '#285868', env.tod)],
    ]);
    g.globalAlpha = 0.6 * env.lake;
    box(0, ly - 8, W, 50, gr);
    g.globalAlpha = 1;
    stroke([0, ly + 4, W, ly + 2], mix('#a8e0e4', '#88b0b8', env.tod), 1.5);
  }

  // ground fill under the hills so the road never shows through, warm near the horizon
  const ground = g.createLinearGradient(0, base + 10, 0, H);
  ground.addColorStop(0, mix('#a86c3c', '#8a5450', env.tod)); ground.addColorStop(1, mix('#c09864', '#a07068', env.tod));
  g.fillStyle = ground; g.fillRect(0, base + 10, W, H - base);
}

/** The colour of the air at the horizon: distant land and road fade toward it. */
export function hazeAt(tod: number, theme: 'himalaya' | 'xp' = 'himalaya'): string {
  const hz = theme === 'xp' ? BLISS_HAZE : HAZE;
  const f = tod * (hz.length - 1), a = Math.min(hz.length - 2, Math.floor(f));
  return mix(hz[a], hz[a + 1], f - a);
}

export function envAt(segI: number, finish: number, zone: string): Env {
  return {
    tod: Math.min(1, segI / finish),
    alt: altitude(segI),
    lake: zone === 'lake' ? smooth(finish - 200, finish - 80, segI) * 0.4 + 0.6 : zone === 'pass' ? 0 : smooth(finish - 280, finish - 160, segI) * 0.3,
  };
}
