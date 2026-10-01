// The streets of a Bliss village, in place of the Ladakhi bazaar: brick-and-timber shopfronts with striped awnings, a welcome arch of stone and wood, a farm-produce stand,
// villagers in straw hats, parked bicycles, Victorian lamp posts and a tollhouse. Same unit space as town.ts.
import { at, box, circle, fit, g, oval, poly, rrect, stroke, vgrad } from './draw';
import { bunting, SH } from './country';

const clock = () => performance.now() / 1000;

interface Shop { name: string; wall: string; lit: string; trim: string; roof: string; roofLit: string; sign: string; ink: string; awn: [string, string]; brick?: boolean }
export const BLISS_SHOPS: Shop[] = [
  { name: 'BAKERY', wall: '#f4e6c0', lit: '#fff4d8', trim: '#7a3a2a', roof: '#bd4f36', roofLit: '#dd6b4a', sign: '#7a2a20', ink: '#fff0d0', awn: ['#d8503c', '#f4f2ea'] },
  { name: 'CAFE', wall: '#e4efe8', lit: '#f4faf6', trim: '#2c5aa0', roof: '#56626e', roofLit: '#74828f', sign: '#2c5aa0', ink: '#ffe08a', awn: ['#3c7ab8', '#f4f2ea'] },
  { name: 'BOOKS', wall: '#b4553f', lit: '#cc6a52', trim: '#2f4a3a', roof: '#56626e', roofLit: '#74828f', sign: '#2f4a3a', ink: '#f0e4c0', awn: ['#2f6a4a', '#f4f2ea'], brick: true },
  { name: 'FLOWERS', wall: '#f6e4ec', lit: '#fff2f6', trim: '#a84a72', roof: '#8a4a60', roofLit: '#a8607a', sign: '#a84a72', ink: '#ffffff', awn: ['#e878a8', '#f4f2ea'] },
  { name: 'GROCER', wall: '#efe6d2', lit: '#fbf4e2', trim: '#3a6a2a', roof: '#bd4f36', roofLit: '#dd6b4a', sign: '#3a6a2a', ink: '#fff6e0', awn: ['#58a040', '#f4f2ea'] },
  { name: 'DAIRY', wall: '#f2f4f6', lit: '#ffffff', trim: '#3c7ab8', roof: '#5a6a7a', roofLit: '#788898', sign: '#3c7ab8', ink: '#ffffff', awn: ['#3c7ab8', '#ffffff'] },
  { name: 'HARDWARE', wall: '#b8553f', lit: '#d06a52', trim: '#3a3a3e', roof: '#3e4650', roofLit: '#5a6470', sign: '#e8641f', ink: '#1b1712', awn: ['#3a3a3e', '#e8b923'], brick: true },
  { name: 'POST', wall: '#e8d8b4', lit: '#f6ecd0', trim: '#a82a24', roof: '#8a5a3a', roofLit: '#a8744c', sign: '#a82a24', ink: '#fff6e0', awn: ['#a82a24', '#f4f2ea'] },
];

