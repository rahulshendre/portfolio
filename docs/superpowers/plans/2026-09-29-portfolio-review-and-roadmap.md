# Portfolio review and roadmap

Date: 2026-09-29. Scope: the whole site (game, editorial pages, tooling), what to fix, what to add, and which outside tools are worth it.

## 1. What we have

- Astro 5 static site, no UI framework. 17k lines, of which the canvas game is about 5k (TypeScript, Canvas 2D, all art painted in code, all sound synthesised plus one meow mp3).
- Game: arrival door scene, ride, garage with about 15 clickable objects, TV terminal, panels that iframe the editorial pages.
- Editorial pages: builds, open source, PlanetRead, videos, garage, writing, about, resume, and a one-page `/list`.
- 74 unit tests, `check:links` tool, live on Vercel (branch `dev`).

## 2. Measured today

| Check | Result |
| --- | --- |
| Lighthouse, `/list`, production build | Perf 100, A11y 100, Best practices 100, SEO 100 (dev server: perf 57, LCP 12.8 s, so always judge on a build) |
| Lighthouse, `/` (the game), production build | Perf 0. CLS 0.409, no LCP element (a canvas never counts), so the score collapses. Real cause worth fixing: the stage resizes after JS runs |
| Game JS | one 123 KB bundle, nothing else. Fine |
| `dist/` | 888 KB total |
| Canonical, `og:image`, sitemap | all point at `rahulshendre.github.io`, but the live site is on Vercel. Share cards and SEO are broken |
| Visible `TODO` chips in the shipped pages | 7 |
| Notes collection | empty, and the build prints a warning |
| Videos page | "soon", 0 videos. YouTube link empty |
| CI | none |
| Analytics | none |

## 3. Critique

Strong:
- The idea is memorable and the craft is real. Sectional door, worn surfaces, weather, themes, sound, all hand-made. Very few portfolios go this far without a 3D engine.
- Accessibility is unusually good: real links under every hotspot, `/list` fallback, keyboard, reduced motion. Lighthouse A11y 100.
- Content is real and sourced (PipeCD tutorial PRs, GitHub snapshot).

