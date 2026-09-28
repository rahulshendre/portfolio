// Title card, then the ride, then pulling up at the garage.
import { C } from '../art/palette';
import * as A from '../art/sprites';
import { bind, rect } from '../engine/pixel';
import { text, textC, textW } from '../engine/font';
import { input } from '../engine/input';
import type { Scene } from '../engine/scene';
import type { Screen } from '../engine/screen';
import { paint, type Sprite } from '../engine/sprites';
import { CAM_HEIGHT, CAM_NAMES, CAMS, drawPOV, drawRear, drawTop, type Cam } from '../ride/cameras';
import { CAM_DEPTH } from '../ride/project';
import { renderRoad, type RoadArt } from '../ride/road';
import { buildTrack, FINISH, MILESTONE_SEGS, SEG_L, type Segment } from '../ride/track';
import { autopilotLane, capBehind, LEFT, spawnTraffic, type Car } from '../ride/traffic';
import { milestones, site } from '../../data/site';

const MAX_S = SEG_L * 46;
const CAM_ICON = ['..###....', '#########', '##...####', '##.#.####', '##...####', '#########'];

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
  private rider: Sprite; private riderTop: Sprite; private camIcon: Sprite;

  constructor(private screen: Screen, private onArrive: () => void, private onSkip: () => void) {
    this.art = {
      trees: [A.neem(), A.eucalyptus()],
      stall: A.chaiStall('CHAI'),
      signs: { 'GARAGE|24 KM': A.highwaySign('GARAGE', '24 KM'), 'GARAGE|NEXT LEFT': A.highwaySign('GARAGE', 'NEXT LEFT') },
      garage: A.garageRoadside(),
      auto: A.autoRear(),
      truck: A.truckRear(),
    };
    this.rider = A.riderRear();
    this.riderTop = A.riderTop();
    this.camIcon = paint(9, 6, () => CAM_ICON.forEach((r, y) => [...r].forEach((ch, x) => ch === '#' && rect(x, y, 1, 1, C.ink))));
  }

  enter() { input.endFrame(); }

  private show(msg: string, big = false, t = 2.6) { this.banner = { lines: msg.split('|'), t, big }; }

  private setCam(c: Cam) {
    if (c === this.cam) return;
    this.cam = c; this.flash = 0.07;
    this.show(`CAM ${CAMS.indexOf(c) + 1}|${CAM_NAMES[c]}`, false, 1.4);
  }

  /** Taps on the bottom corners are buttons: skip (left) and camera (right). */
  private handleTap(): 'skip' | 'cam' | 'other' | null {
    if (!input.tap()) return null;
    const { x, y } = input.pointer, { W, H } = this.screen;
    if (y > H - 22 && x < 64) return 'skip';
    if (y > H - 22 && x > W - 40) return 'cam';
    return 'other';
  }

  update(dt: number) {
    this.t += dt;
    this.banner.t -= dt;
    this.flash -= dt;
    const tap = this.handleTap();
    if (tap === 'skip' || input.pressed('Escape', 'KeyS')) return this.onSkip();
    if (tap === 'cam' || input.pressed('KeyV', 'KeyC')) this.setCam(CAMS[(CAMS.indexOf(this.cam) + 1) % CAMS.length]);
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

    // speed
    if (this.phase === 'ride' && segI >= FINISH - 55) { this.phase = 'arrive'; this.show("RAHUL'S|GARAGE", true, 2.2); }
    if (this.phase === 'arrive') {
      const left = (FINISH - 2) * SEG_L - playerZ;
      this.speed = Math.max(0, Math.min(this.speed, Math.sqrt(Math.max(0, left)) * 22));
      if (this.speed < 30) { this.fade += dt; if (this.fade > 0.7) return this.onArrive(); }
    } else this.speed = Math.min(MAX_S, this.speed + MAX_S * dt * 0.45);

    // traffic
    for (const c of this.cars) c.z += c.v * MAX_S * dt;
    const capped = capBehind(this.cars, playerZ, this.px, this.speed, MAX_S);
    this.speed = capped.speed;
    // Only nag people who are steering themselves; the autopilot overtakes on its own.
    if (capped.blocker && !capped.blocker.warned && this.t <= this.manualUntil) { capped.blocker.warned = true; this.show('HORN OK PLEASE|STEER TO OVERTAKE'); }

    // steering: your input wins for a couple of seconds, then the autopilot keeps left and overtakes
    const steer = input.steer();
    if (steer) this.manualUntil = this.t + 2.5;
    const target = this.phase === 'arrive' ? LEFT : autopilotLane(this.cars, playerZ);
    if (steer) this.px += steer * dt * 1.5;
    else if (this.t > this.manualUntil) this.px += Math.sign(target - this.px) * Math.min(Math.abs(target - this.px), dt * 1.1);
    this.px -= seg.curve * sp * sp * dt * 0.05;
    this.px = Math.max(-1.25, Math.min(1.25, this.px));
    this.lean += ((steer || Math.sign(target - this.px) * (Math.abs(target - this.px) > 0.05 ? 1 : 0)) - this.lean) * Math.min(1, dt * 8);

    this.pos += this.speed * dt;
    this.bgOff += seg.curve * sp * dt * 12;
    this.odo += (this.speed * dt) / 9000;

    MILESTONE_SEGS.forEach((m, k) => {
      if (segI >= m && !this.shown.has(m)) { this.shown.add(m); this.show(`${milestones[k].top}|${milestones[k].label}`, true); }
    });
    input.endFrame();
  }

  draw() {
    const g = this.screen.ctx, { W, H, HZ } = this.screen.size;
    bind(g);
    const sp = this.speed / MAX_S;
    if (this.cam === 'top') drawTop(g, this.segs, this.cars, this.riderTop, W, H, this.pos, this.px);
    else {
      renderRoad(g, this.segs, { W, H, HZ, pos: this.pos, px: this.px, camH: CAM_HEIGHT[this.cam], bgOff: this.bgOff, t: this.t }, this.cars, this.art);
      if (this.cam === 'behind') drawRear(g, this.rider, W, H, this.lean, this.t, sp);
      else drawPOV(W, H, sp, this.t, sp * 138);
    }
    this.hud(W, H);
    if (this.flash > 0) rect(0, 0, W, H, '#000');
    if (this.fade > 0) { g.globalAlpha = Math.min(1, this.fade / 0.7); rect(0, 0, W, H, C.ink); g.globalAlpha = 1; }
  }

  private hud(W: number, H: number) {
    if (this.phase === 'title') return this.title(W, H);
    text(site.name.toUpperCase(), 6, 6, C.ink);
    const odo = 'ODO ' + this.odo.toFixed(1).padStart(5, '0');
    text(odo, W - textW(odo) - 6, 6, C.ink);
    text('SKIP >', 6, H - 13, C.hud, 1, C.ink);
    this.screen.ctx.drawImage(this.camIcon, W - 17, H - 13);
    text('V', W - 26, H - 13, C.hud, 1, C.ink);
    if (this.banner.t > 0) {
      const s = this.banner.big && W >= 400 ? 3 : 2;
      this.banner.lines.forEach((ln, k) => textC(ln, W / 2, Math.round(H * 0.18) + k * 10 * s, k === 0 ? C.accent : C.hud, s, C.ink));
    }
  }

  private title(W: number, H: number) {
    const s = W >= 400 ? 4 : 3, y = Math.round(H * 0.2);
    textC(site.name.toUpperCase(), W / 2, y, C.hud, s, C.ink);
    textC(site.tagline.toUpperCase(), W / 2, y + 9 * s + 6, C.ink);
    if (Math.floor(this.t * 2) % 2 === 0) {
      const p = matchMedia('(pointer: coarse)').matches ? 'TAP TO RIDE' : 'PRESS ANY KEY TO RIDE';
      textC(p, W / 2, y + 9 * s + 24, C.accent, 2, C.ink);
    }
    textC('30 SECOND RIDE · SKIP ANYTIME', W / 2, H - 13, C.hud, 1, C.ink);
    text('SKIP >', 6, H - 13, C.hud, 1, C.ink);
  }
}
