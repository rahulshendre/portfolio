// Title card, then the Ladakh ride through four chapters, then pulling up at the garage.
import { box, circle, label, mix, rrect, smooth, use } from '../hd/draw';
import { CAM_HEIGHT, CAM_NAMES, CAMS, drawPOV, drawTop, RIDER_SCALE, type Cam } from '../hd/cameras';
import { drawRider } from '../hd/rider';
import { drawSpeedLines } from '../hd/speed';
import { finish } from '../hd/finish';
import { LowRes } from '../hd/pixel';
import { drawHome, HOME_LEN } from '../hd/arrival';
import type { Look } from '../rail';
import { envAt, hazeAt } from '../hd/background';
import { renderRoad } from '../hd/road';
import { altitude, buildTrack, TOWNS, townAt, PASS_TOP, elevation, FINISH, LAKE_FROM, MILESTONE_SEGS, N, SEG_L, zoneAt, type Segment } from '../hd/track-ladakh';
import { capBehind, honkAt, LEFT, spawnTraffic, type Car } from '../hd/traffic';
import { LIGHTS } from '../hd/props';
import { drawAir, drawLights, drawFlare, drawGround, drawHeadlight, drawLightning, drawNight, drawRain, drawSkyTint, SKIES, type Bolt, type Sky } from '../hd/air';
import { agility, lateralStep, step as bikeStep, V_CRUISE, V_TOP } from '../hd/physics';
import { drawCluster, drawPedals, pedalAt } from '../hd/cluster';
import { CAM_DEPTH } from '../ride/project';
import { input } from '../engine/input';
import { engine, isMuted, radio } from '../engine/audio';
import { loadRadio } from '../state';
import type { Scene } from '../engine/scene';
import type { Screen } from '../engine/screen';
import { milestones, site } from '../../data/site';

const MAX_S = SEG_L * 37;
/** The speedometer's top: the bike never shows more than this. */
const KMH = 110;
/** World units per second for each metre per second of the bike's real speed, chosen so the top speed lands on MAX_S. */
const K = MAX_S / (110 / 3.6);
/** Visitors who ask their system for less motion get a steady picture: no shake, no view punch. */
const REDUCED = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const OG = typeof location !== 'undefined' && new URLSearchParams(location.search).has('og');
/** Places worth a card of their own, besides the milestones. */
const EVENTS = [
  { i: 8, top: 'LEH', sub: '3,500 M · THE START' },
  { i: PASS_TOP, top: 'KHARDUNG LA', sub: '5,359 M · YOU MADE IT' },
  { i: LAKE_FROM + 40, top: 'THE LAKE', sub: '4,225 M · NEARLY HOME' },
  ...TOWNS.filter((t) => t.sub).map((t) => ({ i: t.gate + 3, top: t.name, sub: t.sub })),
];
const CHAPTER = (i: number) => townAt(i) ??
  (i >= FINISH - 90 ? 'ALMOST THERE'
    : ({ leh: 'LEH TOWN', valley: 'INDUS VALLEY', pass: 'KHARDUNG LA', lake: 'THE LAKE' } as const)[zoneAt(i)]);

const FONT_DISPLAY = '"Fraunces", Georgia, serif';
const FONT_MONO = '"IBM Plex Mono", ui-monospace, monospace';
const INK = '#1b1712', HUD = '#fff6e0', ACCENT = '#e8b923';

export class RideScene implements Scene {
  mode = 'hd' as const;
  private phase: 'title' | 'ride' | 'arrive' = 'title';
  private segs: Segment[] = buildTrack(milestones);
  private cars: Car[] = spawnTraffic();
  private pos = 0; private px = LEFT; private speed = 0; private lean = 0; private braking = false; private lastSpeed = 0; private avgDt = 1 / 60; private lite = false; private honkT = 0; private gearNow = 0; private birdT = 2; private rung = new Set<number>();
  private photo = false; private photoT = 0; private paused = false; private lights: 'auto' | 'on' | 'off' = 'auto'; private gas = false; private brake = false; private trip = 0; private vx = 0; private bolt: Bolt | null = null; private boltIn = 6; private night = false; private nightK = 0; private gasWas = false; private rough = 0; private bumpT = 0; private rideT = 0; private topKmh = 0; private passed = 0; private honks = 0; private stopT = 0; private sky: Sky = 'clear';
  private cam: Cam = 'behind';
  private homeT = 0;   // how long the side shot of your bike rolling into the garage has been showing
  private bikeImg: HTMLImageElement | null = null;   // the garage's own picture of your bike, shown on the arrival card
  private pixel = typeof location !== 'undefined' && new URLSearchParams(location.search).has('pixel'); private low = new LowRes();
  private bgOff = 0; private t = 0; private odo = 0; private fade = 0; private flash = 0;
  private shown = new Set<number>();
  private banner = { lines: [] as string[], t: 0, big: false, total: 2.6 };

