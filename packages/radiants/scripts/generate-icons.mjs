#!/usr/bin/env node

/**
 * generate-icons.mjs
 *
 * Reads SVGs from assets/icons/16px/ and assets/icons/24px/ and generates:
 * - icons/generated.tsx — inline React components (16px set)
 * - icons/generated-24.tsx — inline React components (24px set)
 *
 * Usage:  node scripts/generate-icons.mjs
 * Output: icons/generated.tsx, icons/generated-24.tsx
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ICONS_16_DIR = join(ROOT, 'assets', 'icons', '16px');
const ICONS_24_DIR = join(ROOT, 'assets', 'icons', '24px');
const OUTPUT_16 = join(ROOT, 'icons', 'generated.tsx');
const OUTPUT_24 = join(ROOT, 'icons', 'generated-24.tsx');

// --------------------------------------------------------------------------
// Name overrides: kebab-case filename → exact PascalCase export
// --------------------------------------------------------------------------
const NAME_OVERRIDES = {
  'grid-3x3': 'Grid3X3',
  cd: 'Cd',
  tv: 'Tv',
  usb: 'Usb',
  USDC: 'USDC',
};

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

/** Convert kebab-case to PascalCase: "bar-chart" → "BarChart" */
function toPascalCase(str) {
  return str
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

/** Get the component name for a file */
function componentName(stem) {
  return NAME_OVERRIDES[stem] ?? toPascalCase(stem);
}

/** HTML attribute → JSX attribute */
const ATTR_MAP = {
  'fill-rule': 'fillRule',
  'clip-rule': 'clipRule',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'font-size': 'fontSize',
  'font-family': 'fontFamily',
  'text-anchor': 'textAnchor',
  'dominant-baseline': 'dominantBaseline',
  class: 'className',
};

function htmlAttrsToJsx(str) {
  for (const [html, jsx] of Object.entries(ATTR_MAP)) {
    str = str.replaceAll(html, jsx);
  }
  return str;
}

/** Extract viewBox from <svg> tag */
function extractViewBox(svg, defaultSize = 16) {
  const match = svg.match(/viewBox="([^"]+)"/);
  return match ? match[1] : `0 0 ${defaultSize} ${defaultSize}`;
}

/** Extract inner content between <svg ...> and </svg> */
function extractInner(svg) {
  const svgOpen = svg.indexOf('<svg');
  if (svgOpen === -1) return '';
  const afterOpen = svg.indexOf('>', svgOpen) + 1;
  const close = svg.lastIndexOf('</svg>');
  if (close === -1) return '';
  return svg.slice(afterOpen, close).trim();
}

/**
 * Process SVG inner content: strip wrapper <g> groups (id-only groups
 * like <g id="icon-name"> that are just organizational), replace
 * hardcoded fill colors with currentColor.
 */
function processInner(inner) {
  // Strip wrapper <g> elements that only have an id attribute
  let processed = inner;

  // Remove <g id="..."> and </g> wrapper groups (non-greedy, outermost only)
  // These are organizational groups from the SVG editor, not meaningful
  processed = processed.replace(/<g\s+id="[^"]*"\s*>/gi, '');
  processed = processed.replace(/<\/g>/gi, '');

  // Replace hardcoded fill colors with currentColor
  // Common patterns: fill="#000001", fill="#000000", fill="black", fill="#000"
  processed = processed.replace(
    /fill=["'](#000001|#000000|#000|black)["']/gi,
    'fill="currentColor"'
  );

  // Clean up extra whitespace from removed tags
  processed = processed.replace(/\n\s*\n/g, '\n').trim();

  return processed;
}

// --------------------------------------------------------------------------
// Generate for a directory
// --------------------------------------------------------------------------

function generateForDir(dir, defaultSize) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.svg'))
    .sort();

  console.log(`Found ${files.length} SVGs in ${basename(dir)}/`);

  const components = [];
  const exports = [];
  const nameMap = [];

  for (const file of files) {
    const raw = readFileSync(join(dir, file), 'utf-8').trim();
    const kebab = basename(file, '.svg');
    const name = componentName(kebab);
    const viewBox = extractViewBox(raw, defaultSize);
    let inner = extractInner(raw);
    inner = processInner(inner);
    inner = htmlAttrsToJsx(inner);

    components.push(`
export const ${name} = ({ size = ${defaultSize}, className = '', ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="${viewBox}" fill="currentColor" className={className} {...props}>
    ${inner}
  </svg>
);
${name}.displayName = '${name}';`);

    exports.push(name);
    nameMap.push([kebab, name]);
  }

  return { files, components, exports, nameMap };
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------

// Generate 16px icons
const result16 = generateForDir(ICONS_16_DIR, 16);

const output16 = `/**
 * AUTO-GENERATED — DO NOT EDIT
 *
 * Generated by: scripts/generate-icons.mjs
 * Source:       assets/icons/16px/*.svg (${result16.files.length} icons)
 *
 * To regenerate: pnpm generate:icons
 */

import type { ReactElement } from 'react';
import type { IconProps } from './types';
${result16.components.join('\n')}

/** All 16px icon names (kebab-case, matching SVG filenames) */
export const GENERATED_ICON_NAMES = ${JSON.stringify(result16.files.map((f) => basename(f, '.svg')), null, 2)} as const;

export type GeneratedIconName = (typeof GENERATED_ICON_NAMES)[number];

/** Lookup map: kebab-case name → inline 16px icon component */
export const ICON_BY_NAME: Record<string, (props: IconProps) => ReactElement> = {
${result16.nameMap.map(([kebab, pascal]) => `  '${kebab}': ${pascal},`).join('\n')}
};
`;

writeFileSync(OUTPUT_16, output16, 'utf-8');
console.log(
  `Generated ${result16.exports.length} 16px icon components → icons/generated.tsx`
);

// Generate 24px icons
const result24 = generateForDir(ICONS_24_DIR, 24);

const output24 = `/**
 * AUTO-GENERATED — DO NOT EDIT
 *
 * Generated by: scripts/generate-icons.mjs
 * Source:       assets/icons/24px/*.svg (${result24.files.length} icons)
 *
 * To regenerate: pnpm generate:icons
 */

import type { ReactElement } from 'react';
import type { IconProps } from './types';
${result24.components.join('\n')}

/** All 24px icon names (kebab-case, matching SVG filenames) */
export const GENERATED_24_ICON_NAMES = ${JSON.stringify(result24.files.map((f) => basename(f, '.svg')), null, 2)} as const;

export type Generated24IconName = (typeof GENERATED_24_ICON_NAMES)[number];

/** Lookup map: kebab-case name → inline 24px icon component */
export const ICON_24_BY_NAME: Record<string, (props: IconProps) => ReactElement> = {
${result24.nameMap.map(([kebab, pascal]) => `  '${kebab}': ${pascal},`).join('\n')}
};
`;

writeFileSync(OUTPUT_24, output24, 'utf-8');
console.log(
  `Generated ${result24.exports.length} 24px icon components → icons/generated-24.tsx`
);
