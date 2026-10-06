// The things a Ladakhi town street is made of: two-storey shopfronts with painted window frames, the welcome gate across the road,
// a fruit stall under an umbrella and a monk walking by. Local unit space, drawn through at().
import { at, box, circle, fit, g, oval, poly, rrect, stroke, shade } from './draw';
import { flagString } from './flags';

const SH = 'rgba(40,24,10,0.22)';

interface Shop { name: string; wall: string; trim: string; accent: string; sign: string; ink: string; awn: [string, string] }
export const SHOPS: Shop[] = [
  { name: 'HOTEL', wall: '#f0ebe0', trim: '#7a3a2a', accent: '#c8392b', sign: '#1b4a2a', ink: '#f4f2ea', awn: ['#c8392b', '#f4f2ea'] },
  { name: 'CAFE', wall: '#e8d8c0', trim: '#2c5aa0', accent: '#e8b923', sign: '#3a2a22', ink: '#ffe08a', awn: ['#2c6eb0', '#f4f2ea'] },
  { name: 'BAKERY', wall: '#f0dca8', trim: '#8a5a3a', accent: '#c8392b', sign: '#7a2a20', ink: '#fff0d0', awn: ['#e8b923', '#c8392b'] },
  { name: 'TRAVELS', wall: '#d8c8a8', trim: '#1b4a2a', accent: '#e8b923', sign: '#2c5aa0', ink: '#ffffff', awn: ['#3c8a48', '#f4f2ea'] },
  { name: 'MOTORS', wall: '#efe6d2', trim: '#3a3a3e', accent: '#e8641f', sign: '#e8641f', ink: '#1b1712', awn: ['#3a3a3e', '#e8b923'] },
  { name: 'STORE', wall: '#e6d2b4', trim: '#5a3a6a', accent: '#d8342b', sign: '#5a3a6a', ink: '#fff6e0', awn: ['#5a3a6a', '#f4f2ea'] },
  { name: 'HOMESTAY', wall: '#f4efe4', trim: '#c8392b', accent: '#3c8a48', sign: '#c8392b', ink: '#fff6e0', awn: ['#c8392b', '#e8b923'] },
  { name: 'CHEMIST', wall: '#ecf0ea', trim: '#2f7a5a', accent: '#2f7a5a', sign: '#2f7a5a', ink: '#ffffff', awn: ['#2f7a5a', '#f4f2ea'] },
];

/** A bazaar shopfront: whitewashed, flat-roofed, with the painted wooden window frames Ladakh is known for, a sign band and a striped awning. */
export function drawShop(sx: number, sy: number, k: number, v = 0) {
  const s = k * 0.9;
  if (s < 0.16) return;
  const P = SHOPS[v % SHOPS.length];
  at(sx, sy, s, () => {
    shade(42, 5);
    poly([-32, 0, 32, 0, -70, 34, -108, 34], 'rgba(34,20,12,0.12)');
    box(-32, -92, 64, 88, P.wall); box(22, -92, 10, 88, 'rgba(60,36,20,0.15)');                      // the wall and its shaded end
    box(-35, -97, 70, 7, '#c8b898'); box(-35, -97, 70, 2, 'rgba(255,255,255,0.35)');                  // the flat roof edge
    for (const x of [-21, 5]) {                                                                       // upstairs windows in painted timber frames
      box(x - 2, -82, 20, 4, P.accent); box(x, -78, 16, 24, P.trim); box(x + 2, -76, 12, 20, '#33475a'); box(x + 7.4, -76, 1.6, 20, P.trim);
      box(x + 2, -76, 12, 5, 'rgba(255,255,255,0.14)');                                               // sky in the glass
    }
    rrect(-31, -50, 62, 13, 2, P.sign);                                                               // the sign band
    fit(P.name, 0, -40.5, 56, 9, P.ink, 700);
    box(-28, -34, 56, 30, '#2b2620');                                                                 // the open front
    box(-26, -32, 30, 22, '#ffd88a'); box(-26, -32, 30, 5, 'rgba(255,255,255,0.22)'); box(-11.5, -32, 1.6, 22, '#2b2620');   // a lit shop window
    box(9, -32, 15, 28, P.trim); box(11, -30, 11, 26, '#6a5040');                                     // the door
    for (let i = 0; i < 8; i++) poly([-32 + i * 8, -36, -24 + i * 8, -36, -25 + i * 8, -28, -33 + i * 8, -28], i % 2 ? P.awn[1] : P.awn[0]);   // the awning
    if (s > 0.3) flagString(-32, -96, 32, -98, 7, v, 0.06);                                            // a string of prayer flags across the parapet
  });
}

/** The welcome gate across the road: whitewashed piers, a painted beam with the town's name, a gold wheel-and-deer finial. */
export function drawGate(sx: number, sy: number, k: number, name = '') {
  if (k < 0.16) return;
  at(sx, sy, k, () => {
    for (const x of [-82, 82]) {
      oval(x, 0, 22, 4, SH);
      box(x - 12, -122, 24, 122, '#f2ede2'); box(x + 4, -122, 8, 122, 'rgba(60,36,20,0.16)');
      box(x - 14, -14, 28, 14, '#a89b84'); box(x - 14, -110, 28, 6, '#b8342b'); box(x - 14, -100, 28, 3, '#e8b923');
      box(x - 15, -128, 30, 6, '#8a5a3a');
    }
    box(-92, -152, 184, 30, '#f6f1e6'); box(-92, -125, 184, 6, '#8a5a3a'); box(-92, -152, 184, 4, '#b8342b');    // the beam
    box(-92, -139, 184, 3, '#e8b923');
    rrect(-66, -148, 132, 20, 3, '#1b4a2a');
    fit(`WELCOME TO ${name}`, 0, -134, 122, 11, '#fff6e0', 700);
    circle(0, -172, 10, '#e8b923'); circle(0, -172, 6, '#f4c95a'); circle(0, -172, 2.4, '#b8342b');            // the dharma wheel on top
    poly([-30, -156, -14, -172, -22, -156], '#e8b923'); poly([30, -156, 14, -172, 22, -156], '#e8b923');       // and a deer either side
    if (k > 0.3) { flagString(-90, -156, -14, -178, 5, 1, 0.03); flagString(90, -156, 14, -178, 5, 3, 0.03); }   // flags rise from the beam ends to the wheel, clear of the name
  });
}