  constructor(private screen: Screen, private onArrive: () => void, private onSkip: () => void) {}

  enter() {
    const im = new Image(); im.onload = () => { this.bikeImg = im; }; im.src = '/sprites/bike-side-lg.png';
    addEventListener('blur', this.autoPause);                          // switching away pauses the ride
    input.endFrame();
    const at = Number(new URLSearchParams(location.search).get('at'));
    const w = new URLSearchParams(location.search).get('weather') as Sky | null;
    if (w && SKIES.includes(w)) this.sky = w;
    if (new URLSearchParams(location.search).has('night')) { this.night = true; this.nightK = 1; }
    if (OG) { this.pos = 400 * SEG_L; return; }
    if (at > 0) {
      this.startSound(); this.phase = 'ride'; this.pos = at * SEG_L; this.speed = V_CRUISE * K;
      MILESTONE_SEGS.filter((m) => m < at).forEach((m) => this.shown.add(m));
      EVENTS.filter((e) => e.i < at).forEach((e) => this.shown.add(e.i));
      for (const c of this.cars) if (c.z < this.pos) c.z += c.v < 0.1 ? 0 : 400 * SEG_L;   // vehicles behind you reappear ahead; the slow herds stay behind
    }
  }
  /** True once a slow device has made the ride drop its costly extras. */
  get isLite() { return this.lite; }
  /** Reports the view, night, weather, light and look settings to the page's buttons whenever one changes. */
  onLook?: (l: Look) => void;
  private lookKey = '';
  private publishLook() {
    const l: Look = { cam: CAM_NAMES[this.cam], night: this.night, sky: this.sky, lights: this.lights, pixel: this.pixel };
    const k = JSON.stringify(l);
    if (k !== this.lookKey) { this.lookKey = k; this.onLook?.(l); }
  }
  private autoPause = () => { if (this.phase === 'ride' && !this.paused) { this.paused = true; engine.update(0, 0, { river: 0, lake: 0, alt: 0 }); } };
  exit() { engine.mute(); radio.setLevel(1); removeEventListener('blur', this.autoPause); }

  /** The engine catches and the ride's ambience begins. Called from a key press or tap, so the browser lets it play. */
  private startSound() {
    engine.begin();
    if (!isMuted() && loadRadio() && !radio.on) radio.autostart();
    engine.setRain(this.sky === 'rain' ? 1 : 0);
    radio.setLevel(0.85);                                                              // the radio sits under the engine
  }

  private honk() {
    this.honkT = 0.9; this.honks++;
    engine.horn();
    if (!honkAt(this.cars, this.pos + CAM_HEIGHT[this.cam] * CAM_DEPTH, this.px)) return;
    this.show('PEEP PEEP|THEY MOVE OVER', false, 1.6);
    setTimeout(() => engine.truckHorn(), 380);
  }

