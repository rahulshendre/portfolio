import { SEG_L } from './track-ladakh';
import { at, box, circle, g, hgrad, oval, poly, rrect, stroke, vgrad } from './draw';
import { drawRiderAt } from './rider';
import { drawBlissCar } from './farm';
import { isBliss } from './land';

export type Kind = 'army' | 'suv' | 'biker' | 'yak' | 'tanker' | 'tempo' | 'goats' | 'marmot';
export interface Car { z: number; o: number; v: number; kind: Kind; warned?: boolean; yieldT?: number;
  /** The speed it is really doing this frame: its own, or slower if it is stuck behind another vehicle. */
  vNow?: number;
  /** The slower vehicle it is pulling out to overtake. */
  pass?: Car;
  /** Walks sideways across the road, in road half-widths per second, once you are near. */
  lat?: number; hurry?: number }

/** Half the width of each vehicle in road half-widths, measured from what is drawn, so blocking and bumps match the picture. */
export const HALF: Record<Kind, number> = { army: 0.27, tanker: 0.27, suv: 0.24, tempo: 0.245, biker: 0.11, yak: 0.4, goats: 0.46, marmot: 0 };
/** Half the width of your bike. */
export const BIKE_HALF = 0.1;
/** Vehicles keep at least this far behind the one in front (world units), so a faster one queues up instead of driving through a slower one. */
export const FOLLOW_GAP = 2.4 * SEG_L;
const isAnimal = (c: Car) => c.kind === 'goats' || c.kind === 'marmot';

export const LEFT = -0.45;
export const RIGHT = 0.45;

// Army convoy + tourist SUV + other bikers — all keep left, slower than a Scrambler.
export const spawnTraffic = (): Car[] => [
  { z: 70 * SEG_L, o: LEFT, v: 0.38, kind: 'army' },
  { z: 180 * SEG_L, o: LEFT, v: 0.48, kind: 'biker' },
  { z: 320 * SEG_L, o: LEFT, v: 0.32, kind: 'army' },
  { z: 460 * SEG_L, o: LEFT, v: 0.42, kind: 'suv' },
  { z: 620 * SEG_L, o: LEFT, v: 0.36, kind: 'army' },
  { z: 800 * SEG_L, o: LEFT, v: 0.5, kind: 'biker' },
  { z: 940 * SEG_L, o: LEFT, v: 0.4, kind: 'suv' },
  { z: 1080 * SEG_L, o: LEFT, v: 0.34, kind: 'army' },
  { z: 120 * SEG_L, o: LEFT, v: 0.44, kind: 'tempo' },
  { z: 250 * SEG_L, o: LEFT, v: 0.35, kind: 'tanker' },
  { z: 540 * SEG_L, o: LEFT, v: 0.46, kind: 'tempo' },
  { z: 690 * SEG_L, o: LEFT, v: 0.33, kind: 'tanker' },
  { z: 990 * SEG_L, o: LEFT, v: 0.45, kind: 'biker' },
  { z: 96 * SEG_L, o: -2.6, v: 0, kind: 'goats', lat: 0.32 },      // a flock crossing the road in Leh, with no hurry at all
  { z: 336 * SEG_L, o: -2.6, v: 0, kind: 'goats', lat: 0.3 },
  { z: 560 * SEG_L, o: -2.6, v: 0, kind: 'marmot', lat: 1.3 },      // a marmot that bolts across
  { z: 790 * SEG_L, o: 2.6, v: 0, kind: 'marmot', lat: -1.3 },
  { z: 940 * SEG_L, o: -2.6, v: 0, kind: 'goats', lat: 0.32 },
  { z: 735 * SEG_L, o: LEFT, v: 0.03, kind: 'yak' },            // a herd ambling along the pass, in no hurry
  { z: 875 * SEG_L, o: LEFT, v: 0.03, kind: 'yak' },
];

/** A honk: the nearest slow vehicle ahead in this lane pulls over to the verge for a few seconds. */
export function honkAt(cars: Car[], playerZ: number, px: number): boolean {
  const c = carAhead(cars, playerZ, px, 22 * SEG_L, 0.25);
  if (!c) return false;
  if (c.lat) c.hurry = 3; else c.yieldT = 3.2;                                        // animals hurry across; vehicles pull over
  return true;
}

