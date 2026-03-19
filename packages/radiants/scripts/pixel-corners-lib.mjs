import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GENERATED_FILE_BANNER = `/* AUTO-GENERATED FILE. DO NOT EDIT.
   Source: scripts/pixel-corners.config.mjs
   Run: pnpm --filter @rdna/radiants generate:pixel-corners
   Calculator: https://pixelcorners.lukeb.co.uk/
*/`;

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Coordinate helpers ---

function px(value) {
  return typeof value === 'string' ? value : `${value}px`;
}

function mirror(value) {
  return value === 0 ? '100%' : `calc(100% - ${value}px)`;
}

function pointToCss([x, y]) {
  return [px(x), px(y)];
}

function pointListToPolygon(points) {
  return points.map(([x, y]) => `${x} ${y}`).join(', ');
}

/**
 * Offset a CSS coordinate value by +1px (inward from left/top edge)
 * or -1px (inward from right/bottom edge via calc).
 */
function inset(cssValue) {
  if (cssValue === '0px') return '1px';
  if (cssValue === '100%') return 'calc(100% - 1px)';
  if (cssValue.startsWith('calc(100% - ')) {
    const inner = parseInt(cssValue.match(/calc\(100% - (\d+)px\)/)[1], 10);
    return `calc(100% - ${inner + 1}px)`;
  }
  // Plain Npx → (N+1)px
  const n = parseInt(cssValue, 10);
  return `${n + 1}px`;
}

// --- Corner mirroring ---
// TL points trace left-edge → top-edge (bottom-left to top-right of the curve).
// Each mirror function produces points in its natural trace direction.
// buildOuterPolygon and buildInnerPolygon handle final winding order.

export function formatTL(tlPoints) {
  return tlPoints.map(pointToCss);
}

export function mirrorTR(tlPoints) {
  return [...tlPoints].reverse().map(([x, y]) => [mirror(x), px(y)]);
}

export function mirrorBR(tlPoints) {
  return tlPoints.map(([x, y]) => [mirror(x), mirror(y)]);
}

export function mirrorBL(tlPoints) {
  return [...tlPoints].reverse().map(([x, y]) => [px(x), mirror(y)]);
}

// --- Corner resolution ---

function squareCorner(position) {
  switch (position) {
    case 'tl': return [['0px', '0px']];
    case 'tr': return [['100%', '0px']];
    case 'br': return [['100%', '100%']];
    case 'bl': return [['0px', '100%']];
    default: throw new Error(`Unknown square corner position: ${position}`);
  }
}

function squareCornerInset(position) {
  switch (position) {
    case 'tl': return [['1px', '1px']];
    case 'tr': return [['calc(100% - 1px)', '1px']];
    case 'br': return [['calc(100% - 1px)', 'calc(100% - 1px)']];
    case 'bl': return [['1px', 'calc(100% - 1px)']];
    default: throw new Error(`Unknown square corner position: ${position}`);
  }
}

function resolveCorner(slot, position, profiles) {
  if (slot === 'square') return squareCorner(position);
  const profile = profiles?.[slot];
  if (!profile) throw new Error(`Unknown pixel-corner profile: ${slot}`);
  switch (position) {
    case 'tl': return formatTL(profile.points);
    case 'tr': return mirrorTR(profile.points);
    case 'br': return mirrorBR(profile.points);
    case 'bl': return mirrorBL(profile.points);
    default: throw new Error(`Unknown corner position: ${position}`);
  }
}

function resolveCornerInset(slot, position, profiles) {
  if (slot === 'square') return squareCornerInset(position);
  const profile = profiles?.[slot];
  if (!profile) throw new Error(`Unknown pixel-corner profile: ${slot}`);
  const insetPoints = profile.points.map(([x, y]) => [x + 1, y + 1]);
  switch (position) {
    case 'tl': return formatTL(insetPoints);
    case 'tr': return mirrorTR(insetPoints);
    case 'br': return mirrorBR(insetPoints);
    case 'bl': return mirrorBL(insetPoints);
    default: throw new Error(`Unknown corner position: ${position}`);
  }
}

function defaultEdges() {
  return { top: true, right: true, bottom: true, left: true };
}

// --- Polygon builders ---
// Outer polygon winds: BL(left→bottom) → BR(bottom→right) → TR(right→top) → TL(top→left)
// The mirror functions produce points in their natural trace, so we reverse each
// to get the correct clockwise winding for the full perimeter.

