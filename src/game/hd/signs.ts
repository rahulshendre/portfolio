// Everything that stands by the road with writing on it: the social hoardings (YouTube, X, LinkedIn, GitHub, PipeCD), the Border Roads slogan
// boards, green direction boards, speed limits and chevrons. All are drawn in local units with (0, 0) at the foot of the post, on real posts
// that reach the ground, with a cast shadow, reflective sheen, weathering and, as the light goes, lamps and a glow on the face.
import { at, box, circle, fit, g, hgrad, label, oval, poly, rnd, rrect, stroke, vgrad, shade } from './draw';
import { LOGOS, type LogoId } from './logos';
import { site, socials } from '../../data/site';

/** How late it is (0 day .. 1 dusk) and how dark (0..1), set by the road renderer, so signs can light up. */
let TOD = 0, NIGHT = 0;
export const setSignLight = (tod: number, night: number) => { TOD = tod; NIGHT = night; };

const INK = '#1b1712';

function cast(h: number, w: number, a = 0.17) {
  poly([-w / 2, 0, w / 2, 0, -h * 0.85 + w / 2, h * 0.3, -h * 0.85 - w / 2, h * 0.3], `rgba(34,20,12,${a})`);
}

/** A steel post that reaches the ground: a lit edge, optional paint bands, a base plate with bolts. */
function post(x: number, top: number, w = 5, bands = false) {
  box(x - w / 2, top, w, -top, hgrad(x - w / 2, x + w / 2, [[0, '#8a8f96'], [0.35, '#c4c8ce'], [1, '#5a5f66']]));
  if (bands) for (let y = -6; y > top; y -= 16) box(x - w / 2, y - 7, w, 7, '#d8342b');
  box(x - w, -3, w * 2, 3, '#4a4e54'); circle(x - w * 0.6, -1.5, 0.7, '#9aa0a8'); circle(x + w * 0.6, -1.5, 0.7, '#9aa0a8');
}

/** Rivets at the four corners of a panel. */
function rivets(x: number, y: number, w: number, h: number, col = '#9aa0a8') {
  for (const [rx, ry] of [[x + 3.5, y + 3.5], [x + w - 3.5, y + 3.5], [x + 3.5, y + h - 3.5], [x + w - 3.5, y + h - 3.5]] as const) { circle(rx, ry, 1, '#0006'); circle(rx - 0.2, ry - 0.2, 0.8, col); }
}

/** A diagonal band of light across a glossy or reflective face. */
function sheen(x: number, y: number, w: number, h: number, a = 0.12) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.globalAlpha = a; poly([x + w * 0.05, y, x + w * 0.3, y, x + w * 0.05 - h * 0.25, y + h, x - w * 0.2, y + h], '#fff'); g.globalAlpha = a * 0.6; poly([x + w * 0.36, y, x + w * 0.44, y, x + w * 0.2, y + h, x + w * 0.12, y + h], '#fff');
  g.restore(); g.globalAlpha = 1;
}

/** Weathering: a dark streak of road dirt along the foot of a face, and a few scratches, repeatable per sign through `seed`. */
function worn(x: number, y: number, w: number, h: number, seed: number, near: boolean) {
  const dirt = g.createLinearGradient(0, y + h * 0.6, 0, y + h);
  dirt.addColorStop(0, 'rgba(70,50,30,0)'); dirt.addColorStop(1, 'rgba(70,50,30,0.3)');
  g.fillStyle = dirt; g.fillRect(x, y + h * 0.6, w, h * 0.4);
  if (!near) return;
  g.globalAlpha = 0.22; g.lineWidth = 0.6; g.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const sx = x + 6 + rnd(seed + i * 3.1) * (w - 12), sy = y + 4 + rnd(seed + i * 5.7) * (h - 8), len = 4 + rnd(seed + i * 1.9) * 9;
    g.strokeStyle = i % 2 ? '#fff' : '#000'; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + len, sy + len * 0.35); g.stroke();
  }
  g.globalAlpha = 1;
}

