// Roadside props for the Ladakh ride, drawn in local unit space via at().
import { at, box, circle, fit, g, glow, hgrad, hill, label, oval, poly, rrect, stroke, vgrad } from './draw';
import { drawCar } from './traffic';
import { drawCanopy, drawDarchog, drawFlagMound, drawFlags } from './flags';
import { drawGate, drawMonk, drawParkedBike, drawShop, drawStall } from './town';
import { drawGarage } from './garage';
import { drawBillboard, drawGantry } from './garagesign';
import { drawBoard, drawBro, drawChevron, drawLimit, drawSign, setSignLight, SIGN_EMIT, SIGN_GLOW } from './signs';
import { drawBuddha, drawCheckPost, drawGurdwara, drawMonastery } from './landmarks';
import { drawCamel, drawCamp, drawCone, drawCrew, drawSummit, drawVillage } from './scenery';
import { XP_DRAW } from './meadow';
import { getLand, setLand } from './land';

/** A long shadow thrown across the ground from something tall, away from the low sun on the right. */
function cast(h: number, w: number, a = 0.17) {
  poly([-w / 2, 0, w / 2, 0, -h * 0.85 + w / 2, h * 0.3, -h * 0.85 - w / 2, h * 0.3], `rgba(34,20,12,${a})`);
}

const PROP_GLOW: Record<string, number> = { bro: 1, sign: 1, chevron: 1, board: 1, ms: 1 };
const FLAG = ['#d8342b', '#e8b923', '#2c6eb0', '#f4f2ea', '#3c8a48'];

export function drawHouse(sx: number, sy: number, k: number, v = 0) {
  const s = k * 0.9;
  if (s < 0.16) return;
  at(sx, sy, s, () => {
    oval(0, 0, 36, 5.0, 'rgba(40,24,10,0.22)');
    cast(70, 52, 0.14);
    const wall = ['#f0ebe0', '#e8d8c0', '#d8c8a8', '#f0dca8'][v % 4];
    box(-28, -52, 56, 48, wall);
    box(-30, -56, 60, 8, '#c8b898'); // flat roof
    box(-8, -72, 10, 18, '#2a2a2e'); // water tank
    box(-18, -36, 12, 16, '#4a6070'); // window
    box(8, -36, 12, 16, '#4a6070');
    box(-6, -28, 12, 24, '#6a5040'); // door
    stroke([-28, -8, 28, -8], '#b8a888', 1.2);
    if (v === 3) {                                                                                        // a guest house: sign on the roof, striped awning, a lit window
      rrect(-22, -92, 44, 16, 3, '#1b4a2a'); rrect(-20, -90, 40, 12, 2, '#f4f2ea'); label('HOTEL', 0, -80, 9, '#1b4a2a', { align: 'center', weight: 700 });
      for (let i = 0; i < 7; i++) box(-30 + i * 8.6, -42, 8.6, 9, i % 2 ? '#f4f2ea' : '#c8392b');
      box(8, -36, 12, 16, '#ffd88a');
    }
  });
}

export function drawChorten(sx: number, sy: number, k: number) {
  const s = k * 0.85;
  if (s < 0.16) return;
  at(sx, sy, s, () => {
    oval(0, 0, 24, 3.4, 'rgba(40,24,10,0.22)');
    cast(70, 22, 0.14);
    box(-18, -20, 36, 18, '#ebe4d4');
    box(-14, -36, 28, 16, '#ebe4d4');
    box(-10, -48, 20, 12, '#ebe4d4');
    box(-4, -72, 8, 24, '#d8c8a0');
    circle(0, -78, 7, '#e8b923');
    box(-22, -8, 44, 6, '#c8b898');
    for (let i = 0; i < 5; i++) box(-16 + i * 7, -42, 5, 3, FLAG[i]);
  });
}