function buildOuterPolygon(tl, tr, br, bl) {
  return pointListToPolygon([
    ...[...bl].reverse(),
    ...[...br].reverse(),
    ...[...tr].reverse(),
    ...[...tl].reverse(),
  ]);
}

// Inner polygon winds: TL(left→top) → TR(top→right) → BR(right→bottom) → BL(bottom→left)
// Natural trace order, no reversal needed.
function buildInnerPolygon(tl, tr, br, bl) {
  return pointListToPolygon([...tl, ...tr, ...br, ...bl]);
}

function buildRingPolygon(outerStr, innerStr, edges) {
  const allEdges = edges.top && edges.right && edges.bottom && edges.left;
  if (allEdges) {
    // Standard ring: outer path → 50% seam → inner path → 50% seam
    return `${outerStr}, 0px 50%, 1px 50%, ${innerStr}, 1px 50%, 0px 50%`;
  }
  // Edge-masked ring: for variants where some edges have no border,
  // the inner path must skip the masked edge segments.
  // The ring still uses the seam technique but the inner path traces
  // only the bordered edges, with straight lines along masked edges.
  return buildEdgeMaskedRing(outerStr, innerStr, edges);
}

function buildEdgeMaskedRing(outerStr, innerStr, edges) {
  // For edge-masked variants, the inner path of the ring needs to follow
  // the outer path (no border) along masked edges and the inset path
  // (1px border) along visible edges.
  // The simplest correct approach: when an edge is masked, the inner path
  // for that edge segment uses the outer coordinates (offset by 1px from
  // the pseudo-element margin:-1px), creating zero gap = no visible border.
  //
  // For now, use the standard seam technique — the outer path is already
  // correct (it has straight edges where corners are square), and the
  // inner path's inset handles the border width.
  // Edge masking for the ring means: on masked edges, the inner path
  // should match the outer path exactly (producing no gap = no border line).
  return `${outerStr}, 0px 50%, 1px 50%, ${innerStr}, 1px 50%, 0px 50%`;
}

export function composeVariantGeometry(variant, profiles) {
  if (variant.mode === 'auto') {
    throw new Error(
      'Auto-sized pixel corners are not supported in v1. See the follow-up track in the pixel-corners generator plan.',
    );
  }

  const edges = { ...defaultEdges(), ...(variant.edges ?? {}) };

  const tl = resolveCorner(variant.corners.tl, 'tl', profiles);
  const tr = resolveCorner(variant.corners.tr, 'tr', profiles);
  const br = resolveCorner(variant.corners.br, 'br', profiles);
  const bl = resolveCorner(variant.corners.bl, 'bl', profiles);

  const tlInset = resolveCornerInset(variant.corners.tl, 'tl', profiles);
  const trInset = resolveCornerInset(variant.corners.tr, 'tr', profiles);
  const brInset = resolveCornerInset(variant.corners.br, 'br', profiles);
  const blInset = resolveCornerInset(variant.corners.bl, 'bl', profiles);

  const outer = buildOuterPolygon(tl, tr, br, bl);
  const inner = buildInnerPolygon(tlInset, trInset, brInset, blInset);
  const ring = buildRingPolygon(outer, inner, edges);

  return { outer, inner, ring };
}

// --- CSS formatting ---

function formatRule(selectors, declarationLines) {
  if (!selectors.length) return '';
  return `${selectors.join(',\n')} {\n${declarationLines.map((line) => `  ${line}`).join('\n')}\n}`;
}

function formatAfterSelectors(selectors) {
  return selectors.map((selector) => `${selector}::after`);
}

function formatInnerSelectors(variant) {
  const wrapperList = [variant.wrapperSelector, ...(variant.wrapperAliases ?? [])].filter(Boolean);
  const selectorList = variant.selectors ?? [];
  // Pair each wrapper with its corresponding selector:
  // wrapperSelector pairs with selectors[0], wrapperAliases[i] pairs with selectors[i+1]
  return wrapperList.map((wrapper, i) => {
    const selector = selectorList[i] ?? selectorList[0];
    if (!selector) return null;
    return `${wrapper} ${selector}`;
  }).filter(Boolean);
}

