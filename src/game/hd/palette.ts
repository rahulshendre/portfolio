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
  // autumn: the same four-way variety as the summer leaf ramps, in red, ochre, scarlet and yellow, each with a cool plum shadow so it stays painted and not orange paste
  autumn0: ['#3d1a1a', '#7a2c1a', '#b4501f', '#dc8a2c', '#f2c24e'],
  autumn1: ['#3a2312', '#6b3d15', '#9a5f1c', '#c98a2b', '#e8b84e'],
  autumn2: ['#431a22', '#85282a', '#c24a2a', '#e8793a', '#f6b25c'],
  autumn3: ['#37281a', '#6a5018', '#9c7d24', '#c9a73a', '#e6d06a'],
  // winter: snow-laden evergreens, grey-green under a heavy white, with a blue shadow
  frost0: ['#14221d', '#243d33', '#3f6454', '#7fa392', '#eef5f1'],
  frost1: ['#161f25', '#27404a', '#42697a', '#84a9b6', '#eff6f8'],
  frost2: ['#18241c', '#2d4430', '#4f7352', '#8fb092', '#f1f7f1'],
  frost3: ['#1a2420', '#2e463c', '#4b6f5c', '#8bae9c', '#f0f6f2'],
  poplarFrost: ['#1d2a26', '#34493f', '#58786a', '#9bb7aa', '#f1f6f3'],
  scrubFrost: ['#4d4a44', '#76736b', '#a39f95', '#cfcbc1', '#eceae3'],
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