export function drawPoplar(sx: number, sy: number, k: number, gold = 1) {
  const s = k * 0.95;
  if (s < 0.16) return;
  at(sx, sy, s, () => {
    oval(0, 0, 18, 2.5, 'rgba(40,24,10,0.22)');
    cast(84, 16);
    box(-2, -70, 4, 70, '#5a4030');
    const leaf = gold ? '#c8a848' : '#6a8a48';
    const dark = gold ? '#a88838' : '#4a6a38';
    oval(0, -78, 14, 36, leaf);
    oval(-6, -70, 10, 24, dark);
    oval(6, -88, 9, 20, leaf);
  });
}

export function drawMani(sx: number, sy: number, k: number) {
  const s = k * 0.55;
  if (s < 0.16) return;
  at(sx, sy, s, () => {
    oval(0, 0, 54, 4, 'rgba(40,24,10,0.22)');
    box(-50, -18, 100, 16, '#a89880');
    for (let i = 0; i < 8; i++) box(-46 + i * 12, -16, 10, 12, i % 2 ? '#8a7a68' : '#b8a890');
    box(-48, -22, 96, 4, '#c8b898');
    for (let i = 0; i < 4; i++) box(-40 + i * 24, -30, 14, 8, ['#d8342b', '#e8b923', '#2c6eb0', '#3c8a48'][i]);          // painted mani stones on top
    const spin = performance.now() / 500;
    for (let i = 0; i < 8; i++) {                                                                                       // a row of copper prayer wheels, each turning
      const x = -44 + i * 12.5;
      box(x - 4, -46, 8, 16, '#b8743a'); box(x - 4.4, -47.5, 8.8, 2, '#e8b923'); box(x - 4.4, -31, 8.8, 2, '#e8b923'); circle(x, -49, 2, '#e8b923');
      box(x - 4 + ((spin * 6 + i * 2.1) % 8), -46, 1.6, 16, 'rgba(255,240,200,0.55)');                                  // a glint sliding round the drum
      box(x + 2, -46, 2, 16, 'rgba(0,0,0,0.18)');
    }
  });
}

export function drawBoulder(sx: number, sy: number, k: number, v = 0) {
  const s = k * (0.8 + (v % 3) * 0.15);
  if (s < 0.16) return;
  at(sx, sy, s, () => {
    const w = 22 + v * 3;
    oval(2, 0, w * 1.05, 4, 'rgba(40,24,10,0.25)');                                                            // contact shadow
    poly([-w, 0, -w - 4, -10, -w * 0.6, -24, w * 0.15, -30, w * 0.75, -22, w + 4, -8, w, 0], '#9a7860');        // the body
    poly([w * 0.15, -30, w * 0.75, -22, w + 4, -8, w, 0, w * 0.35, -6], '#c09a7c');                              // sunlit face (the sun is on the right)
    poly([-w, 0, -w - 4, -10, -w * 0.6, -24, -w * 0.3, -10, -w * 0.5, 0], '#6d5242');                            // shaded face
    poly([-w * 0.6, -24, w * 0.15, -30, w * 0.05, -20, -w * 0.4, -16], '#b48c70');                               // a lit top plane
  });
}

export function drawSnow(sx: number, sy: number, k: number, v = 0) {
  const s = k * 0.7;
  if (s < 0.16) return;
  at(sx, sy, s, () => {
    oval(0, 0, 20, 2.8, 'rgba(40,24,10,0.22)');
    oval(0, -6, 18 + v * 4, 8, '#f0f4f8');
    oval(-8, -8, 10, 5, '#e0e8f0');
  });
}

export function drawYak(sx: number, sy: number, k: number) {
  const s = k * 0.85;
  if (s < 0.16) return;
  at(sx, sy, s, () => {
    oval(0, 0, 26, 3.6, 'rgba(40,24,10,0.22)');
    oval(0, -14, 22, 12, '#3a3028');
    oval(18, -20, 10, 8, '#3a3028'); // head
    box(22, -28, 3, 8, '#2a2218'); // horn
    box(14, -28, 3, 8, '#2a2218');
    box(-14, -4, 4, 10, '#2a2218');
    box(-4, -4, 4, 10, '#2a2218');
    box(6, -4, 4, 10, '#2a2218');
    box(14, -4, 4, 10, '#2a2218');
    stroke([-18, -18, 8, -10], '#5a5048', 3); // shaggy back
  });
}

