// The garage: one lit pixel-art room where every object is a link to a part of the site.
// Painted once (objects, then a dithered lighting pass), with the glowing bits animated on top.
import { C } from '../art/palette';
import { tint, type Icons } from '../art/sprites';
import { bind, bayer, ctx, disc, ellipse, line, poly, rect } from '../engine/pixel';
import { text, textC, textW } from '../engine/font';
import { input } from '../engine/input';
import type { Scene } from '../engine/scene';
import type { Screen } from '../engine/screen';
import { blit, paint, type Sprite } from '../engine/sprites';
import { BAR, CONTROLS, HOTSPOTS, type Control, type Hotspot } from '../hotspots';
import { site } from '../../data/site';
import github from '../../data/github.json';

const WALL = '#cbbd9f', MORTAR = '#bcad8f', LOWER = '#7f8a7a', FLOOR = '#958d80', FLOOR_DARK = '#857d71';
const NAVY = '#293878', CYAN = '#29bdeb';
const TUBES = [140, 340];
export const BIKE = { scale: 1.4, cx: 214, floor: 250 };

/** One drifting music note: a head and a stem, fading out as it rises. */
function drawNote(x: number, y: number, a: number) {
  const g = ctx();
  g.globalAlpha = Math.max(0, a);
  rect(x, y + 3, 2, 2, '#fff6d8'); rect(x + 2, y, 1, 4, '#fff6d8');
  g.globalAlpha = 1;
}

export interface GarageImages { bike: HTMLImageElement; pipecd: HTMLImageElement; icons: Icons }

export class GarageScene implements Scene {
  mode = 'world' as const;
  hover: string | null = null;
  /** Lights off. Set through setNight so the pull cord swings and the fade runs. */
  night = false;
  radioOn = false;
  /** Set when the frame rate drops: the garage keeps its look but drops the extras. */
  lowFx = false;
  private t = 0;
  private bg!: Sprite;
  private nightDark?: Sprite;
  private nightGlow?: Sprite;
  private nightT = 0;
  private pull = 0;
  private glow = 0;           // 0..1, eases in and out as you point at things
  private glowId: string | null = null;
  private touch = matchMedia('(pointer: coarse)').matches;
  // dust drifting through the tube-light beams: fixed seeds, so it looks the same every visit
  private motes = Array.from({ length: 28 }, (_, i) => ({ x: TUBES[i % 2] + ((i * 37) % 70) - 35, y: 24 + ((i * 53) % 166), k: i }));

  constructor(private screen: Screen, private img: GarageImages) {}

  enter() {
    this.bg = this.roomSprite();
    this.t = 0;
    this.nightT = this.night ? 1 : 0;
  }

  setNight(on: boolean, instant = false) {
    this.night = on;
    if (instant) this.nightT = on ? 1 : 0;
    else this.pull = 1;
  }

  /** The static room. The door scene borrows it (without the bike) to show what's inside. */
  roomSprite(withBike = true): Sprite { return paint(480, 270, () => this.paintRoom(withBike)); }

  update(dt: number) {
    this.t += dt;
    this.nightT += Math.sign((this.night ? 1 : 0) - this.nightT) * Math.min(Math.abs((this.night ? 1 : 0) - this.nightT), dt * 3);
    this.pull = Math.max(0, this.pull - dt * 1.6);
    if (this.hover && this.hover !== 'list' && this.hover !== 'ride') { this.glowId = this.hover; this.glow = Math.min(1, this.glow + dt * 9); }
    else { this.glow = Math.max(0, this.glow - dt * 6); if (this.glow === 0) this.glowId = null; }
    if (!this.lowFx) for (const m of this.motes) {
      m.y += dt * (3 + (m.k % 3) * 2);
      m.x += Math.sin(this.t * 0.6 + m.k) * dt * 4;
      if (m.y > 190) m.y = 24;
    }
    input.endFrame();
  }

  draw() {
    const g = this.screen.ctx;
    bind(g);
    g.drawImage(this.bg, 0, 0);
    this.animate();
    this.nightPass(g);
    this.hoverGlow(g);
    const all: (Hotspot | Control)[] = [...HOTSPOTS, ...CONTROLS, BAR.list, BAR.ride];
    const hot = all.find((h) => h.id === this.hover);
    if (hot && !('href' in hot && (hot === BAR.list || hot === BAR.ride))) this.brackets(hot);
    if (this.touch || this.t < 3.2) for (const h of [...HOTSPOTS, ...CONTROLS]) if (!['coffee', 'shelf', 'youtube', 'x', 'linkedin', 'github'].includes(h.id)) this.tagFor(h);
    this.bar(hot);
  }

