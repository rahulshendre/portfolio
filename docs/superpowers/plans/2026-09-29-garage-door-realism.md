# Garage Door Realism, Radio Default, Cat Meow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat shutter in the arrival scene with a realistic pixel-art sectional steel door (look, frame, motion, sound), make the garage radio play by default, and make the cat meow when petted.

**Architecture:** The door is painted once in code into offscreen sprites (`garagedoor.ts`), cut into panels at draw time and placed by a pure geometry function (`doorlift.ts`) so the motion is unit tested. Sounds extend the existing synthesised `DoorSound`; the radio gets an `autostart()` and a saved preference; the meow is one more synthesised sound in `engine/audio.ts`.

**Tech Stack:** TypeScript, Canvas 2D, Web Audio, Vitest (`npm test`), Astro dev server on port 4399. Spec: `docs/superpowers/specs/2026-09-29-garage-door-realism-design.md`.

**Working branch:** `dev`. Commit after each task. Do not push `main`.

**Screenshots:** Puppeteer needs the installed Chrome. Navigate with `launchOptions: {"headless": true, "executablePath": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}`. The door scene waits on "TAP TO START" unless audio is allowed; headless Chrome allows it, so do not click the canvas (a click skips the arrival).

## File structure

| File | Responsibility |
| --- | --- |
| `src/game/scenes/doorlift.ts` (create) | Pure geometry: where each panel sits for a given lift. No DOM. |
| `src/game/scenes/doorlift.test.ts` (create) | Tests for the geometry. |
| `src/game/scenes/garagedoor.ts` (create) | Painting: door panels, wear, weather on the door, frame, wall wear. |
| `src/game/scenes/door.ts` (modify) | Timeline, draws panels from slots, dust, shadows. |
| `src/game/engine/audio.ts` (modify) | Door lock clunk and panel knocks, `RadioSound.autostart()`, `meow()`, `meowAllowed()`. |
| `src/game/engine/audio.test.ts` (create) | Test the meow rate limit. |
| `src/game/state.ts` (modify) | `radioWanted`, `loadRadio`, `saveRadio`. |
| `src/game/state.test.ts` (modify) | Test `radioWanted`. |
| `src/game/main.ts` (modify) | Radio default at garage entry, save toggle, meow on pet. |

---

### Task 1: Panel geometry (pure, tested)

**Files:**
- Create: `src/game/scenes/doorlift.ts`
- Test: `src/game/scenes/doorlift.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/game/scenes/doorlift.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { panelSlots } from './doorlift';

const H = 176, N = 4;

describe('panelSlots', () => {
  it('closed: the panels tile the whole opening', () => {
    const s = panelSlots(0, N, H);
    expect(s[0].y).toBe(0);
    expect(s.reduce((a, p) => a + p.h, 0)).toBeCloseTo(H);
    s.forEach((p) => expect(p.h).toBeCloseTo(H / N));
  });

  it('fully open: nothing is left in the opening', () => {
    panelSlots(H, N, H).forEach((p) => expect(p.h).toBe(0));
  });

  it('panels stay stacked: each starts where the one above ends', () => {
    for (let up = 0; up <= H; up += 7) {
      const s = panelSlots(up, N, H);
      for (let i = 1; i < N; i++) expect(s[i].y).toBeCloseTo(s[i - 1].y + s[i - 1].h);
    }
  });

  it('a panel is never taller than itself, and shrinks as it tilts onto the curve', () => {
    const s = panelSlots(60, N, H);
    s.forEach((p) => expect(p.h).toBeLessThanOrEqual(H / N + 1e-9));
    expect(s[0].h).toBe(0);
    expect(s[1].h).toBeLessThan(H / N);
  });

  it('the visible height only shrinks as the door rises', () => {
    let prev = Infinity;
    for (let up = 0; up <= H; up += 4) {
      const total = panelSlots(up, N, H).reduce((a, p) => a + p.h, 0);
      expect(total).toBeLessThanOrEqual(prev + 1e-9);
      prev = total;
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/game/scenes/doorlift.test.ts`
Expected: FAIL, cannot resolve `./doorlift`.

- [ ] **Step 3: Write the implementation**

Create `src/game/scenes/doorlift.ts`:

