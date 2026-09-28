# Portfolio: design spec

Date: 2026-09-29. Owner: Rahul Shendre. Status: approved in chat, built overnight, owner reviews in the morning.

## Goal

A personal site that builds Rahul's name in the dev and open source community (not a job-hunting CV). It should show personality, feel like a game, and still make the actual work easy to find and share. Launch pairs with Rahul starting videos and posting on X from October 2026.

## Non-goals

- No 3D driving sandbox. It must never read as a Bruno Simon clone.
- No invented content. Anything unknown ships as a visible TODO.
- No deploy tonight. Local build and local git commits only.

## Experience (home page `/`)

1. **Title card**: "RAHUL SHENDRE" over the road at dawn. Press any key or tap to ride. "SKIP >" always visible.
2. **Ride** (about 25 to 35 s): pseudo-3D pixel road (OutRun / Road Rash technique), internal resolution 480x270 (portrait phones 270x480).
   - Cameras: 1 BEHIND (default), 2 RIDER POV, 3 TOP DOWN. `V` cycles, `1` to `3` pick, camera icon on touch.
   - Steering is optional: left/right keys or tapping screen halves. With no input the bike keeps the left lane and overtakes on its own.
   - Indian road details: black-yellow kerbs, white stone milestones with yellow tops, auto-rickshaws and a painted truck that keep left, reflector posts, poles, chai stalls, Deccan hills, wind farm.
   - Milestones are the story: 2023 first repo, 2025 Sugarizer, 2026 LFX mentee on PipeCD, PipeCD 45 merged PRs.
   - After the last milestone the garage appears at the end of the road and the bike pulls in.
3. **Door**: roller door with the SHENDRE graffiti tag. It rattles and rolls up.
4. **Garage hub**: one pixel-art scene, front view. Every object is a hotspot: hover or focus shows "LOOK AT: ...", click or Enter opens the page.

| Object | Opens |
| --- | --- |
| Big PipeCD logo on the back wall | `/open-source` |
| Sticker-covered toolbox | `/open-source#projects` |
| Polaroid wall and CRT TV | `/videos` |
| Workbench binders | `/writing` |
| Parts shelf with labelled boxes | `/builds` |
| The parked Scrambler 400X | `/garage` |
| Whiteboard | `/about` |
| Clipboard on a nail | `/resume` |
| Radio | X profile (`@shendreee`) |

Returning visitors (localStorage flag) skip straight to the garage. `prefers-reduced-motion` skips the ride and door animation. Without JavaScript the page shows the plain list.

## Content pages

Editorial style: warm paper background, serif headlines, mono for technical details, one accent (highway yellow `#e8b923`, with near-black ink). Small pixel accents only (section icons, the bike sprite on `/garage`). Every page has a pixel "back to garage" link that lands in the hub without replaying the ride.

- `/builds`: projects built (saytask, undark, cricmaths practice mode, BookBox React Native migration, PlanetRead plugins, convex hull visualizer, suspicious activity detector, deepfake detector, and more), each with stack, one line, links.
- `/open-source`: PipeCD first (LFX 2026 mentee, 45 merged PRs, v1 plugin tutorial chapters 1 to 9, v1 plugin docs, v0/v1 examples split, KubeCon India 2026 booth), then KubeStellar, Meshery, Sugar Labs / Sugarizer, antiwork/gumroad, first-contributions. Data snapshot from GitHub on 2026-09-29.
- `/videos`: coming October 2026 (Kubernetes, DevOps, things being learned). Planned topics clearly marked as planned.
- `/garage`: the bike (Triumph Scrambler 400X, white) with pixel sprite, spec sheet, ride log (TODO), gear (TODO).
- `/writing`: docs he wrote (PipeCD plugin tutorial and others, linked to pipecd.dev) plus "notes" collection, empty with a clear note until he posts.
- `/about`: story drafted from real facts, marked DRAFT.
- `/resume`: HTML resume from known facts plus TODOs (education, dates); `resume.pdf` generated from it.
- `/list`: plain list of everything, no JavaScript, doubles as the future "professional page". (Planned as `/index`, renamed because it clashes with the home page.)
- `404`: pixel "wrong turn" page.

## Architecture

- **Astro** static site, TypeScript. Content in `src/content/` collections (markdown and JSON) so Rahul edits files, not code.
- **Game** in `src/game/` as plain TypeScript modules drawn to one `<canvas>`:
  - `engine/` pixel primitives, 3x5 and 5x7 pixel fonts, sprite loading, input, loop
  - `scenes/` title, ride, door, garage (a small scene manager)
  - `ride/` track, road renderer, traffic, cameras
  - `art/` palette and sprite data (PNG sprites in `public/sprites/`)
- **Bike sprite pipeline**: `tools/pixelate.py` (Pillow) turns a photo into a palette-limited pixel sprite. Tonight it runs on a reference photo; Rahul's own photo can replace it.
- **Hotspots** are real `<a>` elements positioned over the canvas, so keyboard, screen readers and middle-click work.

## Quality bar

- Pixel crispness: integer coordinates, no anti-aliasing, nearest-neighbour scaling.
- 60 fps on a mid-range phone; total JS for the game under 60 KB gzip.
- Lighthouse: content pages 95+ on performance and accessibility.
- Tested in headless Chrome at desktop and phone sizes; screenshots committed in `docs/screenshots/`.

## Open items for Rahul

- Photo of his own bike, real rider gear check, ride log and gear list.
- Education and dates for the resume, LinkedIn details.
- Graffiti tag drawn by hand (tonight uses a pixel tag).
- Domain and deploy target.
