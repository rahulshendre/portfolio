// The ride's leaf and bark colours in one place. A ramp runs from the deepest shade to the sunlit spark; every tree and bush is painted from one, so the greens agree.
// They are muted on purpose: the first set was candy (#4f9a35 and friends), which is what made the land read as clip-art. Boards and signs keep their loud colours.

/** deepest shade, shade, body, lit, spark */
export type Ramp = readonly [string, string, string, string, string];

export const RAMPS = {
  leaf0: ['#233f22', '#35602b', '#54803a', '#7ca24d', '#a2c167'],
  leaf1: ['#274423', '#3f6a2f', '#5c8a3b', '#85a951', '#aac56b'],
  leaf2: ['#2e4a21', '#496f2e', '#6a923f', '#93b457', '#b7d078'],   // a yellower tree
  leaf3: ['#223e29', '#345f39', '#4e8244', '#76a458', '#9cc272'],   // a bluer one
  birch: ['#31502a', '#507638', '#7a9c45', '#a5c05d', '#c9d985'],
  poplarGreen: ['#27441f', '#3d6531', '#5b863b', '#84a851', '#aac76c'],
  blossom: ['#9c4a68', '#c4708f', '#e394b0', '#f2b8cb', '#fadbe5'],
  poplarGold: ['#68481a', '#8f6420', '#b88a30', '#d8ae4c', '#eecf78'],
  scrubOlive: ['#3d3a1e', '#5c5629', '#7c733a', '#9d9150', '#bcae6c'],  // Ladakh scrub: dry, grey-olive, never green
  scrubDust: ['#4a3d2a', '#6c5b3d', '#8d795a', '#ae9a76', '#cdbb94'],
} as const satisfies Record<string, Ramp>;
export type RampName = keyof typeof RAMPS;

/** Bark: shade, body, lit. */
export const BARK = {
  dark: ['#33261b', '#55412e', '#7e6447'],
  birch: ['#b3ae9d', '#dedacb', '#f3f0e4'],
} as const;

/** Wildflowers and blossom, a step quieter than pure white, yellow and pink. */
export const BLOOM = ['#f3efe3', '#efd65a', '#e68aad', '#f3efe3', '#86aee6', '#efa64c'];
