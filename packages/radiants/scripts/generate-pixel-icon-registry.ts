import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bitsToMaskURI, bitsToPath } from '../../pixel/src/path.ts';
import { pixelIconRegistry as authoredPixelIconRegistry } from '../../pixel/src/icons/registry.ts';

const GENERATED_FILE_BANNER = `/* AUTO-GENERATED FILE. DO NOT EDIT.
   Authored source: packages/pixel/src/icons/registry.ts
   Materialized by: packages/radiants/scripts/generate-pixel-icon-registry.ts
   Run: node --experimental-strip-types scripts/generate-pixel-icon-registry.ts
*/`;

type AuthoredPixelIcon = (typeof authoredPixelIconRegistry)[number];
type PreparedPixelIcon = AuthoredPixelIcon & {
  readonly path: string;
  readonly maskImage: string;
};

function preparePixelIconRegistry(): readonly PreparedPixelIcon[] {
  return authoredPixelIconRegistry.map((entry) => {
    const path = bitsToPath(entry.bits, entry.width, entry.height);

    return {
      ...entry,
      path,
      maskImage: bitsToMaskURI(path, entry.width, entry.height),
    };
  });
}

function renderEntry(entry: PreparedPixelIcon) {
  return `  {
    name: ${JSON.stringify(entry.name)},
    width: ${entry.width},
    height: ${entry.height},
    bits: ${JSON.stringify(entry.bits)},
    path: ${JSON.stringify(entry.path)},
    maskImage: ${JSON.stringify(entry.maskImage)},
  },`;
}

export function renderPixelIconRegistry() {
  const preparedIcons = preparePixelIconRegistry();
  const lines = [
    GENERATED_FILE_BANNER,
    '',
    "import type { PixelIconEntry, PixelIconName } from './types';",
    '',
    'export const pixelIconRegistry = [',
    ...preparedIcons.map(renderEntry),
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
