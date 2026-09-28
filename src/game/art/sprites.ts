// Hand-placed pixel art, painted once into offscreen canvases with the crisp primitives.
// Sizes are in pixels at the 480x270 resolution; `ww` is the width in road units for scaling.
import { C } from './palette';
import { paint, type Sprite } from '../engine/sprites';
import { rect, disc, ellipse, line, poly, ctx as paintTarget } from '../engine/pixel';
import { text, textC, textW } from '../engine/font';

/** Rahul on the white Scrambler 400 X, seen from behind. White helmet, dark jacket. */
export function riderRear(): Sprite {
  return paint(56, 64, () => {
    // rear tyre, knobby, with the hugger above it
    rect(23, 46, 10, 18, C.tyre);
    for (let y = 47; y < 63; y += 3) { rect(22, y, 1, 2, C.tyreKnob); rect(33, y, 1, 2, C.tyreKnob); }
    rect(26, 47, 4, 16, '#202020');
    rect(21, 44, 14, 3, C.black);
    // Indian private number plate: white with black characters
    rect(19, 36, 18, 9, C.ink); rect(20, 37, 16, 7, '#f4f2ea');
    for (const x of [21, 24, 28, 31]) rect(x, 39, 2, 3, C.ink);
    // tail light and indicators
    rect(23, 32, 10, 3, C.red); rect(25, 33, 6, 1, '#ff8a6a');
    rect(15, 33, 3, 2, C.reflector); rect(38, 33, 3, 2, C.reflector);
    // exhaust sits on the right
    rect(38, 37, 7, 10, C.steelDark); rect(39, 37, 5, 9, C.steel); rect(40, 45, 3, 2, C.ink);
    // brown seat tail
    rect(20, 29, 16, 4, C.seat); rect(20, 29, 16, 1, '#6e4c36');
    // white tank peeking out beside the hips
    rect(13, 23, 6, 9, C.white); rect(37, 23, 6, 9, C.white);
    rect(13, 30, 6, 2, C.whiteShade); rect(37, 30, 6, 2, C.whiteShade);
    // legs, boots on the pegs
    poly([[11, 25], [20, 25], [21, 40], [15, 42], [11, 34]], C.jeans);
    poly([[36, 25], [45, 25], [45, 34], [41, 42], [35, 40]], C.jeans);
    rect(12, 26, 2, 9, C.jeansLight);
    rect(10, 40, 9, 5, C.black); rect(37, 40, 9, 5, C.black);
    rect(8, 43, 3, 2, C.steelDark); rect(45, 43, 3, 2, C.steelDark);
    // jacket
    poly([[14, 12], [42, 12], [40, 30], [16, 30]], C.jacket);
    poly([[14, 12], [19, 12], [19, 29], [16, 30]], C.jacketLight);
    rect(27, 13, 2, 15, C.jacketLight);
    rect(17, 28, 22, 2, '#23252c');
    // arms out to the bars, gloves, handguards
    poly([[15, 13], [21, 14], [10, 23], [5, 22]], C.jacket);
    poly([[41, 13], [35, 14], [46, 23], [51, 22]], C.jacket);
    rect(3, 20, 6, 5, C.black); rect(47, 20, 6, 5, C.black);
    rect(0, 18, 4, 8, '#2a2a2e'); rect(52, 18, 4, 8, '#2a2a2e');
    // round mirrors on stalks
    line(5, 19, 4, 11, C.black); line(50, 19, 51, 11, C.black);
    disc(4, 8, 3, C.black); disc(51, 8, 3, C.black);
    rect(3, 7, 2, 2, '#8fb3bf'); rect(50, 7, 2, 2, '#8fb3bf');
    // collar and white helmet, outlined in ink so it holds up against a bright sky
    rect(22, 11, 12, 3, '#23252c');
    disc(28, 7, 7, C.ink);
    disc(28, 7, 6, C.white);
    rect(30, 8, 3, 4, C.whiteShade); rect(26, 11, 6, 1, C.whiteShade);
    rect(22, 7, 13, 1, '#b9b6ad');
    rect(24, 2, 3, 2, '#ffffff');
    rect(26, 12, 4, 1, C.reflector);
  }, 233);
}

