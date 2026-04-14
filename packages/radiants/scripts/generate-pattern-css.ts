import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { bitsToMaskURI, bitsToPath } from '@rdna/pixel';

import { patternRegistry } from '../patterns/registry.ts';

const GRID_SIZE = 8;
const DEFAULT_MASK_SIZE =
  `calc(${GRID_SIZE}px * var(--pixel-scale, 1) * var(--pat-scale, 1)) ` +
  `calc(${GRID_SIZE}px * var(--pixel-scale, 1) * var(--pat-scale, 1))`;
const GENERATED_FILE_BANNER = `/* AUTO-GENERATED FILE. DO NOT EDIT.
   Source: scripts/generate-pattern-css.ts + patterns/registry.ts
   Run: node --experimental-strip-types scripts/generate-pattern-css.ts
*/`;

function indent(level: number, line: string) {
  return '  '.repeat(level) + line;
}

function renderTokenValue(bits: string) {
  const pathD = bitsToPath(bits, GRID_SIZE, GRID_SIZE);
  return bitsToMaskURI(pathD, GRID_SIZE);
}

export function renderPatternCss() {
  const lines: string[] = [GENERATED_FILE_BANNER, '', '@theme {'];

  const grouped = new Map<string, typeof patternRegistry>();
  for (const entry of patternRegistry) {
    const list = grouped.get(entry.group);
    if (list) {
      list.push(entry);
    } else {
      grouped.set(entry.group, [entry]);
    }
  }

  const groupLabels: Record<string, string> = {
    structural: 'Structural',
    diagonal: 'Diagonal',
    grid: 'Grid & Lattice',
    figurative: 'Figurative',
    scatter: 'Scatter / Stipple',
    heavy: 'Heavy Fill',
  };

  for (const [group, entries] of grouped) {
    lines.push(indent(1, `/* ─── Group: ${groupLabels[group] ?? group} ─── */`));
    for (const entry of entries) {
      lines.push(indent(1, `${entry.token}: ${renderTokenValue(entry.bits)};`));
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
