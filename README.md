# rahulshendre.dev (working title)

Personal site of Rahul Shendre. A pixel-art ride down an Indian highway that ends in a garage full of work.

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm test       # unit tests for the game logic
pnpm build      # static site in dist/
```

Needs Node 20+ (Astro 5). Astro 7 needs Node 22, so upgrade Node before upgrading Astro.

## Where things live

- `src/content/builds/` one markdown file per project. Add a file, it shows up on /builds.
- `src/content/notes/` writing. Copy `_template.md`, drop the underscore.
- `src/data/site.ts` name, links, bike, TODOs.
- `src/data/github.json` GitHub snapshot. Refresh with `pnpm snapshot` (needs `gh auth login`).
- `src/game/` the canvas game: ride, door, garage.
- `tools/pixelate.py` turns a photo into a pixel sprite (see tools/README.md).
