# Garage door realism, radio by default, cat meow

Date: 2026-09-29. Scope: the arrival (door scene), the radio, the cat.

## Goals

- The garage door in the arrival scene looks and behaves like a real sectional steel door, painted in the game's pixel style.
- The lo-fi radio plays by default in the garage.
- Petting the cat makes her meow.

Non-goals: new image assets, a 3D renderer, changing the Himalaya and Windows XP themes, or the weather system (the door must still respect both).

## 1. Door look

Replaces the flat shutter drawn in `door.ts` (`doorArt`).

- Four horizontal steel panels. Each has a pressed-in rectangular recess with a highlight on the top-left edge and a shadow on the bottom-right.
- Seams between panels are dark lines with visible hinges and side rollers.
- Wear: dirt building toward the bottom, rust streaks under the hinges, a few dents, chipped paint. Baked once into the sprite, using fixed seeds so it looks the same every visit.
- Bottom edge: a black rubber seal.
- The "SHENDRE" tag and the "GIT PUSH >" text stay, painted on the panel surface.
- Lighting: the same dusk tint as the wall in the Himalaya theme, plus a warm highlight from the street lamp on the right. The Windows XP theme stays daylight.
- Weather on the door: rain beads and streaks, a dusting of snow on the top edge, dulling in fog.

## 2. Frame and surroundings

- Header box above the opening, with the track and spring visible.
- Side tracks with brackets on both jambs.
- Door casts a shadow on the wall and the driveway. The shadow shrinks as the door rises and light spills out.
- Wall and lamp wear (stains, chipped plaster) so the wall is not a flat colour.

## 3. Opening motion

Timeline (existing cues stay: `sense`, `arrive`, `open`, `up`, `end`):

1. Sensor turns green. The relay clicks.
2. A short shudder as the motor takes load.
3. Panels rise one after another. Each panel lifts, tilts back onto the curve of the track and disappears behind the header. Motion eases in, runs at speed, and eases out with a small bounce at the top.
4. Warm light spills onto the driveway as the gap grows. Dust and a few flecks fall from the header during the first second.
5. The bike idles in the doorway, as now.

The panel offsets come from one pure function (`panelLift(t, i)`), so the motion can be unit tested.

## 4. Sound

Extend `DoorSound` in `engine/audio.ts`. All synthesised, no files.

- Lock clunk and relay click at `open`.
- Motor hum with pitch rising as it takes load, then steady.
- Rattle: a noise burst at each panel passing a roller.
- A final thud when the door reaches the top.
- The rain, snow and fog sounds already there keep working.

## 5. Radio plays by default

- Entering the garage turns the radio on, unless the visitor turned it off earlier. That choice is saved in `localStorage` under `rs:radio`.
- Browsers block audio until a gesture. If the audio context is still suspended (direct load with `?garage`), the first pointer or key press starts it.
- The radio control still toggles, and its `aria-pressed` and the on-screen speaker animation reflect the real state.
- The tab-visibility pause and resume stays.

## 6. Cat meow

- New `meow()` in `engine/audio.ts`: a short synthesised sound, a pitch glide (about 500 to 900 to 600 Hz) through a formant-like band-pass filter, roughly half a second.
- Played when the cat is petted (the `pet()` path in `main.ts`). Rate-limited to one meow per 1.5 s.
- Respects the same audio unlock rule as the radio.

## Structure

- `src/game/scenes/garagedoor.ts`: door art, frame, shadow, `panelLift`. Keeps `door.ts` from growing.
- `door.ts`: calls into `garagedoor.ts`, owns the timeline.
- `engine/audio.ts`: new door sounds, `meow()`, radio autostart.
- `main.ts`: radio default, cat meow hook.
- `state.ts`: load and save `rs:radio`.

## Testing

- Unit test `panelLift` (monotonic, ends at the top, panels lift in order).
- Unit test the saved radio choice.
- Screenshot check with headless Chrome at the start, mid-open and end of the arrival, in Himalaya and XP themes, and in rain and snow.
- Manual check of the sounds in a browser (headless has none).

## Risks

- Painting in code can slow the first frame. The door art is painted once into a sprite, as `doorArt` is now.
- Autoplay policy may leave the radio silent until the first gesture. That is expected and covered above.
