/** A soft light: a radial gradient added onto what is already there, so lamps bloom smoothly instead of speckling. */
export function glow(g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rgb: string, a: number) {
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
  for (let i = 0; i <= 8; i++) { const t = i / 8; gr.addColorStop(t, `rgba(${rgb},${(a * Math.pow(1 - t, 2.2)).toFixed(3)})`); }
  g.save(); g.globalCompositeOperation = 'lighter'; g.translate(x, y); g.scale(rx, ry); g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); g.restore();
}