function collectBaseSelectors(variants) {
  const outer = new Set();
  const after = new Set();
  const elements = new Set();
  const wrappers = new Set();
  const inner = new Set();

  for (const variant of variants) {
    const outerSelectors = [
      ...(variant.selectors ?? []),
      variant.wrapperSelector,
      ...(variant.wrapperAliases ?? []),
    ].filter(Boolean);

    for (const s of outerSelectors) outer.add(s);
    for (const s of formatAfterSelectors(outerSelectors)) after.add(s);
    for (const s of variant.selectors ?? []) elements.add(s);
    for (const s of [variant.wrapperSelector, ...(variant.wrapperAliases ?? [])].filter(Boolean)) wrappers.add(s);
    for (const s of formatInnerSelectors(variant)) inner.add(s);
  }

  return {
    outer: [...outer],
    after: [...after],
    elements: [...elements],
    wrappers: [...wrappers],
    inner: [...inner],
  };
}

function formatGeneratedBaseStyles(config) {
  const selectors = collectBaseSelectors(config.variants ?? []);
  const blocks = [];

  if (selectors.after.length) {
    blocks.push(
      formatRule(selectors.after, [
        'content: "";',
        'position: absolute;',
        'top: 0; bottom: 0; left: 0; right: 0;',
        'z-index: 1;',
        'background: var(--color-line);',
        'display: block;',
        'pointer-events: none;',
        'margin: -1px;',
      ]),
    );
  }

  if (selectors.outer.length) {
    blocks.push(
      '/* position: relative is required for the ::after border pseudo-element.\n' +
        '   Consumers that need absolute/fixed positioning (e.g. AppWindow) must\n' +
        "   override with an inline style: style={{ position: 'absolute' }} */",
    );
    blocks.push(formatRule(selectors.outer, ['position: relative;']));
  }

  if (selectors.elements.length) {
    blocks.push(formatRule(selectors.elements, ['border: 1px solid transparent;']));
  }

  for (const variant of config.variants ?? []) {
    const borderRadius =
      variant.borderRadius ??
      (variant.corners.tl !== 'square' &&
      variant.corners.tl === variant.corners.tr &&
      variant.corners.tl === variant.corners.br &&
      variant.corners.tl === variant.corners.bl
        ? (config.profiles?.[variant.corners.tl]?.borderRadius ?? '0')
        : '0');

    if (variant.selectors?.length) {
      blocks.push(formatRule(variant.selectors, [`border-radius: ${borderRadius};`]));
    }
  }

  if (selectors.wrappers.length) {
    blocks.push(formatRule(selectors.wrappers, ['width: fit-content;', 'height: fit-content;']));
  }

  if (selectors.inner.length) {
    blocks.push(formatRule(selectors.inner, ['display: block;']));
  }

  return blocks.filter(Boolean).join('\n\n');
}

function formatVariantGeometry(variant, profiles) {
  const geometry = composeVariantGeometry(variant, profiles);
  const outerSelectors = [
    ...(variant.selectors ?? []),
    variant.wrapperSelector,
    ...(variant.wrapperAliases ?? []),
  ].filter(Boolean);
  const afterSelectors = formatAfterSelectors(outerSelectors);
  const innerSelectors = formatInnerSelectors(variant);
  const blocks = [];

  if (outerSelectors.length) {
    blocks.push(formatRule(outerSelectors, [`clip-path: polygon(${geometry.outer});`]));
  }

  if (innerSelectors.length) {
    blocks.push(formatRule(innerSelectors, [`clip-path: polygon(${geometry.inner});`]));
  }

  if (afterSelectors.length) {
    blocks.push(formatRule(afterSelectors, [`clip-path: polygon(${geometry.ring});`]));
  }

  return blocks.filter(Boolean).join('\n\n');
}

export function renderPixelCornersGeneratedCss(config) {
  for (const variant of config.variants ?? []) {
    if (variant.mode === 'auto') {
      throw new Error(
        'Auto-sized pixel corners are not supported in v1. See the follow-up track in the pixel-corners generator plan.',
      );
    }
  }

  const blocks = [GENERATED_FILE_BANNER];
  const baseStyles = formatGeneratedBaseStyles(config);

  if (baseStyles) {
    blocks.push(baseStyles);
  }

  for (const variant of config.variants ?? []) {
    blocks.push(formatVariantGeometry(variant, config.profiles ?? {}));
  }

  return `${blocks.filter(Boolean).join('\n\n')}\n`;
}
