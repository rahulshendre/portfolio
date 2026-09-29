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
      const ctx = new AudioContext();
      const gain = ctx.createGain(); gain.gain.value = 0;
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 600; filter.Q.value = 4;
      const body = ctx.createOscillator(); body.type = 'sawtooth'; body.frequency.value = 42;
      const thump = ctx.createOscillator(); thump.type = 'square'; thump.frequency.value = 21;
      const thumpGain = ctx.createGain(); thumpGain.gain.value = 0.35;
      body.connect(filter); thump.connect(thumpGain).connect(filter); filter.connect(gain).connect(ctx.destination);
      body.start(); thump.start();
      Object.assign(this, { ctx, gain, filter, body, thump });
    }
    void this.ctx!.resume();
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

// A tiny lo-fi radio for the garage: soft chords, a lazy beat and vinyl crackle, all synthesised. Off by default.
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

  private start() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
      this.master.connect(lp).connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
    }
    void this.ctx.resume();
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
  resume() { if (this.on) void this.ctx?.resume(); }
}

export const radio = new RadioSound();