export function drawStone(sx: number, sy: number, k: number, hazard = 0) {
  const s = k;
  if (s < 0.16) return;
  at(sx, sy, s, () => {
    oval(1, 0, 7, 1.6, 'rgba(40,24,10,0.25)');
    rrect(-3.4, -13, 6.8, 13, 2, hgrad(-3.4, 3.4, [[0, '#d9d2c2'], [1, '#a89f8e']]));                       // a rounded kerb stone, lit at the left
    box(-3.4, -9, 6.8, 3.6, hazard ? '#1b1712' : '#f2ede0');                                                  // painted band: black on the drop side, white elsewhere
    if (hazard) box(-3.4, -12, 6.8, 2, '#e8b923');
  });
}

/** A milestone: a white stone with a yellow head, like the ones along the road, carrying the year and what happened. */
export function drawMilestone(sx: number, sy: number, k: number, top?: string, sub?: string) {
  const s = k;
  if (s < 0.16) return;
  at(sx, sy, s, () => {
    oval(0, 0, 30, 4, 'rgba(40,24,10,0.22)');
    rrect(-28, -104, 56, 100, 7, '#f4f2ea');
    rrect(-28, -104, 56, 34, 7, '#e8b923'); box(-28, -80, 56, 10, '#e8b923');
    box(-28, -104, 9, 100, '#00000010');                                                    // shaded left edge
    box(-28, -70, 56, 2, '#b8901a');
    if (top) fit(top, 0, -82, 48, 20, '#1b1712', 700);
    if (sub) {
      const words = sub.split(' ');
      g.font = '600 11px "IBM Plex Mono", ui-monospace, monospace';
      const lines = g.measureText(sub).width > 46 && words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [sub];
      lines.forEach((ln, i) => fit(ln, 0, -50 + i * 15 - (lines.length > 1 ? 6 : 0), 48, 11, '#1b1712', 600));
    }
    box(-31, -8, 62, 6, '#c8c2b2');
  });
}

/** A hilltop monastery: stacked whitewashed tiers with a red band, a gold roof and prayer flags. */
export function drawGompa(sx: number, sy: number, k: number) {
  const s = k;
  if (s < 0.05) return;
  at(sx, sy, s, () => {
    hill(230, 150, '#a97b56', '#c99a70', '#7d573c');
    box(-70, -168, 140, 26, '#efe6d2'); box(-70, -146, 140, 5, '#b8342b');
    box(-50, -196, 100, 28, '#f6eedc'); box(-50, -174, 100, 5, '#b8342b');
    box(-28, -222, 56, 26, '#efe6d2'); box(-28, -204, 56, 5, '#b8342b');
    for (const x of [-52, -32, -12, 8, 28, 48]) box(x, -160, 8, 10, '#3a2a22');
    for (const x of [-32, -10, 12]) box(x, -188, 8, 10, '#3a2a22');
    poly([-34, -222, 0, -246, 34, -222], '#d9a441'); box(-2, -262, 4, 18, '#d9a441'); circle(0, -266, 5, '#f4c95a');
    box(-70, -172, 140, 4, '#d8d0bc');
    stroke([-70, -172, -110, -140], '#3a3028', 1.6);
    for (let i = 0; i < 6; i++) { const t = i / 5; poly([-70 - t * 40, -172 + t * 32, -64 - t * 40, -171 + t * 32, -65 - t * 40, -160 + t * 32], FLAG[i % 5]); }
  });
}

