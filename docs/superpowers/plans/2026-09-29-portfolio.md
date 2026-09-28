# Portfolio Implementation Plan

> Executed inline in one overnight session (owner asleep, plan pre-approved in chat). Compact form: tasks, files, acceptance checks, one commit per task.

**Goal:** Build Rahul's portfolio: a pixel-art ride that ends in a clickable garage, plus editorial content pages with real data.

**Architecture:** Astro static site. The home page mounts a TypeScript canvas game (scene manager: title, ride, door, garage) with real `<a>` hotspots over the canvas. Content pages are Astro pages fed by content collections and a GitHub data snapshot.

**Tech Stack:** Astro 5, TypeScript, Vitest, Python Pillow (sprite pipeline), headless Chrome (checks, PDF, screenshots).

---

## File structure

```
astro.config.mjs, package.json, tsconfig.json
src/data/site.ts               site facts, links, nav, hotspot targets
src/data/github.json           GitHub snapshot (tools/snapshot-github.mjs)
src/content.config.ts          collections: builds, notes
src/content/builds/*.md        one file per project
src/content/notes/_template.md how to add a note (ignored by loader)
src/layouts/Page.astro         editorial layout, meta, OG, header, footer
src/components/*.astro         BackToGarage, PixelIcon, ProjectCard, Tag
src/styles/global.css          tokens, type, layout
src/pages/index.astro          game shell + hotspot layer + noscript list
src/pages/{builds,open-source,videos,garage,writing,about,resume,list,404}.astro
src/game/main.ts               boot
src/game/engine/{screen,pixel,font,sprites,input,scene}.ts
src/game/ride/{track,project,road,background,traffic,cameras}.ts
src/game/scenes/{title,ride,door,garage}.ts
src/game/art/{palette,sprites}.ts
src/game/{hotspots,state}.ts
src/game/**/*.test.ts          vitest unit tests for pure logic
public/sprites/*.png           bike side, PipeCD logo (pipeline output)
tools/pixelate.py              photo -> palette-limited pixel sprite
tools/snapshot-github.mjs      gh -> src/data/github.json
docs/screenshots/*.png         headless Chrome captures
```

## Tasks

### Task 1: Scaffold
- Files: package.json, astro.config.mjs, tsconfig.json, src/pages/index.astro (stub), README.md
- Check: `pnpm build` succeeds, `pnpm test` runs (0 tests OK).
- Commit: `chore: scaffold astro project`

### Task 2: Data snapshot and site facts
- Files: tools/snapshot-github.mjs, src/data/github.json, src/data/site.ts
- Snapshot: profile, own non-fork repos (name, description, language, pushed_at, stars), PRs by rahulshendre grouped by repo with state and merged flag.
- Check: JSON has `pipe-cd/pipecd` merged count equal to `gh search prs --author rahulshendre --owner pipe-cd --merged` output (45 on 2026-09-29).
- Commit: `feat(data): add github snapshot and site facts`

### Task 3: Editorial layout and content pages
- Files: src/styles/global.css, src/layouts/Page.astro, src/components/*, src/content.config.ts, src/content/builds/*.md, all pages except index.
- Rules: only real facts; unknowns render as a visible `TODO` badge; About marked DRAFT.
- Check: `pnpm build` passes; every page reachable from `/list`; no broken internal links (script greps dist for hrefs and checks files exist).
- Commit: `feat(pages): add editorial content pages`

### Task 4: Game engine core (TDD)
- Files: src/game/engine/*.ts with tests.
- Tests: `textW` widths, glyph coverage for every character used in game strings, `trap` row count, `screenSize` picks 480x270 landscape and 270x480 portrait with integer scale when >= 3.
- Commit: `feat(game): add pixel engine core`

### Task 5: Ride at 480x270 (TDD for pure parts)
- Files: src/game/ride/*.ts, src/game/art/{palette,sprites}.ts, src/game/scenes/ride.ts
- Port v3 demo: crisp primitives, dithered sky, hills, windmills, clouds, posts, poles, trees, stalls, traffic keeps left, auto-overtake when idle, milestones, cameras BEHIND / POV / TOP.
- New art at 2x detail: rider rear (black helmet, dark jacket, white 400X), top view, POV dash (round speedo, handguards).
- Tests: track loops seamlessly (segment N-1 y2 equals segment 0 y1), milestone order, `project` puts z at camera depth on the horizon line, traffic gap logic.
- Check: headless screenshot of each camera, no console errors.
- Commit: `feat(ride): port pixel ride to 480x270`

### Task 6: Bike sprite pipeline
- Files: tools/pixelate.py, public/sprites/bike-side.png, tools/README note.
- Find a white Scrambler 400X side-profile reference, remove background, downscale, palette-limit, outline, export.
- Check: PNG exists, width about 120 px, transparent background, readable as the bike in a screenshot.
- Commit: `feat(art): add scrambler 400x pixel sprite pipeline`

### Task 7: Title, door and garage scenes
- Files: src/game/scenes/{title,door,garage}.ts, src/game/hotspots.ts, src/game/state.ts, src/game/main.ts, src/pages/index.astro
- Garage: back wall with PipeCD logo, polaroid wall and CRT TV, workbench binders, parts shelf, sticker toolbox, whiteboard, clipboard, radio, bike parked centre.
- Hotspots: `<a>` elements positioned from scene rects, label "LOOK AT: X" on hover and focus, keyboard order.
- Flow: title -> ride -> garage appears at end of track -> door -> garage. Visited flag skips to garage; reduced motion skips animation; `?ride` forces the ride.
- Tests: hotspot rect to CSS percentage conversion; flow picks garage when visited.
- Commit: `feat(game): add title, door and garage scenes`

### Task 8: SEO, polish, PDF, OG image
- Files: Page.astro meta, public/favicon.svg, public/og.png, public/resume.pdf, src/pages/404.astro, robots.txt
- Check: every page has title, description, og tags; resume.pdf opens.
- Commit: `feat: add seo, og image, favicon and resume pdf`

### Task 9: Verify
- Run tests and build; headless Chrome captures at 1280x720 and 390x844 for home (each scene) and every page, saved to docs/screenshots.
- Fix anything broken; write MORNING-REPORT.md (done, TODO, needs Rahul).
- Commit: `test: add screenshots and morning report`
