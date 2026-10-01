// Rahul's garage, seen from the road at the end of the ride: a brick workshop with a wood-clad wing, a steel-framed bay with the shutter rolled up,
// your own bike standing inside under two dome lamps, a neon sign, and the forecourt clutter (tyres, drums, a chai sign and an old pump).
// Drawn in local units through at(); (0, 0) is the middle of the front wall at ground level.
import { at, box, circle, g, hgrad, label, oval, poly, rnd, rrect, stroke, vgrad } from './draw';
import { flagString } from './flags';
import { bunting } from './country';
import { isBliss } from './land';

/** The garage's own picture of the bike, set by the ride once it has loaded. Until then a simple side-on drawing stands in. */
let bike: HTMLImageElement | null = null;
export const setGarageBike = (img: HTMLImageElement | null) => { bike = img; };

const BIKE_W = 92;

function cast(h: number, w: number, a = 0.17) {
  poly([-w / 2, 0, w / 2, 0, -h * 0.85 + w / 2, h * 0.3, -h * 0.85 - w / 2, h * 0.3], `rgba(34,20,12,${a})`);
}

/** The bike side-on, for the moment before the sprite has loaded: two wheels, the frame, a white tank and the gold forks. */
function bikeStandIn(cx: number) {
  for (const x of [cx - 30, cx + 28]) { circle(x, -15, 14, '#111113'); circle(x, -15, 9, '#8c9098'); circle(x, -15, 6.4, '#17171a'); circle(x, -15, 2, '#c8ccd2'); }
  poly([cx - 30, -15, cx - 8, -34, cx + 10, -36, cx + 28, -15, cx + 6, -22, cx - 10, -18], '#26272b');
  poly([cx - 12, -36, cx + 10, -42, cx + 14, -34, cx - 8, -31], '#f4f2ea'); box(cx - 2, -42, 5, 9, '#17181c');
  stroke([cx + 24, -17, cx + 29, -44], '#d9a233', 3); stroke([cx + 22, -45, cx + 34, -45], '#17171a', 2.4);
}

