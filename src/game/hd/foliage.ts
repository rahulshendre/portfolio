// Trees and bushes for both lands. Each is built from seeded lobes of leaf, so no two are alike and none is a stack of circles, painted once into a small cached canvas
// (light from the low sun on the right, a dark underside, clumps of sunlit leaf, a trunk with bark and branches, contact shade at the foot), then stamped down with
// drawImage and a breath of sway. Painting a tree once also makes it cheaper than the ovals it replaces.
import { at, circle, g, mix, oval, poly, rnd, stroke, use } from './draw';
import { BARK, BLOOM, RAMPS, type RampName } from './palette';

/** Added to a tree's `v` to make it a tall one: the lone big tree where a grove peaks. */
export const HERO = 1000;
export type Species = 'oak' | 'beech' | 'birch' | 'poplar' | 'bush' | 'scrub' | 'blossom';

interface Spec {
  trunk: { h: number; w: number; lean: number; bark: keyof typeof BARK } | null;
  cx: number; cy: number; rx: number; ry: number;          // the canopy: centre and radii
  n: number; r0: number; r1: number;                       // how many lobes, and their smallest and largest radius
}
const SPECS: Record<Species, Spec> = {
  oak: { trunk: { h: 44, w: 9, lean: 0.06, bark: 'dark' }, cx: 0, cy: -72, rx: 46, ry: 30, n: 22, r0: 12, r1: 22 },
  beech: { trunk: { h: 54, w: 8, lean: -0.04, bark: 'dark' }, cx: 0, cy: -88, rx: 33, ry: 40, n: 21, r0: 10, r1: 18 },
  birch: { trunk: { h: 78, w: 5, lean: 0.07, bark: 'birch' }, cx: 2, cy: -98, rx: 24, ry: 34, n: 16, r0: 8, r1: 14 },
  poplar: { trunk: { h: 22, w: 5, lean: 0, bark: 'dark' }, cx: 0, cy: -68, rx: 10, ry: 54, n: 34, r0: 6, r1: 11 },
  blossom: { trunk: { h: 42, w: 9, lean: -0.05, bark: 'dark' }, cx: 0, cy: -70, rx: 40, ry: 27, n: 21, r0: 11, r1: 19 },
  bush: { trunk: null, cx: 0, cy: -13, rx: 26, ry: 8, n: 9, r0: 8, r1: 13 },
  scrub: { trunk: null, cx: 0, cy: -7, rx: 17, ry: 5, n: 8, r0: 4.5, r1: 7.5 },
};
const VARIANTS = 10;
const TAU = Math.PI * 2;
const SHADOW = 'rgba(20,36,12,0.22)';

interface Sprite { cv: HTMLCanvasElement; L: number; T: number; w: number; h: number; px: number; last: number }
const cache = new Map<string, Sprite>();
/** The cache may hold this many pixels of sprite (about 64 MB); past that the ones not drawn for longest are let go. */
const BUDGET_PX = 16_000_000;
let held = 0, tick = 0;

/** Which kind of tree a `v` is: mostly oaks and beeches, some birches, a few poplars. */
export function pickSpecies(v: number): Species {
  const u = rnd((v % HERO) * 1.37 + 0.7);
  return u < 0.42 ? 'oak' : u < 0.72 ? 'beech' : u < 0.88 ? 'birch' : 'poplar';
}
/** A seed for one prop from its `v` and how far from the road it stands, so neighbours of the same kind still differ. Keeps the hero mark. */
export const seedOf = (v: number, o = 0) => (v >= HERO ? HERO : 0) + (((v % HERO) + Math.floor(Math.abs(o) * 131)) % 997);

/** A leaf clump: a rounded blob with a ragged outline, so a crown is not a heap of perfect circles. */
function blob(x: number, y: number, r: number, seed: number, fill: string) {
  const n = 11, pts: [number, number][] = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU, rr = r * (0.8 + rnd(seed + i * 3.1) * 0.32); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.92]); }
  g.beginPath(); g.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
  g.closePath(); g.fillStyle = fill; g.fill();
}

