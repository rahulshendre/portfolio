// The drone camera: the road seen from straight above, lit from the sun on the right so everything throws a soft shadow to the left.
import { circle, mix, oval, poly, rnd, rrect, stroke, use } from './draw';
import { altitude, lakeK, N, riverK, SEG_L, shore } from './track-ladakh';
import type { VSeg } from './endless';
import type { Car } from './traffic';

const SHADOW = 'rgba(38,22,12,0.3)';
const hd = (i: number, n: number) => rnd(i * 7.13 + n * 3.7);

export function drawTop(ctx: CanvasRenderingContext2D, segs: (VSeg | undefined)[], cars: Car[], W: number, H: number, pos: number, px: number, t = 0) {
  use(ctx);
  const U = 30, half = W > H ? 70 : 58, total = N * SEG_L, bottom = H - 50;
  const rc = (z: number) => W / 2 + (W > H ? 70 : 40) * Math.sin((z * Math.PI * 2 * 4) / total);
  const yOf = (z: number) => bottom - (z - pos) / U;
  const i0 = Math.max(0, Math.floor(pos / SEG_L) - 9), i1 = Math.floor((pos + (bottom + 40) * U) / SEG_L) + 1;
  const g = ctx;
  g.fillStyle = '#b8a078'; g.fillRect(0, 0, W, H);

  // ---- ground, water and the road, a strip per segment
  for (let i = i0; i <= i1; i++) {
    const sg = segs[i];
    if (!sg) continue;
    const si = sg.src, z1 = i * SEG_L, z2 = z1 + SEG_L, y1 = yOf(z1) + 1.2, y2 = yOf(z2), x1 = rc(z1), x2 = rc(z2), a = altitude(si), alt = i % 2;
    g.fillStyle = mix(alt ? '#c49a5e' : '#b78e54', alt ? '#d0c4b2' : '#c6bba9', a * 0.45);
    g.fillRect(0, y2, W, y1 - y2);
    for (let k = 0; k < 5; k++) {                                                          // dabs of dust and stone
      g.globalAlpha = 0.16; g.fillStyle = hd(i, k + 3) > 0.5 ? '#8a6a44' : '#e6d4b0';
      g.beginPath(); g.ellipse(hd(i, k) * W, y2 + hd(i, k + 9) * (y1 - y2), 6 + hd(i, k + 5) * 16, 2 + hd(i, k + 7) * 5, hd(i, k) * 3, 0, 7); g.fill();
    }
    g.globalAlpha = 1;

    if (riverK(si) > 0) {                                                                  // the Indus
      const f = riverK(si), d = si - i;
      const q = (j: number, s: number) => rc(j * SEG_L) + (-5.4 + 1.5 * Math.sin((j + d) * 0.045)) * half * s, w = (j: number, k: number) => (2.1 + 0.5 * Math.sin((j + d) * 0.09 + 1)) * half * f * k;
      const band = (k: number, col: string) => poly([q(i, 1) - w(i, k), y1, q(i, 1) + w(i, k), y1, q(i + 1, 1) + w(i + 1, k), y2, q(i + 1, 1) - w(i + 1, k), y2], col);
      band(1.15, '#dfe6cc'); band(1, '#3fb0b6'); band(0.45, '#8fdadd');
      g.fillStyle = '#ffffff'; g.globalAlpha = 0.3 * Math.abs(Math.sin(t * 2 + i)); g.fillRect(q(i, 1) + (hd(i, 2) - 0.5) * w(i, 1), (y1 + y2) / 2, 8, 1.5); g.globalAlpha = 1;
    }
    if (lakeK(si) > 0) {                                                                   // the lake
      const wa = lakeK(si), s1 = x1 + shore(si) * half, s2 = x2 + shore(si + 1) * half;
      g.globalAlpha = wa;
      poly([s1 - 14, y1, W, y1, W, y2, s2 - 14, y2], '#e6d8b4');
      poly([s1, y1, W, y1, W, y2, s2, y2], alt ? '#2aa9b3' : '#31b3bb');
      poly([s1, y1, s1 + 34, y1, s2 + 34, y2, s2, y2], '#8fe0d8');
      g.globalAlpha = 1;
    }

    const P = (k: number, col: string) => poly([x1 - half * k, y1, x1 + half * k, y1, x2 + half * k, y2, x2 - half * k, y2], col);
    const yt = y1 - 1.2;                                                                   // translucent layers must not overlap, or the seams show
    poly([x1 - half * 1.5, yt, x1 + half * 1.5, yt, x2 + half * 1.5, y2, x2 - half * 1.5, y2], SHADOW);                                                                        // the road is raised a touch: it throws its own edge shadow
    P(1.35, mix('#a98156', '#c0b4a2', a));
    P(1.08, alt ? '#e8b923' : '#222');
    P(1, alt ? '#5a5854' : '#54524e');
    for (const off of [-0.3, 0.3]) poly([x1 + half * (off - 0.05), yt, x1 + half * (off + 0.05), yt, x2 + half * (off + 0.05), y2, x2 + half * (off - 0.05), y2], 'rgba(20,18,16,0.14)');
    for (const s of [-1, 1]) stroke([x1 + s * half * 0.93, y1, x2 + s * half * 0.93, y2], '#e9e3d1', 1.6);
    if (alt) stroke([x1, y1, x2, y2], '#e9e3d1', 2.4);
  }

  // ---- things beside the road, far to near, each with its shadow thrown to the lower left
  let pole: { x: number; y: number } | null = null;
  for (let i = i1; i >= i0; i--) {
    const z = i * SEG_L, y = yOf(z), r = rc(z);
    for (const p of segs[i]?.props ?? []) {
      const x = r + p.o * half;
      if (x < -60 || x > W + 60) continue;
      const sh = (rx: number, ry: number) => oval(x - rx * 0.6, y + ry * 0.5, rx, ry, SHADOW);
      switch (p.type) {
        case 'poplar': sh(11, 5); circle(x, y, 8.5, p.v ? '#b8983c' : '#5f7f40'); circle(x + 2, y - 2, 5.5, p.v ? '#dcc266' : '#86a55c'); circle(x, y, 1.6, '#5a4030'); break;
        case 'house': g.fillStyle = SHADOW; g.fillRect(x - 21, y - 7, 30, 22); rrect(x - 15, y - 11, 30, 22, 2, ['#f0ebe0', '#e8d8c0', '#d8c8a8'][(p.v ?? 0) % 3]); rrect(x - 15, y - 11, 30, 3, 1, '#c8b898'); circle(x + 7, y - 1, 3.4, '#2a2a2e'); break;
        case 'chorten': sh(10, 5); circle(x, y, 8, '#ebe4d4'); circle(x, y, 4.6, '#dcd2bc'); circle(x, y, 1.8, '#e8b923'); break;
        case 'boulder': sh(11, 6); poly([x - 9, y + 2, x - 5, y - 8, x + 4, y - 9, x + 10, y - 1, x + 5, y + 8, x - 4, y + 8], '#8a7060'); poly([x + 4, y - 9, x + 10, y - 1, x + 5, y + 8, x, y], '#a08472'); break;
        case 'shop': g.fillStyle = SHADOW; g.fillRect(x - 21, y - 7, 36, 26); rrect(x - 17, y - 12, 34, 24, 2, ['#f0ebe0', '#e8d8c0', '#f0dca8', '#d8c8a8'][(p.v ?? 0) % 4]); rrect(x - 17, y - 12, 34, 4, 1, '#c8b898'); rrect(x - 12, y + 3, 24, 5, 1, ['#c8392b', '#2c6eb0', '#e8b923', '#3c8a48'][(p.v ?? 0) % 4]); break;
        case 'gate': rrect(x - half * 1.5 - 6, y - 6, 12, 12, 2, '#f2ede2'); rrect(x + half * 1.5 - 6, y - 6, 12, 12, 2, '#f2ede2'); rrect(x - half * 1.5, y - 3, half * 3, 6, 1, '#f6f1e6'); rrect(x - half * 0.8, y - 2, half * 1.6, 4, 1, '#1b4a2a'); break;
        case 'tourer': sh(4, 9); rrect(x - 3, y - 9, 6, 18, 2, '#1b1c20'); rrect(x - 4, y - 5, 8, 6, 2, ['#e8641f', '#3c8a48', '#c8392b', '#2c6eb0'][(p.v ?? 0) % 4]); break;
        case 'gurdwara': sh(24, 10); rrect(x - 22, y - 14, 44, 28, 3, '#f6f2e8'); circle(x, y, 9, '#f4c95a'); break;
        case 'checkpost': sh(12, 8); rrect(x - 9, y - 9, 18, 18, 2, '#8a8f6a'); rrect(x + 10, y - 2, 18, 3, 1, '#d8342b'); break;
        case 'stall': sh(10, 5); circle(x, y, 9, '#c8392b'); circle(x, y, 4.5, '#f4f2ea'); break;
        case 'monk': circle(x, y, 3.4, '#8a1f2a'); circle(x, y - 1, 1.8, '#c98a5a'); break;
        case 'buddha': sh(16, 8); circle(x, y, 13, '#c49a78'); circle(x, y, 8, '#e3b23c'); circle(x, y, 3.4, '#f4c95a'); break;
        case 'monastery': sh(24, 10); rrect(x - 26, y - 16, 52, 32, 3, '#efe6d2'); rrect(x - 16, y - 10, 32, 20, 2, '#f6eedc'); rrect(x - 8, y - 5, 16, 10, 2, '#b8342b'); break;
        case 'snow': oval(x, y, 12, 6, '#eef3f8'); oval(x - 2, y - 1, 8, 3.5, '#dfe8f0'); break;
        case 'yak': sh(11, 6); oval(x, y, 11, 6, '#3a3028'); circle(x + 11, y, 4, '#2a2218'); break;
        case 'kiang': for (const dx of [-16, 0, 16]) { oval(x + dx - 4, y + 2, 9, 3, SHADOW); oval(x + dx, y + (dx ? 2 : -2), 8, 3.5, '#a2673c'); circle(x + dx + 8, y + (dx ? 2 : -2), 2.4, '#efe6d2'); } break;
        case 'marmot': circle(x, y, 3.4, '#a87a4c'); break;
        case 'cairn': sh(7, 4); circle(x, y, 6, '#8f8a82'); circle(x, y, 3.4, '#b6b0a6'); break;
        case 'scrub': sh(8, 3); circle(x, y, 5, '#8a7a3a'); circle(x + 1, y - 1, 2.8, '#a08c48'); break;
        case 'tuft': circle(x, y, 4.4, '#7fa04a'); circle(x - 1, y - 1, 2.4, '#a4b860'); break;
        case 'reed': for (let k = 0; k < 3; k++) circle(x + (k - 1) * 4, y + (k % 2) * 2, 2.6, k % 2 ? '#6d8a3e' : '#8ea24c'); break;
        case 'duck': for (const dx of [-12, 2, 14]) { circle(x + dx, y + (dx > 0 ? 3 : -2), 3.2, '#f2eee2'); circle(x + dx + 3, y + (dx > 0 ? 3 : -2), 1.5, '#2f6b4c'); } break;
        case 'flags': case 'canopy': { const w = p.type === 'canopy' ? half * 1.3 : 18; for (let k = 0; k < 8; k++) circle(x - w + (k / 7) * w * 2, y + Math.sin(k + t * 2) * 1.2, 2.1, ['#d8342b', '#e8b923', '#2c6eb0', '#f4f2ea', '#3c8a48'][k % 5]); break; }
        case 'pole': circle(x, y, 2.4, '#4a3a2c'); stroke([x - 6, y, x + 6, y], '#3a2e24', 1.6); if (pole) stroke([x, y, pole.x, pole.y], 'rgba(40,34,28,0.55)', 0.8); pole = { x, y }; break;
        case 'ms': rrect(x - 5, y - 7, 10, 12, 2, '#f2f0ea'); rrect(x - 5, y - 7, 10, 4, 2, '#e8b923'); break;
        case 'bro': rrect(x - 11, y - 6, 22, 11, 2, '#2a2620'); rrect(x - 9, y - 4, 18, 7, 1, '#e8b923'); break;
        case 'board': sh(20, 3); rrect(x - 22, y - 3, 44, 6, 2, '#efece4'); break;
        case 'sign': rrect(x - 12, y - 3, 24, 6, 2, '#1b4a2a'); break;
        case 'chevron': rrect(x - 7, y - 3, 14, 6, 1, '#f2c318'); break;
        case 'stone': circle(x, y, 2.2, p.v ? '#1b1712' : '#f2ede0'); break;
        case 'dhaba': g.fillStyle = SHADOW; g.fillRect(x - 28, y - 4, 44, 26); rrect(x - 22, y - 10, 44, 26, 2, '#2c6eb0'); rrect(x - 22, y - 10, 16, 26, 2, '#4a86c4'); circle(x + 14, y + 3, 3, '#b9bec6'); break;
        case 'parked': sh(11, 24); rrect(x - 11, y - 22, 22, 46, 3, '#4a5a38'); rrect(x - 8, y - 26, 16, 9, 2, '#33402a'); break;
        case 'billboard': sh(30, 6); rrect(x - 44, y - 3, 88, 6, 2, '#2a1a14'); rrect(x - 40, y - 2, 80, 3, 1, '#ffb23a'); break;
        case 'gantry': rrect(x - half * 1.7 - 6, y - 6, 12, 12, 2, '#5a6068'); rrect(x + half * 1.7 - 6, y - 6, 12, 12, 2, '#5a6068'); rrect(x - half * 1.7, y - 3, half * 3.4, 6, 1, '#0d6a46'); break;
        case 'garage': g.fillStyle = SHADOW; g.fillRect(x - 48, y - 22, 88, 56); rrect(x - 42, y - 28, 88, 56, 3, '#d9cbb2'); rrect(x - 30, y - 6, 60, 30, 2, '#8b8f94'); for (let k = 0; k < 6; k++) stroke([x - 30, y - 4 + k * 5, x + 30, y - 4 + k * 5], '#6d7176', 1); circle(x + 34, y - 20, 4, '#f0a020'); break;
      }
    }
  }

  // ---- traffic, seen from above: canvas roofs, luggage racks, helmets (drawn 1.3 times life size so they read)
  const on = (x: number, y: number, fn: () => void) => { g.save(); g.translate(x, y); g.scale(1.3, 1.3); fn(); g.restore(); };
  for (const c of cars) {
    const cy = yOf(c.z);
    if (cy < -60 || cy > H + 60) continue;
    on(rc(c.z) + c.o * half * 1.1, cy, () => {
      const x = 0, y = 0;
      oval(x - 6, y + 4, 12, 26, SHADOW);
      if (c.kind === 'army') { rrect(x - 10, y - 22, 20, 44, 3, '#4a5a38'); for (let k = 0; k < 5; k++) stroke([x - 9, y - 16 + k * 8, x + 9, y - 16 + k * 8], '#33402a', 1.2); rrect(x - 8, y - 30, 16, 10, 3, '#2f3a26'); rrect(x - 6, y - 28, 12, 4, 1, '#22303c'); }
      else if (c.kind === 'suv') { rrect(x - 9, y - 22, 18, 44, 5, '#eceef1'); rrect(x - 7, y - 16, 14, 8, 2, '#22303c'); rrect(x - 7, y - 2, 14, 16, 2, '#6b4a2a'); rrect(x - 7, y + 15, 14, 5, 1, '#22303c'); }
      else if (c.kind === 'goats') { for (const dx of [-12, -4, 4, 12]) oval(x + dx, y + (dx % 8 ? 3 : -3), 3.6, 5, '#e8e0d0'); }
      else if (c.kind === 'marmot') oval(x, y, 3, 4, '#b48a5a');
      else if (c.kind === 'tanker') { rrect(x - 10, y - 24, 20, 48, 9, '#d8dce2'); stroke([x - 10, y - 4, x + 10, y - 4], '#d8342b', 2); rrect(x - 8, y - 32, 16, 10, 3, '#2f3a4a'); }
      else if (c.kind === 'tempo') { rrect(x - 9, y - 22, 18, 44, 5, '#f4f5f7'); rrect(x - 7, y - 20, 14, 8, 2, '#22303c'); rrect(x - 7, y - 4, 14, 18, 2, '#6b4a2a'); rrect(x - 9, y + 16, 18, 2, 1, '#2c6eb0'); }
      else if (c.kind === 'yak') { for (const [dx, dy] of [[-12, 4], [0, -6], [12, 6]] as const) { oval(x + dx, y + dy, 8, 12, '#2a2219'); circle(x + dx, y + dy - 12, 4, '#1e1912'); } }
      else { oval(x, y + 6, 3, 11, '#1a1b1f'); oval(x, y - 6, 6, 5, '#8a3a2e'); circle(x, y - 12, 4.4, '#2f5a3a'); rrect(x - 6, y + 2, 12, 8, 3, '#6b4a2a'); }
    });
  }

  // ---- you: the white Scrambler from above, tank and seat, bars, a white helmet
  on(rc(pos) + px * half * 1.1, bottom, () => {
    const bx = 0, by = 0;
    oval(bx - 7, by + 4, 9, 26, SHADOW);
    oval(bx, by + 14, 3.6, 12, '#111214'); oval(bx, by - 16, 3.6, 12, '#111214');
    rrect(bx - 5, by - 12, 10, 24, 4, '#f3f0e8'); rrect(bx - 5, by - 12, 3, 24, 2, '#ffffff'); rrect(bx - 1.2, by - 12, 2.4, 20, 1, '#17181c'); rrect(bx - 3, by + 8, 6, 8, 2, '#5a3d2b');
    stroke([bx - 4, by - 14, bx - 4, by - 26], '#d9a233', 2.4); stroke([bx + 4, by - 14, bx + 4, by - 26], '#d9a233', 2.4);   // gold forks
    stroke([bx - 17, by - 14, bx + 17, by - 14], '#1b1c20', 2.6); circle(bx - 17, by - 14, 2.4, '#141518'); circle(bx + 17, by - 14, 2.4, '#141518');
    oval(bx, by - 1, 9, 6, '#2f3747'); stroke([bx - 8, by - 4, bx - 16, by - 13], '#2f3747', 4); stroke([bx + 8, by - 4, bx + 16, by - 13], '#2f3747', 4);
    circle(bx, by - 2, 5.6, '#f4f2ea'); stroke([bx, by - 7, bx, by + 3], '#d8342b', 1.4);
  });
}
