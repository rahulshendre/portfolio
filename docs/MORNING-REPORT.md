# Morning report (29 Sep 2026)

Good morning. The site is built, runs locally, and every step is committed on `main`. Nothing was pushed or deployed.

```bash
pnpm install && pnpm dev     # http://localhost:4321
```

Screenshots of every scene and a few pages are in `docs/screenshots/`.

## Refinement pass (29 Sep, later)

Focus was the landing page (the game). What changed and why:

- **Bike**: sprite now matches the real Pearl Metallic White / Phantom Black colourway (pearl tank, black diagonal stripe, gold forks, brown seat), made from Triumph's studio shot with `--stripe-black`.
- **Rider**: white helmet everywhere, and Rahul now rides the bike into the door scene.
- **Road as a story, in chapters**:
  - Pune outskirts: pastel houses with black rooftop water tanks, MEDICAL / KIRANA / XEROX shops, a chai stall.
  - Open highway: cows on the verge, wind farm, a vada pav stall.
  - Sahyadri ghats: stepped basalt cliffs, waterfalls, mist, black-yellow parapets, a monkey, a "GHAT SECTION" sign.
  - Tunnel: portal in the hillside, dark walls, ceiling lights, bright exit.
  - Plateau: the garage at the end.
- **Hoardings**: PipeCD, GitHub, YouTube, X and LinkedIn billboards along the way, with pixel logos made from the official shapes.
- **Traffic**: auto-rickshaws, a painted truck, an MSRTC ST bus and a hatchback. All keep left; the autopilot overtakes.
- **Light and sky**: afternoon slides into dusk, so you arrive at sunset, matching the door scene. Flat-topped mesas sit in hazy layers, and hills grow taller on phones.
- **HUD**: a progress bar with milestones, the tunnel stretch and the garage, plus the current chapter's name. Name and odometer sit in pills.
- **Sound**: optional synthesised single-cylinder engine (`M`), off by default.
- **Garage**:
  - Dithered lighting from two tube lights, spots on the PipeCD sign, a floor pool and a vignette.
  - A floor with perspective, shadows, and a neon RAHUL'S GARAGE sign.
  - Enamel signs for YouTube, Twitter, LinkedIn and GitHub, all links. YouTube points to /videos until the channel URL is added in `src/data/site.ts`.
  - Radio and polaroids removed to declutter.
- **Door**: dusk mesas, a streetlight, a street dog whose tail wags when you arrive, and the real lit garage showing through as the door rises.

## What you get

1. **Title card**: your name and tagline over the highway. Press any key or tap to ride.
2. **The ride** (about 20 seconds, skippable):
   - 480x270 pixel art. Cameras: behind, rider POV and top-down (`V` or `1` to `3`, or tap the camera icon).
   - Autopilot keeps left and overtakes an auto-rickshaw and two "HORN OK PLEASE" trucks. Steer yourself with the arrow keys or by tapping the screen halves.
   - Milestones along the way: 2023 first repo, 2025 Sugarizer, 2026 LFX · PipeCD, PipeCD 45 merged.
3. **Arriving**: the garage appears on the left, then the SHENDRE-tagged roller door rattles open onto the real garage.
4. **The garage**: every object is a real link (keyboard and screen-reader friendly):

   | Object | Goes to |
   | --- | --- |
   | PipeCD sign | Open Source |
   | Bike | Garage page |
   | TV and polaroids | Videos |
   | Binders | Writing |
   | Parts shelf | Builds |
   | Toolbox stickers | Other projects |
   | Whiteboard, coffee | About |
   | Pegboard | Stack |
   | Calendar | PR log |
   | Clipboard | Resume |
   | Radio | X |

   Returning visitors land straight in the garage. `/?ride` forces the ride. Reduced-motion users skip it.
5. **Pages**: Builds, Open Source, Videos, Garage, Writing, About, Resume (with a generated `resume.pdf`), a plain `/list` page (your future professional page) and a 404. Night mode follows the system setting.
6. **Real data only**: GitHub snapshot in `src/data/github.json` (refresh with `pnpm snapshot`). Unknowns show an orange TODO badge.
7. **Your bike**: `tools/pixelate.py` turned Triumph's studio shot into the pixel Scrambler 400X (orange repainted white, gold forks kept). The press photo itself is not committed.

## Needs you

- **Your own bike photo**: one command replaces the sprite (see `tools/README.md`).
- **Rider gear**: confirm black helmet and dark jacket.
- **About page**: marked DRAFT. Please rewrite it in your voice.
- **Resume**: PlanetRead and Cricmaths dates, education, LinkedIn details. Regenerate the PDF afterwards (print `/resume` to `public/resume.pdf`).
- **Garage page**: ride log and gear list.
- **Domain**: `astro.config.mjs` uses `https://rahulshendre.github.io` as a placeholder. Share previews (og.png) need the real one.
- **Graffiti tag**: a hand-drawn tag of yours would beat the pixel font one.
- **Deploy target**: GitHub Pages, Vercel or Cloudflare Pages. Say which and I'll wire it up.

## Calls I made on my own (easy to change)

- **Astro 5 instead of 7**: Astro 7 needs Node 22 and your Mac has Node 20. I didn't touch your system Node.
- **Tagline** "I write the docs that ship the deploys." came from the first mockup you liked. It's in `src/data/site.ts`.
- **"45 merged across PipeCD"** counts the whole pipe-cd org (44 in pipecd plus 1 in examples). "Merged PRs to open source" excludes your own repos.
- **Whiteboard** says NOW: LEARNING K8S / VIDEOS: OCT / PIPECD V1.
- **Logos**: the PipeCD logo on the wall is the official one from the pipe-cd repo, pixelated. Toolbox stickers are abstract shapes, not real logos.
- **Plain page at `/list`**, not `/index`, because `/index` clashes with the home page.
- **Ride length**: about 20 seconds, so the title says "QUICK RIDE", not "30 second ride".

## Verified

- `pnpm test`: 30 unit tests pass (track, projection, traffic and overtaking, pixel font coverage, hotspots reach every section, start logic, GitHub helpers).
- `pnpm build` passes. `node tools/check-links.mjs` finds no broken internal links. `tsc --noEmit` is clean.
- Game JS is 19.5 KB gzipped.
- Checked in headless Chrome at 1280x720 and 390x844: all three cameras, the full ride through door into garage, hover labels, and the phone layout (garage scrolls sideways, starts centred on the bike).
- **Not tested**: Safari, Firefox, or a real phone. Touch-only behaviour (always-visible tags, tap to steer) was checked in code, not on a device.

## Ideas for next

Visitors spray their name on the garage wall (guestbook), day and night by visitor time, sound toggle, a GitHub Action that refreshes the snapshot weekly, video entries on the TV once you post.
