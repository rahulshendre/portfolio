// Title card, then the Ladakh ride through four chapters, then pulling up at the garage.
import { box, circle, label, mix, rrect, smooth, use } from '../hd/draw';
import { CAM_HEIGHT, CAM_NAMES, CAMS, drawPOV, drawTop, RIDER_SCALE, type Cam } from '../hd/cameras';
import { drawRider } from '../hd/rider';
import { drawSpeedLines } from '../hd/speed';
import { finish, grade, seasonGrade } from '../hd/finish';
import { SEASON_NAMES } from '../hd/season';
import { LowRes } from '../hd/pixel';
import { setGarageBike } from '../hd/garage';
import type { Look } from '../rail';
import { envAt, hazeAt } from '../hd/background';
import { DRAW_DIST, meadowOf, renderRoad } from '../hd/road';
import { altitude, kmOf, lakeK, riverK, TOWNS, townAt, PASS_TOP, elevation, FINISH, inLane, LAKE_FROM, LANE_END, LANE_FROM, laneAt, laneCurve, paved, SEG_L, zoneAt } from '../hd/track-ladakh';
import { dice, World } from '../hd/endless';
import { BIKE_HALF, capBehind, HALF, honkAt, LEFT, overlaps, stepTraffic, trafficAt, type Car } from '../hd/traffic';
import { LIGHTS } from '../hd/props';
import { drawAir, drawLights, drawFlare, drawGround, drawHeadlight, drawLightning, drawNight, drawRain, drawSkyTint, SKIES, type Bolt, type Sky } from '../hd/air';
import { agility, lateralStep, step as bikeStep, V_CRUISE, V_TOP } from '../hd/physics';
import { drawCluster, drawPedals, pedalAt } from '../hd/cluster';
import { CAM_DEPTH } from '../ride/project';
import { input } from '../engine/input';
import { crickets, engine, isMuted, radio } from '../engine/audio';
import { calmDown, honkNow } from '../hd/stir';
import { inPuddle } from '../hd/puddles';
import { drawButterflies, drawFireflies } from '../hd/ambient';
import { loadRadio, RIDE_TIMES, rideTimeFrom, setSky, sky as world, timeFromRide, type RideTime, type Theme } from '../state';
import type { Scene } from '../engine/scene';
import type { Screen } from '../engine/screen';
import { milestones, site } from '../../data/site';

/** A drop of spray thrown up when the bike goes through a puddle: a place on the screen (0 to 1 each way), a velocity in screens a second, and how long it has left. */
interface Drop { x: number; y: number; vx: number; vy: number; life: number; r: number }

const MAX_S = SEG_L * 37;
/** How long the arrival at the garage takes, in seconds: the light goes and the summary comes up before the door scene. */
const TURN_T = 1.8;
/** How fast the exit lane carries the bike to the garage, in km/h: a crawl. */
const LANE_KMH = 25;
/** The speedometer's top: the bike never shows more than this. */
const KMH = 110;
/** World units per second for each metre per second of the bike's real speed, chosen so the top speed lands on MAX_S. */
const K = MAX_S / (110 / 3.6);
/** Visitors who ask their system for less motion get a steady picture: no shake, no view punch. */
const REDUCED = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const OG = typeof location !== 'undefined' && new URLSearchParams(location.search).has('og');
/** Places worth a card of their own, besides the milestones. */
const EVENTS = [
  { i: 8, top: 'LEH', sub: '3,500 M' },
  { i: PASS_TOP, top: 'KHARDUNG LA', sub: '5,359 M · YOU MADE IT' },
  { i: LAKE_FROM + 40, top: 'THE LAKE', sub: '4,225 M · THE GARAGE IS NEAR' },
  ...TOWNS.filter((t) => t.sub).map((t) => ({ i: t.gate + 3, top: t.name, sub: t.sub })),
];
/** The same places, as the Bliss land describes them: the palace is a manor, the monastery a castle, the dunes meadows, the Buddha a windmill. */
const BLISS_SUB: Record<string, string> = {
  'SHEY': 'THE OLD MANOR ON THE HILL', 'THIKSEY': 'THE CASTLE ON THE HILL', 'HUNDER': 'MEADOWS AND A FLOCK OF SHEEP',
  'DISKIT': 'THE GREAT WINDMILL', 'SPANGMIK': 'COTTAGES ON THE LAKE SHORE', 'KHARDUNG LA': 'HIGH PASTURE · 5,359 M', 'THE LAKE': '4,225 M · THE GARAGE IS NEAR',
};
const BLISS_CHAPTER: Record<string, string> = { 'INDUS VALLEY': 'THE GREEN VALLEY', 'KHARDUNG LA': 'HIGH PASTURE', 'LEH TOWN': 'LEH VILLAGE', 'SHEY': 'SHEY MANOR', 'THIKSEY': 'THIKSEY CASTLE', 'DISKIT': 'DISKIT WINDMILL' };
const EVENT_AT = new Map(EVENTS.map((e) => [e.i, e]));
/** The hour on the endless road: a long afternoon, dusk, night, dawn, and round again. `tod` is how far the light has gone (0 afternoon to 1 dusk), `night` how dark it is. */
const DAY = 3600;                                                       // segments for a whole day: about three minutes at a steady 55 km/h
function hourAt(i: number) {
  const u = (i / DAY) % 1, ease = (a: number, b: number) => smooth(a, b, u);
  return { tod: 0.05 + 0.2 * ease(0, 0.34) + 0.75 * ease(0.34, 0.58) - 0.3 * ease(0.82, 0.92) - 0.7 * ease(0.92, 1), night: ease(0.58, 0.66) * (1 - ease(0.82, 0.92)) };
}
/** One world per ride: replayable with `?seed=`, and dealt in the original order for share cards and `?at=` jumps. */
function makeWorld() {
  const q = new URLSearchParams(location.search), at = Number(q.get('at'));
  const forced = q.get('season');                                                              // ?season=gold|frost|green dresses the first lap, for pictures
  return new World(milestones, q.has('seed') ? dice(Number(q.get('seed'))) : OG || at > 0 ? dice(1) : Math.random, OG || at > 0, forced === 'gold' || forced === 'frost' || forced === 'green' ? { season: forced } : {});
}
const CHAPTER = (i: number) => townAt(i) ??
  (i >= FINISH - 90 && i <= FINISH + 30 ? 'SHENDRE GARAGE'
    : i >= LAKE_FROM ? 'THE LAKE'                                        // the water is in sight from here, so the label matches the view
    : i >= 720 ? 'KHARDUNG LA'                                           // the climb itself, not the valley floor before it
    : ({ leh: 'LEH TOWN', valley: 'INDUS VALLEY', pass: 'INDUS VALLEY', lake: 'THE LAKE' } as const)[zoneAt(i)]);

