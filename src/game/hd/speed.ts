// The feel of speed: streaks at the edges of the screen that pull toward the road ahead, only when you are really moving.
import { g, rnd, use } from './draw';

export function drawSpeedLines(ctx: CanvasRenderingContext2D, W: number, H: number, HZ: number, speedFrac: number, t: number) {
  const k = Math.max(0, (speedFrac - 0.55) / 0.45);
  if (k <= 0.02) return;
  use(ctx);
  const vx = W / 2, vy = H * HZ + H * 0.05;
  g.save();
  g.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const a = rnd(i * 3.7) * Math.PI * 2, side = Math.abs(Math.cos(a));
    if (side < 0.35) continue;                                   // keep the middle of the screen clear: only the edges streak
    const life = (t * (1.2 + rnd(i) * 0.8) + rnd(i * 9.1)) % 1;   // 0 at the vanishing point, 1 out at the edge
    const r0 = (0.42 + life * 0.62) * Math.max(W, H), r1 = r0 + 40 + life * 110;
    g.globalAlpha = Math.sin(life * Math.PI) * 0.16 * k;
    g.strokeStyle = '#ffffff';
    g.lineWidth = 1 + life * 2;
    g.beginPath();
    g.moveTo(vx + Math.cos(a) * r0, vy + Math.sin(a) * r0 * 0.55);
    g.lineTo(vx + Math.cos(a) * r1, vy + Math.sin(a) * r1 * 0.55);
    g.stroke();
  }
  g.restore();
}