export function drawGarage(sx: number, sy: number, k: number) {
  const s = k * 0.95;
  if (s < 0.16) return;
  const near = s > 0.4;                                                                      // far away the brickwork is a flat colour with mortar lines
  at(sx, sy, s, () => {
    // warm light spilling across the forecourt, and the building's long shadow
    poly([-70, 0, 70, 0, 160, 60, -160, 60], vgrad(0, 60, [[0, 'rgba(255,196,110,0.55)'], [1, 'rgba(255,196,110,0)']]));
    cast(120, 200, 0.16);

    // ---- the brick wall: a dark foot (damp), a lighter head, and each brick a slightly different tone
    box(-118, -112, 236, 112, vgrad(-112, 0, [[0, '#75503f'], [0.7, '#56382c'], [1, '#3a241c']]));
    if (near) {
      for (let r = 0; r < 18; r++) for (let x = -118 + (r % 2) * 7, n = 0; x < 118; x += 14, n++) {
        const t = rnd(r * 31 + n * 7.3);
        if (t > 0.62) { g.globalAlpha = 0.16 + t * 0.16; g.fillStyle = t > 0.82 ? '#8a5a44' : '#2e1a14'; g.fillRect(Math.max(-118, x), -110 + r * 6, Math.min(13.2, 118 - x), 5.2); }
      }
      g.globalAlpha = 1;
    }
    for (let r = 0; r < 19; r++) box(-118, -111 + r * 6, 236, 0.9, 'rgba(18,9,6,0.4)');                     // mortar courses
    if (near) for (let r = 0; r < 18; r++) for (let x = -118 + (r % 2) * 7; x < 118; x += 14) box(x, -110 + r * 6, 0.8, 6, 'rgba(18,9,6,0.32)');   // and the joints between bricks
    box(-118, -112, 236, 12, 'rgba(255,214,170,0.1)');
    box(-118, -12, 236, 12, 'rgba(0,0,0,0.16)');                                                              // rising damp along the foot of the wall
    box(-124, -124, 248, 14, hgrad(-124, 124, [[0, '#b2a07f'], [0.6, '#cdbd9c'], [1, '#a99676']])); box(-124, -124, 248, 3, '#e3d6b8'); box(-121, -110, 242, 2.5, 'rgba(0,0,0,0.25)');   // the concrete coping and the shadow under it
    // ---- the wood-clad wing on the left, weathered grey-brown
    box(-118, -100, 50, 100, hgrad(-118, -68, [[0, '#6e5238'], [0.5, '#806444'], [1, '#6a4f36']]));
    for (let x = -118; x < -68; x += 6) { box(x, -100, 0.9, 100, 'rgba(0,0,0,0.32)'); if (near) box(x + 2, -100 + rnd(x) * 90, 1.4, 4 + rnd(x + 3) * 8, 'rgba(0,0,0,0.16)'); }
    box(-118, -100, 50, 4, 'rgba(255,255,255,0.1)'); box(-118, -100, 50, 100, 'rgba(255,214,150,0.04)');
    for (let x = -118; x < 118; x += 16) box(x, -8, 8, 8, '#1b1712'), box(x + 8, -8, 8, 8, '#e8b923');       // the hazard stripe along the base
    // a drainpipe, and a fuse box with its wires
    box(112, -112, 4, 112, '#2a2a2e'); box(112, -112, 1.4, 112, '#4a4a50'); for (const y of [-96, -60, -24]) box(110, y, 8, 3, '#1c1c20');
    rrect(96, -58, 11, 14, 1.5, '#8a8f94'); circle(101.5, -51, 2.2, '#3a3a3e'); stroke([101, -44, 101, -36, 108, -30], '#111', 1.2);

    // ---- the bay: a black steel frame with rivets, the shutter rolled up in its box, and the room inside
    box(-62, -96, 124, 96, '#14110e'); box(-62, -96, 124, 4, '#26221d');
    for (let x = -58; x <= 58; x += 10) { circle(x, -93, 0.9, '#4a443c'); }
    for (const x of [-59, 59]) for (let y = -84; y < -4; y += 14) circle(x, y, 0.9, '#4a443c');
    box(-56, -90, 112, 90, vgrad(-90, 0, [[0, '#ffd88a'], [0.55, '#f2a458'], [1, '#b8683a']]));
    box(-56, -90, 112, 26, 'rgba(40,24,14,0.5)');
    for (let y = -90; y < -66; y += 6) box(-56, y, 112, 4, vgrad(y, y + 4, [[0, '#9a9ea3'], [1, '#6f7378']]));   // the rolled-up shutter slats
    box(-56, -66, 112, 2.5, '#4c5056');
    box(-50, -62, 100, 38, 'rgba(60,34,20,0.5)');                                                                // the pegboard
    for (const [x, w, hh] of [[-44, 14, 16], [-26, 8, 12], [-14, 18, 20], [10, 10, 14], [24, 16, 18], [40, 6, 12]] as const) { box(x, -58, w, 3, 'rgba(20,10,6,0.6)'); box(x + w / 2 - 1, -58, 2, hh, 'rgba(20,10,6,0.6)'); circle(x + w / 2, -58 + hh, 2.2, 'rgba(20,10,6,0.6)'); }   // hanging tools
    box(-54, -34, 26, 2.4, '#3a2a20'); box(-52, -32, 2.4, 32, '#3a2a20'); box(-30, -32, 2.4, 32, '#3a2a20'); box(-54, -38, 14, 4, '#c8392b'); rrect(-50, -47, 8, 9, 1, '#d8342b');   // a workbench with a red toolbox
    for (const [x, y] of [[44, -8], [44, -19], [52, -8]] as const) { oval(x, y, 9, 4.6, '#141416'); oval(x, y, 4.6, 2.2, '#2a2a2e'); }                                            // a stack of tyres
    box(-56, -10, 112, 10, '#1d1a17'); box(-56, -10, 112, 1.6, 'rgba(255,255,255,0.08)');                      // the dark display mat
    for (const x of [-30, 30]) {                                                                                 // two dome lamps with their pools of light
      stroke([x, -90, x, -78], '#17130f', 1.6); poly([x - 10, -78, x + 10, -78, x + 7, -68, x - 7, -68], '#17130f'); poly([x - 7, -68, x + 7, -68, x + 24, -38, x - 24, -38], 'rgba(255,232,170,0.16)');
      circle(x, -67, 3.2, '#fff2c0'); circle(x, -67, 9, 'rgba(255,240,190,0.25)');
    }
    // ---- your bike, side-on on the mat, with a contact shadow and a faint reflection in the polished floor
    oval(4, -2, 50, 4, 'rgba(0,0,0,0.45)');
    if (bike) {
      const w = BIKE_W, hh = (w * bike.naturalHeight) / bike.naturalWidth, x0 = 4 - w / 2, y0 = -2 - hh;
      g.save(); g.beginPath(); g.rect(-56, -10, 112, 10); g.clip();
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.globalAlpha = 0.12; g.translate(0, -2); g.scale(1, -0.3); g.drawImage(bike, x0, -hh, w, hh); g.restore();   // a faint reflection in the polished floor
      g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(bike, x0, y0, w, hh); g.restore();
    } else bikeStandIn(4);

    // ---- the neon sign on the roof, on two steel posts, with a tube-glow outline
    rrect(-84, -172, 168, 44, 5, '#1b1712'); rrect(-80, -168, 160, 36, 3, '#2a1a1a');
    g.save(); g.shadowColor = '#ff6a5a'; g.shadowBlur = 16;
    label("RAHUL'S", 0, -150, 17, '#ff8c78', { align: 'center', weight: 700 });
    label('GARAGE', 0, -135, 13, '#ffd0a0', { align: 'center', weight: 700 });
    g.restore();
    stroke([-66, -128, -66, -118], '#17130f', 3); stroke([66, -128, 66, -118], '#17130f', 3); box(-70, -130, 8, 3, '#2a2622'); box(62, -130, 8, 3, '#2a2622');
    // ---- on the roof: a water tank on legs (every Ladakhi roof has one) and a small dish
    if (near) {
      for (const x of [88, 104]) stroke([x, -126, x, -138], '#3a3a3e', 2);
      rrect(84, -156, 26, 18, 3, '#2a2a2e'); box(84, -156, 26, 3, '#3a3a3e'); box(86, -150, 22, 1.2, 'rgba(255,255,255,0.12)');
      stroke([-98, -126, -98, -146], '#2a2a2e', 1.6); circle(-98, -148, 5, '#c8ccd2'); circle(-98, -148, 3, '#8c9098');
    }
    // ---- gooseneck lamps, a lit window on the right and a painted line of type
    for (const x of [-92, 92]) {
      stroke([x, -84, x + (x < 0 ? 10 : -10), -96], '#17130f', 2.2); poly([x + (x < 0 ? 4 : -4), -98, x + (x < 0 ? 16 : -16), -98, x + (x < 0 ? 14 : -14), -90, x + (x < 0 ? 6 : -6), -90], '#17130f');
      circle(x + (x < 0 ? 10 : -10), -94, 3.2, '#fff2c0'); circle(x + (x < 0 ? 10 : -10), -94, 14, 'rgba(255,230,160,0.2)');
    }
    box(70, -80, 34, 34, '#14110e'); box(72, -78, 30, 30, '#ffd88a'); box(86, -78, 2.4, 30, '#14110e'); box(72, -64, 30, 2.4, '#14110e');        // a window with its mullions
    box(72, -78, 30, 7, 'rgba(255,255,255,0.22)'); box(68, -46, 38, 3.4, '#b6a686');                                                              // the glint in the glass, and the sill
    poly([73, -76, 85, -76, 82, -50, 73, -50], 'rgba(40,24,14,0.25)');                                                                            // a curtain
    label('PUNE · MH 12', 0, -114, 4.8, 'rgba(255,240,210,0.55)', { align: 'center', weight: 700 });

    // ---- the forecourt: tyres, drums, a chalkboard, a vintage pump and a potted plant, each with its shadow on the ground
    for (const [x, y] of [[-150, -8], [-150, -22], [-150, -36], [-136, -8]] as const) { oval(x, y, 13, 6.5, '#141416'); oval(x, y, 7, 3.2, '#2a2a2e'); }
    oval(-142, 1, 24, 3, 'rgba(0,0,0,0.3)');
    box(-132, -30, 16, 22, vgrad(-30, -8, [[0, '#3a7060'], [1, '#2a5242']])); box(-132, -30, 16, 3, '#1f4030'); oval(-124, -30, 8, 2.5, '#4a8070'); box(-132, -20, 16, 1.4, 'rgba(0,0,0,0.3)'); oval(-124, 0, 11, 2.4, 'rgba(0,0,0,0.3)');
    box(122, -20, 22, 20, '#e8e0cf'); rrect(126, -16, 14, 12, 1, '#2a2622');
    oval(118, 1, 26, 3, 'rgba(0,0,0,0.3)');
    poly([100, 0, 106, -34, 130, -34, 136, 0], vgrad(-34, 0, [[0, '#d8483a'], [1, '#a82c22']])); rrect(104, -50, 28, 18, 4, '#f4f2ea'); rrect(107, -47, 22, 10, 2, '#e8b923'); box(102, -34, 32, 3, '#17130f');
    circle(118, -40, 3, '#17130f'); circle(118, -40, 1.6, '#e8b923');                                                                              // the pump's dial
    stroke([134, -26, 146, -16, 146, -4], '#17130f', 2);                                                                                          // its hose
    poly([146, 0, 150, -26, 166, -26, 170, 0], '#7a5a3c'); box(150, -24, 16, 20, '#1b2a26'); label('OPEN', 158, -14, 6, '#fff6e0', { align: 'center', weight: 700 }); label('CHAI', 158, -7, 5.5, '#e8b923', { align: 'center', weight: 700 });
    poly([-170, 0, -166, -12, -152, -12, -148, 0], '#2a2622'); for (const [x, y, r] of [[-159, -20, 8], [-153, -26, 6], [-165, -26, 6]] as const) circle(x, y, r, '#4a7a4a');
    // the cat, sitting by the bay
    oval(-72, -3, 9, 3, 'rgba(0,0,0,0.25)'); oval(-72, -9, 6, 8, '#d9d2c4'); circle(-72, -19, 5, '#d9d2c4'); poly([-76, -22, -75, -28, -72, -23], '#d9d2c4'); poly([-68, -22, -69, -28, -72, -23], '#d9d2c4');
    stroke([-66, -6, -62, -10, -60, -14], '#d9d2c4', 2.2); circle(-74, -19, 0.9, '#2a6a4a'); circle(-70, -19, 0.9, '#2a6a4a');
    if (near) { if (isBliss()) bunting(-118, -126, -150, -40, 9, 2, 0.05); else flagString(-118, -126, -150, -40, 9, 2, 0.05); }                  // a string of flags (pennants, in the Bliss land) from the roof corner down to the tyres
  });
}
