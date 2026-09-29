// Outside the garage at dusk: the bike pulls up, the tagged roller door rattles and rolls up.
import { C } from '../art/palette';
import { graffitiTag } from '../art/sprites';
import { bind, bayer, ctx, disc, ellipse, line, poly, rect } from '../engine/pixel';
import { text, textC } from '../engine/font';
import { input } from '../engine/input';
import { DoorSound } from '../engine/audio';
import { glow } from '../engine/light';
import { BEAM, THUNDER_AT, fall, grade, ground } from './weather';
import type { Weather } from '../state';
import type { Scene } from '../engine/scene';
import { WIDE_W, type Screen } from '../engine/screen';
import { blit, paint, type Sprite } from '../engine/sprites';

const DOOR = { x: 110, y: 70, w: 260, h: 176 };
// A long, wide approach: ~5s of bike coming in, then the sensor sees it, the door wakes, opens, and the bike idles in the doorway.
const T_SENSE = 2.8, T_ARRIVE = 5.0, T_OPEN = 3.7, T_UP = 2.2, T_END = 7.6;
const CUES = { sense: T_SENSE, arrive: T_ARRIVE, open: T_OPEN, up: T_UP, end: T_END };
// Same size as the bike in the garage, so it does not shrink or grow between the two scenes.
const OX = 80; // the garage is drawn in 480-wide world coordinates, centred in the 640 frame
const BIKE_K = 1.4, PAD = { x: 8, y: 24 };
const ease = (p: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, p)), 3);
const glide = (p: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, p)), 2); // gentler braking for the bike

/** Rahul on the bike, side view, facing right. (x, y) is the bike sprite's top-left. */
function riderSide(x: number, y: number) {
  poly([[x + 50, y + 20], [x + 62, y + 18], [x + 81, y + 28], [x + 76, y + 33]], C.jeans);   // thigh over the tank
  poly([[x + 76, y + 28], [x + 82, y + 31], [x + 75, y + 46], [x + 69, y + 44]], C.jeans);   // shin down to the peg
  rect(x + 66, y + 44, 11, 4, C.black);                                                       // boot
  poly([[x + 44, y + 24], [x + 63, y + 24], [x + 80, y + 2], [x + 63, y - 6]], C.jacket);    // back, leaning in
  line(x + 47, y + 22, x + 64, y - 4, C.jacketLight);
  poly([[x + 66, y + 1], [x + 76, y - 4], [x + 98, y + 11], [x + 92, y + 17]], C.jacket);    // arm to the bar
  line(x + 70, y + 1, x + 93, y + 14, '#23252c');
  rect(x + 92, y + 11, 6, 4, C.black);                                                        // glove
  rect(x + 70, y - 4, 6, 3, '#23252c');                                                       // collar
  disc(x + 75, y - 10, 7, C.ink); disc(x + 75, y - 10, 6, C.white);                           // white helmet
  rect(x + 77, y - 12, 5, 4, '#2a2c33'); rect(x + 78, y - 12, 2, 1, '#6f8fa8');              // visor
  rect(x + 70, y - 14, 3, 2, '#ffffff'); rect(x + 69, y - 7, 8, 1, C.whiteShade);
}

export class DoorScene implements Scene {
  mode = 'wide' as const;
  private t = 0;
  private bg!: Sprite;
  private doorArt!: Sprite;
  private rig!: Sprite; // bike and rider drawn together at native size, then scaled as one
  private finished = false;
  private sfx = new DoorSound();
  private cues = CUES as typeof CUES & { thunder?: number };
  private idle = 0;
  private go = false; // the scene holds on its first frame until sound is running or the visitor taps

  private room!: Sprite;

  constructor(private screen: Screen, private bike: HTMLImageElement, private mountains: HTMLImageElement, private makeRoom: () => Sprite, private onDone: () => void, private weather: Weather = 'clear') {}