  // ---------------------------------------------------------------- the room, painted once
  private paintRoom(withBike: boolean) {
    // wall: painted concrete blocks, hazard line, darker lower half
    rect(0, 0, 480, 198, WALL);
    for (let y = 16; y < 150; y += 12) {
      rect(0, y, 480, 1, MORTAR);
      for (let x = (y / 12) % 2 ? 12 : 0; x < 480; x += 24) rect(x, y, 1, 12, MORTAR);
    }
    rect(0, 146, 480, 4, C.accent); rect(0, 150, 480, 48, LOWER); rect(0, 150, 480, 1, '#6c7667');
    for (let x = 0; x < 480; x += 3) if (bayer(x, 170) > 0.7) rect(x, 188 + (x % 5), 1, 2, '#707a6b'); // scuffs
    // corners fold away for a bit of depth
    poly([[0, 16], [12, 22], [12, 196], [0, 206]], '#b3a587'); poly([[480, 16], [468, 22], [468, 196], [480, 206]], '#b3a587');
    // ceiling beam and tube-light fittings
    rect(0, 0, 480, 16, '#3e3127'); rect(0, 16, 480, 2, '#2e241c');
    for (const x of TUBES) rect(x - 32, 12, 64, 4, '#5a5a5e');

    // floor: joints running to a vanishing point, oil stains, the lamp's pool comes from the lighting pass
    for (let y = 198; y < 270; y++) for (let x = 0; x < 480; x++) rect(x, y, 1, 1, (y - 198) / 72 > bayer(x, y) ? FLOOR_DARK : FLOOR);
    rect(0, 196, 480, 3, '#5e574c');
    for (let k = -7; k <= 7; k++) line(240 + k * 34, 199, 240 + k * 118, 256, '#8a8276');
    for (const y of [206, 219, 238]) rect(0, y, 480, 1, '#8a8276');
    ellipse(96, 232, 22, 3, '#827a6e'); ellipse(400, 246, 16, 2, '#827a6e');

    this.signs();
    this.pipecdSign();
    this.workbench();
    this.pegboard();
    this.calendar();
    this.clipboard();
    this.whiteboard();
    this.shelf();
    this.toolbox();
    this.tyres();
    this.radioBox();

    if (withBike) {
      // Part of the room's personality, not its focus: mid-size, a little left of centre so the toolbox and PipeCD sign stay clear.
      const k = BIKE.scale, bw = Math.round(this.img.bike.width * k), bh = Math.round(this.img.bike.height * k);
      const bx = Math.round(BIKE.cx - bw / 2), by = BIKE.floor - bh;
      ellipse(BIKE.cx, BIKE.floor, bw * 0.48, 5, '#5f584d');
      blit(this.img.bike, bx, by, bw, bh);
      const hx = Math.round(bx + 50 * k), hy = Math.round(by + 23 * k), hr = Math.round(6.1 * k); // white helmet on the seat
      disc(hx, hy, hr + 1, C.ink); disc(hx, hy, hr, C.white); rect(hx + 2, hy + 1, Math.round(hr / 2), Math.round(hr * 0.6), C.whiteShade); rect(hx - hr / 2, hy - hr / 1.5, Math.round(hr / 2.5), 3, '#ffffff');
    }

    this.light();
    // things that glow are painted after the light so the lighting never dims them
    for (const x of TUBES) { rect(x - 30, 13, 60, 3, '#fff8e0'); rect(x - 30, 16, 60, 1, '#e8dcb8'); }
    for (const x of [200, 280]) { rect(x - 4, 18, 8, 4, '#2a2a2e'); rect(x - 2, 22, 4, 1, '#fff4c2'); }
    this.neon("RAHUL'S GARAGE", 240, 5);
  }

