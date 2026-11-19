# Vice Nights — Cover Art Maker

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/bilowoabill-spec/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/bilowoabill-spec/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An entry for the make.fun bounty [gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01)
("Make GTA 6 Cover Art"): a web app that turns your photo and a caption into
GTA-style poster cover art and exports it as a PNG to share.

## What it does

- **Your photos, on your machine** — upload up to three photos (FileReader, never
  uploaded) or try the two free sample photos.
- **Multi-panel poster look** — three layouts: Sunset Strip (one hero panel over
  two), Neon Grid (2×2) and Hero Shot (full bleed). Fill several panels with one
  photo or several; empty panels become original sunset-skyline art.
- **Crop and position each photo** — click a panel to select it, drag it to pan,
  or use the zoom and offset sliders.
- **Bold caption lettering** — Anton (SIL OFL, vendored under `app/fonts/`) in
  capitals with an outline and shadow, plus a subtitle pill.
- **Vice City sunset / neon colour grades** — Sunset, Neon Nights, Midnight and
  Candy, each re-grading the sky, the photo tint and the lettering.
- **Fast and easy** — a photo to a PNG in a few steps, in the common post sizes
  **1080 × 1080**, **1080 × 1350** and **1920 × 1080**, one at a time or all three
  at once.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

`app/` is plain static files with no build step and no network request at
runtime: every script, font and image it loads is a file under `app/`.

## Original work only

Everything here is original: no Rockstar Games logo, wordmark, official
artwork, character or font file from any game. The display font is
[Anton](https://github.com/googlefonts/AntonFont) by the Anton Project Authors,
licensed under the SIL Open Font License 1.1 (see `app/fonts/OFL.txt`). The
sample photos under `app/samples/` were made for make.fun with an image model
and are free to use.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to `/output` and writes
`/output/dossier.json` with the vendored make.fun library.

## License

MIT — see [LICENSE](LICENSE).
