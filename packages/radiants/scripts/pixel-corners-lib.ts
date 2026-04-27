import {
  prepareCornerProfile,
  type CornerShapeName,
  type PreparedCornerProfile,
} from '@rdna/pixel/corners';

import { getPresetSizes, type PixelCornerSizeEntry } from './pixel-corners.config.ts';

const GENERATED_FILE_BANNER = `/* AUTO-GENERATED FILE. DO NOT EDIT.
   Authored source: @rdna/pixel/corners prepared profiles
   Materialized by: packages/radiants/scripts/generate-pixel-corners.ts
   Run: pnpm --filter @rdna/radiants generate:pixel-corners
*/`;

const SHAPES = [
  'circle',
  'chamfer',
  'scallop',
] as const satisfies readonly CornerShapeName[];

const SHAPE_VARIANTS = SHAPES.filter((shape) => shape !== 'circle');
const SCALE_LEVELS = [2, 3] as const;
const CORNERS = ['tl', 'tr', 'bl', 'br'] as const;
const PART_NAMES = [
  'cover-tl',
  'cover-tr',
  'cover-bl',
  'cover-br',
  'border-tl',
  'border-tr',
  'border-bl',
  'border-br',
] as const;

type ShapeSourceMap = Map<string, PreparedCornerProfile>;

function indent(level: number, line: string) {
  return '  '.repeat(level) + line;
}

function selectorList(selectors: readonly string[]) {
  return selectors.join(',\n');
}

function borderWidth() {
  return 'calc(1px * var(--pixel-scale, 1))';
}

function buildShapeSourceMap(sizes: readonly PixelCornerSizeEntry[]): ShapeSourceMap {
  const map: ShapeSourceMap = new Map();

  for (const size of sizes) {
    for (const shape of SHAPES) {
      map.set(`${size.suffix}:${shape}`, prepareCornerProfile(shape, size.radiusPx));
    }
  }

  return map;
}

function getProfile(
  sources: ShapeSourceMap,
  suffix: string,
  shape: CornerShapeName,
): PreparedCornerProfile {
  const profile = sources.get(`${suffix}:${shape}`);

  if (!profile) {
    throw new Error(`Missing prepared corner profile for ${suffix}:${shape}`);
  }

  return profile;
}

function emitCustomProperties(
  sizes: readonly PixelCornerSizeEntry[],
  shapeSources: ShapeSourceMap,
) {
  const lines = [':root {'];

  for (const { suffix } of sizes) {
    for (const shape of SHAPES) {
      const profile = getProfile(shapeSources, suffix, shape);

      for (const corner of CORNERS) {
        lines.push(
          indent(1, `--pc-${suffix}-${shape}-cover-${corner}: ${profile.cover[corner].maskImage};`),
        );
      }

      for (const corner of CORNERS) {
        lines.push(
          indent(1, `--pc-${suffix}-${shape}-border-${corner}: ${profile.border[corner].maskImage};`),
        );
      }
    }
  }

  lines.push('');
  lines.push(indent(1, '/* Active chain: overridden by :root[data-corner-shape="..."]. */'));
  for (const { suffix } of sizes) {
    for (const part of PART_NAMES) {
      lines.push(indent(1, `--pc-${suffix}-active-${part}: var(--pc-${suffix}-circle-${part});`));
    }
  }

  lines.push('');
  lines.push(indent(1, '/* Final chain: consumed by .pixel-corner and preset utility variables. */'));
  for (const { suffix } of sizes) {
    for (const part of PART_NAMES) {
      lines.push(indent(1, `--pc-${suffix}-${part}: var(--pc-${suffix}-active-${part});`));
    }
  }

  lines.push('}');
  return lines.join('\n');
}

function emitShapeOverrides(sizes: readonly PixelCornerSizeEntry[]) {
  const blocks: string[] = [];

  for (const shape of SHAPE_VARIANTS) {
    const lines = [`:root[data-corner-shape="${shape}"] {`];
    for (const { suffix } of sizes) {
      for (const part of PART_NAMES) {
        lines.push(indent(1, `--pc-${suffix}-active-${part}: var(--pc-${suffix}-${shape}-${part});`));
      }
    }
    lines.push('}');
    blocks.push(lines.join('\n'));
  }

  return blocks.join('\n\n');
}

