// The rider seen from behind on the white Scrambler 400 X: shaded vector art with lean, tread motion and a brake light.
// Units: 1 unit = one wheel-hand-span; the whole rider is about 3.2 units tall. (0, 0) is where the rear tyre meets the road.
import { GEAR } from '../art/gear';
import { at, box, circle, g, hgrad, oval, poly, rrect, stroke, use, vgrad } from './draw';

const C = {
  helmet: '#f6f7fb', helmetShade: '#aeb5c6', visor: '#0a0c11', stripe: '#f6f7fb',
  jacket: '#22252e', jacketLit: '#383d4a', jacketDark: '#13151b', band: '#dfe3ea',
  pants: '#1c212e', pantsLit: '#2d3547', boot: '#101015', bootLit: '#1b1b22', glove: '#101015',
  seat: '#5a3d2b', seatLit: '#7a5640', metal: '#b9bec6', metalDark: '#6b7079', black: '#121316', tyre: '#141416',
  red: '#d8342b', amber: '#f0a020', plate: '#f2eee2',
  tank: '#f3f1ea', tankShade: '#c9c6bc', stripe2: '#17181c', fork: '#d9a233',
};

/** The hero's colours, read from the current outfit each frame. */
const outfitColors = () => ({
  helmet: GEAR.helmet[3], helmetShade: GEAR.helmet[1], visor: GEAR.visor[1], stripe: GEAR.stripe?.[2] ?? GEAR.helmet[3],
  jacket: GEAR.jacket[2], jacketLit: GEAR.jacket[3], jacketDark: GEAR.jacket[1], band: GEAR.band,
  pants: GEAR.jeans[2], pantsLit: GEAR.jeans[3], boot: GEAR.leather[1], bootLit: GEAR.leather[2], glove: GEAR.leather[1],
});

export interface Look { colors?: Partial<typeof C>; bag?: boolean; plate?: string; /** the hero rider: dressed in the current outfit (art/gear.ts), the others carry their own colours */ hero?: boolean; }
/** Your registration: Pune, Maharashtra. Other riders on the road carry a Ladakh plate unless they say otherwise. */
export const MY_PLATE = 'MH12';

/** Rear view of the hero rider. `lean` runs -1 (left) to 1 (right); `braking` lights the tail lamp. */
export function drawRider(ctx: CanvasRenderingContext2D, W: number, H: number, lean: number, t: number, speedFrac: number, braking = false, scale = 1) {
  const sc = Math.min(H * 0.074, W * 0.1) * scale;          // pixels per unit
  drawRiderAt(ctx, W / 2 + lean * sc * 0.25, H - Math.max(14, H * 0.03), sc, lean, t, speedFrac, braking, { plate: MY_PLATE, bag: true, hero: true });
}