  /** Dithered lighting: two tube lights, spots on the sign, a pool on the floor, a vignette. Quantised in steps so it stays pixel art. */
  private light() {
    const g = ctx(), im = g.getImageData(0, 0, 480, 270), d = im.data;
    const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    for (let y = 0; y < 270; y++)
      for (let x = 0; x < 480; x++) {
        let L = 0.3;
        if (y > 16 && y < 198) for (const cx of TUBES) { const hw = 30 + (y - 16) * 0.6; L += 0.5 * Math.max(0, 1 - Math.abs(x - cx) / hw) * (1 - (y - 16) / 300); }
        L += 0.35 * Math.max(0, 1 - Math.hypot((x - 240) / 70, (y - 86) / 76));
        if (y >= 198) L += 0.5 * Math.max(0, 1 - Math.hypot((x - 240) / 190, (y - 232) / 34));
        const q = Math.floor(Math.min(1, L) * 10 + bayer(x, y)) / 10; // fine steps: light, not grain
        const v = 1 - 0.42 * sm(0.55, 1.08, Math.hypot((x - 240) / 240, (y - 130) / 150));
        const m = (0.58 + 0.55 * q) * v, o = (y * 480 + x) * 4;
        d[o] = Math.min(255, d[o] * m * 1.03); d[o + 1] = Math.min(255, d[o + 1] * m); d[o + 2] = Math.min(255, d[o + 2] * m * 0.95);
      }
    g.putImageData(im, 0, 0);
  }