/** A shop on the village street: two storeys, a tiled roof with a chimney, a big window of goods under a striped awning, a hanging sign and pots of flowers. */
export function drawShopfront(sx: number, sy: number, k: number, v = 0) {
  const s = k * 0.9;
  if (s < 0.16) return;
  const P = BLISS_SHOPS[v % BLISS_SHOPS.length];
  at(sx, sy, s, () => {
    oval(0, 0, 44, 5, SH); poly([-32, 0, 32, 0, -70, 30, -108, 30], 'rgba(24,52,12,0.12)');
    box(-32, -88, 64, 88, P.wall); box(10, -88, 22, 88, P.lit);
    if (P.brick) for (let r = 0; r < 17; r++) for (let c = 0; c < 8; c++) box(-32 + c * 8 + (r % 2) * 4, -87 + r * 5.2, 7, 0.7, 'rgba(0,0,0,0.18)');
    poly([-39, -88, 39, -88, 28, -108, -28, -108], P.roof); poly([0, -88, 39, -88, 28, -108, 0, -108], P.roofLit);      // the roof, seen from the front
    for (let r = 1; r < 5; r++) stroke([-39 + r * 2.2, -88 - r * 4, 39 - r * 2.2, -88 - r * 4], 'rgba(0,0,0,0.2)', 0.8);
    box(14, -122, 9, 18, '#9a5a46'); box(12.5, -124, 12, 3.4, '#6a3a2e');
    for (const x of [-22, 6]) { box(x - 2, -80, 20, 18, '#f6f1e6'); box(x, -78, 16, 14, vgrad(-78, -64, [[0, '#8fb4d4'], [1, '#4f6f8f']])); box(x + 7.4, -78, 1.4, 14, '#f6f1e6'); box(x - 3, -62, 22, 4, '#7a4a2e'); for (let i = 0; i < 5; i++) circle(x + i * 4.2, -63, 2, ['#e8503a', '#f4c430', '#ff9ac2', '#ffffff', '#e8503a'][i]); }
    rrect(-31, -54, 62, 13, 2, P.sign); box(-31, -54, 62, 1.4, 'rgba(255,255,255,0.3)');
    fit(P.name, 0, -44.5, 54, 9, P.ink, 800);
    box(-30, -38, 60, 34, '#2b2620'); box(-28, -36, 32, 26, vgrad(-36, -10, [[0, '#ffe29a'], [1, '#ffb860']])); box(-12.6, -36, 1.6, 26, '#2b2620');           // the lit shop window
    for (let i = 0; i < 5; i++) circle(-24 + i * 6, -12, 2.6, ['#e8503a', '#f4c430', '#c8803a', '#e8503a', '#f6e8c0'][(i + v) % 5]);                                // goods
    box(10, -36, 16, 32, P.trim); box(12, -34, 12, 30, '#6a5040'); circle(22, -18, 1.1, '#e8c060'); box(12, -34, 12, 8, 'rgba(255,255,255,0.18)');
    for (let i = 0; i < 8; i++) poly([-32 + i * 8, -40, -24 + i * 8, -40, -26 + i * 8, -30, -34 + i * 8, -30], i % 2 ? P.awn[1] : P.awn[0]);   // the awning
    stroke([32, -66, 52, -66], '#2a2420', 1.6); rrect(40, -64, 18, 14, 2, P.sign); circle(49, -57, 4, P.ink);                                                         // a hanging sign on an iron arm
    for (const [x, c] of [[-40, '#e8503a'], [-36, '#f4c430'], [38, '#ff9ac2']] as const) { rrect(x - 3, -8, 6, 8, 1.5, '#a8643a'); circle(x, -11, 3, c); circle(x - 1.6, -9.6, 2, '#4a8a34'); }
    if (s > 0.3) bunting(-34, -90, 34, -92, 7, v, 0.06);
  });
}

/** The welcome arch across the road: stone piers with ball finials, a painted board between them, baskets of flowers and bunting. */
export function drawWelcomeArch(sx: number, sy: number, k: number, name = '') {
  if (k < 0.16) return;
  at(sx, sy, k, () => {
    for (const x of [-82, 82]) {
      oval(x, 0, 24, 4, SH);
      box(x - 13, -128, 26, 128, '#bcb29e'); box(x + 3, -128, 10, 128, 'rgba(0,0,0,0.14)');
      for (let r = 0; r < 12; r++) for (let c = 0; c < 2; c++) box(x - 13 + c * 13 + (r % 2) * 6, -126 + r * 10.4, 12, 0.8, 'rgba(0,0,0,0.2)');
      box(x - 16, -134, 32, 7, '#d4cbb8'); box(x - 16, -12, 32, 12, '#a29886'); circle(x, -146, 9, '#cfc6b4'); circle(x + 3, -148, 4, 'rgba(255,255,255,0.4)');
      stroke([x, -118, x, -100], '#4a3a2a', 1); circle(x, -92, 12, '#7a5640'); for (let i = 0; i < 6; i++) circle(x - 9 + i * 3.6, -97 + (i % 2) * 3, 4, ['#e8503a', '#f4c430', '#ff9ac2', '#ffffff', '#e8503a', '#58a040'][i]);   // a hanging basket
    }
    box(-94, -156, 188, 28, '#7a5640'); box(-94, -158, 188, 4, '#9a7254'); box(-94, -132, 188, 4, '#5a3a24');
    rrect(-68, -151, 136, 20, 3, '#f0e4c0'); box(-68, -151, 136, 2, '#c8a860');
    fit(`WELCOME TO ${name}`, 0, -137, 124, 11, '#5a3a24', 800);
    bunting(-94, -158, -14, -176, 6, 1, 0.04); bunting(94, -158, 14, -176, 6, 4, 0.04); circle(0, -178, 6, '#e8503a'); circle(0, -178, 2.4, '#f4c430');
  });
}

