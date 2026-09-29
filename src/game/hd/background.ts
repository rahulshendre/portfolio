// Ladakh skyline: thin alpine air, snow peaks, ochre ridges, and a turquoise lake at the end.
import { altitude } from './track-ladakh';
import { box, circle, mix, rnd, smooth, stroke, use, vgrad } from './draw';

export interface Env {
  tod: number; // 0 afternoon .. 1 dusk
  alt: number; // 0 valley .. 1 pass top
  lake: number; // 0 .. 1 near the lake chapter
}

const SKIES = [
  ['#7eb4d4', '#9bc4d8', '#c5d6ce', '#e4d9b0', '#f0cfa0', '#f5c48a'],
  ['#6a9bc4', '#8aadc4', '#b8b8b0', '#dcb898', '#eba878', '#f09860'],
  ['#4a6e9a', '#6a8098', '#9a88a0', '#d0a08c', '#e89070', '#f08858'],
];

const PEAK_DAY = ['#c8d4de', '#a8b8c4', '#8a9aa8'];
const PEAK_DUSK = ['#a8a0b8', '#8880a0', '#686888'];
const RIDGE_DAY = ['#c4a070', '#b08858', '#9a7048', '#7a5840'];
const RIDGE_DUSK = ['#a88878', '#907068', '#785858', '#604848'];

const PERIOD = 1600;

function profile(seed: number, count: number, sharp: number): Float32Array {
  const out = new Float32Array(PERIOD);
  const peaks = Array.from({ length: count }, (_, k) => ({
    c: rnd(seed + k * 3.1) * PERIOD,
    w: 40 + rnd(seed + k * 7.7) * 120,
    h: 0.4 + rnd(seed + k * 1.3) * 0.6,
  }));
  for (let x = 0; x < PERIOD; x++) {
    let h = 0.08 + 0.06 * Math.sin((x / PERIOD) * Math.PI * 2 * 2 + seed);
    for (const p of peaks) {
      const d = Math.min(Math.abs(x - p.c), PERIOD - Math.abs(x - p.c));
      const t = Math.max(0, 1 - d / (p.w / 2));
      h = Math.max(h, p.h * Math.pow(t, sharp));
    }
    out[x] = h;
  }
  return out;
}

const FAR = profile(1, 11, 1.6);
const MID = profile(2, 14, 1.35);
const NEAR = profile(3, 18, 1.2);

function skyFill(g: CanvasRenderingContext2D, W: number, H: number, HZ: number, cols: string[]) {
  const gr = g.createLinearGradient(0, 0, 0, H * (HZ + 0.08));
  cols.forEach((c, i) => gr.addColorStop(i / (cols.length - 1), c));
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
}

function ridge(g: CanvasRenderingContext2D, W: number, base: number, amp: number, prof: Float32Array, off: number, col: string, snow = 0) {
  const pts: number[] = [0, base + 80];
  for (let i = 0; i <= W; i += 2) {
    const u = Math.floor(((i + off) % PERIOD + PERIOD) % PERIOD);
    const h = Math.round(prof[u] * amp);
    pts.push(i, base - h);
  }
  pts.push(W, base + 80);
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.closePath();
  g.fill();
  if (snow > 0.05) {
    g.fillStyle = mix('#f4f6f8', '#e8d8d0', 1 - snow);
    g.beginPath();
    let started = false;
    for (let i = 0; i <= W; i += 3) {
      const u = Math.floor(((i + off) % PERIOD + PERIOD) % PERIOD);
      const h = Math.round(prof[u] * amp);
      if (h > amp * 0.55) {
        const y = base - h;
        if (!started) { g.moveTo(i, y); started = true; }
        g.lineTo(i, y + h * 0.18);
      } else if (started) {
        g.closePath();
        g.fill();
        g.beginPath();
        started = false;
      }
    }
    if (started) { g.closePath(); g.fill(); }
  }
}

