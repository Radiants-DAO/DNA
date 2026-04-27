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

import { ICON_16_TO_24, ICON_24_TO_16 } from '../icons/size-map.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const ICON_ALIASES: Record<string, string> = {
  check: 'checkmark',
  'checkmark-filled': 'checkmark',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  close: 'close',
  collapse: 'col-horizontal',
  comment: 'comments-blank',
  copied: 'copied-to-clipboard',
  copy: 'copy-to-clipboard',
  cursor: 'cursor2',
  discord: 'discord',
  download: 'download',
  edit: 'pencil',
  expand: 'full-screen',
  eye: 'eye',
  'eye-off': 'eye-hidden',
  folder: 'folder-open',
  globe: 'globe',
  help: 'question',
  home: 'home',
  info: 'info',
  'information-circle': 'info-filled',
  lightning: 'electric',
  menu: 'hamburger',
  pause: 'pause',
  pencil: 'pencil',
  play: 'play',
  plus: 'plus',
  question: 'question',
  queue: 'queue',
  radiant: 'electric',
  refresh: 'refresh1',
  'resize-corner': 'resize-corner',
  save: 'save',
  search: 'search',
  settings: 'settings-cog',
  'text-cursor': 'cursor-text',
  trash: 'trash',
  twitter: 'twitter',
  upload: 'upload',
  warning: 'warning-filled',
  zap: 'electric',
};

type IconVariant = 16 | 24;

interface IconEntry {
  iconName: string;
  importerKey: string;
  svg: string;
  viewBox: string;
  body: string;
}

interface PreparedManifestEntry {
  name: string;
  aliases: string[];
  availableSets: IconVariant[];
  importerKeys: Partial<Record<IconVariant, string>>;
  preferredLargeName?: string;
  preferredSmallName?: string;
}

interface ManifestDraft {
  name: string;
  aliases: Set<string>;
  availableSets: Set<IconVariant>;
  importerKeys: Partial<Record<IconVariant, string>>;
  preferredLargeName?: string;
  preferredSmallName?: string;
}