/** Do a vehicle and something at lateral position `x` (half-width `hw`) overlap sideways? */
export const overlaps = (c: Car, x: number, hw: number, slack = 0.05) => Math.abs(c.o - x) < HALF[c.kind] + hw + slack;

/** The nearest vehicle ahead that your bike would run into if you held your line. `extra` widens the test (a honk reaches a little further sideways). */
export function carAhead(cars: Car[], playerZ: number, px: number, within: number, extra = 0): Car | undefined {
  let best: Car | undefined;
  for (const c of cars) {
    const gap = c.z - playerZ;
    if (gap > 0 && gap < within && c.kind !== 'marmot' && overlaps(c, px, BIKE_HALF + extra) && (!best || gap < best.z - playerZ)) best = c;
  }
  return best;
}

/** Is the right-hand lane clear around `z` for a vehicle to pull out into, counting the other traffic and you? */
function rightFree(cars: Car[], self: Car, playerZ: number, px: number) {
  if (Math.abs(px - RIGHT) < 0.55 && self.z - playerZ > -3 * SEG_L && self.z - playerZ < 14 * SEG_L) return false;
  return !cars.some((o) => o !== self && !isAnimal(o) && Math.abs(o.o - RIGHT) < HALF[o.kind] + HALF[self.kind] + 0.1 && o.z > self.z - 3 * SEG_L && o.z < self.z + 14 * SEG_L);
}

const SPEED: Partial<Record<Kind, number>> = { army: 0.35, biker: 0.48, tempo: 0.45, tanker: 0.34, suv: 0.43, yak: 0.03 };
const MIX: Record<'leh' | 'valley' | 'pass' | 'lake', readonly Kind[]> = {
  leh: ['army', 'biker', 'tempo', 'tanker', 'suv', 'goats'],
  valley: ['army', 'suv', 'tempo', 'tanker', 'biker', 'marmot'],
  pass: ['army', 'biker', 'suv', 'yak', 'marmot', 'goats'],
  lake: ['army', 'suv', 'biker', 'tempo'],
};
/** A vehicle or animal for the road at world position `z`, by the kind of country there and two rolls of the dice. The endless road feeds these in ahead of the bike, one every minute's worth of road or so. */
export function trafficAt(zone: 'leh' | 'valley' | 'pass' | 'lake', z: number, r1: number, r2: number): Car {
  const mix = MIX[zone], kind = mix[Math.floor(r1 * mix.length) % mix.length];
  if (kind === 'goats') return { z, o: -2.6, v: 0, kind, lat: 0.3 + r2 * 0.04 };                        // a flock crossing with no hurry at all
  if (kind === 'marmot') return r2 > 0.5 ? { z, o: -2.6, v: 0, kind, lat: 1.3 } : { z, o: 2.6, v: 0, kind, lat: -1.3 };   // a marmot that bolts across
  return { z, o: LEFT, v: (SPEED[kind] ?? 0.4) + (r2 - 0.5) * 0.08, kind };
}