function emitScaleOverrides(sizes: readonly PixelCornerSizeEntry[]) {
  const sorted = [...sizes].sort((a, b) => a.gridSize - b.gridSize);
  const suffixByGrid = new Map<number, string>();

  for (const entry of sorted) {
    if (!suffixByGrid.has(entry.gridSize)) {
      suffixByGrid.set(entry.gridSize, entry.suffix);
    }
  }

  const availableGrids = [...suffixByGrid.keys()].sort((a, b) => a - b);

  function nearestLEQ(target: number) {
    let best = availableGrids[0] ?? 2;
    for (const grid of availableGrids) {
      if (grid <= target) {
        best = grid;
        continue;
      }
      break;
    }
    return best;
  }

  const blocks: string[] = [];

  for (const scale of SCALE_LEVELS) {
    const lines = [`:root[data-pixel-scale="${scale}"] {`];
    for (const { suffix, gridSize } of sizes) {
      const target = Math.max(2, Math.floor(gridSize / scale));
      const mappedSuffix = suffixByGrid.get(nearestLEQ(target));

      if (!mappedSuffix) {
        throw new Error(`Missing pixel corner scale mapping for ${suffix} at ${scale}x`);
      }

      for (const part of PART_NAMES) {
        lines.push(indent(1, `--pc-${suffix}-${part}: var(--pc-${mappedSuffix}-active-${part});`));
      }
    }
    lines.push('}');
    blocks.push(lines.join('\n'));
  }

  return blocks.join('\n\n');
}

function emitPositionRule(selectors: readonly string[]) {
  const positionSelectors = selectors.map(
    (selector) => `${selector}:where(:not(.absolute, .fixed, .sticky))`,
  );

  return [
    '/* Structural host setup for runtime and zero-JS pixel corner utilities. */',
    `${selectorList(positionSelectors)} {`,
    indent(1, 'position: relative;'),
    '}',
  ].join('\n');
}

function emitHostMaskRule(selectors: readonly string[]) {
  const lines = [`${selectorList(selectors)} {`];

  lines.push(indent(1, 'border-radius: 0;'));
  lines.push(indent(1, '--px-tl-cover: none;'));
  lines.push(indent(1, '--px-tr-cover: none;'));
  lines.push(indent(1, '--px-bl-cover: none;'));
  lines.push(indent(1, '--px-br-cover: none;'));
  lines.push(indent(1, '--px-tl-border: none;'));
  lines.push(indent(1, '--px-tr-border: none;'));
  lines.push(indent(1, '--px-bl-border: none;'));
  lines.push(indent(1, '--px-br-border: none;'));
  lines.push(indent(1, '--px-tl-s: 0px;'));
  lines.push(indent(1, '--px-tr-s: 0px;'));
  lines.push(indent(1, '--px-bl-s: 0px;'));
  lines.push(indent(1, '--px-br-s: 0px;'));
  lines.push(indent(1, '--px-et: 1;'));
  lines.push(indent(1, '--px-er: 1;'));
  lines.push(indent(1, '--px-eb: 1;'));
  lines.push(indent(1, '--px-el: 1;'));
  lines.push('');
  lines.push(indent(1, 'mask-image:'));
  lines.push(indent(2, 'linear-gradient(white, white),'));
  lines.push(indent(2, 'var(--px-tl-cover, none),'));
  lines.push(indent(2, 'var(--px-tr-cover, none),'));
  lines.push(indent(2, 'var(--px-bl-cover, none),'));
  lines.push(indent(2, 'var(--px-br-cover, none);'));
  lines.push(indent(1, 'mask-size:'));
  lines.push(indent(2, '100% 100%,'));
  lines.push(indent(2, 'var(--px-tl-s, 0px) var(--px-tl-s, 0px),'));
  lines.push(indent(2, 'var(--px-tr-s, 0px) var(--px-tr-s, 0px),'));
  lines.push(indent(2, 'var(--px-bl-s, 0px) var(--px-bl-s, 0px),'));
  lines.push(indent(2, 'var(--px-br-s, 0px) var(--px-br-s, 0px);'));
  lines.push(indent(1, 'mask-position: 0 0, 0 0, 100% 0, 0 100%, 100% 100%;'));
  lines.push(indent(1, 'mask-repeat: no-repeat;'));
  lines.push(indent(1, 'mask-composite: subtract;'));
  lines.push(indent(1, '-webkit-mask-image:'));
  lines.push(indent(2, 'var(--px-tl-cover, none),'));
  lines.push(indent(2, 'var(--px-tr-cover, none),'));
  lines.push(indent(2, 'var(--px-bl-cover, none),'));
  lines.push(indent(2, 'var(--px-br-cover, none),'));
  lines.push(indent(2, 'linear-gradient(white, white);'));
  lines.push(indent(1, '-webkit-mask-size:'));
  lines.push(indent(2, 'var(--px-tl-s, 0px) var(--px-tl-s, 0px),'));
  lines.push(indent(2, 'var(--px-tr-s, 0px) var(--px-tr-s, 0px),'));
  lines.push(indent(2, 'var(--px-bl-s, 0px) var(--px-bl-s, 0px),'));
  lines.push(indent(2, 'var(--px-br-s, 0px) var(--px-br-s, 0px),'));
  lines.push(indent(2, '100% 100%;'));
  lines.push(indent(1, '-webkit-mask-position: 0 0, 100% 0, 0 100%, 100% 100%, 0 0;'));
  lines.push(indent(1, '-webkit-mask-repeat: no-repeat;'));
  lines.push(indent(1, '-webkit-mask-composite:'));
  lines.push(indent(2, 'destination-out,'));
  lines.push(indent(2, 'destination-out,'));
  lines.push(indent(2, 'destination-out,'));
  lines.push(indent(2, 'destination-out,'));
  lines.push(indent(2, 'source-over;'));
  lines.push('}');

  return lines.join('\n');
}

