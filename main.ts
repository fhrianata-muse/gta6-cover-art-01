// Neon Coast Cover Studio, a gta6-cover-art-01 entry (Node 22, standard library only): the app is this
// directory's app/ folder, plain static files a desktop browser loads offline (app/index.html and its ES
// modules, no library and no network request), and this program hands it in. It copies app/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the judge
// reads, with the vendored make.fun library. The app itself is a multi-panel cover maker: six panel
// layouts, six gradient-map colour grades, gradient title lettering with a script subtitle, a star heat
// meter, a badge ribbon, grain and vignette, and one-click PNG exports at 1080 x 1080, 1080 x 1350,
// 1920 x 1080 and 1080 x 1920. Its two sample photos (app/samples/) were made for make.fun with an image
// model and are free to use.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Neon Coast hands in exactly the 4 captures listed in shots.json; refuse early, before the dossier is
// written, when the screenshots folder drifts from the 3-to-4 range the gate accepts.
const handedInShots = readdirSync(join(out, 'screenshots')).filter((name) => !name.startsWith('.'));
if (handedInShots.length < 3 || handedInShots.length > 4) {
  throw new Error(`Neon Coast Cover Studio expects 3 or 4 screenshots, found ${handedInShots.length}`);
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