export function drawBackground(g: CanvasRenderingContext2D, W: number, H: number, HZ: number, off: number, t: number, env: Env) {
  use(g);
  const f = env.tod * (SKIES.length - 1);
  const a = Math.min(SKIES.length - 2, Math.floor(f));
  skyFill(g, W, H, HZ, SKIES[a]);
  if (f - a > 0.01) {
    g.globalAlpha = f - a;
    skyFill(g, W, H, HZ, SKIES[a + 1]);
    g.globalAlpha = 1;
  }

  // thin cold sun
  const sunX = W * 0.78, sunY = H * HZ - 40 + env.tod * 36;
  circle(sunX, sunY, 22 + env.tod * 8, mix('#ffe8b8', '#f6a878', env.tod));
  circle(sunX, sunY, 14, mix('#fff8e8', '#ffd4a0', env.tod));

  // wispy high cloud
  for (const [cx0, cy0, s] of [[60, 0.12, 1.2], [220, 0.08, 1.6], [400, 0.15, 1], [580, 0.1, 1.3]] as const) {
    const span = W + 160;
    const cx = (((cx0 - off * 0.04 - t * 1.5) % span) + span) % span - 80;
    const cy = cy0 * H;
    g.globalAlpha = 0.45 + env.tod * 0.15;
    circle(cx, cy, 5 * s, mix('#f0f4f8', '#f0c8b0', env.tod));
    circle(cx + 14 * s, cy - 2 * s, 7 * s, mix('#f0f4f8', '#f0c8b0', env.tod));
    circle(cx + 28 * s, cy, 5 * s, mix('#e8ecf0', '#e0b8a8', env.tod));
    g.globalAlpha = 1;
  }

  const base = Math.round(H * (HZ + 0.02));
  const tall = Math.max(1, H / 400);
  const snow = smooth(0.2, 0.85, env.alt);

  ridge(g, W, base, (72 + env.alt * 40) * tall, FAR, off * 0.04, mix(PEAK_DAY[0], PEAK_DUSK[0], env.tod), snow * 0.9);
  ridge(g, W, base + 4, (56 + env.alt * 28) * tall, MID, off * 0.12, mix(PEAK_DAY[1], PEAK_DUSK[1], env.tod), snow * 0.7);
  ridge(g, W, base + 8, (38 + env.alt * 18) * tall, NEAR, off * 0.28, mix(RIDGE_DAY[1], RIDGE_DUSK[1], env.tod), snow * 0.35);
  ridge(g, W, base + 12, (22 + env.alt * 10) * tall, NEAR, off * 0.5 + 200, mix(RIDGE_DAY[2], RIDGE_DUSK[2], env.tod), 0);

  // turquoise lake band when in the lake chapter
  if (env.lake > 0.05) {
    const ly = base + 6;
    const gr = vgrad(ly - 20, ly + 40, [
      [0, mix('#6ec4c8', '#4a8898', env.tod) + '00'],
      [0.4, mix('#4eb8c0', '#3a7888', env.tod)],
      [1, mix('#2a8890', '#285868', env.tod)],
    ]);
    g.globalAlpha = 0.55 * env.lake;
    box(0, ly - 8, W, 50, gr);
    g.globalAlpha = 1;
    // far shore highlight
    stroke([0, ly + 4, W, ly + 2], mix('#a8e0e4', '#88b0b8', env.tod), 1.5);
  }

  // ground fill under hills so road never shows through
  box(0, base, W, H - base + 4, mix(RIDGE_DAY[3], RIDGE_DUSK[3], env.tod));
}

export function envAt(segI: number, finish: number, zone: string): Env {
  return {
    tod: Math.min(1, segI / finish),
    alt: altitude(segI),
    lake: zone === 'lake' ? smooth(finish - 200, finish - 80, segI) * 0.4 + 0.6 : zone === 'pass' ? 0 : smooth(finish - 280, finish - 160, segI) * 0.3,
  };
}
