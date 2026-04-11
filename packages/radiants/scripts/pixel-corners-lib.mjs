import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GENERATED_FILE_BANNER = `/* AUTO-GENERATED FILE. DO NOT EDIT.
   Source: scripts/pixel-corners.config.mjs
   Run: pnpm --filter @rdna/radiants generate:pixel-corners
   Calculator: https://pixelcorners.lukeb.co.uk/
*/`;

const __dirname = dirname(fileURLToPath(import.meta.url));

function pushUnique(points, nextPoint) {
  const lastPoint = points[points.length - 1];
  if (!lastPoint || lastPoint[0] !== nextPoint[0] || lastPoint[1] !== nextPoint[1]) {
    points.push(nextPoint);
  }
}

function collectRowRuns(bits, width, height) {
  const rows = [];

  for (let y = 0; y < height; y += 1) {
    let left = -1;
    let right = -1;

    for (let x = 0; x < width; x += 1) {
      if (bits[y * width + x] !== '1') continue;
      if (left === -1) left = x;
      right = x;
    }

    if (left === -1) continue;

    for (let x = left; x <= right; x += 1) {
      if (bits[y * width + x] !== '1') {
        throw new Error(`Non-contiguous pixel row at y=${y}`);
      }
    }

    rows.push({ y, left, right });
  }

  return rows;
}

function traceOuterPointsFromRuns(rows) {
  if (!rows.length) throw new Error('Cannot derive outer points from an empty grid');

  const bottom = rows[rows.length - 1];
  const points = [
    [bottom.left, bottom.y + 1],
    [bottom.right + 1, bottom.y + 1],
  ];

  let currentX = bottom.right + 1;
  let groupRight = bottom.right;
  let groupTop = bottom.y;

  for (let index = rows.length - 2; index >= 0; index -= 1) {
    const row = rows[index];
    if (row.right === groupRight) {
      groupTop = row.y;
      continue;
    }

    pushUnique(points, [currentX, groupTop]);
    currentX = row.right + 1;
    pushUnique(points, [currentX, groupTop]);
    groupRight = row.right;
    groupTop = row.y;
  }

  pushUnique(points, [currentX, groupTop]);
  return points;
}

function traceInnerPointsFromRuns(rows) {
  if (!rows.length) throw new Error('Cannot derive inner points from an empty grid');

  const bottom = rows[rows.length - 1];
  const top = rows[0];
  const points = [
    [bottom.left, bottom.y + 1],
    [bottom.left + 1, bottom.y + 1],
  ];

  let currentX = bottom.left + 1;
  let groupLeft = bottom.left;
  let groupTop = bottom.y;

  for (let index = rows.length - 2; index >= 0; index -= 1) {
    const row = rows[index];
    if (row.left === groupLeft) {
      groupTop = row.y;
      continue;
    }

    pushUnique(points, [currentX, groupTop + 1]);
    currentX = row.left + 1;
    pushUnique(points, [currentX, groupTop + 1]);
    groupLeft = row.left;
    groupTop = row.y;
  }

  pushUnique(points, [currentX, groupTop + 1]);

  const topRightX = top.right + 1;
  pushUnique(points, [topRightX, groupTop + 1]);
  pushUnique(points, [topRightX, top.y]);

  return points;
}

function buildInteriorBits(cornerSet) {
  const borderBits = cornerSet.border?.bits ?? ''.padEnd(cornerSet.tl.bits.length, '0');
  return [...cornerSet.tl.bits].map((bit, index) => (
    bit === '0' && borderBits[index] !== '1' ? '1' : '0'
  )).join('');
}

export function buildProfileFromCornerSet(cornerSet, options = {}) {
  if (!cornerSet?.border) {
    throw new Error(`Corner set "${cornerSet?.name ?? 'unknown'}" is missing a border grid`);
  }

  const { width, height } = cornerSet.tl;
  const borderRows = collectRowRuns(cornerSet.border.bits, width, height);
  const innerRows = collectRowRuns(buildInteriorBits(cornerSet), width, height);

  return {
    radius: options.radius ?? width - 1,
    borderRadius: options.borderRadius ?? `${width + 1}px`,
    points: traceOuterPointsFromRuns(borderRows),
    innerPoints: traceInnerPointsFromRuns(innerRows),
    ...(options.scale ? { scale: options.scale } : {}),
  };
}

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