/** A fruit stall: a striped umbrella over a table of apricots and apples, with baskets beside it. */
export function drawStall(sx: number, sy: number, k: number, v = 0) {
  if (k < 0.16) return;
  at(sx, sy, k * 0.9, () => {
    shade(34, 4);
    stroke([0, 0, 0, -78], '#6b4b30', 3);
    for (let i = 0; i < 6; i++) poly([-36 + i * 12, -60, -24 + i * 12, -60, 0, -84], i % 2 ? '#f4f2ea' : (v % 2 ? '#c8392b' : '#2c6eb0'));
    box(-30, -26, 60, 5, '#6b4b30'); box(-28, -21, 4, 21, '#5a4030'); box(24, -21, 4, 21, '#5a4030');         // the table
    for (let i = 0; i < 9; i++) circle(-24 + i * 6, -30 - (i % 2) * 3, 3.6, i % 3 === 0 ? '#e8641f' : i % 3 === 1 ? '#f0a020' : '#c8392b');   // apricots and apples
    oval(-38, -6, 8, 6, '#a07850'); oval(38, -6, 8, 6, '#a07850'); box(-44, -8, 12, 3, '#7a5a3a'); box(32, -8, 12, 3, '#7a5a3a');
  });
}

/** A monk in maroon and saffron, walking along the edge of the road. */
export function drawMonk(sx: number, sy: number, k: number, v = 0) {
  if (k < 0.16) return;
  const step = Math.sin(performance.now() / 260 + v * 2) * 2.2;
  at(sx, sy, k * 1.1, () => {
    shade(11, 2.4);
    stroke([-3, -8, -3 + step, 0], '#3a2a22', 3); stroke([3, -8, 3 - step, 0], '#3a2a22', 3);                  // feet and legs under the robe
    poly([-9, -12, 9, -12, 11, -40, -11, -40], '#8a1f2a'); poly([-9, -12, 0, -12, 0, -40, -11, -40], '#a52a36');   // the maroon robe
    poly([-11, -40, 2, -22, 8, -40, 11, -40, 4, -18, -6, -24], '#e8a51a');                                     // the saffron sash across it
    circle(0, -46, 6, '#c98a5a'); box(-6, -49, 12, 2.4, '#3a2a22');                                             // a shaved head
    stroke([-9, -36, -12, -24], '#a52a36', 3.4); stroke([9, -36, 12, -26], '#a52a36', 3.4);
    if (v % 2) { circle(13, -25, 3, '#d9a441'); stroke([13, -25, 13, -18], '#6b4b30', 1.4); }                  // a hand-held prayer wheel
  });
}

const TOURERS = [
  { bag: '#e8641f', body: '#1b1c20', tank: '#2f4a3a' }, { bag: '#3c8a48', body: '#1b1c20', tank: '#f0ebe0' },
  { bag: '#c8392b', body: '#1b1c20', tank: '#c8b078' }, { bag: '#2c6eb0', body: '#1b1c20', tank: '#2c5aa0' },
];

/** A touring motorbike parked at the roadside, seen from behind, with a roll bag strapped on the rack: Ladakh in summer is full of them. */
export function drawParkedBike(sx: number, sy: number, k: number, v = 0) {
  if (k < 0.16) return;
  const T = TOURERS[v % TOURERS.length];
  at(sx, sy, k * 0.75, () => {
    shade(18, 3.4);
    rrect(-7, -50, 14, 50, 5, '#141416'); for (let i = 0; i < 6; i++) box(-6, -46 + i * 8, 12, 2, '#2c2c30');                    // the rear tyre with its blocks
    stroke([-14, -44, -12, -20], '#2a2a2e', 3); stroke([14, -44, 12, -20], '#2a2a2e', 3);                                        // twin shocks
    rrect(-11, -62, 22, 16, 4, T.body); rrect(-7, -58, 14, 4, 1.5, '#c8392b'); rrect(-5, -50, 10, 4, 1, '#f2eee2');            // tail, lamp and plate
    poly([-14, -70, 14, -70, 12, -62, -12, -62], '#5a3d2b');                                                                    // the seat
    rrect(-16, -92, 32, 24, 6, T.bag); rrect(-16, -92, 32, 6, 3, 'rgba(255,255,255,0.22)'); stroke([-6, -92, -6, -68], '#1b1712', 1.4); stroke([6, -92, 6, -68], '#1b1712', 1.4);   // the roll bag and its straps
    rrect(-12, -104, 24, 12, 4, T.tank);                                                                                        // the tank, over the bag
    stroke([-26, -100, 26, -100], '#1b1c20', 2.6); circle(-27, -100, 3, '#3a3a3e'); circle(27, -100, 3, '#3a3a3e');             // the handlebar
  });
}