/** Same rider from above, for the top-down camera. */
export function riderTop(): Sprite {
  return paint(22, 44, () => {
    rect(9, 0, 4, 9, C.tyre); rect(9, 35, 4, 9, C.tyre);
    rect(8, 8, 1, 3, C.gold); rect(13, 8, 1, 3, C.gold);
    rect(2, 10, 18, 2, C.black);
    rect(0, 9, 3, 4, '#2a2a2e'); rect(19, 9, 3, 4, '#2a2a2e');
    disc(3, 6, 1, C.black); disc(18, 6, 1, C.black);
    ellipse(11, 16, 5, 5, C.white); rect(10, 12, 2, 8, C.whiteShade);
    rect(8, 22, 6, 12, C.seat);
    ellipse(11, 23, 8, 4, C.jacket);
    line(4, 22, 3, 12, C.jacket); line(5, 22, 4, 12, C.jacket);
    line(18, 22, 19, 12, C.jacket); line(17, 22, 18, 12, C.jacket);
    rect(9, 26, 5, 6, C.jacket);
    disc(11, 20, 4, C.ink); disc(11, 20, 3, C.white); rect(10, 18, 1, 1, '#ffffff');
    rect(10, 34, 2, 2, C.red);
  }, 233);
}

/** Auto-rickshaw from behind: yellow canopy, black body, yellow commercial plate. */
export function autoRear(): Sprite {
  return paint(48, 44, () => {
    poly([[4, 15], [8, 3], [40, 3], [44, 15]], C.accent);
    rect(9, 3, 30, 2, '#f3cf52');
    rect(3, 15, 42, 3, C.accent);
    rect(3, 18, 42, 2, C.black);
    rect(7, 20, 34, 9, '#2a2620');
    disc(16, 24, 3, '#3b2f27'); disc(29, 23, 3, '#3b2f27');
    rect(12, 26, 9, 3, '#6a4e8a'); rect(25, 26, 9, 3, '#b8563a');
    rect(3, 29, 42, 9, '#1f1f1f'); rect(3, 29, 42, 1, '#3a3a3a');
    rect(17, 31, 14, 5, C.accent); for (const x of [19, 22, 26, 28]) rect(x, 33, 1, 2, C.ink);
    rect(5, 31, 4, 3, C.red); rect(39, 31, 4, 3, C.red);
    rect(4, 37, 7, 7, C.tyre); rect(37, 37, 7, 7, C.tyre);
    rect(6, 39, 3, 3, C.steelDark); rect(39, 39, 3, 3, C.steelDark);
  }, 380);
}

/** Indian goods truck from behind, painted tailgate and all. */
export function truckRear(): Sprite {
  return paint(64, 76, () => {
    rect(10, 0, 44, 6, '#e86a1f'); rect(12, 1, 40, 2, '#f08a45');
    rect(2, 6, 60, 50, '#c8312b');
    rect(4, 8, 56, 5, C.accent); for (let x = 6; x < 58; x += 6) rect(x, 9, 3, 3, '#2c5aa0');
    rect(4, 14, 56, 18, C.white);
    textC('HORN OK', 32, 15, C.red);
    textC('PLEASE', 32, 24, '#2c5aa0');
    rect(4, 33, 56, 3, '#2f8f4e');
    rect(4, 37, 56, 14, '#2c5aa0');
    disc(14, 44, 3, C.accent); disc(32, 44, 4, '#e86a1f'); disc(50, 44, 3, C.accent);
    rect(4, 51, 56, 3, C.accent);
    rect(0, 56, 64, 5, '#1f1f1f');
    rect(3, 57, 6, 3, C.red); rect(55, 57, 6, 3, C.red);
    rect(26, 57, 12, 3, C.accent);
    rect(4, 61, 16, 11, C.tyre); rect(44, 61, 16, 11, C.tyre);
    rect(16, 61, 32, 3, '#111');
    rect(6, 61, 10, 12, C.black); rect(48, 61, 10, 12, C.black);
    for (let x = 7; x < 16; x += 2) { rect(x, 73, 1, 3, C.red); rect(x + 42, 73, 1, 3, C.red); }
  }, 680);
}

export function neem(): Sprite {
  return paint(64, 80, () => {
    rect(29, 46, 6, 34, C.trunk); rect(29, 46, 2, 34, '#6e4f36');
    line(32, 52, 20, 40, C.trunk); line(32, 50, 44, 40, C.trunk);
    disc(32, 30, 20, C.leafDark); disc(18, 36, 13, C.leafDark); disc(46, 36, 13, C.leafDark);
    disc(28, 24, 11, C.leaf); disc(41, 29, 9, C.leaf); disc(19, 32, 8, C.leaf);
    disc(24, 19, 5, C.leafLight); disc(36, 22, 4, C.leafLight); disc(15, 29, 3, C.leafLight);
  }, 900);
}

