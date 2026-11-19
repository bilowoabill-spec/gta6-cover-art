# Vice Sunset — GTA 6-Style Cover Art Maker

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/bilowoabill-spec/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/bilowoabill-spec/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

A web app that turns your photo and a caption into GTA-style poster cover
art — the multi-panel poster look, bold caption lettering and a Vice City
sunset / neon colour grade — and exports it as a PNG to share. Built for
the make.fun bounty **gta6-cover-art-01** ("Make GTA 6 Cover Art").

## What it does

- **Any photo:** add one or several photos from your own device (FileReader,
  read on your machine, never uploaded). Two free sample photos are bundled
  so you can try it instantly.
- **Crop & position each photo:** click a panel to select it, drag on the
  cover to pan the photo, scroll or use the zoom slider to crop it, or pick
  a different photo for that panel from the dropdown or the thumbnails.
- **Several panels, one photo or several:** four poster layouts — Hero split,
  Triptych, Four panels, Hero + strip — and a one-click "fill every panel
  with the first photo" option.
- **Edit the caption:** title and subtitle, title size slider, drawn in bold
  Anton lettering with a sunset gradient fill over a synthwave sun and palm
  silhouettes (all drawn by the app, original artwork).
- **Colour grades:** Sunset, Neon nights and Noir overlays on every panel.
- **Fast export:** one click exports a PNG in 1080×1080, 1080×1350 or
  1920×1080 — the common post sizes.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Static files only, no build step, no network request at runtime: every
script, style, image and font is a file under `app/` (or a `data:` URI).

## Originality

No Rockstar Games logo, wordmark, official artwork, character or font file
is used anywhere. The only font is **Anton** (SIL Open Font License,
`app/fonts/OFL.txt`), the sun/palms/gradients are drawn in code, and the
sample photos were made with an image model for make.fun and are free to use.

## Layout

- `app/index.html` — editor page
- `app/style.css` — neon sunset styling
- `app/src/cover.js` — the poster renderer (layouts, grades, sun, palms, caption)
- `app/src/main.js` — editor wiring (uploads, panel editing, export)
- `app/fonts/` — Anton + its OFL license
- `app/samples/` — two free sample photos
- `main.ts` — entry program: copies `app/` + `screenshots/` to `/output` and
  writes `/output/dossier.json` with the kit's `buildDossier`
- `screenshots/` — 4 screenshots: exported covers and the editor at work

## License

MIT — see `LICENSE`.
