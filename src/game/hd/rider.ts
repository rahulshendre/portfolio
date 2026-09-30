// The rider seen from behind on the white Scrambler 400 X: shaded vector art with lean, tread motion and a brake light.
// Units: 1 unit = one wheel-hand-span; the whole rider is about 3.2 units tall. (0, 0) is where the rear tyre meets the road.
import { at, circle, g, hgrad, oval, poly, rrect, stroke, use, vgrad } from './draw';

const C = {
  helmet: '#f4f2ea', helmetShade: '#c9c5b8', visor: '#1c1f26', stripe: '#d8342b',
  jacket: '#2f3747', jacketLit: '#465066', jacketDark: '#1d222d', band: '#d5d9df',
  pants: '#232a38', pantsLit: '#333c50', boot: '#17181c', bootLit: '#34363e', glove: '#141518',
  seat: '#5a3d2b', seatLit: '#7a5640', metal: '#b9bec6', metalDark: '#6b7079', black: '#121316', tyre: '#141416',
  red: '#d8342b', amber: '#f0a020', plate: '#f2eee2',
};

export interface Look { colors?: Partial<typeof C>; bag?: boolean; }

/** Rear view of the hero rider. `lean` runs -1 (left) to 1 (right); `braking` lights the tail lamp. */
export function drawRider(ctx: CanvasRenderingContext2D, W: number, H: number, lean: number, t: number, speedFrac: number, braking = false, scale = 1) {
  const sc = Math.min(H * 0.074, W * 0.1) * scale;          // pixels per unit
  drawRiderAt(ctx, W / 2 + lean * sc * 0.25, H - Math.max(14, H * 0.03), sc, lean, t, speedFrac, braking);
}