export function eucalyptus(): Sprite {
  return paint(40, 96, () => {
    rect(18, 30, 4, 66, '#d6ccb9'); rect(18, 30, 1, 66, '#efe7d6'); rect(21, 40, 1, 40, '#b3a68f');
    line(20, 44, 10, 30, '#b3a68f'); line(20, 38, 30, 26, '#b3a68f');
    disc(20, 16, 12, C.leafDark); disc(10, 26, 8, C.leafDark); disc(30, 22, 8, C.leafDark);
    disc(18, 12, 7, '#5f8a53'); disc(28, 18, 5, '#5f8a53'); disc(10, 23, 4, '#5f8a53');
  }, 700);
}

export function chaiStall(label: string): Sprite {
  return paint(72, 56, () => {
    const bw = textW(label) + 10;
    rect(36 - bw / 2, 0, bw, 11, C.ink); textC(label, 36, 2, C.accent);
    rect(0, 11, 72, 10, C.white);
    for (let x = 0; x < 72; x += 8) rect(x, 11, 4, 10, C.red);
    for (let x = 2; x < 72; x += 8) disc(x, 21, 2, C.red);
    rect(4, 21, 3, 35, C.woodDark); rect(65, 21, 3, 35, C.woodDark);
    rect(7, 22, 58, 13, '#3b2f27');
    rect(6, 35, 60, 14, C.wood); rect(6, 35, 60, 2, C.woodDark); rect(6, 42, 60, 1, C.woodDark);
    disc(20, 31, 3, C.steel); rect(18, 27, 4, 1, C.steelDark);
    for (const x of [30, 34, 38]) rect(x, 30, 2, 5, '#e9dcc0');
    rect(0, 49, 72, 7, '#6b5a45');
  }, 1000);
}

/** Green Indian highway direction board. */
export function highwaySign(label: string, sub: string): Sprite {
  const w = Math.max(textW(label), textW(sub)) + 14;
  return paint(w, 44, () => {
    rect(8, 28, 3, 16, C.steelDark); rect(w - 11, 28, 3, 16, C.steelDark);
    rect(0, 0, w, 28, '#f1efe9'); rect(1, 1, w - 2, 26, '#1f6b3a');
    textC(label, w / 2, 4, '#f1efe9');
    textC(sub, w / 2, 15, C.accent);
  }, 1100);
}

/** The garage at the end of the road, seen from the highway. */
export function garageRoadside(): Sprite {
  return paint(170, 110, () => {
    poly([[0, 24], [85, 0], [170, 24]], '#7a4a32');
    rect(4, 24, 162, 86, '#d9cbb2');
    for (let y = 30; y < 110; y += 8) rect(4, y, 162, 1, '#cbbd9f');
    rect(30, 36, 110, 74, '#3a3833');
    for (let y = 38; y < 110; y += 4) rect(31, y, 108, 3, '#8b8f94');
    graffitiTag(40, 58, 1);
    rect(56, 26, 58, 9, C.ink); textC('GARAGE', 85, 27, C.accent);
    rect(0, 106, 170, 4, '#6b5a45');
  }, 3000);
}

/** SHENDRE in chunky outlined letters with drips, like a spray tag. */
export function graffitiTag(x: number, y: number, s: number) {
  const word = 'SHENDRE';
  const w = textW(word, 2 * s);
  for (const [ox, oy] of [[-s, 0], [s, 0], [0, -s], [0, s], [s, s], [2 * s, 2 * s]]) text(word, x + ox, y + oy, C.ink, 2 * s);
  text(word, x, y, C.reflector, 2 * s);
  for (const [dx, len] of [[4, 5], [23, 8], [41, 4], [60, 7], [76, 5]]) if (dx * s < w) rect(x + dx * s, y + 14 * s, s, len * s, C.reflector);
}

