// Canvas sizing. Three modes:
//  - 'hd': the ride. Canvas at the screen's real resolution (CSS pixels x device pixel ratio),
//    drawn as smooth illustration, so nothing looks blocky.
//  - 'world': fixed 480x270 pixel-art scenes (door, garage). Letterboxed on wide screens,
//    horizontally scrollable on portrait phones so the whole garage stays reachable.
//  - 'wide': the same as 'world' but 640 wide (the door scene).
//  - 'fill': low-res pixel canvas that follows the viewport aspect (kept for pixel scenes that need it).

export type Mode = 'hd' | 'fill' | 'world' | 'wide';
export const WORLD_W = 480;
export const WIDE_W = 640; // the door scene's wider frame: the same 270 tall, with road and mountains either side
export const WORLD_H = 270;

export interface Size {
  W: number;
  H: number;
  HZ: number; // horizon as a fraction of H (ride only)
  portrait: boolean;
  cssW: number;
  cssH: number;
  dpr: number;
}

export function computeSize(mode: Mode, vw: number, vh: number, dpr = 1): Size {
  const portrait = vh > vw * 1.1;
  if (mode === 'hd') {
    const d = Math.min(2, Math.max(1, dpr));
    return { W: Math.round(vw * d), H: Math.round(vh * d), HZ: portrait ? 0.55 : 0.5, portrait, cssW: vw, cssH: vh, dpr: d };
  }
  if (mode === 'world' || mode === 'wide') {
    const w = mode === 'wide' ? WIDE_W : WORLD_W, fitH = vh / WORLD_H;
    // Landscape: fit the whole scene. Portrait: fill the height and scroll sideways.
    const scale = portrait ? fitH : Math.min(vw / w, fitH);
    return { W: w, H: WORLD_H, HZ: 0.5, portrait, cssW: w * scale, cssH: WORLD_H * scale, dpr: 1 };
  }
  const W = portrait ? 270 : 480;
  const H = Math.round(Math.min(Math.max((W * vh) / vw, portrait ? 400 : 220), portrait ? 600 : 330));
  const scale = Math.max(vw / W, vh / H); // cover: fill the screen, crop a sliver if needed
  return { W, H, HZ: portrait ? 0.56 : 0.5, portrait, cssW: W * scale, cssH: H * scale, dpr: 1 };
}

export class Screen {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  mode: Mode = 'hd';
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
    this.size = computeSize(this.mode, innerWidth, innerHeight, devicePixelRatio || 1);
    const { W, H, cssW, cssH } = this.size;
    this.canvas.width = W;
    this.canvas.height = H;
    this.ctx.imageSmoothingEnabled = this.mode === 'hd';
    this.ctx.imageSmoothingQuality = 'high';
    const stage = this.canvas.parentElement as HTMLElement;
    stage.style.width = cssW + 'px';
    stage.style.height = cssH + 'px';
    stage.dataset.mode = this.mode === 'wide' ? 'world' : this.mode; // same CSS as the garage
    for (const fn of this.listeners) fn();
  }

  /** Client (CSS pixel) coordinates to canvas pixels. */
  toCanvas(clientX: number, clientY: number) {
    const r = this.canvas.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * this.W, y: ((clientY - r.top) / r.height) * this.H };
  }
}