function paint(species: Species, ramp: readonly string[], seed: number, bloom: boolean) {
  const sp = SPECS[species], { cx, cy, rx, ry } = sp, k = seed * 7.13 + species.length;
  oval(-rx * 0.45, 1.5, rx * 1.15, species === 'bush' ? 4 : species === 'scrub' ? 2.6 : 5.5, SHADOW);                       // the shadow falls away from the sun
  if (sp.trunk) {
    const { h, w, lean, bark } = sp.trunk, b = BARK[bark], tx = lean * h, top = -h;
    poly([-w * 0.7, 1, w * 0.7, 1, tx + w * 0.38, top, tx - w * 0.38, top], b[0]);                // the trunk, shaded
    poly([w * 0.05, 1, w * 0.7, 1, tx + w * 0.38, top, tx + w * 0.02, top], b[1]);               // its sunlit side
    stroke([w * 0.5, -2, tx + w * 0.3, top * 0.6, tx + w * 0.3, top], b[2], Math.max(0.8, w * 0.12));
    poly([-w * 1.2, 1.5, -w * 0.5, -3, w * 0.1, 1.5], b[0]); poly([w * 0.1, 1.5, w * 0.6, -3, w * 1.2, 1.5], b[1]);   // roots flare
    for (let m = 0; m < (bark === 'birch' ? 9 : 5); m++) {                                          // bark: dark flecks on birch, rough lines on the rest
      const y = -2 - rnd(k + m * 2.1) * (h - 6), x = tx * (-y / h) + (rnd(k + m * 3.3) - 0.5) * w * 0.7;
      if (bark === 'birch') stroke([x - w * 0.3, y, x + w * 0.3, y + 0.4], '#38382f', 1.3); else stroke([x, y, x + (rnd(k + m) - 0.5) * 2, y - 4 - rnd(k + m * 5) * 4], b[0], 1);
    }
    for (let m = 0; m < 3; m++) {                                                                   // a few boughs, mostly hidden by the leaves
      const a = -1.2 + m * 1.2 + (rnd(k + m * 9) - 0.5) * 0.5;
      stroke([tx, top + h * 0.12, tx + Math.sin(a) * rx * 0.8, cy + ry * 0.2 - Math.cos(a) * ry * 0.5], b[0], Math.max(1.2, w * 0.4));
    }
  }
  oval(cx, cy + ry * 0.15, rx * 0.9, ry * 0.85, ramp[0]);                                           // the dark heart, so the gaps between lobes show shade and not sky
  const lobes: { x: number; y: number; r: number }[] = [];
  for (let j = 0; j < sp.n; j++) {
    const a = rnd(k + j * 2.3) * TAU, d = 0.3 + 0.7 * Math.sqrt(rnd(k + j * 5.7 + 1));             // out toward the rim, so the silhouette is lumpy
    lobes.push({ x: cx + Math.cos(a) * rx * d, y: cy + Math.sin(a) * ry * d, r: sp.r0 + rnd(k + j * 9.1 + 2) * (sp.r1 - sp.r0) });
  }
  lobes.sort((p, q) => p.y - q.y);                                                                  // the top first, so the lower clumps overlap them and show scalloped edges
  for (const [j, l] of lobes.entries()) {
    const lum = Math.min(1, Math.max(0, 0.5 + ((l.x - cx) / rx) * 0.38 - ((l.y - cy) / ry) * 0.34));   // lighter up and to the right
    const q = k + j * 11.3;
    blob(l.x, l.y, l.r, q, mix(ramp[0], ramp[1], lum));                                              // three flat tones, each a ragged blob a little up and to the right of the last
    blob(l.x + l.r * 0.14, l.y - l.r * 0.16, l.r * 0.86, q + 1, mix(ramp[1], ramp[2], lum));
    blob(l.x + l.r * 0.3, l.y - l.r * 0.34, l.r * 0.5, q + 2, mix(ramp[2], ramp[3], lum));
    for (let m = 0; m < 5; m++) {                                                                   // leaf tips: sunlit flecks high and right, dark ones low and left
      const a = rnd(q + m * 1.3) * TAU, d = Math.sqrt(rnd(q + m * 3.7)) * l.r * 0.8;
      const px = l.x + Math.cos(a) * d + l.r * 0.1, py = l.y + Math.sin(a) * d * 0.85 - l.r * 0.1, lit = Math.cos(a) - Math.sin(a) > 0.2;
      g.globalAlpha = lit ? 0.85 : 0.5;
      stroke([px, py, px + 2.2, py - 1.4], lit ? ramp[4] : ramp[0], 1.2);
    }
    g.globalAlpha = 1;
  }
  if (bloom) for (let m = 0; m < 7; m++) circle(cx + (rnd(k + m * 1.9) - 0.5) * rx * 1.7, cy + (rnd(k + m * 2.7) - 0.5) * ry * 1.5, 1.7, BLOOM[(seed + m) % BLOOM.length]);
  const top = cy - ry - sp.r1, bot = cy + ry + sp.r1 * 0.6, left = cx - rx - sp.r1, right = cx + rx + sp.r1;
  g.save(); g.globalCompositeOperation = 'source-atop';                                              // light and dark laid over what is painted, and only on it
  const under = g.createLinearGradient(0, top + (bot - top) * 0.45, 0, bot);
  under.addColorStop(0, 'rgba(8,20,6,0)'); under.addColorStop(1, 'rgba(8,20,6,0.34)');
  g.fillStyle = under; g.fillRect(left, top, right - left, bot - top);
  const rim = g.createLinearGradient(cx, 0, right, 0);
  rim.addColorStop(0, 'rgba(255,232,170,0)'); rim.addColorStop(1, 'rgba(255,232,170,0.2)');
  g.fillStyle = rim; g.fillRect(cx, top, right - cx, bot - top);
  g.restore();
}

