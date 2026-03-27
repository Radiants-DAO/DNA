#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { transform } from '@svgr/core';
import { optimize, type Config as SvgoConfig } from 'svgo';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const NAME_OVERRIDES: Record<string, string> = {
  'grid-3x3': 'Grid3X3',
  cd: 'Cd',
  tv: 'Tv',
  usb: 'Usb',
  USDC: 'USDC',
};

const ICON_ALIASES: Record<string, string> = {
  refresh: 'refresh1',
  settings: 'settings-cog',
  lightning: 'electric',
  'information-circle': 'info-filled',
  expand: 'full-screen',
  collapse: 'minus',
  'checkmark-filled': 'checkmark',
  close: 'close',
  check: 'checkmark',
  copy: 'copy-to-clipboard',
  copied: 'copied-to-clipboard',
  trash: 'trash',
  comment: 'comments-blank',
  question: 'question',
  help: 'question',
  cursor: 'cursor2',
  'text-cursor': 'cursor-text',
  pencil: 'pencil',
  edit: 'pencil',
  eye: 'eye',
  'eye-off': 'eye-hidden',
  folder: 'folder-open',
  plus: 'plus',
  minus: 'minus',
  play: 'play',
  pause: 'pause',
  search: 'search',
  download: 'download',
  upload: 'upload',
  save: 'save',
  warning: 'warning-filled',
  info: 'info',
  globe: 'globe',
  home: 'home',
  menu: 'hamburger',
  radiant: 'electric',
  zap: 'electric',
  twitter: 'twitter',
  discord: 'discord',
  'radiants-logo': 'radiants-logo',
  radmark: 'radiants-logo',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  'fill-bucket': 'fill-bucket',
  queue: 'queue',
  'resize-corner': 'resize-corner',
};

const SVGO_CONFIG: SvgoConfig = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupNumericValues: false,
          convertPathData: false,
          removeUselessStrokeAndFill: false,
          convertColors: {
            currentColor: true,
          },
        },
      },
    },
    {
      name: 'prefixIds',
      params: {
        prefixClassNames: false,
      },
    },
  ],
};

type IconVariant = 16 | 24;

interface IconEntry {
  componentName: string;
  fileName: string;
  iconName: string;
  modulePath: string;
}

export interface BuildIconArtifactsOptions {
  icons16Dir?: string;
  icons24Dir?: string;
}

export interface BuildIconArtifactsResult {
  files: Record<string, string>;
  icons16: IconEntry[];
  icons24: IconEntry[];
}

export interface WriteIconArtifactsResult {
  written: string[];
  skipped: string[];
  removed: string[];
}

function toPascalCase(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function componentName(stem: string): string {
  return NAME_OVERRIDES[stem] ?? toPascalCase(stem);
}

function fileHash(content: string): string {
  return createHash('sha1').update(content).digest('hex');
}

function renderObjectKey(key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? key : `'${key}'`;
}

function listSvgFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith('.svg'))
    .sort();
}

function listFilesRecursive(dir: string, prefix = ''): string[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      return listFilesRecursive(fullPath, relativePath);
    }

    return [relativePath];
  });
}

function pruneEmptyDirectories(dir: string): boolean {
  if (!existsSync(dir)) return true;

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    pruneEmptyDirectories(join(dir, entry.name));
  }

  if (readdirSync(dir).length === 0) {
    rmSync(dir, { recursive: true, force: true });
    return true;
  }

  return false;
}

function pruneGeneratedArtifacts(
  outputDir: string,
  expectedFiles: ReadonlySet<string>,
): string[] {
  const generatedRoot = join(outputDir, 'generated');

  if (!existsSync(generatedRoot)) {
    return [];
  }

  const removed: string[] = [];

  for (const relativePath of listFilesRecursive(generatedRoot, 'generated')) {
    if (expectedFiles.has(relativePath)) {
      continue;
    }

    rmSync(join(outputDir, relativePath), { force: true });
    removed.push(relativePath);
  }

  pruneEmptyDirectories(generatedRoot);

  return removed.sort();
}