```ts
// Where each panel of a sectional door sits as it rises. Pure geometry, so it can be tested.
// `up` is how far the door has lifted (0 closed, `height` fully open). Y is measured from the top of the opening.
export interface Slot { y: number; h: number }

/** Near the top a panel tilts back onto the track's curve, so it looks shorter: squash the last stretch. */
const squash = (y: number, zone: number) => (y <= 0 ? 0 : y >= zone ? y : zone * Math.pow(y / zone, 1.7));

export function panelSlots(up: number, n: number, height: number): Slot[] {
  const ph = height / n, zone = ph * 0.9;
  return Array.from({ length: n }, (_, i) => {
    const top = squash(i * ph - up, zone), bottom = squash((i + 1) * ph - up, zone);
    return { y: top, h: bottom - top };
  });
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/game/scenes/doorlift.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/game/scenes/doorlift.ts src/game/scenes/doorlift.test.ts
git commit -m "feat(door): pure panel geometry for a sectional door"
```

---

### Task 2: Paint the door, frame and wall wear

**Files:**
- Create: `src/game/scenes/garagedoor.ts`

Everything here runs inside `paint(w, h, () => ...)` from `engine/sprites`, so `rect`, `disc`, `line` draw into the sprite. Deterministic hashes, so the door looks the same every visit.

- [ ] **Step 1: Create the file**

Create `src/game/scenes/garagedoor.ts`:

```ts
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
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: no output (nothing uses the file yet, so only its own types are checked).

- [ ] **Step 3: Commit**

```bash
git add src/game/scenes/garagedoor.ts
git commit -m "feat(door): paint sectional door panels, frame and wall wear"
```

---

### Task 3: Use them in the door scene

**Files:**
- Modify: `src/game/scenes/door.ts`

The door scene keeps its timeline. It swaps the slat loop for `paintDoor`, draws panels from `panelSlots`, draws the frame sprite instead of the two header rects, adds dust and an interior shadow, and wears the wall.

- [ ] **Step 1: Imports and constants**

At the top of `src/game/scenes/door.ts`, next to the `./weather` import, add:

```ts
import { PANELS, paintDoor, paintFrame, wallWear } from './garagedoor';
import { panelSlots } from './doorlift';
```

After the `const DOOR = { x: 110, y: 70, w: 260, h: 176 };` line add:

```ts
const FRAME = { x: DOOR.x - 20, y: DOOR.y - 20, w: DOOR.w + 40, h: DOOR.h + 20 }; // the frame sprite: header, tracks
const frac = (v: number) => v - Math.floor(v);
const hash = (i: number, s = 0) => frac(Math.sin(i * 127.1 + s * 311.7) * 43758.5453);
```

Add a field next to `private doorArt!: Sprite;`:

```ts
private frameArt!: Sprite;
```

- [ ] **Step 2: Paint the sprites in `enter()`**

Replace the whole `this.doorArt = paint(DOOR.w, DOOR.h, () => { ... });` block with:

```ts
    this.doorArt = paint(DOOR.w, DOOR.h, () => {
      paintDoor(DOOR.w, DOOR.h, this.weather);
      text('GIT PUSH >', 14, 16, '#f4f2ea');
      graffitiTag(48, 50, 2);
      for (const [x, y] of [[36, 44], [224, 40], [216, 100]]) { line(x - 3, y, x + 3, y, '#f4f2ea'); line(x, y - 3, x, y + 3, '#f4f2ea'); }
      line(52, 46, 56, 40, C.accent); line(56, 40, 60, 46, C.accent); line(60, 46, 64, 40, C.accent); line(64, 40, 68, 46, C.accent);
      text('MH-12', 200, 150, '#2a2a2e');
      if (this.theme === 'himalaya') this.duskLight(0, 0, DOOR.w, DOOR.h); // the door catches the same dusk as the wall
    });
    this.frameArt = paint(FRAME.w, FRAME.h, () => paintFrame(DOOR.x - FRAME.x, DOOR.y - FRAME.y, DOOR.w, DOOR.h));