/** The same rider anywhere on screen, at any size, with their own gear: used for the other riders on the road. */
export function drawRiderAt(ctx: CanvasRenderingContext2D, cx: number, gy: number, sc: number, lean: number, t: number, speedFrac: number, braking = false, look: Look = {}) {
  use(ctx);
  const K = { ...C, ...look.colors };
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
    const tw = 0.38 * sq;
    rrect(-tw, -1.18, tw * 2, 1.18, 0.16, hgrad(-tw, tw, [[0, '#0a0a0b'], [0.5, K.tyre], [1, '#0a0a0b']]));
    g.save();
    g.beginPath(); g.roundRect(-tw, -1.18, tw * 2, 1.18, 0.16); g.clip();
    const phase = moving ? (t * (2 + speedFrac * 7)) % 1 : 0;
    for (let i = -1; i < 9; i++) {
      const y = -1.2 + (i + phase) * 0.15;
      stroke([-tw * 0.9, y, tw * 0.9, y - 0.03], '#26262a', 0.035);
    }
    g.restore();
    rrect(-tw * 0.16, -1.18, tw * 0.32, 1.18, 0.05, '#ffffff10');

    // ---- swingarm, hub and shocks
    poly([-0.54, -0.62, -0.36, -0.6, -0.34, -0.5, -0.54, -0.52], K.metalDark);
    poly([0.54, -0.62, 0.36, -0.6, 0.34, -0.5, 0.54, -0.52], K.metalDark);
    circle(0, -0.56, 0.1, K.metal);
    for (const s of [-1, 1]) {
      stroke([s * 0.44, -0.6, s * 0.46, -1.28], K.black, 0.13);
      for (let i = 0; i < 5; i++) stroke([s * 0.39, -0.7 - i * 0.11, s * 0.53, -0.74 - i * 0.11], '#c9a043', 0.035); // gold spring
    }

    // ---- exhaust: the high pipe on the right, seen end-on
    poly([0.52, -0.35, 0.64, -0.35, 0.66, -1.05, 0.5, -1.05], vgrad(-1.05, -0.35, [[0, '#d7dbe1'], [1, '#7d828b']]));
    circle(0.58, -1.05, 0.1, K.metalDark);
    circle(0.58, -1.05, 0.065, '#0b0b0d');

    // ---- tail: fender, lamp, plate and indicators
    rrect(-0.36, -1.4, 0.72, 0.34, 0.1, hgrad(-0.36, 0.36, [[0, '#1a1b1f'], [0.5, '#2c2e35'], [1, '#1a1b1f']]));
    rrect(-0.2, -1.32, 0.4, 0.11, 0.03, braking ? '#ff4a3a' : K.red);
    if (braking) { g.globalAlpha = 0.5; circle(0, -1.27, 0.34, '#ff3a2a'); g.globalAlpha = 1; }
    rrect(-0.13, -1.14, 0.26, 0.13, 0.02, K.plate);
    rrect(-0.1, -1.1, 0.2, 0.02, 0.01, '#6a665a');
    for (const s of [-1, 1]) { circle(s * 0.44, -1.26, 0.055, K.amber); stroke([s * 0.4, -1.26, s * 0.37, -1.3], K.black, 0.025); }

    // ---- seat, lit from the window side
    poly([-0.4, -1.52, 0.4, -1.52, 0.5, -1.4, -0.5, -1.4], hgrad(-0.5, 0.5, [[0, K.seat], [0.35, K.seatLit], [1, K.seat]]));

    if (look.bag) { rrect(-0.5, -1.98, 1.0, 0.58, 0.14, '#6b4a2a'); rrect(-0.5, -1.98, 1.0, 0.16, 0.08, '#8a6238'); stroke([-0.2, -1.98, -0.2, -1.4], '#2a1c10', 0.04); stroke([0.2, -1.98, 0.2, -1.4], '#2a1c10', 0.04); }
    // the rider is drawn a touch smaller than life, so the bike carries the picture
    g.save(); g.translate(0, -1.5); g.scale(0.92, 0.92); g.translate(0, 1.5);
    // ---- legs and boots (the rider sits with knees out a touch)
    for (const s of [-1, 1]) {
      poly([s * 0.2, -1.95, s * 0.5, -1.9, s * 0.62, -1.42, s * 0.5, -1.22, s * 0.26, -1.4],
        hgrad(Math.min(s * 0.2, s * 0.62), Math.max(s * 0.2, s * 0.62), [[0, K.pants], [0.5, K.pantsLit], [1, K.pants]]));       // thigh
      poly([s * 0.5, -1.3, s * 0.66, -1.36, s * 0.6, -0.78, s * 0.46, -0.74], K.pants);                                              // shin
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
      stroke([s * 0.74, -2.2, s * 0.78, -2.62], K.black, 0.03);
      oval(s * 0.8, -2.72, 0.1, 0.07, '#1a1c22');
      oval(s * 0.8, -2.72, 0.07, 0.045, '#8aa3b8');
    }

    // ---- torso: jacket with a back panel, shoulders, reflective band
    poly([-0.5, -2.68, 0.5, -2.68, 0.58, -2.5, 0.46, -1.85, -0.46, -1.85, -0.58, -2.5],
      hgrad(-0.58, 0.58, [[0, K.jacketDark], [0.3, K.jacket], [0.62, K.jacketLit], [1, K.jacketDark]]));
    poly([-0.34, -2.56, 0.34, -2.56, 0.38, -2.06, -0.38, -2.06], '#ffffff12');                         // back panel
    stroke([-0.46, -2.02, 0.46, -2.02], K.band, 0.055);                                                // reflective band
    stroke([0, -2.62, 0, -1.9], K.jacketDark, 0.025);                                                  // spine seam
    poly([-0.58, -2.5, -0.5, -2.68, -0.36, -2.64, -0.44, -2.42], K.jacketLit);                         // shoulder, lit side
    for (const s of [-1, 1]) {
      // arms out to the grips: upper arm to the elbow, forearm forward
      stroke([s * 0.5, -2.56, s * 0.7, -2.36], K.jacket, 0.2);
      stroke([s * 0.7, -2.36, s * 0.78, -2.24], K.jacketDark, 0.16);
    }

    // ---- helmet: white shell, a red racing stripe and a dark vent
    circle(0, -2.98, 0.34, vgrad(-3.32, -2.64, [[0, '#ffffff'], [0.55, K.helmet], [1, K.helmetShade]]));
    stroke([0, -3.3, 0, -2.7], K.stripe, 0.07);
    rrect(-0.14, -2.78, 0.28, 0.07, 0.03, '#2a2c33');                                                  // neck roll
    rrect(-0.09, -3.16, 0.18, 0.05, 0.02, '#20232a');                                                  // rear vent
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
