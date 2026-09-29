// Roadside props for the Ladakh ride, drawn in local unit space via at().
import { LOGOS, type LogoId } from './logos';
import { at, box, circle, g, label, oval, poly, rrect, stroke } from './draw';

const FLAG = ['#d8342b', '#e8b923', '#2c6eb0', '#f4f2ea', '#3c8a48'];

export function drawHouse(sx: number, sy: number, k: number, v = 0) {
  const s = k * 0.9;
  if (s < 2) return;
  at(sx, sy, s, () => {
    const wall = ['#f0ebe0', '#e8d8c0', '#d8c8a8'][v % 3];
    box(-28, -52, 56, 48, wall);
    box(-30, -56, 60, 8, '#c8b898'); // flat roof
    box(-8, -72, 10, 18, '#2a2a2e'); // water tank
    box(-18, -36, 12, 16, '#4a6070'); // window
    box(8, -36, 12, 16, '#4a6070');
    box(-6, -28, 12, 24, '#6a5040'); // door
    stroke([-28, -8, 28, -8], '#b8a888', 1.2);
  });
}

export function drawChorten(sx: number, sy: number, k: number) {
  const s = k * 0.85;
  if (s < 2) return;
  at(sx, sy, s, () => {
    box(-18, -20, 36, 18, '#ebe4d4');
    box(-14, -36, 28, 16, '#ebe4d4');
    box(-10, -48, 20, 12, '#ebe4d4');
    box(-4, -72, 8, 24, '#d8c8a0');
    circle(0, -78, 7, '#e8b923');
    box(-22, -8, 44, 6, '#c8b898');
    for (let i = 0; i < 5; i++) box(-16 + i * 7, -42, 5, 3, FLAG[i]);
  });
}

export function drawPoplar(sx: number, sy: number, k: number, gold = 1) {
  const s = k * 0.95;
  if (s < 2) return;
  at(sx, sy, s, () => {
    box(-2, -70, 4, 70, '#5a4030');
    const leaf = gold ? '#c8a848' : '#6a8a48';
    const dark = gold ? '#a88838' : '#4a6a38';
    oval(0, -78, 14, 36, leaf);
    oval(-6, -70, 10, 24, dark);
    oval(6, -88, 9, 20, leaf);
  });
}

export function drawFlags(sx: number, sy: number, k: number) {
  const s = k;
  if (s < 2) return;
  at(sx, sy, s, () => {
    stroke([-40, -90, 40, -70], '#3a3028', 1.4);
    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      const x = -40 + t * 80;
      const y = -90 + t * 20;
      poly([x, y, x + 6, y + 2, x + 5, y + 14, x - 1, y + 12], FLAG[i % 5]);
    }
  });
}

export function drawCanopy(sx: number, sy: number, k: number) {
  const s = k;
  if (s < 3) return;
  at(sx, sy, s, () => {
    stroke([-90, -110, 90, -100], '#3a3028', 2);
    for (let i = 0; i < 18; i++) {
      const t = i / 17;
      const x = -90 + t * 180;
      const y = -110 + t * 10 + Math.sin(i * 1.7) * 4;
      poly([x, y, x + 8, y + 2, x + 7, y + 18, x - 1, y + 16], FLAG[i % 5]);
    }
  });
}

export function drawMani(sx: number, sy: number, k: number) {
  const s = k;
  if (s < 2) return;
  at(sx, sy, s, () => {
    box(-50, -18, 100, 16, '#a89880');
    for (let i = 0; i < 8; i++) box(-46 + i * 12, -16, 10, 12, i % 2 ? '#8a7a68' : '#b8a890');
    box(-48, -22, 96, 4, '#c8b898');
  });
}

export function drawBoulder(sx: number, sy: number, k: number, v = 0) {
  const s = k * (0.8 + (v % 3) * 0.15);
  if (s < 2) return;
  at(sx, sy, s, () => {
    oval(0, -10, 22 + v * 3, 12 + v * 2, '#8a7060');
    oval(-6, -14, 14, 8, '#9a8070');
    oval(8, -8, 10, 6, '#7a6050');
  });
}

export function drawSnow(sx: number, sy: number, k: number, v = 0) {
  const s = k * 0.7;
  if (s < 2) return;
  at(sx, sy, s, () => {
    oval(0, -6, 18 + v * 4, 8, '#f0f4f8');
    oval(-8, -8, 10, 5, '#e0e8f0');
  });
}

export function drawYak(sx: number, sy: number, k: number) {
  const s = k * 0.85;
  if (s < 3) return;
  at(sx, sy, s, () => {
    oval(0, -14, 22, 12, '#3a3028');
    oval(18, -20, 10, 8, '#3a3028'); // head
    box(22, -28, 3, 8, '#2a2218'); // horn
    box(14, -28, 3, 8, '#2a2218');
    box(-14, -4, 4, 10, '#2a2218');
    box(-4, -4, 4, 10, '#2a2218');
    box(6, -4, 4, 10, '#2a2218');
    box(14, -4, 4, 10, '#2a2218');
    stroke([-18, -18, 8, -10], '#5a5048', 3); // shaggy back
  });
}

