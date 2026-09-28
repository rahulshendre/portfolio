import { SEG_L } from './track';

export type Kind = 'auto' | 'truck' | 'bus' | 'car';
export interface Car { z: number; o: number; v: number; kind: Kind; warned?: boolean }

export const LEFT = -0.45;
export const RIGHT = 0.45;

// Everyone keeps left and is slower than a Scrambler, so each one is an overtake.
export const spawnTraffic = (): Car[] => [
  { z: 60 * SEG_L, o: LEFT, v: 0.4, kind: 'auto' },
  { z: 190 * SEG_L, o: LEFT, v: 0.5, kind: 'car' },
  { z: 330 * SEG_L, o: LEFT, v: 0.3, kind: 'truck' },
  { z: 500 * SEG_L, o: LEFT, v: 0.34, kind: 'bus' },
  { z: 640 * SEG_L, o: LEFT, v: 0.4, kind: 'auto' },
  { z: 820 * SEG_L, o: LEFT, v: 0.3, kind: 'truck' },
  { z: 960 * SEG_L, o: LEFT, v: 0.45, kind: 'car' },
];

/** Nearest car ahead of the player within `within` world units whose lane overlaps `px`. */
export function carAhead(cars: Car[], playerZ: number, px: number, within: number, laneTol = 0.3): Car | undefined {
  let best: Car | undefined;
  for (const c of cars) {
    const gap = c.z - playerZ;
    if (gap > 0 && gap < within && Math.abs(c.o - px) < laneTol && (!best || gap < best.z - playerZ)) best = c;
  }
  return best;
}

/** Autopilot: keep left like everyone in India, pull right to overtake anything slow ahead. */
export function autopilotLane(cars: Car[], playerZ: number): number {
  return cars.some((c) => c.o < 0 && c.z > playerZ && c.z - playerZ < 14 * SEG_L) ? RIGHT : LEFT;
}

/** Speed after traffic: you can't ride through a truck, you sit behind it until you pull out. */
export function capBehind(cars: Car[], playerZ: number, px: number, speed: number, maxS: number): { speed: number; blocker?: Car } {
  const c = carAhead(cars, playerZ, px, 4 * SEG_L);
  return c ? { speed: Math.min(speed, c.v * maxS), blocker: c } : { speed };
}