/** Move every vehicle and animal on. Leaders go first; each holds its gap to the one ahead in its lane, or pulls out to overtake it if the right lane is clear. */
export function stepTraffic(cars: Car[], playerZ: number, px: number, dt: number, maxS: number) {
  const order = [...cars].sort((a, b) => b.z - a.z);
  for (const c of order) {
    let v = c.v, blocker: Car | undefined;
    if (!isAnimal(c)) for (const l of order) {
      if (l === c || isAnimal(l) || l.z <= c.z || l.z - c.z > 30 * SEG_L) continue;   // the lane test below also holds a passing vehicle back until it has cleared the one it is passing sideways
      if (Math.abs(l.o - c.o) >= HALF[l.kind] + HALF[c.kind]) continue;              // not in the same lane
      if (!blocker || l.z < blocker.z) blocker = l;
      v = Math.min(v, (l.vNow ?? l.v) + Math.max(0, l.z - c.z - FOLLOW_GAP) / (3 * SEG_L) * 0.12);   // ease up to the leader's speed as the gap closes
      if (l.z - c.z < FOLLOW_GAP) c.z = l.z - FOLLOW_GAP;                             // and never closer than the gap
    }
    // overtaking: pull out around a slower vehicle in the left lane if the right lane is clear, and stay out until the next one is passed too
    let slower: Car | undefined;                                                          // the nearest slower vehicle ahead in the left lane, found in one pass
    if (!isAnimal(c)) for (const l of order) {
      if (l === c || isAnimal(l) || l.z <= c.z) continue;
      const lv = l.vNow ?? l.v;
      if (l.z - c.z < 3 * SEG_L + Math.max(0, c.v - lv) * maxS * 1.6 && lv < c.v - 0.02 && Math.abs(l.o - LEFT) < HALF[l.kind] + HALF[c.kind] && (!slower || l.z < slower.z)) slower = l;
    }
    if (c.pass && c.z > c.pass.z + 4 * SEG_L) c.pass = slower && !c.yieldT && rightFree(cars, c, playerZ, px) ? slower : undefined;
    else if (!c.pass && slower && !c.yieldT && rightFree(cars, c, playerZ, px)) c.pass = slower;
    c.vNow = v;
    c.z += v * maxS * dt;
    if (c.lat) {                                                                        // animals cross once you are close, hurrying if you honk
      if (c.z - playerZ < 60 * SEG_L && Math.abs(c.o) < 3) c.o += c.lat * (c.hurry && c.hurry > 0 ? 2.6 : 1) * dt;
      if (c.hurry) c.hurry -= dt;
      continue;
    }
    if (c.yieldT && c.yieldT > 0) { c.yieldT -= dt; c.pass = undefined; c.o += (-0.9 - c.o) * Math.min(1, dt * 2.5); }   // pulled over after a honk
    else { const goal = c.pass ? RIGHT : LEFT; if (c.o !== goal) c.o += (goal - c.o) * Math.min(1, dt * 1.5); }
  }
}

export function capBehind(cars: Car[], playerZ: number, px: number, speed: number, maxS: number): { speed: number; blocker?: Car } {
  const c = carAhead(cars, playerZ, px, 6 * SEG_L);
  // slow down smoothly behind it: the closer you get, the nearer to its speed you are held
  return c ? { speed: Math.min(speed, c.v * maxS + Math.max(0, c.z - playerZ - 2 * SEG_L) * 5), blocker: c } : { speed };
}