const FONT_DISPLAY = '"Fraunces", Georgia, serif';
/** The fastest ride to the garage this browser has made, in seconds (0 if none). Storage can be blocked, so every touch is guarded. */
const BEST_KEY = 'ride.best';
function readBest(): number { try { const v = Number(localStorage.getItem(BEST_KEY)); return Number.isFinite(v) && v > 0 ? v : 0; } catch { return 0; } }
function writeBest(t: number) { try { localStorage.setItem(BEST_KEY, String(Math.round(t * 10) / 10)); } catch { /* storage blocked: the card just does not remember */ } }

/** The name on the opening card: the pixel font the site's buttons and the garage sign use. */
const FONT_NAME = '"Silkscreen", ui-monospace, monospace';
const FONT_MONO = '"IBM Plex Mono", ui-monospace, monospace';
const INK = '#1b1712', HUD = '#fff6e0', ACCENT = '#e8b923';

export class RideScene implements Scene {
  mode = 'hd' as const;
  private phase: 'title' | 'ride' | 'lane' | 'knock' = 'title';
  private world = makeWorld();
  /** The road: built a little ahead of the bike and dropped behind it. */
  private get segs() { return this.world.segs; }
  private cars: Car[] = []; private nextCarZ = 70 * SEG_L;
  /** Whether the weather follows the laps (nobody picked one, in the address or at the door); the T key takes it by hand. `lap` is the lap the bike is in. */
  private skyAuto = true; private lap = 0;
  /** The best ride time on this browser (0 for none yet) and whether this ride beat it; read once when the card comes up. */
  private best = 0; private newBest = false; private bestRead = false;
  private lastSeg = -1; private elevK = 3500; private altE = 0; private lakeE = 0; private knocked = false; private fork: number | undefined = undefined; private told = new Set<number>();
  private pos = 0; private px = LEFT; private speed = 0; private lean = 0; private braking = false; private lastSpeed = 0; private avgDt = 1 / 60; private lite = false; private honkT = 0; private gearNow = 0; private birdT = 2; private rung = new Set<number>();
  private photo = false; private photoT = 0; private paused = false; private lights: 'auto' | 'on' | 'off' = 'auto'; private gas = false; private brake = false; private trip = 0; private vx = 0; private bolt: Bolt | null = null; private boltIn = 6; private rideTime: RideTime = 'auto'; private land: Theme = 'himalaya'; private nightK = 0; private todK = -1; private callT = 4; private called = new Set<number>(); private owlT = 12; private gasWas = false; private rough = 0; private bumpT = 0; private nearT = 0; private rideT = 0; private topKmh = 0; private passed = 0; private honks = 0; private stopT = 0; private sky: Sky = 'clear'; private inPud: object | null = null; private spray: Drop[] = [];
  private cam: Cam = 'behind';
  private get night() { return this.rideTime === 'night'; }
  private pitchK = 0;   // the bike's nose: dips under braking, lifts under power, and the headlight follows
  private bikeImg: HTMLImageElement | null = null;   // the garage's own picture of your bike, shown on the arrival card
  private pixel = typeof location === 'undefined' || !new URLSearchParams(location.search).has('smooth'); private low = new LowRes();
  private bgOff = 0; private t = 0; private odo = 0; private fade = 0; private flash = 0;
  private banner = { lines: [] as string[], t: 0, big: false, total: 2.6 };

  constructor(private screen: Screen, private onArrive: () => void, private onSkip: () => void) {}

