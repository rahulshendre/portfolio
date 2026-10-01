// Life in the air over the Bliss land: butterflies fluttering across the verge by day, fireflies blinking over the grass at dusk and in the dark. Screen space, drawn over the world.
const hash = (n: number) => Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;
const WINGS = ['#f4c430', '#ffffff', '#ff9a40', '#7ab8f0', '#f08ac0', '#f4c430'];

/** Butterflies drifting across the meadow beside the road. `k` (0 to 1) fades them (they hide from the rain, the dusk and a fast bike). */
export function drawButterflies(g: CanvasRenderingContext2D, W: number, H: number, HZ: number, t: number, k: number) {
  if (k < 0.02) return;
  const u = Math.max(1, H / 640), top = H * HZ;
  g.save();
  for (let i = 0; i < 7; i++) {
    const dir = i % 2 ? 1 : -1, span = W + 120, x = ((((hash(i) * span + t * (14 + i * 4) * dir) % span) + span) % span) - 60;
    const y = top + (H - top) * (0.1 + 0.5 * hash(i + 9)) + Math.sin(t * 1.4 + i * 2) * 16 * u + Math.sin(t * 0.7 + i) * 8 * u;
    const flap = Math.abs(Math.sin(t * 13 + i * 3)), r = (4 + hash(i + 3) * 3) * u * (0.7 + (y - top) / (H - top) * 0.7), col = WINGS[i % WINGS.length];
    g.globalAlpha = k * 0.95;
    for (const s of [-1, 1]) {
      g.fillStyle = col; g.beginPath(); g.ellipse(x + s * r * 0.55 * (0.25 + flap * 0.75), y - r * 0.2, r * (0.3 + flap * 0.7), r * 0.85, s * 0.35, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(40,24,10,0.35)'; g.beginPath(); g.ellipse(x + s * r * 0.5 * (0.25 + flap * 0.75), y + r * 0.2, r * (0.18 + flap * 0.4), r * 0.4, -s * 0.3, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = '#2a1c14'; g.fillRect(x - r * 0.1, y - r * 0.6, r * 0.2, r * 1.3);
  }
  g.restore();
}

/** Fireflies: soft green-gold lights that drift, swell and fade over the grass. `k` (0 to 1) is how dark it is. */
export function drawFireflies(g: CanvasRenderingContext2D, W: number, H: number, HZ: number, t: number, k: number) {
  if (k < 0.02) return;
  const u = Math.max(1, H / 640), top = H * HZ;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 38; i++) {
    const x = hash(i * 1.7) * W + Math.sin(t * 0.5 + i) * 26 * u, y = top + (H - top) * (0.06 + 0.82 * hash(i * 2.3)) + Math.cos(t * 0.6 + i * 1.3) * 14 * u;
    const blink = Math.max(0, Math.sin(t * (0.9 + hash(i) * 0.7) + i * 5.1)) ** 3, near = 0.5 + 0.9 * (y - top) / (H - top), r = 15 * u * near;
    if (blink < 0.03) continue;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(240,255,170,${(1 * blink * k).toFixed(3)})`); gr.addColorStop(0.3, `rgba(200,245,120,${(0.42 * blink * k).toFixed(3)})`); gr.addColorStop(1, 'rgba(190,240,110,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.restore();
}
