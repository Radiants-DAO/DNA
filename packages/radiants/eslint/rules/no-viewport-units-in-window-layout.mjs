/**
 * rdna/no-viewport-units-in-window-layout
 * RadOS window content should size to its app window/container, not the browser
 * viewport. Use full/inset/container utilities instead of screen units/fixed.
 */
import {
  getClassNameStrings,
  getObjectPropertyKey,
  getStaticStringValue,
  getStyleObjectExpression,
  isInsideClassNameAttribute,
} from '../utils.mjs';

const SCREEN_UTILITY_RE = /(?:^|\s)((?:[\w-]+:)*(?:w|h|min-w|min-h|max-w|max-h)-screen)(?=\s|$)/g;
const VIEWPORT_UNIT_RE = /\b-?\d*\.?\d+(?:svw|lvw|dvw|vw|svh|lvh|dvh|vh|vmin|vmax)\b/i;
const ARBITRARY_VIEWPORT_RE = /(?:^|\s)((?:[\w-]+:)*(?:w|h|min-w|min-h|max-w|max-h|inset|top|right|bottom|left)-\[[^\]]*(?:svw|lvw|dvw|vw|svh|lvh|dvh|vh|vmin|vmax)[^\]]*\])(?=\s|$)/gi;
const FIXED_CLASS_RE = /(?:^|\s)((?:[\w-]+:)*fixed)(?=\s|$)/g;

const VIEWPORT_STYLE_PROPS = new Set([
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'inset',
  'top',
  'right',
  'bottom',
  'left',
]);

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban viewport units and fixed positioning in RadOS window layouts',
    },
    messages: {
      screenUtility:
        'Viewport utility "{{raw}}" does not respond to RadOS window size. Use container-relative sizing.',
      viewportUnit:
        'Viewport unit "{{raw}}" does not respond to RadOS window size. Use container-relative sizing.',
      fixedPosition:
        'Fixed positioning is not allowed inside RadOS window content. Use absolute positioning within the window container.',
      viewportUnitStyle:
        'Viewport unit in style prop ({{prop}}) does not respond to RadOS window size.',
      fixedPositionStyle:
        'position: fixed is not allowed inside RadOS window content. Use absolute positioning within the window container.',
    },
    schema: [],
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (isOutsideAppWindowLayout(node)) return;
        if (node.name.name === 'className') checkClassName(context, node.value);
        if (node.name.name === 'style') checkStyle(context, node.value);
      },
      CallExpression(node) {
        if (!isInsideClassNameAttribute(node)) checkClassName(context, node);
      },
    };
  },
};

function checkClassName(context, valueNode) {
  if (!valueNode) return;
  const strings = getClassNameStrings(valueNode);
  for (const { value, node } of strings) {
    reportRegex(context, node, value, SCREEN_UTILITY_RE, 'screenUtility');
    reportRegex(context, node, value, ARBITRARY_VIEWPORT_RE, 'viewportUnit');
    reportRegex(context, node, value, FIXED_CLASS_RE, 'fixedPosition');
  }
}

function isOutsideAppWindowLayout(attributeNode) {
  const openingElement = attributeNode?.parent;
  if (!openingElement || openingElement.type !== 'JSXOpeningElement') return false;

  return openingElement.attributes.some((attr) => {
    if (attr.type !== 'JSXAttribute') return false;
    if (attr.name?.name !== 'data-rdna-window-layout') return false;

    const value = getStaticStringValue(attr.value);
    return value === 'outside-app-window';
  });
}

function reportRegex(context, node, value, regex, messageId) {
  regex.lastIndex = 0;
  let match;
  while ((match = regex.exec(value)) !== null) {
    context.report({
      node,
      messageId,
      data: { raw: match[1] },
    });
  }
}

function checkStyle(context, valueNode) {
  const expr = getStyleObjectExpression(valueNode);
  if (!expr) return;

  for (const prop of expr.properties) {
    const key = getObjectPropertyKey(prop);
    if (key === 'position') {
      const position = getStaticStringValue(prop.value);
      if (position === 'fixed') {
        context.report({ node: prop.value, messageId: 'fixedPositionStyle' });
      }
      continue;
    }

    if (!VIEWPORT_STYLE_PROPS.has(key)) continue;

    const value = getStaticStringValue(prop.value);
    if (typeof value === 'string' && VIEWPORT_UNIT_RE.test(value)) {
      context.report({
        node: prop.value,
        messageId: 'viewportUnitStyle',
        data: { prop: key },
      });
    }
  }
}

export default rule;
