// Vice Sunset — the entry program for gta6-cover-art-01 (Node 22, stdlib only).
//
// The app itself is plain static files under app/ (index.html plus its ES
// modules, styles, the Anton font and sample photos) that any static server
// can serve offline. This program hands it in: it copies app/ and
// screenshots/ from this repository into the output directory and writes
// /output/dossier.json with buildDossier from the kit's vendored library
// (vendor/makefun-app.ts, unchanged). Outside the grader, the environment
// variable MAKEFUN_OUTPUT_DIR stands in for /output, so a local check is:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Both runs must write identical bytes, so nothing here depends on the
// clock, on randomness, or on the order the filesystem happens to list
// files in — buildDossier already walks the trees deterministically.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// Directory this file lives in: the repository root.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
// The grader gives us /output; local runs use MAKEFUN_OUTPUT_DIR instead.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

const shotsDir = join(outputDir, 'screenshots');
mkdirSync(shotsDir, { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), shotsDir, { recursive: true });
}

// The caps mirror the scorer's gate: only text_max_bytes changes the
// dossier bytes; the rest make this program fail exactly where the scorer
// would refuse the entry (too many screenshots, one too big, app/ too big
// or too many files, or a path too long).
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});

writeFileSync(join(outputDir, 'dossier.json'), dossier);