export function drawStone(sx: number, sy: number, k: number, hazard = 0) {
  const s = k;
  if (s < 1.5) return;
  at(sx, sy, s, () => {
    if (hazard) {
      box(-4, -10, 8, 10, Math.floor(sx) % 2 ? '#222' : '#e8b923');
    } else {
      box(-3, -8, 6, 8, '#a89880');
    }
  });
}

export function drawBro(sx: number, sy: number, k: number, lines?: readonly string[]) {
  const s = k;
  if (s < 4) return;
  at(sx, sy, s, () => {
    rrect(-48, -70, 96, 56, 4, '#e8b923');
    rrect(-44, -66, 88, 48, 3, '#1b1712');
    if (lines) {
      lines.forEach((ln, i) => {
        label(ln, 0, -48 + i * 16, 9, '#e8b923', { align: 'center', weight: 600 });
      });
    }
  });
}

export function drawMilestone(sx: number, sy: number, k: number, top?: string, sub?: string) {
  const s = k;
  if (s < 3) return;
  at(sx, sy, s, () => {
    box(-18, -70, 36, 66, '#f2f0ea');
    box(-18, -70, 36, 22, '#e8b923');
    box(-12, -78, 24, 10, '#e8b923');
    if (top) label(top, 0, -56, Math.min(11, 90 / Math.max(1, top.length)), '#1b1712', { align: 'center', weight: 600 });
    if (sub) label(sub, 0, -28, Math.min(8, 80 / Math.max(1, sub.length)), '#1b1712', { align: 'center' });
  });
}

export function drawBoard(sx: number, sy: number, k: number, id?: string) {
  const s = k;
  if (s < 4) return;
  at(sx, sy, s, () => {
    box(-4, -10, 8, 90, '#5a5048');
    rrect(-70, -120, 140, 80, 4, '#2a2a2e');
    rrect(-66, -116, 132, 72, 3, id === 'pipecd' ? '#0b1f3a' : '#f4f2ea');
    if (id && id in LOGOS) {
      const path = new Path2D(LOGOS[id as LogoId]);
      g.save();
      g.translate(-12, -100);
      g.scale(2.2, 2.2);
      g.fillStyle = id === 'github' || id === 'x' ? '#1b1712' : id === 'linkedin' ? '#0a66c2' : id === 'youtube' ? '#ff0000' : '#24b5d9';
      g.fill(path);
      g.restore();
    } else if (id === 'pipecd') {
      label('PipeCD', 0, -70, 16, '#24b5d9', { align: 'center', weight: 600, font: '"IBM Plex Sans", system-ui, sans-serif' });
    }
    if (id && id !== 'pipecd') label(id.toUpperCase(), 20, -70, 10, '#1b1712', { align: 'left', weight: 600 });
  });
}

export function drawSign(sx: number, sy: number, k: number, top?: string, sub?: string) {
  const s = k;
  if (s < 3) return;
  at(sx, sy, s, () => {
    box(-3, -8, 6, 70, '#6a6058');
    rrect(-40, -90, 80, 50, 3, '#2c5aa0');
    rrect(-36, -86, 72, 42, 2, '#f4f2ea');
    if (top) label(top, 0, -68, 11, '#1b1712', { align: 'center', weight: 600 });
    if (sub) label(sub, 0, -50, 9, '#2c5aa0', { align: 'center' });
  });
}

export function drawGarage(sx: number, sy: number, k: number) {
  const s = k;
  if (s < 4) return;
  at(sx, sy, s, () => {
    box(-70, -100, 140, 100, '#d9cbb2');
    box(-74, -108, 148, 12, '#b9a88c');
    box(-50, -88, 100, 70, '#8b8f94');
    for (let y = -84; y < -20; y += 8) box(-48, y, 96, 6, '#9a9ea2');
    label("RAHUL'S", 0, -112, 10, '#e8b923', { align: 'center', weight: 600 });
  });
}

export function drawProp(type: string, sx: number, sy: number, k: number, p: { label?: string; sub?: string; lines?: readonly string[]; v?: number }) {
  switch (type) {
    case 'house': return drawHouse(sx, sy, k, p.v ?? 0);
    case 'chorten': return drawChorten(sx, sy, k);
    case 'poplar': return drawPoplar(sx, sy, k, p.v ?? 1);
    case 'flags': return drawFlags(sx, sy, k);
    case 'canopy': return drawCanopy(sx, sy, k);
    case 'mani': return drawMani(sx, sy, k);
    case 'boulder': return drawBoulder(sx, sy, k, p.v ?? 0);
    case 'snow': return drawSnow(sx, sy, k, p.v ?? 0);
    case 'yak': return drawYak(sx, sy, k);
    case 'stone': return drawStone(sx, sy, k, p.v ?? 0);
    case 'bro': return drawBro(sx, sy, k, p.lines);
    case 'ms': return drawMilestone(sx, sy, k, p.label, p.sub);
    case 'board': return drawBoard(sx, sy, k, p.label);
    case 'sign': return drawSign(sx, sy, k, p.label, p.sub);
    case 'garage': return drawGarage(sx, sy, k);
  }
}