interface PreparedManifestData {
  aliases: Record<string, string>;
  entries: PreparedManifestEntry[];
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

function fileHash(content: string): string {
  return createHash('sha1').update(content).digest('hex');
}

function renderObjectKey(key: string): string {
  return renderStringLiteral(key);
}

function renderStringLiteral(value: string): string {
  return `'${value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')}'`;
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

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      pruneEmptyDirectories(join(dir, entry.name));
    }
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

function normalizeSvgForInlineComponent(svg: string): string {
  return svg
    .replace(/\sfill=(["'])#000(?:000|001)?\1/gi, ' fill="currentColor"')
    .replace(/\sfill=(["'])black\1/gi, ' fill="currentColor"')
    .trim();
}

function extractViewBox(svg: string, fallbackSize: IconVariant): string {
  return (
    svg.match(/\sviewBox=(["'])(.*?)\1/i)?.[2] ?? `0 0 ${fallbackSize} ${fallbackSize}`
  );
}

function extractSvgBody(svg: string): string {
  return svg
    .replace(/^[\s\S]*?<svg\b[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
    .trim();
}

function readIconEntry(dir: string, file: string, variant: IconVariant): IconEntry {
  const iconName = basename(file, '.svg');
  const svg = normalizeSvgForInlineComponent(readFileSync(join(dir, file), 'utf8'));

  return {
    iconName,
    importerKey: `${variant}px/${iconName}`,
    svg,
    viewBox: extractViewBox(svg, variant),
    body: extractSvgBody(svg),
  };
}

function buildVariantEntries(dir: string, variant: IconVariant): IconEntry[] {
  return listSvgFiles(dir).map((file) => readIconEntry(dir, file, variant));
}

function buildPreparedManifest(
  icons16: IconEntry[],
  icons24: IconEntry[],
): PreparedManifestData {
  const draftByName = new Map<string, ManifestDraft>();
  const draftByLookup = new Map<string, ManifestDraft>();
  const entries16ByName = new Map(icons16.map((entry) => [entry.iconName, entry]));
  const entries24ByName = new Map(icons24.map((entry) => [entry.iconName, entry]));

  function getDraft(name: string): ManifestDraft {
    const existing = draftByName.get(name);
    if (existing) {
      return existing;
    }

    const created: ManifestDraft = {
      name,
      aliases: new Set<string>(),
      availableSets: new Set<IconVariant>(),
      importerKeys: {},
    };
    draftByName.set(name, created);
    return created;
  }

  for (const entry of icons16) {
    const draft = getDraft(entry.iconName);
    draft.availableSets.add(16);
    draft.importerKeys[16] = entry.importerKey;
    draft.preferredSmallName ??= entry.iconName;

    const largeName = ICON_16_TO_24[entry.iconName];
    const largeEntry = largeName ? entries24ByName.get(largeName) : undefined;

    if (largeEntry) {
      draft.availableSets.add(24);
      draft.importerKeys[24] = largeEntry.importerKey;
      draft.preferredLargeName ??= largeEntry.iconName;

      if (largeEntry.iconName !== draft.name) {
        draft.aliases.add(largeEntry.iconName);
      }
    }
  }

  for (const entry of icons24) {
    const smallName = ICON_24_TO_16[entry.iconName];
    const smallEntry = smallName ? entries16ByName.get(smallName) : undefined;

    if (smallEntry) {
      const draft = getDraft(smallEntry.iconName);
      draft.availableSets.add(24);
      draft.importerKeys[24] = entry.importerKey;
      draft.preferredLargeName ??= entry.iconName;

      if (entry.iconName !== draft.name) {
        draft.aliases.add(entry.iconName);
      }

      continue;
    }

    const draft = getDraft(entry.iconName);
    draft.availableSets.add(24);
    draft.importerKeys[24] = entry.importerKey;
    draft.preferredLargeName ??= entry.iconName;
  }

  for (const draft of draftByName.values()) {
    draftByLookup.set(draft.name, draft);

    if (draft.preferredSmallName) {
      draftByLookup.set(draft.preferredSmallName, draft);
    }

    if (draft.preferredLargeName) {
      draftByLookup.set(draft.preferredLargeName, draft);
    }

    for (const alias of draft.aliases) {
      draftByLookup.set(alias, draft);
    }
  }

  const preparedAliases = Object.fromEntries(
    Object.entries(ICON_ALIASES)
      .sort(([left], [right]) => left.localeCompare(right))
      .flatMap(([alias, target]) => {
        const draft = draftByLookup.get(target);

        if (!draft) {
          return [];
        }

        if (alias !== draft.name) {
          draft.aliases.add(alias);
        }
        return [[alias, draft.name] as const];
      }),
  );

  const entries = [...draftByName.values()]
    .map((draft) => ({
      name: draft.name,
      aliases: [...draft.aliases].sort(),
      availableSets: [...draft.availableSets].sort((left, right) => left - right),
      importerKeys: draft.importerKeys,
      preferredLargeName: draft.preferredLargeName,
      preferredSmallName: draft.preferredSmallName,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    aliases: preparedAliases,
    entries,
  };
}

function renderHeader(label: string, count: number, source: string): string {
  return `/**
 * AUTO-GENERATED - DO NOT EDIT
 *
 * Generated by: scripts/generate-icons.ts
 * Source:       ${source} (${count} icons)
 */`;
}

function renderImporterKeys(importerKeys: Partial<Record<IconVariant, string>>): string {
  const entries = ([16, 24] as const)
    .flatMap((variant) => {
      const key = importerKeys[variant];
      return key ? [`${variant}: ${renderStringLiteral(key)}`] : [];
    })
    .join(', ');

  return `{ ${entries} }`;
}

function renderManifestArtifact(data: PreparedManifestData): string {
  const aliasEntries = Object.entries(data.aliases)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([alias, name]) => `  ${renderObjectKey(alias)}: ${renderStringLiteral(name)},`)
    .join('\n');
  const manifestEntries = data.entries
    .map((entry) => {
      const lines = [
        '  {',
        `    name: ${renderStringLiteral(entry.name)},`,
        `    aliases: [${entry.aliases.map(renderStringLiteral).join(', ')}],`,
        `    availableSets: [${entry.availableSets.join(', ')}],`,
        `    importerKeys: ${renderImporterKeys(entry.importerKeys)},`,
      ];

      if (entry.preferredLargeName) {
        lines.push(`    preferredLargeName: ${renderStringLiteral(entry.preferredLargeName)},`);
      }

      if (entry.preferredSmallName) {
        lines.push(`    preferredSmallName: ${renderStringLiteral(entry.preferredSmallName)},`);
      }

      lines.push('  },');
      return lines.join('\n');
    })
    .join('\n');

  return `${renderHeader('manifest.ts', data.entries.length, 'prepared SVG icon manifest')}

import type { IconSet, PreparedSvgIcon } from './types';

export const ICON_ALIASES = {
${aliasEntries}
} as const;

export type IconAliasName = keyof typeof ICON_ALIASES;

export const SVG_ICON_MANIFEST: readonly PreparedSvgIcon[] = [
${manifestEntries}
] as const;

const svgIconManifestByLookup = new Map<string, PreparedSvgIcon>();

for (const icon of SVG_ICON_MANIFEST) {
  svgIconManifestByLookup.set(icon.name, icon);

  for (const alias of icon.aliases) {
    svgIconManifestByLookup.set(alias, icon);
  }

  if (icon.preferredSmallName) {
    svgIconManifestByLookup.set(icon.preferredSmallName, icon);
  }

  if (icon.preferredLargeName) {
    svgIconManifestByLookup.set(icon.preferredLargeName, icon);
  }
}

for (const [alias, target] of Object.entries(ICON_ALIASES)) {
  const icon = svgIconManifestByLookup.get(target);

  if (icon) {
    svgIconManifestByLookup.set(alias, icon);
  }
}

export function getPreparedSvgIcon(name: string): PreparedSvgIcon | undefined {
  return svgIconManifestByLookup.get(name);
}

export function iconSupportsSet(icon: PreparedSvgIcon, iconSet: IconSet): boolean {
  return icon.availableSets.includes(iconSet);
}
`;
}

function renderAliasesArtifact(aliasCount: number): string {
  return `${renderHeader('generated-aliases.ts', aliasCount, 'runtime alias map')}

export { ICON_ALIASES } from './manifest';
export type { IconAliasName } from './manifest';
`;
}

function renderImporterMap(entries: IconEntry[]): string {
  return entries
    .map(
      (entry) =>
        `  ${renderObjectKey(entry.importerKey)}: () => Promise.resolve({ default: createSvgIcon({ name: ${renderStringLiteral(entry.iconName)}, set: ${entry.importerKey.startsWith('16px/') ? 16 : 24}, viewBox: ${renderStringLiteral(entry.viewBox)}, body: ${renderStringLiteral(entry.body)} }) }),`,
    )
    .join('\n');
}

function renderImportersArtifact(icons16: IconEntry[], icons24: IconEntry[]): string {
  return `${renderHeader('generated-importers.ts', icons16.length + icons24.length, 'generated SVG importer maps')}

import { createSvgIcon } from './svg-component';

export const ICON_IMPORTERS = {
${renderImporterMap(icons16)}
} as const;

export const ICON_24_IMPORTERS = {
${renderImporterMap(icons24)}
} as const;

export const SVG_ICON_IMPORTERS = {
  ...ICON_IMPORTERS,
  ...ICON_24_IMPORTERS,
} as const;
`;
}

export async function buildIconArtifacts(
  options: BuildIconArtifactsOptions = {},
): Promise<BuildIconArtifactsResult> {
  const icons16Dir = options.icons16Dir ?? join(ROOT, 'assets', 'icons', '16px');
  const icons24Dir = options.icons24Dir ?? join(ROOT, 'assets', 'icons', '24px');

  const icons16 = buildVariantEntries(icons16Dir, 16);
  const icons24 = buildVariantEntries(icons24Dir, 24);
  const manifest = buildPreparedManifest(icons16, icons24);

  const files: Record<string, string> = {
    'manifest.ts': renderManifestArtifact(manifest),
    'generated-aliases.ts': renderAliasesArtifact(Object.keys(manifest.aliases).length),
    'generated-importers.ts': renderImportersArtifact(icons16, icons24),
  };

  return {
    files,
    icons16,
    icons24,
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

  const removed = pruneGeneratedArtifacts(outputDir, new Set());

  return { written, skipped, removed };
}

export async function main() {
  const result = await writeIconArtifacts(join(ROOT, 'icons'));
  console.log(
    `Generated ${result.written.length} icon artifacts (${result.skipped.length} unchanged, ${result.removed.length} pruned)`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