```

(The old slat loop, the old bottom bar `rect(DOOR.w / 2 - 12, DOOR.h - 8, 24, 3, '#3a3d42')` and the old cross marks are all replaced by the block above.)

- [ ] **Step 3: Draw panels from the slots**

Add this method to the class, above `draw()`:

```ts
  /** The door as separate panels: each lifts, tilts back onto the track's curve (shorter, darker) and vanishes behind the header. */
  private drawPanels(g: CanvasRenderingContext2D, up: number, shake: number) {
    const slots = panelSlots(up, PANELS, DOOR.h), ph = DOOR.h / PANELS, moving = up > 0 && up < DOOR.h;
    slots.forEach((s, i) => {
      const y0 = DOOR.y + Math.round(s.y) + shake, y1 = DOOR.y + Math.round(s.y + s.h) + shake, h = y1 - y0;
      if (h < 1) return;
      const jx = moving ? Math.round(Math.sin(this.t * 55 + i * 1.9) * (1 - up / DOOR.h)) : 0; // panels rattle in their tracks
      g.drawImage(this.doorArt, 0, i * ph, DOOR.w, ph, DOOR.x + jx, y0, DOOR.w, h);
      if (s.h < ph - 0.5) { g.globalAlpha = 0.55 * (1 - s.h / ph); rect(DOOR.x + jx, y0, DOOR.w, h, '#0d0b10'); g.globalAlpha = 1; } // tilting away from the light
    });
  }

  /** Dust and flecks shaken loose from the header as the door starts to move. */
  private dust(g: CanvasRenderingContext2D) {
    const p = (this.t - T_OPEN) / 1.6;
    if (p <= 0 || p >= 1) return;
    for (let i = 0; i < 26; i++) {
      const x = DOOR.x + Math.round(hash(i, 1) * DOOR.w), y = DOOR.y + Math.round(p * (20 + hash(i, 2) * 70));
      g.globalAlpha = (1 - p) * (0.35 + hash(i, 3) * 0.4);
      rect(x, y, 1, 1, i % 3 ? '#cbbfa8' : '#8a8172');
    }
    g.globalAlpha = 1;
  }
```

- [ ] **Step 4: Swap the old door drawing in `draw()`**

In `draw()`, replace these lines:

```ts
    // the door itself, rolling up into its housing
    g.save(); g.beginPath(); g.rect(DOOR.x, DOOR.y, DOOR.w, DOOR.h); g.clip();
    g.drawImage(this.doorArt, DOOR.x, DOOR.y - up + shake);
    g.restore();
    rect(DOOR.x - 6, DOOR.y - 10, DOOR.w + 12, 12, '#5d6166'); rect(DOOR.x - 6, DOOR.y - 10, DOOR.w + 12, 2, '#767b80');
```

with:

```ts
    // the shadow under the header falls into the room while the door opens
    if (up > 0) for (let r = 0; r < 14; r++) { g.globalAlpha = (1 - r / 14) * 0.5; rect(DOOR.x, DOOR.y + r, DOOR.w, 1, '#0d0a08'); }
    g.globalAlpha = 1;
    // the door: four panels, rising on the tracks
    g.save(); g.beginPath(); g.rect(DOOR.x, DOOR.y, DOOR.w, DOOR.h); g.clip();
    this.drawPanels(g, up, shake);
    this.dust(g);
    g.restore();
    g.drawImage(this.frameArt, FRAME.x, FRAME.y); // header box and tracks sit in front of the door
    rect(DOOR.x - 4, 247, DOOR.w + 8, 2, '#4a4450'); // the threshold
```

- [ ] **Step 5: Longer opening shudder**

Change:

```ts
const shake = this.t > T_SENSE + 0.3 && this.t < T_OPEN ? Math.round(Math.sin(this.t * 90)) : 0;
```

to:

```ts
const shake = this.t > T_SENSE + 0.3 && this.t < T_OPEN + 0.25 ? Math.round(Math.sin(this.t * 90)) : 0; // a jolt as the motor takes load
```

- [ ] **Step 6: Wear the wall**

In `facade()`, right before the line `if (this.theme === 'himalaya') this.duskLight(90, 42, 300, 206);` add:

```ts
    wallWear(90, 46, 300, 200);
```

- [ ] **Step 7: Type check and tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: no type errors; all tests pass.

- [ ] **Step 8: Look at it**

The dev server runs on 4399 (`npx astro dev --port 4399` if it is not running). With Puppeteer (see the header for Chrome launch options):

1. Navigate to `http://localhost:4399/?door&weather=clear`.
2. Evaluate `new Promise(r => setTimeout(() => r('ok'), 4200))` (bike arrived, door closed with sensor green), then screenshot at 1280x800.
3. Repeat with waits of about 6000 ms (door half open) and 8000 ms.
4. Repeat one shot each for `&weather=rain`, `&weather=snow` and `&theme=xp`.

Expected: four visible steel panels with recesses, hinges and grime; the header box and side tracks; panels compress and darken as they pass the top; wall stains. If the door looks flat or a panel edge shows a 1px gap, fix `drawPanels` rounding before moving on.

