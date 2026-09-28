// The garage: one pixel-art room where every object is a link to a part of the site.
import { C } from '../art/palette';
import { bind, bayer, disc, ellipse, line, poly, rect } from '../engine/pixel';
import { text, textC, textW } from '../engine/font';
import { input } from '../engine/input';
import type { Scene } from '../engine/scene';
import type { Screen } from '../engine/screen';
import { blit, paint, type Sprite } from '../engine/sprites';
import { BAR, HOTSPOTS, type Hotspot } from '../hotspots';
import github from '../../data/github.json';

const WALL = '#cbbd9f', MORTAR = '#bcad8f', LOWER = '#7f8a7a', FLOOR = '#958d80', FLOOR_DARK = '#857d71';
const NAVY = '#293878', CYAN = '#29bdeb';

export interface GarageImages { bike: HTMLImageElement; pipecd: HTMLImageElement }

export class GarageScene implements Scene {
  mode = 'world' as const;
  hover: string | null = null;
  private t = 0;
  private bg!: Sprite;
  private touch = matchMedia('(pointer: coarse)').matches;

  constructor(private screen: Screen, private img: GarageImages) {}

  enter() {
    this.bg = paint(480, 270, () => this.paintRoom());
    this.t = 0;
  }

  update(dt: number) { this.t += dt; input.endFrame(); }

  draw() {
    const g = this.screen.ctx;
    bind(g);
    g.drawImage(this.bg, 0, 0);
    this.animate();
    const all = [...HOTSPOTS, BAR.list, BAR.ride];
    const hot = all.find((h) => h.id === this.hover);
    if (hot && HOTSPOTS.includes(hot)) this.brackets(hot);
    if (this.touch || this.t < 3.2) for (const h of HOTSPOTS) if (!['polaroids', 'coffee', 'shelf'].includes(h.id)) this.tagFor(h); // the shelf has its own BUILDS sign
    this.bar(hot);
  }

  // ---------------------------------------------------------------- static room, painted once
  private paintRoom() {
    // wall: painted concrete blocks
    rect(0, 0, 480, 198, WALL);
    for (let y = 10; y < 150; y += 12) {
      rect(0, y, 480, 1, MORTAR);
      for (let x = (y / 12) % 2 ? 12 : 0; x < 480; x += 24) rect(x, y, 1, 12, MORTAR);
    }
    rect(0, 146, 480, 4, C.accent); rect(0, 150, 480, 48, LOWER); rect(0, 150, 480, 1, '#6c7667');
    rect(0, 0, 480, 10, '#4a3b2e'); rect(0, 10, 480, 2, '#3a2e24');
    text("RAHUL'S GARAGE", 6, 2, C.hud);
    // floor with the lamp's pool of light, dithered
    for (let y = 198; y < 270; y++)
      for (let x = 0; x < 480; x++) {
        const d = Math.hypot((x - 240) / 1.6, (y - 215) * 2.2) / 190;
        const base = (y - 198) / 72 > bayer(x, y) ? FLOOR_DARK : FLOOR;
        this.px(x, y, 1 - d > bayer(x, y) + 0.25 ? '#a39a8c' : base);
      }
    rect(0, 196, 480, 3, '#5e574c');
    rect(0, 232, 480, 1, '#7c7468'); rect(160, 199, 1, 71, '#8a8276'); rect(320, 199, 1, 71, '#8a8276');
    ellipse(240, 250, 64, 6, '#80796c'); ellipse(232, 251, 34, 3, '#736c60');

    this.pipecdSign();
    this.polaroids();
    this.calendar();
    this.clipboard();
    this.workbench();
    this.pegboard();
    this.whiteboard();
    this.shelf();
    this.toolbox();
    this.tyres();

    // the bike, kickstand down, with the black helmet on the seat
    ellipse(240, 249, 70, 3, '#6e675b');
    blit(this.img.bike, 164, 249 - this.img.bike.height);
    disc(236, 198, 7, C.black); rect(231, 194, 4, 2, '#4a4d57'); rect(239, 199, 4, 3, '#2a2c33');
  }

  private px(x: number, y: number, col: string) { rect(x, y, 1, 1, col); }

  private pipecdSign() {
    rect(186, 24, 108, 126, '#2a2a2e'); rect(188, 26, 104, 122, '#f4f2ea');
    for (const [x, y] of [[191, 29], [287, 29], [191, 143], [287, 143]]) rect(x, y, 2, 2, '#9a958b');
    blit(this.img.pipecd, 205, 40);
    rect(196, 16, 8, 6, '#2a2a2e'); rect(276, 16, 8, 6, '#2a2a2e');
  }

