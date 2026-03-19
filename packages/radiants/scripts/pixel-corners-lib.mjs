import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const GENERATED_FILE_BANNER = `/* AUTO-GENERATED FILE. DO NOT EDIT.
   Source: scripts/pixel-corners.config.mjs
   Run: pnpm --filter @rdna/radiants generate:pixel-corners
   Calculator: https://pixelcorners.lukeb.co.uk/
*/`;

function px(value) {
  return typeof value === 'string' ? value : `${value}px`;
}

function mirrorX(value) {
  return value === 0 ? '100%' : `calc(100% - ${value}px)`;
}

function mirrorY(value) {
  return value === 0 ? '100%' : `calc(100% - ${value}px)`;
}

function pointToCss([x, y]) {
  return [px(x), px(y)];
}

function pointListToPolygon(points) {
  return points.map(([x, y]) => `${x} ${y}`).join(', ');
}

function reversePoints(points) {
  return [...points].reverse();
}

export function formatTL(tlPoints) {
  return tlPoints.map(pointToCss);
}

export function mirrorTR(tlPoints) {
  return reversePoints(tlPoints).map(([x, y]) => [mirrorX(x), px(y)]);
}

export function mirrorBR(tlPoints) {
  return tlPoints.map(([x, y]) => [mirrorX(x), mirrorY(y)]);
}

export function mirrorBL(tlPoints) {
  return reversePoints(tlPoints).map(([x, y]) => [px(x), mirrorY(y)]);
}

function squareCorner(position) {
  switch (position) {
    case 'tl':
      return [['0px', '0px']];
    case 'tr':
      return [['100%', '0px']];
    case 'br':
      return [['100%', '100%']];
    case 'bl':
      return [['0px', '100%']];
    default:
      throw new Error(`Unknown square corner position: ${position}`);
  }
}

function resolveCorner(slot, position, profiles) {
  if (slot === 'square') {
    return squareCorner(position);
  }

  const profile = profiles?.[slot];

  if (!profile) {
    throw new Error(`Unknown pixel-corner profile: ${slot}`);
  }

  switch (position) {
    case 'tl':
      return formatTL(profile.points);
    case 'tr':
      return mirrorTR(profile.points);
    case 'br':
      return mirrorBR(profile.points);
    case 'bl':
      return mirrorBL(profile.points);
    default:
      throw new Error(`Unknown corner position: ${position}`);
  }
}

function defaultEdges() {
  return { top: true, right: true, bottom: true, left: true };
}

function buildOuterPolygon(tl, tr, br, bl) {
  return pointListToPolygon([
    ...reversePoints(bl),
    ...reversePoints(br),
    ...reversePoints(tr),
    ...reversePoints(tl),
  ]);
}

function buildInnerPolygon(tl, tr, br, bl) {
  return pointListToPolygon([...tl, ...tr, ...br, ...bl]);
}

function buildRingPolygon(outer, inner) {
  return `${outer}, 0px 50%, 1px 50%, ${inner}, 1px 50%, 0px 50%`;
}

export function composeVariantGeometry(variant, profiles) {
  if (variant.mode === 'auto') {
    throw new Error(
      'Auto-sized pixel corners are not supported in v1. See the follow-up track in the pixel-corners generator plan.',
    );
  }

  const edges = { ...defaultEdges(), ...(variant.edges ?? {}) };
  void edges;

  const tl = resolveCorner(variant.corners.tl, 'tl', profiles);
  const tr = resolveCorner(variant.corners.tr, 'tr', profiles);
  const br = resolveCorner(variant.corners.br, 'br', profiles);
  const bl = resolveCorner(variant.corners.bl, 'bl', profiles);

  const outer = buildOuterPolygon(tl, tr, br, bl);
  const inner = buildInnerPolygon(tl, tr, br, bl);
  const ring = buildRingPolygon(outer, inner);

  return { outer, inner, ring };
}

function formatRule(selectors, declarationLines) {
  if (!selectors.length) {
    return '';
  }

  return `${selectors.join(',\n')} {\n${declarationLines.map((line) => `  ${line}`).join('\n')}\n}`;
}

function formatAfterSelectors(selectors) {
  return selectors.map((selector) => `${selector}::after`);
}

function formatInnerSelectors(variant) {
  const wrappers = [variant.wrapperSelector, ...(variant.wrapperAliases ?? [])].filter(Boolean);
  return wrappers.map((wrapper) => {
    const primarySelector = variant.selectors?.[0];
    if (!primarySelector) {
      return null;
    }
    return `${wrapper} ${primarySelector}`;
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

    for (const selector of outerSelectors) {
      outer.add(selector);
    }

    for (const selector of formatAfterSelectors(outerSelectors)) {
      after.add(selector);
    }

    for (const selector of variant.selectors ?? []) {
      elements.add(selector);
    }

    for (const selector of [variant.wrapperSelector, ...(variant.wrapperAliases ?? [])].filter(Boolean)) {
      wrappers.add(selector);
    }

    for (const selector of formatInnerSelectors(variant)) {
      inner.add(selector);
    }
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
        ? config.profiles?.[variant.corners.tl]?.borderRadius
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

function isEmptyConfig(config) {
  return (
    (!config.profiles || Object.keys(config.profiles).length === 0) &&
    (!config.variants || config.variants.length === 0)
  );
}

function readCheckedInGeneratedCss() {
  return readFileSync(join(import.meta.dirname, '..', 'pixel-corners.generated.css'), 'utf8');
}

export function renderPixelCornersGeneratedCss(config) {
  for (const variant of config.variants ?? []) {
    if (variant.mode === 'auto') {
      throw new Error(
        'Auto-sized pixel corners are not supported in v1. See the follow-up track in the pixel-corners generator plan.',
      );
    }
  }

  if (isEmptyConfig(config)) {
    return readCheckedInGeneratedCss();
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