  /** Photo mode: the clean frame, saved as a PNG. */
  private savePhoto() {
    this.screen.canvas.toBlob((b) => {
      if (!b) return;
      const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'ladakh-ride.png'; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, 'image/png');
    this.flash = 0.12;
  }

  private show(msg: string, big = false, t = big ? 3.4 : 2.6) { this.banner = { lines: msg.split('|'), t, big, total: t }; }

  private setCam(c: Cam) {
    if (c === this.cam) return;
    this.cam = c; this.flash = 0.07;
    this.show(`CAM ${CAMS.indexOf(c) + 1}|${CAM_NAMES[c]}`, false, 1.4);
  }

  private handleTap(): 'skip' | 'cam' | 'sound' | 'horn' | 'other' | null {
    if (!input.tap()) return null;
    const d = this.screen.size.dpr, x = input.pointer.x / d, y = input.pointer.y / d, W = this.screen.W / d, H = this.screen.H / d;   // the HUD is laid out in CSS pixels
    if (y > H - 48 && x < W * 0.18) return 'skip';
    if (y > H - 48 && x > W - 56) return 'cam';
    if (y > H - 48 && x > W - 112 && x <= W - 56) return 'sound';
    if (y > H - 48 && x > W - 160 && x <= W - 112) return 'horn';
    return 'other';
  }

  update(dt: number) {
    this.t += dt;
    input.poll();
    this.publishLook();
    // a slow device (frames longer than about 32 ms for a while) drops the priciest effects; it never switches back, so it can't flicker
    this.avgDt += (Math.min(dt, 0.25) - this.avgDt) * 0.05;
    if (!this.lite && this.t > 2 && this.avgDt > 0.032) this.lite = true;
    this.banner.t -= dt;
    this.honkT -= dt;
    if (this.sky === 'rain') {                                                                    // storms throw lightning now and then, with thunder that lags the flash
      this.boltIn -= dt;
      if (this.boltIn <= 0) { this.boltIn = 7 + Math.random() * 14; this.bolt = { age: 0, x: 0.12 + Math.random() * 0.76, seed: Math.random() * 100 }; engine.thunder(0.5 + Math.random() * 1.8, 0.6 + Math.random() * 0.7); }
    }
    if (this.bolt && (this.bolt.age += dt) > 0.9) this.bolt = null;
    this.nightK += ((this.night ? 1 : 0) - this.nightK) * Math.min(1, dt * 1.6);
    this.photoT -= dt;
    this.flash -= dt;
    const tap = this.handleTap();
    if (tap === 'skip' || input.pressed('Escape')) return this.onSkip();
    if (tap === 'cam' || input.pressed('KeyV', 'KeyC')) this.setCam(CAMS[(CAMS.indexOf(this.cam) + 1) % CAMS.length]);
    if (tap === 'sound' || input.pressed('KeyM')) {                                     // the same switch as the page's SOUND button
      const btn = document.getElementById('sound'); btn?.click();
      this.show(btn?.getAttribute('aria-pressed') === 'true' ? 'SOUND ON' : 'SOUND OFF', false, 1.2);
    }
    if (this.phase === 'ride' && (tap === 'horn' || input.pressed('KeyH', 'Space'))) this.honk();
    if (this.phase !== 'title') {
      if (input.pressed('KeyP') || (this.paused && tap === 'other')) { this.paused = !this.paused; if (this.paused) engine.update(0, 0, { river: 0, lake: 0, alt: 0 }); }   // a tap carries on too, for phones
      if (input.pressed('KeyL')) { this.lights = this.lights === 'on' ? 'off' : 'on'; this.show(this.lights === 'on' ? 'HEADLIGHT ON' : 'HEADLIGHT OFF', false, 1.2); }
      if (input.pressed('KeyN')) { this.night = !this.night; this.show(this.night ? 'NIGHT RIDE|LIGHTS ON' : 'DAYLIGHT', false, 1.6); }
      if (input.pressed('KeyT')) { this.sky = SKIES[(SKIES.indexOf(this.sky) + 1) % SKIES.length]; engine.setRain(this.sky === 'rain' ? 1 : 0); this.show(`WEATHER|${this.sky.toUpperCase()}`, false, 1.6); }
      if (input.pressed('KeyG')) { this.pixel = !this.pixel; this.show(this.pixel ? 'PIXEL LOOK|G FOR SMOOTH' : 'SMOOTH LOOK|G FOR PIXEL', false, 1.6); }
      if (input.pressed('KeyR')) this.show(radio.toggle() ? 'RADIO ON' : 'RADIO OFF', false, 1.2);
      if (input.pressed('KeyK')) this.show('W GAS · S BRAKE · A D STEER|H HONK · L LIGHT · P PAUSE|V OR 1-4 CAMERA · F PHOTO · R RADIO|T WEATHER · N NIGHT · G PIXEL · M SOUND · ESC EXIT', false, 4.5);
    }
    CAMS.forEach((c, i) => { if (input.pressed('Digit' + (i + 1))) this.setCam(c); });
    if (this.phase !== 'title' && input.pressed('KeyF')) { this.photo = !this.photo; this.photoT = 3; }
    if (this.photo && input.pressed('Enter')) this.savePhoto();

    if (this.phase === 'title') {
      this.bgOff += dt * 3;
      if (tap === 'other' || input.anyKey()) {
        this.phase = 'ride'; this.startSound();
        this.show(matchMedia('(pointer: coarse)').matches ? 'TAP SIDES TO STEER|GAS AND BRAKE BELOW' : 'W GAS · S BRAKE · A D STEER|K FOR ALL KEYS', false, 3.5);
      }
      input.endFrame();
      return;
    }

    if (this.paused) { input.endFrame(); return; }
    const d0 = this.screen.size.dpr, held = input.pointerDown ? pedalAt(this.screen.W / d0, this.screen.H / d0, input.pointer.x / d0, input.pointer.y / d0) : null;
    this.gas = input.down.has('ArrowUp') || input.down.has('KeyW') || input.padGas || held === 'gas';
    this.brake = input.down.has('ArrowDown') || input.down.has('KeyS') || input.padBrake || held === 'brake';
    const segI = Math.floor(this.pos / SEG_L), seg = this.segs[segI];
    const playerZ = this.pos + CAM_HEIGHT[this.cam] * CAM_DEPTH;
    const sp = this.speed / MAX_S;

    if (this.phase === 'ride' && segI >= FINISH - 55) { this.phase = 'arrive'; this.show("RAHUL'S|GARAGE", true, 2.2); }
    if (this.phase === 'arrive') {
      const left = (FINISH - 2) * SEG_L - playerZ;
      // roll to a stop at the garage door: follow a gentle braking curve, but never shed speed faster than a firm brake would
      this.speed = Math.max(0, Math.min(this.speed, Math.max(Math.sqrt(Math.max(0, left)) * 22, this.speed - MAX_S * dt * 0.22)));
      if (this.speed < 30) {                                                                      // pulled up: the engine settles, a summary of the ride shows, then the door opens
        if (this.stopT === 0) { this.stopT = 0.001; engine.mute(); radio.setLevel(1); }
        this.stopT += dt;
        if (this.stopT > 2.4) this.homeT += dt;                                                   // then a side shot: your bike rolls into the bay
        if (this.homeT > HOME_LEN || (this.homeT > 0.9 && (tap === 'other' || input.anyKey()))) { this.fade += dt; if (this.fade > 0.7) return this.onArrive(); }
      }
    } else {
      // real forces: thrust against drag, rolling resistance, the slope under the wheels and the brakes. With nothing pressed
      // the bike settles to a relaxed 55 km/h; gas climbs toward 110, and the climb up to the pass costs it speed.
      const grade = ((seg.y2 - seg.y1) / SEG_L) * 0.6;
      this.speed = bikeStep(this.speed / K, dt, { gas: this.gas, brake: this.brake, grade, cruise: V_CRUISE, top: V_TOP * (seg.zone === 'pass' ? 0.92 : 1), rough: this.rough, side: this.vx, grip: { clear: 1, fog: 0.95, rain: 0.65, snow: 0.55 }[this.sky] }) * K;
    }

    for (const c of this.cars) {
      const before = c.z - playerZ;
      c.z += c.v * MAX_S * dt;
      if (before > 0 && c.z - playerZ <= 0 && Math.abs(c.o - this.px) < 0.9 && this.speed > MAX_S * 0.25) { engine.whoosh(); if (c.kind !== 'goats' && c.kind !== 'marmot') this.passed++; }   // just went by
      if (c.lat) {                                                                                   // animals cross once you are close, hurrying if you honk
        if (c.z - playerZ < 60 * SEG_L && Math.abs(c.o) < 3) c.o += c.lat * (c.hurry && c.hurry > 0 ? 2.6 : 1) * dt;
        if (c.hurry) c.hurry -= dt;
        continue;
      }
      if (c.yieldT && c.yieldT > 0) { c.yieldT -= dt; c.o += (-0.9 - c.o) * Math.min(1, dt * 2.5); }   // pulled over after a honk
      else if (c.o !== LEFT) c.o += (LEFT - c.o) * Math.min(1, dt * 1.5);
    }
    const capped = capBehind(this.cars, playerZ, this.px, this.speed, MAX_S);
    this.speed = capped.speed;
    if (capped.blocker && !capped.blocker.warned) {
      capped.blocker.warned = true;
      this.show(matchMedia('(pointer: coarse)').matches ? 'STUCK BEHIND A TRUCK|HONK, OR STEER AROUND' : 'STUCK BEHIND A TRUCK|H TO HONK, OR STEER AROUND');
    }

    const steer = held ? 0 : input.steer();   // a finger on a pedal is not a steering touch
    // nothing steers the bike but you. Sideways motion has inertia and depends on forward speed: a bike that is not moving does not slide about
    const vNow = this.speed / K;
    this.vx = lateralStep(this.vx, dt, { v: vNow, steer, laneError: 0 });
    // a bend pushes a fast bike wide: the harder the bend and the faster you are, the more you must lean into it
    this.px += this.vx * dt - seg.curve * sp * sp * dt * 0.1 * agility(vNow);
    // sideswipe: touching a vehicle beside you shoves you away from it and scrubs speed
    for (const c of this.cars) {
      if (c.lat || c.kind === 'marmot') continue;
      const gap = c.z - playerZ;
      if (Math.abs(gap) < 0.7 * SEG_L && Math.abs(c.o - this.px) < 0.3) {
        this.vx += (this.px >= c.o ? 1 : -1) * 2.2 * dt * 8; this.speed *= 1 - dt * 1.5;
        if (this.bumpT <= 0) { this.bumpT = 1.2; engine.thud(); this.show('CAREFUL|WATCH THE TRAFFIC', false, 1.2); }
      }
    }
    this.bumpT -= dt;
    // the tarmac ends near |1.1|: past it the ground is gravel, dust and stones
    this.rough = Math.min(1, Math.max(0, (Math.abs(this.px) - 1.08) / 0.12));
    if (this.px > 1.3 || this.px < -1.3) { this.px = Math.max(-1.3, Math.min(1.3, this.px)); this.vx *= -0.2; }
    const leanTo = Math.max(-1, Math.min(1, this.vx / 1.4)) + seg.curve * 0.25 * agility(vNow);     // lean follows the sideways motion and the bend, and vanishes at a standstill
    this.lean += (Math.max(-1, Math.min(1, leanTo)) - this.lean) * Math.min(1, dt * 8);

    this.braking = this.brake || this.speed < this.lastSpeed - MAX_S * dt * 0.05; // slowing down lights the tail lamp
    this.lastSpeed = this.speed;
    this.pos += this.speed * dt;
    this.bgOff += seg.curve * sp * dt * 12;
    this.odo += (this.speed * dt) / 9000;
    this.trip = this.odo;
    const lift = this.gasWas && !this.gas && !this.brake && sp > 0.6;                             // rolled off the throttle at speed
    if (lift) engine.pop();
    this.gasWas = this.gas;
    const lean = Math.abs(this.vx) / 1.4 * sp + Math.abs(seg.curve) * sp * sp * 0.1;                 // how hard the tyres are working
    engine.surface(Math.min(1, Math.max(0, lean - 0.45) * 2.4) * (this.sky === 'rain' ? 1.4 : 1), this.rough * Math.min(1, sp * 2));
    this.rideT += dt; this.topKmh = Math.max(this.topKmh, sp * KMH);
    const gr = sp < 0.02 ? 0 : Math.min(6, 1 + Math.floor(sp * 6.4));
    if (gr !== this.gearNow) { if (this.gearNow && gr) engine.shift(); this.gearNow = gr; }
    engine.update(sp, gr ? Math.min(1, Math.max(0, sp * 6.4 - (gr - 1))) : 0, {
      river: smooth(270, 300, segI) * (1 - smooth(670, 700, segI)), lake: smooth(LAKE_FROM - 30, LAKE_FROM + 20, segI), alt: altitude(segI),
    }, this.gas ? 1 : this.brake ? 0 : 0.3);
    this.birdT -= dt;
    if (this.birdT < 0) { this.birdT = 3 + Math.random() * 7; if (altitude(segI) < 0.5 && this.speed < MAX_S * 0.95 && !this.night) engine.chirp(); }   // birds in the valley and by the lake, none up in the snow
    if (!this.rung.has(segI) && seg.props.some((p) => p.type === 'stupahill' || p.type === 'palace' || p.type === 'gompa')) { this.rung.add(segI); engine.gong(); }

    for (const e of EVENTS) if (segI >= e.i && !this.shown.has(e.i)) { this.shown.add(e.i); engine.chime(); this.show(`${e.top}|${e.sub}`, true); }
    MILESTONE_SEGS.forEach((m, k) => {
      if (segI >= m && !this.shown.has(m)) { this.shown.add(m); engine.chime(); this.show(`${milestones[k].top}|${milestones[k].label}`, true); }
    });
    input.endFrame();
  }

  draw() {
    const full = this.screen.ctx, { W: FW, H: FH, HZ } = this.screen.size;
    const small = this.pixel ? this.low.fit(FW, FH) : null;                          // pixel look: the world goes on a small canvas, the HUD stays sharp on the full one
    const g = small ? this.low.ctx : full, W = small ? small.W : FW, H = small ? small.H : FH;
    use(g);
    const sp = this.speed / MAX_S, segI = Math.floor(this.pos / SEG_L);
    const env = { ...envAt(segI, FINISH, zoneAt(segI)), lite: this.lite, night: this.nightK };
    if (this.cam === 'top') {
      drawTop(g, this.segs, this.cars, W, H, this.pos, this.px, this.t);
      if (!this.lite) finish(g, W, H, HZ, env.tod, false, !small);
    }
    else {
      g.save();
      const punch = REDUCED ? 1 : 1 + Math.max(0, sp - 0.8) * 0.2 + (this.gas && sp > 0.9 ? 0.012 : 0);   // at full throttle the view widens a touch
      g.translate(W / 2, H * HZ); g.scale(punch, punch); g.translate(-W / 2, -H * HZ);
      if (!REDUCED) g.translate(0, Math.round(Math.sin(this.t * 47) * sp * sp * 1.6 + Math.sin(this.t * 19) * sp * 0.7)); // the road hums up through the suspension at speed
      renderRoad(g, this.segs, { W, H, HZ, pos: this.pos, px: this.px, camH: CAM_HEIGHT[this.cam], bgOff: this.bgOff, t: this.t, env, lite: this.lite, haze: this.nightK > 0.01 ? mix(hazeAt(env.tod), '#232b58', this.nightK) : hazeAt(env.tod), fogK: this.sky === 'fog' ? 2.4 : 1 }, this.cars);
      g.restore();
      if (!this.lite) drawSpeedLines(g, W, H, HZ, sp, this.t);
      drawSkyTint(g, W, H, HZ, this.sky);
      drawNight(g, W, H, this.nightK);
      if (this.nightK > 0.3) drawLights(g, LIGHTS);
      if (!this.lite) drawGround(g, W, H, HZ, this.t, sp, this.nightK > 0.5 ? 0 : env.tod, segI, this.sky === 'rain' ? 1 : 0, this.nightK);
      if (!this.lite) drawAir(g, W, H, HZ, this.t, sp, segI, env.tod, this.sky);
      if (!this.lite && this.sky === 'clear' && this.nightK < 0.3) drawFlare(g, W, H, HZ, env.tod);
      if (!this.lite && this.sky === 'rain') drawRain(g, W, H, this.t, sp);
      if (this.bolt) drawLightning(g, W, H, HZ, this.bolt);
      if (!this.lite) finish(g, W, H, HZ, env.tod, this.nightK > 0.5, !small);   // grade, vignette and grain over the world, under the rider and the HUD
      const beam = this.lights === 'off' ? 0 : Math.max(this.lights === 'on' ? 0.5 : 0, env.tod > 0.55 ? (env.tod - 0.55) / 0.45 : 0, this.nightK * 1.4);
      const beamA = Math.min(1, beam);
      if (!this.lite && beamA > 0) drawHeadlight(g, W, H, HZ, this.lean, beamA);
      if (this.cam === 'behind' || this.cam === 'high') drawRider(g, W, H, this.lean, this.t, sp, this.braking, RIDER_SCALE[this.cam]);
      else drawPOV(g, W, H, sp, this.t, sp * KMH);
    }
    if (small) this.low.blit(full, FW, FH);
    use(full);
    const d = this.screen.size.dpr;
    full.save(); full.scale(d, d);                                                 // HUD in CSS pixels, so it stays a readable size on a phone
    if (!this.photo) this.hud(FW / d, FH / d, segI);
    else if (this.photoT > 0) { const cw = FW / d; this.pill('PHOTO MODE  ·  ENTER SAVES  ·  F EXITS', cw / 2 - 150, (FH / d) - 46, 13); }
    full.restore();
    if (this.homeT > 0) {                                                                      // the side shot wipes in from the left over the road
      const wipe = Math.min(1, this.homeT / 0.7), w = (1 - Math.pow(1 - wipe, 3)) * FW;
      full.save(); full.beginPath(); full.rect(0, 0, w, FH); full.clip();
      drawHome(full, FW, FH, Math.max(0, this.homeT - 0.5), this.bikeImg, REDUCED);
      full.restore(); use(full);
      if (wipe < 1) box(w - 6, 0, 6, FH, ACCENT);
    }
    if (this.flash > 0) { full.globalAlpha = 0.35; box(0, 0, FW, FH, '#000'); full.globalAlpha = 1; }
    if (this.fade > 0) { full.globalAlpha = Math.min(1, this.fade / 0.7); box(0, 0, FW, FH, INK); full.globalAlpha = 1; }
  }

  private pill(s: string, x: number, y: number, px = 13) {
    const g = this.screen.ctx;
    g.font = `400 ${px}px ${FONT_MONO}`;
    const w = g.measureText(s).width + 16;
    rrect(x, y, w, px + 10, 6, INK);
    label(s, x + 8, y + px + 2, px, HUD, { font: FONT_MONO });
  }

  /** Milestones and camera notes ride in a card slid in from the left, so the road ahead stays clear. */
  private card(W: number, H: number, narrow: boolean) {
    const g = this.screen.ctx, T = this.banner.t, total = this.banner.total;
    const inn = Math.min(1, (total - T) / 0.35), out = Math.min(1, T / 0.35), e = 1 - Math.pow(1 - Math.min(inn, out), 3);
    const big = this.banner.big;
    const px = Math.max(13, Math.round(W / (narrow ? 30 : 62)));
    const head = big ? Math.round(px * 2.3) : px;
    const lines = this.banner.lines;
    g.font = `400 ${head}px ${FONT_DISPLAY}`; const w0 = g.measureText(lines[0] ?? '').width;
    g.font = `500 ${px}px ${FONT_MONO}`; const w1 = Math.max(0, ...lines.slice(1).map((l) => g.measureText(l).width));
    const cw = Math.max(w0, w1) + 44, ch = head + 22 + (lines.length - 1) * (px + 8) + (big ? 10 : 0);
    const x = -cw + (cw + 16) * e, y = 96;                                    // below the page's SOUND and HELP buttons
    g.save(); g.globalAlpha = Math.min(1, e * 1.2);
    rrect(x, y, cw, ch, 8, 'rgba(27,23,18,0.86)');
    box(x, y + 6, 4, ch - 12, ACCENT);
    lines.forEach((ln, k) => {
      if (k === 0) label(ln, x + 20, y + 14 + head * 0.82, head, ACCENT, { font: FONT_DISPLAY });
      else label(ln, x + 20, y + 14 + head + (big ? 8 : 4) + k * (px + 8) - 4, px, HUD, { font: FONT_MONO });
    });
    g.restore();
  }

  private hud(W: number, H: number, segI: number) {
    if (this.phase === 'title') return this.title(W, H);
    const narrow = W < 700, coarse = matchMedia('(pointer: coarse)').matches;
    const px = coarse ? 14 : Math.max(12, Math.round(W / 70));
    this.pill(narrow ? 'RAHUL' : site.name.toUpperCase(), 124, 12, px);   // clear of the page's SOUND button in the corner
    const odo = 'ODO ' + this.odo.toFixed(1).padStart(5, '0');
    const g = this.screen.ctx;
    g.font = `400 ${px}px ${FONT_MONO}`;
    this.pill(odo, W - g.measureText(odo).width - 28, 12, px);
    this.progress(W, segI, narrow, px);
    this.pill('SKIP >', 12, H - px - 22, px);
    // cam + sound buttons
    rrect(W - 52, H - px - 22, 40, px + 10, 6, INK);
    circle(W - 38, H - px - 22 + (px + 10) / 2, 6, HUD);
    label('V', W - 24, H - px - 22 + px + 2, px - 2, ACCENT, { font: FONT_MONO });
    rrect(W - 100, H - px - 22, 42, px + 10, 6, INK);
    label(isMuted() ? 'M' : '♪', W - 79, H - px - 22 + px + 2, px, ACCENT, { font: FONT_MONO, align: 'center' });
    rrect(W - 148, H - px - 22, 42, px + 10, 6, this.honkT > 0 ? ACCENT : INK);
    label('H', W - 127, H - px - 22 + px + 2, px, this.honkT > 0 ? INK : ACCENT, { font: FONT_MONO, align: 'center' });
    if (this.honkT > 0) this.peep(W, H);
    {                                                                                       // the dashboard shows in every view and right up to the garage door
      const sp = this.speed / MAX_S, sg = this.segs[Math.min(N - 1, segI)], temp = 16 - (elevation(segI) - 3500) / 1859 * 22 - sg.i / FINISH * 3;
      const gear = sp < 0.02 ? 0 : Math.min(6, 1 + Math.floor(sp * 6.4));
      const beam = this.lights === 'on' || (this.lights === 'auto' && (envAt(segI, FINISH, zoneAt(segI)).tod > 0.55 || this.nightK > 0.5));
      drawCluster(g, 12, H - px - 22 - 106 - (coarse ? 132 : 0), narrow ? 0.9 : 1, { kmh: sp * KMH, frac: sp, gear, elev: elevation(segI), temp, trip: this.trip, lights: beam }, narrow);
    }
    if (coarse && this.phase === 'ride') drawPedals(g, W, H, this.gas, this.brake);
    if (this.stopT > 0.4) this.summary(W, H);
    if (this.paused) {
      g.fillStyle = 'rgba(20,14,8,0.5)'; g.fillRect(0, 0, W, H);
      label('PAUSED', W / 2, H * 0.45, Math.max(28, Math.round(W / 18)), ACCENT, { font: FONT_DISPLAY, align: 'center', shadow: INK });
      label(matchMedia('(pointer: coarse)').matches ? 'TAP TO CARRY ON' : 'P TO CARRY ON', W / 2, H * 0.45 + 34, 14, HUD, { font: FONT_MONO, align: 'center' });
    }
    if (this.banner.t > 0) this.card(W, H, narrow);
  }

  /** "PEEP PEEP" pops up over the rider for a moment after a honk. */
  private peep(W: number, H: number) {
    const g = this.screen.ctx, a = Math.min(1, this.honkT / 0.3), px = Math.max(18, Math.round(W / 38)), y = H * 0.66 - (0.9 - this.honkT) * 26;
    g.save(); g.globalAlpha = a;
    label('PEEP PEEP', W / 2, y, px, ACCENT, { font: FONT_DISPLAY, align: 'center', shadow: INK, weight: 600 });
    g.restore();
  }

  /** After pulling up at the garage: how the ride went. */
  private summary(W: number, H: number) {
    const g = this.screen.ctx, a = Math.min(1, (this.stopT - 0.4) / 0.5) * (1 - Math.min(1, this.fade / 0.5));
    const m = Math.floor(this.rideT / 60), s = Math.floor(this.rideT % 60);
    const rows: [string, string][] = [['TIME', `${m}:${String(s).padStart(2, '0')}`], ['DISTANCE', `${this.odo.toFixed(1)} KM`], ['TOP SPEED', `${Math.round(this.topKmh)} KM/H`], ['OVERTAKES', String(this.passed)], ['HONKS', String(this.honks)], ['NEXT STOP', 'RED HAT']];
    const px = Math.max(13, Math.round(W / (W < 700 ? 30 : 62))), cw = Math.min(W - 32, 340), ch = 96 + rows.length * (px + 12) + 14, x = W / 2 - cw / 2, y = H * 0.24;
    g.save(); g.globalAlpha = a;
    rrect(x, y, cw, ch, 10, 'rgba(27,23,18,0.9)'); box(x, y + 8, 4, ch - 16, ACCENT);
    if (this.bikeImg) { g.imageSmoothingEnabled = true; g.drawImage(this.bikeImg, x + cw - 24 - 121, y + 12, 121, 57); }
    label('MADE IT', x + 24, y + 38, Math.round(px * 1.9), ACCENT, { font: FONT_DISPLAY });
    label('TRIUMPH SCRAMBLER 400 X', x + 24, y + 82, px - 3, '#a89d8b', { font: FONT_MONO });
    rows.forEach(([k, v], i) => { const yy = y + 96 + i * (px + 12); label(k, x + 24, yy + px, px - 1, '#a89d8b', { font: FONT_MONO }); label(v, x + cw - 24, yy + px, px, i === rows.length - 1 ? ACCENT : HUD, { font: FONT_MONO, align: 'right', weight: 500 }); });
    g.restore();
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
    // a soft dark wash behind the title so the words read over the flags and trees
    const gr = this.screen.ctx.createLinearGradient(0, 0, 0, H * 0.62);
    gr.addColorStop(0, 'rgba(20,14,8,0.46)'); gr.addColorStop(0.7, 'rgba(20,14,8,0.2)'); gr.addColorStop(1, 'rgba(20,14,8,0)');
    this.screen.ctx.fillStyle = gr; this.screen.ctx.fillRect(0, 0, W, H * 0.62);
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
    this.pill('SKIP >', 12, H - 40, Math.max(12, Math.round(W / 70)));
  }
}