/** The same rider anywhere on screen, at any size, with their own gear: used for the other riders on the road. */
export function drawRiderAt(ctx: CanvasRenderingContext2D, cx: number, gy: number, sc: number, lean: number, t: number, speedFrac: number, braking = false, look: Look = {}) {
  use(ctx);
  const K = { ...C, ...(look.hero ? outfitColors() : {}), ...look.colors };
  const moving = speedFrac > 0.04;
  const bob = moving ? Math.sin(t * 26) * 0.012 * sc + Math.sin(t * 9) * 0.008 * sc : 0;
  const a = lean * 0.34;                             // roll angle in radians, about 19 degrees at full lean
  const sq = 1 + Math.abs(lean) * 0.22;              // the tyre shows more of its tread when leaned over

  // soft shadow on the road, stretching the way the bike leans
  oval(cx - lean * sc * 0.18, gy + 2, sc * (0.62 + Math.abs(lean) * 0.2), sc * 0.13, '#0000004d');
  oval(cx - lean * sc * 0.18, gy + 2, sc * 0.4, sc * 0.08, '#00000055');

  at(cx, gy + bob, sc, () => {
    g.rotate(a);

    // ---- rear tyre, with a tread that scrolls up as you ride
    const tw = 0.33 * sq;
    rrect(-tw, -1.18, tw * 2, 1.18, 0.16, hgrad(-tw, tw, [[0, '#0a0a0b'], [0.5, K.tyre], [1, '#0a0a0b']]));
    g.save();
    g.beginPath(); g.roundRect(-tw, -1.18, tw * 2, 1.18, 0.16); g.clip();
    const phase = moving ? (t * (2 + speedFrac * 7)) % 1 : 0;
    for (let i = -1; i < 9; i++) {
      const y = -1.2 + (i + phase) * 0.15;
      stroke([-tw * 0.9, y, -tw * 0.14, y - 0.03], '#2c2c30', 0.05); stroke([tw * 0.14, y, tw * 0.9, y - 0.03], '#2c2c30', 0.05);   // knobbly dual-sport blocks with a channel down the middle
      stroke([-tw * 0.55, y - 0.075, -tw * 0.2, y - 0.09], '#1d1d20', 0.04); stroke([tw * 0.2, y - 0.075, tw * 0.55, y - 0.09], '#1d1d20', 0.04);
    }
    g.restore();
    rrect(-tw * 0.16, -1.18, tw * 0.32, 1.18, 0.05, '#ffffff10');

    // ---- swingarm and hub. The 400 X has one shock (hidden behind the tyre), so no twin springs; a chain guard runs down the left
    poly([-0.54, -0.62, -0.36, -0.6, -0.34, -0.5, -0.54, -0.52], K.metalDark);
    poly([0.54, -0.62, 0.36, -0.6, 0.34, -0.5, 0.54, -0.52], K.metalDark);
    circle(0, -0.56, 0.1, K.metal);
    poly([-0.5, -0.66, -0.4, -0.66, -0.4, -1.02, -0.47, -1.04], K.black);
    // pillion peg on the left, hung off a small plate
    poly([-0.6, -0.98, -0.5, -0.98, -0.5, -0.86, -0.6, -0.84], K.metalDark); rrect(-0.76, -0.94, 0.2, 0.07, 0.03, K.metal);

    // ---- the silencer on the right, as on your bike: a black canister swept up past the rear axle, a silver end cap, its mouth facing you
    poly([0.48, -0.46, 0.7, -0.5, 0.76, -0.92, 0.55, -0.98], hgrad(0.48, 0.76, [[0, '#0f1013'], [0.55, '#2a2c32'], [1, '#141519']]));
    poly([0.55, -0.98, 0.76, -0.92, 0.75, -0.9, 0.56, -0.95], '#5a5e66');                                                       // a lit edge along the top
    poly([0.44, -0.5, 0.52, -0.5, 0.54, -0.4, 0.46, -0.4], '#5a5e66');                                                          // the hanger bracket
    oval(0.66, -1.0, 0.115, 0.1, '#b9bec6'); oval(0.66, -1.0, 0.085, 0.072, '#0b0b0d'); oval(0.64, -0.985, 0.03, 0.02, '#3a3d45'); // the round mouth: silver cap, black bore

    // ---- tail: short fender, LED lamp with its light guides, the plate and two LED indicators
    rrect(-0.36, -1.44, 0.72, 0.38, 0.1, hgrad(-0.36, 0.36, [[0, '#1a1b1f'], [0.5, '#2c2e35'], [1, '#1a1b1f']]));
    rrect(-0.27, -1.37, 0.54, 0.09, 0.04, braking ? '#ff4a3a' : '#a82820');
    for (const sd of [-1, 1]) rrect(sd * 0.145 - 0.11, -1.352, 0.22, 0.032, 0.015, braking ? '#ffd0c4' : '#e0584a');           // the two light guides
    if (braking) { g.globalAlpha = 0.5; circle(0, -1.33, 0.36, '#ff3a2a'); g.globalAlpha = 1; }
    rrect(-0.2, -1.24, 0.4, 0.2, 0.02, K.plate);                                                                                  // an Indian plate: black letters on white
    g.fillStyle = '#141416'; g.font = '700 0.105px "IBM Plex Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(look.plate ?? 'LA01', 0, -1.185); g.fillRect(-0.15, -1.12, 0.3, 0.012); g.fillRect(-0.15, -1.09, 0.3, 0.012);
    for (const sd of [-1, 1]) { rrect(sd * 0.47 - 0.04, -1.31, 0.08, 0.06, 0.025, K.amber); stroke([sd * 0.41, -1.28, sd * 0.37, -1.3], K.black, 0.025); }

    // ---- seat, lit from the window side
    poly([-0.4, -1.52, 0.4, -1.52, 0.5, -1.4, -0.5, -1.4], hgrad(-0.5, 0.5, [[0, K.seat], [0.35, K.seatLit], [1, K.seat]]));

    if (look.bag) {
      rrect(-0.62, -2.02, 1.24, 0.62, 0.18, hgrad(-0.62, 0.62, [[0, GEAR.canvas[1]], [0.35, GEAR.canvas[3]], [0.7, GEAR.canvas[2]], [1, GEAR.canvas[0]]]));               // a rolled tail bag strapped over the pillion seat
      rrect(-0.62, -2.02, 1.24, 0.14, 0.07, GEAR.canvas[4]); stroke([-0.24, -2.02, -0.24, -1.4], GEAR.leather[1], 0.05); stroke([0.24, -2.02, 0.24, -1.4], GEAR.leather[1], 0.05);
      rrect(-0.29, -1.78, 0.1, 0.07, 0.02, GEAR.accent[3]); rrect(0.19, -1.78, 0.1, 0.07, 0.02, GEAR.accent[3]);                                                 // the buckles
    }
    // the rider is drawn a touch smaller than life, so the bike carries the picture
    g.save(); g.translate(0, -1.5); g.scale(0.92, 0.92); g.translate(0, 1.5);
    // ---- the white tank, its black stripe and the rubber knee pads: what shows of the bike beside the rider
    poly([-0.72, -1.94, -0.62, -2.36, 0.62, -2.36, 0.72, -1.94, 0.52, -1.7, -0.52, -1.7], hgrad(-0.66, 0.66, [[0, K.tankShade], [0.3, K.tank], [0.7, K.tank], [1, K.tankShade]]));
    box(-0.08, -2.34, 0.16, 0.64, K.stripe2);
    rrect(-0.74, -2.16, 0.22, 0.36, 0.07, K.black); rrect(0.52, -2.16, 0.22, 0.36, 0.07, K.black);
    // ---- legs and boots (the rider sits with knees out a touch)
    for (const s of [-1, 1]) {
      poly([s * 0.2, -1.95, s * 0.5, -1.9, s * 0.62, -1.42, s * 0.5, -1.22, s * 0.26, -1.4],
        hgrad(Math.min(s * 0.2, s * 0.62), Math.max(s * 0.2, s * 0.62), [[0, K.pants], [0.5, K.pantsLit], [1, K.pants]]));       // thigh
      poly([s * 0.46, -1.3, s * 0.7, -1.38, s * 0.62, -0.8, s * 0.44, -0.76], hgrad(Math.min(s * 0.44, s * 0.7), Math.max(s * 0.44, s * 0.7), [[0, K.pants], [0.5, K.pantsLit], [1, K.pants]]));   // shin
      oval(s * 0.6, -1.36, 0.13, 0.11, K.pantsLit); oval(s * 0.6, -1.36, 0.09, 0.075, K.pants);                                       // the knee, gripping the tank
      rrect(s * 0.42 - 0.04, -0.9, 0.3, 0.1, 0.04, '#0f1013');                                                                          // the boot cuff
      rrect(s * 0.44 - 0.05, -0.82, 0.24, 0.34, 0.07, hgrad(s * 0.4, s * 0.68, [[0, K.boot], [0.4, K.bootLit], [1, K.boot]]));       // boot
      rrect(s * 0.44 - 0.07, -0.52, 0.28, 0.07, 0.03, '#0b0b0d');                                                                     // sole
    }

    // upper body leans a little against the bike, so it reads as weight on the pegs
    g.save();
    g.translate(0, -1.9);
    g.rotate(-lean * 0.07);
    g.translate(0, 1.9);

    // ---- handlebar, grips and mirrors, behind the arms
    stroke([-0.82, -2.16, 0.82, -2.16], K.black, 0.07);
    for (const s of [-1, 1]) {
      rrect(s * 0.8 - 0.06, -2.24, 0.12, 0.2, 0.04, K.glove);
      rrect(s * 0.86 - 0.05, -2.4, 0.1, 0.44, 0.05, '#1a1b20'); rrect(s * 0.86 - 0.05, -2.4, 0.03, 0.44, 0.03, '#ffffff1c');   // the black hand guards
      stroke([s * 0.74, -2.2, s * 0.78, -2.62], K.black, 0.03);
      oval(s * 0.8, -2.72, 0.1, 0.07, '#1a1c22');
      oval(s * 0.8, -2.72, 0.07, 0.045, '#8aa3b8');
    }

    // ---- torso: jacket with a back panel, shoulders, reflective band
    poly([-0.46, -2.7, 0.46, -2.7, 0.62, -2.52, 0.5, -2.1, 0.46, -1.82, -0.46, -1.82, -0.5, -2.1, -0.62, -2.52],
      hgrad(-0.62, 0.62, [[0, K.jacketDark], [0.3, K.jacket], [0.62, K.jacketLit], [1, K.jacketDark]]));
    for (const s of [-1, 1]) { oval(s * 0.27, -2.4, 0.17, 0.14, '#ffffff10'); oval(s * 0.27, -2.4, 0.17, 0.14, 'rgba(0,0,0,0.12)'); stroke([s * 0.1, -2.6, s * 0.22, -2.1], '#0000001a', 0.03); }   // shoulder-blade armour
    rrect(-0.48, -1.9, 0.96, 0.1, 0.04, K.jacketDark);                                                                                      // the hem band over the hips
    poly([-0.34, -2.56, 0.34, -2.56, 0.38, -2.06, -0.38, -2.06], '#ffffff12');                         // back panel
    stroke([-0.46, -2.02, 0.46, -2.02], K.band, 0.055);                                                // reflective band
    stroke([0, -2.62, 0, -1.9], K.jacketDark, 0.025);                                                  // spine seam
    poly([-0.62, -2.52, -0.46, -2.7, -0.3, -2.66, -0.4, -2.42], K.jacketLit);                         // shoulder, lit side
    for (const s of [-1, 1]) {
      // arms out to the grips: upper arm to the elbow, forearm forward
      stroke([s * 0.54, -2.56, s * 0.72, -2.34], K.jacket, 0.25);
      stroke([s * 0.72, -2.34, s * 0.79, -2.24], K.jacketDark, 0.19); circle(s * 0.72, -2.34, 0.095, K.jacketLit);   // the elbow
    }

    // ---- helmet: white shell, a red racing stripe and a dark vent
    rrect(-0.12, -2.86, 0.24, 0.2, 0.05, '#7a5238');                                                    // the neck
    poly([-0.26, -2.72, -0.16, -2.9, 0.16, -2.9, 0.26, -2.72, 0.2, -2.64, -0.2, -2.64], K.jacketLit);   // the stand-up collar
    oval(0, -3.0, 0.335, 0.36, vgrad(-3.36, -2.64, [[0, '#ffffff'], [0.5, K.helmet], [1, K.helmetShade]]));
    oval(0, -2.83, 0.3, 0.1, 'rgba(60,56,50,0.35)');                                                     // the shell's lower rim, in shadow
    if (GEAR.stripe) { rrect(-0.04, -3.34, 0.08, 0.6, 0.03, K.stripe); rrect(-0.015, -3.34, 0.02, 0.6, 0.01, GEAR.stripe[4]); }   // the racing stripe, if the helmet has one
    rrect(-0.14, -2.76, 0.28, 0.06, 0.03, '#2a2c33');                                                    // neck roll
    oval(-0.13, -3.13, 0.07, 0.11, '#ffffff66');                                                       // gloss, lit from the left
    g.restore();
    g.restore();
  });

  // exhaust haze at speed
  if (moving) {
    for (let i = 0; i < 3; i++) {
      const p = ((t * 0.9 + i / 3) % 1), x = cx + (0.72 - lean * 0.05) * sc + Math.sin(p * 6 + i) * sc * 0.05, y = gy - sc * (0.85 + p * 0.8);
      g.globalAlpha = (1 - p) * 0.18 * Math.min(1, speedFrac * 1.4);
      circle(x, y, sc * (0.07 + p * 0.12), '#ffffff');
    }
    g.globalAlpha = 1;
  }
}
