// Title card, then the Ladakh ride through four chapters, then pulling up at the garage.
import { box, circle, label, rrect, use } from '../hd/draw';
import { CAM_HEIGHT, CAM_NAMES, CAMS, drawPOV, drawRear, drawTop, type Cam } from '../hd/cameras';
import { envAt } from '../hd/background';
import { renderRoad } from '../hd/road';
import { buildTrack, FINISH, MILESTONE_SEGS, SEG_L, zoneAt, type Segment } from '../hd/track-ladakh';
import { autopilotLane, capBehind, LEFT, spawnTraffic, type Car } from '../hd/traffic';
import { CAM_DEPTH } from '../ride/project';
import { input } from '../engine/input';
import { engine } from '../engine/audio';
import type { Scene } from '../engine/scene';
import type { Screen } from '../engine/screen';
import { milestones, site } from '../../data/site';

const MAX_S = SEG_L * 46;
const OG = typeof location !== 'undefined' && new URLSearchParams(location.search).has('og');
const CHAPTER = (i: number) =>
  i >= FINISH - 90 ? 'ALMOST THERE'
    : ({ leh: 'LEH TOWN', valley: 'INDUS VALLEY', pass: 'KHARDUNG LA', lake: 'THE LAKE' } as const)[zoneAt(i)];

const FONT_DISPLAY = '"Fraunces", Georgia, serif';
const FONT_MONO = '"IBM Plex Mono", ui-monospace, monospace';
const INK = '#1b1712', HUD = '#fff6e0', ACCENT = '#e8b923';

export class RideScene implements Scene {
  mode = 'hd' as const;
  private phase: 'title' | 'ride' | 'arrive' = 'title';
  private segs: Segment[] = buildTrack(milestones);
  private cars: Car[] = spawnTraffic();
  private pos = 0; private px = LEFT; private speed = 0; private lean = 0;
  private cam: Cam = 'behind';
  private bgOff = 0; private t = 0; private odo = 0; private fade = 0; private flash = 0;
  private manualUntil = 0;
  private shown = new Set<number>();
  private banner = { lines: [] as string[], t: 0, big: false };

  constructor(private screen: Screen, private onArrive: () => void, private onSkip: () => void) {}

  enter() {
    input.endFrame();
    const at = Number(new URLSearchParams(location.search).get('at'));
    if (OG) { this.pos = 400 * SEG_L; return; }
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

  private handleTap(): 'skip' | 'cam' | 'sound' | 'other' | null {
    if (!input.tap()) return null;
    const { x, y } = input.pointer, { W, H } = this.screen;
    if (y > H - 48 && x < W * 0.18) return 'skip';
    if (y > H - 48 && x > W - 56) return 'cam';
    if (y > H - 48 && x > W - 112 && x <= W - 56) return 'sound';
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
      const cap = MAX_S * (seg.zone === 'pass' ? 0.86 : 1);
      this.speed = this.speed > cap ? Math.max(cap, this.speed - MAX_S * dt * 0.4) : Math.min(cap, this.speed + MAX_S * dt * 0.45);
    }

    for (const c of this.cars) c.z += c.v * MAX_S * dt;
    const capped = capBehind(this.cars, playerZ, this.px, this.speed, MAX_S);
    this.speed = capped.speed;
    if (capped.blocker && !capped.blocker.warned && this.t <= this.manualUntil) {
      capped.blocker.warned = true;
      this.show('HORN OK PLEASE|STEER TO OVERTAKE');
    }

    const steer = input.steer();
    if (steer) this.manualUntil = this.t + 2.5;
    const target = this.phase === 'arrive' ? LEFT : autopilotLane(this.cars, playerZ);
    if (steer) this.px += steer * dt * 1.5;
    else if (this.t > this.manualUntil) this.px += Math.sign(target - this.px) * Math.min(Math.abs(target - this.px), dt * 1.1);
    this.px -= seg.curve * sp * sp * dt * 0.05;
    this.px = Math.max(-1.25, Math.min(1.25, this.px));
    const leanTo = steer || (Math.abs(target - this.px) > 0.05 ? Math.sign(target - this.px) : 0) || seg.curve * 0.25;
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
    use(g);
    const sp = this.speed / MAX_S, segI = Math.floor(this.pos / SEG_L);
    const env = envAt(segI, FINISH, zoneAt(segI));
    if (this.cam === 'top') drawTop(g, this.segs, this.cars, W, H, this.pos, this.px);
    else {
      renderRoad(g, this.segs, { W, H, HZ, pos: this.pos, px: this.px, camH: CAM_HEIGHT[this.cam], bgOff: this.bgOff, t: this.t, env }, this.cars);
      if (this.cam === 'behind') drawRear(g, W, H, this.lean, this.t, sp);
      else drawPOV(g, W, H, sp, this.t, sp * 138);
    }
    this.hud(W, H, segI);
    if (this.flash > 0) { g.globalAlpha = 0.35; box(0, 0, W, H, '#000'); g.globalAlpha = 1; }
    if (this.fade > 0) { g.globalAlpha = Math.min(1, this.fade / 0.7); box(0, 0, W, H, INK); g.globalAlpha = 1; }
  }

