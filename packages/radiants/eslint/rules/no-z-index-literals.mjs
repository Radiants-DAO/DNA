/**
 * rdna/no-z-index-literals
 * RadOS layering should use named z-index tokens instead of numeric literals.
 */
import {
  getClassNameStrings,
  getObjectPropertyKey,
  getStaticStringValue,
  getStyleObjectExpression,
  isInsideClassNameAttribute,
} from '../utils.mjs';

const VALID_Z_CLASSES = new Set([
  'z-auto',
  'z-base',
  'z-desktop',
  'z-windows',
  'z-chrome',
  'z-menus',
  'z-toasts',
  'z-modals',
  'z-system',
]);
const VALID_Z_VARS = new Set([
  '--z-index-base',
  '--z-index-desktop',
  '--z-index-windows',
  '--z-index-chrome',
  '--z-index-menus',
  '--z-index-toasts',
  '--z-index-modals',
  '--z-index-system',
]);

const Z_CLASS_RE = /(?:^|\s)((?:[\w-]+:)*-?z-(?:\[[^\]]+\]|-?\d+|auto|[a-z][a-z0-9-]*))(?=\s|$)/g;

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban numeric z-index classes and style literals; use named RDNA layer tokens',
    },
    messages: {
      rawZIndexClass:
        'Raw z-index "{{raw}}" is not allowed. Use a named RDNA layer token such as z-menus or z-modals.',
      rawZIndexStyle:
        'Raw z-index style value is not allowed. Use var(--z-index-*).',
    },
    schema: [],
  },

  create(context) {
    return {
      JSXAttribute(node) {
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
    Z_CLASS_RE.lastIndex = 0;
    let match;
    while ((match = Z_CLASS_RE.exec(value)) !== null) {
      const raw = match[1];
      const bare = raw.replace(/^(?:[\w-]+:)+/, '');
      if (VALID_Z_CLASSES.has(bare)) continue;
      context.report({
        node,
        messageId: 'rawZIndexClass',
        data: { raw },
      });
    }
  }
}

function checkStyle(context, valueNode) {
  const expr = getStyleObjectExpression(valueNode);
  if (!expr) return;

  for (const prop of expr.properties) {
    const key = getObjectPropertyKey(prop);
    if (key !== 'zIndex' && key !== '--z-index-local') continue;

    const value = getStaticStringValue(prop.value);
    if (typeof value === 'string' && isKnownZIndexVar(value)) continue;

    context.report({
      node: prop.value,
      messageId: 'rawZIndexStyle',
    });
  }
}

function isKnownZIndexVar(value) {
  const match = value.trim().match(/^var\(\s*(--z-index-[a-z0-9-]+)\s*\)$/);
  return match ? VALID_Z_VARS.has(match[1]) : false;
}

export default rule;
