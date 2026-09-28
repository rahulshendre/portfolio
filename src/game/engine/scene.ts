import type { Mode } from './screen';

export interface Scene {
  /** Canvas mode this scene wants. */
  mode: Mode;
  enter?(): void;
  exit?(): void;
  update(dt: number): void;
  draw(): void;
}

export class Director {
  current?: Scene;
  constructor(private setMode: (m: Mode) => void) {}

  go(next: Scene) {
    this.current?.exit?.();
    this.current = next;
    this.setMode(next.mode);
    next.enter?.();
  }
}