  enter() {
    this.t = 0;
    this.cues = { ...CUES, thunder: this.weather === 'rain' ? THUNDER_AT : undefined };
    this.sfx.start(() => this.t, this.cues, this.weather);
    this.bg = paint(WIDE_W, 270, () => this.facade());
    this.room = this.makeRoom();
    this.rig = paint(this.bike.width + PAD.x * 2, this.bike.height + PAD.y, () => { blit(this.bike, PAD.x, PAD.y); riderSide(PAD.x, PAD.y); });
    this.doorArt = paint(DOOR.w, DOOR.h, () => {
      for (let y = 0; y < DOOR.h; y += 6) { rect(0, y, DOOR.w, 5, '#8b8f94'); rect(0, y + 5, DOOR.w, 1, '#6f7378'); rect(0, y, DOOR.w, 1, '#a3a7ab'); }
      text('GIT PUSH >', 14, 16, '#f4f2ea');
      graffitiTag(48, 50, 2);
      for (const [x, y] of [[36, 44], [224, 40], [216, 100]]) { line(x - 3, y, x + 3, y, '#f4f2ea'); line(x, y - 3, x, y + 3, '#f4f2ea'); }
      line(52, 46, 56, 40, C.accent); line(56, 40, 60, 46, C.accent); line(60, 46, 64, 40, C.accent); line(64, 40, 68, 46, C.accent);
      text('MH-12', 200, 150, '#2a2a2e');
      rect(DOOR.w / 2 - 12, DOOR.h - 8, 24, 3, '#3a3d42');
      this.duskLight(0, 0, DOOR.w, DOOR.h); // the shutter catches the same dusk as the wall
    });
  }

  /** Where the camera should look, in the 640-wide frame. On a phone the stage scrolls sideways and follows the bike. */
  get focus() {
    if (!this.go) return WIDE_W / 2;
    return Math.min(WIDE_W, Math.max(0, OX + (-340 + glide(this.t / T_ARRIVE) * 460) + 110));
  }

  private finish() { if (!this.finished) { this.finished = true; this.sfx.stop(); this.onDone(); } }

  update(dt: number) {
    if (!this.go) {
      this.idle += dt;
      const pressed = input.tap() || input.anyKey();
      if (this.sfx.running && this.idle > 0.2) this.go = true; // autoplay was allowed
      else if (this.idle > 0.5 && pressed) { this.sfx.start(() => this.t, this.cues, this.weather); this.go = true; } // a tap unlocks sound and starts
      input.endFrame();
      return;
    }
    this.t += dt;
    if (this.t > 0.3 && (input.tap() || input.anyKey())) this.finish();
    if (this.t > T_END) this.finish();
    input.endFrame();
  }

