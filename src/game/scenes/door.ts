// Outside the garage at dusk: the bike pulls up, the tagged roller door rattles and rolls up.
import { C } from '../art/palette';
import { graffitiTag } from '../art/sprites';
import { bind, bayer, disc, ellipse, line, poly, rect } from '../engine/pixel';
import { text, textC } from '../engine/font';
import { input } from '../engine/input';
import type { Scene } from '../engine/scene';
import type { Screen } from '../engine/screen';
import { blit, paint, type Sprite } from '../engine/sprites';

const DOOR = { x: 110, y: 70, w: 260, h: 176 };
const T_ARRIVE = 1.6, T_OPEN = 2.0, T_UP = 1.5, T_END = 4.4;
const ease = (p: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, p)), 3);

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
  mode = 'world' as const;
  private t = 0;
  private bg!: Sprite;
  private doorArt!: Sprite;
  private finished = false;

  private room!: Sprite;

  constructor(private screen: Screen, private bike: HTMLImageElement, private makeRoom: () => Sprite, private onDone: () => void) {}

  enter() {
    this.t = 0;
    this.bg = paint(480, 270, () => this.facade());
    this.room = this.makeRoom();
    this.doorArt = paint(DOOR.w, DOOR.h, () => {
      for (let y = 0; y < DOOR.h; y += 6) { rect(0, y, DOOR.w, 5, '#8b8f94'); rect(0, y + 5, DOOR.w, 1, '#6f7378'); rect(0, y, DOOR.w, 1, '#a3a7ab'); }
      text('GIT PUSH >', 14, 16, '#f4f2ea');
      graffitiTag(48, 50, 2);
      for (const [x, y] of [[36, 44], [224, 40], [216, 100]]) { line(x - 3, y, x + 3, y, '#f4f2ea'); line(x, y - 3, x, y + 3, '#f4f2ea'); }
      line(52, 46, 56, 40, C.accent); line(56, 40, 60, 46, C.accent); line(60, 46, 64, 40, C.accent); line(64, 40, 68, 46, C.accent);
      text('MH-12', 200, 150, '#2a2a2e');
      rect(DOOR.w / 2 - 12, DOOR.h - 8, 24, 3, '#3a3d42');
    });
  }

  private finish() { if (!this.finished) { this.finished = true; this.onDone(); } }

  update(dt: number) {
    this.t += dt;
    if (this.t > 0.3 && (input.tap() || input.anyKey())) this.finish();
    if (this.t > T_END) this.finish();
    input.endFrame();
  }

  draw() {
    const g = this.screen.ctx;
    bind(g);
    g.drawImage(this.bg, 0, 0);
    const up = ease((this.t - T_OPEN) / T_UP) * DOOR.h;
    const shake = this.t > T_ARRIVE && this.t < T_OPEN ? Math.round(Math.sin(this.t * 90)) : 0;
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
    if (up > 30) {
      const k = Math.min(1, up / DOOR.h);
      for (let y = 246; y < 262; y++) for (let x = 90; x < 390; x++) {
        const d = Math.abs(x - 240) / (130 + (y - 246) * 4);
        if (d < 1 && k * (1 - d) * 0.8 > bayer(x, y)) rect(x, y, 1, 1, '#b3a58c');
      }
    }
    // the bike rolling in from the left
    const bx = -170 + ease(this.t / T_ARRIVE) * 320;
    if (this.t < T_ARRIVE) for (let k = 0; k < 3; k++) { const p = (this.t * 3 + k / 3) % 1; disc(bx + 6 - p * 26, 244 - p * 6, 2 + p * 3, '#b8ad98'); }
    blit(this.bike, bx, 251 - this.bike.height);
    riderSide(bx, 251 - this.bike.height + (this.t < T_ARRIVE ? Math.round(Math.sin(this.t * 30) * 0.6) : 0));
    // the street dog wakes up a little when you pull in
    const wag = this.t > T_ARRIVE ? Math.round(Math.sin(this.t * 14) * 2) : 0;
    ellipse(346, 244, 12, 4, '#9c6d45'); disc(357, 240, 4, '#9c6d45'); rect(358, 236, 2, 3, '#7a5234');
    rect(359, 240, 1, 1, this.t > T_ARRIVE ? C.ink : '#7a5234');
    line(334, 243, 330, 240 + wag, '#9c6d45');
    text('SKIP >', 6, 258, C.hud, 1, C.ink);
    const fade = Math.min(1, Math.max(0, (this.t - (T_END - 0.6)) / 0.6));
    if (fade > 0) { g.globalAlpha = fade; rect(0, 0, 480, 270, '#f4e6c8'); g.globalAlpha = 1; }
  }

  private facade() {
    // whole backdrop first, so nothing ever shows through (the bike would leave trails)
    // same dusk the ride ends in
    const sky = ['#58739b', '#7888a8', '#a495ab', '#d6a58c', '#eca676', '#f2985e'];
    for (let y = 0; y < 200; y++) for (let x = 0; x < 480; x++) {
      const t = (y / 190) * (sky.length - 1), i = Math.min(sky.length - 2, Math.floor(t));
      rect(x, y, 1, 1, t - i > bayer(x, y) ? sky[i + 1] : sky[i]);
    }
    disc(400, 176, 18, '#f6b27a'); disc(400, 176, 12, '#ffd49a');
    // flat-topped Sahyadri mesas behind the building
    const mesa = (x: number, list: number[][]) =>
      Math.max(10, ...list.map(([a, b, h]) => h * Math.min(1, Math.max(0, (Math.min(x - a, b - x) + 16) / 16))));
    const far = [[-20, 120, 74], [150, 270, 58], [300, 430, 70], [440, 520, 52]], near = [[20, 90, 40], [210, 330, 34], [370, 470, 44]];
    for (let x = 0; x < 480; x++) {
      const h1 = Math.round(mesa(x, far)), h2 = Math.round(mesa(x, near));
      rect(x, 200 - h1, 1, h1, '#737596');
      for (let y = 8; y < h1 - 2; y += 7) rect(x, 200 - y, 1, 1, '#66688a');
      rect(x, 200 - h2, 1, h2, '#586379');
    }
    rect(0, 200, 480, 48, '#7c8a52');
    for (let x = 0; x < 480; x += 3) if (bayer(x, 210) > 0.5) rect(x, 200 + (x % 7), 1, 2, '#6f7d48');
    // neem on the left, pole and wires on the right
    rect(30, 90, 8, 160, '#4a3526');
    disc(34, 70, 34, '#3c5a33'); disc(12, 88, 20, '#3c5a33'); disc(56, 86, 20, '#3c5a33'); disc(30, 60, 18, '#4f7040');
    rect(448, 20, 5, 230, '#4a4038'); rect(430, 26, 40, 3, '#4a4038');
    line(0, 34, 430, 28, '#2e2a26'); line(0, 40, 432, 30, '#2e2a26');
    // streetlight on the pole, already on at dusk, with a dithered glow
    rect(440, 60, 10, 3, '#4a4038'); rect(430, 60, 12, 5, '#2e2a26'); rect(432, 65, 8, 2, '#fff1c4');
    for (let y = 60; y < 110; y++) for (let x = 400; x < 472; x++) {
      const d = Math.hypot((x - 436) / 34, (y - 72) / 36);
      if (d < 1 && (1 - d) * 0.45 > bayer(x, y)) rect(x, y, 1, 1, '#f3d9a6');
    }
    // building
    rect(64, 34, 352, 8, '#b9a88c'); rect(70, 42, 340, 206, '#d9cbb2');
    for (let y = 46; y < 246; y += 3) for (let x = 72 + (y % 7); x < 408; x += 11) if (bayer(x, y) > 0.8) rect(x, y, 1, 1, '#cbbc9f');
    rect(70, 200, 340, 48, '#c9b99c');
    // sign and lamp
    rect(160, 44, 160, 16, C.ink); textC("RAHUL'S GARAGE", 240, 48, C.accent);
    rect(126, 48, 8, 6, '#2a2a2e'); disc(130, 57, 3, '#fff4c2');
    // window with grille, no-parking sign, stencil
    rect(80, 108, 24, 34, '#2e2a26'); rect(82, 110, 20, 30, '#56626b');
    for (let x = 85; x < 102; x += 4) rect(x, 110, 1, 30, '#2e2a26');
    disc(393, 120, 9, C.red); disc(393, 120, 7, '#f4f2ea'); text('P', 391, 117, '#2c5aa0'); line(387, 114, 399, 126, C.red);
    text('PUNE', 378, 140, '#8a7e68');
    // driveway and the road kerb
    rect(0, 248, 480, 22, '#8e877c');
    for (let x = 0; x < 480; x += 16) rect(x, 264, 8, 6, C.accent), rect(x + 8, 264, 8, 6, '#222');
  }
}
