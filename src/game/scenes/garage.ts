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
import { bevel, cobweb, crack, speckle, stain, streaks, withWear, woodGrain } from '../art/wear';
import { BAR, CONTROLS, HOTSPOTS, type Control, type Hotspot } from '../hotspots';
import { site } from '../../data/site';
import { idleMessage } from '../hints';
import { istHMS, istLabel } from '../ist';
import { tick } from '../engine/audio';
import { countFound, type Theme, type Weather } from '../state';
import { stormFlash, windowFall, windowSky } from './weather';
import { CLOCK, FAN, wallShadows, POSTER_AT, SUN, TUBES, benchLamp, benchLampGlow, bikeGrounding, ceilingMech, helmetStand, compressor, compressorPuff, fanLive, fanStatic, foreground, posterFrame, POSTER, incidentBoard, ridesFrame, clockFace, clockHands, conduit, depthShading, floorDetail, floorProps, charger, chargerLive, mothLive, sunSprite, sunStrength, tubeBeams } from './garageprops';
import github from '../../data/github.json';

const WALL = '#cbbd9f', MORTAR = '#bcad8f', LOWER = '#7f8a7a', FLOOR = '#958d80', FLOOR_DARK = '#857d71';
const NAVY = '#293878', CYAN = '#29bdeb';
const BENCH_DY = 0; // how far the workbench group is shifted up from its original spot
const CAT = { dx: 12, dy: -23 }; // where her nap spot sits on the tyre stack, from where she was first drawn
const SELF_EXPLAINING = ['youtube', 'x', 'linkedin', 'github']; // the number plates spell out what they are, so hovering them only glows
const LAST_PR = Math.max(...github.prs.map((p) => +new Date(p.createdAt)));
const DAYS_SINCE_PR = Math.max(0, Math.floor((Date.now() - LAST_PR) / 864e5)); // the number on the wall board
const CARE = 0.3; // how battered the room looks: lived in and looked after, not abandoned (the door keeps its full wear)
const WIN = { x: 10, y: 24, w: 72, h: 70 }; // the window, at the far left of the wall
export const BIKE = { scale: 1.4, cx: 214, floor: 250 };

/** One drifting music note: a head and a stem, fading out as it rises. */
function drawNote(x: number, y: number, a: number) {
  const g = ctx();
  g.globalAlpha = Math.max(0, a);
  rect(x, y + 3, 2, 2, '#fff6d8'); rect(x + 2, y, 1, 4, '#fff6d8');
  g.globalAlpha = 1;
}

export interface GarageImages { bike: HTMLImageElement; pipecd: HTMLImageElement; planetread: HTMLImageElement; icons: Icons }

