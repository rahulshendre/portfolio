// Title card, then the ride through four chapters, then pulling up at the garage.
import { C } from '../art/palette';
import * as A from '../art/sprites';
import { bind, rect } from '../engine/pixel';
import { text, textC, textW } from '../engine/font';
import { input } from '../engine/input';
import { engine } from '../engine/audio';
import type { Scene } from '../engine/scene';
import type { Screen } from '../engine/screen';
import { paint, type Sprite } from '../engine/sprites';
import { CAM_HEIGHT, CAM_NAMES, CAMS, drawPOV, drawRear, drawTop, type Cam } from '../ride/cameras';
import { CAM_DEPTH } from '../ride/project';
import { renderRoad, type RoadArt } from '../ride/road';
import { buildTrack, FINISH, ghatness, HOARDINGS, MILESTONE_SEGS, SEG_L, TUNNEL, zoneAt, type Segment } from '../ride/track';
import { autopilotLane, capBehind, LEFT, spawnTraffic, type Car } from '../ride/traffic';
import { milestones, site } from '../../data/site';

const MAX_S = SEG_L * 46;
const OG = typeof location !== 'undefined' && new URLSearchParams(location.search).has('og');
const icon = (rows: string[], col: string) => paint(rows[0].length, rows.length, () => rows.forEach((r, y) => [...r].forEach((ch, x) => ch === '#' && rect(x, y, 1, 1, col))));
const CAM_ICON = ['..###....', '#########', '##...####', '##.#.####', '##...####', '#########'];
const SOUND_ON = ['...#..#..', '..##...#.', '####.#.#.', '####.#.#.', '..##...#.', '...#..#..'];
const SOUND_OFF = ['...#.....', '..##.#.#.', '####..#..', '####..#..', '..##.#.#.', '...#.....'];
const CHAPTER = (i: number) =>
  i >= TUNNEL[0] && i < TUNNEL[1] ? 'KHANDALA TUNNEL' : i >= FINISH - 90 ? 'ALMOST THERE'
    : ({ town: 'PUNE OUTSKIRTS', plains: 'OPEN HIGHWAY', ghat: 'SAHYADRI GHATS', plateau: 'THE PLATEAU' } as const)[zoneAt(i)];

export class RideScene implements Scene {
  mode = 'fill' as const;
  private phase: 'title' | 'ride' | 'arrive' = 'title';
  private segs: Segment[] = buildTrack(milestones);
  private cars: Car[] = spawnTraffic();
  private pos = 0; private px = LEFT; private speed = 0; private lean = 0;
  private cam: Cam = 'behind';
  private bgOff = 0; private t = 0; private odo = 0; private fade = 0; private flash = 0;
  private manualUntil = 0;
  private shown = new Set<number>();
  private banner = { lines: [] as string[], t: 0, big: false };
  private art: RoadArt;
  private rider: Sprite; private riderTop: Sprite;
  private icons: Record<string, Sprite>;

  constructor(private screen: Screen, icons: A.Icons, private onArrive: () => void, private onSkip: () => void) {
    const houses = new Map<string, Sprite>();
    this.art = {
      trees: [A.neem(), A.eucalyptus()],
      stall: { CHAI: A.chaiStall('CHAI'), 'VADA PAV': A.chaiStall('VADA PAV') },
      signs: Object.fromEntries(
        [['GARAGE', '24 KM'], ['GHAT SECTION', 'DRIVE SLOW'], ['TUNNEL', 'LIGHTS ON'], ['GARAGE', 'NEXT LEFT']].map(([a, b]) => [`${a}|${b}`, A.highwaySign(a, b)]),
      ),
      garage: A.garageRoadside(),
      cars: { auto: A.autoRear(), truck: A.truckRear(), bus: A.busRear(), car: A.carRear() },
      hoardings: Object.fromEntries(HOARDINGS.map((h) => [h.id, A.hoarding(h.id, icons)])),
      house: (v, shop) => { const k = `${v}|${shop}`; if (!houses.has(k)) houses.set(k, A.house(v, shop)); return houses.get(k)!; },
      cow: A.cow(),
      rocks: [A.rockFace(false), A.rockFace(true)],
      monkey: A.monkey(),
    };
    this.rider = A.riderRear();
    this.riderTop = A.riderTop();
    this.icons = { cam: icon(CAM_ICON, C.hud), on: icon(SOUND_ON, C.hud), off: icon(SOUND_OFF, C.hud) };
  }

  enter() {
    input.endFrame();
    // ?at=700 starts the ride at a segment (handy for checking later chapters).
    const at = Number(new URLSearchParams(location.search).get('at'));
    if (at > 0) {
      this.phase = 'ride'; this.pos = at * SEG_L; this.speed = MAX_S * 0.8;
      MILESTONE_SEGS.filter((m) => m < at).forEach((m) => this.shown.add(m));
      for (const c of this.cars) if (c.z < this.pos) c.z += 400 * SEG_L;
    }
  }
  exit() { engine.mute(); }

