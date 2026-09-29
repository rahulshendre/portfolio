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
import { BAR, HOTSPOTS, type Hotspot } from '../hotspots';
import github from '../../data/github.json';

const WALL = '#cbbd9f', MORTAR = '#bcad8f', LOWER = '#7f8a7a', FLOOR = '#958d80', FLOOR_DARK = '#857d71';
const NAVY = '#293878', CYAN = '#29bdeb';
const TUBES = [140, 340];

export interface GarageImages { bike: HTMLImageElement; pipecd: HTMLImageElement; icons: Icons }

export class GarageScene implements Scene {
  mode = 'world' as const;
  hover: string | null = null;
  private t = 0;
  private bg!: Sprite;
  private touch = matchMedia('(pointer: coarse)').matches;

  constructor(private screen: Screen, private img: GarageImages) {}

  enter() {
    this.bg = this.roomSprite();
    this.t = 0;
  }

  /** The static room. The door scene borrows it (without the bike) to show what's inside. */
  roomSprite(withBike = true): Sprite { return paint(480, 270, () => this.paintRoom(withBike)); }

  update(dt: number) { this.t += dt; input.endFrame(); }

  draw() {
    const g = this.screen.ctx;
    bind(g);
    g.drawImage(this.bg, 0, 0);
    this.animate();
    const all = [...HOTSPOTS, BAR.list, BAR.ride];
    const hot = all.find((h) => h.id === this.hover);
    if (hot && HOTSPOTS.includes(hot)) this.brackets(hot);
    if (this.touch || this.t < 3.2) for (const h of HOTSPOTS) if (!['coffee', 'shelf', 'youtube', 'x', 'linkedin', 'github'].includes(h.id)) this.tagFor(h);
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

    if (withBike) {
      const bikeScale = 1.14;
      const bw = Math.round(this.img.bike.width * bikeScale), bh = Math.round(this.img.bike.height * bikeScale);
      const bx = Math.round(240 - bw / 2);
      ellipse(240, 249, 82, 4, '#5f584d');
      blit(this.img.bike, bx, 249 - bh, bw, bh);
      disc(236, 191, 7, C.ink); disc(236, 191, 6, C.white); rect(238, 192, 3, 4, C.whiteShade); rect(232, 187, 3, 2, '#ffffff'); // white helmet on the seat
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
    if (Math.floor(t * 1.5) % 2 === 0) { rect(33, 128, 28, 11, '#34403a'); textC('SOON', 47, 130, '#b8f0c0'); }
    // neon flickers now and then
    if (Math.sin(t * 7) > 0.985) rect(180, 4, 120, 9, '#3e3127');
    // coffee steam
    for (let k = 0; k < 3; k++) {
      const p = (t * 0.7 + k / 3) % 1;
      rect(159 + Math.round(Math.sin((p + k) * 6) * 2), 148 - p * 14, 1, 2, '#f4f2ea');
    }
  }

  private brackets(h: Hotspot) {
    if (Math.floor(this.t * 3) % 3 === 2) return;
    const [x, y, w, hh] = h.rect, c = C.accent, L = 5;
    for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + hh, 1, -1], [x + w, y + hh, -1, -1]]) {
      rect(sx > 0 ? cx - 1 : cx - L + 1, cy - 1, L, 2, c);
      rect(cx - 1, sy > 0 ? cy - 1 : cy - L + 1, 2, L, c);
    }
  }

  private tagFor(h: Hotspot) {
    const [x, y, w] = h.rect, tw = textW(h.tag) + 6;
    const tx = Math.round(Math.min(480 - tw - 2, Math.max(2, x + w / 2 - tw / 2))), ty = Math.max(18, y - 11);
    rect(tx, ty, tw, 10, C.ink);
    text(h.tag, tx + 3, ty + 2, C.accent);
  }

  private bar(hot?: Hotspot) {
    rect(0, 256, 480, 14, C.ink);
    text('LIST VIEW', 6, 260, this.hover === 'list' ? C.accent : C.hud);
    text('RIDE AGAIN >', 474 - textW('RIDE AGAIN >'), 260, this.hover === 'ride' ? C.accent : C.hud);
    // Portrait phones only see ~130px of the bar, so keep it short there.
    const narrow = this.screen.size.portrait;
    const msg = hot
      ? narrow ? hot.tag || hot.label : HOTSPOTS.includes(hot) ? `LOOK AT: ${hot.label}` : hot.label
      : narrow ? '< SWIPE >' : this.touch ? 'TAP ANYTHING · SWIPE TO LOOK AROUND' : 'POINT AT ANYTHING';
    textC(msg, 240, 260, hot ? C.accent : '#a89d8b');
  }
}
