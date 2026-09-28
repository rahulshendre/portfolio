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
    const stage = screen.canvas;
    stage.addEventListener('pointerdown', (e) => {
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

  /** True once per tap/click on the canvas. */
  tap() { const t = this.tapped; this.tapped = false; return t; }

  anyKey() { const any = this.pressedQ.size > 0; this.pressedQ.clear(); return any; }

  /** -1 left, 1 right, 0 none. Keyboard wins; otherwise a held pointer steers by screen half. */
  steer() {
    const l = this.down.has('ArrowLeft') || this.down.has('KeyA');
    const r = this.down.has('ArrowRight') || this.down.has('KeyD');
    if (l !== r) return l ? -1 : 1;
    if (this.pointerDown) return this.pointer.clientX < innerWidth / 2 ? -1 : 1;
    return 0;
  }

  endFrame() { this.pressedQ.clear(); this.tapped = false; }
}

export const input = new Input();