function optimizeSvg(svg: string, pathHint: string): string {
  const result = optimize(svg, {
    path: pathHint,
    ...SVGO_CONFIG,
  });

  if ('data' in result) {
    return result.data;
  }

  throw new Error(`Failed to optimize SVG: ${pathHint}`);
}

async function buildComponentModule(
  svgPath: string,
  iconName: string,
  size: IconVariant,
): Promise<string> {
  const rawSvg = readFileSync(svgPath, 'utf8');
  const optimizedSvg = optimizeSvg(rawSvg, svgPath);
  const component = componentName(iconName);

  let code = await transform(
    optimizedSvg,
    {
      plugins: ['@svgr/plugin-jsx'],
      typescript: true,
      dimensions: false,
      expandProps: 'end',
      prettier: false,
      svgProps: {
        fill: 'currentColor',
      },
      replaceAttrValues: {
        '#000': 'currentColor',
        '#000000': 'currentColor',
        '#000001': 'currentColor',
        black: 'currentColor',
      },
    },
    { componentName: component },
  );

  code = code
    .replace(/^import \* as React from ['"]react['"];\n?/m, '')
    .replace(
      /^import type \{ SVGProps \} from ['"]react['"];\n?/m,
      "import type { IconProps } from '../../types';\n",
    )
    .replace(
      new RegExp(
        `const ${component} = \\(props: SVGProps<SVGSVGElement>\\) =>\\s*<svg`,
      ),
      `export const ${component} = ({ size = ${size}, className = '', ...props }: IconProps) => <svg`,
    )
    .replace('<svg ', '<svg width={size} height={size} className={className} ')
    .replace(`export default ${component};`, `${component}.displayName = '${component}';\n\nexport default ${component};`);

  return code.trimEnd() + '\n';
}

function renderHeader(label: string, count: number, dir: string): string {
  return `/**
 * AUTO-GENERATED — DO NOT EDIT
 *
 * Generated by: scripts/generate-icons.ts
 * Source:       ${dir} (${count} icons)
 *
 * To regenerate: pnpm generate:icons
 */`;
}

function renderLookupBarrel(
  fileName: string,
  entries: IconEntry[],
  opts: {
    namesConst: string;
    typeName: string;
    lookupName: string;
    dirLabel: string;
  },
): string {
  const exportLines = entries
    .map((entry) => `export { ${entry.componentName} } from '${entry.modulePath}';`)
    .join('\n');
  const importLines = entries
    .map((entry) => `import { ${entry.componentName} } from '${entry.modulePath}';`)
    .join('\n');
  const names = entries.map((entry) => entry.iconName);
  const lookups = entries
    .map((entry) => `  '${entry.iconName}': ${entry.componentName},`)
    .join('\n');

  return `${renderHeader(fileName, entries.length, opts.dirLabel)}

import type { ReactElement } from 'react';
import type { IconProps } from './types';

${exportLines}
${entries.length ? '\n' : ''}${importLines}

export const ${opts.namesConst} = ${JSON.stringify(names, null, 2)} as const;

export type ${opts.typeName} = (typeof ${opts.namesConst})[number];

export const ${opts.lookupName}: Record<string, (props: IconProps) => ReactElement> = {
${lookups}
};
`;
}

function renderAliasesArtifact(): string {
  const entries = Object.entries(ICON_ALIASES)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([alias, name]) => `  ${renderObjectKey(alias)}: '${name}',`)
    .join('\n');

  return `${renderHeader('generated-aliases.ts', Object.keys(ICON_ALIASES).length, 'runtime alias map')}

export const ICON_ALIASES = {
${entries}
} as const;

export type IconAliasName = keyof typeof ICON_ALIASES;
`;
}

function renderImportersArtifact(icons16: IconEntry[], icons24: IconEntry[]): string {
  const map16 = icons16
    .map(
      (entry) =>
        `  ${renderObjectKey(entry.iconName)}: () => import('${entry.modulePath}'),`,
    )
    .join('\n');
  const map24 = icons24
    .map(
      (entry) =>
        `  ${renderObjectKey(entry.iconName)}: () => import('${entry.modulePath}'),`,
    )
    .join('\n');

  return `${renderHeader('generated-importers.ts', icons16.length + icons24.length, 'generated dynamic import maps')}

export const ICON_IMPORTERS = {
${map16}
} as const;

export const ICON_24_IMPORTERS = {
${map24}
} as const;
`;
}

async function buildVariantEntries(
  dir: string,
  variant: IconVariant,
): Promise<{ entries: IconEntry[]; files: Record<string, string> }> {
  const files: Record<string, string> = {};
  const entries: IconEntry[] = [];
  const variantDir = variant === 16 ? 'generated/16' : 'generated/24';

  for (const file of listSvgFiles(dir)) {
    const iconName = basename(file, '.svg');
    const component = componentName(iconName);
    const relativeFile = `${variantDir}/${iconName}.tsx`;
    const modulePath = `./${variantDir}/${iconName}`;

    files[relativeFile] = await buildComponentModule(join(dir, file), iconName, variant);
    entries.push({
      componentName: component,
      fileName: relativeFile,
      iconName,
      modulePath,
    });
  }

  return { entries, files };
}

export async function buildIconArtifacts(
  options: BuildIconArtifactsOptions = {},
): Promise<BuildIconArtifactsResult> {
  const icons16Dir = options.icons16Dir ?? join(ROOT, 'assets', 'icons', '16px');
  const icons24Dir = options.icons24Dir ?? join(ROOT, 'assets', 'icons', '24px');

  const built16 = await buildVariantEntries(icons16Dir, 16);
  const built24 = await buildVariantEntries(icons24Dir, 24);

  const files: Record<string, string> = {
    ...built16.files,
    ...built24.files,
    'generated.tsx': renderLookupBarrel('generated.tsx', built16.entries, {
      namesConst: 'GENERATED_ICON_NAMES',
      typeName: 'GeneratedIconName',
      lookupName: 'ICON_BY_NAME',
      dirLabel: 'assets/icons/16px/*.svg',
    }),
    'generated-24.tsx': renderLookupBarrel('generated-24.tsx', built24.entries, {
      namesConst: 'GENERATED_24_ICON_NAMES',
      typeName: 'Generated24IconName',
      lookupName: 'ICON_24_BY_NAME',
      dirLabel: 'assets/icons/24px/*.svg',
    }),
    'generated-aliases.ts': renderAliasesArtifact(),
    'generated-importers.ts': renderImportersArtifact(
      built16.entries,
      built24.entries,
    ),
  };

  return {
    files,
    icons16: built16.entries,
    icons24: built24.entries,
  };
}

export async function writeIconArtifacts(
  outputDir: string,
  options: BuildIconArtifactsOptions = {},
): Promise<WriteIconArtifactsResult> {
  const { files } = await buildIconArtifacts(options);
  const written: string[] = [];
  const skipped: string[] = [];

  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = join(outputDir, relativePath);
    const current = existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : null;

    if (current && fileHash(current) === fileHash(content)) {
      skipped.push(relativePath);
      continue;
    }

    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content, 'utf8');
    written.push(relativePath);
  }

  const removed = pruneGeneratedArtifacts(
    outputDir,
    new Set(Object.keys(files).filter((relativePath) => relativePath.startsWith('generated/'))),
  );

  return { written, skipped, removed };
}

export async function main() {
  const result = await writeIconArtifacts(join(ROOT, 'icons'));
  console.log(
    `Generated ${result.written.length} icon artifacts (${result.skipped.length} unchanged, ${result.removed.length} pruned)`,
  );
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  await main();
}
