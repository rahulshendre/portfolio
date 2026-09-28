export interface Projected { x: number; y: number; w: number; s: number; cz: number }

export const CAM_DEPTH = 1 / Math.tan((50 * Math.PI) / 180); // 100 degree field of view

/** Project a road point into screen space. `yk` scales height (kept equal to the 480x270 look). */
export function project(y: number, z: number, camX: number, camY: number, camZ: number, W: number, H: number, HZ: number, roadW: number): Projected {
  const cz = z - camZ, s = CAM_DEPTH / cz, yk = W * 0.28125;
  return { x: Math.round(W / 2 - s * camX * (W / 2)), y: Math.round(H * HZ - s * (y - camY) * yk), w: Math.round(s * roadW * (W / 2)), s, cz };
}