/** Leh Palace: a tall stepped wall of storeys rising off the ridge. */
export function drawPalace(sx: number, sy: number, k: number) {
  const s = k;
  if (s < 0.05) return;
  at(sx, sy, s, () => {
    hill(210, 120, '#a58060', '#c49a78', '#7a563e');
    poly([-52, -110, 52, -110, 40, -290, -40, -290], '#c9b08a');
    poly([0, -110, 52, -110, 40, -290, 0, -290], '#dcc6a0');
    for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) box(-32 + c * 16 + (r % 2) * 2, -122 - r * 20, 7, 11, '#3a2a22');
    box(-46, -296, 92, 8, '#8a5a3a'); box(-30, -318, 60, 22, '#c9b08a'); box(-34, -322, 68, 6, '#8a5a3a');
    box(-100, -160, 50, 50, '#d2bd98'); box(-100, -166, 50, 6, '#8a5a3a'); box(50, -150, 60, 40, '#d2bd98'); box(50, -156, 60, 6, '#8a5a3a');
  });
}

/** Shanti Stupa: a white dome and gold spire on a hill above the town. */
export function drawStupaHill(sx: number, sy: number, k: number) {
  const s = k;
  if (s < 0.05) return;
  at(sx, sy, s, () => {
    hill(200, 130, '#a98058', '#c99e76', '#7a563a');
    poly([-70, -128, -60, -150, 60, -150, 70, -128], '#f0eadc');
    oval(0, -158, 58, 44, '#f6f1e6'); poly([-58, -158, -30, -196, -20, -198, -50, -152], '#e2dccd');
    box(-8, -220, 16, 34, '#f0eadc'); poly([-12, -220, 0, -246, 12, -220], '#d9a441'); circle(0, -250, 5, '#f4c95a');
    stroke([-58, -150, 58, -150], '#d9a441', 3);
  });
}

const SH = 'rgba(40,24,10,0.2)';

/** A telephone pole; the wires between poles are drawn by the road renderer. */
export function drawPole(sx: number, sy: number, k: number) {
  const s = k;
  if (s < 0.16) return;
  at(sx, sy, s, () => {
    oval(0, 0, 9, 1.6, SH);
    cast(128, 5, 0.2);
    box(-2.4, -128, 4.8, 128, '#4a3a2c'); box(-2.4, -128, 1.6, 128, '#6f5844');                       // wood, lit on the left
    box(-28, -118, 56, 4.5, '#3a2e24'); box(-20, -124, 40, 3.5, '#3a2e24');                             // cross arms
    for (const x of [-25, -9, 9, 25]) circle(x, -121, 2.2, '#cfd8de');                                 // insulators
  });
}

/** A tuft of dry scrub. */
export function drawScrub(sx: number, sy: number, k: number, v = 0) {
  const s = k * (0.8 + (v % 3) * 0.2);
  if (s < 0.16) return;
  at(sx, sy, s, () => {
    oval(0, 0, 15, 2.6, SH);
    const cols = ['#8a7a3a', '#a08c48', '#6c6a34'];
    for (let i = 0; i < 8; i++) { const a = -1.2 + (i / 7) * 2.4; stroke([0, -1, Math.sin(a) * 15, -8 - Math.cos(a) * 12], cols[(i + v) % 3], 2.4); }
    oval(0, -6, 6, 4, '#8a7a3a');
  });
}

/** Green grass by the water. */
export function drawTuft(sx: number, sy: number, k: number, v = 0) {
  const s = k * (0.8 + (v % 3) * 0.2);
  if (s < 0.16) return;
  at(sx, sy, s, () => {
    oval(0, 0, 12, 2, SH);
    for (let i = 0; i < 11; i++) { const a = -1.1 + (i / 10) * 2.2; stroke([Math.sin(a) * 3, -1, Math.sin(a) * 13, -10 - Math.cos(a) * 12 - (i % 3) * 3], i % 2 ? '#7fa04a' : '#a4b860', 2); }
  });
}

/** A small stack of stones, the kind travellers leave at a pass. */
export function drawCairn(sx: number, sy: number, k: number) {
  const s = k;
  if (s < 0.16) return;
  at(sx, sy, s, () => {
    oval(0, 0, 18, 3, SH);
    oval(0, -6, 15, 7, '#8f8a82'); oval(1, -16, 11, 6, '#a29c92'); oval(0, -24, 7, 4.5, '#b6b0a6'); oval(3, -28, 4, 2.6, '#c8c2b8');
    oval(4, -8, 8, 4, '#b0aaa0');
  });
}

