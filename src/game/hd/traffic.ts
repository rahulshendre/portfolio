import { SEG_L } from './track-ladakh';
import { at, box, circle, oval, poly, stroke } from './draw';

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
export function drawCar(kind: Kind, sx: number, sy: number, k: number) {
  const s = k;
  if (s < 2) return;
  if (kind === 'army') {
    at(sx, sy, s, () => {
      box(-28, -48, 56, 40, '#4a5a38'); // canvas
      box(-30, -20, 60, 18, '#3a4a30'); // bed
      box(-22, -58, 44, 14, '#3a4a30'); // cab
      box(-16, -54, 12, 8, '#1a2a18');
      box(4, -54, 12, 8, '#1a2a18');
      circle(-18, -4, 7, '#1a1a1a');
      circle(18, -4, 7, '#1a1a1a');
      box(-8, -62, 16, 4, '#e8b923'); // star bar
    });
  } else if (kind === 'suv') {
    at(sx, sy, s, () => {
      poly([-24, -8, -22, -36, 22, -36, 24, -8], '#d8dce0');
      box(-18, -48, 36, 14, '#c0c4c8');
      box(-14, -44, 12, 8, '#3a5060');
      box(2, -44, 12, 8, '#3a5060');
      circle(-16, -4, 6, '#1a1a1a');
      circle(16, -4, 6, '#1a1a1a');
      box(-6, -12, 12, 4, '#e8b923'); // plate
    });
  } else {
    at(sx, sy, s, () => {
      circle(-10, -8, 7, '#1a1a1a');
      circle(12, -8, 7, '#1a1a1a');
      stroke([-10, -8, 4, -22, 12, -8], '#c8c4bc', 2.2);
      stroke([4, -22, 4, -34], '#2a2e36', 2);
      circle(4, -42, 6, '#f4f2ea'); // white helmet
      oval(4, -28, 8, 10, '#2b2e36'); // jacket
    });
  }
}
