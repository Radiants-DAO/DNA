/**
 * rdna/no-hardcoded-motion
 * Bans arbitrary duration/easing values in className and style props.
 * Use RDNA motion tokens (duration-instant, duration-fast, duration-base,
 * duration-moderate, duration-slow, ease-standard) instead.
 */
import {
  getClassNameStrings,
  isInsideClassNameAttribute,
  ARBITRARY_DURATION_CLASS,
  ARBITRARY_EASING_CLASS,
} from '../utils.mjs';

const motionStyleProps = new Set([
  'transition',
  'transitionDuration',
  'transitionTimingFunction',
  'animationDuration',
  'animationTimingFunction',
]);

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban arbitrary duration/easing values; require RDNA motion tokens',
    },
    messages: {
      arbitraryDuration:
        'Arbitrary duration "{{raw}}" in className. Use an RDNA duration token (duration-instant, duration-fast, duration-base, duration-moderate, duration-slow).',
      arbitraryEasing:
        'Arbitrary easing "{{raw}}" in className. Use an RDNA easing token (ease-standard).',
      hardcodedMotionStyle:
        'Hardcoded motion value in style prop ({{prop}}). Use a CSS variable: var(--duration-*) or var(--ease-*).',
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
    ARBITRARY_DURATION_CLASS.lastIndex = 0;
    let match;
    while ((match = ARBITRARY_DURATION_CLASS.exec(value)) !== null) {
      context.report({
        node,
        messageId: 'arbitraryDuration',
        data: { raw: match[0] },
      });
    }

    ARBITRARY_EASING_CLASS.lastIndex = 0;
    while ((match = ARBITRARY_EASING_CLASS.exec(value)) !== null) {
      context.report({
        node,
        messageId: 'arbitraryEasing',
        data: { raw: match[0] },
      });
    }
  }
}

function checkStyleObject(context, valueNode) {
  if (!valueNode || valueNode.type !== 'JSXExpressionContainer') return;
  const expr = valueNode.expression;
  if (expr.type !== 'ObjectExpression') return;

  for (const prop of expr.properties) {
    if (prop.type !== 'Property') continue;
    const key = prop.key.name || prop.key.value;
    if (!motionStyleProps.has(key)) continue;

    const val = prop.value;
    if (val.type === 'Literal' && typeof val.value === 'string') {
      // Allow var(--duration-*) and var(--ease-*) references
      if (/^var\(--(?:duration|ease)-/.test(val.value)) continue;
      context.report({
        node: val,
        messageId: 'hardcodedMotionStyle',
        data: { prop: key },
      });
    }
    if (val.type === 'TemplateLiteral') {
      context.report({
        node: val,
        messageId: 'hardcodedMotionStyle',
        data: { prop: key },
      });
    }
  }
}

export default rule;
