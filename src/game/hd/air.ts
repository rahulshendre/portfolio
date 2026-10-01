// Things in the air between you and the road: snow rushing past on the pass, gold dust in the valley, fireflies of dusk light at the lake, and the bike's own headlight at the end of the day.
import { glow, smooth } from './draw';
import { altitude, LAKE_FROM } from './track-ladakh';

const hash = (n: number) => Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;

export type Sky = 'clear' | 'rain' | 'fog' | 'snow';
export const SKIES: Sky[] = ['clear', 'rain', 'fog', 'snow'];

/** Specks that stream out of the vanishing point toward the camera, faster as you go: snow up high, dust and warm motes lower down. */
export function drawAir(g: CanvasRenderingContext2D, W: number, H: number, HZ: number, t: number, speed: number, segI: number, tod: number, sky: Sky = 'clear', land: 'himalaya' | 'xp' = 'himalaya') {
  const snowy = sky === 'snow' || (land === 'himalaya' && altitude(segI) > 0.45), dusk = tod > 0.7;
  const n = sky === 'snow' ? 130 : snowy ? 70 : 34;
  const vx = W / 2, vy = H * HZ, reach = Math.hypot(W, H) * 0.62;
  g.save();
  for (let i = 0; i < n; i++) {
    const rate = 0.16 + speed * 0.55 + hash(i + 3) * 0.1;
    const p = (t * rate + hash(i)) % 1, e = p * p;                                  // ease so specks linger far away then whip past
    const ang = hash(i * 1.7 + 5) * Math.PI * 2, r = e * reach;
    const x = vx + Math.cos(ang) * r * 1.25, y = vy + Math.sin(ang) * r * 0.85 + e * H * 0.16 + Math.sin(t + i) * 3 * p;   // out from the horizon in every direction, settling downward
    if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;
    const sz = 0.7 + e * (snowy ? 4.2 : 2.6);
    g.globalAlpha = Math.min(1, p * 3) * (1 - p * 0.3) * (snowy ? 0.8 : 0.4);
    g.fillStyle = snowy ? '#ffffff' : land === 'xp' ? (dusk ? '#ffe6b0' : '#f4f8c8') : dusk ? '#ffd9a0' : '#f2dcae';   // dust in the dry country, pollen over the green hills
    g.beginPath(); g.arc(x, y, sz, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}

/** Rain: streaks that slant back with your speed, and a few drops crawling down the lens. */
export function drawRain(g: CanvasRenderingContext2D, W: number, H: number, t: number, speed: number) {
  const slant = 0.15 + speed * 0.55, u = H / 600;
  g.save(); g.lineCap = 'round';
  for (const [n, alpha, width, len] of [[110, 0.3, 1, 26], [36, 0.42, 1.8, 46]] as const) {
    g.strokeStyle = `rgba(220,230,244,${alpha})`; g.lineWidth = width * Math.max(1, u); g.beginPath();
    for (let i = 0; i < n; i++) {
      const p = (t * (1.7 + hash(i + 9) * 0.9) + hash(i + 3)) % 1, x = hash(i * 1.3 + len) * (W + 240) - 60 + p * slant * 120, y = p * (H + 140) - 70, l = len * u * (0.5 + hash(i + 5)) * (0.7 + speed);
      g.moveTo(x, y); g.lineTo(x - slant * l, y + l);
    }
    g.stroke();
  }
  for (let i = 0; i < 7; i++) {                                                          // droplets on the lens, each taking a slow run down
    const life = (t * 0.16 + hash(i * 4.1)) % 1, x = hash(i * 7.3 + 1) * W, y = H * (0.08 + life * 0.7), r = (5 + hash(i) * 8) * u;
    const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.6, 'rgba(180,200,225,0.14)'); gr.addColorStop(1, 'rgba(60,70,90,0.28)');
    g.globalAlpha = Math.sin(life * Math.PI) * 0.9; g.fillStyle = gr;
    g.beginPath(); g.ellipse(x, y, r * 0.8, r * 1.15, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(200,215,235,0.18)'; g.lineWidth = 1.4 * u; g.beginPath(); g.moveTo(x, y - r * 1.1); g.lineTo(x, y - r * (1.1 + life * 3)); g.stroke();
  }
  g.restore();
}

/** Grey the whole picture for the weather: cool and dark for rain, milky for fog, pale for snow. */
/** Night: a cool multiply over the whole picture (`k` is 0 to 1), so everything the world drew turns deep blue and only lights stay bright. */
export function drawNight(g: CanvasRenderingContext2D, W: number, H: number, k: number) {
  if (k < 0.01) return;
  g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = k;
  g.fillStyle = '#4b5a9c'; g.fillRect(0, 0, W, H);
  g.restore();
  g.save(); g.globalAlpha = 0.16 * k; g.fillStyle = '#020616'; g.fillRect(0, 0, W, H); g.restore();
}

/** Draw the lit things of the night (windows, lamps, signs) as warm additive glows on top of the darkness. */
export function drawLights(g: CanvasRenderingContext2D, lights: readonly { x: number; y: number; r: number; a: number; color: string }[]) {
  if (!lights.length) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const l of lights) {
    if (l.x < -l.r || l.x > g.canvas.width + l.r) continue;
    const gr = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
    gr.addColorStop(0, l.color + Math.round(l.a * 255).toString(16).padStart(2, '0')); gr.addColorStop(1, l.color + '00');
    g.fillStyle = gr; g.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
  }
  g.restore();
}

export function drawSkyTint(g: CanvasRenderingContext2D, W: number, H: number, HZ: number, sky: Sky) {
  if (sky === 'clear') return;
  const top = H * HZ;
  if (sky === 'rain') {
    g.fillStyle = 'rgba(44,56,82,0.4)'; g.fillRect(0, 0, W, H);
    const gr = g.createLinearGradient(0, 0, 0, top); gr.addColorStop(0, 'rgba(30,38,60,0.35)'); gr.addColorStop(1, 'rgba(30,38,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, top);
  } else if (sky === 'fog') {
    g.fillStyle = 'rgba(232,230,226,0.44)'; g.fillRect(0, 0, W, H);
    const gr = g.createLinearGradient(0, top - H * 0.25, 0, top + H * 0.3); gr.addColorStop(0, 'rgba(236,234,230,0)'); gr.addColorStop(0.5, 'rgba(236,234,230,0.55)'); gr.addColorStop(1, 'rgba(236,234,230,0)'); g.fillStyle = gr; g.fillRect(0, top - H * 0.25, W, H * 0.55);
  } else {
    g.fillStyle = 'rgba(226,234,246,0.14)'; g.fillRect(0, 0, W, H);
  }
}

export interface BeamOpts { wet?: number; mist?: number; t?: number; pitch?: number; dark?: number }

/**
 * Your headlight, thrown down the road. A pool of light lies on the tarmac in perspective (nothing at the far end, a hot spot a little way ahead of
 * the wheel, easing off under the bike), lifts the road's own texture rather than tinting it, and swings with the lean. Through the air the beam
 * shows as a soft column, stronger in rain, mist and dust, with glints in it and a long reflection down a wet road. Braking dips the nose and
 * shortens the throw.
 */
export function drawHeadlight(g: CanvasRenderingContext2D, W: number, H: number, HZ: number, lean: number, strength: number, o: BeamOpts = {}) {
  const dark = o.dark ?? 1, a = strength * (0.28 + 0.72 * dark);          // a lamp barely shows against a bright sky and comes into its own as the light goes
  const wet = o.wet ?? 0, mist = o.mist ?? 0, t = o.t ?? 0, pitch = Math.max(-1, Math.min(1, o.pitch ?? 0));
  const hy = H * HZ, span = H * 0.93 - hy, lamp = H * 0.24;
  const yAt = (u: number) => hy + span * u;                                          // u runs from 1 at the bike toward 0 at the horizon
  const xc = (u: number) => W / 2 + lean * W * (0.14 * (1 - u) + 0.03);             // the beam is aimed where the bike points, so it swings out toward the far end
  const hw = (u: number) => W * (0.115 * u + 0.02);                                  // half-width of the lit ground at that depth
  const uNear = 0.97, uFar = 0.12 + pitch * 0.05;
  const sm = (e0: number, e1: number, x: number) => { const k = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return k * k * (3 - 2 * k); };
  const prof = (u: number) => sm(uFar, 0.42, u) * (1 - 0.35 * sm(0.62, 0.84, u)) * (1 - sm(0.86, 0.97, u)) * 1.15;
  /** The pool: a chain of soft ellipses lying on the road from just ahead of the wheel out to the far end, each in perspective, so the light is one smooth teardrop with no seams. */
  const slices = (rgb: string, k: number) => {
    for (let j = 0; j < 11; j++) {
      const u = 0.86 - j * 0.07, I = Math.min(1, prof(u)) * k;
      if (I < 0.01) continue;
      const rx = hw(u) * 1.45, ry = span * (0.15 * u + 0.025);
      g.save(); g.translate(xc(u), yAt(u)); g.scale(rx, ry);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
      gr.addColorStop(0, `rgba(${rgb},${I * 0.55})`); gr.addColorStop(0.45, `rgba(${rgb},${I * 0.2})`); gr.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill(); g.restore();
    }
  };
  g.save();
  // 1. the pool as a soft-light pass, so paint, cracks and stones on the tarmac come up brighter instead of being washed flat
  g.globalCompositeOperation = 'soft-light';
  g.globalAlpha = Math.min(1, a);
  slices('255,240,205', 1); slices('255,240,205', 1); slices('255,240,205', 0.8);
  // 2. and the light itself, added on top: warm, brightest in the middle of the pool
  g.globalCompositeOperation = 'lighter';
  g.globalAlpha = a * 0.7;
  slices('255,214,150', 0.85);
  g.globalAlpha = 1;
  glow(xc(0.6), yAt(0.6), H * 0.13 * (0.8 + 0.3 * wet), '#ffe3b0', 0.16 * a);                                                     // the hot spot
  // 3. the beam through the air: a chain of soft slices from the lamp to the far end of the pool
  const haze = 0.3 + 0.7 * Math.max(wet, mist);
  for (let i = 0; i < 14; i++) {
    const u = uFar + ((uNear - uFar) * i) / 13, l = lamp * u, k = Math.sin((i / 13) * Math.PI * 0.85 + 0.25), rx = Math.max(6, hw(u) * 0.85), cy = yAt(u) - l * 0.5;
    const gr = g.createRadialGradient(xc(u), cy, 0, xc(u), cy, rx);
    gr.addColorStop(0, `rgba(255,232,190,${0.13 * haze * a * k})`); gr.addColorStop(1, 'rgba(255,232,190,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(xc(u), cy, rx, Math.max(4, l * 0.6), 0, 0, Math.PI * 2); g.fill();
  }
  // 4. things floating in it: dust and mist, and in rain, streaks of lit drops falling through the beam
  const n = wet > 0 ? 16 : mist > 0 ? 12 : a > 0.6 ? 6 : 0;
  for (let i = 0; i < n; i++) {
    const p = (t * (wet ? 1.5 : 0.35) + i * 0.6180339) % 1, r1 = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1, r2 = Math.abs(Math.sin(i * 78.233) * 43758.5453) % 1;
    const u = uFar + (uNear - uFar) * (wet ? 1 - p : p), x = xc(u) + (r1 * 2 - 1) * hw(u) * 0.75, y = yAt(u) - lamp * u * r2;
    g.globalAlpha = Math.min(1, a * (wet ? 0.5 : 0.35) * Math.sin(p * Math.PI));
    if (wet) { g.strokeStyle = '#fff1d0'; g.lineWidth = Math.max(0.8, u * 2.2); g.beginPath(); g.moveTo(x, y); g.lineTo(x - u * 3, y + u * 22); g.stroke(); }
    else { g.fillStyle = '#ffeccb'; g.beginPath(); g.arc(x, y, Math.max(0.7, u * 2.2), 0, Math.PI * 2); g.fill(); }
  }
  g.globalAlpha = 1;
  // 5. a wet road throws the lamp back: a long bright streak running toward you
  if (wet > 0) {
    const sx = xc(0.5) + Math.sin(t * 2.3) * W * 0.003, cy = (yAt(0.2) + yAt(0.9)) / 2;
    g.save(); g.translate(sx, cy); g.scale(W * (0.012 + 0.014 * a), (yAt(0.9) - yAt(0.2)) / 2);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    gr.addColorStop(0, `rgba(255,236,200,${0.34 * a * wet})`); gr.addColorStop(0.5, `rgba(255,236,200,${0.12 * a * wet})`); gr.addColorStop(1, 'rgba(255,236,200,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill(); g.restore();
  }
  g.restore();
}

/** Slow cloud shadows crossing the ground, and a warm sheen on the tarmac toward the sun as evening comes. Drawn over the world, under the bike. */
export function drawGround(g: CanvasRenderingContext2D, W: number, H: number, HZ: number, t: number, speed: number, tod: number, segI: number, wet = 0, dim = 0, land: 'himalaya' | 'xp' = 'himalaya') {
  const top = H * HZ, alt = land === 'xp' ? 0 : altitude(segI), lit = 1 - 0.8 * dim;                       // pale mist and snow must not glow at night
  const white = land === 'xp' ? 0 : smooth(815, 850, segI) * (1 - smooth(880, 912, segI));                    // a snow squall near the top of the climb, thinning as you crest
  if (white > 0.01) {
    g.globalAlpha = 0.3 * white * lit; g.fillStyle = '#eef1f5'; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    const gr = g.createLinearGradient(0, top - H * 0.1, 0, top + (H - top) * 0.5); gr.addColorStop(0, 'rgba(240,243,247,0)'); gr.addColorStop(0.5, `rgba(240,243,247,${0.55 * white * lit})`); gr.addColorStop(1, 'rgba(240,243,247,0)');
    g.fillStyle = gr; g.fillRect(0, top - H * 0.1, W, (H - top) * 0.6 + H * 0.1);
  }
  if (alt > 0.4) {                                                                     // low cloud sliding through the pass
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.02 + i / 3) % 1, y = top + (H - top) * (0.03 + 0.4 * p * p), h = (H - top) * (0.05 + 0.2 * p * p), a = 0.3 * (alt - 0.3) * Math.sin(p * Math.PI);
      const gr = g.createLinearGradient(0, y - h, 0, y + h); gr.addColorStop(0, 'rgba(244,240,236,0)'); gr.addColorStop(0.5, `rgba(244,240,236,${a * lit})`); gr.addColorStop(1, 'rgba(244,240,236,0)');
      g.fillStyle = gr; g.fillRect(0, y - h, W, h * 2);
    }
  }
  g.save();
  g.beginPath(); g.rect(0, top, W, H - top); g.clip();
  for (let i = 0; i < 4; i++) {
    const p = (t * (0.012 + speed * 0.03) + i / 4) % 1, e = p * p;                    // they drift toward you and grow
    const x = W * (0.15 + 0.25 * i + 0.1 * Math.sin(t * 0.05 + i * 2)), y = top + (H - top) * e * 1.2, rx = W * (0.05 + e * 0.5), ry = (H - top) * (0.02 + e * 0.16);
    g.globalAlpha = 0.09 * Math.sin(p * Math.PI);
    g.fillStyle = '#1c1420'; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill();
  }
  if (segI >= LAKE_FROM - 30) {                                                        // mist lying on the water, thickest at the far shore
    const a = smooth(LAKE_FROM - 30, LAKE_FROM + 20, segI) * (0.16 + tod * 0.12);
    const gr = g.createLinearGradient(0, top - H * 0.02, 0, top + (H - top) * 0.22); gr.addColorStop(0, 'rgba(255,236,214,0)'); gr.addColorStop(0.35, `rgba(255,236,214,${a * lit})`); gr.addColorStop(1, 'rgba(255,236,214,0)');
    g.fillStyle = gr; g.fillRect(W * 0.5, top - H * 0.02, W * 0.5, (H - top) * 0.24 + H * 0.02);
  }
  if (wet > 0) {                                                                       // wet tarmac mirrors the sky: a pale sheen, brightest toward the horizon
    g.globalCompositeOperation = 'lighter';
    const gr = g.createLinearGradient(0, top, 0, H); gr.addColorStop(0, `rgba(170,190,220,${0.2 * wet})`); gr.addColorStop(1, `rgba(170,190,220,${0.04 * wet})`);
    g.fillStyle = gr; g.fillRect(0, top, W, H - top); g.globalCompositeOperation = 'source-over';
  }
  if (tod > 0.25 && wet < 0.5) {                                                       // low sun on the road: a soft bright streak running toward the horizon
    g.globalCompositeOperation = 'lighter';
    const a = Math.min(1, (tod - 0.25) / 0.5) * 0.16, x = W * 0.66;
    const gr = g.createLinearGradient(0, top, 0, H); gr.addColorStop(0, `rgba(255,190,120,${a})`); gr.addColorStop(1, 'rgba(255,190,120,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x - W * 0.01, top); g.lineTo(x + W * 0.01, top); g.lineTo(x + W * 0.32, H); g.lineTo(x - W * 0.22, H); g.closePath(); g.fill();
  }
  g.restore();
}

/** Soft lens flare: a few pale discs strung along the line from the sun through the middle of the frame, brightest when the sun is high in view. */
export function drawFlare(g: CanvasRenderingContext2D, W: number, H: number, HZ: number, tod: number) {
  const sx = W * 0.74, sy = H * HZ - H * (0.26 - 0.15 * tod), cx = W / 2, cy = H * 0.5, dx = cx - sx, dy = cy - sy;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const [t, r, a, col] of [[0.35, 0.035, 0.07, '#ffd9a0'], [0.62, 0.06, 0.05, '#a0d0ff'], [0.9, 0.028, 0.08, '#ffb080'], [1.25, 0.09, 0.04, '#ffe0b0'], [1.6, 0.045, 0.05, '#c0a0ff']] as const) {
    const x = sx + dx * t, y = sy + dy * t, rad = H * r;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, col + '00'); gr.addColorStop(0.75, col + Math.round(a * 255).toString(16).padStart(2, '0')); gr.addColorStop(1, col + '00');
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  g.restore();
}

export interface Bolt { age: number; x: number; seed: number }

/** A fork of lightning from the cloud to the horizon, with the sky and land flashing white. `bolt.age` is seconds since the strike. */
export function drawLightning(g: CanvasRenderingContext2D, W: number, H: number, HZ: number, bolt: Bolt) {
  const a = bolt.age, top = H * HZ;
  const flash = a < 0.07 ? 0.5 : a < 0.14 ? 0.08 : a < 0.22 ? 0.42 : Math.max(0, 0.2 - (a - 0.22) * 0.5);   // a strike, a flicker, the return stroke, then it fades
  if (flash <= 0) return;
  g.save();
  g.fillStyle = `rgba(214,224,255,${flash})`; g.fillRect(0, 0, W, H);
  if (a < 0.3) {
    let x = bolt.x * W, y = 0; const pts: [number, number][] = [[x, y]];
    for (let i = 1; y < top - 4; i++) { y += (top / 9) * (0.7 + hash(bolt.seed + i) * 0.6); x += (hash(bolt.seed * 3 + i) - 0.5) * W * 0.07; pts.push([x, Math.min(y, top)]); }
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [w, al] of [[10, 0.18], [4, 0.5], [1.6, 1]] as const) {
      g.strokeStyle = `rgba(235,240,255,${al})`; g.lineWidth = w * Math.max(1, H / 700); g.beginPath();
      pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke();
    }
    const [bx, by] = pts[Math.floor(pts.length / 2)];
    g.lineWidth = 1.2 * Math.max(1, H / 700); g.strokeStyle = 'rgba(235,240,255,0.7)'; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + W * 0.06, by + top * 0.16); g.lineTo(bx + W * 0.09, by + top * 0.3); g.stroke();   // a branch
  }
  g.restore();
}
