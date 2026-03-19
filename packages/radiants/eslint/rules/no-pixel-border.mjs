/**
 * rdna/no-pixel-border
 *
 * Flags `border-*` (non-neutral) and `overflow-hidden` when used on
 * pixel-cornered elements (pixel-rounded-* or pixel-corners).
 *
 * Why: pixel-rounded-* uses clip-path (corners) + ::after (visible border).
 *   - Adding `border-*` creates a native CSS border that clip-path clips at edges
 *     — borders visually cut off, especially on right/bottom.
 *   - Adding `overflow-hidden` clips the ::after pseudo-element that draws the border
 *     — border partially or fully disappears.
 *
 * Fixes:
 *   - Remove `border-*` — ::after on pixel-rounded-* handles the visible border.
 *   - Remove `overflow-hidden` — clip-path on pixel-rounded-* handles overflow.
 *   - For small non-decorative elements (swatches, indicators), use `rounded-*`
 *     (standard Tailwind radius) instead of `pixel-rounded-*` so border/overflow work normally.
 */
import {
  getClassNameStrings,
  isInsideClassNameAttribute,
} from '../utils.mjs';

// Pixel-corner classes that trigger clip-path
const PIXEL_CORNER_RE = /(?:^|\s)(?:[\w-]+:)*(?:pixel-rounded-(?:xs|sm|md|lg|xl)|pixel-corners)(?:\s|$)/;

// Border classes that create native CSS borders (clipped by clip-path)
// Matches: border, border-{side}, border-{color}, border-{width} — excludes border-none/border-0/border-transparent
const CLIPPABLE_BORDER_RE = /(?:^|\s)((?:[\w-]+:)*border(?:-(?!none|0|transparent|collapse|separate|spacing|style|hidden)[\w-]+)?)(?=\s|$)/g;

// overflow-hidden clips ::after pseudo-element on pixel-cornered elements
const OVERFLOW_HIDDEN_RE = /(?:^|\s)((?:[\w-]+:)*overflow-hidden)(?:\s|$)/;

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban border-* and overflow-hidden on pixel-cornered elements (pixel-rounded-*/pixel-corners). ::after handles borders; clip-path handles overflow.',
    },
    messages: {
      clippedBorder:
        '"{{cls}}" will be clipped by clip-path on this pixel-cornered element ({{corner}}). Remove it — ::after on {{corner}} renders the visible border.',
      clippedOverflow:
        '"overflow-hidden" clips the ::after border on this pixel-cornered element ({{corner}}). Remove it — clip-path on {{corner}} handles overflow.',
    },
    schema: [],
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name !== 'className') return;
        checkElement(context, node);
      },
      CallExpression(node) {
        if (!isInsideClassNameAttribute(node)) {
          checkCallExpression(context, node);
        }
      },
    };
  },
};

function checkElement(context, attrNode) {
  const strings = getClassNameStrings(attrNode.value);
  const fullClassName = strings.map((s) => s.value).join(' ');

  const hasPixelCorner = PIXEL_CORNER_RE.test(fullClassName);
  if (!hasPixelCorner) return;

  const cornerMatch =
    fullClassName.match(/pixel-rounded-(?:xs|sm|md|lg|xl)|pixel-corners/)?.[0] ?? 'pixel-rounded';

  // Check border-* classes
  const borders = extractBorders(fullClassName);
  for (const cls of borders) {
    const reportNode = findStringNode(strings, cls) ?? attrNode;
    context.report({
      node: reportNode,
      messageId: 'clippedBorder',
      data: { cls, corner: cornerMatch },
    });
  }

  // Check overflow-hidden
  const overflowMatch = OVERFLOW_HIDDEN_RE.exec(fullClassName);
  if (overflowMatch) {
    const cls = overflowMatch[1].trim();
    const reportNode = findStringNode(strings, cls) ?? attrNode;
    context.report({
      node: reportNode,
      messageId: 'clippedOverflow',
      data: { corner: cornerMatch },
    });
  }
}

function checkCallExpression(context, node) {
  const strings = getClassNameStrings(node);
  const fullClassName = strings.map((s) => s.value).join(' ');

  const hasPixelCorner = PIXEL_CORNER_RE.test(fullClassName);
  if (!hasPixelCorner) return;

  const cornerMatch =
    fullClassName.match(/pixel-rounded-(?:xs|sm|md|lg|xl)|pixel-corners/)?.[0] ?? 'pixel-rounded';

  const borders = extractBorders(fullClassName);
  for (const cls of borders) {
    const reportNode = findStringNode(strings, cls) ?? node;
    context.report({
      node: reportNode,
      messageId: 'clippedBorder',
      data: { cls, corner: cornerMatch },
    });
  }

  const overflowMatch = OVERFLOW_HIDDEN_RE.exec(fullClassName);
  if (overflowMatch) {
    const cls = overflowMatch[1].trim();
    const reportNode = findStringNode(strings, cls) ?? node;
    context.report({
      node: reportNode,
      messageId: 'clippedOverflow',
      data: { corner: cornerMatch },
    });
  }
}

function extractBorders(className) {
  const results = [];
  CLIPPABLE_BORDER_RE.lastIndex = 0;
  let match;
  while ((match = CLIPPABLE_BORDER_RE.exec(className)) !== null) {
    results.push(match[1].trim());
  }
  return results;
}

function findStringNode(strings, target) {
  for (const { value, node } of strings) {
    if (value.includes(target)) return node;
  }
  return null;
}

export default rule;
