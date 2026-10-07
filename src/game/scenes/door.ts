// Outside the garage at dusk: the bike pulls up, the tagged roller door rattles and rolls up.
import { C } from '../art/palette';
import { graffitiTag } from '../art/sprites';
import { drawRiderSide } from '../art/riderside';
import { bind, bayer, ctx, disc, ellipse, line, poly, rect } from '../engine/pixel';
import { text, textC, textW } from '../engine/font';
import { input } from '../engine/input';
import { DoorSound } from '../engine/audio';
import { glow } from '../engine/light';
import { BEAM, THUNDER_AT, fall, grade, ground } from './weather';
import { PANELS, paintDoor, paintFrame, sprayPaint, wallWear } from './garagedoor';
import { panelSlots } from './doorlift';
import { THEMES, TIMES, WEATHERS, type Theme, type Time, type Weather } from '../state';
import { paintBackdrop, twinklers } from './doorsky';
import type { Scene } from '../engine/scene';
import { WIDE_W, type Screen } from '../engine/screen';
import { blit, paint, type Sprite } from '../engine/sprites';

const DOOR = { x: 110, y: 70, w: 260, h: 176 };
const FRAME = { x: DOOR.x - 20, y: DOOR.y - 20, w: DOOR.w + 40, h: DOOR.h + 20 }; // the frame sprite: header, tracks
const frac = (v: number) => v - Math.floor(v);
const hash = (i: number, s = 0) => frac(Math.sin(i * 127.1 + s * 311.7) * 43758.5453);
// A long, wide approach: ~5s of bike coming in, then the sensor sees it, the door wakes, opens, and the bike idles in the doorway.
const T_SENSE = 2.8, T_ARRIVE = 5.0, T_OPEN = 3.7, T_UP = 2.2, T_END = 7.6;
const CUES = { sense: T_SENSE, arrive: T_ARRIVE, open: T_OPEN, up: T_UP, end: T_END };
// Same size as the bike in the garage, so it does not shrink or grow between the two scenes.
const OX = 80; // the garage is drawn in 480-wide world coordinates, centred in the 640 frame
const BIKE_K = 1.4, PAD = { x: 8, y: 24 };
const ease = (p: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, p)), 3);
const glide = (p: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, p)), 2); // gentler braking for the bike

export class DoorScene implements Scene {
  mode = 'wide' as const;
  private t = 0;
  private bg!: Sprite;
  private doorArt!: Sprite;
  private frameArt!: Sprite;
  private rig!: Sprite; // bike and rider drawn together at native size, then scaled as one
  private finished = false;
  private sfx = new DoorSound();
  private cues = CUES as typeof CUES & { thunder?: number };
  private idle = 0;
  private go = false; // the scene holds on its first frame until sound is running or the visitor taps

  private room?: Sprite; // painted a moment after the first frame (it is only seen once the door lifts), so the first paint stays quick

  constructor(private screen: Screen, private bike: HTMLImageElement, private mountains: Record<Time, HTMLImageElement>, private makeRoom: () => Sprite, private onDone: () => void, private weather: Weather = 'clear', private theme: Theme = 'himalaya', private time: Time = 'dusk', private onChange?: (o: { weather?: Weather; theme?: Theme; time?: Time }) => void) {}

  /** Dusk and night have the lamps on. In the day they are off. */
  private get lit() { return this.time !== 'day'; }

