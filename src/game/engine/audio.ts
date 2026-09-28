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