/** A yellow chevron sign on the outside of a bend: `dir` 1 means the road bends right. */
/** Cattails and reeds standing in the shallows. */
export function drawReed(sx: number, sy: number, k: number, v = 0) {
  const s = k * (0.8 + (v % 3) * 0.2);
  if (s < 0.16) return;
  at(sx, sy, s, () => {
    oval(0, 1, 16, 3, 'rgba(20,70,80,0.35)');
    for (let i = 0; i < 9; i++) {
      const x = -13 + i * 3.3, h = 30 + ((i * 7 + v * 5) % 5) * 7, lean = ((i % 3) - 1) * 3;
      stroke([x, 0, x + lean, -h], i % 2 ? '#6d8a3e' : '#8ea24c', 1.7);
      if (i % 3 === 1) rrect(x + lean - 1.6, -h - 9, 3.2, 11, 1.5, '#5a3a26');                          // the brown seed head
    }
  });
}

/** Three ducks on the water, with rings spreading behind them. */
export function drawDuck(sx: number, sy: number, k: number, v = 0) {
  const s = k * 1.5;
  if (s < 0.16) return;
  const bob = Math.sin(performance.now() / 700 + v * 2) * 0.7;
  at(sx, sy, s, () => {
    for (const [x, y, f] of [[-16, 0, 1], [4, -3, -1], [20, 2, 1]] as const) {
      oval(x - f * 4, y + 1.5, 13, 2.6, 'rgba(255,255,255,0.28)');                                       // ripple
      oval(x, y + bob, 8, 5, '#f2eee2'); oval(x - f * 3, y + bob - 1, 5, 3, '#d9d2bf');                      // body and wing
      circle(x + f * 6, y + bob - 6, 3.2, v % 2 ? '#2f6b4c' : '#7a5a3a');                                    // head
      poly([x + f * 8.5, y + bob - 6.4, x + f * 12, y + bob - 5.6, x + f * 8.5, y + bob - 4.8], '#e8a020'); // beak
      circle(x + f * 6.6, y + bob - 6.8, 0.6, '#111');
    }
  });
}

/** A roadside tea stall: a plank counter under a tarp, a kettle steaming, stools out front. */
export function drawDhaba(sx: number, sy: number, k: number) {
  const s = k * 0.95;
  if (s < 0.16) return;
  at(sx, sy, s, () => {
    oval(0, 0, 44, 5, SH);
    box(-30, -50, 60, 46, '#7a5c40'); box(-30, -50, 60, 5, '#5a4230');                                    // plank back wall
    for (const x of [-20, -10, 0, 10, 20]) box(x, -50, 0.8, 46, '#00000030');
    poly([-38, -50, 38, -50, 32, -66, -32, -66], '#2c6eb0'); poly([-38, -50, -22, -50, -18, -66, -32, -66], '#4a86c4'); // blue tarp roof, lit at the left
    for (const x of [-26, -6, 14, 30]) stroke([x, -66, x - 2, -50], '#1f5088', 1.4);                     // folds
    box(-30, -30, 60, 6, '#4a3626'); box(-30, -24, 60, 20, '#5e4632');                                    // counter
    oval(-14, -34, 5.5, 4, '#b9bec6'); box(-19, -38, 10, 5, '#b9bec6'); stroke([-9, -38, -3, -44], '#8a8f98', 2); // kettle
    for (let i = 0; i < 3; i++) { g.globalAlpha = 0.28 - i * 0.07; circle(-15 + Math.sin(performance.now() / 600 + i) * 2, -46 - i * 6, 2.4 + i, '#ffffff'); }
    g.globalAlpha = 1;
    for (let i = 0; i < 4; i++) box(2 + i * 6, -37, 4, 7, ['#d8342b', '#f4f2ea'][i % 2]);                // glasses on the counter
    rrect(-24, -84, 48, 15, 3, '#1b1712'); rrect(-22, -82, 44, 11, 2, '#e8b923');
    label('CHAI', 0, -73, 10, '#1b1712', { weight: 700, align: 'center' });
    stroke([-38, -66, -38, -4], '#3a2e24', 2.4); stroke([38, -66, 38, -4], '#3a2e24', 2.4);               // posts
    for (const x of [-52, 50]) { box(x - 5, -14, 10, 4, '#d8342b'); box(x - 4, -10, 2, 10, '#3a2e24'); box(x + 2, -10, 2, 10, '#3a2e24'); } // stools
    for (let i = 0; i < 6; i++) poly([-36 + i * 12, -66, -30 + i * 12, -66, -33 + i * 12, -58], FLAG[i % 5]);   // flags along the eave
  });
}

