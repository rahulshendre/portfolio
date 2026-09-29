// One switch for all sound: every audio context is created here, so muting suspends them all and nothing can start them again until unmuted.
const contexts = new Set<AudioContext>();
let muted = false;
const newCtx = () => { const c = new AudioContext(); contexts.add(c); if (muted) void c.suspend(); return c; };
const wake = (c: AudioContext) => (muted ? Promise.resolve() : c.resume());
export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  for (const c of contexts) {
    if (c.state === 'closed') { contexts.delete(c); continue; }
    (m ? c.suspend() : c.resume()).catch(() => {});
  }
}

// A tiny synthesised single-cylinder engine. Off by default; browsers only allow audio after a gesture anyway.
export class EngineSound {
  on = false;
  private ctx?: AudioContext;
  private gain?: GainNode;
  private filter?: BiquadFilterNode;
  private body?: OscillatorNode;
  private thump?: OscillatorNode;

  toggle(): boolean {
    this.on = !this.on;
    if (this.on) this.start();
    else this.gain?.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.08);
    return this.on;
  }

  private start() {
    if (!this.ctx) {
      const ctx = newCtx();
      const gain = ctx.createGain(); gain.gain.value = 0;
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 600; filter.Q.value = 4;
      const body = ctx.createOscillator(); body.type = 'sawtooth'; body.frequency.value = 42;
      const thump = ctx.createOscillator(); thump.type = 'square'; thump.frequency.value = 21;
      const thumpGain = ctx.createGain(); thumpGain.gain.value = 0.35;
      body.connect(filter); thump.connect(thumpGain).connect(filter); filter.connect(gain).connect(ctx.destination);
      body.start(); thump.start();
      Object.assign(this, { ctx, gain, filter, body, thump });
    }
    void wake(this.ctx!);
    this.gain!.gain.setTargetAtTime(0.06, this.ctx!.currentTime, 0.1);
  }

  /** Pitch and brightness follow speed (0..1). */
  update(speed: number) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime, f = 38 + speed * 92;
    this.body!.frequency.setTargetAtTime(f, t, 0.06);
    this.thump!.frequency.setTargetAtTime(f / 2, t, 0.06);
    this.filter!.frequency.setTargetAtTime(450 + speed * 1500, t, 0.08);
  }

  mute() { if (this.on) this.toggle(); }
}

export const engine = new EngineSound();

// A tiny lo-fi radio for the garage: soft chords, a lazy beat and vinyl crackle, all synthesised. Plays by default (see autostart), unless the visitor turned it off.
const CHORDS = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]]; // Am7 Fmaj7 Cmaj7 G6
const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12);

export class RadioSound {
  on = false;
  private ctx?: AudioContext;
  private master?: GainNode;
  private timer?: number;
  private next = 0;
  private step = 0;
  private noise?: AudioBuffer;
  private readonly bpm = 68;

  toggle(): boolean {
    this.on = !this.on;
    if (this.on) this.start();
    else this.stop();
    return this.on;
  }

  /** Play as soon as the browser allows: now if audio is unlocked, otherwise on the first press or key. */
  autostart() {
    if (this.on) return;
    this.on = true;
    this.start();
    const c = this.ctx!;
    if (c.state === 'running') return;
    const unlock = () => { void wake(c); removeEventListener('pointerdown', unlock); removeEventListener('keydown', unlock); };
    addEventListener('pointerdown', unlock); addEventListener('keydown', unlock);
  }

  private start() {
    if (!this.ctx) {
      this.ctx = newCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
      this.master.connect(lp).connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
    }
    void wake(this.ctx);
    this.master!.gain.setTargetAtTime(0.5, this.ctx.currentTime, 0.2);
    this.next = this.ctx.currentTime + 0.1;
    this.step = 0;
    this.timer = window.setInterval(() => this.schedule(), 100);
  }