Weak, most serious first:
1. **Proof of work is thin.** Hiring research says the same thing everywhere: three documented, deployed projects with a "why and how" beat polish. Builds are short cards. There are no case studies, no numbers, no "here is the decision I made". The game gets people in the door, the content has to keep them.
2. **Broken metadata.** Wrong domain in canonical, OG and sitemap. Anyone sharing the link gets a wrong or missing preview.
3. **Home page first impression.** Blank dark screen until JS paints, layout shift of 0.41, no loading state, radio autoplay with no obvious mute.
4. **Unfinished markers on the live site.** 7 TODO chips, an empty videos page, an empty writing page. It reads as abandoned.
5. **Two visual systems.** Pixel garage inside, paper and serif pages in the panels. They feel like two sites. Not a bug, but a missed chance.
6. **Render-blocking Google Fonts** (about 1 s on mobile in other people's measurements).
7. **No safety net.** No CI, so a broken push goes live. No analytics, so no idea what visitors click.
8. **Mobile is a second-class citizen.** Portrait gets a button bar and a horizontal scroll world. Needs a real device pass.

## 4. Outside tools: verdicts

| Tool | Verdict | Why |
| --- | --- | --- |
| shadcn/ui, 8bitcn, pixelact-ui | **Skip** | They are React and Tailwind. This site has no React and hand-made CSS. It would add a framework and about 40 KB for a few buttons, and the game is a canvas, so none of it reaches the part people love. Only worth it if we later build a dashboard-style page |
| three.js or react-three-fiber, full rewrite (Bruno Simon style) | **Skip** | It means rewriting 5k lines and losing the hand-painted look. Bruno Simon's brand is 3D; ours is pixel craft. Competing on his ground loses |
| three.js as one small island | **Maybe, phase 4** | A rotating 3D Scrambler on `/garage` (glTF model, `client:visible` so it costs nothing elsewhere). Needs a licensed model |
| Raw WebGL post-process on the existing canvas | **Yes** | One fragment shader (about 150 lines, no library): bloom on the lamp, TV and door light, vignette, day/night grading, CRT curve only inside the terminal. Gives the "3D lighting" feel for almost no cost. Canvas 2D cheap bloom is the fallback |
| PixiJS with normal-map lights | **Skip for now** | Real dynamic lighting on pixel art, but a rewrite of the render layer. Revisit only if the shader pass is not enough |
| Howler.js or Tone.js | **Skip** | Sound is already synthesised. Add a master mute and volume instead |
| GSAP (now free, with SplitText and ScrollTrigger) | **Optional** | Nice for scroll reveals on editorial pages. Not needed for the canvas |
| Native CSS view transitions (`@view-transition`) | **Yes** | Zero JS, 85%+ browser support, smooths page to page navigation |
| Astro Fonts API or Fontsource | **Yes** | Self-host the four fonts, removes the render-blocking request |
| Astro 6 | **Later** | Fonts API, CSP API, faster dev. Needs Node 22. Do it in a calm week |
| Satori and resvg for OG images | **Yes** | Build-time share card per page (builds, notes) instead of one hand-cropped png |
| Vercel Web Analytics and Speed Insights | **Yes** | Two lines, privacy friendly, shows what visitors click |

## 5. Plan

Each phase ships on its own. Ship in order.

### Phase 0: fix what is broken (about 1 day)

- [ ] Set `site` in `astro.config.mjs` to the live domain (Vercel URL now, custom domain later). Rebuild, confirm canonical, `og:image`, sitemap.
- [ ] Hide `Todo` chips in production (render only in dev), and replace the videos and writing "soon" pages with something honest and short.
- [ ] Silence the empty `notes` warning (add one real note, see phase 1).
- [ ] Loading state for `/`: a static garage screenshot as a CSS background on `.viewport`, fade out when the first frame paints. Reserve stage size in CSS so CLS goes to 0.
- [ ] Master sound control: a visible speaker toggle, remembered, default follows the radio choice.
- [ ] Self-host fonts (Fontsource or Astro Fonts API), drop the Google `<link>`.
- [ ] GitHub Actions: `tsc --noEmit`, `vitest run`, `astro build`, `check:links` on every push and PR.
- [ ] Vercel Web Analytics and Speed Insights.
- Done when: Lighthouse `/` perf above 85, CLS below 0.1, share preview shows the right card.

### Phase 1: content that convinces (the highest value, about 1 week)

- [ ] Case study template: problem, what I did, key decision and why, result with a number, link to code. Three to four builds first: PlanetRead subtitle plugins, BookBox React Native app (10k+ downloads), PipeCD v1 tutorial, cloudrun-mvp.
- [ ] PipeCD page: contribution counts and a timeline from `github.json`, plus the KubeCon India booth.
- [ ] Two real notes in `src/content/notes` (for example "what I learned writing the PipeCD plugin tutorial").
- [ ] Make the garage objects point at these case studies, not at cards.
- Done when: a recruiter can read one page per project and know what Rahul decided, not only what he touched.

### Phase 2: make the game feel richer (about 1 to 2 weeks)

- [ ] WebGL post-process pass (bloom, vignette, grading, terminal CRT) behind a feature check, with the current canvas as fallback.
- [ ] Achievements with a save: the ceiling counter already tracks finds, add a small reward at 100 percent (a secret door or a sticker).
- [ ] More life: cat wanders, dust in the sunbeam, TV static on hover, tyre pressure gauge that moves.
- [ ] Theme and weather controls inside the garage, not only at the door.
- [ ] Real phone pass: iOS Safari and Android Chrome, touch targets, landscape lock hint.
- [ ] Give the panels a pixel frame and CRT treatment so the editorial pages feel like part of the garage.

### Phase 3: polish and reach (about 3 days)

- [ ] Satori build-time OG cards.
- [ ] `@view-transition` for the editorial pages.
- [ ] Performance budget check in CI (Lighthouse CI on `/list` and `/`).
- [ ] Upgrade to Astro 6 on Node 22.
- [ ] Custom domain.

### Phase 4: optional 3D moment

- [ ] `/garage` page: a three.js island with a rotating Scrambler, `client:visible`, orbit on drag, reduced-motion respected. Only if a model with a usable licence is found or made.

## 6. Risks

- Post-processing can hurt weak phones. Feature check plus a quality switch, and skip it on low frame rate.
- Content work is the slow part and cannot be automated. It is also where the site earns its value.
- Autoplay policy means the radio stays silent until a gesture. That is expected.

## 7. Sources

- Awwwards portfolio winners: https://www.awwwards.com/websites/winner_category_portfolio/
- Bruno Simon folio 2025 (Three.js, Rapier, Howler, GSAP): https://deepwiki.com/brunosimon/folio-2025
- Three.js with Astro islands: https://threejsresources.com/frameworks/three-js-astro
- Three.js pixelation post-process example: https://threejs.org/examples/webgl_postprocessing_pixel.html
- Cheap bloom for Canvas 2D: https://dev.to/nightdrivelabs/cheap-bloom-for-a-canvas-2d-game-in-8-lines-no-webgl-4jah
- shadcn on Astro: https://ui.shadcn.com/docs/installation/astro
- 8bitcn: https://www.8bitcn.com/ and pixelact-ui: https://github.com/pixelact-ui/pixelact-ui
- Astro 6: https://astro.build/blog/astro-6/
- Astro view transitions: https://docs.astro.build/en/guides/view-transitions/
- Astro fonts: https://docs.astro.build/en/guides/fonts/
- Satori OG images in Astro: https://cai.im/blog/og-images-using-satori/
- GSAP free plugins: https://webflow.com/updates/gsap-becomes-free
- Howler vs Tone: https://www.pkgpulse.com/guides/howler-vs-tone-js-vs-wavesurfer-web-audio-javascript-2026
- What hiring managers check: https://soltech.net/what-do-hiring-managers-actually-look-for-in-a-github-portfolio/
- Accessible canvas games: https://dev.to/oceanviewgames/building-accessible-games-wcag-for-interactive-content-4eim
- Game-style portfolio examples: https://dev.to/mewmewdevart/i-built-a-retro-gamified-portfolio-yes-with-pixel-art-games-windows-95-vibes-589k
