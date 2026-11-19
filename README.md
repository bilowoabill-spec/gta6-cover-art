# Vice Sunset — GTA-style Cover Art Maker

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/bilowoabill-spec/gta6-cover-art/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/bilowoabill-spec/gta6-cover-art/reward.svg)](https://make.fun/c/gta6-cover-art-01)

A web app that turns your own photo and a caption into GTA-style poster cover
art — the multi-panel poster look, bold caption lettering, and a Vice City
sunset / neon colour grade — and exports it as a PNG to share.

## What it does

- **Any photo:** upload photo(s) from your machine (read with FileReader, never
  uploaded) or try one of the two built-in sample scenes.
- **Crop & position each photo:** click a panel to select it, drag the photo
  inside it, or use the zoom / pan sliders. Fill several panels with one photo
  or a different photo per panel.
- **Caption:** edit the main caption and sub-caption live; the lettering is set
  in Anton with a sunset gradient fill, dark outline and neon glow.
- **Layouts & grades:** three poster layouts (Quad Grid, Hero Split, Sunset
  Strip) and three colour grades (Vice Sunset, Neon Nights, Golden Hour).
- **Export sizes:** 1080 × 1080, 1080 × 1350 and 1920 × 1080 PNG, one click.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

`app/` is plain static files with no build step and no network request: every
script, font and sample image it loads is a file under `app/`.

## Originality

Everything is original: the layout, the vector sunset art (sun disc, skyline,
palm trees drawn in canvas code) and the sample scenes were made for this
entry. No Rockstar Games logo, wordmark, official artwork, character or font
is used. The display font is Anton, licensed under the SIL Open Font License —
see `app/fonts/OFL.txt`.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with `buildDossier` from `vendor/makefun-app.ts`.

## License

MIT — see [LICENSE](LICENSE).
