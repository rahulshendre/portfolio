// The garage door, painted in code: steel panels with recesses, hinges, wear and weather; the frame around it; wear on the wall.
// Each function draws with the current pixel context, so call them inside paint(...).
import { bayer, disc, line, rect } from '../engine/pixel';
import type { Weather } from '../state';

export const PANELS = 4;

const frac = (v: number) => v - Math.floor(v);
const hash = (i: number, s = 0) => frac(Math.sin(i * 127.1 + s * 311.7) * 43758.5453);

const STEEL_LIGHT = '#90949a', STEEL_DARK = '#7f8389';

/** One panel: steel with a soft top-to-bottom shade, two pressed-in recesses, seam, hinges, rollers, dirt, rust, dents and chips. */
function paintPanel(i: number, w: number, ph: number) {
  const y0 = i * ph;
  for (let y = 0; y < ph; y++) for (let x = 0; x < w; x++) rect(x, y0 + y, 1, 1, y / ph > bayer(x, y0 + y) ? STEEL_DARK : STEEL_LIGHT);
  for (let y = 4; y < ph; y += 3) for (let x = (y * 7) % 11; x < w; x += 11) rect(x, y0 + y, 5, 1, '#9a9ea4'); // faint brushed grain

  const recess = (x: number, y: number, rw: number, rh: number) => {
    rect(x, y, rw, rh, '#868a90');
    rect(x, y, rw, 1, '#5c6065'); rect(x, y, 1, rh, '#5c6065');                   // pressed in: dark top and left
    rect(x + 1, y + rh - 1, rw - 1, 1, '#b0b4b9'); rect(x + rw - 1, y + 1, 1, rh - 1, '#b0b4b9'); // lit bottom and right
  };
  const half = Math.floor(w / 2);
  recess(12, y0 + 8, half - 20, ph - 16);
  recess(half + 8, y0 + 8, half - 20, ph - 16);

  if (i > 0) { // seam with the panel above: a dark gap, a lit lip, hinges and rollers
    rect(0, y0 - 1, w, 1, '#55595e'); rect(0, y0, w, 1, '#3f4247'); rect(0, y0 + 1, w, 1, '#a9adb2');
    for (const x of [6, half - 3, w - 12]) {
      rect(x, y0 - 3, 6, 6, '#3a3d42'); rect(x + 1, y0 - 2, 4, 4, '#565a60'); rect(x + 2, y0 - 1, 1, 1, '#c9ccd0'); rect(x + 3, y0 + 1, 1, 1, '#c9ccd0');
      const len = 6 + Math.round(hash(i * 3 + x) * 10); // rust running down from the hinge
      for (let k = 0; k < len; k++) if (bayer(x, k) > 0.25) rect(x + 2, y0 + 3 + k, 1, 1, k % 2 ? '#8a4b2a' : '#6d3b22');
    }
    rect(0, y0 - 2, 3, 4, '#2a2c30'); rect(w - 3, y0 - 2, 3, 4, '#2a2c30'); // roller wheels at the edges
  }

  const grime = (i + 1) / PANELS; // the lower the panel, the dirtier
  for (let y = Math.round(ph * 0.45); y < ph; y++) for (let x = 0; x < w; x++) {
    const p = grime * Math.pow(y / ph, 2) * 0.5;
    if (hash(x * 7 + y * 13 + i * 101) < p) rect(x, y0 + y, 1, 1, hash(x + y) > 0.5 ? '#5c5d5f' : '#6b6c6e');
  }
  for (let k = 0; k < 2; k++) { // a couple of dents
    const cx = 24 + Math.round(hash(i * 10 + k, 1) * (w - 48)), cy = y0 + 12 + Math.round(hash(i * 10 + k, 2) * (ph - 24)), r = 2 + Math.round(hash(i * 10 + k, 3) * 2);
    disc(cx, cy, r, '#72767c'); disc(cx - 1, cy - 1, Math.max(1, r - 1), '#8e9298'); rect(cx + r - 1, cy + r - 1, 1, 1, '#b4b8bd');
  }
  for (let k = 0; k < 10; k++) rect(Math.round(hash(i * 20 + k, 4) * (w - 1)), y0 + Math.round(hash(i * 20 + k, 5) * (ph - 1)), 1, 1, hash(k + i, 6) > 0.5 ? '#b9bcc0' : '#6b4a3a'); // paint chips
}