  private stop() {
    if (this.timer) clearInterval(this.timer);
    this.master?.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.1);
  }

  /** Look-ahead scheduler: queue every 8th note that falls in the next 300 ms. */
  private schedule() {
    const c = this.ctx!, eighth = 60 / this.bpm / 2;
    while (this.next < c.currentTime + 0.3) {
      this.play(this.step, this.next);
      this.next += eighth;
      this.step = (this.step + 1) % 64; // 8 bars of 8 eighths
    }
  }

  private play(step: number, t: number) {
    const c = this.ctx!, bar = Math.floor(step / 8) % 4, inBar = step % 8, chord = CHORDS[bar];
    if (inBar === 0) for (const m of chord) this.tone(mtof(m), t, 60 / this.bpm * 4 * 0.95, 0.05, 'triangle');
    if (inBar === 0 || inBar === 3 || inBar === 6) this.tone(mtof(chord[0] - 24), t, 0.5, 0.16, 'sine');
    if (inBar === 0 || inBar === 5) this.hit(t, 0.4, 90, 0.35);   // kick
    if (inBar === 4) this.hit(t, 0.12, 1800, 0.12);               // snare-ish
    if (inBar % 2 === 1) this.hit(t, 0.03, 7000, 0.04);           // hat
    if (Math.random() < 0.5) this.hit(t + Math.random() * 0.2, 0.01, 4000, 0.03); // crackle
    if (inBar === 2 && bar % 2 === 1) this.tone(mtof(chord[2 + (step % 2)] + 12), t, 0.5, 0.03, 'sine'); // little top note
  }

  private tone(f: number, t: number, dur: number, vol: number, type: OscillatorType) {
    const c = this.ctx!, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f + (Math.random() - 0.5) * 0.6; // slightly wobbly, like tape
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master!); o.start(t); o.stop(t + dur + 0.05);
  }

  private hit(t: number, dur: number, freq: number, vol: number) {
    const c = this.ctx!, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise!; f.type = freq < 300 ? 'lowpass' : 'highpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.master!); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }

  /** Pause with the tab so it never plays to an empty room. */
  suspend() { if (this.on) void this.ctx?.suspend(); }
  resume() { if (this.on && this.ctx) void wake(this.ctx); }
}

export const radio = new RadioSound();

// The door scene's soundtrack, all synthesised: wind, a single-cylinder engine coming in and idling, the sensor
// beeping, then the roller door's relay click, motor, rattle and thunk. Cues follow the scene clock, so it lines up
// with the pictures. Browsers keep audio locked until a gesture, so start() is safe to call again after a tap.
export interface DoorCues { sense: number; arrive: number; open: number; up: number; end: number; thunder?: number }

export class DoorSound {
  private ctx?: AudioContext;
  private master?: GainNode;
  private dead = false;
  running = false;
  private weather = 'clear';

  start(now: () => number, cues: DoorCues, weather = 'clear') {
    if (this.running || this.dead) return;
    this.weather = weather;
    try { this.ctx ??= newCtx(); } catch { return; }
    const c = this.ctx;
    void wake(c).then(() => {
      if (c.state !== 'running' || this.running || this.dead) return;
      this.running = true;
      this.build(now(), cues);
    });
  }

  stop() {
    if (this.dead) return; // finish() and exit() both call this
    this.dead = true;
    const c = this.ctx;
    if (!c) return;
    this.master?.gain.setTargetAtTime(0, c.currentTime, 0.08);
    window.setTimeout(() => void c.close(), 600);
  }

  private build(t: number, q: DoorCues) {
    const c = this.ctx!, base = c.currentTime - t;
    const at = (s: number) => Math.max(c.currentTime, base + s);
    const master = c.createGain(); master.gain.value = 0.9; master.connect(c.destination); this.master = master;
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const osc = (type: OscillatorType, f: number) => { const o = c.createOscillator(); o.type = type; o.frequency.value = f; o.start(); return o; };
    const noise = (loop: boolean) => { const s = c.createBufferSource(); s.buffer = buf; s.loop = loop; return s; };
    const filt = (type: BiquadFilterType, f: number, Q = 1) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = Q; return b; };
    const gain = (v: number) => { const g = c.createGain(); g.gain.value = v; return g; };

    // wind: swells as the bike rushes in, settles to a breeze
    const wind = noise(true), wf = filt('bandpass', 400, 0.6), wg = gain(0);
    wind.connect(wf).connect(wg).connect(master); wind.start();
    wg.gain.setValueAtTime(0.02, at(0)); wg.gain.linearRampToValueAtTime(0.16, at(q.arrive * 0.45));
    wg.gain.linearRampToValueAtTime(0.03, at(q.arrive + 0.6)); wg.gain.setValueAtTime(0.03, at(q.end));
    wf.frequency.setValueAtTime(300, at(0)); wf.frequency.linearRampToValueAtTime(900, at(q.arrive * 0.45)); wf.frequency.linearRampToValueAtTime(380, at(q.arrive + 0.6));

