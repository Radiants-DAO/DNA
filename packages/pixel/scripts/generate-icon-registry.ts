/**
 * Build-time generator: reads every SVG in `packages/radiants/assets/icons/{16,24}px`,
 * runs it through `convertSvgIconToPixelGrid`, and writes a baked TypeScript registry
 * to `packages/pixel/src/icons/generated-registry.ts`.
 *
 * Per-icon conversion errors are logged and the icon is skipped — a single bad SVG
 * does not fail the build.
 *
 * Run: `pnpm --filter @rdna/pixel generate:icon-registry`
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { convertSvgIconToPixelGrid } from '../dist/icons/convert.js';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(SCRIPT_DIR, '..');
const MONOREPO_ROOT = resolve(PACKAGE_ROOT, '..', '..');
const ICONS_16_DIR = resolve(MONOREPO_ROOT, 'packages/radiants/assets/icons/16px');
const ICONS_24_DIR = resolve(MONOREPO_ROOT, 'packages/radiants/assets/icons/24px');
const OUTPUT_PATH = resolve(PACKAGE_ROOT, 'src/icons/generated-registry.ts');

interface BakedEntry {
  readonly name: string;
  readonly size: 16 | 24;
  readonly width: number;
  readonly height: number;
  readonly bits: string;
  readonly path: string;
  readonly maskImage: string;
}

async function bakeIconSet(iconSet: 16 | 24): Promise<{
  entries: BakedEntry[];
  skipped: { name: string; error: string }[];
}> {
  const directory = iconSet === 16 ? ICONS_16_DIR : ICONS_24_DIR;
  const fileNames = (await readdir(directory))
    .filter((fileName) => fileName.endsWith('.svg'))
    .sort();

  const entries: BakedEntry[] = [];
  const skipped: { name: string; error: string }[] = [];

  for (const fileName of fileNames) {
    const name = fileName.replace(/\.svg$/u, '');
    const sourceSvg = await readFile(resolve(directory, fileName), 'utf8');

    try {
      const converted = convertSvgIconToPixelGrid(name, sourceSvg, {
        size: iconSet,
        iconSet,
        snapStep: 0.5,
      });

      entries.push({
        name,
        size: iconSet,
        width: converted.width,
        height: converted.height,
        bits: converted.bits,
        path: converted.path,
        maskImage: converted.maskImage,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[generate-icon-registry] skipping ${iconSet}px "${name}": ${message}`);
      skipped.push({ name, error: message });
    }
  }

  entries.sort((a, b) => a.name.localeCompare(b.name));
  return { entries, skipped };
}

function renderEntry(entry: BakedEntry): string {
  return `  ${JSON.stringify(entry.name)}: {
    name: ${JSON.stringify(entry.name)},
    size: ${entry.size},
    width: ${entry.width},
    height: ${entry.height},
    bits: ${JSON.stringify(entry.bits)},
    path: ${JSON.stringify(entry.path)},
    maskImage: ${JSON.stringify(entry.maskImage)},
  },`;
}

function renderFile(
  entries16: readonly BakedEntry[],
  entries24: readonly BakedEntry[],
): string {
  const today = new Date().toISOString().slice(0, 10);

  const lines: string[] = [
    '// GENERATED FILE — do not edit.',
    '// Run `pnpm --filter @rdna/pixel generate:icon-registry` to regenerate.',
    '// Source: packages/radiants/assets/icons/{16,24}px',
    '',
    'export interface BitmapIconEntry {',
    '  readonly name: string;',
    '  readonly size: 16 | 24;',
    '  readonly width: number;',
    '  readonly height: number;',
    '  readonly bits: string;',
    '  readonly path: string;',
    '  readonly maskImage: string;',
    '}',
    '',
    'export const BITMAP_ICONS_16: Readonly<Record<string, BitmapIconEntry>> = Object.freeze({',
    ...entries16.map(renderEntry),
    '});',
    '',
    'export const BITMAP_ICONS_24: Readonly<Record<string, BitmapIconEntry>> = Object.freeze({',
    ...entries24.map(renderEntry),
    '});',
    '',
    'export function getBitmapIcon(name: string, size: 16 | 24): BitmapIconEntry | undefined {',
    '  return (size === 24 ? BITMAP_ICONS_24 : BITMAP_ICONS_16)[name];',
    '}',
    '',
    `// ${entries16.length} × 16px, ${entries24.length} × 24px — generated ${today}`,
    '',
  ];

  return lines.join('\n');
}

async function main() {
  const [set16, set24] = await Promise.all([bakeIconSet(16), bakeIconSet(24)]);
  const contents = renderFile(set16.entries, set24.entries);
  await writeFile(OUTPUT_PATH, contents, 'utf8');

  const skippedTotal = set16.skipped.length + set24.skipped.length;
  console.log(
    `[generate-icon-registry] wrote ${OUTPUT_PATH}\n` +
      `  16px: ${set16.entries.length} baked, ${set16.skipped.length} skipped\n` +
      `  24px: ${set24.entries.length} baked, ${set24.skipped.length} skipped\n` +
      `  total skipped: ${skippedTotal}`,
  );
}

main().catch((error) => {
  console.error('[generate-icon-registry] failed:', error);
  process.exit(1);
});
