// Where each panel of a sectional door sits as it rises. Pure geometry, so it can be tested.
// `up` is how far the door has lifted (0 closed, `height` fully open). Y is measured from the top of the opening.
export interface Slot { y: number; h: number }

/**
 * Near the top a panel tilts back onto the track's curve, so it looks shorter. The slope is never above 1, so no panel can grow.
 * `c` is how much the curve has swallowed so far: it ramps in as the door starts to move, so the closed door is exact.
 */
const squash = (y: number, zone: number, c: number) => {
  if (y <= 0) return 0;
  if (y >= zone) return y - c;
  return (zone - c) * Math.pow(y / zone, zone / (zone - c));
};

export function panelSlots(up: number, n: number, height: number): Slot[] {
  const ph = height / n, zone = ph * 0.9, c = 0.35 * zone * Math.min(1, up / zone);
  return Array.from({ length: n }, (_, i) => {
    const top = squash(i * ph - up, zone, c), bottom = squash((i + 1) * ph - up, zone, c);
    return { y: top, h: bottom - top };
  });
}
