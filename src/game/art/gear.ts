// What Rahul wears, designed around the bike instead of picked by eye. The Scrambler's sprite is a warm neutral: warm blacks (hue 33), warm greys, a cream white (#ddd2c2) and, on the forks, a
// mustard gold, with a brown seat. So the gear is built from the same family:
//   - the helmet is the tank's cream, not a cold white;
//   - the jacket is camel tan, the main colour (about 30% of the figure): warm, mid-light, and the complement of the blue dusk, so it separates from the dark bike and the grey wall;
//   - the jeans are indigo, the one cool mass, to balance the warmth and to ground the figure (value runs light head, mid torso, dark legs, darkest boots);
//   - boots and gloves are the seat's brown, so the leather agrees with the bike;
//   - the mustard of the forks comes back as the helmet stripe, the jacket piping and the glove cuffs: one accent, repeated, about 5%.
// Each ramp runs from deep shadow to highlight, and shifts in hue as it goes (shadows lean cool and purple, highlights lean warm and yellow), which is what keeps painted colour from looking flat.

/** deepest shadow, shadow, body, light, highlight */
export type Ramp = readonly [string, string, string, string, string];

export const GEAR = {
  jacket: ['#3f2f3b', '#6f5442', '#a98254', '#d2ad6d', '#f0d99c'] as Ramp,
  jeans: ['#171f38', '#25345a', '#364b7b', '#50699b', '#7c95c2'] as Ramp,
  leather: ['#1c120e', '#33211a', '#5a3d2b', '#7d5c40', '#a58360'] as Ramp,        // the body of this ramp is the seat's own brown
  helmet: ['#6f7189', '#a4a6bb', '#d6d4dc', '#f1ece0', '#fffcf3'] as Ramp,          // cream, with a cool shadow
  mustard: ['#6d4a10', '#a2741c', '#d9a233', '#efc562', '#fbe39a'] as Ramp,         // the fork gold
  visor: ['#0f1117', '#1a1d27', '#2b3140', '#46506a', '#8aa6bd'] as Ramp,           // smoked, with a sky-coloured glint
  canvas: ['#25241a', '#3d3d29', '#5d5a3c', '#807b55', '#a8a279'] as Ramp,        // the tail roll: khaki-olive canvas, muted so it sits between the tan and the mustard and does not shout
  skin: ['#4a2c22', '#7a4a36', '#a9704c', '#c98f68', '#e2b08a'] as Ramp,
  band: '#ece6d6',          // the reflective tape, a warm white
  ink: '#1b1712',           // the garage's own ink
} as const;

const hex = (c: string): [number, number, number] => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
/** Mix two #rrggbb colours. */
export function mixHex(a: string, b: string, t: number): string {
  const p = hex(a), q = hex(b);
  return '#' + [0, 1, 2].map((i) => Math.round(p[i] + (q[i] - p[i]) * t).toString(16).padStart(2, '0')).join('');
}
/** A ramp pulled toward a colour: how the far side of the figure sits back in the dark. */
export const dim = (r: Ramp, toward: string, t: number): Ramp => r.map((c) => mixHex(c, toward, t)) as unknown as Ramp;