/** An army truck parked on the verge, drawn as the traffic ones are. */
export function drawParked(sx: number, sy: number, k: number) {
  drawCar('army', sx, sy, k * 0.5, 0);
}

/** A small herd of kiang, the wild asses of the Changthang: chestnut back, white belly, one grazing. */
export function drawKiang(sx: number, sy: number, k: number, v = 0) {
  const s = k * 0.9;
  if (s < 0.16) return;
  at(sx, sy, s, () => {
    for (const [x, y, sc, f, graze] of [[-34, 0, 0.9, 1, 0], [-2, -3, 1, -1, 1], [34, 1, 0.85, 1, 0]] as const) {
      g.save(); g.translate(x, y); g.scale(sc * f, sc);
      oval(0, 0, 26, 3.4, 'rgba(40,24,10,0.22)');
      for (const lx of [-13, -9, 8, 12]) box(lx, -15, 3, 15, '#c7b7a0');                                   // pale legs
      oval(0, -24, 20, 9, '#a2673c'); oval(1, -18, 17, 5.5, '#efe6d2');                                    // chestnut back, white belly
      stroke([-14, -30, 12, -31], '#5a3a24', 1.6);                                                          // the dark stripe down the back
      poly([13, -28, 19, -24, 24, graze ? -12 : -33, 22, graze ? -8 : -37, 17, graze ? -15 : -34], '#a2673c'); // neck
      oval(graze ? 27 : 23, graze ? -8 : -36, 8, 4.2, '#a2673c'); oval(graze ? 33 : 29, graze ? -7 : -35, 3.6, 2.6, '#efe6d2'); // head and pale muzzle
      poly([graze ? 21 : 19, graze ? -12 : -40, graze ? 22 : 20, graze ? -17 : -46, graze ? 24 : 22, graze ? -12 : -40], '#6a4028'); // ear
      stroke([-19, -26, -25, -18], '#5a3a24', 1.6);                                                         // tail
      g.restore();
    }
  });
}

/** A marmot sitting up on a rock at the pass, watching you go by. */
export function drawMarmot(sx: number, sy: number, k: number, v = 0) {
  const s = k * 1.1;
  if (s < 0.16) return;
  at(sx, sy, s, () => {
    oval(0, 0, 14, 2.4, SH);
    oval(-5, -5, 16, 5, '#8f8a82'); oval(-3, -9, 11, 4.6, '#a29c92');                                     // the rock
    oval(1, -17, 5, 7.5, '#b48a5a'); oval(1, -14, 3.4, 4.6, '#d8b98a');                                   // chestnut body, pale belly
    circle(1, -25, 3.6, '#a87a4c'); oval(2.4, -24.2, 1.8, 1.4, '#e6d0ac');                                // head and muzzle
    circle(-0.4, -26.2, 0.6, '#111'); poly([-2, -27.5, -1.2, -30, 0, -28], '#7a5636');                    // eye and ear
    stroke([-2.4, -12, -4, -10], '#a87a4c', 1.4); stroke([4, -12, 5, -10], '#a87a4c', 1.4);               // paws tucked up
  });
}