/** A farm-produce stand: a striped awning over crates of apples, pumpkins and carrots, a bucket of flowers, a chalkboard. */
export function drawProduceStand(sx: number, sy: number, k: number, v = 0) {
  if (k < 0.16) return;
  at(sx, sy, k * 0.9, () => {
    oval(0, 0, 36, 4, SH);
    for (const x of [-30, 30]) { stroke([x, -4, x, -74], '#6a4a34', 3); }
    for (let i = 0; i < 6; i++) poly([-36 + i * 12, -58, -24 + i * 12, -58, -22 + i * 12, -72 + (i % 2) * 0, -34 + i * 12, -72], i % 2 ? '#f4f2ea' : (v % 2 ? '#d8503c' : '#3c7ab8'));
    for (let i = 0; i < 6; i++) poly([-36 + i * 12, -58, -24 + i * 12, -58, -30 + i * 12, -50], i % 2 ? '#f4f2ea' : (v % 2 ? '#d8503c' : '#3c7ab8'));
    box(-32, -26, 64, 5, '#8a6a46'); box(-30, -21, 4, 21, '#6a4a34'); box(26, -21, 4, 21, '#6a4a34');
    for (let i = 0; i < 8; i++) circle(-26 + i * 7.4, -30 - (i % 2) * 2.6, 3.8, i % 3 === 0 ? '#e8641f' : i % 3 === 1 ? '#d8302a' : '#7ab648');   // pumpkins, apples, pears
    rrect(-34, -12, 20, 10, 2, '#a8743c'); for (let i = 0; i < 4; i++) poly([-32 + i * 4.4, -12, -29 + i * 4.4, -12, -30.5 + i * 4.4, -20], '#e8803a');   // a crate of carrots
    box(-8, -12, 18, 10, '#c8a06a'); circle(1, -12, 6, '#f6e8c0');
    rrect(-52, -10, 12, 10, 2, '#7a8a96'); for (let i = 0; i < 4; i++) { stroke([-50 + i * 3, -10, -50 + i * 3, -18], '#3f7a2a', 1.2); circle(-50 + i * 3, -19, 2.4, ['#f4c430', '#ff9ac2', '#ffffff', '#e8503a'][i]); }
    rrect(36, -34, 18, 24, 2, '#2a3a2a'); box(38, -32, 14, 20, '#34483a'); stroke([40, -26, 50, -26], '#f4f2ea', 1); stroke([40, -21, 48, -21], '#f4f2ea', 1); stroke([42, -16, 50, -16], '#f4f2ea', 1);   // a chalkboard
  });
}

