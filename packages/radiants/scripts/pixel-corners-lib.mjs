import { generateCorner, generateShape, bitsToPath, bitsToMaskURI } from '@rdna/pixel';
import {
  NUMERIC_SIZES,
  FULL_SIZE,
  LEGACY_ALIASES,
  generateSizeData,
} from './pixel-corners.config.mjs';

const GENERATED_FILE_BANNER = `/* AUTO-GENERATED FILE. DO NOT EDIT.
   Source: scripts/pixel-corners.config.mjs + pixel-corners-lib.mjs
   Run: pnpm --filter @rdna/radiants generate:pixel-corners
*/`;

// ---------------------------------------------------------------------------
// SVG data-URI helpers
// ---------------------------------------------------------------------------

/**
 * Build cover mask URIs for all 4 corners.
 * Cover = the area OUTSIDE the arc (to be subtracted).
 */
function buildCoverURIs(coverPathD, gridSize) {
  const N = gridSize;
  return {
    tl: bitsToMaskURI(coverPathD, N),
    tr: bitsToMaskURI(coverPathD, N, `translate(${N},0) scale(-1,1)`),
    bl: bitsToMaskURI(coverPathD, N, `translate(0,${N}) scale(1,-1)`),
    br: bitsToMaskURI(coverPathD, N, `translate(${N},${N}) scale(-1,-1)`),
  };
}

/**
 * Build border mask URIs for all 4 corners.
 * Border = the 1px staircase arc pixels.
 */
function buildBorderURIs(borderPathD, gridSize) {
  const N = gridSize;
  return {
    tl: bitsToMaskURI(borderPathD, N),
    tr: bitsToMaskURI(borderPathD, N, `translate(${N},0) scale(-1,1)`),
    bl: bitsToMaskURI(borderPathD, N, `translate(0,${N}) scale(1,-1)`),
    br: bitsToMaskURI(borderPathD, N, `translate(${N},${N}) scale(-1,-1)`),
  };
}

// ---------------------------------------------------------------------------
// Per-size data generation
// ---------------------------------------------------------------------------

/**
 * Compute all mask data for a single pixel-corner size.
 * @param {number} gridSize
 * @param {string} [shape='circle'] - Corner shape name.
 */
function computeSizeMaskData(gridSize, shape = 'circle') {
  const cornerSet = shape === 'circle'
    ? generateCorner(gridSize - 1)
    : generateShape(shape, gridSize);
  const { width, height, bits: coverBits } = cornerSet.tl;
  const borderBits = cornerSet.border.bits;

  const coverPathD = bitsToPath(coverBits, width, height);
  const borderPathD = bitsToPath(borderBits, width, height);

  return {
    gridSize,
    radius: gridSize - 1,
    shape,
    coverPathD,
    borderPathD,
    coverURIs: buildCoverURIs(coverPathD, gridSize),
    borderURIs: buildBorderURIs(borderPathD, gridSize),
  };
}

// ---------------------------------------------------------------------------
// CSS emission helpers
// ---------------------------------------------------------------------------

function indent(level, line) {
  return '  '.repeat(level) + line;
}

function sizeCalc(gridSize) {
  return `calc(${gridSize}px * var(--pixel-scale, 1))`;
}

function edgeWidth(gridSize) {
  return `calc(100% - (${gridSize} * var(--pixel-scale, 1) * 2px))`;
}

function cornerSize(gridSize) {
  return `calc(${gridSize} * var(--pixel-scale, 1) * 1px)`;
}

/** Border width = 1 pixel, scaled by --pixel-scale. */
function borderWidth() {
  return `calc(1px * var(--pixel-scale, 1))`;
}

// ---------------------------------------------------------------------------
// CSS custom properties (:root block)
// ---------------------------------------------------------------------------

