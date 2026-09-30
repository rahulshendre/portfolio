// The bike's motion, done with real forces instead of a speed that simply eases toward a number.
// A Scrambler-sized machine: about 260 kg with the rider, 25 kW at the wheel, a fat rider-and-luggage drag area.
// Full throttle on the flat tops out at 110 km/h because that is where drag eats all the power, not because anything says so.
export const BIKE = { mass: 260, power: 25000, cdA: 1.39, crr: 0.015, traction: 0.5, brake: 0.7 };
const G = 9.81, RHO = 1.2;

/** A relaxed cruise the bike settles to when you are not on the gas or brake (55 km/h), and the top speed (110 km/h), in m/s. */
export const V_CRUISE = 55 / 3.6;
export const V_TOP = 110 / 3.6;

export interface Inputs {
  gas: boolean;
  brake: boolean;
  /** Rise over run of the road under the wheels: positive is uphill. */
  grade: number;
  cruise: number;
  /** A hard ceiling in m/s (a limiter, for the thin air up on the pass). */
  top: number;
  /** How well the tyres bite: 1 on dry tarmac, less in rain and on snow. It limits both drive and braking. */
  grip?: number;
}

/** Advance the speed `v` (m/s) by `dt` seconds. */
export function step(v: number, dt: number, o: Inputs): number {
  const m = BIKE.mass;
  // throttle: all of it with the gas down; otherwise a gentle cruise control opens it just enough to hold the cruise speed, and never brakes
  const throttle = o.brake ? 0 : o.gas ? 1 : Math.min(0.6, Math.max(0, (o.cruise - v) * 0.8));
  const grip = o.grip ?? 1;
  const drive = throttle * Math.min(BIKE.traction * grip * m * G, BIKE.power / Math.max(v, 2));   // grip-limited from a standstill, power-limited once rolling
  const drag = 0.5 * RHO * BIKE.cdA * v * v;
  const rolling = v > 0.1 ? BIKE.crr * m * G : 0;
  const hill = m * G * o.grade;
  const engineBraking = !o.gas && !o.brake && v > o.cruise ? 0.06 * m * G : 0;              // lifting off slows you toward the cruise
  const braking = o.brake && v > 0.05 ? BIKE.brake * grip * m * G : 0;
  const next = v + ((drive - drag - rolling - hill - engineBraking - braking) / m) * dt;
  return Math.min(o.top, Math.max(0, next));
}

/** How much a bike answers its bars: none at a standstill, a slow wobble at walking pace, full authority above about 30 km/h. `v` is in m/s. */
export const agility = (v: number) => (v < 0.3 ? 0 : 0.25 + 0.75 * Math.min(1, v / 9));

/**
 * Sideways speed, in road half-widths per second. Steering pushes it toward a target that scales with how fast you are going, with a
 * little inertia so it never snaps; with no input the bike eases toward `laneError` (target lane minus where you are). Nothing moves
 * sideways when the bike is not moving forward.
 */
export function lateralStep(vx: number, dt: number, o: { v: number; steer: number; laneError: number }): number {
  const a = agility(o.v);
  const want = o.steer ? o.steer * 1.6 * a : Math.sign(o.laneError) * Math.min(Math.abs(o.laneError) * 2.5, 1.1) * a;
  return vx + (want - vx) * Math.min(1, dt * 6);
}
