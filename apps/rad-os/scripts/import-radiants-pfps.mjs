#!/usr/bin/env node
/**
 * Converts a directory of 32x32 PNG PFPs into a Studio template manifest.
 *
 * Output format — consumed by Studio's template gallery at runtime:
 *   { version, width, height, templates: [{ id, name, pixels }] }
 * where `pixels` is a 2D array (row-major) of hex color strings; "" = transparent.
 *
 * Usage:
 *   pnpm --filter rad-os exec node scripts/import-radiants-pfps.mjs \
 *     --src "/Users/rivermassey/Desktop/rads/export test" \
 *     --out public/templates/radiants.json
 */
import sharp from 'sharp';
import { readdir, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname, basename, dirname } from 'node:path';

const TARGET = 32;

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      args[a.slice(2)] = argv[i + 1];
      i++;
    }
  }
  return args;
}

function toHex(r, g, b) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

/** Snap each channel to the nearest multiple of `step`. Collapses Figma antialiasing edges. */
function snap(v, step) {
  const half = step >> 1;
  const out = Math.min(255, Math.round((v + half) / step) * step - half);
  return Math.max(0, Math.min(255, out));
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function convertFile(file, srcDir, quantizeStep) {
  const { data, info } = await sharp(resolve(srcDir, file))
    .ensureAlpha()
    .resize(TARGET, TARGET, { kernel: 'nearest' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.width !== TARGET || info.height !== TARGET) {
    throw new Error(`${file}: unexpected size ${info.width}x${info.height}`);
  }

  const pixels = [];
  for (let y = 0; y < TARGET; y++) {
    const row = new Array(TARGET);
    for (let x = 0; x < TARGET; x++) {
      const i = (y * TARGET + x) * 4;
      const a = data[i + 3];
      if (a < 128) {
        row[x] = '';
      } else if (quantizeStep > 1) {
        row[x] = toHex(
          snap(data[i], quantizeStep),
          snap(data[i + 1], quantizeStep),
          snap(data[i + 2], quantizeStep),
        );
      } else {
        row[x] = toHex(data[i], data[i + 1], data[i + 2]);
      }
    }
    pixels.push(row);
  }

  const stem = basename(file, extname(file));
  return { id: slugify(stem), name: stem, pixels };
}

async function main() {
  const args = parseArgs(process.argv);
  const src = args.src;
  const outArg = args.out ?? 'public/templates/radiants.json';
  const quantizeStep = args.quantize ? parseInt(args.quantize, 10) : 32;
  if (!src) {
    console.error('Missing --src <dir>');
    process.exit(2);
  }

  const files = (await readdir(src))
    .filter((f) => extname(f).toLowerCase() === '.png')
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

  const templates = [];
  const seen = new Set();
  let skipped = 0;
  for (const file of files) {
    try {
      const t = await convertFile(file, src, quantizeStep);
      if (seen.has(t.id)) {
        let n = 2;
        while (seen.has(`${t.id}-${n}`)) n++;
        t.id = `${t.id}-${n}`;
      }
      seen.add(t.id);
      templates.push(t);
    } catch (err) {
      skipped++;
      console.warn(`skip ${file}: ${err.message}`);
    }
  }

  const manifest = {
    version: 1,
    width: TARGET,
    height: TARGET,
    generatedAt: new Date().toISOString(),
    source: basename(src),
    templates,
  };

  const outPath = resolve(outArg);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(manifest));

  const bytes = JSON.stringify(manifest).length;
  console.log(
    `wrote ${templates.length} templates (${(bytes / 1024).toFixed(1)} KB, ${skipped} skipped) → ${outPath}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