  private show(msg: string, big = false, t = 2.6) { this.banner = { lines: msg.split('|'), t, big }; }

  private setCam(c: Cam) {
    if (c === this.cam) return;
    this.cam = c; this.flash = 0.07;
    this.show(`CAM ${CAMS.indexOf(c) + 1}|${CAM_NAMES[c]}`, false, 1.4);
  }

  /** Taps on the bottom corners are buttons: skip (left), sound and camera (right). */
  private handleTap(): 'skip' | 'cam' | 'sound' | 'other' | null {
    if (!input.tap()) return null;
    const { x, y } = input.pointer, { W, H } = this.screen;
    if (y > H - 24 && x < 70) return 'skip';
    if (y > H - 24 && x > W - 40) return 'cam';
    if (y > H - 24 && x > W - 74) return 'sound';
    return 'other';
  }

  update(dt: number) {
    this.t += dt;
    this.banner.t -= dt;
    this.flash -= dt;
    const tap = this.handleTap();
    if (tap === 'skip' || input.pressed('Escape', 'KeyS')) return this.onSkip();
    if (tap === 'cam' || input.pressed('KeyV', 'KeyC')) this.setCam(CAMS[(CAMS.indexOf(this.cam) + 1) % CAMS.length]);
    if (tap === 'sound' || input.pressed('KeyM')) this.show(engine.toggle() ? 'SOUND ON' : 'SOUND OFF', false, 1.2);
    for (const [k, c] of [['Digit1', 'behind'], ['Digit2', 'pov'], ['Digit3', 'top']] as const) if (input.pressed(k)) this.setCam(c);

    if (this.phase === 'title') {
      this.bgOff += dt * 3;
      if (tap === 'other' || input.anyKey()) {
        this.phase = 'ride';
        this.show(matchMedia('(pointer: coarse)').matches ? 'TAP SIDES TO STEER|OR JUST WATCH' : '< > TO STEER|OR JUST WATCH', false, 3);
      }
      input.endFrame();
      return;
    }

    const segI = Math.floor(this.pos / SEG_L), seg = this.segs[segI];
    const playerZ = this.pos + CAM_HEIGHT[this.cam] * CAM_DEPTH;
    const sp = this.speed / MAX_S;

    if (this.phase === 'ride' && segI >= FINISH - 55) { this.phase = 'arrive'; this.show("RAHUL'S|GARAGE", true, 2.2); }
    if (this.phase === 'arrive') {
      const left = (FINISH - 2) * SEG_L - playerZ;
      this.speed = Math.max(0, Math.min(this.speed, Math.sqrt(Math.max(0, left)) * 22));
      if (this.speed < 30) { this.fade += dt; if (this.fade > 0.7) return this.onArrive(); }
    } else {
      const cap = MAX_S * (seg.zone === 'ghat' ? 0.86 : 1); // a touch slower on the ghat
      this.speed = this.speed > cap ? Math.max(cap, this.speed - MAX_S * dt * 0.4) : Math.min(cap, this.speed + MAX_S * dt * 0.45);
    }

    for (const c of this.cars) c.z += c.v * MAX_S * dt;
    const capped = capBehind(this.cars, playerZ, this.px, this.speed, MAX_S);
    this.speed = capped.speed;
    // Only nag people who are steering themselves; the autopilot overtakes on its own.
    if (capped.blocker && !capped.blocker.warned && this.t <= this.manualUntil) { capped.blocker.warned = true; this.show('HORN OK PLEASE|STEER TO OVERTAKE'); }

    // Your input wins for a couple of seconds, then the autopilot keeps left and overtakes.
    const steer = input.steer();
    if (steer) this.manualUntil = this.t + 2.5;
    const target = this.phase === 'arrive' ? LEFT : autopilotLane(this.cars, playerZ);
    if (steer) this.px += steer * dt * 1.5;
    else if (this.t > this.manualUntil) this.px += Math.sign(target - this.px) * Math.min(Math.abs(target - this.px), dt * 1.1);
    this.px -= seg.curve * sp * sp * dt * 0.05;
    this.px = Math.max(-1.25, Math.min(1.25, this.px));
    const leanTo = steer || (Math.abs(target - this.px) > 0.05 ? Math.sign(target - this.px) : 0) || seg.curve * 0.25; // lean into the bend
    this.lean += (leanTo - this.lean) * Math.min(1, dt * 8);

    this.pos += this.speed * dt;
    this.bgOff += seg.curve * sp * dt * 12;
    this.odo += (this.speed * dt) / 9000;
    engine.update(sp);

    MILESTONE_SEGS.forEach((m, k) => {
      if (segI >= m && !this.shown.has(m)) { this.shown.add(m); this.show(`${milestones[k].top}|${milestones[k].label}`, true); }
    });
    input.endFrame();
  }

