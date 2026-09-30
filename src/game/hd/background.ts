// Ladakh skyline: a big low sun, soft clouds, and five layers of mountains that get hazier and paler with distance.
// Every ridge has a sunlit face and a shaded face (the sun is on the right), so the layers read as solid land, not cut paper.
import { altitude } from './track-ladakh';
import { box, circle, mix, oval, rnd, smooth, stroke, use, vgrad } from './draw';

export interface Env {
  tod: number; // 0 afternoon .. 1 dusk
  alt: number; // 0 valley .. 1 pass top
  lake: number; // 0 .. 1 near the lake chapter
  lite?: boolean; // slow device: skip the priciest shading
  night?: number; // 0 day .. 1 full night: a dark navy sky, a moon and cold mountains
}

const NIGHT_SKY = ['#040816', '#08113a', '#101c50', '#1c2c66', '#2c3c7c', '#425088'];
const NIGHT_HAZE = '#232b58';

// Sky stops from the zenith down to the horizon, blended between afternoon, late light and dusk.
const SKIES = [
  ['#3f86c9', '#5b9bd0', '#8ab8d6', '#bcd2d6', '#e6dcbc', '#f6d9a4'],
  ['#3a75b8', '#5e8fc0', '#a4a8c0', '#e0b8a0', '#f2b080', '#f8c088'],
  ['#2c4a86', '#565c98', '#a06e98', '#e0806c', '#f2985c', '#f8b070'],
];
const HAZE = ['#f0dcb4', '#f0bc98', '#f0a878']; // the colour distant land fades to

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

const FAR = ridged(1, 0.95, 1.7);     // snow range
const MID = ridged(2, 0.8, 1.45);     // violet range
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

export function drawBackground(g: CanvasRenderingContext2D, W: number, H: number, HZ: number, off: number, t: number, env: Env) {
  use(g);
  const f = env.tod * (SKIES.length - 1);
  const a = Math.min(SKIES.length - 2, Math.floor(f));
  skyFill(g, W, H, HZ, SKIES[a]);
  if (f - a > 0.01) { g.globalAlpha = f - a; skyFill(g, W, H, HZ, SKIES[a + 1]); g.globalAlpha = 1; }
  const night = env.night ?? 0;
  if (night > 0.01) { g.globalAlpha = night; skyFill(g, W, H, HZ, NIGHT_SKY); g.globalAlpha = 1; }
  const hazeCol = night > 0 ? mix(hazeAt(env.tod), NIGHT_HAZE, night) : hazeAt(env.tod);

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
    cloud(g, cx, cy0 * H, s * (H / 480), env.tod, (0.5 + env.tod * 0.18) * (1 - night * 0.72));
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
  const dusk = (day: string, dk: string) => {                                          // day colours slide to dusk ones, then to cold blue at night (lit faces stay lighter than shaded ones)
    const c = mix(day, dk, env.tod);
    return night > 0 ? mix(c, lum(c) > 130 ? '#39457f' : '#141c42', night * 0.86) : c;
  };
  layer(g, W, hazeCol, { prof: FAR, base, amp: (86 + env.alt * 50) * tall, off: off * 0.03 + 300, lit: dusk('#c9d6f0', '#c8b0d8'), shade: dusk('#7f94c8', '#7e6ea8'), haze: 0.52, snow: snow * 0.95 }, env.lite);
  layer(g, W, hazeCol, { prof: MID, base: base + 3, amp: (60 + env.alt * 28) * tall, off: off * 0.08, lit: dusk('#a6a4cc', '#b088b0'), shade: dusk('#6a6aa4', '#6a5088'), haze: 0.36, snow: snow * 0.55 }, env.lite);
  layer(g, W, hazeCol, { prof: FOOT, base: base + 6, amp: 40 * tall, off: off * 0.18 + 900, lit: dusk('#dca062', '#d88a68'), shade: dusk('#a86c3e', '#8a5058'), haze: 0.2, snow: 0 }, env.lite);
  layer(g, W, hazeCol, { prof: NEAR, base: base + 10, amp: 26 * tall, off: off * 0.34 + 200, lit: dusk('#d08a48', '#c87050'), shade: dusk('#98582c', '#784048'), haze: 0.1, snow: 0 }, env.lite);
  layer(g, W, hazeCol, { prof: CLOSE, base: base + 14, amp: 14 * tall, off: off * 0.6 + 1400, lit: dusk('#b87a40', '#a85e48'), shade: dusk('#83502a', '#66393e'), haze: 0.04, snow: 0 }, env.lite);

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
export function hazeAt(tod: number): string {
  const f = tod * (HAZE.length - 1), a = Math.min(HAZE.length - 2, Math.floor(f));
  return mix(HAZE[a], HAZE[a + 1], f - a);
}

export function envAt(segI: number, finish: number, zone: string): Env {
  return {
    tod: Math.min(1, segI / finish),
    alt: altitude(segI),
    lake: zone === 'lake' ? smooth(finish - 200, finish - 80, segI) * 0.4 + 0.6 : zone === 'pass' ? 0 : smooth(finish - 280, finish - 160, segI) * 0.3,
  };
}
