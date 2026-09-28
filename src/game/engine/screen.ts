// Canvas sizing. Two modes:
//  - 'fill': the ride. Internal resolution follows the viewport aspect so the road fills the screen.
//  - 'world': fixed 480x270 scenes (door, garage). Letterboxed on wide screens, horizontally
//    scrollable on portrait phones so the whole garage stays reachable.

export type Mode = 'fill' | 'world';
export const WORLD_W = 480;
export const WORLD_H = 270;

export interface Size {
  W: number;
  H: number;
  HZ: number; // horizon as a fraction of H (ride only)
  portrait: boolean;
  cssW: number;
  cssH: number;
}

export function computeSize(mode: Mode, vw: number, vh: number): Size {
  const portrait = vh > vw * 1.1;
  if (mode === 'world') {
    const fitH = vh / WORLD_H;
    // Landscape: fit the whole scene. Portrait: fill the height and scroll sideways.
    const scale = portrait ? fitH : Math.min(vw / WORLD_W, fitH);
    return { W: WORLD_W, H: WORLD_H, HZ: 0.5, portrait, cssW: WORLD_W * scale, cssH: WORLD_H * scale };
  }
  const W = portrait ? 270 : 480;
  const H = Math.round(Math.min(Math.max((W * vh) / vw, portrait ? 400 : 220), portrait ? 600 : 330));
  const scale = Math.max(vw / W, vh / H); // cover: fill the screen, crop a sliver if needed
  return { W, H, HZ: portrait ? 0.56 : 0.5, portrait, cssW: W * scale, cssH: H * scale };
}

export class Screen {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  mode: Mode = 'fill';
  size!: Size;
  private listeners: (() => void)[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    addEventListener('resize', () => this.resize());
  }

  get W() { return this.size.W; }
  get H() { return this.size.H; }

  setMode(mode: Mode) {
    this.mode = mode;
    this.resize();
  }

  onResize(fn: () => void) { this.listeners.push(fn); }

  resize() {
    this.size = computeSize(this.mode, innerWidth, innerHeight);
    const { W, H, cssW, cssH } = this.size;
    this.canvas.width = W;
    this.canvas.height = H;
    this.ctx.imageSmoothingEnabled = false;
    const stage = this.canvas.parentElement as HTMLElement;
    stage.style.width = cssW + 'px';
    stage.style.height = cssH + 'px';
    stage.dataset.mode = this.mode;
    for (const fn of this.listeners) fn();
  }

  /** Client (CSS pixel) coordinates to canvas pixels. */
  toCanvas(clientX: number, clientY: number) {
    const r = this.canvas.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * this.W, y: ((clientY - r.top) / r.height) * this.H };
  }
}
