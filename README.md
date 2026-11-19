# Vice Sunset — GTA 6-Style Cover Art Maker

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/bilowoabill-spec/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/bilowoabill-spec/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

A web app that turns your photo and a caption into GTA 6-style poster cover
art — the multi-panel poster look, bold caption lettering, and a Vice City
sunset / neon colour grade — and exports it as a PNG to share.

## How it works

1. **Add photos** — up to three, straight from your machine. They are read
   with `FileReader` and never uploaded anywhere. Two sunny sample photos are
   loaded so you can try it immediately.
2. **Pick a layout** — Triptych (one tall panel + two stacked), Four panels
   (2×2 grid), or Hero + strip. One photo can fill several panels, or each
   panel can show a different photo.
3. **Crop and position each panel** — click a panel to select it, then drag
   it in the preview, scroll to zoom, or use the Zoom / Pan X / Pan Y sliders.
4. **Write your caption and tagline** — the caption is set in Anton, a bold
   condensed face, with a retro pink offset shadow and a dark outline.
5. **Choose a grade** — Vice Sunset, Neon Night, or Palm Dusk.
6. **Export** — 1080 × 1080, 1080 × 1350, or 1920 × 1080 PNG, one at a time
   or all three at once.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Static files only, no build step, no network request at runtime. Every
script, image and font is a file under `app/`.

## Originality

All art is drawn by the app itself with canvas primitives: gradient skies, a
sun, a skyline silhouette and the panel grade. The sample photos were drawn
from scratch for this entry. There is no Rockstar Games logo, wordmark,
official artwork, character, or font from any game. The only font is Anton
(SIL Open Font License 1.1), shipped under `app/fonts/` with its license.

## Files

- `app/index.html` — the editor page
- `app/style.css` — the editor theme
- `app/src/main.js` — photo slots, panel controls, preview, export
- `app/src/cover.js` — the poster renderer (layouts, grades, caption)
- `app/fonts/Anton-Regular.ttf` — Anton, OFL 1.1
- `app/samples/` — two original sample photos
- `screenshots/` — the editor at work and covers it exported
- `main.ts` — hands `app/` and `screenshots/` to make.fun

Entry for the make.fun bounty
[gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01).