  enter() {
    this.t = 0;
    const q = new URLSearchParams(location.search), at = Number(q.get('at'));      // ?door&at=6 jumps into the arrival, for looking at one moment (a ride's own ?at= is not for the door)
    if (q.has('door') && at > 0) { this.t = at; this.go = true; }
    this.cues = { ...CUES, thunder: this.weather === 'rain' ? THUNDER_AT : undefined };
    this.sfx.start(() => this.t, this.cues, this.weather, this.time);
    this.bg = paint(WIDE_W, 270, () => this.facade());
    setTimeout(() => { this.room ??= this.makeRoom(); }, 300);
    this.rig = paint(this.bike.width + PAD.x * 2, this.bike.height + PAD.y, () => { blit(this.bike, PAD.x, PAD.y); drawRiderSide(PAD.x, PAD.y); });
    if (this.time === 'night') nightTint(this.rig);
    this.doorArt = paint(DOOR.w, DOOR.h, () => {
      paintDoor(DOOR.w, DOOR.h, this.weather);
      // the tag is sprayed on and weathered; the small stencil text and marks wear less so they stay readable
      const tag = paint(DOOR.w, DOOR.h, () => graffitiTag(48, 50, 2));
      const marks = paint(DOOR.w, DOOR.h, () => {
        text('GIT PUSH >', 14, 16, '#f4f2ea');
        for (const [x, y] of [[36, 44], [224, 40], [216, 100]]) { line(x - 3, y, x + 3, y, '#f4f2ea'); line(x, y - 3, x, y + 3, '#f4f2ea'); }
        line(52, 46, 56, 40, C.accent); line(56, 40, 60, 46, C.accent); line(60, 46, 64, 40, C.accent); line(64, 40, 68, 46, C.accent);
        text('MH-12', 200, 150, '#2a2a2e');
      });
      sprayPaint(tag, DOOR.w, DOOR.h);
      sprayPaint(marks, DOOR.w, DOOR.h, 0.3);
      if (this.time === 'dusk') this.duskLight(0, 0, DOOR.w, DOOR.h); // the door catches the same dusk as the wall
    });
    if (this.time === 'night') nightTint(this.doorArt);
    this.frameArt = paint(FRAME.w, FRAME.h, () => paintFrame(DOOR.x - FRAME.x, DOOR.y - FRAME.y, DOOR.w, DOOR.h));
    if (this.time === 'night') nightTint(this.frameArt);
  }

  /** Where the camera should look, in the 640-wide frame. On a phone the stage scrolls sideways and follows the bike. */
  get focus() {
    if (!this.go) return WIDE_W / 2;
    return Math.min(WIDE_W, Math.max(0, OX + (-340 + glide(this.t / T_ARRIVE) * 460) + 110));
  }

  /** Three small buttons in a row along the bottom (on a phone, in the part of the frame you can see): the land, the weather and the hour. */
  private buttons() {
    const cx = this.screen.size.portrait ? this.focus : WIDE_W / 2, next = <T,>(all: readonly T[], v: T) => all[(all.indexOf(v) + 1) % all.length];
    const list = [
      { label: `LAND: ${this.theme === 'xp' ? 'BLISS' : 'HIMALAYA'} >`, key: 'KeyT', o: { theme: next(THEMES, this.theme) } },
      { label: `WEATHER: ${this.weather.toUpperCase()} >`, key: 'KeyW', o: { weather: next(WEATHERS, this.weather) } },
      { label: `TIME: ${this.time.toUpperCase()} >`, key: 'KeyN', o: { time: next(TIMES, this.time) } },
    ].map((b) => ({ ...b, w: textW(b.label) + 8, h: 12, y: 252 }));
    let x = Math.round(cx - (list.reduce((a, b) => a + b.w, 0) + (list.length - 1) * 4) / 2);
    return list.map((b) => { const r = { ...b, x }; x += b.w + 4; return r; });
  }

  /** Taps on a button (or its key: T land, W weather, N time) change the look instead of skipping the arrival. */
  private changePressed(tap: boolean) {
    const { x, y } = input.pointer;
    for (const b of this.buttons()) {
      if ((tap && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) || input.pressed(b.key)) { this.onChange?.(b.o); return true; }
    }
    return false;
  }

  exit() { this.sfx.stop(); }

  private finish() { if (!this.finished) { this.finished = true; this.sfx.stop(); this.onDone(); } }