function emitAfterMaskRule(selectors: readonly string[]) {
  const bw = borderWidth();
  const afterSelectors = selectors.map((selector) => `${selector}::after`);
  const lines = [`${selectorList(afterSelectors)} {`];

  lines.push(indent(1, "content: '';"));
  lines.push(indent(1, 'position: absolute;'));
  lines.push(indent(1, 'inset: 0;'));
  lines.push(indent(1, 'pointer-events: none;'));
  lines.push(indent(1, 'z-index: 2;'));
  lines.push(indent(1, 'background-color: var(--color-line);'));
  lines.push(indent(1, 'mask-image:'));
  lines.push(indent(2, 'var(--px-tl-border, none),'));
  lines.push(indent(2, 'var(--px-tr-border, none),'));
  lines.push(indent(2, 'var(--px-bl-border, none),'));
  lines.push(indent(2, 'var(--px-br-border, none),'));
  lines.push(indent(2, 'linear-gradient(white, white),'));
  lines.push(indent(2, 'linear-gradient(white, white),'));
  lines.push(indent(2, 'linear-gradient(white, white),'));
  lines.push(indent(2, 'linear-gradient(white, white);'));
  lines.push(indent(1, 'mask-size:'));
  lines.push(indent(2, 'var(--px-tl-s, 0px) var(--px-tl-s, 0px),'));
  lines.push(indent(2, 'var(--px-tr-s, 0px) var(--px-tr-s, 0px),'));
  lines.push(indent(2, 'var(--px-bl-s, 0px) var(--px-bl-s, 0px),'));
  lines.push(indent(2, 'var(--px-br-s, 0px) var(--px-br-s, 0px),'));
  lines.push(indent(2, `calc(100% - var(--px-tl-s, 0px) - var(--px-tr-s, 0px)) calc(${bw} * var(--px-et, 1)),`));
  lines.push(indent(2, `calc(${bw} * var(--px-er, 1)) calc(100% - var(--px-tr-s, 0px) - var(--px-br-s, 0px)),`));
  lines.push(indent(2, `calc(100% - var(--px-bl-s, 0px) - var(--px-br-s, 0px)) calc(${bw} * var(--px-eb, 1)),`));
  lines.push(indent(2, `calc(${bw} * var(--px-el, 1)) calc(100% - var(--px-tl-s, 0px) - var(--px-bl-s, 0px));`));
  lines.push(indent(1, 'mask-position:'));
  lines.push(indent(2, '0 0,'));
  lines.push(indent(2, '100% 0,'));
  lines.push(indent(2, '0 100%,'));
  lines.push(indent(2, '100% 100%,'));
  lines.push(indent(2, 'var(--px-tl-s, 0px) 0,'));
  lines.push(indent(2, '100% var(--px-tr-s, 0px),'));
  lines.push(indent(2, 'var(--px-bl-s, 0px) 100%,'));
  lines.push(indent(2, '0 var(--px-tl-s, 0px);'));
  lines.push(indent(1, 'mask-repeat: no-repeat;'));
  lines.push(indent(1, 'mask-composite: add;'));
  lines.push(indent(1, '-webkit-mask-image:'));
  lines.push(indent(2, 'var(--px-tl-border, none),'));
  lines.push(indent(2, 'var(--px-tr-border, none),'));
  lines.push(indent(2, 'var(--px-bl-border, none),'));
  lines.push(indent(2, 'var(--px-br-border, none),'));
  lines.push(indent(2, 'linear-gradient(white, white),'));
  lines.push(indent(2, 'linear-gradient(white, white),'));
  lines.push(indent(2, 'linear-gradient(white, white),'));
  lines.push(indent(2, 'linear-gradient(white, white);'));
  lines.push(indent(1, '-webkit-mask-size:'));
  lines.push(indent(2, 'var(--px-tl-s, 0px) var(--px-tl-s, 0px),'));
  lines.push(indent(2, 'var(--px-tr-s, 0px) var(--px-tr-s, 0px),'));
  lines.push(indent(2, 'var(--px-bl-s, 0px) var(--px-bl-s, 0px),'));
  lines.push(indent(2, 'var(--px-br-s, 0px) var(--px-br-s, 0px),'));
  lines.push(indent(2, `calc(100% - var(--px-tl-s, 0px) - var(--px-tr-s, 0px)) calc(${bw} * var(--px-et, 1)),`));
  lines.push(indent(2, `calc(${bw} * var(--px-er, 1)) calc(100% - var(--px-tr-s, 0px) - var(--px-br-s, 0px)),`));
  lines.push(indent(2, `calc(100% - var(--px-bl-s, 0px) - var(--px-br-s, 0px)) calc(${bw} * var(--px-eb, 1)),`));
  lines.push(indent(2, `calc(${bw} * var(--px-el, 1)) calc(100% - var(--px-tl-s, 0px) - var(--px-bl-s, 0px));`));
  lines.push(indent(1, '-webkit-mask-position:'));
  lines.push(indent(2, '0 0,'));
  lines.push(indent(2, '100% 0,'));
  lines.push(indent(2, '0 100%,'));
  lines.push(indent(2, '100% 100%,'));
  lines.push(indent(2, 'var(--px-tl-s, 0px) 0,'));
  lines.push(indent(2, '100% var(--px-tr-s, 0px),'));
  lines.push(indent(2, 'var(--px-bl-s, 0px) 100%,'));
  lines.push(indent(2, '0 var(--px-tl-s, 0px);'));
  lines.push(indent(1, '-webkit-mask-repeat: no-repeat;'));
  lines.push(indent(1, '-webkit-mask-composite:'));
  lines.push(indent(2, 'source-over,'));
  lines.push(indent(2, 'source-over,'));
  lines.push(indent(2, 'source-over,'));
  lines.push(indent(2, 'source-over,'));
  lines.push(indent(2, 'source-over,'));
  lines.push(indent(2, 'source-over,'));
  lines.push(indent(2, 'source-over,'));
  lines.push(indent(2, 'source-over;'));
  lines.push('}');

  return lines.join('\n');
}