/** A villager walking along the lane: a farmer in a straw hat with a pitchfork, a woman with a basket, a child with a kite. */
export function drawVillager(sx: number, sy: number, k: number, v = 0) {
  if (k < 0.16) return;
  const t = clock(), step = Math.sin(t * 3.4 + v * 2) * 2.4, kind = v % 3;
  at(sx, sy, k * 1.1, () => {
    oval(0, 0, 11, 2.4, SH);
    const skin = '#e8b890';
    if (kind === 0) {                                                                                          // a farmer
      stroke([-3, -10, -3 + step, 0], '#3a3028', 3); stroke([3, -10, 3 - step, 0], '#3a3028', 3);
      poly([-7, -14, 7, -14, 8, -36, -8, -36], '#3c6e9a'); poly([-7, -14, 0, -14, 0, -36, -8, -36], '#4a82b4'); poly([-6, -36, 6, -36, 5, -42, -5, -42], '#f2ece0');
      stroke([-8, -34, -11, -22], '#f2ece0', 3.2); stroke([8, -34, 12, -26], '#f2ece0', 3.2);
      circle(0, -48, 5.4, skin); circle(-1.8, -48.4, 0.7, '#2a2420'); circle(1.8, -48.4, 0.7, '#2a2420'); stroke([-1.6, -45.6, 1.6, -45.6], '#9a5a3a', 0.8); poly([-9, -50, 9, -50, 5, -52, 4, -58, -4, -58, -5, -52], '#d8bc60'); box(-9, -51, 18, 2, '#b8963e');
      stroke([13, -26, 13, -60], '#6a4a30', 1.4); for (const x of [11, 13, 15]) stroke([x, -60, x, -66], '#9aa0a8', 1);
    } else if (kind === 1) {                                                                                   // a woman with a basket
      stroke([-2, -10, -2 + step, 0], '#3a3028', 2.6); stroke([2, -10, 2 - step, 0], '#3a3028', 2.6);
      poly([-9, -12, 9, -12, 5, -36, -5, -36], '#d8503c'); poly([-9, -12, 0, -12, 0, -36, -5, -36], '#e8685a'); box(-5, -26, 10, 12, '#f6f1e6');
      stroke([-5, -34, -8, -22], skin, 2.6); stroke([5, -34, 10, -22], skin, 2.6);
      circle(0, -42, 5, skin); circle(-1.8, -42.4, 0.7, '#2a2420'); circle(1.8, -42.4, 0.7, '#2a2420'); stroke([-1.6, -39.8, 1.6, -39.8], '#b04a3a', 0.8); oval(0, -45, 9, 2.4, '#e8d8a0'); poly([-5, -46, 5, -46, 3, -51, -3, -51], '#e8d8a0'); stroke([-4, -41, -6, -34], '#6a3a20', 3);
      rrect(8, -26, 13, 9, 2, '#a8743c'); stroke([9, -26, 14, -33, 20, -26], '#7a5a38', 1.2); for (let i = 0; i < 3; i++) circle(10 + i * 4, -27, 2.2, ['#e8503a', '#f4c430', '#ff9ac2'][i]);
    } else {                                                                                                   // a child with a kite
      stroke([-2, -8, -2 + step, 0], '#3a3028', 2.4); stroke([2, -8, 2 - step, 0], '#3a3028', 2.4);
      poly([-6, -10, 6, -10, 5, -28, -5, -28], '#f4c430'); poly([-6, -10, 0, -10, 0, -28, -5, -28], '#f8d85a');
      stroke([-5, -26, -9, -18], skin, 2.2); stroke([5, -26, 9, -40], skin, 2.2);
      circle(0, -34, 4.8, skin); circle(-1.6, -34.4, 0.7, '#2a2420'); circle(1.6, -34.4, 0.7, '#2a2420'); stroke([-1.4, -31.8, 1.4, -31.8], '#b04a3a', 0.8); poly([-5, -35, 5, -35, 4, -41, -4, -41], '#8a4a2a');
      stroke([9, -40, 24, -66], '#e8e2d4', 0.8); const w = Math.sin(t * 2) * 2; poly([24 + w, -86, 33 + w, -72, 24 + w, -60, 15 + w, -72], '#e8503a'); poly([24 + w, -86, 33 + w, -72, 24 + w, -72], '#f4c430');
      stroke([24 + w, -60, 20 + w, -52], '#4aa0d8', 1); stroke([20 + w, -52, 24 + w, -46], '#f4c430', 1);
    }
  });
}

const BIKES = [{ body: '#3c7ab8', bag: '#a8743c' }, { body: '#d8503c', bag: '#3a3a3e' }, { body: '#58a040', bag: '#e8c060' }, { body: '#f4c430', bag: '#6a4a30' }];