    // engine: revving in, dropping to a lazy idle, chugging like a single
    const lp = filt('lowpass', 1600, 3), eg = gain(0), chug = gain(0.55);
    const saw = osc('sawtooth', 90), sub = osc('square', 45), lfo = osc('square', 11), lg = gain(0.4);
    saw.connect(lp); sub.connect(gain(0.4)).connect(lp); lp.connect(chug).connect(eg).connect(master);
    lfo.connect(lg).connect(chug.gain);
    const f = (s: number, hz: number) => { saw.frequency.exponentialRampToValueAtTime(hz, at(s)); sub.frequency.exponentialRampToValueAtTime(hz / 2, at(s)); lfo.frequency.exponentialRampToValueAtTime(hz / 8, at(s)); };
    saw.frequency.setValueAtTime(90, at(0)); sub.frequency.setValueAtTime(45, at(0)); lfo.frequency.setValueAtTime(11, at(0));
    f(q.arrive * 0.5, 74); f(q.arrive, 36); f(q.end, 34);
    lp.frequency.setValueAtTime(1600, at(0)); lp.frequency.linearRampToValueAtTime(420, at(q.arrive));
    eg.gain.setValueAtTime(0, at(0)); eg.gain.linearRampToValueAtTime(0.11, at(0.5));
    eg.gain.linearRampToValueAtTime(0.06, at(q.arrive)); eg.gain.setValueAtTime(0.06, at(q.end - 0.7)); eg.gain.linearRampToValueAtTime(0, at(q.end));

    const beep = (s: number) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = 1760;
      g.gain.setValueAtTime(0, at(s)); g.gain.linearRampToValueAtTime(0.12, at(s + 0.01)); g.gain.setValueAtTime(0.12, at(s + 0.09)); g.gain.linearRampToValueAtTime(0, at(s + 0.11));
      o.connect(g).connect(master); o.start(at(s)); o.stop(at(s + 0.15));
    };
    const burst = (s: number, dur: number, hz: number, vol: number, kind: BiquadFilterType = 'bandpass') => {
      const n = noise(false), fl = filt(kind, hz, 1.2), g = gain(vol);
      g.gain.setValueAtTime(vol, at(s)); g.gain.exponentialRampToValueAtTime(0.0001, at(s + dur));
      n.connect(fl).connect(g).connect(master); n.start(at(s), Math.random()); n.stop(at(s + dur + 0.02));
    };
    const thunk = (s: number, vol: number) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(110, at(s)); o.frequency.exponentialRampToValueAtTime(45, at(s + 0.18));
      g.gain.setValueAtTime(vol, at(s)); g.gain.exponentialRampToValueAtTime(0.0001, at(s + 0.25));
      o.connect(g).connect(master); o.start(at(s)); o.stop(at(s + 0.3));
    };

    if (this.weather === 'rain') { // steady rain, and a rumble of thunder after the flash
      const r = noise(true), hp = filt('highpass', 1300), lp2 = filt('lowpass', 7500), rg = gain(0);
      r.connect(hp).connect(lp2).connect(rg).connect(master); r.start();
      rg.gain.setValueAtTime(0, at(0)); rg.gain.linearRampToValueAtTime(0.1, at(0.8)); rg.gain.setValueAtTime(0.1, at(q.end - 0.5)); rg.gain.linearRampToValueAtTime(0, at(q.end));
      if (q.thunder) { burst(q.thunder, 2.4, 130, 0.55, 'lowpass'); burst(q.thunder + 0.5, 1.6, 90, 0.4, 'lowpass'); }
    } else if (this.weather === 'snow' || this.weather === 'fog') { // muffled: a quiet, wide hush
      const r = noise(true), lp2 = filt('lowpass', 900), rg = gain(0.03);
      r.connect(lp2).connect(rg).connect(master); r.start();
    }

    // sensor sees the bike: two beeps, then the relay clicks and the door wakes up
    beep(q.sense); beep(q.sense + 0.16);
    burst(q.sense + 0.35, 0.03, 3000, 0.2, 'highpass');
    thunk(q.sense + 0.42, 0.18); burst(q.sense + 0.42, 0.05, 1400, 0.16); // the lock bolt drawing back
    for (let s = q.sense + 0.3; s < q.open; s += 0.06) burst(s, 0.03, 900, 0.03 + Math.random() * 0.03); // shutter jitters

    // motor and rattling slats while it climbs
    thunk(q.open, 0.35); burst(q.open, 0.05, 2500, 0.18, 'highpass');
    const motor = osc('sawtooth', 52), mf = filt('lowpass', 320), mg = gain(0);
    motor.connect(mf).connect(mg).connect(master);
    motor.frequency.setValueAtTime(52, at(q.open)); motor.frequency.linearRampToValueAtTime(74, at(q.open + q.up));
    mg.gain.setValueAtTime(0, at(q.open)); mg.gain.linearRampToValueAtTime(0.07, at(q.open + 0.25));
    mg.gain.setValueAtTime(0.07, at(q.open + q.up - 0.1)); mg.gain.linearRampToValueAtTime(0, at(q.open + q.up + 0.15));
    for (let s = q.open + 0.1; s < q.open + q.up; s += 0.055) burst(s, 0.035, 1100 + Math.random() * 900, 0.05 + Math.random() * 0.05);
    thunk(q.open + q.up, 0.3); burst(q.open + q.up, 0.25, 260, 0.2, 'lowpass'); // hits the housing
    // each panel knocks as it goes over the curve. The lift eases out cubically (see ease() in door.ts), so invert that to time them.
    for (const x of [0.25, 0.5, 0.75]) {
      const at2 = q.open + q.up * (1 - Math.cbrt(1 - x));
      burst(at2, 0.07, 700, 0.14); thunk(at2, 0.1);
    }
  }
}