/** Pune-outskirts house: flat roof, black rooftop water tank, grilled windows, a shop below. */
export function house(v: number, shop: string): Sprite {
  const body = ['#e8b4a0', '#e9d38a', '#9cc3cf', '#c9d9a6'][v % 4], shade = ['#d49c88', '#d4bd72', '#86adb9', '#b2c48f'][v % 4];
  return paint(96, 92, () => {
    // water tank and its stand on the roof
    rect(58, 0, 18, 14, '#1d1d1d'); rect(58, 0, 18, 2, '#3a3a3a'); rect(60, 3, 2, 9, '#2c2c2c'); rect(56, 14, 22, 2, '#4a4a4a');
    rect(14, 6, 2, 10, '#6b6b6b'); line(10, 6, 20, 6, '#6b6b6b');
    rect(4, 16, 88, 76, body); rect(84, 16, 8, 76, shade); rect(2, 14, 92, 3, '#f1ece0');
    for (const wx of [12, 40]) {
      rect(wx, 26, 20, 16, '#3b4250'); rect(wx, 26, 20, 2, '#f1ece0');
      for (let x = wx + 3; x < wx + 20; x += 4) rect(x, 28, 1, 14, '#d9d4c6');
    }
    rect(8, 46, 80, 3, '#f1ece0'); for (let x = 10; x < 88; x += 5) rect(x, 49, 1, 5, '#8a8577');
    // shop: signboard and a half-open shutter
    rect(8, 56, 80, 11, shop === 'MEDICAL' ? '#1f7a4a' : C.ink);
    if (shop === 'MEDICAL') { rect(13, 58, 6, 2, '#fff'); rect(15, 56, 2, 6, '#fff'); }
    textC(shop, shop === 'MEDICAL' ? 52 : 48, 58, shop === 'MEDICAL' ? '#fff' : C.accent);
    rect(10, 68, 76, 24, '#2c2622');
    for (let y = 68; y < 80; y += 2) rect(10, y, 76, 1, '#8b8f94');
    rect(10, 80, 76, 1, '#5c5f63');
    rect(0, 90, 96, 2, '#7a7060');
  }, 1700);
}

/** A white Indian cow grazing on the verge, hump and horns. */
export function cow(): Sprite {
  return paint(34, 22, () => {
    ellipse(17, 10, 11, 6, '#ecebe6'); rect(9, 3, 7, 5, '#ecebe6');
    ellipse(20, 12, 7, 3, '#d9d7cf');
    rect(26, 9, 7, 5, '#ecebe6'); rect(31, 11, 3, 3, '#caa7a0'); rect(27, 6, 1, 3, '#cdb68a'); rect(31, 6, 1, 3, '#cdb68a');
    for (const x of [8, 12, 21, 25]) { rect(x, 15, 2, 6, '#dcdad2'); rect(x, 20, 2, 1, '#3a3a3a'); }
    line(6, 8, 3, 15, '#bdbab1'); rect(2, 15, 2, 2, '#3a3a3a');
  }, 520);
}

/** MSRTC "Lal Pari" ST bus from behind. */
export function busRear(): Sprite {
  return paint(56, 60, () => {
    rect(2, 2, 52, 50, '#c8312b'); rect(2, 2, 52, 3, '#e05a4c');
    rect(4, 7, 48, 5, C.accent); textC('PUNE', 28, 6, C.ink);
    rect(6, 14, 44, 16, '#2a2d33'); rect(6, 14, 44, 2, '#4a4f58'); rect(27, 14, 2, 16, '#c8312b');
    rect(2, 32, 52, 4, '#f1e4c8');
    textC('ST', 28, 38, '#f1e4c8');
    rect(5, 45, 6, 4, C.accent); rect(45, 45, 6, 4, C.accent);
    rect(21, 46, 14, 5, C.accent); for (const x of [23, 26, 30, 32]) rect(x, 48, 1, 2, C.ink);
    rect(0, 52, 56, 3, '#1f1f1f');
    rect(3, 54, 12, 6, C.tyre); rect(41, 54, 12, 6, C.tyre);
  }, 640);
}

/** A white hatchback from behind. */
export function carRear(): Sprite {
  return paint(44, 32, () => {
    poly([[8, 2], [36, 2], [41, 12], [3, 12]], '#e9e7e1');
    rect(10, 4, 24, 7, '#3a4150'); rect(11, 4, 8, 2, '#5c6678');
    rect(2, 12, 40, 12, '#f1efe9'); rect(2, 12, 40, 1, '#ffffff'); rect(38, 12, 4, 12, '#d6d3cb');
    rect(3, 15, 6, 3, C.red); rect(35, 15, 6, 3, C.red);
    rect(15, 17, 14, 5, '#f4f2ea'); rect(15, 17, 14, 5, '#f4f2ea'); for (const x of [17, 20, 24, 26]) rect(x, 19, 1, 2, C.ink);
    rect(1, 24, 42, 3, '#2a2a2e');
    rect(3, 26, 8, 6, C.tyre); rect(33, 26, 8, 6, C.tyre);
  }, 420);
}