  enter() {
    void document.fonts?.load(`400 32px ${FONT_NAME}`);                       // the canvas needs the pixel font loaded before the opening card can use it
    const im = new Image(); im.onload = () => { this.bikeImg = im; setGarageBike(im); }; im.src = '/sprites/bike-side-lg.png';   // the garage's bike, for the arrival card and for the bay of the garage on the road
    addEventListener('blur', this.autoPause);                          // switching away pauses the ride
    calmDown();                                                         // no honk lingers from an earlier ride
    input.endFrame();
    const at = Number(new URLSearchParams(location.search).get('at'));
    this.skyAuto = world.weather == null;
    this.sky = world.weather ?? 'clear'; this.land = world.theme ?? 'himalaya'; this.rideTime = rideTimeFrom(world.time);   // the sky the visitor already picked (in the address, at the door or in the garage), else a clear afternoon
    if (this.night) this.nightK = 1;
    if (OG) this.pos = 400 * SEG_L;
    else if (at > 0) { this.startSound(); this.phase = 'ride'; this.pos = at * SEG_L; this.speed = V_CRUISE * K; }
    const i0 = Math.floor(this.pos / SEG_L);
    this.world.ensure(i0 + DRAW_DIST + 30);
    this.lap = this.segs[i0]!.round;
    this.lastSeg = i0 - 1; this.nextCarZ = this.pos + 70 * SEG_L;
    const e = envAt(this.segs[i0]!.src, FINISH, zoneAt(this.segs[i0]!.src)); this.altE = e.alt; this.lakeE = e.lake; this.elevK = elevation(this.segs[i0]!.src);
    this.feedTraffic(this.pos);
  }
  /** True once a slow device has made the ride drop its costly extras. */
  get isLite() { return this.lite; }
  /** Reports the view, night, weather, light and look settings to the page's buttons whenever one changes. */
  onLook?: (l: Look) => void;
  private lookKey = '';
  private publishLook() {
    const l: Look = { cam: CAM_NAMES[this.cam], time: this.rideTime, sky: this.sky, land: this.land, lights: this.lights, pixel: this.pixel };
    const k = JSON.stringify(l);
    if (k !== this.lookKey) { this.lookKey = k; this.onLook?.(l); }
  }
  /** Hand the sky of this ride to the next scene, so the door and the garage window show what you rode in. (A skip from the title card has ridden nothing, so it hands over nothing.) */
  private commit() {
    if (this.phase === 'title') return;
    setSky({ weather: this.sky, theme: this.land, time: timeFromRide(this.rideTime) });
  }
  /** The hour as the sliding afternoon sees it: a day ride stays in the bright part of the afternoon, the others follow the road to dusk. */
  private tod(i: number) { return this.rideTime === 'day' ? 0.12 : this.rideTime === 'night' ? 0.95 : hourAt(i).tod; }
  /** How dark the ride wants to be here: full in a night ride, none in a day ride, following the hour otherwise. */
  private nightWant(i: number) { return this.rideTime === 'night' ? 1 : this.rideTime === 'day' ? 0 : hourAt(i).night; }
  /**
   * The sounds of the evening and the farm. Crickets rise as the light goes (a clear dusk, and all night), fewer high on the pass and in rain; in the Bliss land the
   * cows and sheep you ride towards call out as you near them, and an owl hoots in the dark.
   */
  private ambience(segI: number, sp: number, dt: number) {
    const dusk = Math.max(0, (this.todK - 0.72) / 0.28), air = this.sky === 'clear' || this.sky === 'fog' ? 1 : this.sky === 'rain' ? 0.2 : 0, high = this.land === 'xp' ? 1 : 1 - altitude(this.segs[segI]!.src) * 0.9;
    crickets.set(this.paused ? 0 : Math.max(this.nightK, dusk * 0.6) * air * high * (1 - Math.min(0.5, sp * 0.5)) * 0.9);
    if (this.land !== 'xp') return;
    this.callT -= dt; this.owlT -= dt;
    if (this.owlT < 0) { this.owlT = 14 + Math.random() * 18; if (this.nightK > 0.6 && this.sky === 'clear') engine.owl(Math.random() * 2 - 1); }
    if (this.callT > 0) return;
    for (let j = segI + 6; j < segI + 16; j++) {                                           // an animal a little way ahead
      if (this.called.has(j)) continue;
      const sj = this.segs[j], hit = sj && meadowOf(sj).find((p) => p.type === 'yak' || p.type === 'cows' || p.type === 'camel' || p.type === 'flock');
      if (!hit) continue;
      this.called.add(j); this.callT = 5 + Math.random() * 6;
      const pan = Math.max(-1, Math.min(1, hit.o / 6));
      if (hit.type === 'yak' || hit.type === 'cows') engine.moo(pan, 0.9 + Math.random() * 0.3); else engine.baa(pan);
      return;
    }
  }

  /** The nearest animal in the field ahead answers the horn after a beat: a cow lows, a sheep bleats, hens cluck, ducks quack. */
  private answerHonk(seg: number) {
    for (let j = seg + 4; j <= seg + 22; j++) {
      const sj = this.segs[j], hit = sj && meadowOf(sj).find((p) => p.type === 'yak' || p.type === 'cows' || p.type === 'camel' || p.type === 'flock' || p.type === 'hens' || p.type === 'pond' || (p.type === 'dog' && !((p.v ?? 0) % 2)));
      if (!hit) continue;
      const pan = Math.max(-1, Math.min(1, hit.o / 6));
      setTimeout(() => {
        if (hit.type === 'yak' || hit.type === 'cows') engine.moo(pan, 0.9 + Math.random() * 0.3);
        else if (hit.type === 'camel' || hit.type === 'flock') engine.baa(pan);
        else if (hit.type === 'pond') engine.quack(pan);
        else engine.cluck(pan);
      }, 520);
      return;
    }
  }

  /** Through a puddle in the rain: a slap, a spray of drops and a little speed lost, once per puddle. */
  private splash(sp: number) {
    this.speed *= 0.97; engine.splash(0.5 + sp * 0.7);
    if (this.lite) return;
    for (let i = 0, n = 16 + Math.floor(sp * 22); i < n; i++) {
      const a = Math.random() * Math.PI;
      this.spray.push({ x: 0.5 + (Math.random() - 0.5) * 0.12, y: 0.84, vx: Math.cos(a) * (0.18 + Math.random() * 0.34), vy: -(0.35 + Math.random() * 0.55) * (0.6 + sp * 0.7), life: 0.5 + Math.random() * 0.4, r: 0.0022 + Math.random() * 0.0034 });
    }
  }

