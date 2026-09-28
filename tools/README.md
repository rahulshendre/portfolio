# tools

## snapshot-github.mjs

`pnpm snapshot` rewrites `src/data/github.json` (profile, repos, every PR you authored, merged counts). Needs `gh auth login`.

## pixelate.py

Turns a photo into a pixel sprite. Needs Python 3 and Pillow (`pip3 install pillow`).

The current bike sprites come from Triumph's studio shot of the Scrambler 400 X (Baja Orange, right side), with the orange repainted white and the gold forks kept. The photo itself is not committed (`tools/reference/` is gitignored).

To use a photo of your own bike (side-on, right side facing, plain background works best):

```bash
python3 tools/pixelate.py my-bike.jpg public/sprites/bike-side.png    --width 150 --colors 24 --key-bg --outline
python3 tools/pixelate.py my-bike.jpg public/sprites/bike-side-lg.png --width 240 --colors 28 --key-bg --outline
```

Flags: `--key-bg` drops a plain background, `--flip` mirrors it, `--keep-hue lo:hi --keep-box x0:x1` keeps thin coloured parts vivid (gold forks: `0.088:0.16`, `0.645:0.73`), `--recolor-orange-white` repaints orange paint white.
