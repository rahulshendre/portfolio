// What Rahul wears, designed around the bike instead of picked by eye. The Scrambler's sprite is a warm neutral: warm blacks (hue 33), warm greys, a cream white (#ddd2c2) and, on the forks, a
// mustard gold, with a brown seat. Every outfit here is built on the same plan (the 60-30-10 rule, with the bike and the road as the 60):
//   - the helmet is the tank's cream, never a cold white, with the fork's gold for a stripe;
//   - the jacket is the one big colour, about 30% of the figure, and it has to win against the grey road and the blue dusk, and not melt into Ladakh's own tan hills (so no tan);
//   - the jeans are a dark cool mass, which grounds the figure (value runs light head, mid torso, dark legs, darkest boots);
//   - boots and gloves are leather in the seat's brown family;
//   - the fork gold is the single accent, repeated: helmet stripe, piping, glove cuffs, buckles, about 5%.
// Each ramp runs from deep shadow to highlight and shifts in hue as it climbs (shadows lean cool and purple, highlights warm and yellow), which is what keeps painted colour from looking flat.

/** deepest shadow, shadow, body, light, highlight */
export type Ramp = readonly [string, string, string, string, string];

export interface Outfit {
  jacket: Ramp; jeans: Ramp; leather: Ramp; helmet: Ramp; accent: Ramp; stripe: Ramp | null; visor: Ramp; canvas: Ramp; skin: Ramp;
  band: string;           // the reflective tape
  ink: string;            // the garage's own ink
}

const SHARED = {
  helmet: ['#6f7189', '#a4a6bb', '#d6d4dc', '#f1ece0', '#fffcf3'] as Ramp,          // cream with a cool shadow
  accent: ['#6d4a10', '#a2741c', '#d9a233', '#efc562', '#fbe39a'] as Ramp,          // the fork gold
  stripe: ['#6d4a10', '#a2741c', '#d9a233', '#efc562', '#fbe39a'] as Ramp,          // the helmet's racing stripe: the same gold
  visor: ['#0f1117', '#1a1d27', '#2b3140', '#46506a', '#8aa6bd'] as Ramp,           // smoked, with a sky-coloured glint
  canvas: ['#25241a', '#3d3d29', '#5d5a3c', '#807b55', '#a8a279'] as Ramp,          // the tail roll, a muted khaki so it never shouts
  skin: ['#4a2c22', '#7a4a36', '#a9704c', '#c98f68', '#e2b08a'] as Ramp,
  band: '#ece6d6',
  ink: '#1b1712',
};

/** Three outfits for the same bike. `black` is the default (white helmet, black visor, all black); `rust` and `olive` are the colourful alternatives. */
export const OUTFITS = {
  // burnt orange waxed jacket, near-black indigo jeans, espresso leather: a hero colour, with the bike's own warm neutrals behind it
  rust: {
    ...SHARED,
    jacket: ['#2e1822', '#6b2b1f', '#b04a22', '#e07a38', '#f7b472'] as Ramp,
    jeans: ['#10141d', '#1a2130', '#283450', '#3b4d77', '#5c74a3'] as Ramp,
    leather: ['#140c09', '#24150f', '#3a2619', '#5a3d2b', '#86654a'] as Ramp,
  },
  // heritage olive, the Triumph-and-waxed-cotton look: deep green, indigo denim, chestnut boots
  olive: {
    ...SHARED,
    jacket: ['#1b2014', '#2f3920', '#4b5a2d', '#75854a', '#a3b36f'] as Ramp,
    jeans: ['#151d36', '#22305a', '#324877', '#4c66a0', '#7792c8'] as Ramp,
    leather: ['#1d110b', '#3a2012', '#63391d', '#8a5a35', '#b5835a'] as Ramp,
  },
  // all black, a white helmet and a black visor: the sharpest look for the bike, and the first one he liked. Silver trim (tape, piping, cuffs) lifts the black into form; blue-black shadows keep it from going flat
  black: {
    ...SHARED,
    jacket: ['#08090d', '#13151b', '#22252e', '#383d4a', '#646c7e'] as Ramp,
    jeans: ['#07090e', '#10131b', '#1c212e', '#2d3547', '#4a556d'] as Ramp,
    leather: ['#07070b', '#14141a', '#24242d', '#3b3b47', '#66667a'] as Ramp,
    helmet: ['#737a90', '#aeb5c6', '#dde1ea', '#f6f7fb', '#ffffff'] as Ramp,            // white, with a cool shadow
    accent: ['#3a3d44', '#686c76', '#a0a5b0', '#d0d4dc', '#f2f4f8'] as Ramp,           // silver
    stripe: null,                                                                       // no stripe: a clean white shell
    visor: ['#04050a', '#0a0c11', '#12151c', '#222733', '#5d6a82'] as Ramp,            // black, with a cold glint
    canvas: ['#1c1d19', '#2f3029', '#4a4b41', '#6c6c5f', '#908f80'] as Ramp,           // a dark olive-grey roll, so it never reads as part of the black jeans
    band: '#dfe3ea',
  },
} satisfies Record<string, Outfit>;
export type OutfitName = keyof typeof OUTFITS;

/** The outfit being drawn. Both riders read it when they draw, so a change shows on the next frame (and in the door scene's next sprite). */
export let GEAR: Outfit = OUTFITS.black;
export const setOutfit = (name: OutfitName) => { GEAR = OUTFITS[name]; };
if (typeof location !== 'undefined') {                                                                       // ?outfit=olive or ?outfit=black, to try the others
  const q = new URLSearchParams(location.search).get('outfit');
  if (q && q in OUTFITS) setOutfit(q as OutfitName);
}

const hex = (c: string): [number, number, number] => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
/** Mix two #rrggbb colours. */
export function mixHex(a: string, b: string, t: number): string {
  const p = hex(a), q = hex(b);
  return '#' + [0, 1, 2].map((i) => Math.round(p[i] + (q[i] - p[i]) * t).toString(16).padStart(2, '0')).join('');
}
/** A ramp pulled toward a colour: how the far side of the figure sits back in the dark. */
export const dim = (r: Ramp, toward: string, t: number): Ramp => r.map((c) => mixHex(c, toward, t)) as unknown as Ramp;