  update(dt: number) {
    const tap = input.tap();
    if (this.onChange && this.changePressed(tap)) { input.endFrame(); return; }
    if (!this.go) {
      this.idle += dt;
      const pressed = tap || input.anyKey();
      if (this.sfx.running && this.idle > 0.2) this.go = true; // autoplay was allowed
      else if (this.idle > 0.5 && pressed) { this.sfx.start(() => this.t, this.cues, this.weather, this.time); this.go = true; } // a tap unlocks sound and starts
      input.endFrame();
      return;
    }
    this.t += dt;
    if (this.t > 0.3 && (tap || input.anyKey())) this.finish();
    if (this.t > T_END) this.finish();
    input.endFrame();
  }

  /** The door as separate panels: each lifts, tilts back onto the track's curve (shorter, darker) and vanishes behind the header. */
  private drawPanels(g: CanvasRenderingContext2D, up: number, shake: number) {
    const slots = panelSlots(up, PANELS, DOOR.h), ph = DOOR.h / PANELS, moving = up > 0 && up < DOOR.h;
    slots.forEach((s, i) => {
      const y0 = DOOR.y + Math.round(s.y) + shake, y1 = DOOR.y + Math.round(s.y + s.h) + shake, h = y1 - y0;
      if (h < 1) return;
      const jx = moving ? Math.round(Math.sin(this.t * 55 + i * 1.9) * (1 - up / DOOR.h)) : 0; // panels rattle in their tracks
      g.drawImage(this.doorArt, 0, i * ph, DOOR.w, ph, DOOR.x + jx, y0, DOOR.w, h);
      if (s.h < ph - 0.5) { g.globalAlpha = 0.55 * (1 - s.h / ph); rect(DOOR.x + jx, y0, DOOR.w, h, '#0d0b10'); g.globalAlpha = 1; } // tilting away from the light
    });
  }

  /** Dust and flecks shaken loose from the header as the door starts to move. */
  private dust(g: CanvasRenderingContext2D) {
    const p = (this.t - T_OPEN) / 1.6;
    if (p <= 0 || p >= 1) return;
    for (let i = 0; i < 26; i++) {
      const x = DOOR.x + Math.round(hash(i, 1) * DOOR.w), y = DOOR.y + Math.round(p * (20 + hash(i, 2) * 70));
      g.globalAlpha = (1 - p) * (0.35 + hash(i, 3) * 0.4);
      rect(x, y, 1, 1, i % 3 ? '#cbbfa8' : '#8a8172');
    }
    g.globalAlpha = 1;
  }

