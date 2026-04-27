/**
 * rdna/no-backdrop-blur
 * Bans backdrop-blur utilities and backdrop-filter in style props.
 * RDNA chrome is opaque — glassmorphism is not part of the design system.
 */
import {
  getClassNameStrings,
  getObjectPropertyKey,
  getStaticStringValue,
  getStyleObjectExpression,
  isDynamicTemplateLiteral,
  isInsideClassNameAttribute,
} from '../utils.mjs';

const BACKDROP_BLUR_CLASS = /\bbackdrop-blur(?:-[a-z0-9]+|-\[[^\]]+\])?\b/g;

const backdropStyleProps = new Set([
  'backdropFilter',
  'WebkitBackdropFilter',
]);

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban backdrop-blur utilities and backdrop-filter in style props. RDNA chrome is opaque.',
    },
    messages: {
      backdropBlurClass:
        'backdrop-blur "{{raw}}" is not allowed. RDNA chrome is opaque — drop the blur.',
      backdropFilterStyle:
        'backdropFilter in style prop is not allowed. RDNA chrome is opaque — drop the blur.',
    },
    schema: [],
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name === 'className') checkClassName(context, node.value);
        if (node.name.name === 'style') checkStyleObject(context, node.value);
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
    BACKDROP_BLUR_CLASS.lastIndex = 0;
    let match;
    while ((match = BACKDROP_BLUR_CLASS.exec(value)) !== null) {
      context.report({
        node,
        messageId: 'backdropBlurClass',
        data: { raw: match[0] },
      });
    }
  }
}

function checkStyleObject(context, valueNode) {
  const expr = getStyleObjectExpression(valueNode);
  if (!expr) return;

  for (const prop of expr.properties) {
    const key = getObjectPropertyKey(prop);
    if (!backdropStyleProps.has(key)) continue;

    const val = prop.value;
    const staticString = getStaticStringValue(val);
    if (staticString !== null || isDynamicTemplateLiteral(val)) {
      context.report({
        node: val,
        messageId: 'backdropFilterStyle',
      });
    }
  }
}

export default rule;
