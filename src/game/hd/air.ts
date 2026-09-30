// Things in the air between you and the road: snow rushing past on the pass, gold dust in the valley, fireflies of dusk light at the lake, and the bike's own headlight at the end of the day.
import { glow, smooth } from './draw';
import { altitude, LAKE_FROM } from './track-ladakh';

const hash = (n: number) => Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;

export type Sky = 'clear' | 'rain' | 'fog' | 'snow';
export const SKIES: Sky[] = ['clear', 'rain', 'fog', 'snow'];

/** Specks that stream out of the vanishing point toward the camera, faster as you go: snow up high, dust and warm motes lower down. */
export function drawAir(g: CanvasRenderingContext2D, W: number, H: number, HZ: number, t: number, speed: number, segI: number, tod: number, sky: Sky = 'clear') {
  const snowy = sky === 'snow' || altitude(segI) > 0.45, dusk = tod > 0.7;
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
    g.fillStyle = snowy ? '#ffffff' : dusk ? '#ffd9a0' : '#f2dcae';
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

/** A warm cone of light from the bike as evening falls (a is 0 to 1). */
export function drawHeadlight(g: CanvasRenderingContext2D, W: number, H: number, HZ: number, lean: number, a: number) {
  const x = W / 2 + lean * H * 0.05, top = HZ + (H - HZ) * 0.42;
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (const [wd, al] of [[1, 0.4], [0.68, 0.35], [0.4, 0.3]] as const) {                  // stacked cones give it a soft edge
    const gr = g.createLinearGradient(0, H, 0, top);
    gr.addColorStop(0, `rgba(255,214,150,${0.2 * a * al * 2})`); gr.addColorStop(1, 'rgba(255,214,150,0)');
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(x - W * 0.035 * wd, H * 0.9); g.lineTo(x + W * 0.035 * wd, H * 0.9); g.lineTo(x + W * 0.13 * wd, top); g.lineTo(x - W * 0.13 * wd, top); g.closePath(); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  glow(x, H * 0.86, H * 0.18, '#ffe0a8', 0.22 * a);
  g.restore();
}

/** Slow cloud shadows crossing the ground, and a warm sheen on the tarmac toward the sun as evening comes. Drawn over the world, under the bike. */
export function drawGround(g: CanvasRenderingContext2D, W: number, H: number, HZ: number, t: number, speed: number, tod: number, segI: number, wet = 0, dim = 0) {
  const top = H * HZ, alt = altitude(segI), lit = 1 - 0.8 * dim;                       // pale mist and snow must not glow at night
  const white = smooth(815, 850, segI) * (1 - smooth(880, 912, segI));                    // a snow squall near the top of the climb, thinning as you crest
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
