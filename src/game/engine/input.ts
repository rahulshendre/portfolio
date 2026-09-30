// Keyboard + pointer state for the game. Scenes read it each frame.
import type { Screen } from './screen';

class Input {
  down = new Set<string>();
  private pressedQ = new Set<string>();
  pointerDown = false;
  pointer = { x: 0, y: 0, clientX: 0 };
  private tapped = false;
  lastInputAt = -Infinity;

  attach(screen: Screen) {
    addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!this.down.has(e.code)) this.pressedQ.add(e.code);
      this.down.add(e.code);
      this.lastInputAt = performance.now();
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    });
    addEventListener('keyup', (e) => this.down.delete(e.code));
    addEventListener('blur', () => this.down.clear());
    // Listen on the stage, not the canvas: with the lighting pass on, the game canvas is hidden and the effects canvas ignores the pointer, so a click lands on the stage itself.
    const stage = screen.canvas.parentElement ?? screen.canvas;
    stage.addEventListener('pointerdown', (e) => {
      if (e.target instanceof Element && e.target.closest('.hotspots > *')) return; // links and buttons over the art handle their own clicks
      this.pointerDown = true;
      this.tapped = true;
      const p = screen.toCanvas(e.clientX, e.clientY);
      this.pointer = { ...p, clientX: e.clientX };
      this.lastInputAt = performance.now();
    });
    addEventListener('pointerup', () => { this.pointerDown = false; });
    addEventListener('pointercancel', () => { this.pointerDown = false; });
  }

  /** True once per key press. */
  pressed(...codes: string[]) {
    for (const c of codes) if (this.pressedQ.has(c)) { this.pressedQ.delete(c); return true; }
    return false;
  }

  // A gamepad, if one is plugged in: left stick or d-pad steers, right trigger is gas, left trigger brake.
  // A honks, X toggles the light, Y changes camera, Start pauses, Back shows the keys.
  padX = 0; padGas = false; padBrake = false;
  private padPrev: boolean[] = [];
  poll() {
    const gp = (navigator.getGamepads?.() ?? []).find((p) => p && p.connected);
    if (!gp) { this.padX = 0; this.padGas = this.padBrake = false; return; }
    const b = (i: number) => !!gp.buttons[i]?.pressed, v = (i: number) => gp.buttons[i]?.value ?? 0, dz = (n: number) => (Math.abs(n) < 0.18 ? 0 : n);
    this.padX = dz(gp.axes[0] ?? 0) || (b(15) ? 1 : b(14) ? -1 : 0);
    this.padGas = v(7) > 0.15 || b(12);
    this.padBrake = v(6) > 0.15 || b(13);
    [[0, 'KeyH'], [2, 'KeyL'], [3, 'KeyV'], [9, 'KeyP'], [8, 'KeyK']].forEach(([i, code]) => {
      const now = b(i as number);
      if (now && !this.padPrev[i as number]) { this.pressedQ.add(code as string); this.lastInputAt = performance.now(); }
      this.padPrev[i as number] = now;
    });
    if (this.padX || this.padGas || this.padBrake) this.lastInputAt = performance.now();
  }

  /** True once per tap/click on the canvas. */
  tap() { const t = this.tapped; this.tapped = false; return t; }

  anyKey() { const any = this.pressedQ.size > 0; this.pressedQ.clear(); return any; }

  /** -1 left, 1 right, 0 none. Keyboard wins; otherwise a held pointer steers by screen half. */
  steer() {
    const l = this.down.has('ArrowLeft') || this.down.has('KeyA');
    const r = this.down.has('ArrowRight') || this.down.has('KeyD');
    if (l !== r) return l ? -1 : 1;
    if (this.padX) return this.padX;
    if (this.pointerDown) return this.pointer.clientX < innerWidth / 2 ? -1 : 1;
    return 0;
  }

  endFrame() { this.pressedQ.clear(); this.tapped = false; }
}

export const input = new Input();