- [ ] **Step 9: Commit**

```bash
git add src/game/scenes/door.ts
git commit -m "feat(door): sectional panels, frame, dust and wall wear in the arrival"
```

---

### Task 4: Door sound (lock clunk, panel knocks)

**Files:**
- Modify: `src/game/engine/audio.ts` (inside `DoorSound.build`)

- [ ] **Step 1: Add the lock clunk**

In `DoorSound.build`, after the line
`burst(q.sense + 0.35, 0.03, 3000, 0.2, 'highpass');`
add:

```ts
    thunk(q.sense + 0.42, 0.18); burst(q.sense + 0.42, 0.05, 1400, 0.16); // the lock bolt drawing back
```

- [ ] **Step 2: Add a knock as each panel passes a roller**

In `DoorSound.build`, after the line that ends with `// hits the housing`, add:

```ts
    // each panel knocks as it goes over the curve. The lift eases out cubically (see ease() in door.ts), so invert that to time them.
    for (const x of [0.25, 0.5, 0.75]) {
      const s = q.open + q.up * (1 - Math.cbrt(1 - x));
      burst(s, 0.07, 700, 0.14); thunk(s, 0.1);
    }
```

- [ ] **Step 3: Type check and tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: pass. (Headless Chrome has no audio output; the sound is checked by ear in step 4.)

- [ ] **Step 4: Listen**

Open `http://localhost:4399/?door&weather=clear` in a normal browser, tap to start. Expected: two beeps, a clunk, a jolt, motor and rattle, three knocks as panels pass, a final thud. Tell the user to listen; do not claim it sounds right without them.

- [ ] **Step 5: Commit**

```bash
git add src/game/engine/audio.ts
git commit -m "feat(door): lock clunk and panel knocks in the opening sound"
```

---

### Task 5: Radio plays by default

**Files:**
- Modify: `src/game/state.ts`, `src/game/state.test.ts`, `src/game/engine/audio.ts`, `src/game/main.ts`

- [ ] **Step 1: Write the failing test**

In `src/game/state.test.ts`, change the import to include `radioWanted`:

```ts
import { countFound, isNightHour, pickStart, pickWeather, radioWanted } from './state';
```

and append:

```ts
describe('radioWanted', () => {
  it('plays by default', () => expect(radioWanted(null)).toBe(true));
  it('plays if it was left on', () => expect(radioWanted('1')).toBe(true));
  it('stays off only if the visitor turned it off', () => expect(radioWanted('0')).toBe(false));
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/game/state.test.ts`
Expected: FAIL, `radioWanted` is not exported.

- [ ] **Step 3: Implement in `state.ts`**

Add at the end of `src/game/state.ts`:

```ts
// The radio plays by default. Only a visitor turning it off keeps it quiet on later visits.
export const radioWanted = (saved: string | null) => saved !== '0';

export function loadRadio(): boolean {
  try { return radioWanted(localStorage.getItem('rs:radio')); } catch { return true; }
}

export function saveRadio(on: boolean) {
  try { localStorage.setItem('rs:radio', on ? '1' : '0'); } catch { /* fine */ }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/game/state.test.ts`
Expected: PASS.

- [ ] **Step 5: Add `autostart()` to `RadioSound`**

In `src/game/engine/audio.ts`, inside `class RadioSound`, after `toggle()` add:

```ts
  /** Play as soon as the browser allows: now if audio is unlocked, otherwise on the first press or key. */
  autostart() {
    if (this.on) return;
    this.on = true;
    this.start();
    const c = this.ctx!;
    if (c.state === 'running') return;
    const unlock = () => { void c.resume(); removeEventListener('pointerdown', unlock); removeEventListener('keydown', unlock); };
    addEventListener('pointerdown', unlock); addEventListener('keydown', unlock);
  }
```

Also change the comment above the radio from `Off by default.` to `Plays by default (see autostart), unless the visitor turned it off.`

- [ ] **Step 6: Wire it in `main.ts`**

Add `loadRadio` and `saveRadio` to the import from `./state`. In `toggleRadio()`, after `const on = radio.toggle();` add `saveRadio(on);`.

In `garage()`, replace `  scene.radioOn = radio.on;` with:

```ts
  if (loadRadio() && !radio.on) radio.autostart(); // the radio plays unless the visitor turned it off last time
  scene.radioOn = radio.on;
```