  draw() {
    const g = this.screen.ctx;
    bind(g);
    g.drawImage(this.bg, 0, 0);
    ground(g, this.weather);
    g.save(); g.translate(OX, 0); // everything below is in garage coordinates
    const up = ease((this.t - T_OPEN) / T_UP) * DOOR.h;
    const shake = this.t > T_SENSE + 0.3 && this.t < T_OPEN ? Math.round(Math.sin(this.t * 90)) : 0;
    // inside: the real garage through the doorway, lighting up as the door rises
    g.drawImage(this.room, DOOR.x, 20, DOOR.w, DOOR.h, DOOR.x, DOOR.y, DOOR.w, DOOR.h);
    g.globalAlpha = 0.72 * (1 - Math.min(1, up / DOOR.h));
    rect(DOOR.x, DOOR.y, DOOR.w, DOOR.h, '#140f0a');
    g.globalAlpha = 1;
    // the door itself, rolling up into its housing
    g.save(); g.beginPath(); g.rect(DOOR.x, DOOR.y, DOOR.w, DOOR.h); g.clip();
    g.drawImage(this.doorArt, DOOR.x, DOOR.y - up + shake);
    g.restore();
    rect(DOOR.x - 6, DOOR.y - 10, DOOR.w + 12, 12, '#5d6166'); rect(DOOR.x - 6, DOOR.y - 10, DOOR.w + 12, 2, '#767b80');
    // warm light spilling onto the driveway once it's open
    if (up > 30) glow(g, 240, 254, 170, 11, '255,196,120', 0.6 * Math.min(1, up / DOOR.h));
    // the bike rolling in from the left, and stopping just inside the doorway
    const k = BIKE_K, rw = Math.round(this.rig.width * k), rh = Math.round(this.rig.height * k);
    const bx = -340 + glide(this.t / T_ARRIVE) * 460; // left edge of the bike itself
    const bob = this.t < T_ARRIVE ? Math.round(Math.sin(this.t * 30) * 0.8) : 0;
    if (this.t < T_ARRIVE) for (let p, i = 0; i < 3; i++) { p = (this.t * 3 + i / 3) % 1; disc(bx + 8 - p * 30, 244 - p * 6, 2 + p * 3, '#b8ad98'); }
    blit(this.rig, Math.round(bx - PAD.x * k), 251 - rh + bob, rw, rh);
    const hx = bx + 108 * k, hy = 251 - rh + (PAD.y + 22) * k + bob, beam = 1 - Math.min(1, Math.max(0, (this.t - (T_END - 1.4)) / 1.0)); // hx, hy: the lens on the sprite, not its box
    // the sensor beside the door: red while it waits, green once it sees the bike
    const seen = this.t > T_SENSE;
    rect(372, 184, 12, 22, '#2a2a2e'); rect(373, 185, 10, 1, '#4a4a52');
    const lens = seen ? '#5ff08a' : Math.floor(this.t * 2) % 2 ? '#e0453a' : '#5a2320';
    disc(378, 191, 3, lens); rect(376, 200, 5, 2, seen ? '#3fae62' : '#5a4a4a');
    // the street dog wakes up a little when you pull in
    const wag = this.t > T_ARRIVE ? Math.round(Math.sin(this.t * 14) * 2) : 0;
    ellipse(346, 244, 12, 4, '#9c6d45'); disc(357, 240, 4, '#9c6d45'); rect(358, 236, 2, 3, '#7a5234');
    rect(359, 240, 1, 1, this.t > T_ARRIVE ? C.ink : '#7a5234');
    line(334, 243, 330, 240 + wag, '#9c6d45');
    g.restore();
    grade(g, this.weather, this.t); // the weather dims and cools everything painted so far; lights go on top of it
    g.save(); g.translate(OX, 0);
    this.lights(g, hx, hy, beam, seen, up);
    g.restore();
    fall(g, this.weather, this.t);
    text('SKIP >', 6, 258, C.hud, 1, C.ink);
    if (!this.go && this.idle > 0.5) {
      g.globalAlpha = 0.45; rect(0, 0, WIDE_W, 270, '#140f0a'); g.globalAlpha = 1;
      textC('TAP TO START', 320, 172, C.hud, this.screen.size.portrait ? 1 : 2, C.ink); // a phone shows only ~130 of the 640 columns
      if (Math.floor(this.idle * 1.6) % 2) textC('SOUND ON', 320, 194, '#f4f2ea', 1, C.ink);
    }
    const fade = Math.min(1, Math.max(0, (this.t - (T_END - 0.6)) / 0.6));
    if (fade > 0) { g.globalAlpha = fade; rect(0, 0, WIDE_W, 270, '#f4e6c8'); g.globalAlpha = 1; }
  }

