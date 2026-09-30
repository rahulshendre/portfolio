import { SEG_L } from './track-ladakh';
import { at, box, g, hgrad, oval, poly, rrect, stroke, vgrad } from './draw';
import { drawRiderAt } from './rider';

export type Kind = 'army' | 'suv' | 'biker';
export interface Car { z: number; o: number; v: number; kind: Kind; warned?: boolean }

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
];

export function carAhead(cars: Car[], playerZ: number, px: number, within: number, laneTol = 0.3): Car | undefined {
  let best: Car | undefined;
  for (const c of cars) {
    const gap = c.z - playerZ;
    if (gap > 0 && gap < within && Math.abs(c.o - px) < laneTol && (!best || gap < best.z - playerZ)) best = c;
  }
  return best;
}

export function autopilotLane(cars: Car[], playerZ: number): number {
  return cars.some((c) => c.o < 0 && c.z > playerZ && c.z - playerZ < 14 * SEG_L) ? RIGHT : LEFT;
}

export function capBehind(cars: Car[], playerZ: number, px: number, speed: number, maxS: number): { speed: number; blocker?: Car } {
  const c = carAhead(cars, playerZ, px, 4 * SEG_L);
  return c ? { speed: Math.min(speed, c.v * maxS), blocker: c } : { speed };
}

/** Draw traffic from behind (facing away), size = screen scale k. */
/** Other traffic, seen from behind and drawn to the same scale as the road: `k` is pixels per unit. */
export function drawCar(kind: Kind, sx: number, sy: number, k: number, t = 0) {
  const s = k;
  if (s < 0.14) return;
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
