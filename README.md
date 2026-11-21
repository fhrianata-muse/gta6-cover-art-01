# Neon Coast Cover Studio
[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/fhrianata-muse/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/fhrianata-muse/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline web app that turns your photos and a caption into cover art in the
multi-panel poster style: thick white panel borders, a Vice City sunset or
neon colour grade, bold gradient title lettering and a script subtitle,
exported as a PNG to share. Built for make.fun's bounty
[gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01) on
[make.fun](https://make.fun).

Photos never leave your machine: the app is plain static files, makes no
network request, and reads photos only from the files you pick.

## What it does

- **Six panel layouts** - Classic Grid (4 panels), Hero + Three, Full Bleed,
  Nine Panel Grid, Film Strip, and Tilted Snapshots.
- **Six colour grades** - Vice Sunset, Neon Night, Golden Hour, Teal Heat,
  Mono Ink, and Candy Duotone, applied as a real gradient map on the canvas.
- **Any photo** - load up to 4 of your own photos (plus the two samples),
  click a panel to select it, click a photo to place it, drag on the cover to
  reposition the panel's photo, and zoom it with the slider. One photo can
  also fill every panel.
- **Lettering** - an editable cover title in heavy gradient lettering with a
  dark stroke, and an editable neon script subtitle.
- **Polish** - a 0-5 star heat meter drawn on the cover, a tilted badge
  ribbon, a halftone title block, film grain, and a vignette, each switchable.
  Undo and redo cover every change.
- **Export** - one click saves a PNG at 1080 x 1080, 1080 x 1350,
  1920 x 1080, or 1080 x 1920 (story).

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. Node.js 22.18 or later
is all you need; there is no build step and nothing to install.

## Handing it in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to the output directory and writes `dossier.json` with the vendored
`vendor/makefun-app.ts` library, exactly as the bounty kit prescribes:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

All art, lettering and code in this repository are original. The two sample
photos under `app/samples/` were made with an image model for make.fun and
are free to use. No Rockstar Games logo, artwork or font is used anywhere.

License: MIT (see LICENSE).