  private neon(s: string, cx: number, y: number) {
    const x = Math.round(cx - textW(s) / 2);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) text(s, x + dx, y + dy, '#7a2f24');
    text(s, x, y, '#ffb49a');
  }

  // ---------------------------------------------------------------- wall pieces
  private signs() {
    const I = this.img.icons;
    const plate = (x: number, y: number, bg: string, edge: string, art: Sprite | HTMLImageElement, label: string, fg: string) => {
      rect(x + 2, y + 2, 78, 28, '#00000033');
      rect(x, y, 78, 28, edge); rect(x + 1, y + 1, 76, 26, bg);
      for (const [rx, ry] of [[3, 3], [74, 3], [3, 24], [74, 24]]) rect(x + rx, y + ry, 1, 1, '#d8d2c4');
      const ax = x + 6, ay = y + Math.round(14 - art.height / 2);
      ctx().drawImage(art, ax, ay);
      text(label, ax + art.width + 5, y + 11, fg);
    };
    plate(12, 24, '#f4f2ea', '#c4302b', tint(I.youtube, '#ff0000'), 'YOUTUBE', C.ink);
    plate(96, 24, '#0f0f10', '#3a3a3e', tint(I.x, '#f4f2ea'), 'TWITTER', '#f4f2ea');
    plate(12, 58, '#0a66c2', '#084d92', tint(I.linkedin, '#ffffff'), 'LINKEDIN', '#ffffff');
    plate(96, 58, '#24292f', '#111418', tint(I.github, '#f4f2ea'), 'GITHUB', '#f4f2ea');
  }

  private pipecdSign() {
    rect(198, 36, 90, 104, '#00000033');
    rect(195, 33, 90, 104, '#2a2a2e'); rect(197, 35, 86, 100, '#f4f2ea');
    for (const [x, y] of [[200, 38], [278, 38], [200, 130], [278, 130]]) rect(x, y, 2, 2, '#9a958b');
    const pw = Math.round(this.img.pipecd.width * 90 / 108), ph = Math.round(this.img.pipecd.height * 104 / 126);
    blit(this.img.pipecd, 211, 47, pw, ph);
  }

  private workbench() {
    // CRT TV
    line(40, 112, 30, 96, '#555'); line(60, 112, 70, 94, '#555');
    rect(20, 112, 62, 48, '#cfc8b8'); rect(20, 112, 62, 2, '#e0dbcf'); rect(26, 117, 42, 34, '#2a2a2e');
    for (let y = 140; y < 150; y += 2) rect(71, y, 7, 1, '#9e978a');
    disc(74, 122, 2, '#6b6760'); disc(74, 131, 2, '#6b6760');
    // binders: the nine tutorial chapters, in PipeCD colours
    for (let k = 0; k < 9; k++) {
      const x = 92 + k * 6, h = 26 + (k % 3), col = k % 2 ? CYAN : NAVY;
      rect(x, 160 - h, 5, h, col); rect(x + 1, 160 - h + 5, 3, 4, '#f4f2ea'); rect(x, 160 - h, 1, h, '#1b2550');
    }
    rect(146, 150, 5, 10, '#e9e3d1');
    // coffee mug
    rect(156, 150, 8, 10, '#e8e2d1'); rect(164, 152, 2, 5, '#e8e2d1'); rect(157, 151, 6, 2, '#5a3d2b');
    // bench and its shadow
    rect(8, 198, 172, 5, '#6f685c');
    rect(8, 160, 172, 6, C.wood); rect(8, 166, 172, 2, C.woodDark);
    rect(14, 168, 6, 30, C.woodDark); rect(168, 168, 6, 30, C.woodDark); rect(14, 186, 160, 3, C.wood);
    rect(24, 176, 26, 10, '#6b7075'); rect(54, 178, 18, 8, '#b8915f'); rect(80, 180, 12, 6, C.red);
  }

  private pegboard() {
    rect(302, 24, 88, 52, '#00000033');
    rect(300, 22, 88, 52, '#b08a5e');
    for (let y = 26; y < 72; y += 5) for (let x = 304; x < 386; x += 5) rect(x, y, 1, 1, '#8a6a44');
    rect(308, 28, 3, 30, C.steel); disc(309, 28, 3, C.steel); disc(309, 28, 1, '#b08a5e'); disc(309, 58, 3, C.steel);
    for (const [x, c] of [[318, C.red], [324, C.accent], [330, CYAN]] as const) { rect(x, 28, 4, 12, c); rect(x + 1, 40, 2, 16, C.steel); }
    rect(340, 30, 3, 28, C.wood); rect(334, 28, 15, 6, C.steelDark);
    // helm wheel
    disc(368, 47, 13, '#326ce5'); disc(368, 47, 9, '#f4f2ea'); disc(368, 47, 3, '#326ce5');
    for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2 - Math.PI / 2; line(368, 47, 368 + Math.cos(a) * 11, 47 + Math.sin(a) * 11, '#326ce5'); }
  }

  private calendar() {
    rect(306, 84, 30, 42, '#00000033');
    rect(304, 82, 30, 42, '#2a2a2e'); rect(305, 83, 28, 40, '#f4f2ea'); rect(305, 83, 28, 9, C.red);
    const d = new Date(github.generatedAt);
    textC(d.toLocaleString('en', { month: 'short' }).toUpperCase(), 319, 84, '#f4f2ea');
    const active = new Set(github.prs.filter((p) => p.createdAt.startsWith(github.generatedAt.slice(0, 7))).map((p) => +p.createdAt.slice(8, 10)));
    const first = new Date(d.getFullYear(), d.getMonth(), 1).getDay(), days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= days; day++) {
      const cell = first + day - 1, cx = 307 + (cell % 7) * 3.6, cy = 94 + Math.floor(cell / 7) * 5;
      rect(cx, cy, 3, 3, active.has(day) ? '#3d8b4f' : '#d8d2c4');
    }
  }

  private clipboard() {
    line(363, 80, 363, 83, '#555');
    rect(352, 86, 22, 32, '#00000033');
    rect(350, 84, 22, 32, C.wood); rect(352, 88, 18, 26, '#f6f3ec');
    for (let y = 92; y < 112; y += 3) rect(354, y, y % 2 ? 12 : 14, 1, '#b8b2a6');
    rect(356, 83, 10, 4, C.steel);
  }

  private whiteboard() {
    rect(394, 24, 84, 62, '#00000033');
    rect(392, 22, 84, 62, '#9aa0a5'); rect(394, 24, 80, 58, '#f4f4f0'); rect(396, 82, 76, 3, '#9aa0a5');
    text('NOW:', 398, 28, C.red);
    text('LEARNING K8S', 398, 40, '#2c5aa0');
    text('VIDEOS: OCT', 398, 52, '#2c5aa0');
    text('PIPECD V1', 398, 64, '#2f8f4e');
    rect(430, 81, 8, 2, C.red); rect(440, 81, 8, 2, '#2c5aa0');
  }

  private shelf() {
    rect(390, 198, 86, 4, '#6f685c');
    rect(404, 86, 60, 10, C.ink); textC('BUILDS', 434, 88, C.accent);
    rect(392, 96, 3, 102, '#6b7075'); rect(471, 96, 3, 102, '#6b7075');
    const boxes = [[C.accent, CYAN, C.red], ['#3d8b4f', C.reflector, NAVY], [C.red, C.accent, '#3d8b4f']];
    [120, 146, 172].forEach((y, row) => {
      boxes[row].forEach((c, k) => {
        const x = 397 + k * 25, h = 16 + ((k + row) % 2) * 3;
        rect(x, y - h, 22, h, '#b8915f'); rect(x, y - h, 22, 2, '#cda875'); rect(x + 5, y - h + 6, 12, 5, c);
      });
      rect(392, y, 82, 3, '#6b7075');
    });
    rect(392, 195, 82, 3, '#6b7075');
    // money plant trailing off the top
    rect(462, 78, 8, 8, '#b3563a'); disc(466, 76, 4, '#4f7d3f'); for (const [x, y] of [[470, 82], [472, 88], [471, 95]]) rect(x, y, 3, 3, '#4f7d3f');
  }

  private toolbox() {
    ellipse(350, 234, 40, 3, '#5f584d');
    rect(318, 150, 64, 78, C.red); rect(318, 150, 64, 3, '#e05a4c'); rect(378, 150, 4, 78, '#a82a1f');
    for (const y of [166, 182, 198, 214]) { rect(318, y, 64, 1, '#8e2219'); rect(342, y + 5, 16, 2, C.steel); }
    rect(322, 228, 6, 5, C.tyre); rect(372, 228, 6, 5, C.tyre);
    // stickers from the projects: helm wheel, PipeCD, CNCF, Sugar, Meshery, Gumroad, a first-PR star
    disc(328, 158, 4, '#326ce5'); disc(328, 158, 1, '#fff');
    rect(338, 155, 9, 7, NAVY); rect(342, 158, 5, 4, CYAN);
    rect(352, 155, 10, 7, '#f4f2ea'); text('C', 354, 155, '#446ca9');
    disc(369, 158, 4, '#3d8b4f'); rect(367, 157, 4, 2, C.reflector);
    rect(322, 170, 12, 8, '#00b39f'); disc(345, 174, 4, '#ff90e8');
    poly([[372, 169], [374, 173], [378, 173], [375, 176], [376, 180], [372, 178], [368, 180], [369, 176], [366, 173], [370, 173]], C.accent);
  }

  private radioBox() {
    rect(92, 128, 52, 3, C.wood); rect(92, 131, 52, 1, C.woodDark);
    rect(96, 110, 44, 18, '#2a2a2e'); rect(97, 111, 42, 16, '#4a4d55'); rect(97, 111, 42, 1, '#6b6f79');
    for (const cx of [106, 130]) { disc(cx, 119, 6, C.ink); disc(cx, 119, 4, '#33363d'); disc(cx, 119, 1, '#1b1712'); }
    rect(113, 113, 10, 5, C.ink); rect(114, 116, 8, 1, '#4a4d55');
    disc(118, 123, 1, '#7a2f24'); disc(121, 123, 1, '#5a5d66');
    rect(104, 107, 32, 3, '#2a2a2e'); line(136, 110, 143, 98, C.steel); // handle and aerial
  }

  private tyres() {
    ellipse(26, 253, 26, 3, '#5f584d');
    for (const y of [212, 226, 240]) {
      rect(6, y, 40, 13, C.tyre); rect(4, y + 2, 44, 9, C.tyre);
      rect(6, y + 1, 40, 1, '#343434'); rect(8, y + 11, 36, 1, '#0c0c0c');
      for (let x = 8; x < 44; x += 4) rect(x, y + 4, 2, 5, '#262626');
    }
    rect(54, 232, 10, 20, C.red); rect(56, 228, 6, 4, C.red); rect(57, 225, 4, 3, '#2a2a2e');
  }

  // ---------------------------------------------------------------- animated bits
  private animate() {
    const t = this.t;
    // TV: glowing static with SOON flashing through
    for (let y = 119; y < 149; y++) for (let x = 28; x < 66; x++) {
      const n = (Math.sin(x * 12.99 + y * 78.23 + Math.floor(t * 12) * 3.7) * 43758.5) % 1;
      rect(x, y, 1, 1, Math.abs(n) > 0.55 ? '#7f8a82' : '#34403a');
    }
    rect(31, 127, 32, 12, '#1d2a22'); text('> HI', 34, 130, '#b8f0c0');
    if (Math.floor(t * 2) % 2 === 0) rect(56, 130, 4, 7, '#b8f0c0'); // blinking cursor
    // neon flickers now and then
    if (Math.sin(t * 7) > 0.985) rect(180, 4, 120, 9, '#3e3127');
    // coffee steam
    for (let k = 0; k < 3; k++) {
      const p = (t * 0.7 + k / 3) % 1;
      rect(159 + Math.round(Math.sin((p + k) * 6) * 2), 148 - p * 14, 1, 2, '#f4f2ea');
    }
    this.cat(t);
    this.radioLive(t);
    this.cord();
    if (this.lowFx) return;
    // dust catching the light, and now and then a tube flickers
    const g = ctx();
    for (const m of this.motes) {
      g.globalAlpha = (0.35 + 0.4 * Math.sin(t * 1.3 + m.k * 2)) * (1 - 0.6 * this.nightT);
      rect(m.x, m.y, 1, 1, '#fff6d8');
    }
    g.globalAlpha = 1;
    if (Math.sin(t * 5.1) * Math.sin(t * 0.9 + 1) > 0.985) { g.globalAlpha = 0.18; rect(TUBES[1] - 44, 18, 88, 176, '#140f0a'); g.globalAlpha = 1; }
  }

  /** A grey cat asleep on the tyre stack. The tail flicks, and now and then it opens an eye. */
  private cat(t: number) {
    const body = '#3d3d44', shade = '#2c2c33';
    ellipse(22, 208, 8, 5, body); ellipse(22, 211, 8, 2, shade);
    disc(30, 203, 4, body); rect(27, 198, 2, 3, body); rect(32, 198, 2, 3, body); rect(28, 199, 1, 1, '#c98f8f');
    const open = t % 7 > 6.3; // one slow blink
    if (open) { rect(29, 203, 1, 1, '#b8f070'); rect(32, 203, 1, 1, '#b8f070'); } else { rect(29, 204, 2, 1, shade); rect(32, 204, 2, 1, shade); }
    const sway = Math.round(Math.sin(t * 2.2) * 2);
    line(15, 209, 11, 208 + sway, body); line(11, 208 + sway, 9, 204 + sway, body);
  }

  private radioLive(t: number) {
    rect(118 - 1, 122, 3, 2, this.radioOn ? '#5fdc7a' : '#7a2f24');
    if (!this.radioOn) return;
    const beat = Math.floor(t * 2.27) % 2 === 0; // about 68 bpm
    for (const cx of [106, 130]) { disc(cx, 119, beat ? 5 : 4, '#3a3d45'); disc(cx, 119, 1, C.ink); }
    rect(114, 114, 3 + Math.floor((Math.sin(t * 9) + 1) * 3), 2, '#b8f0c0');
    for (let k = 0; k < 2; k++) { // notes drifting up
      const p = (t * 0.5 + k / 2) % 1, x = 114 + k * 12 + Math.round(Math.sin(p * 8 + k) * 3), y = 104 - p * 26;
      drawNote(x, y, 1 - p);
    }
  }

  private cord() {
    const sway = Math.round(Math.sin(this.t * 4) * this.pull * 2), drop = Math.round(this.pull * 4);
    rect(175, 17, 3, 2, '#2a2a2e');
    line(176, 19, 176 + sway, 42 + drop, '#d8d2c4');
    disc(176 + sway, 45 + drop, 2, C.accent); rect(175 + sway, 44 + drop, 1, 1, '#fff4c2');
  }

  /** Point at something and it lights up: the object brightens and a warm halo spreads round it, like a lamp switched on. */
  private hoverGlow(g: CanvasRenderingContext2D) {
    const h = this.glowId && [...HOTSPOTS, ...CONTROLS].find((x) => x.id === this.glowId);
    if (!h || this.glow <= 0) return;
    const [x, y, w, hh] = h.rect, pulse = 0.9 + 0.1 * Math.sin(this.t * 5), a = this.glow * pulse * Math.min(1, 9000 / (w * hh)); // big areas (the bike) glow softer
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.6 * a;
    g.drawImage(this.bg, x, y, w, hh, x, y, w, hh);           // the object itself, brighter
    for (let i = 1; i <= 5; i++) {                              // warm halo, fading outward in steps
      g.globalAlpha = (0.32 / i) * a;
      const o = i * 2;
      rect(x - o, y - o, w + o * 2, 2, '#ffc94d'); rect(x - o, y + hh + o - 2, w + o * 2, 2, '#ffc94d');
      rect(x - o, y - o + 2, 2, hh + o * 2 - 4, '#ffc94d'); rect(x + w + o - 2, y - o + 2, 2, hh + o * 2 - 4, '#ffc94d');
    }
    g.globalAlpha = 0.07 * a; rect(x, y, w, hh, '#ffd76a'); // a touch of warmth inside
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
  }

  /** Lights off: the dark room fades in, with dithered glows round the neon, TV, radio and the PipeCD sign. */
  private nightPass(g: CanvasRenderingContext2D) {
    if (this.nightT < 0.01) return;
    if (!this.nightDark) this.buildNight();
    g.globalAlpha = this.nightT;
    g.drawImage(this.nightDark!, 0, 0);
    g.globalCompositeOperation = 'lighter';
    g.drawImage(this.nightGlow!, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
  }

  private buildNight() {
    const src = [
      { x: 240, y: 9, r: 100, c: [255, 150, 120] },   // neon sign
      { x: 240, y: 86, r: 62, c: [255, 236, 190] },   // PipeCD sign, spotlit
      { x: 51, y: 134, r: 56, c: [120, 255, 170] },   // CRT
      { x: 118, y: 119, r: 36, c: [255, 196, 110] },  // radio
      { x: 214, y: 205, r: 92, c: [255, 226, 170] },  // work lamp over the bike
    ];
    const mk = () => { const c = document.createElement('canvas'); c.width = 480; c.height = 270; return c; };
    const dark = mk(), glow = mk();
    const dg = dark.getContext('2d')!, gg = glow.getContext('2d')!;
    const di = dg.createImageData(480, 270), gi = gg.createImageData(480, 270);
    for (let y = 0; y < 270; y++)
      for (let x = 0; x < 480; x++) {
        let L = 0, r = 0, gr = 0, b = 0;
        for (const s of src) {
          const k = Math.max(0, 1 - Math.hypot((x - s.x) / s.r, (y - s.y) / (s.r * 0.8))), w = k * k;
          L += w; r += s.c[0] * w; gr += s.c[1] * w; b += s.c[2] * w;
        }
        const o = (y * 480 + x) * 4, lit = Math.min(1, L), q = Math.floor(0.74 * (1 - lit) * 8 + bayer(x, y) * 0.7) / 8;
        di.data[o] = 8; di.data[o + 1] = 10; di.data[o + 2] = 32; di.data[o + 3] = Math.round(q * 255);
        const band = Math.floor(lit * 5) / 5; // banded, not speckled: reads as pixel-art light
        if (band > 0) {
          gi.data[o] = r / L; gi.data[o + 1] = gr / L; gi.data[o + 2] = b / L; gi.data[o + 3] = Math.round(band * 70);
        }
      }
    dg.putImageData(di, 0, 0); gg.putImageData(gi, 0, 0);
    this.nightDark = dark as Sprite; this.nightGlow = glow as Sprite;
  }

  private brackets(h: Hotspot | Control) {
    if (Math.floor(this.t * 3) % 3 === 2) return;
    const [x, y, w, hh] = h.rect, c = C.accent, L = 5;
    for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + hh, 1, -1], [x + w, y + hh, -1, -1]]) {
      rect(sx > 0 ? cx - 1 : cx - L + 1, cy - 1, L, 2, c);
      rect(cx - 1, sy > 0 ? cy - 1 : cy - L + 1, 2, L, c);
    }
  }

  private tagFor(h: Hotspot | Control) {
    const [x, y, w] = h.rect, tw = textW(h.tag) + 6;
    const tx = Math.round(Math.min(480 - tw - 2, Math.max(2, x + w / 2 - tw / 2))), ty = Math.max(18, y - 11);
    rect(tx, ty, tw, 10, C.ink);
    text(h.tag, tx + 3, ty + 2, C.accent);
  }

  private bar(hot?: Hotspot | Control) {
    rect(0, 256, 480, 14, C.ink);
    text('LIST VIEW', 6, 260, this.hover === 'list' ? C.accent : C.hud);
    text('RIDE AGAIN >', 474 - textW('RIDE AGAIN >'), 260, this.hover === 'ride' ? C.accent : C.hud);
    // Portrait phones only see ~130px of the bar, so keep it short there.
    const narrow = this.screen.size.portrait;
    const isLink = hot === BAR.list || hot === BAR.ride;
    const msg = hot
      ? narrow ? hot.tag || hot.label : isLink ? hot.label : `LOOK AT: ${hot.label}`
      : this.t < 5 && !narrow ? site.tagline.toUpperCase()
      : narrow ? '< SWIPE >' : this.touch ? 'TAP ANYTHING · SWIPE TO LOOK AROUND' : 'POINT AT ANYTHING';
    textC(msg, 240, 260, hot ? C.accent : '#a89d8b');
  }
}