function emitPresetUtility(size: PixelCornerSizeEntry) {
  const lines = [`.pixel-rounded-${size.suffix} {`];

  for (const corner of CORNERS) {
    lines.push(indent(1, `--px-${corner}-cover: var(--pc-${size.suffix}-cover-${corner});`));
  }
  for (const corner of CORNERS) {
    lines.push(indent(1, `--px-${corner}-border: var(--pc-${size.suffix}-border-${corner});`));
  }
  for (const corner of CORNERS) {
    lines.push(indent(1, `--px-${corner}-s: ${size.gridSize}px;`));
  }
  lines.push('}');

  return lines.join('\n');
}

export function renderPixelCornersGeneratedCss() {
  const sizes = getPresetSizes();
  const shapeSources = buildShapeSourceMap(sizes);
  const presetSelectors = sizes.map(({ suffix }) => `.pixel-rounded-${suffix}`);
  const structuralSelectors = ['.pixel-corner', ...presetSelectors];
  const blocks = [
    GENERATED_FILE_BANNER,
    emitCustomProperties(sizes, shapeSources),
    '/* ============================================================================\n   Corner shape overrides\n   ============================================================================ */',
    emitShapeOverrides(sizes),
    '/* ============================================================================\n   Pixel-scale overrides\n   ============================================================================ */',
    emitScaleOverrides(sizes),
    '/* ============================================================================\n   Shared structural masks\n   ============================================================================ */',
    emitPositionRule(structuralSelectors),
    emitHostMaskRule(structuralSelectors),
    emitAfterMaskRule(structuralSelectors),
    '/* ============================================================================\n   Thin preset utilities\n   ============================================================================ */',
    ...sizes.map(emitPresetUtility),
  ];

  return `${blocks.filter(Boolean).join('\n\n')}\n`;
}