/** A stray dog sitting by the road, tail wagging, watching the traffic. */
export function drawDog(sx: number, sy: number, k: number, v = 0) {
  const s = k * 1.3;
  if (s < 0.16) return;
  const f = v % 2 ? 1 : -1, wag = Math.sin(performance.now() / 160 + v) * 5;
  at(sx, sy, s, () => {
    g.scale(f, 1);
    oval(0, 0, 15, 2.6, SH);
    stroke([-9, -6, -15 - wag * 0.3, -3 + wag * 0.4], '#a8794a', 3);                                    // tail, wagging
    poly([-9, -3, -8, -18, 0, -24, 4, -3], '#c48a56'); oval(-1, -10, 8, 8, '#c48a56');                  // haunches and chest
    oval(3, -22, 4, 8, '#c48a56'); circle(5, -30, 5.2, '#c48a56'); oval(9.5, -28.5, 3.4, 2.4, '#e2b98a'); // neck, head and muzzle
    poly([1, -34, 2, -40, 5, -35], '#7a4c2a'); circle(5.4, -31, 0.9, '#1b1712'); circle(11.4, -29, 0.9, '#1b1712');
    box(1, -8, 3, 8, '#b07848'); box(5, -8, 3, 8, '#b07848');
  });
}

/** A black dome street lamp with a warm pool of light under it: the approach to the garage. */
export function drawLamp(sx: number, sy: number, k: number) {
  const s = k;
  if (s < 0.16) return;
  at(sx, sy, s, () => {
    poly([-60, 0, 60, 0, 86, 22, -86, 22], vgrad(0, 22, [[0, 'rgba(255,214,140,0.34)'], [1, 'rgba(255,214,140,0)']]));  // the pool on the ground
    cast(110, 4, 0.16);
    box(-2.2, -108, 4.4, 108, '#17130f'); box(-2.2, -108, 1.4, 108, '#3a342c');
    stroke([0, -108, 16, -112, 26, -106], '#17130f', 3.2);
    poly([14, -106, 38, -106, 34, -96, 18, -96], '#17130f'); circle(26, -100, 16, 'rgba(255,224,150,0.3)'); circle(26, -98, 4.5, '#fff2c0');
  });
}

/** The hour of the ride (0 afternoon to 1 dusk), set by the road renderer, so signs can catch the last light. */
let TOD = 0, NIGHT = 0;
export const setTod = (t: number, night = 0) => { TOD = t; NIGHT = night; LIGHTS.length = 0; setSignLight(t, night); };
/** Which land the ride is in: the Himalaya, or the green hills of the old Windows XP wallpaper (Bliss), where the dry country's props give way to trees, bushes and flowers. */
export { setLand };
/** Light sources met this frame, drawn on top of the night so lamps, windows and signs stay bright. */
export interface Light { x: number; y: number; r: number; a: number; color: string }
export const LIGHTS: Light[] = [];
const EMIT: Record<string, [number, number, number, number, string]> = {   // [dx, dy, radius, alpha, colour], in prop units
  shop: [-10, -22, 60, 0.4, '#ffb860'], gate: [0, -134, 120, 0.3, '#ffe0a0'], garage: [0, -50, 170, 0.4, '#ffb862'], billboard: [0, -182, 190, 0.45, '#ffc878'], gantry: [0, -158, 200, 0.4, '#d8f4e4'], lamp: [26, -98, 56, 0.3, '#ffe0a0'], dhaba: [-4, -34, 64, 0.45, '#ffb860'],
  ...SIGN_EMIT, ms: [0, -40, 70, 0.3, '#fff0d0'],
};
const GLOW: Record<string, [number, number]> = { ...SIGN_GLOW, ms: [-40, 80] };