  draw() {
    const g = this.screen.ctx, { W, H, HZ } = this.screen.size;
    bind(g);
    const sp = this.speed / MAX_S, segI = Math.floor(this.pos / SEG_L);
    const ghat = ghatness(segI);
    const env = { tod: Math.min(1, segI / FINISH), ghat, plains: 1 - ghat };
    if (this.cam === 'top') drawTop(g, this.segs, this.cars, this.riderTop, W, H, this.pos, this.px);
    else {
      renderRoad(g, this.segs, { W, H, HZ, pos: this.pos, px: this.px, camH: CAM_HEIGHT[this.cam], bgOff: this.bgOff, t: this.t, env }, this.cars, this.art);
      if (this.segs[segI]?.tunnel) { g.globalAlpha = 0.28; rect(0, 0, W, H, '#000'); g.globalAlpha = 1; }
      if (this.cam === 'behind') drawRear(g, this.rider, W, H, this.lean, this.t, sp);
      else drawPOV(W, H, sp, this.t, sp * 138);
    }
    this.hud(W, H, segI);
    if (this.flash > 0) rect(0, 0, W, H, '#000');
    if (this.fade > 0) { g.globalAlpha = Math.min(1, this.fade / 0.7); rect(0, 0, W, H, C.ink); g.globalAlpha = 1; }
  }

  private pill(s: string, x: number, y: number, col: string = C.hud) {
    rect(x, y, textW(s) + 8, 11, C.ink);
    text(s, x + 4, y + 2, col);
  }

  private hud(W: number, H: number, segI: number) {
    if (this.phase === 'title') return this.title(W, H);
    const narrow = W < 400;
    this.pill(narrow ? 'RAHUL' : site.name.toUpperCase(), 4, 4);
    const odo = 'ODO ' + this.odo.toFixed(1).padStart(5, '0');
    this.pill(odo, W - textW(odo) - 12, 4);
    this.progress(W, segI, narrow);
    this.pill('SKIP >', 4, H - 15);
    const g = this.screen.ctx;
    rect(W - 36, H - 15, 32, 11, C.ink); g.drawImage(this.icons.cam, W - 32, H - 12); text('V', W - 20, H - 13, C.accent);
    rect(W - 70, H - 15, 30, 11, C.ink); g.drawImage(engine.on ? this.icons.on : this.icons.off, W - 66, H - 12); text('M', W - 54, H - 13, C.accent);
    if (this.banner.t > 0) {
      const s = this.banner.big && W >= 400 ? 3 : 2;
      this.banner.lines.forEach((ln, k) => textC(ln, W / 2, Math.round(H * 0.22) + k * 10 * s, k === 0 ? C.accent : C.hud, s, C.ink));
    }
  }

  /** How far to the garage: milestones as dots, the tunnel as a dark stretch, the garage at the end. */
  private progress(W: number, segI: number, narrow: boolean) {
    const w = narrow ? 96 : 150, x0 = Math.round(W / 2 - w / 2), y = narrow ? 20 : 8;
    const at = (i: number) => x0 + Math.round((Math.min(i, FINISH) / FINISH) * w);
    rect(x0 - 3, y - 3, w + 14, 9, C.ink);
    rect(x0, y + 1, w, 1, '#6b645a');
    rect(at(TUNNEL[0]), y, at(TUNNEL[1]) - at(TUNNEL[0]), 3, '#3a342e');
    rect(x0, y + 1, at(segI) - x0, 1, C.accent);
    for (const m of MILESTONE_SEGS) rect(at(m) - 1, y, 2, 3, segI >= m ? C.accent : '#a89d8b');
    rect(x0 + w + 2, y - 1, 5, 4, C.hud); rect(x0 + w + 3, y, 3, 3, C.reflector);
    rect(at(segI) - 1, y - 1, 3, 5, '#ffffff');
    textC(CHAPTER(segI), W / 2, y + 8, C.hud, 1, C.ink);
  }

  private title(W: number, H: number) {
    const s = W >= 400 ? 4 : 3, y = Math.round(H * 0.18), g = this.screen.ctx;
    g.globalAlpha = 0.28; rect(0, y - 10, W, 9 * s + 62, C.ink); g.globalAlpha = 1;
    textC(site.name.toUpperCase(), W / 2, y, C.hud, s, C.ink);
    textC(site.tagline.toUpperCase(), W / 2, y + 9 * s + 6, C.hud, 1, C.ink);
    if (OG) { textC('LFX 2026 MENTEE · PIPECD · CNCF', W / 2, y + 9 * s + 26, C.accent, 2, C.ink); return; } // share image
    if (Math.floor(this.t * 2) % 2 === 0) {
      const p = matchMedia('(pointer: coarse)').matches ? 'TAP TO RIDE' : 'PRESS ANY KEY TO RIDE';
      textC(p, W / 2, y + 9 * s + 26, C.accent, 2, C.ink);
    }
    const hint = W < 400 ? 'PUNE TO THE GARAGE · M: SOUND' : 'PUNE TO THE GARAGE · 20 SECONDS · M FOR SOUND';
    textC(hint, W / 2, W < 400 ? H - 30 : H - 13, C.hud, 1, C.ink);
    this.pill('SKIP >', 4, H - 15);
  }
}
