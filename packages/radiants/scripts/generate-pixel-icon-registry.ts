import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bitsToMaskURI, bitsToPath } from '@rdna/pixel';

import { pixelIconSource } from '../pixel-icons/source.ts';

const GENERATED_FILE_BANNER = `/* AUTO-GENERATED FILE. DO NOT EDIT.
   Source: pixel-icons/source.ts + scripts/generate-pixel-icon-registry.ts
   Run: node --experimental-strip-types scripts/generate-pixel-icon-registry.ts
*/`;

function renderEntry(entry: (typeof pixelIconSource)[number]) {
  const maskImage = bitsToMaskURI(
    bitsToPath(entry.bits, entry.width, entry.height),
    entry.width,
    entry.height,
  );

  return `  {
    name: ${JSON.stringify(entry.name)},
    width: ${entry.width},
    height: ${entry.height},
    bits: ${JSON.stringify(entry.bits)},
    maskImage: ${JSON.stringify(maskImage)},
  },`;
}

export function renderPixelIconRegistry() {
  const lines = [
    GENERATED_FILE_BANNER,
    '',
    "import type { PixelIconEntry, PixelIconName } from './types';",
    '',
    'export const pixelIconRegistry = [',
    ...pixelIconSource.map(renderEntry),
    '] as const satisfies readonly PixelIconEntry[];',
    '',
    'const pixelIconByName = new Map<PixelIconName, PixelIconEntry>(',
    '  pixelIconRegistry.map((icon) => [icon.name, icon]),',
    ');',
    '',
    'export function getPixelIcon(name: string): PixelIconEntry | undefined {',
    '  return pixelIconByName.get(name as PixelIconName);',
    '}',
    '',
  ];

  return lines.join('\n');
}

export function writePixelIconRegistry(
  outputPath = resolve(dirname(fileURLToPath(import.meta.url)), '../pixel-icons/registry.ts'),
) {
  const code = renderPixelIconRegistry();
  writeFileSync(outputPath, code);
  return code;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  writePixelIconRegistry();
}
