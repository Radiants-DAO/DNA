#!/usr/bin/env node
// Copy 32x32 PNG templates into public/templates/radiants/ and emit a manifest.
// Usage: node apps/rad-os/scripts/import-pfp-templates.mjs <source-dir>
//
// Default source: /Users/rivermassey/Desktop/rads/export test
// Output:
//   apps/rad-os/public/templates/radiants/<slug>.png
//   apps/rad-os/public/templates/radiants.json
//
// The manifest shape is consumed by Studio's template picker, which loads each
// PNG on demand via canvas.getImageData and feeds it to Dotting's setData.

import { mkdir, readdir, copyFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RAD_OS_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(RAD_OS_ROOT, 'public/templates/radiants');
const MANIFEST_PATH = path.join(RAD_OS_ROOT, 'public/templates/radiants.json');

const DEFAULT_SRC = '/Users/rivermassey/Desktop/rads/export test';
const TARGET = 32;

function slug(name) {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function prettyName(name) {
  return name.replace(/\.[^.]+$/, '').trim();
}

async function main() {
  const src = process.argv[2] ?? DEFAULT_SRC;
  if (!existsSync(src)) {
    console.error(`Source directory not found: ${src}`);
    process.exit(1);
  }

  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const entries = await readdir(src, { withFileTypes: true });
  const pngs = entries
    .filter((e) => e.isFile() && /\.png$/i.test(e.name))
    .map((e) => e.name)
    .sort();

  const templates = [];
  const usedSlugs = new Set();
  let skipped = 0;

  for (const file of pngs) {
    const abs = path.join(src, file);
    const meta = await sharp(abs).metadata();
    if (meta.width !== TARGET || meta.height !== TARGET) {
      console.warn(
        `skip (wrong size ${meta.width}x${meta.height}): ${file}`,
      );
      skipped += 1;
      continue;
    }

    let base = slug(file);
    if (!base) base = 'template';
    let unique = base;
    let n = 2;
    while (usedSlugs.has(unique)) {
      unique = `${base}-${n++}`;
    }
    usedSlugs.add(unique);

    const outName = `${unique}.png`;
    await copyFile(abs, path.join(OUT_DIR, outName));

    templates.push({
      id: unique,
      name: prettyName(file),
      path: `/templates/radiants/${outName}`,
    });
  }

  const manifest = {
    generated: new Date().toISOString(),
    cols: TARGET,
    rows: TARGET,
    count: templates.length,
    templates,
  };

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');

  console.log(`imported ${templates.length} template(s)`);
  if (skipped) console.log(`skipped ${skipped} non-${TARGET}x${TARGET} file(s)`);
  console.log(`manifest: ${path.relative(RAD_OS_ROOT, MANIFEST_PATH)}`);
  console.log(`assets:   ${path.relative(RAD_OS_ROOT, OUT_DIR)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
