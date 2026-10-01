// The Himalaya behind the road. Each range is a row of real peaks: pyramids with a sunlit face (the sun is on the right) and a shaded face split by
// a ridge line, gullies and spurs running down the flanks, jagged snow fields with tongues reaching down the gullies, a thin rim of light along the
// crest, and on the tallest summit a plume of wind-blown snow. Colours fade toward the haze with distance, so the ranges stack into depth.
import { mix, rnd } from './draw';

const PERIOD = 2400;

/**
 * A repeating skyline made of a few big peaks and a scatter of small ones, each a sharp pyramid with concave flanks, roughened by ridged noise
 * that is strongest on the slopes so the summits stay sharp. Heights run 0 to 1.
 */
export function massif(seed: number, big: number, small: number): Float32Array {
  const peaks: [number, number, number][] = [];                                 // centre, half-width at the base, height
  for (let k = 0; k < big; k++) peaks.push([((k + 0.15 + rnd(seed + k * 3.1) * 0.7) / big) * PERIOD, 170 + rnd(seed * 1.7 + k) * 170, 0.62 + rnd(seed * 2.3 + k * 7) * 0.38]);
  for (let k = 0; k < small; k++) peaks.push([((k + rnd(seed * 5.1 + k * 1.3)) / small) * PERIOD, 70 + rnd(seed * 3.3 + k * 9) * 110, 0.18 + rnd(seed * 4.9 + k * 2) * 0.32]);
  const out = new Float32Array(PERIOD);
  let hi = 0;
  for (let x = 0; x < PERIOD; x++) {
    let h = 0.1 + 0.04 * Math.sin((x * Math.PI * 2 * 5) / PERIOD + seed);        // the range never drops to nothing between peaks
    for (const [c, w, ph] of peaks) { let d = Math.abs(x - c); d = Math.min(d, PERIOD - d); if (d < w) h = Math.max(h, ph * Math.pow(1 - d / w, 1.45)); }
    let n = 0, a = 1, tot = 0;
    for (const f of [9, 21, 47, 103]) { n += a * (1 - Math.abs(Math.sin((f * x * Math.PI * 2) / PERIOD + rnd(seed + f) * 6.28))); tot += a; a *= 0.55; }
    out[x] = Math.max(0, h + (n / tot - 0.5) * 0.12 * Math.min(1, h * 2.2 + 0.15));
    hi = Math.max(hi, out[x]);
  }
  for (let x = 0; x < PERIOD; x++) out[x] /= hi;
  return out;
}

export interface Range {
  prof: Float32Array; base: number; amp: number; off: number; seed: number;
  rockLit: string; rockShade: string; snowLit: string; snowShade: string;
  haze: number;
  /** Where the snow starts, as a share of the range's height. Above it the peaks are white. */
  snowLine: number;
  /** 0 bare rock .. 1 snow right down to the line. */
  snow: number;
  /** Draw the plume of wind-blown snow off the tallest summit. */
  plume?: boolean;
}