/** Basalt cliff face for the ghat section: layered strata, green ledges, sometimes a waterfall. */
export function rockFace(waterfall: boolean): Sprite {
  return paint(96, 80, () => {
    // Deccan basalt breaks in flat steps, not spikes.
    const top = (x: number) => [6, 10, 8, 14, 9, 7][Math.floor(x / 16) % 6] + (x % 16 === 0 ? 1 : 0);
    for (let x = 0; x < 96; x++) {
      const t = top(x);
      rect(x, t, 1, 80 - t, '#62564b');
      for (let y = t + 3; y < 80; y += 7) rect(x, y + ((x >> 3) % 2), 1, 1, '#4d433a');
      if (x % 9 === 0) rect(x, t + 2, 1, 78 - t, '#584d43');
      rect(x, t, 1, 2, '#4f7d3f');
    }
    for (const [x, y, w] of [[8, 30, 18], [50, 46, 22], [20, 62, 16], [66, 24, 14]]) { rect(x, y, w, 2, '#4f7d3f'); rect(x + 2, y - 2, w - 6, 2, '#6b9a4f'); }
    if (waterfall) {
      for (let y = top(46); y < 76; y++) { rect(44, y, 5, 1, y % 3 ? '#e8f0f2' : '#c9dde2'); if (y % 2) rect(43, y, 1, 1, '#a9c4cc'); }
      ellipse(46, 77, 8, 2, '#c9dde2');
    }
  }, 1400);
}

/** Bonnet macaque sitting on the parapet, the ghat's toll collectors. */
export function monkey(): Sprite {
  return paint(18, 18, () => {
    ellipse(9, 11, 5, 6, '#8a6d52'); disc(9, 4, 4, '#8a6d52'); rect(7, 4, 5, 3, '#d9b8a0');
    rect(7, 4, 1, 1, C.ink); rect(10, 4, 1, 1, C.ink);
    line(13, 14, 17, 9, '#7a5f47'); rect(5, 16, 3, 2, '#7a5f47'); rect(10, 16, 3, 2, '#7a5f47');
  }, 150);
}

export type Icons = Record<'github' | 'x' | 'linkedin' | 'youtube', HTMLImageElement> & { pipecd: HTMLImageElement };

/** Colour a white icon image into a small offscreen canvas (icons ship as white masks). */
export function tint(img: HTMLImageElement, col: string, scale = 1): Sprite {
  return paint(img.width * scale, img.height * scale, () => {
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d')!;
    g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
    const out = paintTarget(); out.imageSmoothingEnabled = false; out.drawImage(c, 0, 0, c.width * scale, c.height * scale);
  });
}
/** Roadside hoarding on two steel posts with lamps, for PipeCD and the socials. Icon left, words right. */
export function hoarding(id: string, icons: Icons): Sprite {
  const spec: Record<string, { bg: string; fg: string; sub: string; a: string; b: string; art: CanvasImageSource & { width: number; height: number } }> = {
    pipecd: { bg: '#f4f2ea', fg: '#293878', sub: '#1f8fc4', a: 'PIPECD', b: 'THE ONE CD|FOR ALL', art: icons.pipecd },
    github: { bg: '#24292f', fg: '#f4f2ea', sub: '#9aa4b0', a: 'GITHUB', b: 'RAHULSHENDRE', art: tint(icons.github, '#f4f2ea') },
    youtube: { bg: '#f4f2ea', fg: '#1b1712', sub: '#c4302b', a: 'VIDEOS', b: 'FROM|OCT 2026', art: tint(icons.youtube, '#ff0000', 2) },
    x: { bg: '#0f0f10', fg: '#f4f2ea', sub: '#9aa0a6', a: 'SAY HI', b: '@SHENDREEE', art: tint(icons.x, '#f4f2ea', 2) },
    linkedin: { bg: '#0a66c2', fg: '#ffffff', sub: '#cfe3f7', a: 'RAHUL', b: 'ON LINKEDIN', art: tint(icons.linkedin, '#ffffff', 2) },
  };
  const s = spec[id];
  return paint(132, 96, () => {
    rect(22, 58, 5, 38, C.steelDark); rect(105, 58, 5, 38, C.steelDark); rect(22, 58, 2, 38, C.steel); rect(105, 58, 2, 38, C.steel);
    rect(20, 70, 92, 3, C.steelDark);
    rect(2, 6, 128, 56, '#3a3d42'); rect(4, 8, 124, 52, s.bg);
    for (const x of [18, 58, 98]) { rect(x, 0, 12, 4, '#2a2a2e'); rect(x + 5, 4, 2, 4, '#2a2a2e'); }
    paintTarget().drawImage(s.art, 10, Math.round(34 - s.art.height / 2));
    const tx = 10 + s.art.width + 8;
    text(s.a, tx, 15, s.fg, 2);
    s.b.split('|').forEach((ln, k) => text(ln, tx, 36 + k * 9, s.sub));
  }, 2000);
}