/** Two arm lamps over a hoarding. By day they are small dark fittings; as the light goes they light the face, and at night they shine. */
function lamps(xs: number[], y: number, faceW: number, faceH: number) {
  const on = Math.max(NIGHT, Math.max(0, (TOD - 0.5) * 1.6)), lit = Math.min(1, on);
  for (const x of xs) {
    stroke([x, y, x, y - 7, x + 4, y - 10], '#26272b', 1.8);
    poly([x + 1, y - 10, x + 10, y - 10, x + 8, y - 6, x + 3, y - 6], '#1c1d20');
    circle(x + 5.5, y - 6, 1.4, lit > 0.05 ? '#fff2c0' : '#6a6a6e');
    if (lit > 0.05) {                                                                                   // a soft wash of warm light falling from the lamp onto the face, and a bloom round the lamp itself
      const r = Math.max(faceW, faceH) * 0.62, cx = x + 5.5, cy = y + faceH * 0.28;
      const gr = g.createRadialGradient(cx, y - 6, 0, cx, cy, r);
      gr.addColorStop(0, `rgba(255,228,168,${0.3 * lit})`); gr.addColorStop(0.6, `rgba(255,228,168,${0.1 * lit})`); gr.addColorStop(1, 'rgba(255,228,168,0)');
      g.fillStyle = gr; g.fillRect(cx - r, y - 10, r * 2, r + faceH);
      circle(x + 5.5, y - 6, 4.5, `rgba(255,240,190,${0.35 * lit})`);
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// the social hoardings

interface Brand { top: string; bot: string; face: string; verb: string; strip: string; text: string }
const BRANDS: Record<string, Brand> = {
  youtube: { top: '#ee2a1f', bot: '#b3140c', face: '#ffffff', verb: 'WATCH', strip: 'YOUTUBE', text: '#ffffff' },
  x: { top: '#1d1d21', bot: '#050506', face: '#ffffff', verb: 'FOLLOW', strip: 'X / TWITTER', text: '#ffffff' },
  linkedin: { top: '#1a78d2', bot: '#0a55a0', face: '#ffffff', verb: 'CONNECT', strip: 'LINKEDIN', text: '#ffffff' },
  github: { top: '#242b34', bot: '#10141a', face: '#ffffff', verb: 'SEE THE CODE', strip: 'GITHUB', text: '#ffffff' },
  pipecd: { top: '#10305a', bot: '#071a36', face: '#24b5d9', verb: 'LFX MENTEE 2026', strip: 'CNCF PROJECT', text: '#ffffff' },
};
const HANDLE: Record<string, string> = {
  youtube: ((l) => l.charAt(0) + l.slice(1).toLowerCase())(socials.find((s) => s.id === 'youtube')?.line ?? 'Videos soon'),
  x: site.links.xHandle,
  linkedin: 'Rahul Shendre',
  github: 'rahulshendre',
  pipecd: 'PipeCD',
};

export function drawBoard(sx: number, sy: number, k: number, id = 'github') {
  if (k < 0.16) return;
  const B = BRANDS[id] ?? BRANDS.github, near = k > 0.34, seed = id.charCodeAt(0) * 7.3;
  at(sx, sy, k, () => {
    shade(70, 6, 0.25);
    cast(170, 150, 0.14);
    // a hoarding on two steel posts, with a catwalk rail under the face
    post(-54, -166, 6); post(54, -166, 6);
    stroke([-54, -70, 54, -70], '#3a3e44', 2);
    // the frame and the panel
    rrect(-80, -168, 160, 92, 5, '#1a1c20'); rrect(-77, -165, 154, 86, 3.5, '#2c3036');
    const face = g.createLinearGradient(0, -162, 0, -82); face.addColorStop(0, B.top); face.addColorStop(1, B.bot);
    rrect(-74, -162, 148, 80, 3, face);
    box(-74, -96, 148, 14, 'rgba(0,0,0,0.3)');                                                     // the bottom strip, a shade darker
    // the logo: big, white, on the left
    if (id === 'pipecd') {
      g.globalAlpha = 0.95; stroke([-58, -124, -42, -124, -42, -140], '#24b5d9', 3); stroke([-42, -124, -26, -124], '#24b5d9', 3);
      for (const [cx, cy] of [[-58, -124], [-42, -140], [-26, -124]] as const) { circle(cx, cy, 6.5, '#24b5d9'); circle(cx, cy, 3, B.top); }
      g.globalAlpha = 1;
    } else if (id in LOGOS) {
      g.save(); g.translate(-69, -150); g.scale(2.3, 2.3); g.fillStyle = B.face; g.fill(new Path2D(LOGOS[id as LogoId])); g.restore();
    }
    // the words: what to do, then the handle in big letters
    g.save(); g.beginPath(); g.rect(-74, -162, 148, 80); g.clip();                                      // text never spills past the panel
    fit(B.verb, 34, -138, 66, 8, 'rgba(255,255,255,0.75)', 600);
    fit(HANDLE[id] ?? id, 34, -118, 62, 15, B.text, 700);
    if (id === 'pipecd') fit('PipeCD', 34, -118, 62, 18, '#24b5d9', 700);
    g.restore();
    fit(B.strip, 0, -86, 140, 8, 'rgba(255,255,255,0.85)', 700);
    // gloss, dirt and rivets
    sheen(-74, -162, 148, 80, 0.1);
    if (near) worn(-74, -162, 148, 80, seed, true);
    rivets(-80, -168, 160, 92);
    lamps([-56, -8, 40], -168, 148, 80);
  });
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// Border Roads Organisation slogan boards

export function drawBro(sx: number, sy: number, k: number, lines?: readonly string[]) {
  if (k < 0.16) return;
  const near = k > 0.34, seed = (lines?.[0]?.charCodeAt(0) ?? 66) * 3.7;
  at(sx, sy, k, () => {
    shade(56, 5, 0.24);
    cast(96, 100, 0.13);
    post(-44, -28, 5); post(44, -28, 5);                                                          // short steel legs
    stroke([-44, -30, 44, -30], '#3a3e44', 2);
    // a yellow reflective board with a rounded black field, as the BRO paint and plate it
    rrect(-58, -96, 116, 68, 6, vgrad(-96, -28, [[0, '#dcb838'], [1, '#c29a1c']]));   // routine boards are a duller yellow than the warning chevrons and the exit, so the eye goes to those first
    rrect(-53, -91, 106, 58, 4, '#15120e');
    rrect(-53, -91, 106, 58, 4, 'rgba(255,255,255,0.03)');
    if (lines) lines.forEach((ln, i) => fit(ln, 0, -68 + i * 17, 94, 11, '#e3bf3c', 700));
    // the small print every board carries
    box(-20, -43, 40, 0.8, 'rgba(246,203,42,0.45)');
    fit('BRO · HIMANK', 0, -36, 40, 4.6, 'rgba(246,203,42,0.7)', 600);
    sheen(-58, -96, 116, 68, 0.11);
    if (near) worn(-58, -96, 116, 68, seed, true);
    rivets(-58, -96, 116, 68, '#a8860e');
    lamps([-40, 30], -96, 116, 68);
  });
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// green direction boards

export function drawSign(sx: number, sy: number, k: number, top?: string, sub?: string) {
  if (k < 0.16) return;
  const near = k > 0.34, seed = (top?.charCodeAt(0) ?? 71) * 2.3;
  at(sx, sy, k, () => {
    shade(50, 5, 0.24);
    cast(88, 90, 0.13);
    post(-34, -34, 5); post(34, -34, 5);
    rrect(-52, -96, 104, 62, 5, '#e9ece8');                                                       // the white edge of the board
    rrect(-49, -93, 98, 56, 3, vgrad(-93, -37, [[0, '#1f7a44'], [1, '#155c32']]));
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 1.2; g.strokeRect(-46, -90, 92, 50);   // the white line just inside the green
    if (top) fit(top, -6, -66, 80, 14, '#ffffff', 700);
    if (sub) {
      fit(sub, -6, -48, 62, 10, '#f6cb2a', 700);
      // an arrow on the right: ahead for a distance, left for a turn
      const left = /LEFT/.test(sub);
      g.save(); g.translate(36, -62); if (left) g.rotate(-Math.PI / 2);
      poly([0, -10, 8, 0, 3, 0, 3, 9, -3, 9, -3, 0, -8, 0], '#ffffff'); g.restore();
    }
    sheen(-49, -93, 98, 56, 0.1);
    if (near) worn(-49, -93, 98, 56, seed, true);
    rivets(-52, -96, 104, 62, '#b8bcb8');
  });
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// speed limits and chevrons

export function drawLimit(sx: number, sy: number, k: number, kmh = 40) {
  if (k < 0.16) return;
  at(sx, sy, k, () => {
    shade(11, 1.8, 0.22);
    cast(96, 6, 0.12);
    post(0, -76, 4, true);
    circle(0, -94, 23, '#0006'); circle(0, -94, 22, '#c8312a'); circle(0, -94, 15.5, '#f9f8f3');                                     // a thick red ring round a white face
    g.save(); g.beginPath(); g.arc(0, -94, 22, 0, Math.PI * 2); g.clip(); sheen(-22, -116, 44, 44, 0.16); g.restore();
    label(String(kmh), 0, -87.5, 20, INK, { align: 'center', weight: 800 });
    rrect(-20, -66, 40, 14, 3, '#f9f8f3'); rrect(-20, -66, 40, 14, 3, 'rgba(0,0,0,0.05)');
    g.strokeStyle = INK; g.lineWidth = 0.9; g.strokeRect(-19, -65, 38, 12);
    label('BRO', 0, -55.5, 8.5, INK, { align: 'center', weight: 800 });
  });
}

export function drawChevron(sx: number, sy: number, k: number, dir = 1) {
  if (k < 0.16) return;
  at(sx, sy, k, () => {
    shade(10, 1.8, 0.22);
    cast(100, 5, 0.12);
    post(0, -62, 4, true);
    rrect(-30, -108, 60, 50, 5, '#15120e'); rrect(-27, -105, 54, 44, 3.5, vgrad(-105, -61, [[0, '#f8d030'], [1, '#e3ac12']]));
    g.save(); g.scale(dir, 1);
    for (const x of [-13, 4]) { poly([x, -96, x + 12, -83, x, -70, x + 7, -70, x + 19, -83, x + 7, -96], '#15120e'); }
    g.restore();
    sheen(-27, -105, 54, 44, 0.16);
  });
}

// dusk wash and night light for each sign type, read by props.ts
export const SIGN_GLOW: Record<string, [number, number]> = { board: [-120, 130], bro: [-60, 90], sign: [-64, 84], chevron: [-84, 70] };
export const SIGN_EMIT: Record<string, [number, number, number, number, string]> = {
  board: [0, -124, 120, 0.34, '#fff0d0'], bro: [0, -62, 82, 0.3, '#ffd070'], sign: [0, -64, 76, 0.3, '#d8f0d0'], chevron: [0, -84, 56, 0.3, '#ffe060'],
};