/** A vintage bicycle leaning at the kerb, side on: spoked wheels, a diamond frame, a saddle, a basket of flowers on the bars, a bell. */
export function drawBicycle(sx: number, sy: number, k: number, v = 0) {
  if (k < 0.16) return;
  const B = BIKES[v % BIKES.length], f = v % 2 ? 1 : -1;
  at(sx, sy, k * 0.9, () => {
    g.scale(f, 1);
    oval(0, 0, 36, 3, SH);
    for (const x of [-22, 22]) {
      circle(x, -17, 17, '#1a1a1e'); circle(x, -17, 15, '#e8e4d8'); circle(x, -17, 13.4, '#8fc0a0'); circle(x, -17, 13.2, '#8fc0a0');                       // tyre and rim (the inside shows the grass)
      g.globalAlpha = 0.8; circle(x, -17, 13.2, '#cfe4d0'); g.globalAlpha = 1;
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI; stroke([x - Math.cos(a) * 13, -17 - Math.sin(a) * 13, x + Math.cos(a) * 13, -17 + Math.sin(a) * 13], 'rgba(60,60,64,0.55)', 0.6); }
      circle(x, -17, 2.4, '#9aa0a8');
    }
    stroke([-22, -17, -6, -36], B.body, 2.6); stroke([-6, -36, 12, -36], B.body, 2.6); stroke([12, -36, 22, -17], B.body, 2.6); stroke([-22, -17, 4, -17], B.body, 2.6); stroke([4, -17, -6, -36], B.body, 2.6); stroke([4, -17, 12, -36], B.body, 2.6);
    stroke([-6, -36, -8, -44], '#2a2a30', 2); rrect(-14, -48, 14, 5, 2.5, '#3a2a20');                                                                       // seat post and saddle
    stroke([12, -36, 14, -46], '#2a2a30', 2); stroke([9, -48, 20, -45], '#2a2a30', 2.4); circle(21, -45, 1.6, '#c8c8cc');
    rrect(14, -62, 17, 13, 3, '#b88a54'); stroke([14, -62, 14, -50], '#8a6438', 1); for (let i = 0; i < 5; i++) circle(16 + i * 3.4, -63, 2.4, ['#e8503a', '#f4c430', '#ff9ac2', '#ffffff', '#58a040'][i]);   // the basket
    rrect(-34, -44, 14, 4, 2, '#2a2a30'); rrect(-33, -54, 11, 10, 3, B.bag);                                                                                   // a rack and a bag
    stroke([-22, -17, -2, -22], '#9aa0a8', 1.4); circle(0, -17, 3, '#8a8a90'); stroke([0, -17, 6, -9], '#2a2a30', 2);
  });
}

/** A Victorian lamp post: green cast iron on a flared foot, a ladder bar, a glass lantern, a basket of flowers hanging from the arm. */
export function drawLampPost(sx: number, sy: number, k: number) {
  if (k < 0.16) return;
  at(sx, sy, k, () => {
    poly([-60, 0, 60, 0, 86, 22, -86, 22], vgrad(0, 22, [[0, 'rgba(255,214,140,0.34)'], [1, 'rgba(255,214,140,0)']]));
    poly([-3, 0, -30, 0, -8, -108], 'rgba(24,52,12,0.16)');
    poly([-7, 0, 7, 0, 3, -20, -3, -20], '#27402f'); box(-2.6, -100, 5.2, 82, '#2f4a38'); box(-2.6, -100, 1.6, 82, '#4a6a52'); box(-6, -62, 12, 3, '#27402f');
    stroke([-9, -88, 9, -88], '#27402f', 2); circle(-9, -88, 1.8, '#27402f'); circle(9, -88, 1.8, '#27402f');
    poly([-8, -118, 8, -118, 11, -102, -11, -102], 'rgba(255,230,160,0.9)'); poly([-8, -118, 0, -118, 0, -102, -11, -102], 'rgba(255,248,210,0.9)');
    stroke([-8, -118, -11, -102], '#27402f', 1.4); stroke([8, -118, 11, -102], '#27402f', 1.4); poly([-13, -118, 13, -118, 0, -128], '#27402f'); circle(0, -130, 2, '#27402f');
    circle(0, -110, 14, 'rgba(255,224,150,0.28)'); circle(0, -110, 3.6, '#fff4c8');
    stroke([2, -84, 22, -84], '#27402f', 2); stroke([22, -84, 22, -78], '#27402f', 1); circle(22, -70, 9, '#7a5640'); for (let i = 0; i < 5; i++) circle(15 + i * 3.6, -76 + (i % 2) * 3, 3.6, ['#e8503a', '#f4c430', '#ff9ac2', '#ffffff', '#58a040'][i]);
  });
}