  private drawSpray(g: CanvasRenderingContext2D, W: number, H: number) {
    for (const d of this.spray) {
      g.globalAlpha = Math.min(1, d.life * 2.4) * 0.8; g.fillStyle = '#dcecf8';
      g.beginPath(); g.arc(d.x * W, d.y * H, Math.max(1, d.r * W), 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
  }

  /** What each stretch of road has to say as you ride over it: the places, and the career markers (in story order, whichever chapter they fall in). */
  private passSeg(k: number) {
    const s = this.segs[k];
    if (!s) return;
    const ev = EVENT_AT.get(s.src), ms = s.props.find((p) => p.type === 'ms');
    if (ev) { engine.chime(); this.show(`${ev.top}|${this.land === 'xp' ? (BLISS_SUB[ev.top] ?? ev.sub) : ev.sub}`, true); }
    else if (ms) { engine.chime(); this.show(`${ms.label}|${ms.sub}`, true); }
  }

  /** Keep the road populated: new vehicles and animals join far ahead, one every minute's worth of road or so, and those left far behind are let go. */
  private feedTraffic(playerZ: number) {
    while (this.nextCarZ < playerZ + 520 * SEG_L) {
      const z = this.nextCarZ, at = this.world.srcAt(Math.floor(z / SEG_L));
      this.cars.push(trafficAt(zoneAt(at), z, Math.random(), Math.random()));
      this.nextCarZ += (34 + Math.random() * 40) * SEG_L;
    }
    for (let n = this.cars.length - 1; n >= 0; n--) if (this.cars[n].z < playerZ - 60 * SEG_L) this.cars.splice(n, 1);
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
    const seg = Math.floor((this.pos + CAM_HEIGHT[this.cam] * CAM_DEPTH) / SEG_L);
    honkNow(seg);                                                                                    // the roadside looks up: cows, sheep, hens, ducks and villagers in the Bliss land
    if (this.land === 'xp') this.answerHonk(seg);
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

  /**
   * The bike steers into the exit lane: from here it is the road. The curve it bends by (see `laneCurve`) is added to the segments ahead, the camera takes its heading from them, and the road the bike
   * has left is drawn beside it. `c` is where the lane's middle lay from the main road's: the bike's sideways position is measured from the lane's middle now.
   */
  private takeLane(segI: number, c: number) {
    this.phase = 'lane'; this.fork = segI; this.px -= c;
    for (let i = segI; i < segI + 70; i++) { const s = this.segs[i]; if (s) s.curve -= laneCurve(s.src - LANE_FROM); }
  }

  /** How far the arrival at the garage has come, 0 to 1, eased at both ends (zero until the bike has pulled up). */
  private turnK() { if (this.phase !== 'knock') return 0; const t = Math.min(1, this.stopT / TURN_T); return t * t * t * (t * (t * 6 - 15) + 10); }

  private show(msg: string, big = false, t = big ? 3.4 : 2.6) { this.banner = { lines: msg.split('|'), t, big, total: t }; }

  private setCam(c: Cam) {
    if (c === this.cam) return;
    this.cam = c; this.flash = 0.07;
    this.show(`CAM ${CAMS.indexOf(c) + 1}|${CAM_NAMES[c]}`, false, 1.4);
  }

  private handleTap(): 'skip' | 'cam' | 'sound' | 'horn' | 'other' | null {
    if (!input.tap()) return null;
    const d = this.screen.size.dpr, x = input.pointer.x / d, y = input.pointer.y / d, W = this.screen.W / d, H = this.screen.H / d;   // the HUD is laid out in CSS pixels
    if (y > H - 48 && x < Math.max(W * 0.18, 104)) return 'skip';
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
    const vi = Math.floor(this.pos / SEG_L);
    this.nightK += (this.nightWant(vi) - this.nightK) * Math.min(1, dt * 1.6);
    const want = this.tod(vi);                                           // the hour eases to a new setting instead of jumping
    this.todK = this.todK < 0 ? want : this.todK + (want - this.todK) * Math.min(1, dt * 2);
    this.photoT -= dt;
    this.flash -= dt;
    const tap = this.handleTap();
    if (tap === 'skip' || input.pressed('Escape')) { this.commit(); return this.onSkip(); }
    if (tap === 'cam' || input.pressed('KeyV', 'KeyC')) this.setCam(CAMS[(CAMS.indexOf(this.cam) + 1) % CAMS.length]);
    if (tap === 'sound' || input.pressed('KeyM')) {                                     // the same switch as the page's SOUND button
      const btn = document.getElementById('sound'); btn?.click();
      this.show(btn?.getAttribute('aria-pressed') === 'true' ? 'SOUND ON' : 'SOUND OFF', false, 1.2);
    }
    if (this.phase === 'ride' && (tap === 'horn' || input.pressed('KeyH', 'Space'))) this.honk();
    if (this.phase !== 'title') {
      if (input.pressed('KeyP') || (this.paused && tap === 'other')) { this.paused = !this.paused; if (this.paused) engine.update(0, 0, { river: 0, lake: 0, alt: 0 }); }   // a tap carries on too, for phones
      if (input.pressed('KeyL')) { this.lights = this.lights === 'on' ? 'off' : 'on'; this.show(this.lights === 'on' ? 'HEADLIGHT ON' : 'HEADLIGHT OFF', false, 1.2); }
      if (input.pressed('KeyN')) { this.rideTime = RIDE_TIMES[(RIDE_TIMES.indexOf(this.rideTime) + 1) % RIDE_TIMES.length]; this.show({ auto: 'DAY INTO NIGHT, ROUND AND ROUND', night: 'NIGHT RIDE|LIGHTS ON', day: 'DAYLIGHT' }[this.rideTime], false, 1.6); }
      if (input.pressed('KeyB')) { this.land = this.land === 'xp' ? 'himalaya' : 'xp'; this.show(this.land === 'xp' ? 'BLISS|THE OLD WALLPAPER HILLS' : 'HIMALAYA|LADAKH AGAIN', false, 1.8); }
      if (input.pressed('KeyT')) { this.skyAuto = false; this.sky = SKIES[(SKIES.indexOf(this.sky) + 1) % SKIES.length]; engine.setRain(this.sky === 'rain' ? 1 : 0); this.show(`WEATHER|${this.sky.toUpperCase()}`, false, 1.6); }
      if (input.pressed('KeyG')) { this.pixel = !this.pixel; this.show(this.pixel ? 'PIXEL LOOK|G FOR SMOOTH' : 'SMOOTH LOOK|G FOR PIXEL', false, 1.6); }
      if (input.pressed('KeyR')) this.show(radio.toggle() ? 'RADIO ON' : 'RADIO OFF', false, 1.2);
      if (input.pressed('KeyK')) this.show('W GAS · S BRAKE · A D STEER|H HONK · L LIGHT · P PAUSE|V OR 1-4 CAMERA · F PHOTO · R RADIO|T WEATHER · N TIME · B LAND · G PIXEL · M SOUND · ESC EXIT', false, 4.5);
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
    const segI = Math.floor(this.pos / SEG_L);
    this.world.ensure(segI + DRAW_DIST + 12);
    const seg = this.segs[segI]!, src = seg.src;
    if (seg.round !== this.lap) {                                                                  // a new lap: its season and, if nobody chose the weather, its weather
      this.lap = seg.round;
      if (this.skyAuto) { this.sky = seg.weather; engine.setRain(this.sky === 'rain' ? 1 : 0); }
      this.show(`${SEASON_NAMES[seg.season]}|${this.skyAuto ? seg.weather.toUpperCase() : `LAP ${seg.round + 1}`}`, false, 2.6);
    }
    const playerZ = this.pos + CAM_HEIGHT[this.cam] * CAM_DEPTH;
    const sp = this.speed / MAX_S;

    // the garage stands closed once a round, at the end of an exit lane that peels off to the left: the huge boards and the signs have led to it. Steer into the lane and it carries you the rest of the way, and the door opens.
    const garage = this.world.nextGarage(segI - 4), toGarage = garage - segI, rel = playerZ / SEG_L - (garage - FINISH), lane = laneAt(rel);   // rel: where we are, counting the garage at FINISH
    if (this.phase === 'ride') {
      if (toGarage <= 80 && toGarage >= -8 && !this.told.has(garage)) { this.told.add(garage); this.show('SHENDRE GARAGE|TAKE THE LEFT LANE', false, 3.4); }
      if (inLane(rel, this.px)) { this.takeLane(segI, lane!.c); this.show('SHENDRE GARAGE|FOLLOW THE LANE', false, 2.4); }
    }
    if (this.phase === 'knock') {
      this.speed *= Math.max(0, 1 - dt * 2.2); this.vx *= Math.max(0, 1 - dt * 3);                    // pulled up outside: the engine settles, the light goes, then a summary of the ride shows and the door opens
      if (this.stopT === 0) { this.stopT = 0.001; setTimeout(() => { engine.mute(); radio.setLevel(1); }, 700); }
      if (!this.knocked && this.stopT > TURN_T * 0.8) { this.knocked = true; engine.knock(); this.show('KNOCK KNOCK|SOMEONE IS COMING', true, 2.6); }
      this.stopT += dt;
      if (this.stopT > TURN_T + 3.2) { this.fade += dt; if (this.fade > 0.7) { this.commit(); return this.onArrive(); } }
    } else if (this.phase === 'lane') {
      this.speed += (LANE_KMH / 3.6 * K - this.speed) * Math.min(1, dt * 2);                          // the lane takes the bike down to a crawl, whatever you do with the throttle
      if (rel >= LANE_END) this.phase = 'knock';
    } else {
      // real forces: thrust against drag, rolling resistance, the slope under the wheels and the brakes. With nothing pressed
      // the bike settles to a relaxed 55 km/h; gas climbs toward 110, and the climb up to the pass costs it speed.
      const grade = ((seg.y2 - seg.y1) / SEG_L) * 0.6;
      this.speed = bikeStep(this.speed / K, dt, { gas: this.gas, brake: this.brake, grade, cruise: V_CRUISE, top: V_TOP * (seg.zone === 'pass' ? 0.92 : 1), rough: this.rough, side: this.vx, grip: { clear: 1, fog: 0.95, rain: 0.65, snow: 0.55 }[this.sky] }) * K;
    }

    const tpx = this.fork === undefined ? this.px : 99;                                      // once on the exit lane the main road's traffic is somewhere else
    const gaps = this.cars.map((c) => c.z - playerZ);
    stepTraffic(this.cars, playerZ, tpx, dt, MAX_S);
    this.cars.forEach((c, n) => {
      if (gaps[n] > 0 && c.z - playerZ <= 0 && Math.abs(c.o - tpx) < 0.9 && this.speed > MAX_S * 0.25) {                       // just went by
        engine.whoosh();
        if (c.kind === 'goats' || c.kind === 'marmot') return;
        this.passed++;
        const clear = Math.abs(c.o - tpx) - HALF[c.kind] - BIKE_HALF;                                                            // the daylight between the two, in road half-widths
        if (clear > 0 && clear < 0.09 && this.speed > MAX_S * 0.55 && this.nearT <= 0) { this.nearT = 2.5; this.show('CLOSE CALL|MIND THE PAINT', false, 1.1); }
      }
    });
    const capped = capBehind(this.cars, playerZ, tpx, this.speed, MAX_S);
    this.speed = capped.speed;
    if (capped.blocker && !capped.blocker.warned) {
      capped.blocker.warned = true;
      this.show(matchMedia('(pointer: coarse)').matches ? 'STUCK BEHIND A TRUCK|HONK, OR STEER AROUND' : 'STUCK BEHIND A TRUCK|H TO HONK, OR STEER AROUND');
    }

    const steer = held || this.phase === 'knock' || this.phase === 'lane' ? 0 : input.steer();   // a finger on a pedal is not a steering touch
    // nothing steers the bike but you. Sideways motion has inertia and depends on forward speed: a bike that is not moving does not slide about
    const vNow = this.speed / K;
    this.vx = lateralStep(this.vx, dt, { v: vNow, steer, laneError: 0 });
    // a bend pushes a fast bike wide: the harder the bend and the faster you are, the more you must lean into it
    this.px += this.vx * dt - seg.curve * sp * sp * dt * 0.1 * agility(vNow);
    if (this.phase === 'lane') { const gap = -this.px; this.px += gap * Math.min(1, dt * 2.5); this.vx = gap * 2.5; }   // on the lane the bike keeps to its middle, whatever way it bends
    // sideswipe: touching a vehicle beside you shoves you away from it and scrubs speed
    for (const c of this.cars) {
      if (c.kind === 'marmot') continue;
      const gap = c.z - playerZ;
      if (Math.abs(gap) < 0.7 * SEG_L && overlaps(c, tpx, BIKE_HALF, 0)) {                 // the bump uses the width of what is drawn
        this.vx += (this.px >= c.o ? 1 : -1) * 2.2 * dt * 8; this.speed *= 1 - dt * 1.5;
        if (this.bumpT <= 0) { this.bumpT = 1.2; engine.thud(); this.show(c.kind === 'goats' || c.kind === 'yak' ? 'CAREFUL|MIND THE ANIMALS' : 'CAREFUL|WATCH THE TRAFFIC', false, 1.2); }
      }
    }
    this.bumpT -= dt; this.nearT -= dt;
    const pud = this.land === 'xp' && this.sky === 'rain' && this.phase === 'ride' ? inPuddle(playerZ / SEG_L, this.px, BIKE_HALF) : null;
    if (pud && pud !== this.inPud && sp > 0.12) this.splash(sp);
    this.inPud = pud;
    for (const d of this.spray) { d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 1.7 * dt; d.life -= dt; }
    if (this.spray.length) this.spray = this.spray.filter((d) => d.life > 0);
    // the tarmac ends near |1.1|: past it the ground is gravel, dust and stones
    this.rough = this.phase === 'lane' || this.phase === 'knock' || (lane && paved(lane, this.px)) ? 0 : Math.min(1, Math.max(0, (Math.abs(this.px) - 1.08) / 0.12));   // the lane and its island are tarmac too
    const lo = lane ? Math.min(-1.3, lane.outer - 0.05) : -1.3;                                       // out by the lane the road is wider on the left
    if (this.phase === 'ride' && (this.px > 1.3 || this.px < lo)) { this.px = Math.max(lo, Math.min(1.3, this.px)); this.vx *= -0.2; }
    const leanTo = Math.max(-1, Math.min(1, this.vx / 1.4)) + seg.curve * 0.25 * agility(vNow);     // lean follows the sideways motion and the bend, and vanishes at a standstill
    this.lean += (Math.max(-1, Math.min(1, leanTo)) - this.lean) * Math.min(1, dt * 8);

    this.braking = this.brake || this.speed < this.lastSpeed - MAX_S * dt * 0.05; // slowing down lights the tail lamp
    this.lastSpeed = this.speed;
    this.pitchK += ((this.braking ? 1 : this.gas ? -0.6 : 0) - this.pitchK) * Math.min(1, dt * 4);
    this.pos += this.speed * dt;
    this.world.ensure(Math.floor(this.pos / SEG_L) + DRAW_DIST + 12);
    this.world.trim(segI - 40);
    this.feedTraffic(playerZ);
    const e = envAt(src, FINISH, zoneAt(src)), ease = Math.min(1, dt * 1.4);           // the far hills and the water change gently where one stretch of road joins the next
    this.altE += (e.alt - this.altE) * ease; this.lakeE += (e.lake - this.lakeE) * ease; this.elevK += (elevation(src) - this.elevK) * Math.min(1, dt * 0.9);
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
      river: riverK(src), lake: lakeK(src), alt: altitude(src),
    }, this.gas ? 1 : this.brake ? 0 : 0.3);
    this.birdT -= dt;
    if (this.birdT < 0) {
      this.birdT = (this.land === 'xp' ? 2 + Math.random() * 4 : 3 + Math.random() * 7);
      if (altitude(src) < 0.5 && this.speed < MAX_S * 0.95 && this.nightK < 0.5) { if (this.land === 'xp' && Math.random() < 0.3) engine.cuckoo(Math.random() * 2 - 1); else engine.chirp(); }   // birds in the valley and by the lake, none up in the snow or in the dark
    }
    this.ambience(segI, sp, dt);   // birds in the valley and by the lake, none up in the snow
    if (!this.rung.has(segI) && seg.props.some((p) => p.type === 'stupahill' || p.type === 'palace' || p.type === 'gompa')) { this.rung.add(segI); if (this.land === 'xp') engine.bell(); else engine.gong(); }

    for (let k = Math.max(this.lastSeg + 1, segI - 4); k <= segI; k++) this.passSeg(k);
    this.lastSeg = segI;
    if (this.called.size > 160) for (const j of this.called) if (j < segI - 60) this.called.delete(j);
    if (this.rung.size > 160) for (const j of this.rung) if (j < segI - 60) this.rung.delete(j);
    input.endFrame();
  }

  draw() {
    const full = this.screen.ctx, { W: FW, H: FH, HZ } = this.screen.size;
    const small = this.pixel ? this.low.fit(FW, FH) : null;                          // pixel look: the world goes on a small canvas, the HUD stays sharp on the full one
    const g = small ? this.low.ctx : full, W = small ? small.W : FW, H = small ? small.H : FH;
    use(g);
    const sp = this.speed / MAX_S, segI = Math.floor(this.pos / SEG_L), src = this.segs[segI]!.src;
    const env = { tod: this.todK < 0 ? this.tod(segI) : this.todK, alt: this.altE, lake: this.lakeE, lite: this.lite, night: this.nightK, theme: this.land };
    if (this.cam === 'top') {
      drawTop(g, this.segs, this.cars, W, H, this.pos, this.px, this.t);
      if (!this.lite) finish(g, W, H, HZ, env.tod, false, !small);
    }
    else {
      g.save();
      const punch = REDUCED ? 1 : 1 + Math.max(0, sp - 0.8) * 0.2 + (this.gas && sp > 0.9 ? 0.012 : 0);   // at full throttle the view widens a touch
      g.translate(W / 2, H * HZ); g.scale(punch, punch); g.translate(-W / 2, -H * HZ);
      if (!REDUCED) g.translate(0, Math.round(Math.sin(this.t * 47) * sp * sp * 1.6 + Math.sin(this.t * 19) * sp * 0.7)); // the road hums up through the suspension at speed
      renderRoad(g, this.segs, { W, H, HZ, pos: this.pos, px: this.px, camH: CAM_HEIGHT[this.cam], bgOff: this.bgOff, fork: this.fork, t: this.t, env, lite: this.lite, haze: this.nightK > 0.01 ? mix(hazeAt(env.tod, this.land), '#232b58', this.nightK) : hazeAt(env.tod, this.land), fogK: this.sky === 'fog' ? 2.4 : 1, wet: this.land === 'xp' && this.sky === 'rain' }, this.cars);
      g.restore();
      if (!this.lite) drawSpeedLines(g, W, H, HZ, sp, this.t);
      drawSkyTint(g, W, H, HZ, this.sky);
      drawNight(g, W, H, this.nightK);
      if (this.nightK > 0.3) drawLights(g, LIGHTS);
      if (!this.lite) drawGround(g, W, H, HZ, this.t, sp, this.nightK > 0.5 ? 0 : env.tod, src, this.sky === 'rain' ? 1 : 0, this.nightK, this.land);
      if (!this.lite) drawAir(g, W, H, HZ, this.t, sp, src, env.tod, this.sky, this.land);
      if (!this.lite && this.land === 'xp') {                                                    // life over the meadow: butterflies by day, fireflies at dusk and in the dark
        drawButterflies(g, W, H, HZ, this.t, (this.sky === 'clear' || this.sky === 'fog' ? 1 : 0) * Math.max(0, 1 - this.nightK * 2 - Math.max(0, env.tod - 0.7) * 3) * (1 - Math.min(0.8, sp)));
        drawFireflies(g, W, H, HZ, this.t, (this.sky === 'clear' || this.sky === 'fog' ? 1 : 0.2) * Math.max(this.nightK, (env.tod - 0.8) * 4));
      }
      if (!this.lite && this.sky === 'clear' && this.nightK < 0.3) drawFlare(g, W, H, HZ, env.tod);
      if (!this.lite && this.sky === 'rain') drawRain(g, W, H, this.t, sp);
      if (this.spray.length) this.drawSpray(g, W, H);
      if (this.bolt) drawLightning(g, W, H, HZ, this.bolt);
      if (!this.lite) { const sg = this.segs[Math.floor(this.pos / SEG_L)]; grade(g, W, H, this.land); if (sg) seasonGrade(g, W, H, HZ, sg.season, sg.nextSeason, sg.blend ?? 0); finish(g, W, H, HZ, env.tod, this.nightK > 0.5, !small); }
      const dim = this.turnK();
      if (dim > 0) { g.fillStyle = `rgba(0,0,0,${(dim * dim * 0.85).toFixed(3)})`; g.fillRect(0, 0, W, H); }   // the light goes as the turn completes   // grade, vignette and grain over the world, under the rider and the HUD
      const beam = this.lights === 'off' ? 0 : Math.max(this.lights === 'on' ? 0.5 : 0, env.tod > 0.55 ? (env.tod - 0.55) / 0.45 : 0, this.nightK * 1.4);
      const beamA = Math.min(1, beam);
      if (!this.lite && beamA > 0) drawHeadlight(g, W, H, HZ, this.lean, beamA, { wet: this.sky === 'rain' ? 1 : 0, mist: this.sky === 'fog' || this.sky === 'snow' ? 1 : 0, t: this.t, pitch: this.pitchK, dark: Math.min(1, this.nightK * 1.25 + Math.max(0, env.tod - 0.45) * 0.9) });
      if (this.cam === 'behind' || this.cam === 'high') drawRider(g, W, H, this.lean, this.t, sp, this.braking, RIDER_SCALE[this.cam]);
      else drawPOV(g, W, H, sp, this.t, sp * KMH);
    }
    if (small) this.low.blit(full, FW, FH);
    use(full);
    const d = this.screen.size.dpr;
    full.save(); full.scale(d, d);                                                 // HUD in CSS pixels, so it stays a readable size on a phone
    if (!this.photo) this.hud(FW / d, FH / d, segI, src);
    else if (this.photoT > 0) { const cw = FW / d; this.pill('PHOTO MODE  ·  ENTER SAVES  ·  F EXITS', cw / 2 - 150, (FH / d) - 46, 13); }
    full.restore();
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

  private hud(W: number, H: number, segI: number, src: number) {
    if (this.phase === 'title') return this.title(W, H);
    const narrow = W < 700, coarse = matchMedia('(pointer: coarse)').matches;
    const px = coarse ? 14 : Math.max(12, Math.round(W / 70));
    this.pill(narrow ? 'RAHUL' : site.name.toUpperCase(), 124, 12, px);   // clear of the page's SOUND button in the corner
    const odo = 'ODO ' + this.odo.toFixed(1).padStart(5, '0');
    const g = this.screen.ctx;
    g.font = `400 ${px}px ${FONT_MONO}`;
    this.pill(odo, W - g.measureText(odo).width - 28, 12, px);
    this.progress(W, segI, src, narrow, px);
    this.pill('GARAGE >', 12, H - px - 22, px);
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
      const sp = this.speed / MAX_S, temp = 16 - (this.elevK - 3500) / 1859 * 22 - Math.max(this.todK, 0) * 3;
      const gear = sp < 0.02 ? 0 : Math.min(6, 1 + Math.floor(sp * 6.4));
      const beam = this.lights === 'on' || (this.lights === 'auto' && ((this.todK < 0 ? this.tod(segI) : this.todK) > 0.55 || this.nightK > 0.5));
      drawCluster(g, 12, H - px - 22 - 106 - (coarse ? 132 : 0), narrow ? 0.9 : 1, { kmh: sp * KMH, frac: sp, gear, elev: Math.round(this.elevK), temp, trip: this.trip, lights: beam }, narrow);
    }
    if (coarse && this.phase === 'ride') drawPedals(g, W, H, this.gas, this.brake);
    if (this.stopT > TURN_T) this.summary(W, H);
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
    const g = this.screen.ctx, a = Math.min(1, (this.stopT - TURN_T) / 0.5) * (1 - Math.min(1, this.fade / 0.5));
    if (!this.bestRead) {                                                                          // the first time the card is up: is this the fastest run to the garage so far?
      this.bestRead = true;
      const prev = readBest();
      this.newBest = this.rideT >= 20 && (prev === 0 || this.rideT < prev);                         // a jump to the end with ?at= is not a ride
      this.best = this.newBest ? this.rideT : prev;
      if (this.newBest) writeBest(this.rideT);
    }
    const clock = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
    const rows: [string, string, boolean?][] = [['TIME', clock(this.rideT)], ...(this.best > 0 ? [[this.newBest ? 'NEW BEST' : 'BEST', this.newBest ? 'YOUR FASTEST' : clock(this.best), this.newBest] as [string, string, boolean]] : []), ['DISTANCE', `${this.odo.toFixed(1)} KM`], ['TOP SPEED', `${Math.round(this.topKmh)} KM/H`], ['OVERTAKES', String(this.passed)], ['HONKS', String(this.honks)], ['NEXT STOP', 'RED HAT']];
    const px = Math.max(13, Math.round(W / (W < 700 ? 30 : 62))), cw = Math.min(W - 32, 340), ch = 96 + rows.length * (px + 12) + 14, x = W / 2 - cw / 2, y = H * 0.24;
    g.save(); g.globalAlpha = a;
    rrect(x, y, cw, ch, 10, 'rgba(27,23,18,0.9)'); box(x, y + 8, 4, ch - 16, ACCENT);
    if (this.bikeImg) { g.imageSmoothingEnabled = true; g.drawImage(this.bikeImg, x + cw - 24 - 121, y + 12, 121, 57); }
    label('MADE IT', x + 24, y + 38, Math.round(px * 1.9), ACCENT, { font: FONT_DISPLAY });
    label('TRIUMPH SCRAMBLER 400 X', x + 24, y + 82, px - 3, '#a89d8b', { font: FONT_MONO });
    rows.forEach(([k, v, hot], i) => { const yy = y + 96 + i * (px + 12); label(k, x + 24, yy + px, px - 1, hot ? ACCENT : '#a89d8b', { font: FONT_MONO }); label(v, x + cw - 24, yy + px, px, hot || i === rows.length - 1 ? ACCENT : HUD, { font: FONT_MONO, align: 'right', weight: 500 }); });
    g.restore();
  }

  /** The bar counts down to the next garage: it starts at the last one (or the start of the ride) and the little garage waits at the end. */
  private progress(W: number, segI: number, src: number, narrow: boolean, px: number) {
    const w = narrow ? Math.min(160, W * 0.35) : Math.min(280, W * 0.4);
    const x0 = W / 2 - w / 2, y = narrow ? 44 : 18;
    const garage = this.world.nextGarage(segI - 8), from = this.world.prevGarage(garage) ?? 0, f = Math.max(0, Math.min(1, (segI - from) / Math.max(1, garage - from)));
    rrect(x0 - 8, y - 6, w + 28, 18, 6, INK);
    box(x0, y + 4, w, 2, '#6b645a');
    box(x0, y + 4, f * w, 2, ACCENT);
    box(x0 + w + 4, y, 8, 10, HUD);
    box(x0 + w + 5, y + 2, 6, 6, '#e8641f');
    box(x0 + f * w - 2, y, 5, 12, '#ffffff');
    const place = this.land === 'xp' ? (BLISS_CHAPTER[CHAPTER(src)] ?? CHAPTER(src)) : CHAPTER(src), left = garage - segI;
    label(place, W / 2, y + 28, Math.max(11, px - 2), HUD, { align: 'center', font: FONT_MONO, shadow: INK });
    if (left > -10 && left < 480) label(left > 28 ? `SHENDRE GARAGE  ${kmOf(left).toFixed(1)} KM` : 'SHENDRE GARAGE  ← LEFT LANE', W / 2, y + 28 + Math.max(11, px - 2) + 6, Math.max(10, px - 3), ACCENT, { align: 'center', font: FONT_MONO, shadow: INK });
  }

  private title(W: number, H: number) {
    const namePx = Math.max(26, Math.round(W / 20));
    const y = H * 0.2;
    // a soft dark wash behind the title so the words read over the flags and trees
    const gr = this.screen.ctx.createLinearGradient(0, 0, 0, H * 0.62);
    gr.addColorStop(0, 'rgba(20,14,8,0.46)'); gr.addColorStop(0.7, 'rgba(20,14,8,0.2)'); gr.addColorStop(1, 'rgba(20,14,8,0)');
    this.screen.ctx.fillStyle = gr; this.screen.ctx.fillRect(0, 0, W, H * 0.62);
    label(site.name.toUpperCase(), W / 2, y, namePx, HUD, { align: 'center', font: FONT_NAME, shadow: INK });
    if (OG) {
      label('LFX 2026 MENTEE · PIPECD · CNCF', W / 2, y + namePx * 1.2, Math.max(14, Math.round(W / 40)), ACCENT, {
        align: 'center', font: FONT_MONO, shadow: INK,
      });
      return;
    }
    if (Math.floor(this.t * 2) % 2 === 0) {
      const p = matchMedia('(pointer: coarse)').matches ? 'TAP TO RIDE' : 'PRESS ANY KEY TO RIDE';
      label(p, W / 2, y + namePx * 1.25, Math.max(16, Math.round(W / 36)), ACCENT, {
        align: 'center', font: FONT_MONO, shadow: INK,
      });
    }
    this.pill('GARAGE >', 12, H - 40, Math.max(12, Math.round(W / 70)));
  }
}
