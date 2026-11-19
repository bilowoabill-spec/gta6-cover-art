# Vice Sunset — GTA 6-Style Cover Art Studio

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/bilowoabill-spec/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/bilowoabill-spec/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

A web app that turns your own photo and a caption into GTA 6-style poster
cover art — multi-panel poster look, bold caption lettering, Vice City
sunset / neon colour grade — and exports it as a PNG to share.

## How it works

1. Upload one or more photos from your machine (or tap a sample photo).
   Photos are read locally with FileReader and never uploaded anywhere.
2. Pick a layout: **Sunset Split**, **Vice Grid**, or **Triptych**.
3. Click a panel to select it, then choose its photo, zoom, and drag it
   into place right on the preview. One button fills every panel with the
   same photo; use different photos per panel for a comic-strip look.
4. Write your caption and subline, pick the caption style, position and
   size, and choose a colour grade (Sunset warm, Neon nights, Palm noir,
   or the original photo).
5. Pick a post size — **1080 × 1080**, **1080 × 1350**, or **1920 × 1080** —
   and download the PNG.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

The app is plain static files under `app/` with no build step and no
network requests at runtime: every script, style, font and image it loads
is a file under `app/` or a `data:` URI.

## Originality

An original design. No Rockstar Games logo, wordmark, official artwork,
character or font file from any game is used. Display type is Anton,
shipped under `app/fonts/` under the SIL Open Font License
(`app/fonts/OFL.txt`).

## Hand-in

`main.ts` copies `app/` and `screenshots/` to the output directory and
writes `dossier.json` via `buildDossier` from `vendor/makefun-app.ts`.