export function drawProp(type: string, sx: number, sy: number, k: number, p: { label?: string; sub?: string; lines?: readonly string[]; v?: number; o?: number }) {
  const em = EMIT[type];
  if (em && NIGHT > 0.3 && k > 0.12) LIGHTS.push({ x: sx + em[0] * k, y: sy + em[1] * k, r: em[2] * k, a: em[3] * Math.min(1, (NIGHT - 0.3) * 2), color: em[4] });
  const gl = GLOW[type];
  if (gl && TOD > 0.5 && k > 0.16) at(sx, sy, k * (PROP_GLOW[type] ?? 1), () => glow(0, gl[0], gl[1], '#ffc878', Math.min(0.55, (TOD - 0.5) * 1.1)));   // reflective paint lit by the last sun and your lamp
  if (getLand() === 'xp' && type in XP_DRAW) { XP_DRAW[type]?.(sx, sy, k, p); return; }       // the Bliss land dresses its own country
  switch (type) {
    case 'house': return drawHouse(sx, sy, k, p.v ?? 0);
    case 'chorten': return drawChorten(sx, sy, k);
    case 'poplar': return drawPoplar(sx, sy, k, getLand() === 'xp' ? 0 : (p.v ?? 1));
    case 'flags': return drawFlags(sx, sy, k);
    case 'canopy': return drawCanopy(sx, sy, k);
    case 'mani': return drawMani(sx, sy, k);
    case 'boulder': return drawBoulder(sx, sy, k, p.v ?? 0);
    case 'snow': return drawSnow(sx, sy, k, p.v ?? 0);
    case 'yak': return drawYak(sx, sy, k);
    case 'stone': return drawStone(sx, sy, k, p.v ?? 0);
    case 'bro': return drawBro(sx, sy, k, p.lines);
    case 'ms': return drawMilestone(sx, sy, k, p.label, p.sub);
    case 'board': return drawBoard(sx, sy, k, p.label);
    case 'sign': return drawSign(sx, sy, k, p.label, p.sub);
    case 'garage': return drawGarage(sx, sy, k);
    case 'billboard': return drawBillboard(sx, sy, k, p.label, p.sub);
    case 'gantry': return drawGantry(sx, sy, k, p.label, p.sub);
    case 'pole': return drawPole(sx, sy, k);
    case 'scrub': return drawScrub(sx, sy, k, p.v ?? 0);
    case 'tuft': return drawTuft(sx, sy, k, p.v ?? 0);
    case 'cairn': return drawCairn(sx, sy, k);
    case 'chevron': return drawChevron(sx, sy, k, p.v ?? 1);
    case 'gompa': return drawGompa(sx, sy, k);
    case 'palace': return drawPalace(sx, sy, k);
    case 'stupahill': return drawStupaHill(sx, sy, k);
    case 'reed': return drawReed(sx, sy, k, p.v ?? 0);
    case 'duck': return drawDuck(sx, sy, k, p.v ?? 0);
    case 'kiang': return drawKiang(sx, sy, k, p.v ?? 0);
    case 'marmot': return drawMarmot(sx, sy, k, p.v ?? 0);
    case 'dog': return drawDog(sx, sy, k, p.v ?? 0);
    case 'darchog': return drawDarchog(sx, sy, k);
    case 'flagmound': return drawFlagMound(sx, sy, k);
    case 'camp': return drawCamp(sx, sy, k);
    case 'cone': return drawCone(sx, sy, k);
    case 'crew': return drawCrew(sx, sy, k);
    case 'summit': return drawSummit(sx, sy, k);
    case 'village': return drawVillage(sx, sy, k);
    case 'camel': return drawCamel(sx, sy, k, p.v ?? 0);
    case 'limit': return drawLimit(sx, sy, k, p.v ?? 40);
    case 'lamp': return drawLamp(sx, sy, k);
    case 'dhaba': return drawDhaba(sx, sy, k);
    case 'parked': return drawParked(sx, sy, k);
    case 'shop': return drawShop(sx, sy, k, p.v ?? 0);
    case 'gate': return drawGate(sx, sy, k, p.label);
    case 'stall': return drawStall(sx, sy, k, p.v ?? 0);
    case 'monk': return drawMonk(sx, sy, k, p.v ?? 0);
    case 'tourer': return drawParkedBike(sx, sy, k, p.v ?? 0);
    case 'gurdwara': return drawGurdwara(sx, sy, k);
    case 'checkpost': return drawCheckPost(sx, sy, k);
    case 'buddha': return drawBuddha(sx, sy, k, p.v ?? 0);
    case 'monastery': return drawMonastery(sx, sy, k);
  }
}