/** Draw traffic from behind (facing away), size = screen scale k. */
/** Other traffic, seen from behind and drawn to the same scale as the road: `k` is pixels per unit. */
export function drawCar(kind: Kind, sx: number, sy: number, k: number, t = 0) {
  const s = k;
  if (s < 0.14) return;
  if (isBliss() && drawBlissCar(kind, sx, sy, s, t)) return;                                          // in the Bliss land the army trucks are tractors and the yaks are cows
  if (kind === 'army') {
    at(sx, sy, s, () => {
      oval(0, 0, 38, 5, '#00000055');
      box(-24, -9, 12, 9, '#141416'); box(12, -9, 12, 9, '#141416');                                       // rear wheels
      box(-30, -14, 60, 7, '#2a2c2e');                                                                       // bumper
      box(-29, -30, 58, 17, vgrad(-30, -13, [[0, '#4a5a38'], [1, '#33402a']]));                              // tailgate
      box(-26, -12, 6, 4, '#d8342b'); box(20, -12, 6, 4, '#d8342b');                                         // tail lamps
      rrect(-11, -26, 22, 8, 1, '#e8b923'); box(-8, -24, 16, 1, '#1b1712'); box(-8, -21, 16, 1, '#1b1712'); // plate
      rrect(-30, -74, 60, 46, 7, hgrad(-30, 30, [[0, '#3f4f30'], [0.45, '#5b6c45'], [1, '#3a4a2c']]));        // canvas hood
      for (const x of [-18, -6, 6, 18]) box(x - 0.5, -72, 1.2, 42, '#00000030');                            // its ribs
      box(-18, -80, 36, 8, '#33402a');                                                                       // the cab roof above it
      poly([-26, -72, -30, -72, -30, -30, -26, -30], '#ffffff14');
      for (let i = 0; i < 3; i++) { const p = (t * 0.7 + i / 3) % 1; g.globalAlpha = (1 - p) * 0.22; oval(Math.sin(i * 4 + t) * 8, -6 - p * 26, 12 + p * 20, 5 + p * 8, '#d8c4a0'); }   // a little dust off the tyres
      g.globalAlpha = 1;
    });
  } else if (kind === 'goats') {
    at(sx, sy, s, () => {                                                                                // a small flock walking across the road, side on
      for (const [x, sc, col, ph] of [[-34, 1, '#efe9dc', 0], [-14, 0.9, '#3a332c', 1.3], [6, 1.05, '#b58a5e', 2.1], [26, 0.85, '#efe9dc', 3.2], [44, 0.95, '#6b5646', 4.1]] as const) {
        g.save(); g.translate(x, 0); g.scale(sc, sc);
        const sw = Math.sin(t * 9 + ph) * 3;
        oval(0, 0, 12, 2.2, '#00000040');
        for (const lx of [-7, -3, 3, 7]) stroke([lx, -9, lx + (lx > 0 ? sw : -sw) * 0.6, 0], '#3a332c', 1.5);
        oval(0, -13, 11, 6.5, col); oval(-1, -11, 9, 3.5, 'rgba(255,255,255,0.15)');
        poly([8, -16, 12, -20, 15, -21, 13, -16], col); oval(15, -21, 4, 2.8, col);
        stroke([13, -24, 12, -29], '#5a4a3a', 1.4); stroke([16, -24, 17, -28], '#5a4a3a', 1.4);
        stroke([-11, -15, -14, -18], col, 2);
        g.restore();
      }
    });
  } else if (kind === 'marmot') {
    at(sx, sy, s, () => {
      const sw = Math.sin(t * 22) * 2.5;
      oval(0, 0, 8, 1.6, '#00000040');
      for (const lx of [-4, 4]) stroke([lx, -3, lx + sw * (lx > 0 ? 1 : -1), 0], '#7a5636', 1.4);
      oval(0, -6, 8, 4.6, '#b48a5a'); circle(8, -7, 3, '#a87a4c'); circle(9.2, -7.6, 0.5, '#111'); stroke([-8, -7, -12, -9], '#8a5e3a', 2);
    });
  } else if (kind === 'tanker') {
    at(sx, sy, s, () => {                                                                                // a fuel tanker from behind: a silver drum on a dark chassis, a ladder, red lamps
      oval(0, 0, 38, 5, '#00000055');
      box(-24, -9, 12, 9, '#141416'); box(12, -9, 12, 9, '#141416');
      box(-30, -15, 60, 7, '#2a2c2e'); box(-28, -26, 56, 12, '#3a3c3e');
      box(-26, -12, 6, 4, '#d8342b'); box(20, -12, 6, 4, '#d8342b'); rrect(-9, -24, 18, 7, 1, '#e8b923');
      rrect(-30, -76, 60, 52, 24, hgrad(-30, 30, [[0, '#7d838c'], [0.35, '#e6e9ee'], [0.65, '#c8ccd3'], [1, '#6b7079']]));  // the drum
      box(-30, -54, 60, 3, '#d8342b'); box(-30, -46, 60, 2, '#ffffff33');                                   // a hazard band
      stroke([-18, -30, -18, -66], '#4a4e56', 1.6); stroke([-12, -30, -12, -66], '#4a4e56', 1.6);           // ladder rails
      for (let y = -34; y > -66; y -= 6) stroke([-18, y, -12, y], '#4a4e56', 1.2);
      circle(0, -80, 5, '#4a4e56'); box(-3, -83, 6, 3, '#2a2c2e');                                           // the hatch on top
    });
  } else if (kind === 'tempo') {
    at(sx, sy, s, () => {                                                                                // a white Tempo Traveller from behind: roof carrier, a big rear window, blue stripe
      oval(0, 0, 32, 5, '#00000055');
      box(-22, -8, 10, 8, '#141416'); box(12, -8, 10, 8, '#141416');
      rrect(-26, -15, 52, 7, 3, '#b4b8c0');
      rrect(-27, -60, 54, 46, 6, hgrad(-27, 27, [[0, '#d2d6dc'], [0.4, '#f6f7f9'], [1, '#c4c8cf']]));
      rrect(-22, -55, 44, 20, 3, '#22303c'); poly([-22, -47, -8, -55, -3, -55, -15, -35, -22, -35], '#ffffff22');
      box(-27, -32, 54, 4, '#2c6eb0');
      box(-26, -40, 5, 12, '#d8342b'); box(21, -40, 5, 12, '#d8342b'); rrect(-8, -26, 16, 7, 1, '#f4f2ea');
      stroke([-24, -62, 24, -62], '#2a2c30', 1.4); rrect(-20, -74, 40, 12, 4, '#6b4a2a'); rrect(-10, -78, 20, 7, 3, '#3a6a8a');   // rack, bags and a bedroll
    });
  } else if (kind === 'yak') {
    at(sx, sy, s, () => {                                                                                // three yaks from behind: shaggy rumps, hanging tails, a hairy skirt to the ground
      for (const [x, sc] of [[-22, 0.92], [4, 1], [28, 0.85]] as const) {
        g.save(); g.translate(x, 0); g.scale(sc, sc);
        oval(0, 0, 21, 4, '#00000050');
        for (const lx of [-9, 4]) box(lx, -14, 6, 14, '#1e1912');                                       // hind legs
        oval(0, -30, 21, 19, hgrad(-21, 21, [[0, '#231d15'], [0.5, '#3a3026'], [1, '#231d15']]));       // the broad shaggy body
        poly([-19, -22, -22, -6, -14, -12, -8, -4, -2, -12, 4, -3, 10, -12, 16, -5, 20, -13, 19, -22], '#2a2219'); // long hair hanging like a skirt
        stroke([0, -34, 1, -12], '#15110c', 3.2);                                                        // tail
        oval(-6, -40, 8, 6, '#ffffff10');
        g.restore();
      }
    });
  } else if (kind === 'suv') {
    at(sx, sy, s, () => {
      oval(0, 0, 32, 5, '#00000055');
      box(-22, -8, 10, 8, '#141416'); box(12, -8, 10, 8, '#141416');                                        // wheels
      rrect(-26, -16, 52, 8, 3, '#b4b8c0');                                                                  // bumper
      rrect(-26, -50, 52, 36, 6, hgrad(-26, 26, [[0, '#cfd3d9'], [0.4, '#f0f2f5'], [1, '#c2c6cd']]));        // white body
      rrect(-20, -46, 40, 15, 3, '#22303c'); poly([-20, -40, -6, -46, -2, -46, -14, -31, -20, -31], '#ffffff22'); // rear glass with a glint
      box(-25, -34, 6, 14, '#d8342b'); box(19, -34, 6, 14, '#d8342b');                                       // tail lamps
      rrect(-8, -26, 16, 7, 1, '#f4f2ea');                                                                   // plate
      stroke([-22, -55, 22, -55], '#2a2c30', 1.4);                                                            // roof rails
      rrect(-17, -66, 34, 12, 4, '#6b4a2a'); stroke([-6, -66, -6, -54], '#2a1c10', 1.2); stroke([6, -66, 6, -54], '#2a1c10', 1.2); // luggage strapped on the roof
    });
  } else {
    // another rider: the same drawing as yours, with their own colours and a duffel bag strapped on
    drawRiderAt(g, sx, sy, s * 16, 0, t, 0.6, false, { bag: true, colors: { jacket: '#8a3a2e', jacketLit: '#b04c3a', jacketDark: '#5a231d', helmet: '#2f5a3a', helmetShade: '#1f3d28', stripe: '#f0f0e8', pants: '#3a3428', pantsLit: '#4c4536' } });
  }
}