export class GarageScene implements Scene {
  mode = 'world' as const;
  hover: string | null = null;
  /** Lights off. Set through setNight so the pull cord swings and the fade runs. */
  night = false;
  radioOn = false;
  /** The clock's readout on hover: 24 hour by default, click flips it. */
  clock24 = true;
  /** Features the visitor has already used (shared with main, which saves it); their hints stop showing. */
  tried: ReadonlySet<string> = new Set();
  /** Objects the visitor has used (shared with main). Shown as a counter on the ceiling beam. */
  found: ReadonlySet<string> = new Set();
  private petT = -10;
  private puffT = -10;
  private tickS = -1;
  private cheerT = -10;
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
  private bikeHalo?: Sprite;
  private far?: Sprite;  // the room without the bike, and the bike (with its shadows) alone: two planes that slide a little as the pointer moves
  private near?: Sprite;
  private layerTimer = 0;
  private par = { x: 0, y: 0 };
  private aim = { x: 0, y: 0 }; // pointer position over the stage, -1 to 1
  private onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const r = this.screen.canvas.getBoundingClientRect();
    this.aim = { x: Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2)), y: Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2)) };
  };
  private sun?: Sprite; // the window's light on the floor, rebuilt when the weather changes
  private touch = matchMedia('(pointer: coarse)').matches;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private og = new URLSearchParams(location.search).has('og'); // ?og: no counter, for the share image
  // dust drifting through the tube-light beams: fixed seeds, so it looks the same every visit
  private motes = Array.from({ length: 28 }, (_, i) => ({ x: TUBES[i % 2] + ((i * 37) % 70) - 35, y: 24 + ((i * 53) % 166), k: i }));

  constructor(private screen: Screen, private img: GarageImages, private weather: Weather = 'clear', private theme: Theme = 'himalaya') {}

  enter() {
    this.bg = this.roomSprite();
    this.layers();
    addEventListener('pointermove', this.onMove);
    this.sun = sunSprite(this.weather);
    this.t = 0;
    this.nightT = this.night ? 1 : 0;
  }

  /** Change what is outside the window (repaints the room, since the sky is part of the still picture). */
  setWeather(w: Weather) { this.weather = w; this.bg = this.roomSprite(); this.layers(); this.sun = sunSprite(w); }

  exit() { removeEventListener('pointermove', this.onMove); clearTimeout(this.layerTimer); }

  pet() { this.petT = this.t; }
  /** The compressor's blast of air. */
  puff() { this.puffT = this.t; }
  /** Everything found: the bar says so for a few seconds. */
  cheer() { this.cheerT = this.t; }

  setNight(on: boolean, instant = false) {
    this.night = on;
    if (instant) this.nightT = on ? 1 : 0;
    else this.pull = 1;
  }

  /** Split the finished room into a far plane (no bike) and a near plane (only what the bike adds), a moment after the first frame so the start stays quick. */
  private layers() {
    this.far = this.near = undefined;
    clearTimeout(this.layerTimer);
    const full = this.bg;
    this.layerTimer = window.setTimeout(() => {
      if (this.bg !== full) return; // the room was rebuilt meanwhile
      const far = this.roomSprite(false), a = full.getContext('2d')!.getImageData(0, 0, 480, 270), b = far.getContext('2d')!.getImageData(0, 0, 480, 270);
      for (let i = 0; i < a.data.length; i += 4) if (a.data[i] === b.data[i] && a.data[i + 1] === b.data[i + 1] && a.data[i + 2] === b.data[i + 2]) a.data[i + 3] = 0;
      const near = paint(480, 270, () => {}); near.getContext('2d')!.putImageData(a, 0, 0);
      this.far = far; this.near = near;
    }, 120);
  }

  /** The static room. The door scene borrows it (without the bike) to show what's inside. */
  roomSprite(withBike = true): Sprite { return paint(480, 270, () => withWear(CARE, () => this.paintRoom(withBike))); }

  update(dt: number) {
    this.t += dt;
    this.nightT += Math.sign((this.night ? 1 : 0) - this.nightT) * Math.min(Math.abs((this.night ? 1 : 0) - this.nightT), dt * 3);
    this.pull = Math.max(0, this.pull - dt * 1.6);
    const k = Math.min(1, dt * 4), a = this.reduced ? { x: 0, y: 0 } : this.aim; // ease toward where the pointer is
    this.par.x += (a.x - this.par.x) * k; this.par.y += (a.y - this.par.y) * k;
    if (this.hover && this.hover !== 'list' && this.hover !== 'ride') { this.glowId = this.hover; this.glow = Math.min(1, this.glow + dt * 9); }
    else { this.glow = Math.max(0, this.glow - dt * 6); if (this.glow === 0) this.glowId = null; }
    if (!this.lowFx) for (const m of this.motes) {
      m.y += dt * (3 + (m.k % 3) * 2);
      m.x += Math.sin(this.t * 0.6 + m.k) * dt * 4;
      if (m.y > 190) m.y = 24;
    }
    if (this.hover === 'clock') { const sec = istHMS(new Date()).s; if (sec !== this.tickS) { this.tickS = sec; tick(); } } else this.tickS = -1; // the clock ticks while you look at it
    input.endFrame();
  }

  draw() {
    const g = this.screen.ctx;
    bind(g);
    if (this.far && this.near) { g.drawImage(this.far, 0, 0); g.drawImage(this.near, Math.round(this.par.x * 2), Math.round(this.par.y * 1)); } // the bike is nearer than the wall: it slides against it
    else g.drawImage(this.bg, 0, 0);
    this.animate();
    this.nightPass(g);
    this.nightWindow(g);
    this.hoverGlow(g);
    const all: (Hotspot | Control)[] = [...HOTSPOTS, ...CONTROLS, BAR.list, BAR.ride];
    const hot = all.find((h) => h.id === this.hover);
    if (hot && hot.id !== 'bike' && !('href' in hot && (hot === BAR.list || hot === BAR.ride))) this.brackets(hot);
    if (this.touch || this.t < 3.2) { const placed: number[][] = []; for (const h of [...HOTSPOTS, ...CONTROLS]) if (!['coffee', 'shelf', 'youtube', 'x', 'linkedin', 'github', 'clock'].includes(h.id)) this.tagFor(h, placed); }
    if (hot?.tag && !SELF_EXPLAINING.includes(hot.id)) this.tagFor(hot); // whatever you point at gets its name on top, along with the glow (the number plates already say their name)
    this.bar(hot);
    this.counter();
  }

  // ---------------------------------------------------------------- the room, painted once
  private paintRoom(withBike: boolean) {
    // wall: painted concrete blocks. Each block has its own tone, a lit top and a shadowed bottom edge; pores, damp, streaks and cracks on top.
    rect(0, 0, 480, 198, WALL);
    const tones = ['#cbbd9f', '#c5b798', '#d0c3a6', '#c1b395'];
    for (let y = 16; y < 150; y += 12) {
      const off = (y / 12) % 2 ? 12 : 0;
      for (let x = off - 24; x < 480; x += 24) {
        const bx = Math.max(0, x + 1), bw = Math.min(480, x + 24) - bx, t = tones[Math.floor((((x * 7 + y * 13) % 17) + 17) % 17 / 17 * 4)];
        rect(bx, y + 1, bw, 11, t); rect(bx, y + 1, bw, 1, '#ddd0b4'); rect(bx, y + 11, bw, 1, '#b3a488');
      }
    }
    for (let y = 16; y < 150; y += 12) {
      rect(0, y, 480, 1, MORTAR);
      for (let x = (y / 12) % 2 ? 12 : 0; x < 480; x += 24) rect(x, y, 1, 12, MORTAR);
    }
    speckle(0, 17, 480, 130, '#a89a7c', 0.05, 1); speckle(0, 17, 480, 130, '#dccfb2', 0.03, 2);
    streaks(0, 18, 480, 80, '#b3a487', 34, 3);                       // rain and grime running down from the beam
    stain(58, 148, 60, 12, '#a99b80', 4, 0.8); stain(300, 146, 46, 9, '#a99b80', 5, 0.7); stain(450, 145, 40, 10, '#a99b80', 6, 0.7); // damp along the bottom
    crack(112, 90, 26, '#8f8168', 7, 1); crack(292, 126, 18, '#8f8168', 8, -1); crack(386, 30, 22, '#8f8168', 9, 1);
    // hazard line with black chevrons, worn, over a darker painted lower half
    rect(0, 146, 480, 4, C.accent);
    for (let x = 0; x < 480; x += 14) for (let k = 0; k < 4; k++) rect(x + k, 146 + k, 4, 1, '#2c2a26');
    speckle(0, 146, 480, 4, '#a07f10', 0.18, 10);
    rect(0, 150, 480, 48, LOWER); rect(0, 150, 480, 1, '#6c7667'); rect(0, 151, 480, 1, '#93a08f');
    for (let x = 48; x < 480; x += 48) { rect(x, 152, 1, 46, '#6c7667'); rect(x + 1, 152, 1, 46, '#8a9585'); } // painted panel seams
    speckle(0, 152, 480, 46, '#97a493', 0.018, 11); speckle(0, 152, 480, 46, '#67715f', 0.03, 12);           // scuffs and chips
    for (let x = 0; x < 480; x += 3) if (bayer(x, 170) > 0.7) rect(x, 188 + (x % 5), 1, 2, '#707a6b'); // scuffs
    streaks(0, 152, 480, 44, '#6b5a44', 8, 13);                                                       // rust runs from the bolts
    // corners fold away for a bit of depth
    poly([[0, 16], [12, 22], [12, 196], [0, 206]], '#b3a587'); poly([[480, 16], [468, 22], [468, 196], [480, 206]], '#b3a587');
    // ceiling beam and tube-light fittings
    woodGrain(0, 0, 480, 16, '#3e3127', '#2e241c', '#4d3d30', 2); rect(0, 16, 480, 2, '#2e241c'); rect(0, 18, 480, 1, '#00000033');
    for (const x of [30, 150, 330, 450]) { rect(x, 6, 4, 4, '#1f1f22'); rect(x, 6, 4, 1, '#4a4a50'); rect(x + 1, 7, 1, 1, '#6b6b72'); } // beam bolts
    cobweb(0, 18, 24, 1, 1, '#d8d2c455'); cobweb(480, 18, 24, -1, 1, '#d8d2c455');
    for (const x of TUBES) rect(x - 32, 12, 64, 4, '#5a5a5e');

    // floor: a concrete slab. Joints run to a vanishing point; grit, oil with a sheen, tyre marks, a crack and dark edges.
    for (let y = 198; y < 270; y++) for (let x = 0; x < 480; x++) rect(x, y, 1, 1, (y - 198) / 72 > bayer(x, y) ? FLOOR_DARK : FLOOR);
    speckle(0, 199, 480, 57, '#756e63', 0.05, 20); speckle(0, 199, 480, 57, '#a8a092', 0.03, 21);
    rect(0, 196, 480, 3, '#5e574c'); rect(0, 199, 480, 1, '#a39b8c');
    for (let k = -7; k <= 7; k++) line(240 + k * 34, 199, 240 + k * 118, 256, '#8a8276');
    for (const y of [206, 219, 238]) { rect(0, y, 480, 1, '#8a8276'); rect(0, y + 1, 480, 1, '#a39b8c33'); }
    stain(96, 232, 26, 4, '#6a6357', 22, 0.95); stain(400, 246, 18, 3, '#6a6357', 23, 0.95); stain(214, 246, 30, 3, '#655e52', 24, 0.7); // oil
    for (const [x, y] of [[90, 231], [98, 232], [404, 246]]) rect(x, y, 3, 1, '#8b86a0');                                                // sheen on the wet oil
    for (let k = 0; k < 46; k++) { rect(120 + k * 2, 248 - Math.round(Math.sin(k * 0.14) * 3), 2, 1, '#6a6459'); rect(300 + k * 2, 244 - Math.round(Math.sin(k * 0.1 + 1) * 4), 2, 1, '#6a6459'); } // tyre marks
    crack(322, 205, 44, '#5a5449', 25, 1);
    rect(0, 196, 480, 1, '#00000022');
    floorDetail();
    depthShading();
    wallShadows([
      ...(['pipecd', 'planetread', 'bookbox', 'map', 'youtube', 'x', 'linkedin', 'github', 'pegboard', 'whiteboard', 'calendar', 'clipboard', 'board', 'shelf', 'toolbox', 'tv'] as const).map((id) => HOTSPOTS.find((h) => h.id === id)!.rect),
      [FAN.x - FAN.half, FAN.y - FAN.half, FAN.half * 2, FAN.half * 2], [CLOCK.x - CLOCK.r, CLOCK.y - CLOCK.r, CLOCK.r * 2, CLOCK.r * 2],
    ]);
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
    conduit(); clockFace(); charger(); floorProps(); benchLamp();
    helmetStand(); ceilingMech(); fanStatic(); ridesFrame(); incidentBoard(DAYS_SINCE_PR); compressor();

    if (withBike) {
      // Part of the room's personality, not its focus: mid-size, a little left of centre so the toolbox and PipeCD sign stay clear.
      const k = BIKE.scale, bw = Math.round(this.img.bike.width * k), bh = Math.round(this.img.bike.height * k);
      const bx = Math.round(BIKE.cx - bw / 2), by = BIKE.floor - bh;
      bikeGrounding(this.img.bike, bx, by, bw, bh, k);
      blit(this.img.bike, bx, by, bw, bh);
    }

    foreground();
    this.light();
    tubeBeams();
    benchLampGlow();
    this.window();
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
        let L = 0.36;
        if (y > 16 && y < 198) for (const cx of TUBES) { const hw = 30 + (y - 16) * 0.6; L += 0.5 * Math.max(0, 1 - Math.abs(x - cx) / hw) * (1 - (y - 16) / 300); }
        L += 0.35 * Math.max(0, 1 - Math.hypot((x - 240) / 70, (y - 86) / 76));
        if (y >= 198) L += 0.5 * Math.max(0, 1 - Math.hypot((x - 240) / 190, (y - 232) / 34));
        const q = Math.floor(Math.min(1, L) * 10 + bayer(x, y)) / 10; // fine steps: light, not grain
        const v = 1 - 0.3 * sm(0.55, 1.08, Math.hypot((x - 240) / 240, (y - 130) / 150));
        const m = (0.62 + 0.5 * q) * v, o = (y * 480 + x) * 4;
        d[o] = Math.min(255, d[o] * m * 1.03); d[o + 1] = Math.min(255, d[o + 1] * m); d[o + 2] = Math.min(255, d[o + 2] * m * 0.95);
      }
    g.putImageData(im, 0, 0);
  }

  /** A window onto the same weather the visitor rode in through. Painted after the lighting so the sky stays bright. */
  private window() {
    const { x, y, w, h } = WIN, g = ctx(), snow = this.weather === 'snow';
    rect(x - 3, y - 3, w + 6, h + 6, '#3e3127'); rect(x - 3, y - 3, w + 6, 1, '#5a4636');
    windowSky(g, x, y, w, h, this.weather, this.theme);
    rect(x + w / 2 - 1, y, 2, h, '#3e3127'); rect(x, y + Math.round(h * 0.45), w, 2, '#3e3127');
    rect(x - 5, y + h + 3, w + 10, 3, '#6b5a45'); rect(x - 5, y + h + 3, w + 10, 1, '#8a7860');
    if (snow) { rect(x - 3, y - 5, w + 6, 2, '#eef2fa'); rect(x - 5, y + h + 1, w + 10, 2, '#eef2fa'); }
  }

  private neon(s: string, cx: number, y: number) {
    const x = Math.round(cx - textW(s) / 2);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) text(s, x + dx, y + dy, '#7a2f24');
    text(s, x, y, '#ffb49a');
  }

  // ---------------------------------------------------------------- wall pieces
  /** The socials as Indian number plates in a tidy stack: yellow (commercial), black with yellow letters (rental), white (private), green (electric). */
  private signs() {
    const plate = (y: number, bg: string, fg: string, edge: string, label: string) => {
      const x = 92, w = 63, h = 13;
      rect(x + 2, y + 2, w, h, '#00000033');
      rect(x, y, w, h, edge); rect(x + 1, y + 1, w - 2, h - 2, bg);
      rect(x + 1, y + 1, 7, h - 2, '#1d3d9a'); rect(x + 3, y + 3, 3, 3, '#f4f2ea'); rect(x + 4, y + 4, 1, 1, '#1d3d9a'); rect(x + 2, y + 8, 5, 1, '#f4f2ea'); // the blue IND strip and its chakra
      bevel(x, y, w, h, '#ffffff44', '#00000066'); rect(x + 9, y + 2, w - 11, 1, '#00000022'); rect(x + 9, y + h - 3, w - 11, 1, '#ffffff22'); // embossed rim
      rect(x + w - 4, y + 2, 2, 2, '#9a958b'); rect(x + w - 4, y + 2, 1, 1, '#d8d2c4');                                                            // rivet
      speckle(x + 1, y + 1, w - 2, h - 2, '#00000022', 0.05, 60 + y); speckle(x + 1, y + h - 4, w - 2, 3, '#6a4a2a', 0.15, 62 + y);              // grime and splashed mud
      text(label, x + 11, y + 4, fg); // the lettering goes on last so the grime never eats it
    };
    plate(30, '#f2c318', C.ink, '#3a3010', 'YOUTUBE');
    plate(46, '#131314', '#f2c318', '#2a2a2e', 'TWITTER');
    plate(62, '#f1eee4', C.ink, '#8f8b80', 'LINKEDIN');
    plate(78, '#1f8a5b', '#f4f2ea', '#125536', 'GITHUB');
  }

  /** The PipeCD poster on the left; on the right two plaques for the real PlanetRead and BookBox logos (main.ts lays the crisp images over them). */
  private pipecdSign() {
    posterFrame(POSTER_AT.x0, POSTER_AT.y0); // PipeCD
    const im = this.img.pipecd, k = Math.min((POSTER.w - 6) / im.width, (POSTER.h - 6) / im.height), pw = Math.round(im.width * k), ph = Math.round(im.height * k);
    blit(im, POSTER_AT.x0 + Math.round((POSTER.w - pw) / 2), POSTER_AT.y0 + Math.round((POSTER.h - ph) / 2), pw, ph);
    posterFrame(POSTER_AT.x1, POSTER_AT.y0); // PlanetRead and BookBox: main.ts lays the crisp logos over these plaques
    posterFrame(POSTER_AT.x0, POSTER_AT.y1);
  }

  private workbench() {
    const d = BENCH_DY;
    // CRT TV
    line(40, 112 + d, 33, 102 + d, '#555'); line(60, 112 + d, 67, 101 + d, '#555');
    rect(20, 112 + d, 62, 48, '#cfc8b8'); rect(20, 112 + d, 62, 2, '#e0dbcf'); rect(26, 117 + d, 42, 34, '#2a2a2e');
    bevel(20, 112 + d, 62, 48, '#e6e1d5', '#a39c8c'); bevel(25, 116 + d, 44, 36, '#15151a', '#4a4a50'); speckle(20, 114 + d, 62, 45, '#b3ac9c', 0.05, 40); // plastic edges, dust
    for (let y = 140; y < 150; y += 2) rect(71, y + d, 7, 1, '#9e978a');
    disc(74, 122 + d, 2, '#6b6760'); disc(74, 131 + d, 2, '#6b6760');
    // binders: the nine tutorial chapters, in PipeCD colours
    for (let k = 0; k < 9; k++) {
      const x = 92 + k * 6, h = 26 + (k % 3), col = k % 2 ? CYAN : NAVY;
      rect(x, 160 + d - h, 5, h, col); rect(x + 1, 160 + d - h + 5, 3, 4, '#f4f2ea'); rect(x, 160 + d - h, 1, h, '#1b2550');
      rect(x + 4, 160 + d - h, 1, h, '#00000033'); rect(x + 1, 160 + d - h, 3, 1, '#ffffff44'); rect(x + 1, 160 + d - h + 11, 3, 1, '#ffffff33'); // spine shading
    }
    rect(146, 150 + d, 5, 10, '#e9e3d1');
    // coffee mug
    rect(156, 150 + d, 8, 10, '#e8e2d1'); rect(164, 152 + d, 2, 5, '#e8e2d1'); rect(157, 151 + d, 6, 2, '#5a3d2b');
    // bench: top at about 0.9m, a lower shelf, and its shadow
    rect(8, 198, 172, 5, '#6f685c');
    woodGrain(8, 160 + d, 172, 6, C.wood, C.woodDark, '#a5764a', 30); rect(8, 166 + d, 172, 2, C.woodDark);
    stain(60, 163 + d, 9, 2, '#5e3c24', 31, 0.8); stain(128, 162 + d, 6, 2, '#4a2f1c', 32, 0.7); speckle(8, 160 + d, 172, 6, '#00000033', 0.05, 33); // rings, spills, nicks
    woodGrain(14, 168 + d, 6, 30 - d, C.woodDark, '#4a2f1c', '#74482c', 34); woodGrain(168, 168 + d, 6, 30 - d, C.woodDark, '#4a2f1c', '#74482c', 35);
    woodGrain(14, 186, 160, 3, C.wood, C.woodDark, '#a5764a', 36);
    rect(24, 176, 26, 10, '#6b7075'); bevel(24, 176, 26, 10, '#8b9096', '#3f4348'); rect(28, 180, 10, 1, '#3f4348');          // a metal case
    rect(54, 178, 18, 8, '#b8915f'); bevel(54, 178, 18, 8, '#cda875', '#8f6e45'); rect(61, 178, 4, 8, '#d8c9a0');            // a cardboard box with tape
    rect(80, 180, 12, 6, C.red); bevel(80, 180, 12, 6, '#e05a4c', '#8e2219');
    rect(10, 168 + d, 160, 1, '#00000033'); rect(10, 189, 160, 1, '#00000033');                                           // shadow under the top and the shelf
  }

  private pegboard() {
    rect(302, 24, 88, 52, '#00000033');
    rect(300, 22, 88, 52, '#b08a5e'); bevel(300, 22, 88, 52, '#c9a577', '#7a5a38'); speckle(301, 23, 86, 50, '#9a7648', 0.06, 80); speckle(301, 23, 86, 50, '#c4a06f', 0.03, 81);
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
    speckle(305, 92, 28, 31, '#e2dcc9', 0.05, 90); rect(326, 121, 7, 2, '#d8d2c4'); rect(329, 122, 4, 1, '#c4bdad'); disc(319, 83, 1, '#7a1f1a'); // yellowed paper, a curling corner, the pin
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
    woodGrain(350, 84, 22, 32, C.wood, C.woodDark, '#a5764a', 91); rect(352, 88, 18, 26, '#f6f3ec'); bevel(352, 88, 18, 26, '#d8d2c4', '#ffffff'); rect(366, 111, 4, 3, '#e6dfcd');
    for (let y = 92; y < 112; y += 3) rect(354, y, y % 2 ? 12 : 14, 1, '#b8b2a6');
    rect(356, 83, 10, 4, C.steel);
  }

  private whiteboard() {
    rect(394, 24, 84, 62, '#00000033');
    rect(392, 22, 84, 62, '#9aa0a5'); rect(394, 24, 80, 58, '#f4f4f0'); rect(396, 82, 76, 3, '#9aa0a5');
    bevel(392, 22, 84, 62, '#c4c9cd', '#6f757a'); bevel(394, 24, 80, 58, '#c9c9c4', '#ffffff');
    stain(430, 64, 24, 8, '#dcdcd6', 82, 0.9); stain(455, 46, 10, 6, '#e2e2dc', 83, 0.8); speckle(395, 25, 78, 56, '#d2d2cc', 0.025, 84); // ghosts of old writing, smudges
    text('NOW:', 398, 28, C.red);
    site.now.forEach((line, i) => text(line, 398, 40 + i * 12, i === 2 ? '#2f8f4e' : '#2c5aa0'));
    rect(430, 81, 8, 2, C.red); rect(440, 81, 8, 2, '#2c5aa0');
  }

  private shelf() {
    rect(390, 198, 86, 4, '#6f685c');
    rect(392, 96, 3, 102, '#6b7075'); rect(471, 96, 3, 102, '#6b7075'); rect(392, 96, 1, 102, '#8b9096'); rect(471, 96, 1, 102, '#8b9096'); rect(394, 96, 1, 102, '#4a4e53'); rect(473, 96, 1, 102, '#4a4e53');
    speckle(392, 96, 3, 102, '#7a4a2a', 0.12, 44); speckle(471, 96, 3, 102, '#7a4a2a', 0.12, 45);
    const boxes = [[C.accent, CYAN, C.red], ['#3d8b4f', C.reflector, NAVY], [C.red, C.accent, '#3d8b4f']];
    [120, 146, 172].forEach((y, row) => {
      boxes[row].forEach((c, k) => {
        const x = 397 + k * 25, h = 16 + ((k + row) % 2) * 3;
        rect(x, y - h, 22, h, '#b8915f'); rect(x, y - h, 22, 2, '#cda875'); rect(x + 5, y - h + 6, 12, 5, c);
        for (let j = y - h + 3; j < y - 1; j += 3) rect(x + 1, j, 20, 1, '#ab8551');                                   // cardboard flutes
        rect(x, y - h, 1, h, '#d3b27f'); rect(x + 21, y - h, 1, h, '#8f6e45'); rect(x + 9, y - h, 4, 4, '#d8c9a0');    // lit edge, shaded edge, a strip of tape
      });
      rect(392, y, 82, 3, '#6b7075'); rect(392, y, 82, 1, '#8b9096'); rect(392, y + 3, 82, 1, '#00000033');
    });
    rect(392, 195, 82, 3, '#6b7075');
    // money plant trailing off the top
    rect(462, 78, 8, 8, '#b3563a'); disc(466, 76, 4, '#4f7d3f'); for (const [x, y] of [[470, 82], [472, 88], [471, 95]]) rect(x, y, 3, 3, '#4f7d3f');
  }

  private toolbox() {
    ellipse(350, 234, 40, 3, '#5f584d');
    rect(318, 150, 64, 78, C.red); rect(318, 150, 64, 3, '#e05a4c'); rect(378, 150, 4, 78, '#a82a1f');
    for (const y of [166, 182, 198, 214]) {
      rect(318, y, 64, 1, '#8e2219'); rect(318, y + 1, 60, 1, '#ea6a5c');                                                // each drawer has a gap and a lit lip
      rect(342, y + 5, 16, 2, C.steel); rect(342, y + 5, 16, 1, '#dfe3e6'); rect(342, y + 7, 16, 1, '#5a1510');            // handle with a highlight and its shadow
    }
    speckle(318, 153, 60, 75, '#c9c3bc', 0.012, 41); speckle(318, 153, 60, 75, '#8e2219', 0.03, 42);                        // chipped paint, dents
    line(324, 208, 338, 200, '#e6786a'); line(350, 224, 366, 219, '#e6786a'); line(330, 172, 336, 170, '#e6786a');            // scratches
    streaks(318, 214, 60, 14, '#7a2a1c', 6, 43); rect(318, 226, 64, 2, '#8e2219');                                           // rust running from the bottom
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
    const d = BENCH_DY;
    rect(92, 128 + d, 52, 3, C.wood); rect(92, 131 + d, 52, 1, C.woodDark);
    rect(96, 110 + d, 44, 18, '#2a2a2e'); rect(97, 111 + d, 42, 16, '#4a4d55'); rect(97, 111 + d, 42, 1, '#6b6f79');
    bevel(96, 110 + d, 44, 18, '#6b6f79', '#15151a'); speckle(97, 111 + d, 42, 16, '#7a7d85', 0.04, 51); speckle(97, 111 + d, 42, 16, '#2a2c32', 0.04, 52);
    for (const cx of [106, 130]) { disc(cx, 119 + d, 6, C.ink); disc(cx, 119 + d, 4, '#33363d'); disc(cx, 119 + d, 1, '#1b1712'); }
    rect(113, 113 + d, 10, 5, C.ink); rect(114, 116 + d, 8, 1, '#4a4d55');
    disc(118, 123 + d, 1, '#7a2f24'); disc(121, 123 + d, 1, '#5a5d66');
    rect(104, 107 + d, 32, 3, '#2a2a2e'); line(136, 110 + d, 143, 98 + d, C.steel); // handle and aerial
  }

  private tyres() {
    const x0 = 2, w = 62, h = 18;
    ellipse(33, 254, 34, 3, '#5f584d');
    for (const y of [189, 205, 221, 237]) {
      rect(x0 + 2, y, w - 4, h, C.tyre); rect(x0, y + 3, w, h - 6, C.tyre);
      rect(x0 + 2, y + 1, w - 4, 1, '#343434'); rect(x0 + 4, y + h - 2, w - 8, 1, '#0c0c0c');
      for (let x = x0 + 4; x < x0 + w - 3; x += 5) rect(x, y + 5, 3, 8, '#262626');
      speckle(x0, y + 1, w, h - 2, '#4a4a4a', 0.05, 46 + y); rect(x0 + 8, y + 3, 16, 1, '#4d4d4d'); rect(x0 + 34, y + 3, 12, 1, '#4d4d4d'); // rubber grain, moulded lettering
    }
    speckle(x0, 189, w, 3, '#7a7466', 0.2, 50); // dust on the top tyre
    rect(76, 232, 10, 20, C.red); rect(78, 228, 6, 4, C.red); rect(79, 225, 4, 3, '#2a2a2e'); // extinguisher, moved clear of the bigger stack
  }

  // ---------------------------------------------------------------- animated bits
  private animate() {
    const t = this.t;
    // TV: glowing static with SOON flashing through
    for (let y = 119 + BENCH_DY; y < 149 + BENCH_DY; y++) for (let x = 28; x < 66; x++) {
      const n = (Math.sin(x * 12.99 + y * 78.23 + Math.floor(t * 12) * 3.7) * 43758.5) % 1;
      rect(x, y, 1, 1, Math.abs(n) > 0.55 ? '#7f8a82' : '#34403a');
    }
    rect(31, 127 + BENCH_DY, 32, 12, '#1d2a22'); text('> HI', 34, 130 + BENCH_DY, '#b8f0c0');
    if (Math.floor(t * 2) % 2 === 0) rect(56, 130 + BENCH_DY, 4, 7, '#b8f0c0'); // blinking cursor
    // the neon stutters in a short burst every so often (about one 7 s slot in three), never with reduced motion
    const slot = Math.floor(t / 7), into = t - slot * 7, roll = Math.abs(Math.sin(slot * 12.9898) * 43758.5453) % 1;
    if (!this.reduced && roll > 0.7 && into < 0.35 && Math.floor(into * 20) % 2 === 0) rect(180, 4, 120, 9, '#3e3127');
    // coffee steam
    for (let k = 0; k < 3; k++) {
      const p = (t * 0.7 + k / 3) % 1;
      rect(159 + Math.round(Math.sin((p + k) * 6) * 2), 148 + BENCH_DY - p * 14, 1, 2, '#f4f2ea');
    }
    windowFall(ctx(), WIN.x, WIN.y, WIN.w, WIN.h, this.weather, t);
    this.sunlight(t);
    this.mood(t);
    fanLive(t);
    if (!this.reduced) mothLive(t);
    compressorPuff(t - this.puffT);
    clockHands(istHMS(new Date()));
    chargerLive(this.hover === 'toolbox' ? t * 3 : t); // it works harder when you look at it
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

  /** The weather's colour over the whole room, so a change at the window is felt everywhere, plus the thunder flash. */
  private mood(t: number) {
    const g = ctx(), k = 1 - this.nightT * 0.5, w = this.weather;
    const tint = w === 'rain' ? ['#1d2a44', 0.18] : w === 'fog' ? ['#cfd6e0', 0.12] : w === 'snow' ? ['#b8c6e4', 0.08] : ['#ffdca0', 0.05];
    g.globalAlpha = (tint[1] as number) * k; rect(0, 0, 480, 270, tint[0] as string);
    const f = w === 'rain' ? stormFlash(t) : 0;
    if (f > 0) { g.globalAlpha = f * 0.3; rect(0, 0, 480, 270, '#e8eeff'); }
    g.globalAlpha = 1;
  }

  /** The window's light lying on the floor, with dust turning in it. It fades as the lights go off and the room takes over. */
  private sunlight(t: number) {
    if (!this.sun) return;
    const g = ctx(), k = 1 - this.nightT;
    if (k < 0.02) return;
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = k; g.drawImage(this.sun, 0, 0);
    if (!this.lowFx) {
      const a = sunStrength(this.weather) * k;
      for (let i = 0; i < 12; i++) {
        const p = (i * 0.083 + t * (0.012 + (i % 3) * 0.004)) % 1, wob = Math.sin(t * 0.8 + i * 2) * 2.5;
        g.globalAlpha = a * (0.4 + 0.5 * Math.sin(t * 1.7 + i * 3) ** 2);
        const lo = SUN.x0 + p * (SUN.px - SUN.x0), hi = SUN.x1 + p * (SUN.px + SUN.pw * 2 + SUN.gap - SUN.x1);
        rect(lo + (hi - lo) * ((i * 0.37) % 1) + wob, SUN.y0 + p * (SUN.y1 - SUN.y0), 1, 1, '#fff6d8');
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  /** A grey cat asleep on the tyre stack. The tail flicks, and now and then it opens an eye. */
  private cat(t: number) {
    const g0 = ctx();
    g0.save(); g0.translate(CAT.dx, CAT.dy); // she sits on top of the stack
    const body = '#3d3d44', shade = '#2c2c33';
    ellipse(22, 208, 8, 5, body); ellipse(22, 211, 8, 2, shade);
    const cyc = t % 24, stretch = !this.reduced && cyc > 20.5 && cyc < 23 ? Math.sin(((cyc - 20.5) / 2.5) * Math.PI) : 0; // now and then she stretches: head down, back up
    const twitch = !this.reduced && t % 9 > 8.75, hy = Math.round(stretch * 2);
    if (stretch > 0.3) ellipse(22, 207, 8, 5, body); // back arched
    disc(30, 203 + hy, 4, body);
    rect(27, twitch ? 199 : 198 + hy, 2, twitch ? 2 : 3, body); rect(32, 198 + hy, 2, 3, body); rect(28, 199 + hy, 1, 1, '#c98f8f');
    const petting = t - this.petT < 2, open = !petting && t % 7 > 6.3; // one slow blink; eyes shut while petted
    if (open) { rect(29, 203 + hy, 1, 1, '#b8f070'); rect(32, 203 + hy, 1, 1, '#b8f070'); } else { rect(29, 204 + hy, 2, 1, shade); rect(32, 204 + hy, 2, 1, shade); }
    if (petting) for (let k = 0; k < 3; k++) { // hearts drifting up
      const p = ((t - this.petT) * 0.9 + k / 3) % 1, x = 24 + k * 7 + Math.round(Math.sin(p * 6 + k) * 2), y = 196 - p * 22;
      const g = ctx(); g.globalAlpha = 1 - p;
      rect(x, y, 2, 2, '#e0555c'); rect(x + 3, y, 2, 2, '#e0555c'); rect(x, y + 2, 5, 2, '#e0555c'); rect(x + 1, y + 4, 3, 1, '#e0555c'); rect(x + 2, y + 5, 1, 1, '#e0555c');
      g.globalAlpha = 1;
    }
    const sway = Math.round(Math.sin(t * (petting ? 5 : 2.2)) * 2);
    line(15, 209, 11, 208 + sway, body); line(11, 208 + sway, 9, 204 + sway, body);
    g0.restore();
  }

  private radioLive(t: number) {
    rect(118 - 1, 122 + BENCH_DY, 3, 2, this.radioOn ? '#5fdc7a' : '#7a2f24');
    if (!this.radioOn) return;
    const d = BENCH_DY, beat = Math.floor(t * 2.27) % 2 === 0; // about 68 bpm
    for (const cx of [106, 130]) { disc(cx, 119 + d, beat ? 5 : 4, '#3a3d45'); disc(cx, 119 + d, 1, C.ink); }
    rect(114, 114 + d, 3 + Math.floor((Math.sin(t * 9) + 1) * 3), 2, '#b8f0c0');
    for (let k = 0; k < 2; k++) { // notes drifting up
      const p = (t * 0.5 + k / 2) % 1, x = 114 + k * 12 + Math.round(Math.sin(p * 8 + k) * 3), y = 104 + d - p * 26;
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
    if (h.id === 'bike') { g.save(); g.translate(Math.round(this.par.x * 2), Math.round(this.par.y * 1)); this.bikeGlow(g); g.restore(); return; } // the glow rides with the bike
    const [x, y, w, hh] = h.rect, pulse = 0.9 + 0.1 * Math.sin(this.t * 5), a = this.glow * pulse * Math.min(1, 9000 / (w * hh)); // big areas (the bike) glow softer
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.28 * a;
    if (h.id !== 'clock') g.drawImage(this.bg, x, y, w, hh, x, y, w, hh); // the object itself, brighter (not the clock: its white face would wash out the hands)
    for (let i = 1; i <= 5; i++) {                              // warm halo, fading outward in steps
      g.globalAlpha = (0.15 / i) * a;
      const o = i * 2;
      rect(x - o, y - o, w + o * 2, 2, '#ffc94d'); rect(x - o, y + hh + o - 2, w + o * 2, 2, '#ffc94d');
      rect(x - o, y - o + 2, 2, hh + o * 2 - 4, '#ffc94d'); rect(x + w + o - 2, y - o + 2, 2, hh + o * 2 - 4, '#ffc94d');
    }
    if (h.id !== 'clock') { g.globalAlpha = 0.03 * a; rect(x, y, w, hh, '#ffd76a'); } // a touch of warmth inside
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
  }

  /** The bike glows in its own shape: the sprite brightens and a warm halo follows its silhouette. */
  private bikeGlow(g: CanvasRenderingContext2D) {
    const k = BIKE.scale, bw = Math.round(this.img.bike.width * k), bh = Math.round(this.img.bike.height * k);
    const bx = Math.round(BIKE.cx - bw / 2), by = BIKE.floor - bh, R = 10;
    if (!this.bikeHalo) {
      const sil = document.createElement('canvas'); sil.width = bw; sil.height = bh;
      const sg = sil.getContext('2d')!; sg.imageSmoothingEnabled = false;
      sg.drawImage(this.img.bike, 0, 0, bw, bh);
      sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#ffc94d'; sg.fillRect(0, 0, bw, bh); // the bike as a flat warm shape
      const halo = document.createElement('canvas') as Sprite; halo.width = bw + R * 2; halo.height = bh + R * 2;
      const hg = halo.getContext('2d')!; hg.imageSmoothingEnabled = false;
      for (const [r, a] of [[8, 0.05], [6, 0.08], [4, 0.12], [2, 0.18]] as const) { // rings, outermost first
        hg.globalAlpha = a;
        for (const [dx, dy] of [[-r, 0], [r, 0], [0, -r], [0, r], [-r, -r], [r, -r], [-r, r], [r, r]]) hg.drawImage(sil, R + dx, R + dy);
      }
      hg.globalAlpha = 1; hg.globalCompositeOperation = 'destination-out';
      hg.drawImage(this.img.bike, R, R, bw, bh);                // keep the glow outside the bike so its detail stays readable
      this.bikeHalo = halo;
    }
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = this.glow * 0.5 * (0.9 + 0.1 * Math.sin(this.t * 5));
    g.drawImage(this.bikeHalo, bx - R, by - R);
    g.globalAlpha = this.glow * 0.1;
    g.drawImage(this.img.bike, bx, by, bw, bh);                 // the bike itself, brighter
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

  /** At night the window is the one soft blue light in the room: a dark sky with stars and a moon, and the weather still visible in it. */
  private nightWindow(g: CanvasRenderingContext2D) {
    if (this.nightT < 0.01) return;
    const { x, y, w, h } = WIN;
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.globalAlpha = this.nightT; windowSky(g, x, y, w, h, this.weather, this.theme);
    g.globalAlpha = this.nightT * 0.62; rect(x, y, w, h, '#0a1230');
    g.globalAlpha = this.nightT;
    if (this.weather === 'clear' || this.weather === 'snow') {
      for (let i = 0; i < 16; i++) { // stars, twinkling
        const sx = x + 4 + Math.floor((i * 37) % (w - 8)), sy = y + 3 + Math.floor((i * 23) % Math.round(h * 0.4));
        g.globalAlpha = this.nightT * (0.4 + 0.6 * Math.sin(this.t * 1.4 + i * 2.1) ** 2); rect(sx, sy, 1, 1, '#f4f2ea');
      }
      g.globalAlpha = this.nightT; disc(x + w - 16, y + 14, 5, '#e8e6d4'); disc(x + w - 14, y + 13, 4, '#0d1636'); // a crescent
    }
    windowFall(g, x, y, w, h, this.weather, this.t);
    g.restore();
    g.globalAlpha = this.nightT; rect(x + w / 2 - 1, y, 2, h, '#3e3127'); rect(x, y + Math.round(h * 0.45), w, 2, '#3e3127'); g.globalAlpha = 1;
  }

  private buildNight() {
    const src = [
      { x: 240, y: 9, r: 100, c: [255, 150, 120] },   // neon sign
      { x: 46, y: 59, r: 62, c: [150, 180, 255] },    // the window: moonlight
      { x: 244, y: 78, r: 66, c: [255, 236, 190] },   // the two posters, spotlit
      { x: 51, y: 134, r: 56, c: [120, 255, 170] },   // CRT
      { x: 365, y: 141, r: 26, c: [130, 255, 170] },  // charger lights
      { x: 163, y: 148, r: 34, c: [255, 200, 110] },  // bench lamp
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

  /** A name on top of an object. Tags drawn in the same pass (the intro shows them all) are kept from overlapping: a clashing one hops above the others, then below its object. */
  private tagFor(h: Hotspot | Control, placed?: number[][]) {
    const label = h.id === 'clock' ? istLabel(new Date(), this.clock24) : h.tag; // the clock's tag is the live time
    const [x, y, w, hh] = h.rect, tw = textW(label) + 6;
    let tx = Math.round(Math.min(480 - tw - 2, Math.max(2, x + w / 2 - tw / 2)));
    let ty = Math.max(18, y - 11);
    const below = ['bookbox', 'map'].includes(h.id); // the poster grid is tight: the lower frames name themselves underneath
    if (below) ty = y + hh + 1;
    if (h.id === 'board') tx = x; // start at its own left edge, clear of the frame beside it
    if (h.id === 'bike') ty = y + 16; // over the tank, clear of the poster names above
    if (placed) {
      const clash = (xx: number, yy: number) => placed.some(([px, py, pw]) => xx < px + pw + 1 && px < xx + tw + 1 && Math.abs(py - yy) < 11);
      const hit = placed.find(([px, py, pw]) => tx < px + pw + 1 && px < tx + tw + 1 && Math.abs(py - ty) < 11);
      if (hit && hit[0] < tx + tw / 2 && hit[0] + hit[2] + 1 - tx < 30) tx = hit[0] + hit[2] + 1; // a neighbour is in the way: slide along, keeping the tag over its own object
      for (let i = 0; i < 3 && clash(tx, ty); i++) ty += below ? 11 : -11;
      if (ty < 18) ty = y + hh + 1;
      placed.push([tx, ty, tw]);
    }
    rect(tx, ty, tw, 10, C.ink);
    text(label, tx + 3, ty + 2, C.accent);
  }

  private counter() {
    if (this.og) return;
    const total = HOTSPOTS.length + CONTROLS.length, n = countFound(this.found, [...HOTSPOTS, ...CONTROLS].map((h) => h.id));
    const s = `FOUND ${n}/${total}`;
    text(s, 474 - textW(s), 5, n === total ? C.accent : '#a89d8b');
  }

  private bar(hot?: Hotspot | Control) {
    rect(0, 256, 480, 14, C.ink);
    if (this.screen.size.portrait) return; // on a portrait phone the page's own button bar covers this strip, so no text here
    text('LIST VIEW', 6, 260, this.hover === 'list' ? C.accent : C.hud);
    text('RIDE AGAIN >', 474 - textW('RIDE AGAIN >'), 260, this.hover === 'ride' ? C.accent : C.hud);
    // Portrait phones only see ~130px of the bar, so keep it short there.
    const narrow = this.screen.size.portrait;
    const isLink = hot === BAR.list || hot === BAR.ride;
    const msg = hot
      ? narrow ? hot.tag || hot.label : isLink ? hot.label : `LOOK AT: ${hot.label}`
      : this.t - this.cheerT < 5 ? 'YOU FOUND EVERYTHING! NICE.'
      : this.t < 5 && !narrow ? site.tagline.toUpperCase()
      : idleMessage(this.t - 5, this.tried, this.touch, narrow);
    textC(msg, 240, 260, hot ? C.accent : '#a89d8b');
  }
}