  private pill(s: string, x: number, y: number, px = 13) {
    const g = this.screen.ctx;
    g.font = `400 ${px}px ${FONT_MONO}`;
    const w = g.measureText(s).width + 16;
    rrect(x, y, w, px + 10, 6, INK);
    label(s, x + 8, y + px + 2, px, HUD, { font: FONT_MONO });
  }

  private hud(W: number, H: number, segI: number) {
    if (this.phase === 'title') return this.title(W, H);
    const narrow = W < 700;
    const px = Math.max(12, Math.round(W / 70));
    this.pill(narrow ? 'RAHUL' : site.name.toUpperCase(), 12, 12, px);
    const odo = 'ODO ' + this.odo.toFixed(1).padStart(5, '0');
    const g = this.screen.ctx;
    g.font = `400 ${px}px ${FONT_MONO}`;
    this.pill(odo, W - g.measureText(odo).width - 28, 12, px);
    this.progress(W, segI, narrow, px);
    this.pill('SKIP >', 12, H - px - 22, px);
    // cam + sound buttons
    rrect(W - 52, H - px - 22, 40, px + 10, 6, INK);
    circle(W - 38, H - px / 2 - 14, 6, HUD);
    label('V', W - 24, H - 14, px - 2, ACCENT, { font: FONT_MONO });
    rrect(W - 100, H - px - 22, 42, px + 10, 6, INK);
    label(engine.on ? '♪' : 'M', W - 79, H - 14, px, ACCENT, { font: FONT_MONO, align: 'center' });
    if (this.banner.t > 0) {
      const big = this.banner.big && W >= 700;
      const size = big ? Math.round(W / 18) : Math.round(W / 28);
      this.banner.lines.forEach((ln, k) => {
        label(ln, W / 2, H * 0.22 + k * (size + 8), size, k === 0 ? ACCENT : HUD, {
          align: 'center', font: k === 0 ? FONT_DISPLAY : FONT_MONO, weight: k === 0 ? 400 : 400, shadow: INK,
        });
      });
    }
  }

  private progress(W: number, segI: number, narrow: boolean, px: number) {
    const w = narrow ? Math.min(160, W * 0.35) : Math.min(280, W * 0.4);
    const x0 = W / 2 - w / 2, y = narrow ? 44 : 18;
    rrect(x0 - 8, y - 6, w + 28, 18, 6, INK);
    box(x0, y + 4, w, 2, '#6b645a');
    box(x0, y + 4, (Math.min(segI, FINISH) / FINISH) * w, 2, ACCENT);
    for (const m of MILESTONE_SEGS) {
      const x = x0 + (m / FINISH) * w;
      box(x - 2, y + 1, 4, 8, segI >= m ? ACCENT : '#a89d8b');
    }
    box(x0 + w + 4, y, 8, 10, HUD);
    box(x0 + w + 5, y + 2, 6, 6, '#e8641f');
    const at = x0 + (Math.min(segI, FINISH) / FINISH) * w;
    box(at - 2, y, 5, 12, '#ffffff');
    label(CHAPTER(segI), W / 2, y + 28, Math.max(11, px - 2), HUD, { align: 'center', font: FONT_MONO, shadow: INK });
  }

  private title(W: number, H: number) {
    const namePx = Math.max(28, Math.round(W / 16));
    const y = H * 0.2;
    label(site.name.toUpperCase(), W / 2, y, namePx, HUD, { align: 'center', font: FONT_DISPLAY, shadow: INK });
    label(site.tagline.toUpperCase(), W / 2, y + namePx * 0.9, Math.max(12, Math.round(W / 55)), HUD, {
      align: 'center', font: FONT_MONO, shadow: INK,
    });
    if (OG) {
      label('LFX 2026 MENTEE · PIPECD · CNCF', W / 2, y + namePx * 1.5, Math.max(14, Math.round(W / 40)), ACCENT, {
        align: 'center', font: FONT_MONO, shadow: INK,
      });
      return;
    }
    if (Math.floor(this.t * 2) % 2 === 0) {
      const p = matchMedia('(pointer: coarse)').matches ? 'TAP TO RIDE' : 'PRESS ANY KEY TO RIDE';
      label(p, W / 2, y + namePx * 1.55, Math.max(16, Math.round(W / 36)), ACCENT, {
        align: 'center', font: FONT_MONO, shadow: INK,
      });
    }
    const hint = W < 700 ? 'LADAKH TO THE GARAGE · M: SOUND' : 'LADAKH TO THE GARAGE · QUICK RIDE · M FOR SOUND';
    label(hint, W / 2, H - 36, Math.max(11, Math.round(W / 70)), HUD, { align: 'center', font: FONT_MONO, shadow: INK });
    this.pill('SKIP >', 12, H - 40, Math.max(12, Math.round(W / 70)));
  }
}