function emitCustomProperties(sizes) {
  const lines = [':root {'];

  for (const { suffix, data } of sizes) {
    const { coverURIs, borderURIs } = data;
    lines.push(indent(1, `--pc-${suffix}-cover-tl: ${coverURIs.tl};`));
    lines.push(indent(1, `--pc-${suffix}-cover-tr: ${coverURIs.tr};`));
    lines.push(indent(1, `--pc-${suffix}-cover-bl: ${coverURIs.bl};`));
    lines.push(indent(1, `--pc-${suffix}-cover-br: ${coverURIs.br};`));
    lines.push(indent(1, `--pc-${suffix}-border-tl: ${borderURIs.tl};`));
    lines.push(indent(1, `--pc-${suffix}-border-tr: ${borderURIs.tr};`));
    lines.push(indent(1, `--pc-${suffix}-border-bl: ${borderURIs.bl};`));
    lines.push(indent(1, `--pc-${suffix}-border-br: ${borderURIs.br};`));
  }

  lines.push('}');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Shared base styles
// ---------------------------------------------------------------------------

function emitSharedBase(allClassNames) {
  const lines = [];

  // Shared base — position: relative + border-radius: 0
  lines.push('/* Shared base — position: relative for ::after, mask handles corners */');
  lines.push(allClassNames.join(',\n') + ' {');
  lines.push(indent(1, 'position: relative;'));
  lines.push(indent(1, 'border-radius: 0;'));
  lines.push('}');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Per-size host element clipping
// ---------------------------------------------------------------------------

function emitHostMask(className, suffix, gridSize) {
  const sz = sizeCalc(gridSize);
  const lines = [];

  lines.push(`${className} {`);

  // Standard mask-composite (Firefox)
  lines.push(indent(1, 'mask-image:'));
  lines.push(indent(2, 'linear-gradient(white, white),'));
  lines.push(indent(2, `var(--pc-${suffix}-cover-tl),`));
  lines.push(indent(2, `var(--pc-${suffix}-cover-tr),`));
  lines.push(indent(2, `var(--pc-${suffix}-cover-bl),`));
  lines.push(indent(2, `var(--pc-${suffix}-cover-br);`));

  lines.push(indent(1, 'mask-position: 0 0, 0 0, 100% 0, 0 100%, 100% 100%;'));

  lines.push(indent(1, 'mask-size:'));
  lines.push(indent(2, '100% 100%,'));
  lines.push(indent(2, `${sz} ${sz},`));
  lines.push(indent(2, `${sz} ${sz},`));
  lines.push(indent(2, `${sz} ${sz},`));
  lines.push(indent(2, `${sz} ${sz};`));

  lines.push(indent(1, 'mask-repeat: no-repeat;'));
  lines.push(indent(1, 'mask-composite: subtract;'));

  // WebKit (Chrome/Safari) — reversed layer order, destination-out
  lines.push(indent(1, '-webkit-mask-image:'));
  lines.push(indent(2, `var(--pc-${suffix}-cover-tl),`));
  lines.push(indent(2, `var(--pc-${suffix}-cover-tr),`));
  lines.push(indent(2, `var(--pc-${suffix}-cover-bl),`));
  lines.push(indent(2, `var(--pc-${suffix}-cover-br),`));
  lines.push(indent(2, 'linear-gradient(white, white);'));

  lines.push(indent(1, '-webkit-mask-position: 0 0, 100% 0, 0 100%, 100% 100%, 0 0;'));

  lines.push(indent(1, '-webkit-mask-size:'));
  lines.push(indent(2, `${sz} ${sz},`));
  lines.push(indent(2, `${sz} ${sz},`));
  lines.push(indent(2, `${sz} ${sz},`));
  lines.push(indent(2, `${sz} ${sz},`));
  lines.push(indent(2, '100% 100%;'));

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

// ---------------------------------------------------------------------------
// Per-size ::after border ring
// ---------------------------------------------------------------------------

function emitAfterMask(className, suffix, gridSize) {
  const csz = cornerSize(gridSize);
  const ew = edgeWidth(gridSize);
  const lines = [];

  lines.push(`${className}::after {`);
  lines.push(indent(1, "content: '';"));
  lines.push(indent(1, 'position: absolute;'));
  lines.push(indent(1, 'inset: 0;'));
  lines.push(indent(1, 'pointer-events: none;'));
  lines.push(indent(1, 'z-index: 2;'));
  lines.push(indent(1, 'background-color: var(--color-line);'));

  // Standard mask (Firefox) — 8 layers: 4 corners + 4 edge strips
  lines.push(indent(1, 'mask-image:'));
  lines.push(indent(2, `var(--pc-${suffix}-border-tl),`));
  lines.push(indent(2, `var(--pc-${suffix}-border-tr),`));
  lines.push(indent(2, `var(--pc-${suffix}-border-bl),`));
  lines.push(indent(2, `var(--pc-${suffix}-border-br),`));
  lines.push(indent(2, 'linear-gradient(white, white),'));   // top edge
  lines.push(indent(2, 'linear-gradient(white, white),'));   // right edge
  lines.push(indent(2, 'linear-gradient(white, white),'));   // bottom edge
  lines.push(indent(2, 'linear-gradient(white, white);'));   // left edge

  lines.push(indent(1, 'mask-position:'));
  lines.push(indent(2, '0 0,'));         // TL corner
  lines.push(indent(2, '100% 0,'));      // TR corner
  lines.push(indent(2, '0 100%,'));      // BL corner
  lines.push(indent(2, '100% 100%,'));   // BR corner
  lines.push(indent(2, `${csz} 0,`));   // top edge
  lines.push(indent(2, `100% ${csz},`));  // right edge
  lines.push(indent(2, `${csz} 100%,`)); // bottom edge
  lines.push(indent(2, `0 ${csz};`));    // left edge

  lines.push(indent(1, 'mask-size:'));
  lines.push(indent(2, `${csz} ${csz},`));   // TL
  lines.push(indent(2, `${csz} ${csz},`));   // TR
  lines.push(indent(2, `${csz} ${csz},`));   // BL
  lines.push(indent(2, `${csz} ${csz},`));   // BR
  const bw = borderWidth();
  lines.push(indent(2, `${ew} ${bw},`));   // top strip
  lines.push(indent(2, `${bw} ${ew},`));   // right strip
  lines.push(indent(2, `${ew} ${bw},`));   // bottom strip
  lines.push(indent(2, `${bw} ${ew};`));   // left strip

  lines.push(indent(1, 'mask-repeat: no-repeat;'));
  lines.push(indent(1, 'mask-composite: add;'));

  // WebKit (Chrome/Safari) — same order, all additive (source-over)
  lines.push(indent(1, '-webkit-mask-image:'));
  lines.push(indent(2, `var(--pc-${suffix}-border-tl),`));
  lines.push(indent(2, `var(--pc-${suffix}-border-tr),`));
  lines.push(indent(2, `var(--pc-${suffix}-border-bl),`));
  lines.push(indent(2, `var(--pc-${suffix}-border-br),`));
  lines.push(indent(2, 'linear-gradient(white, white),'));
  lines.push(indent(2, 'linear-gradient(white, white),'));
  lines.push(indent(2, 'linear-gradient(white, white),'));
  lines.push(indent(2, 'linear-gradient(white, white);'));

  lines.push(indent(1, '-webkit-mask-position:'));
  lines.push(indent(2, '0 0,'));
  lines.push(indent(2, '100% 0,'));
  lines.push(indent(2, '0 100%,'));
  lines.push(indent(2, '100% 100%,'));
  lines.push(indent(2, `${csz} 0,`));
  lines.push(indent(2, `100% ${csz},`));
  lines.push(indent(2, `${csz} 100%,`));
  lines.push(indent(2, `0 ${csz};`));

  lines.push(indent(1, '-webkit-mask-size:'));
  lines.push(indent(2, `${csz} ${csz},`));
  lines.push(indent(2, `${csz} ${csz},`));
  lines.push(indent(2, `${csz} ${csz},`));
  lines.push(indent(2, `${csz} ${csz},`));
  lines.push(indent(2, `${ew} ${bw},`));
  lines.push(indent(2, `${bw} ${ew},`));
  lines.push(indent(2, `${ew} ${bw},`));
  lines.push(indent(2, `${bw} ${ew};`));

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

// ---------------------------------------------------------------------------
// Variable-driven base rule for px() TS helper
// ---------------------------------------------------------------------------

function emitPixelCornerBase() {
  const bw = borderWidth();
  const lines = [];

  // --- Host element mask (.pixel-corner) ---
  lines.push('/* Only add position:relative when element is not already positioned */');
  lines.push('.pixel-corner:not(.absolute, .fixed, .sticky) {');
  lines.push(indent(1, 'position: relative;'));
  lines.push('}');
  lines.push('');
  lines.push('.pixel-corner {');
  lines.push(indent(1, 'border-radius: 0;'));
  lines.push('');
  lines.push(indent(1, '/* Reset all px vars so nested .pixel-corner elements never inherit masks from ancestors. */'));
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
  lines.push(indent(1, '/* Standard (Firefox) — 5 layers: base rect + 4 corner covers (subtract) */'));
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
  lines.push('');
  lines.push(indent(1, '/* WebKit (Chrome/Safari) — reversed layer order, destination-out */'));
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

  lines.push('');

  // --- Border ring (.pixel-corner::after) ---
  lines.push('.pixel-corner::after {');
  lines.push(indent(1, "content: '';"));
  lines.push(indent(1, 'position: absolute;'));
  lines.push(indent(1, 'inset: 0;'));
  lines.push(indent(1, 'pointer-events: none;'));
  lines.push(indent(1, 'z-index: 2;'));
  lines.push(indent(1, 'background-color: var(--color-line);'));
  lines.push('');
  lines.push(indent(1, '/* Standard (Firefox) — 8 layers: 4 corner borders + 4 edge strips */'));
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
  lines.push('');
  lines.push(indent(1, '/* WebKit (Chrome/Safari) — same order, all additive */'));
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

// ---------------------------------------------------------------------------
// Legacy alias emitter
// ---------------------------------------------------------------------------

function emitLegacyAlias(legacySuffix, data) {
  const className = `.pixel-rounded-${legacySuffix}`;
  const { gridSize } = data;
  // We compute a unique suffix for the legacy custom properties to avoid
  // collisions with numeric sizes that might share the same grid size.
  // If the gridSize matches a numeric size, reuse those properties.
  // Otherwise, use the t-shirt suffix for the properties.
  const suffix = legacySuffix;
  const lines = [];

  lines.push(`/* DEPRECATED: .pixel-rounded-${legacySuffix} — migrate to numeric scale */`);
  lines.push(emitHostMask(className, suffix, gridSize));
  lines.push('');
  lines.push(emitAfterMask(className, suffix, gridSize));

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main render function
// ---------------------------------------------------------------------------

export function renderPixelCornersGeneratedCss() {
  const blocks = [GENERATED_FILE_BANNER];

  // 1. Compute mask data for all numeric sizes (circle shape)
  const numericEntries = NUMERIC_SIZES.map(({ suffix, gridSize, shape }) => ({
    suffix,
    data: computeSizeMaskData(gridSize, shape),
  }));

  // 2. Compute mask data for pixel-rounded-full (same as 20)
  const fullEntry = {
    suffix: FULL_SIZE.suffix,
    data: computeSizeMaskData(FULL_SIZE.gridSize),
  };

  // 3. Compute mask data for legacy aliases
  const legacyEntries = LEGACY_ALIASES.map(({ suffix, radius }) => ({
    suffix,
    data: computeSizeMaskData(radius + 1),
  }));

  // Determine which legacy entries need their own custom properties
  // (those whose gridSize doesn't match any numeric size).
  const numericGridSizes = new Set(NUMERIC_SIZES.map((s) => s.gridSize));
  // Also include "full"
  numericGridSizes.add(FULL_SIZE.gridSize);

  const legacyEntriesNeedingProps = legacyEntries.filter(
    ({ data }) => !numericGridSizes.has(data.gridSize),
  );

  // 5. Emit :root custom properties
  blocks.push(emitCustomProperties([
    ...numericEntries,
    fullEntry,
    ...legacyEntriesNeedingProps,
  ]));

  // 5.5. Variable-driven base rule for px() helper
  blocks.push('/* ============================================================================');
  blocks.push('   .pixel-corner — variable-driven base for px() TS helper');
  blocks.push('   ============================================================================ */');
  blocks.push(emitPixelCornerBase());

  // 6. All class names for shared base
  const allClassNames = [
    ...numericEntries.map(({ suffix }) => `.pixel-rounded-${suffix}`),
    `.pixel-rounded-${FULL_SIZE.suffix}`,
    ...legacyEntries.map(({ suffix }) => `.pixel-rounded-${suffix}`),
  ];
  // Deduplicate (e.g. if a legacy suffix matches a numeric one)
  const uniqueClassNames = [...new Set(allClassNames)];
  blocks.push(emitSharedBase(uniqueClassNames));

  // 7. Per-size host clipping + ::after rules (numeric circle shapes)
  for (const { suffix, data } of numericEntries) {
    const className = `.pixel-rounded-${suffix}`;
    blocks.push(emitHostMask(className, suffix, data.gridSize));
    blocks.push(emitAfterMask(className, suffix, data.gridSize));
  }

  // 8. pixel-rounded-full
  {
    const className = `.pixel-rounded-${FULL_SIZE.suffix}`;
    blocks.push(emitHostMask(className, FULL_SIZE.suffix, fullEntry.data.gridSize));
    blocks.push(emitAfterMask(className, FULL_SIZE.suffix, fullEntry.data.gridSize));
  }

  // 9. Legacy aliases
  blocks.push('/* ============================================================================');
  blocks.push('   Deprecated t-shirt aliases — migrate to numeric scale');
  blocks.push('   xs→2, sm→(no exact match), md→(no exact match), lg→12, xl→(no exact match)');
  blocks.push('   ============================================================================ */');

  for (const { suffix, data } of legacyEntries) {
    // Check if this legacy suffix already matches a numeric class name
    const matchesNumeric = NUMERIC_SIZES.some((n) => n.suffix === suffix);
    if (matchesNumeric) {
      // The numeric rule already exists, just emit an alias comment
      blocks.push(`/* .pixel-rounded-${suffix} — already defined as numeric size above */`);
      continue;
    }
    // For legacy entries whose gridSize matches a numeric one, we reuse numeric props
    const matchingNumeric = NUMERIC_SIZES.find((n) => n.gridSize === data.gridSize);
    if (matchingNumeric) {
      // Reuse the numeric suffix for custom property references
      const className = `.pixel-rounded-${suffix}`;
      blocks.push(`/* DEPRECATED: .pixel-rounded-${suffix} — same geometry as pixel-rounded-${matchingNumeric.suffix} */`);
      blocks.push(emitHostMask(className, matchingNumeric.suffix, data.gridSize));
      blocks.push(emitAfterMask(className, matchingNumeric.suffix, data.gridSize));
    } else {
      // Unique grid size — uses its own custom properties
      blocks.push(emitLegacyAlias(suffix, data));
    }
  }

  return `${blocks.filter(Boolean).join('\n\n')}\n`;
}
