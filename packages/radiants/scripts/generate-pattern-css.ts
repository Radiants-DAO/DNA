import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  PATTERN_GROUPS,
  preparePatterns,
  type PatternGroup,
  type PreparedPattern,
} from '../../pixel/src/patterns.ts';

const GRID_SIZE = 8;
// Mask size is one --pat-cell per pattern pixel, scaled by the pixel/pat scale
// multipliers. --pat-cell is declared in base.css as the global authority.
const DEFAULT_MASK_SIZE =
  `calc(var(--pat-cell, ${GRID_SIZE}px) * var(--pixel-scale, 1) * var(--pat-scale, 1)) ` +
  `calc(var(--pat-cell, ${GRID_SIZE}px) * var(--pixel-scale, 1) * var(--pat-scale, 1))`;
const GENERATED_FILE_BANNER = `/* AUTO-GENERATED FILE. DO NOT EDIT.
   Authored source: packages/pixel/src/patterns/registry.ts
   Materialized by: packages/radiants/scripts/generate-pattern-css.ts
   Run: node --experimental-strip-types scripts/generate-pattern-css.ts
*/`;

const patternRegistry = preparePatterns();

function indent(level: number, line: string) {
  return '  '.repeat(level) + line;
}

export function renderPatternCss() {
  const lines: string[] = [GENERATED_FILE_BANNER, '', '@theme {'];

  const grouped = new Map<PatternGroup, PreparedPattern[]>();
  for (const entry of patternRegistry) {
    const list = grouped.get(entry.group);
    if (list) {
      list.push(entry);
    } else {
      grouped.set(entry.group, [entry]);
    }
  }

  const groupLabels = Object.fromEntries(
    PATTERN_GROUPS.map((group) => [group.key, group.label]),
  );

  for (const [group, entries] of grouped) {
    lines.push(indent(1, `/* ─── Group: ${groupLabels[group] ?? group} ─── */`));
    for (const entry of entries) {
      lines.push(indent(1, `${entry.token}: ${entry.maskImage};`));
    }
    lines.push('');
  }

  lines.push(indent(1, '--color-shadow-pat: var(--color-ink);'));
  lines.push('}');
  lines.push('');
  lines.push('.rdna-pat {');
  lines.push(indent(1, 'position: relative;'));
  lines.push(indent(1, 'background-color: var(--pat-bg, transparent);'));
  lines.push('}');
  lines.push('');
  lines.push('.rdna-pat::before {');
  lines.push(indent(1, "content: '';"));
  lines.push(indent(1, 'position: absolute;'));
  lines.push(indent(1, 'inset: 0;'));
  lines.push(indent(1, 'z-index: 0;'));
  lines.push(indent(1, 'pointer-events: none;'));
  lines.push(indent(1, 'background: var(--pat-fill, var(--pat-color, var(--color-main)));'));
  lines.push(indent(1, '-webkit-mask-image: var(--_pat);'));
  lines.push(indent(1, 'mask-image: var(--_pat);'));
  lines.push(indent(1, '-webkit-mask-position: 0 0;'));
  lines.push(indent(1, 'mask-position: 0 0;'));
  lines.push(indent(1, `-webkit-mask-size: var(--pat-mask-size, ${DEFAULT_MASK_SIZE});`));
  lines.push(indent(1, `mask-size: var(--pat-mask-size, ${DEFAULT_MASK_SIZE});`));
  lines.push(indent(1, '-webkit-mask-repeat: var(--pat-repeat, repeat);'));
  lines.push(indent(1, 'mask-repeat: var(--pat-repeat, repeat);'));
  lines.push(indent(1, 'image-rendering: pixelated;'));
  lines.push(indent(1, 'image-rendering: -moz-crisp-edges;'));
  lines.push(indent(1, 'image-rendering: crisp-edges;'));
  lines.push('}');
  lines.push('');
  lines.push('.rdna-pat > * {');
  lines.push(indent(1, 'position: relative;'));
  lines.push(indent(1, 'z-index: 1;'));
  lines.push('}');
  lines.push('');

  for (const entry of patternRegistry) {
    lines.push(`.rdna-pat--${entry.name} { --_pat: var(${entry.token}); }`);
  }
  lines.push('');
  lines.push('.rdna-pat--2x { --pat-scale: 2; }');
  lines.push('.rdna-pat--3x { --pat-scale: 3; }');
  lines.push('.rdna-pat--4x { --pat-scale: 4; }');

  return `${lines.join('\n')}\n`;
}

export function writePatternCss(outputPath = resolve(dirname(fileURLToPath(import.meta.url)), '../patterns.css')) {
  const css = renderPatternCss();
  writeFileSync(outputPath, css);
  return css;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  writePatternCss();
}