- [ ] **Step 7: Type check, tests, browser check**

Run: `npx tsc --noEmit && npx vitest run`
Expected: pass.

Browser check: with Puppeteer `puppeteer_evaluate`, load `http://localhost:4399/?garage&day` and evaluate `document.querySelector('[data-control="radio"]').getAttribute('aria-pressed')`. Expected: `"true"`. Then click the radio control, evaluate `localStorage.getItem('rs:radio')`. Expected: `"0"`. Reload; expected: `aria-pressed` is `"false"`.

- [ ] **Step 8: Commit**

```bash
git add src/game/state.ts src/game/state.test.ts src/game/engine/audio.ts src/game/main.ts
git commit -m "feat(garage): radio plays by default, remembers when turned off"
```

---

### Task 6: Cat meow

**Files:**
- Modify: `src/game/engine/audio.ts`, `src/game/main.ts`
- Test: `src/game/engine/audio.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/game/engine/audio.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { meowAllowed } from './audio';

describe('meowAllowed', () => {
  it('allows the first meow', () => expect(meowAllowed(-Infinity, 0)).toBe(true));
  it('blocks a second meow within 1.5 seconds', () => expect(meowAllowed(10, 11)).toBe(false));
  it('allows another once 1.5 seconds have passed', () => expect(meowAllowed(10, 11.5)).toBe(true));
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/game/engine/audio.test.ts`
Expected: FAIL, `meowAllowed` is not exported.

- [ ] **Step 3: Implement**

Append to `src/game/engine/audio.ts`:

```ts
// The cat's meow: a voiced tone that glides up and back down through a vowel-like band, about half a second.
export const meowAllowed = (last: number, now: number, gap = 1.5) => now - last >= gap;

let meowCtx: AudioContext | undefined;
let lastMeow = -Infinity;

export function meow() {
  const now = performance.now() / 1000;
  if (!meowAllowed(lastMeow, now)) return;
  lastMeow = now;
  try { meowCtx ??= new AudioContext(); } catch { return; }
  const c = meowCtx;
  void c.resume();
  const t = c.currentTime, dur = 0.55;
  const o = c.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(880, t + 0.18); o.frequency.exponentialRampToValueAtTime(560, t + dur);
  const vib = c.createOscillator(), vg = c.createGain(); vib.frequency.value = 7; vg.gain.value = 12; vib.connect(vg).connect(o.frequency);
  const band = c.createBiquadFilter(); band.type = 'bandpass'; band.Q.value = 6;
  band.frequency.setValueAtTime(700, t); band.frequency.linearRampToValueAtTime(1500, t + 0.2); band.frequency.linearRampToValueAtTime(900, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35, t + 0.05); g.gain.setValueAtTime(0.3, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(band).connect(g).connect(c.destination);
  o.start(t); vib.start(t); o.stop(t + dur + 0.05); vib.stop(t + dur + 0.05);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/game/engine/audio.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Wire it in `main.ts`**

Change the audio import to `import { meow, radio } from './engine/audio';` and replace `      else scene.pet();` with:

```ts
      else { scene.pet(); meow(); }
```

- [ ] **Step 6: Type check, tests, listen**

Run: `npx tsc --noEmit && npx vitest run`
Expected: pass. Ask the user to click the cat in a normal browser and say if the meow sounds like a cat. Do not claim it does.

- [ ] **Step 7: Commit**

```bash
git add src/game/engine/audio.ts src/game/engine/audio.test.ts src/game/main.ts
git commit -m "feat(garage): the cat meows when petted"
```

---

### Task 7: Final check

- [ ] **Step 1: Everything green**

Run: `npx tsc --noEmit && npx vitest run && npx astro build`
Expected: no type errors, all tests pass, build completes.

- [ ] **Step 2: Screenshots in each theme and weather**

Puppeteer shots of the door at about 4.2 s, 6 s and 8 s for `himalaya` and `xp`, and at 6 s for `rain` and `snow`. Look for: 1px gaps between panels, text (`GIT PUSH >`, tag) cut oddly by seams, the door showing through the header, snow or rain looking wrong on the panels.

- [ ] **Step 3: Update the README line on the door if it mentions the shutter**

Run: `grep -n -i "shutter\|roller" README.md`
If a line describes the door as a roller shutter, change it to "sectional steel door". If nothing matches, skip.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(door): polish from the final visual check"
```

(Skip if there is nothing to commit.)