function scalePoints(points, scale) {
  if (!scale || scale === 1) return points;
  return points.map(([x, y]) => [x * scale, y * scale]);
}

function resolveCorner(slot, position, profiles) {
  if (slot === 'square') return squareCorner(position);
  const profile = profiles?.[slot];
  if (!profile) throw new Error(`Unknown pixel-corner profile: ${slot}`);
  const pts = scalePoints(profile.points, profile.scale);
  switch (position) {
    case 'tl': return formatTL(pts);
    case 'tr': return mirrorTR(pts);
    case 'br': return mirrorBR(pts);
    case 'bl': return mirrorBL(pts);
    default: throw new Error(`Unknown corner position: ${position}`);
  }
}

function resolveCornerInset(slot, position, profiles) {
  if (slot === 'square') return squareCornerInset(position);
  const profile = profiles?.[slot];
  if (!profile) throw new Error(`Unknown pixel-corner profile: ${slot}`);
  const insetPoints = profile.innerPoints;
  if (!insetPoints) throw new Error(`Profile "${slot}" missing innerPoints`);
  const pts = scalePoints(insetPoints, profile.scale);
  switch (position) {
    case 'tl': return formatTL(pts);
    case 'tr': return mirrorTR(pts);
    case 'br': return mirrorBR(pts);
    case 'bl': return mirrorBL(pts);
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

function buildRingPolygon(outerStr, edges, tl, tr, br, bl, tlInset, trInset, brInset, blInset) {
  const allEdges = edges.top && edges.right && edges.bottom && edges.left;
  const innerStr = allEdges
    ? buildInnerPolygon(tlInset, trInset, brInset, blInset)
    : buildEdgeMaskedInnerRing(edges, tlInset, trInset, brInset, blInset);
  // Seam x must match the inner polygon's leftmost x-coordinate (TL inner first point).
  // At scale=1 this is 1px; at scale=N the inner points are N px from the left edge.
  const seamX = tlInset[0][0];
  return `${outerStr}, 0px 50%, ${seamX} 50%, ${innerStr}, ${seamX} 50%, 0px 50%`;
}

/**
 * Build the inner path of a ring polygon with edge masking.
 * When an edge is masked (false), the corner on that side collapses to a
 * single junction point using the outer coordinate on the masked axis
 * and the inset coordinate on the bordered axis. This creates zero gap
 * between outer and inner = no visible border on that edge.
 */
function buildEdgeMaskedInnerRing(edges, tlInset, trInset, brInset, blInset) {
  const points = [];

  // TL corner: use full inset staircase when both left and top are bordered
  if (edges.left && edges.top) {
    points.push(...tlInset);
  } else {
    points.push([
      edges.left ? '1px' : '0px',
      edges.top ? '1px' : '0px',
    ]);
  }

  // TR corner: use full inset staircase when both top and right are bordered
  if (edges.top && edges.right) {
    points.push(...trInset);
  } else {
    points.push([
      edges.right ? 'calc(100% - 1px)' : '100%',
      edges.top ? '1px' : '0px',
    ]);
  }

  // BR corner: use full inset staircase when both right and bottom are bordered
  if (edges.right && edges.bottom) {
    points.push(...brInset);
  } else {
    points.push([
      edges.right ? 'calc(100% - 1px)' : '100%',
      edges.bottom ? 'calc(100% - 1px)' : '100%',
    ]);
  }

  // BL corner: use full inset staircase when both bottom and left are bordered
  if (edges.bottom && edges.left) {
    points.push(...blInset);
  } else {
    points.push([
      edges.left ? '1px' : '0px',
      edges.bottom ? 'calc(100% - 1px)' : '100%',
    ]);
  }

  return pointListToPolygon(points);
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
  const ring = buildRingPolygon(outer, edges, tl, tr, br, bl, tlInset, trInset, brInset, blInset);

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