  private polaroids() {
    const sag = (x: number) => 32 + Math.round(Math.sin(((x - 14) / 136) * Math.PI) * 5);
    for (let x = 14; x < 150; x++) rect(x, sag(x), 1, 1, '#6b5a45');
    const scenes = [
      ['#8fbcd0', '#7c9a43'], ['#f5d7a2', '#6b8578'], ['#29bdeb', NAVY], ['#eedbb0', '#5e3c24'], ['#a6c9d6', '#56705f'], ['#e8641f', '#2a2a2e'],
    ];
    scenes.forEach(([sky, land], k) => {
      const x = 18 + k * 22, y = sag(x + 9) + 2 + (k % 2);
      rect(x, y, 18, 22, '#f6f3ec'); rect(x + 2, y + 2, 14, 13, sky); rect(x + 2, y + 10, 14, 5, land);
      if (k === 0) { rect(x + 9, y + 4, 2, 2, C.sun); }
      if (k === 2) { rect(x + 5, y + 5, 8, 6, '#f6f3ec'); }
      rect(x + 8, y - 2, 2, 4, C.wood);
    });
  }

  private calendar() {
    rect(154, 36, 30, 42, '#2a2a2e'); rect(155, 37, 28, 40, '#f4f2ea'); rect(155, 37, 28, 9, C.red);
    const d = new Date(github.generatedAt);
    const mon = d.toLocaleString('en', { month: 'short' }).toUpperCase();
    textC(mon, 169, 38, '#f4f2ea');
    const active = new Set(github.prs.filter((p) => p.createdAt.startsWith(github.generatedAt.slice(0, 7))).map((p) => +p.createdAt.slice(8, 10)));
    const first = new Date(d.getFullYear(), d.getMonth(), 1).getDay(), days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= days; day++) {
      const cell = first + day - 1, cx = 157 + (cell % 7) * 3.6, cy = 48 + Math.floor(cell / 7) * 5;
      rect(cx, cy, 3, 3, active.has(day) ? '#3d8b4f' : '#d8d2c4');
    }
  }

  private clipboard() {
    line(169, 80, 169, 83, '#555');
    rect(158, 84, 22, 32, C.wood); rect(160, 88, 18, 26, '#f6f3ec');
    for (let y = 92; y < 112; y += 3) rect(162, y, y % 2 ? 12 : 14, 1, '#b8b2a6');
    rect(164, 83, 10, 4, C.steel);
  }

  private workbench() {
    // CRT TV
    line(40, 112, 30, 96, '#555'); line(60, 112, 70, 94, '#555');
    rect(20, 112, 62, 48, '#cfc8b8'); rect(20, 112, 62, 2, '#e0dbcf'); rect(26, 117, 42, 34, '#2a2a2e');
    for (let y = 140; y < 150; y += 2) rect(71, y, 7, 1, '#9e978a');
    disc(74, 122, 2, '#6b6760'); disc(74, 131, 2, '#6b6760');
    // binders: the nine tutorial chapters
    for (let k = 0; k < 9; k++) {
      const x = 94 + k * 6, h = 26 + (k % 3), col = k % 2 ? CYAN : NAVY;
      rect(x, 160 - h, 5, h, col); rect(x + 1, 160 - h + 5, 3, 4, '#f4f2ea'); rect(x, 160 - h, 1, h, '#1b2550');
    }
    rect(148, 150, 8, 10, '#e9e3d1'); rect(148, 148, 8, 2, '#d6cfbd');
    // coffee mug
    rect(158, 150, 8, 10, '#e8e2d1'); rect(166, 152, 2, 5, '#e8e2d1'); rect(159, 151, 6, 2, '#5a3d2b');
    // bench
    rect(8, 160, 172, 6, C.wood); rect(8, 166, 172, 2, C.woodDark);
    rect(14, 168, 6, 30, C.woodDark); rect(168, 168, 6, 30, C.woodDark); rect(14, 186, 160, 3, C.wood);
    rect(24, 176, 26, 10, '#6b7075'); rect(54, 178, 18, 8, '#b8915f');
  }

  private pegboard() {
    rect(300, 26, 88, 50, '#b08a5e');
    for (let y = 30; y < 74; y += 5) for (let x = 304; x < 386; x += 5) rect(x, y, 1, 1, '#8a6a44');
    // wrench, screwdrivers, hammer, and a helm wheel
    rect(308, 32, 3, 30, C.steel); disc(309, 32, 3, C.steel); disc(309, 32, 1, '#b08a5e'); disc(309, 62, 3, C.steel);
    for (const [x, c] of [[318, C.red], [324, C.accent], [330, CYAN]] as const) { rect(x, 32, 4, 12, c); rect(x + 1, 44, 2, 16, C.steel); }
    rect(340, 34, 3, 28, C.wood); rect(334, 32, 15, 6, C.steelDark);
    disc(368, 50, 13, '#326ce5'); disc(368, 50, 9, '#f4f2ea'); disc(368, 50, 3, '#326ce5');
    for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2 - Math.PI / 2; line(368, 50, 368 + Math.cos(a) * 11, 50 + Math.sin(a) * 11, '#326ce5'); }
    // shelf and the red radio
    rect(302, 100, 48, 3, '#6b7075');
    line(314, 86, 306, 72, '#555');
    rect(312, 86, 34, 14, '#a33b2c'); rect(312, 86, 34, 2, '#c24f3e');
    for (let y = 89; y < 98; y += 2) for (let x = 315; x < 330; x += 2) rect(x, y, 1, 1, '#6e241a');
    rect(333, 89, 10, 5, '#f0d9a0'); rect(337, 89, 1, 5, C.red); disc(338, 97, 1, '#2a2a2e');
  }

  private whiteboard() {
    rect(392, 22, 84, 62, '#9aa0a5'); rect(394, 24, 80, 58, '#f4f4f0'); rect(396, 82, 76, 3, '#9aa0a5');
    text('NOW:', 398, 28, C.red);
    text('LEARNING K8S', 398, 40, '#2c5aa0');
    text('VIDEOS: OCT', 398, 52, '#2c5aa0');
    text('PIPECD V1', 398, 64, '#2f8f4e');
    rect(430, 81, 8, 2, C.red); rect(440, 81, 8, 2, '#2c5aa0');
  }

  private shelf() {
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
  }

  private toolbox() {
    rect(318, 150, 64, 78, C.red); rect(318, 150, 64, 3, '#e05a4c');
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
    for (const y of [212, 226, 240]) {
      rect(6, y, 40, 13, C.tyre); rect(4, y + 2, 44, 9, C.tyre);
      rect(6, y + 1, 40, 1, '#343434'); rect(8, y + 11, 36, 1, '#0c0c0c');
      for (let x = 8; x < 44; x += 4) rect(x, y + 4, 2, 5, '#262626');
    }
    rect(52, 232, 10, 20, C.red); rect(54, 228, 6, 4, C.red); rect(55, 225, 4, 3, '#2a2a2e');
  }

  // ---------------------------------------------------------------- animated bits
  private animate() {
    const t = this.t;
    // TV: static with SOON flashing through
    for (let y = 119; y < 149; y++) for (let x = 28; x < 66; x++) {
      const n = (Math.sin(x * 12.99 + y * 78.23 + Math.floor(t * 12) * 3.7) * 43758.5) % 1;
      rect(x, y, 1, 1, Math.abs(n) > 0.55 ? '#6f7a72' : '#2f3a33');
    }
    if (Math.floor(t * 1.5) % 2 === 0) { rect(33, 128, 28, 11, '#2f3a33'); textC('SOON', 47, 130, '#b8f0c0'); }
    // spotlights on the sign, with the odd flicker
    const on = Math.sin(t * 13) > 0.97 ? '#e8dcb0' : '#fff4c2';
    rect(198, 21, 4, 2, on); rect(278, 21, 4, 2, on);
    // coffee steam
    for (let k = 0; k < 3; k++) {
      const p = (t * 0.7 + k / 3) % 1;
      rect(161 + Math.round(Math.sin((p + k) * 6) * 2), 148 - p * 14, 1, 2, '#f4f2ea');
    }
  }

  private brackets(h: Hotspot) {
    if (Math.floor(this.t * 3) % 3 === 2) return;
    const [x, y, w, hh] = h.rect, c = C.accent, L = 5;
    for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + hh, 1, -1], [x + w, y + hh, -1, -1]]) {
      rect(sx > 0 ? cx - 1 : cx - L + 1, sy > 0 ? cy - 1 : cy - 1, L, 2, c);
      rect(sx > 0 ? cx - 1 : cx - 1, sy > 0 ? cy - 1 : cy - L + 1, 2, L, c);
    }
  }

  private tagFor(h: Hotspot) {
    const [x, y, w] = h.rect, tw = textW(h.tag) + 6;
    const tx = Math.round(Math.min(480 - tw - 2, Math.max(2, x + w / 2 - tw / 2))), ty = Math.max(13, y - 11);
    rect(tx, ty, tw, 10, C.ink); rect(tx, ty + 10, tw, 1, '#00000055');
    text(h.tag, tx + 3, ty + 2, C.accent);
  }

  private bar(hot?: Hotspot) {
    rect(0, 256, 480, 14, C.ink);
    text('LIST VIEW', 6, 260, this.hover === 'list' ? C.accent : C.hud);
    text('RIDE AGAIN >', 474 - textW('RIDE AGAIN >'), 260, this.hover === 'ride' ? C.accent : C.hud);
    const msg = hot ? (HOTSPOTS.includes(hot) ? `LOOK AT: ${hot.label}` : hot.label) : this.touch ? 'TAP ANYTHING · SWIPE TO LOOK AROUND' : 'POINT AT ANYTHING';
    textC(msg, 240, 260, hot ? C.accent : '#a89d8b');
  }
}