  /** Light sources, drawn after the weather grade so they stay bright. */
  private lights(g: CanvasRenderingContext2D, hx: number, hy: number, beam: number, seen: boolean, up: number) {
    const bk = BEAM[this.weather];
    if (this.weather !== 'clear') { // the grade dimmed these, so put them back
      const fog = this.weather === 'fog' ? 1.7 : 1;
      glow(g, 436, 74, 48 * fog, 52 * fog, '255,214,150', 0.6); glow(g, 436, 67, 12, 12, '255,246,214', 0.9);
      glow(g, 130, 58, 26, 20, '255,238,180', 0.5);
      if (up > 30) glow(g, 240, 254, 170, 11, '255,196,120', 0.5 * Math.min(1, up / DOOR.h));
    }
    if (beam > 0) {
      g.save(); g.globalCompositeOperation = 'lighter'; g.beginPath(); g.rect(-OX, 0, WIDE_W, 262); g.clip();
      // many thin cones nested inside each other: the edge fades out over a few pixels, like light scattering in dusty air
      const cone = g.createLinearGradient(hx, 0, hx + 230, 0);
      cone.addColorStop(0, 'rgba(255,236,190,1)'); cone.addColorStop(0.45, 'rgba(255,236,190,0.4)'); cone.addColorStop(1, 'rgba(255,236,190,0)');
      g.fillStyle = cone;
      const N = 16;
      for (let i = 1; i <= N; i++) {
        const spread = 44 * (0.12 + 0.88 * i / N), ay = hy + 40; // the axis dips toward the road
        g.globalAlpha = (0.34 * beam * bk) / N * 1.6;
        g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + 230, ay - spread); g.lineTo(hx + 230, ay + spread); g.closePath(); g.fill();
      }
      g.globalAlpha = 1;
      g.restore();
      glow(g, hx + 90, 254, 110, 9, '255,228,170', 0.45 * beam * bk); glow(g, hx, hy, 20, 20, '255,244,214', 0.8 * beam); glow(g, hx + 14, hy, 34, 3, '255,244,214', 0.5 * beam);
    }
    if (seen) { glow(g, 378, 191, 26, 26, '110,255,160', 0.7); glow(g, 378, 191, 7, 7, '220,255,230', 0.9); }
    else if (Math.floor(this.t * 2) % 2) glow(g, 378, 191, 12, 12, '255,70,50', 0.45);
  }

  /** Multiply a painted area by a dusk tint: cool violet on the left, warm orange on the right, darker toward the ground. Stepped, so it stays pixel art. */
  private duskLight(x0: number, y0: number, w: number, h: number) {
    const g = ctx(), ox = g.getTransform().e, im = g.getImageData(x0 + ox, y0, w, h), d = im.data; // pixel reads ignore the transform
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const t = x / w, v = 1 - 0.2 * (y / h);
        const q = Math.floor((v * 10) + bayer(x + x0, y + y0) * 0.9) / 10; // fine steps
        const o = (y * w + x) * 4;
        d[o] = Math.min(255, d[o] * q * (0.78 + 0.24 * t));
        d[o + 1] = Math.min(255, d[o + 1] * q * (0.8 + 0.1 * t));
        d[o + 2] = Math.min(255, d[o + 2] * q * (0.94 - 0.2 * t));
      }
    g.putImageData(im, x0 + ox, y0);
  }

  private facade() {
    const g0 = ctx(); g0.save(); g0.translate(OX, 0); // garage coordinates again; the sides run from -OX to 480 + OX
    const X0 = -OX, X1 = 480 + OX;
    // whole backdrop first, so nothing ever shows through (the bike would leave trails)
    // same dusk the ride ends in
    const sky = ['#58739b', '#7888a8', '#a495ab', '#d6a58c', '#eca676', '#f2985e'];
    for (let y = 0; y < 200; y++) for (let x = X0; x < X1; x++) {
      const t = (y / 190) * (sky.length - 1), i = Math.min(sky.length - 2, Math.floor(t));
      rect(x, y, 1, 1, t - i > bayer(x, y) ? sky[i + 1] : sky[i]);
    }
    disc(400, 176, 18, '#f6b27a'); disc(400, 176, 12, '#ffd49a');
    glow(ctx(), 400, 176, 90, 60, '255,170,110', 0.32);
    // the Himalaya: a real photo, regraded to this dusk and reduced to a pixel palette (tools/backdrop.py)
    blit(this.mountains, X0, 0);
    // haze: the mountains melt into the dusk light where they meet the valley
    for (let y = 120; y < 200; y++) for (let x = X0; x < X1; x++) if (Math.pow((y - 120) / 80, 2.2) * 0.65 > bayer(x, y)) rect(x, y, 1, 1, '#eca676');
    // foothills either side of the garage, in the same indigo as the shadowed faces
    const hill = (x: number, cx: number, w: number, h: number) => Math.max(0, h * (1 - Math.abs(x - cx) / w));
    for (let x = X0; x < X1; x++) {
      const h = Math.round(Math.max(hill(x, -30, 100, 20), hill(x, 545, 90, 18), hill(x, 20, 90, 22), hill(x, 130, 70, 12), hill(x, 440, 80, 20), hill(x, 340, 60, 10)));
      if (h > 0) { rect(x, 200 - h, 1, h + 1, '#4b415f'); if (h > 3) rect(x, 200 - h, 1, 2, '#6a5876'); }
    }
    // valley floor: warm dusk ochre, darker toward the road, with scree
    const soil = ['#a58a6f', '#977c64', '#87705b', '#75604f'];
    for (let y = 200; y < 248; y++) for (let x = X0; x < X1; x++) {
      const t = ((y - 200) / 48) * (soil.length - 1), i = Math.min(soil.length - 2, Math.floor(t));
      rect(x, y, 1, 1, t - i > bayer(x, y) ? soil[i + 1] : soil[i]);
    }
    for (let x = X0; x < X1; x += 3) if (bayer(x, 210) > 0.5) rect(x, 202 + (((x % 7) + 7) % 7) * 5, 2, 1, '#6a5747');
    for (let x = X0 + 1; x < X1; x += 5) if (bayer(x, 77) > 0.6) rect(x, 206 + ((((x * 7) % 34) + 34) % 34), 1, 1, '#b79c80');
    // sparse poplar left; pole and wires on the right
    rect(32, 118, 4, 132, '#5a4530');
    disc(34, 102, 7, '#9aa858'); disc(34, 92, 5, '#7a8840');
    line(38, 48, 426, 36, '#3a3632');
    const flagCol = ['#b83a3a', '#d4a820', '#2a5aa8', '#f0ece4', '#2a7a48'];
    line(X0, 56, 38, 48, '#3a3632'); line(426, 36, X1, 44, '#3a3632'); // the string carries on both ways
    for (let i = -3; i < 13; i++) {
      const fx = 48 + i * 36, fy = fx < 38 ? 48 + Math.round((38 - fx) * 8 / 118) : fx > 426 ? 36 + Math.round((fx - 426) * 8 / 134) : 46 - Math.round((fx - 38) * 10 / 388);
      line(fx + 4, fy, fx + 4, fy + 2, '#3a3632');
      rect(fx, fy + 2, 9, 7, flagCol[((i % 5) + 5) % 5]);
    }
    rect(448, 20, 5, 230, '#4a4038'); rect(430, 26, 40, 3, '#4a4038');
    line(X0, 34, 430, 28, '#2e2a26'); line(X0, 40, 432, 30, '#2e2a26'); line(470, 29, X1, 36, '#2e2a26'); line(470, 31, X1, 42, '#2e2a26');
    // streetlight on the pole, already on at dusk, with a dithered glow
    rect(440, 60, 10, 3, '#4a4038'); rect(430, 60, 12, 5, '#2e2a26'); rect(432, 65, 8, 2, '#fff1c4');
    glow(ctx(), 436, 74, 48, 52, '255,214,150', 0.5); glow(ctx(), 436, 67, 12, 12, '255,246,214', 0.9);
    glow(ctx(), 440, 250, 44, 5, '255,214,150', 0.3); // the pool of light under the pole
    // dry-stone walls and a few shrubs along the sides, so the wide shot has something to look at
    for (const [a, b] of [[X0, 56], [426, X1]]) {
      rect(a, 230, b - a, 18, '#7d6a58'); rect(a, 230, b - a, 3, '#9a8570'); rect(a, 245, b - a, 3, '#5f5045');
      for (let y = 234, r = 0; y < 246; y += 4, r++) for (let x = a + (r % 2) * 5; x < b; x += 10) rect(x, y, 1, 4, '#5f5045');
    }
    for (const x of [-56, 6, 470, 520]) { disc(x, 226, 7, '#5c6a3a'); disc(x + 6, 229, 5, '#6f7d44'); disc(x - 5, 230, 4, '#4d5a30'); }
    // building: painted plain, then lit by the dusk (cool on the left, warm from the sun side), so it sits in the scene
    rect(84, 34, 312, 8, '#b9a88c'); rect(90, 42, 300, 206, '#d9cbb2');
    for (let y = 46; y < 246; y += 3) for (let x = 92 + (y % 7); x < 388; x += 11) if (bayer(x, y) > 0.8) rect(x, y, 1, 1, '#cbbc9f');
    rect(90, 200, 300, 48, '#c9b99c');
    rect(90, 42, 300, 3, '#a8917c'); rect(90, 45, 300, 1, '#bba58f'); // shadow under the roof lip
    rect(90, 238, 300, 10, '#a3927f'); rect(90, 238, 300, 1, '#8c7b69'); // plinth
    this.duskLight(90, 42, 300, 206);
    rect(90, 42, 2, 206, '#5d5470'); rect(388, 42, 2, 206, '#f3c48e'); // dark left edge, sun-catching right edge
    ellipse(240, 250, 160, 3, '#3a3040'); // the garage's shadow on the driveway
    // sign and lamp
    rect(160, 44, 160, 16, C.ink); textC("RAHUL'S GARAGE", 240, 48, C.accent);
    rect(126, 48, 8, 6, '#2a2a2e'); disc(130, 57, 3, '#fff4c2');
    glow(ctx(), 130, 58, 26, 20, '255,238,180', 0.5); glow(ctx(), 240, 52, 100, 14, '255,176,60', 0.16); // lamp, and the sign's own glow
    // no-parking sign on the wall beside the door
    disc(381, 112, 8, C.red); disc(381, 112, 6, '#f4f2ea'); text('P', 379, 109, '#2c5aa0'); line(376, 107, 386, 117, C.red);
    // driveway and the road kerb
    rect(X0, 248, X1 - X0, 22, '#767079');
    for (let x = X0; x < X1; x += 16) rect(x, 264, 8, 6, C.accent), rect(x + 8, 264, 8, 6, '#222');
    g0.restore();
  }
}