/** The closed door, all panels. Decals (tag, text) go on top afterwards. */
export function paintDoor(w: number, h: number, weather: Weather) {
  const ph = Math.round(h / PANELS);
  for (let i = 0; i < PANELS; i++) paintPanel(i, w, ph);
  rect(0, h - 5, w, 5, '#16171a'); rect(0, h - 5, w, 1, '#2a2b2f'); // rubber seal along the bottom
  for (let x = 2; x < w; x += 6) rect(x, h - 4, 1, 3, '#0c0c0e');
  if (weather === 'rain') { // beads and short streaks on the steel
    for (let k = 0; k < 110; k++) {
      const x = Math.round(hash(k, 7) * (w - 2)), y = Math.round(hash(k, 8) * (h - 12));
      rect(x, y, 1, 2, 'rgba(205,220,240,0.55)'); rect(x, y, 1, 1, 'rgba(255,255,255,0.7)');
      if (k % 4 === 0) line(x, y + 2, x, y + 8 + Math.round(hash(k, 9) * 8), 'rgba(190,205,228,0.28)');
    }
  } else if (weather === 'snow') { // snow lying on the top edge
    for (let x = 0; x < w; x++) rect(x, 0, 1, 3 + (hash(Math.floor(x / 2), 10) > 0.6 ? 1 : 0), '#eef2fa');
    rect(0, 3, w, 1, '#d5deee');
  }
}

/** Header box, side tracks and bolts. Painted into a sprite that sits over the door's opening: (ox, oy) is the opening's top-left inside it. */
export function paintFrame(ox: number, oy: number, w: number, h: number) {
  const top = oy - 14;
  rect(ox - 12, top, w + 24, 16, '#5d6166'); rect(ox - 12, top, w + 24, 2, '#767b80'); rect(ox - 12, top + 14, w + 24, 2, '#3f4247'); // header box
  for (let x = ox - 4; x < ox + w + 4; x += 26) { rect(x, top + 6, 3, 3, '#2f3236'); rect(x, top + 6, 1, 1, '#9a9ea3'); }                // screws
  for (const tx of [ox - 5, ox + w + 1]) { // side tracks
    rect(tx, oy, 4, h, '#6b7075'); rect(tx + (tx < ox ? 0 : 3), oy, 1, h, '#8b9096'); rect(tx + (tx < ox ? 3 : 0), oy, 1, h, '#4a4e53');
    for (let y = oy + 10; y < oy + h; y += 22) { rect(tx - (tx < ox ? 1 : 0), y, 5, 3, '#4a4e53'); rect(tx - (tx < ox ? 1 : 0), y, 5, 1, '#8b9096'); }
  }
}

/** Streaks, stains and chips on the plaster around the door. Drawn in garage coordinates over the painted wall. */
export function wallWear(x0: number, y0: number, w: number, h: number) {
  for (let k = 0; k < 16; k++) { // stains running down from the roof lip
    const x = x0 + Math.round(hash(k, 11) * (w - 2)), len = 10 + Math.round(hash(k, 12) * 34);
    for (let j = 0; j < len; j++) if (hash(k * 50 + j, 13) > 0.25) rect(x, y0 + j, 1, 1, '#c3b499');
  }
  for (let k = 0; k < 26; k++) { // dirt near the ground
    const x = x0 + Math.round(hash(k, 14) * w), y = y0 + h - 10 + Math.round(hash(k, 15) * 9);
    rect(x, y, 2 + Math.round(hash(k, 16) * 3), 1, '#b8a88c');
  }
  for (let k = 0; k < 6; k++) { const x = x0 + Math.round(hash(k, 17) * w), y = y0 + 20 + Math.round(hash(k, 18) * (h - 50)); rect(x, y, 3, 2, '#bfae93'); rect(x, y + 2, 3, 1, '#a89882'); } // chipped plaster
}