// The cat's meow: a throat buzz with a vowel that slides from a nasal "mee" through "ah" to "ow" (formant filters), pitch rising then falling.
export const meowAllowed = (last: number, now: number, gap = 1.5) => now - last >= gap;

let meowCtx: AudioContext | undefined;
let lastMeow = -Infinity;

// A recorded meow (public/sounds/meow.mp3) plays when it exists; otherwise the synthesised one below does.
let meowBuf: AudioBuffer | null | undefined; // undefined: not tried yet, null: no file or it would not decode

/** Fetch and decode the recording ahead of time so the first pet is not late. Safe to call more than once. */
export async function preloadMeow() {
  if (meowBuf !== undefined) return;
  meowBuf = null;
  try {
    meowCtx ??= newCtx();
    const r = await fetch('/sounds/meow.mp3');
    if (!r.ok) return;
    meowBuf = await meowCtx.decodeAudioData(await r.arrayBuffer());
  } catch { meowBuf = null; }
}

export function meow() {
  const now = performance.now() / 1000;
  if (!meowAllowed(lastMeow, now)) return;
  lastMeow = now;
  try { meowCtx ??= newCtx(); } catch { return; }
  const c = meowCtx;
  void wake(c);
  if (meowBuf) {
    const src = c.createBufferSource(), g = c.createGain();
    src.buffer = meowBuf; g.gain.value = 0.9;
    src.connect(g).connect(c.destination); src.start();
    return;
  }
  const t = c.currentTime, dur = 0.8;
  const buzz = c.createOscillator(); buzz.type = 'sawtooth';
  buzz.frequency.setValueAtTime(390, t); buzz.frequency.exponentialRampToValueAtTime(640, t + 0.14);
  buzz.frequency.exponentialRampToValueAtTime(700, t + 0.3); buzz.frequency.exponentialRampToValueAtTime(420, t + dur);
  const vib = c.createOscillator(), vg = c.createGain(); vib.frequency.value = 5.5; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(10, t + 0.35); vib.connect(vg).connect(buzz.frequency);
  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.5, t + 0.07); out.gain.setValueAtTime(0.5, t + 0.45); out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  out.connect(c.destination);
  // three formants (the resonances of the mouth) that move from "ee" to "ah" to "oo"
  const formant = (f0: number, f1: number, f2: number, q: number, vol: number) => {
    const f = c.createBiquadFilter(), g = c.createGain(); f.type = 'bandpass'; f.Q.value = q; g.gain.value = vol;
    f.frequency.setValueAtTime(f0, t); f.frequency.linearRampToValueAtTime(f1, t + 0.3); f.frequency.linearRampToValueAtTime(f2, t + dur);
    buzz.connect(f).connect(g).connect(out);
  };
  formant(380, 780, 480, 6, 1.0);
  formant(2300, 1500, 950, 7, 0.7);
  formant(3100, 2900, 2600, 8, 0.25);
  buzz.start(t); vib.start(t); buzz.stop(t + dur + 0.05); vib.stop(t + dur + 0.05);
}

// Small shop sounds for the garage: the compressor's blast of air, and the clock's tick while you point at it.
let sfxCtx: AudioContext | undefined;
const sfx = () => (sfxCtx ??= newCtx());

export function hiss() {
  if (muted) return;
  let c: AudioContext;
  try { c = sfx(); } catch { return; }
  void wake(c);
  const len = Math.floor(c.sampleRate * 1.1), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.6);
  const src = c.createBufferSource(), hp = c.createBiquadFilter(), g = c.createGain();
  src.buffer = buf; hp.type = 'highpass'; hp.frequency.value = 2600; g.gain.value = 0.3;
  src.connect(hp).connect(g).connect(c.destination); src.start();
}

export function tick() {
  if (muted) return;
  let c: AudioContext;
  try { c = sfx(); } catch { return; }
  void wake(c);
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
  o.type = 'square'; o.frequency.value = 1900;
  g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.04);
}