export function drawRange(g: CanvasRenderingContext2D, W: number, hazeCol: string, R: Range, t: number, lite = false) {
  const n = Math.ceil(W / 2) + 12, ys = new Float32Array(n), X = (i: number) => (i - 6) * 2;
  for (let i = 0; i < n; i++) ys[i] = R.base - R.prof[(((Math.floor(X(i) + R.off)) % PERIOD) + PERIOD) % PERIOD] * R.amp;
  const yb = R.base + 6;
  const top = (c: string, k: number) => mix(c, hazeCol, Math.min(0.95, R.haze * k));

  // 1. the body under everything, so no gap can show between the facets
  const body = g.createLinearGradient(0, R.base - R.amp, 0, yb);
  body.addColorStop(0, top(R.rockShade, 0.6)); body.addColorStop(1, top(R.rockShade, 1.5));
  g.fillStyle = body;
  g.beginPath(); g.moveTo(X(0), yb);
  for (let i = 0; i < n; i++) g.lineTo(X(i), ys[i]);
  g.lineTo(X(n - 1), yb); g.closePath(); g.fill();

  // 2. the peaks: local highs of the crest, at least 20px apart and well clear of the ground
  const pk: number[] = [];
  for (let i = 8; i < n - 8; i++) {
    let high = true;
    for (let k = 1; k <= 7 && high; k++) if (ys[i] > ys[i - k] || ys[i] > ys[i + k]) high = false;
    if (!high || R.base - ys[i] < R.amp * 0.16) continue;
    if (pk.length && i - pk[pk.length - 1] < 10) { if (ys[i] < ys[pk[pk.length - 1]]) pk[pk.length - 1] = i; } else pk.push(i);
  }
  let tallest = -1;
  pk.forEach((p, j) => { if (tallest < 0 || ys[p] < ys[pk[tallest]]) tallest = j; });

  const lowest = (from: number, to: number) => { let m = from; for (let i = from; i <= to; i++) if (ys[i] > ys[m]) m = i; return m; };
  pk.forEach((p, j) => {
    const vl = lowest(j ? pk[j - 1] : Math.max(0, p - 120), p), vr = lowest(p, j < pk.length - 1 ? pk[j + 1] : Math.min(n - 1, p + 120));
    const xl = X(vl), xp = X(p), xr = X(vr), yp = ys[p], h = R.base - yp;
    const xf = xp + (rnd(p * 0.37 + R.seed) - 0.5) * 0.6 * Math.min(xp - xl, xr - xp);   // where the ridge line from the summit meets the foot
    // shaded face (left) and lit face (right), each fading toward the haze at the foot
    const shade = g.createLinearGradient(0, yp, 0, yb), lit = g.createLinearGradient(0, yp, 0, yb);
    shade.addColorStop(0, top(mix(R.rockShade, '#14143c', 0.3), 0.5)); shade.addColorStop(1, top(mix(R.rockShade, '#14143c', 0.1), 1.5));
    lit.addColorStop(0, top(mix(R.rockLit, '#fff2d0', 0.35), 0.4)); lit.addColorStop(1, top(R.rockLit, 1.4));
    g.fillStyle = shade;
    g.beginPath(); g.moveTo(xl, ys[vl]); for (let i = vl; i <= p; i++) g.lineTo(X(i), ys[i]); g.lineTo(xf, yb); g.lineTo(xl, yb); g.closePath(); g.fill();
    g.fillStyle = lit;
    g.beginPath(); g.moveTo(xp, yp); for (let i = p; i <= vr; i++) g.lineTo(X(i), ys[i]); g.lineTo(xr, yb); g.lineTo(xf, yb); g.closePath(); g.fill();

    // gullies and spurs: thin wedges running down each flank from points along the crest, dark in the gullies and bright on the spurs
    if (!lite) {
      for (const side of [-1, 1] as const) {
        const span = side < 0 ? p - vl : vr - p;
        for (let k = 0; k < 4; k++) {
          const j = p + side * Math.floor(span * (0.14 + k * 0.2 + rnd(p + k * 3.3 + R.seed) * 0.08)), cx = X(j), cy = ys[j];
          const drift = (xf - cx) * (0.25 + rnd(k + p) * 0.4), wf = 3 + h * 0.03 + rnd(k * 2.7 + p) * 4, endY = cy + (yb - cy) * (0.55 + rnd(p * 1.3 + k) * 0.35);
          g.globalAlpha = (side < 0 ? 0.42 : 0.3) * (1 - R.haze * 0.5);
          g.fillStyle = side < 0 ? '#10103a' : '#3a1a20';
          g.beginPath(); g.moveTo(cx - 1.2, cy); g.lineTo(cx + 1.2, cy); g.lineTo(cx + drift + wf, endY); g.lineTo(cx + drift - wf, endY); g.closePath(); g.fill();
          if (side > 0) {                                                                // the sunlit spur beside each gully
            g.globalAlpha = 0.2 * (1 - R.haze * 0.5); g.fillStyle = '#fff0d0';
            g.beginPath(); g.moveTo(cx + 1.5, cy); g.lineTo(cx + 4.5, cy); g.lineTo(cx + drift + wf + 9, endY); g.lineTo(cx + drift + wf + 2, endY); g.closePath(); g.fill();
          }
        }
      }
      g.globalAlpha = 1;
    }

    // snow: a white cap above the snow line, its lower edge ragged, with tongues reaching down the gullies
    const snowY = R.base - R.amp * R.snowLine;
    if (R.snow > 0.05 && yp < snowY) {
      const reach = Math.min(1, (snowY - yp) / (R.amp * 0.25) + 0.25) * R.snow;
      const cap = (side: -1 | 1) => {
        let e = p; while (e + side > 0 && e + side < n - 1 && ys[e + side] < snowY) e += side;
        const pts: number[] = [xp, yp];
        for (let i = p; i !== e + side; i += side) pts.push(X(i), ys[i]);
        const endX = X(e), endY = ys[e];
        // down the ridge line to the snow line, then a ragged edge back out to the end of the cap
        const ry = snowY + h * 0.1 * reach, rx = xp + (xf - xp) * ((ry - yp) / (yb - yp));
        pts.push(rx, ry);
        for (let m = 1; m <= 6; m++) {
          const u = m / 7, tongue = h * (0.03 + 0.14 * rnd(p * 2.1 + m * 5.7 + side * 9 + R.seed)) * reach;
          pts.push(rx + (endX - rx) * u, snowY + tongue * (m % 2 ? 1.25 : 0.25) + (endY - snowY) * u * 0.6);
        }
        g.beginPath(); g.moveTo(pts[0], pts[1]); for (let q = 2; q < pts.length; q += 2) g.lineTo(pts[q], pts[q + 1]); g.closePath(); g.fill();
      };
      const capShade = g.createLinearGradient(0, yp, 0, snowY + h * 0.2), capLit = g.createLinearGradient(0, yp, 0, snowY + h * 0.2);
      capShade.addColorStop(0, top(R.snowShade, 0.5)); capShade.addColorStop(1, top(mix(R.snowShade, R.rockShade, 0.5), 0.9));
      capLit.addColorStop(0, top(R.snowLit, 0.35)); capLit.addColorStop(1, top(mix(R.snowLit, R.rockLit, 0.35), 0.8));
      g.fillStyle = capShade; cap(-1);
      g.fillStyle = capLit; cap(1);
    }
    // a rim of light along the sunlit crest
    if (!lite) {
      g.globalAlpha = 0.55 * (1 - R.haze * 0.6); g.strokeStyle = mix(R.snowLit, '#ffffff', 0.4); g.lineWidth = 1.2; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(xp, yp); for (let i = p; i <= Math.min(vr, p + 26); i++) g.lineTo(X(i), ys[i]); g.stroke(); g.globalAlpha = 1;
    }
    // the plume: snow the wind tears off the highest summit, streaming away from the sun in a soft curl
    if (R.plume && !lite && j === tallest && R.snow > 0.3) {
      const sway = Math.sin(t * 0.35 + p) * 5;
      g.save();
      for (let k = 0; k < 5; k++) {
        const len = 50 + k * 26 + h * 0.3, rise = 3 + k * 7, wd = 4 + k * 4, a = (0.11 - k * 0.018) * R.snow * (1 - R.haze * 0.4);
        const gr = g.createLinearGradient(xp, yp, xp - len, yp - rise);
        gr.addColorStop(0, `rgba(250,246,240,${a})`); gr.addColorStop(1, 'rgba(250,246,240,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(xp + 1, yp + 2);
        g.quadraticCurveTo(xp - len * 0.5, yp - rise * 0.4 + sway - wd, xp - len, yp - rise + sway * 1.4 - wd * 0.6);
        g.quadraticCurveTo(xp - len * 0.55, yp - rise * 0.2 + sway + wd * 1.6, xp + 2, yp + 9 + k * 2); g.closePath(); g.fill();
      }
      g.restore();
    }
  });
}