  draw() {
    const g = this.screen.ctx;
    bind(g);
    g.drawImage(this.bg, 0, 0);
    if (this.time === 'night' && (this.weather === 'clear' || this.weather === 'snow')) for (const [i, s] of twinklers.entries()) {      // a few stars flicker
      const a = 0.5 + 0.5 * Math.sin(this.t * (1.4 + (i % 4) * 0.5) + i * 2.3);
      g.globalAlpha = a; rect(s.x + OX, s.y, 1, 1, '#f4f2ea'); g.globalAlpha = 1;
    }
    ground(g, this.weather);
    g.save(); g.translate(OX, 0); // everything below is in garage coordinates
    const up = ease((this.t - T_OPEN) / T_UP) * DOOR.h;
    const shake = this.t > T_SENSE + 0.3 && this.t < T_OPEN + 0.25 ? Math.round(Math.sin(this.t * 90)) : 0; // a jolt as the motor takes load
    // inside: the real garage through the doorway, lighting up as the door rises
    if (this.t > T_OPEN - 0.5) this.room ??= this.makeRoom(); // never later than the moment the door starts to lift
    if (this.room) g.drawImage(this.room, DOOR.x, 20, DOOR.w, DOOR.h, DOOR.x, DOOR.y, DOOR.w, DOOR.h);
    g.globalAlpha = 0.72 * (1 - Math.min(1, up / DOOR.h));
    rect(DOOR.x, DOOR.y, DOOR.w, DOOR.h, '#140f0a');
    g.globalAlpha = 1;
    // the shadow under the header falls into the room while the door opens
    if (up > 0) for (let r = 0; r < 14; r++) { g.globalAlpha = (1 - r / 14) * 0.5; rect(DOOR.x, DOOR.y + r, DOOR.w, 1, '#0d0a08'); }
    g.globalAlpha = 1;
    // the door: four panels, rising on the tracks
    g.save(); g.beginPath(); g.rect(DOOR.x, DOOR.y, DOOR.w, DOOR.h); g.clip();
    this.drawPanels(g, up, shake);
    this.dust(g);
    g.restore();
    g.drawImage(this.frameArt, FRAME.x, FRAME.y); // header box and tracks sit in front of the door
    rect(DOOR.x - 4, 247, DOOR.w + 8, 2, '#4a4450'); // the threshold
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
    const fur = this.time === 'night' ? '#2e2a2c' : '#9c6d45', ear = this.time === 'night' ? '#24202a' : '#7a5234';
    ellipse(346, 244, 12, 4, fur); disc(357, 240, 4, fur); rect(358, 236, 2, 3, ear);
    rect(359, 240, 1, 1, this.t > T_ARRIVE ? C.ink : ear);
    line(334, 243, 330, 240 + wag, fur);
    g.restore();
    grade(g, this.weather, this.t); // the weather dims and cools everything painted so far; lights go on top of it
    g.save(); g.translate(OX, 0);
    this.lights(g, hx, hy, beam, seen, up);
    g.restore();
    fall(g, this.weather, this.t, this.time === 'night' ? 0.6 : 1);
    text('SKIP >', 6, 258, C.hud, 1, C.ink);
    if (this.onChange) for (const b of this.buttons()) { rect(b.x, b.y, b.w, b.h, C.ink); text(b.label, b.x + 4, b.y + 3, C.hud); }
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
    const bk = BEAM[this.weather] * { day: 0.4, dusk: 1, night: 1.45 }[this.time];     // a headlight shows most in the dark
    if (this.weather !== 'clear' && this.lit) { // the grade dimmed these, so put them back
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
      glow(g, hx + 90, 254, 110, 9, '255,228,170', 0.45 * beam * bk); glow(g, hx, hy, 20, 20, '255,244,214', Math.min(1, 0.8 * beam * (this.time === 'day' ? 0.6 : 1))); glow(g, hx + 14, hy, 34, 3, '255,244,214', 0.5 * beam);
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

  /** The sky and the land behind the garage, then everything that stands in front of it on a clear sheet, so the night can darken the one without the other. */
  private facade() {
    const X0 = -OX, X1 = 480 + OX;
    const g0 = ctx(); g0.save(); g0.translate(OX, 0); // garage coordinates again; the sides run from -OX to 480 + OX
    paintBackdrop({ theme: this.theme, time: this.time, weather: this.weather, mountains: this.mountains, X0, X1 });
    g0.restore();
    const front = paint(WIDE_W, 270, () => this.foreground(X0, X1));
    if (this.time === 'night') nightTint(front);
    blit(front, 0, 0);
    this.lamps();
  }

  private foreground(X0: number, X1: number) {
    const g0 = ctx(); g0.save(); g0.translate(OX, 0);
    // sparse poplar left; pole and wires on the right
    const xp = this.theme === 'xp';
    if (xp) { rect(31, 118, 7, 132, '#5a4030'); disc(34, 102, 17, '#3f7a2a'); disc(24, 108, 11, '#4f9a35'); disc(45, 106, 11, '#4f9a35'); disc(36, 92, 10, '#6aaa44'); disc(42, 90, 4, '#9ad25a'); }   // an oak, in the green land
    else { rect(32, 118, 4, 132, '#5a4530'); disc(34, 102, 7, '#9aa858'); disc(34, 92, 5, '#7a8840'); }
    line(38, 48, 426, 36, '#3a3632');
    const flagCol = ['#b83a3a', '#d4a820', '#2a5aa8', '#f0ece4', '#2a7a48'];
    line(X0, 56, 38, 48, '#3a3632'); line(426, 36, X1, 44, '#3a3632'); // the string carries on both ways
    for (let i = -3; i < 13; i++) {
      const fx = 48 + i * 36, fy = fx < 38 ? 48 + Math.round((38 - fx) * 8 / 118) : fx > 426 ? 36 + Math.round((fx - 426) * 8 / 134) : 46 - Math.round((fx - 38) * 10 / 388);
      line(fx + 4, fy, fx + 4, fy + 2, '#3a3632');
      if (xp) poly([[fx, fy + 2], [fx + 9, fy + 2], [fx + 4, fy + 10]], ['#e8503a', '#f4c430', '#4aa0d8', '#f4f2ea', '#58b050', '#e878a8'][((i % 6) + 6) % 6]);   // bunting
      else rect(fx, fy + 2, 9, 7, flagCol[((i % 5) + 5) % 5]);
    }
    rect(448, 20, 5, 230, '#4a4038'); rect(430, 26, 40, 3, '#4a4038');
    line(X0, 34, 430, 28, '#2e2a26'); line(X0, 40, 432, 30, '#2e2a26'); line(470, 29, X1, 36, '#2e2a26'); line(470, 31, X1, 42, '#2e2a26');
    // streetlight on the pole (its lamp comes on in lamps(), after the night has darkened everything else)
    rect(440, 60, 10, 3, '#4a4038'); rect(430, 60, 12, 5, '#2e2a26'); rect(432, 65, 8, 2, '#8a8478');
    // dry-stone walls and a few shrubs along the sides, so the wide shot has something to look at
    for (const [a, b] of [[X0, 56], [426, X1]]) {
      if (xp) {                                                                                                   // a hedge with wildflowers and a white picket fence in front
        rect(a, 226, b - a, 22, '#3f7a2a'); rect(a, 226, b - a, 3, '#6aaa44');
        for (let x = a; x < b; x += 3) for (let y = 230; y < 246; y += 3) if (bayer(x, y) > 0.55) rect(x, y, 2, 2, bayer(x + 3, y) > 0.8 ? '#2f6a22' : '#4f9a35');
        for (let x = a + 4; x < b; x += 11) rect(x, 228 + ((x * 7) % 9), 2, 2, ['#ffffff', '#f4c430', '#ff9ac2', '#e8503a'][Math.abs(x) % 4]);
        for (let x = a; x < b; x += 7) { rect(x, 236, 3, 12, '#f6f1e6'); rect(x, 236, 1, 12, '#d8d2c4'); }
        rect(a, 240, b - a, 2, '#f6f1e6');
      } else {
        rect(a, 230, b - a, 18, '#7d6a58'); rect(a, 230, b - a, 3, '#9a8570'); rect(a, 245, b - a, 3, '#5f5045');
        for (let y = 234, r = 0; y < 246; y += 4, r++) for (let x = a + (r % 2) * 5; x < b; x += 10) rect(x, y, 1, 4, '#5f5045');
      }
    }
    for (const x of [-56, 6, 470, 520]) {
      if (xp) { for (let i = 0; i < 9; i++) { const fx = x - 12 + i * 3, c = ['#e8503a', '#f4c430', '#ff9ac2', '#ffffff', '#8ab8ff'][i % 5]; rect(fx, 226 - (i % 3) * 2, 1, 5, '#3f7a2a'); rect(fx - 1, 224 - (i % 3) * 2, 3, 3, c); } }      // flower beds
      else { disc(x, 226, 7, '#5c6a3a'); disc(x + 6, 229, 5, '#6f7d44'); disc(x - 5, 230, 4, '#4d5a30'); }
    }
    // building: painted plain, then lit by the dusk (cool on the left, warm from the sun side), so it sits in the scene
    rect(84, 34, 312, 8, '#b9a88c'); rect(90, 42, 300, 206, '#d9cbb2');
    for (let y = 46; y < 246; y += 3) for (let x = 92 + (y % 7); x < 388; x += 11) if (bayer(x, y) > 0.8) rect(x, y, 1, 1, '#cbbc9f');
    rect(90, 200, 300, 48, '#c9b99c');
    rect(90, 42, 300, 3, '#a8917c'); rect(90, 45, 300, 1, '#bba58f'); // shadow under the roof lip
    rect(90, 238, 300, 10, '#a3927f'); rect(90, 238, 300, 1, '#8c7b69'); // plinth
    wallWear(90, 46, 300, 200);
    if (this.time === 'dusk') this.duskLight(90, 42, 300, 206);
    rect(90, 42, 2, 206, this.time === 'day' ? '#8a8294' : '#5d5470'); rect(388, 42, 2, 206, this.time === 'day' ? '#f4ead2' : '#f3c48e'); // dark left edge, sun-catching right edge
    ellipse(240, 250, 160, 3, '#3a3040'); // the garage's shadow on the driveway
    // sign and lamp (lit again in lamps())
    rect(160, 44, 160, 16, C.ink); textC("RAHUL'S GARAGE", 240, 48, this.lit ? C.accent : '#9a7f18');
    rect(126, 48, 8, 6, '#2a2a2e'); disc(130, 57, 3, '#8a8478');
    // no-parking sign on the wall beside the door
    disc(381, 112, 8, C.red); disc(381, 112, 6, '#f4f2ea'); text('P', 379, 109, '#2c5aa0'); line(376, 107, 386, 117, C.red);
    // driveway and the road kerb
    rect(X0, 248, X1 - X0, 22, '#767079');
    for (let x = X0; x < X1; x += 16) rect(x, 264, 8, 6, C.accent), rect(x + 8, 264, 8, 6, '#222');
    g0.restore();
  }

  /** The lamps that are on at dusk and at night: the streetlight and its pool, the wall lamp, the sign. Painted last, so the dark never dims them. */
  private lamps() {
    if (!this.lit) return;
    const g0 = ctx(), night = this.time === 'night'; g0.save(); g0.translate(OX, 0);
    rect(160, 44, 160, 16, C.ink); textC("RAHUL'S GARAGE", 240, 48, C.accent);                      // the sign, bright
    rect(126, 48, 8, 6, '#2a2a2e'); disc(130, 57, 3, '#fff4c2');
    rect(432, 65, 8, 2, '#fff1c4');
    glow(g0, 436, 74, 48, 52, '255,214,150', night ? 0.62 : 0.5); glow(g0, 436, 67, 12, 12, '255,246,214', 0.9);
    glow(g0, 440, 250, night ? 70 : 44, night ? 8 : 5, '255,214,150', night ? 0.5 : 0.3);            // the pool of light under the pole
    glow(g0, 130, 58, 26, 20, '255,238,180', night ? 0.6 : 0.5); glow(g0, 240, 52, 100, 14, '255,176,60', night ? 0.26 : 0.16);   // the wall lamp, and the sign's own glow
    g0.restore();
  }
}

/** Multiply a painted sheet by the colour of moonlight, with fine dithered steps so it stays pixel art. Clear pixels stay clear. */
export function nightTint(s: Sprite) {
  const c = s.getContext('2d')!, im = c.getImageData(0, 0, s.width, s.height), d = im.data, h = s.height;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < s.width; x++) {
      const o = (y * s.width + x) * 4;
      if (!d[o + 3]) continue;
      const q = Math.floor((1 - 0.16 * (y / h)) * 12 + bayer(x, y) * 0.9) / 12;
      d[o] = d[o] * q * 0.3; d[o + 1] = d[o + 1] * q * 0.38; d[o + 2] = Math.min(255, d[o + 2] * q * 0.64);
    }
  c.putImageData(im, 0, 0);
}