function sprite(species: Species, rampName: RampName, variant: number, bloom: boolean, ts: number): Sprite {
  const key = `${species}|${rampName}|${variant}|${bloom ? 1 : 0}|${ts}`;
  const hit = cache.get(key);
  if (hit) { hit.last = ++tick; return hit; }
  const sp = SPECS[species];
  const L = Math.floor(-Math.max(sp.rx + sp.r1, sp.rx * 1.7) - 4), R = Math.ceil(sp.rx + sp.r1 + 8), T = Math.floor(sp.cy - sp.ry - sp.r1 - 6), B = 8;
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.ceil((R - L) * ts)); cv.height = Math.max(1, Math.ceil((B - T) * ts));
  const c = cv.getContext('2d')!, prev = g;
  use(c); c.scale(ts, ts); c.translate(-L, -T);
  paint(species, RAMPS[rampName], variant, bloom);
  use(prev);
  const s = { cv, L, T, w: R - L, h: B - T, px: cv.width * cv.height, last: ++tick };
  cache.set(key, s); held += s.px;
  if (held > BUDGET_PX) {                                                                          // a long ride must not hoard every tree it has met: drop the longest unused
    for (const [k, e] of [...cache].sort((a, b) => a[1].last - b[1].last)) { if (held <= BUDGET_PX * 0.8) break; if (e === s) continue; cache.delete(k); held -= e.px; }
  }
  return s;
}

/** The sizes a sprite is painted at, in pixels per unit. A tree is drawn from the largest that is no more than 15% under its size, so it is stretched by at most 40% and never shrunk, and then it can be
 *  stamped with nearest-neighbour sampling: filtering the big sprites with the GPU's smoothing took the frame rate on the closest trees down by half. */
const TIERS = [0.125, 0.25, 0.5, 0.7, 1, 1.4, 2, 2.8, 4];
const tierFor = (s: number) => { let t = TIERS[0]; for (const x of TIERS) if (x <= s * 1.15) t = x; return t; };

const clock = () => performance.now() / 1000;

/** Stamp a tree or bush at (sx, sy), `k` pixels per unit. `seed` picks the individual (see `seedOf`); a seed from `HERO` up is the tall one. */
export function drawFoliage(species: Species, sx: number, sy: number, k: number, seed: number, ramp: RampName, bloom = false) {
  const hero = seed >= HERO, v = seed % HERO;
  const s = k * (0.8 + rnd(v * 3.1 + 1) * 0.36) * (hero ? 1.38 : 1);
  if (s < 0.1) return;
  const spr = sprite(species, ramp, v % VARIANTS, bloom, tierFor(s));
  const sway = Math.sin(clock() * 1.15 + v * 1.7) * (species === 'poplar' ? 0.016 : species === 'bush' || species === 'scrub' ? 0.006 : 0.011);
  at(sx, sy, s, () => {
    g.imageSmoothingEnabled = false;                                                               // sprites are painted close to the size they are drawn, so no filtering is needed (see TIERS)
    g.transform(1, 0, sway, 1, 0, 0);                                                              // lean the whole thing a hair, from the foot up
    g.drawImage(spr.cv, spr.L, spr.T, spr.w, spr.h);
  });
}

/** A round-headed tree: an oak, a beech, a birch or a poplar by `v`. */
export function drawTree(sx: number, sy: number, k: number, v = 0) {
  const sp = pickSpecies(v), base = v % HERO;
  drawFoliage(sp, sx, sy, k * 0.85, v, sp === 'birch' ? 'birch' : sp === 'poplar' ? 'poplarGreen' : (`leaf${(base % VARIANTS) % 4}` as RampName));   // the leaf colour follows the variant, so there are ten of each kind to keep, not forty
}

/** A low bush; some carry flowers. */
export function drawBush(sx: number, sy: number, k: number, v = 0) {
  drawFoliage('bush', sx, sy, k * 0.9, v, `leaf${(v % VARIANTS) % 4}` as RampName, (v % VARIANTS) % 3 === 0);
}

/** A low tuft of dry highland scrub: grey-olive or dust, painted like the bushes but never green. */
export function drawDryScrub(sx: number, sy: number, k: number, v = 0) {
  drawFoliage('scrub', sx, sy, k * 0.9, v, v % 2 ? 'scrubDust' : 'scrubOlive');
}

/** A tall narrow poplar, golden or green. `seed` picks which one. */
export function drawPoplarTree(sx: number, sy: number, k: number, gold: boolean, seed = 0) {
  drawFoliage('poplar', sx, sy, k * 0.95, seed, gold ? 'poplarGold' : 'poplarGreen');
}

/** A cherry tree in full blossom. */
export function drawBlossomTree(sx: number, sy: number, k: number, seed = 0) {
  drawFoliage('blossom', sx, sy, k, seed, 'blossom');
}