/** A tollhouse at the foot of the climb: a little stone lodge, a red-and-white barrier standing open and a flag. */
export function drawTollhouse(sx: number, sy: number, k: number) {
  if (k < 0.16) return;
  at(sx, sy, k, () => {
    oval(0, 0, 46, 5, SH);
    box(-26, -48, 52, 48, '#c0b6a2'); box(8, -48, 18, 48, '#d4cbb8'); box(-28, -6, 56, 6, '#8e8574');
    for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) box(-26 + c * 13 + (r % 2) * 6, -46 + r * 9, 12, 0.8, 'rgba(0,0,0,0.18)');
    poly([-34, -48, 34, -48, 22, -72, -22, -72], '#56626e'); poly([0, -48, 34, -48, 22, -72, 0, -72], '#74828f');
    box(-6, -40, 14, 12, '#ffe29a'); box(-6, -40, 14, 2, '#f6f1e6'); box(-6, -34, 14, 1.4, '#f6f1e6'); rrect(10, -34, 12, 34, 5, '#6a4034');
    rrect(-20, -40, 10, 13, 2, '#7a9ec0');
    box(32, -6, 6, 6, '#3a3a3e'); stroke([36, -4, 41, -56], '#e8e4d8', 4.6);
    for (let i = 0; i < 4; i++) stroke([36.8 + i * 0.9, -12 - i * 11, 37.6 + i * 0.9, -20 - i * 11], '#d8342b', 4.6);
    rrect(-16, -94, 40, 18, 3, '#f0e4c0'); box(-16, -94, 40, 2, '#c8a860'); fit('TOLL · 2 PENCE', 4, -81, 36, 8, '#5a3a24', 800); box(2, -76, 4, 8, '#5a4030');
    const t = clock(); box(-30, -120, 2.4, 50, '#e8e4d8'); poly([-28, -118, -6 + Math.sin(t * 3) * 2, -114, -6 + Math.sin(t * 3 + 1) * 2, -104, -28, -100], '#e8503a'); poly([-28, -100, -6 + Math.sin(t * 3 + 1) * 2, -104, -6 + Math.sin(t * 3 + 2) * 2, -94, -28, -86], '#f4f2ea');
    for (const [x, c] of [[-38, '#f4c430'], [-44, '#ff9ac2'], [44, '#e8503a']] as const) { stroke([x, 0, x, -9], '#3f7a2a', 1.4); circle(x, -10, 2.6, c); }
  });
}

/** A dairy cart: a wooden cart with milk churns, left at the side of the lane (the Himalayan parked truck's cousin for the tea stall). */
export function drawMilkCart(sx: number, sy: number, k: number) {
  if (k < 0.16) return;
  at(sx, sy, k * 0.8, () => {
    oval(0, 0, 40, 4, SH);
    box(-30, -34, 60, 6, '#8a5a30'); box(-30, -40, 60, 6, '#a8743c'); for (const x of [-26, 26]) { circle(x, -14, 14, '#4a3224'); circle(x, -14, 11, '#a8743c'); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI; stroke([x - Math.cos(a) * 11, -14 - Math.sin(a) * 11, x + Math.cos(a) * 11, -14 + Math.sin(a) * 11], '#4a3224', 1.4); } circle(x, -14, 2.6, '#2a1c14'); }
    for (let i = 0; i < 4; i++) { const x = -22 + i * 15; rrect(x - 5, -62, 10, 22, 3, '#d8dce0'); box(x - 6, -64, 12, 4, '#9aa0a8'); box(x - 5, -52, 10, 2, '#3c7ab8'); box(x - 3, -66, 6, 3, '#9aa0a8'); }
    stroke([30, -36, 56, -22], '#6a4a30', 3);
  });
}
