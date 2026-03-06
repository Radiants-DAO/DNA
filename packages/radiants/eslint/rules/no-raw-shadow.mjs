/**
 * rdna/no-raw-shadow
 * Bans arbitrary shadow values in className and style props.
 * Use RDNA elevation/shadow tokens (shadow-resting, shadow-raised, shadow-floating, etc.) instead.
 */
import { getClassNameStrings, ARBITRARY_SHADOW_CLASS } from '../utils.mjs';

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban arbitrary shadow values; require RDNA elevation/shadow tokens',
    },
    messages: {
      arbitraryShadow:
        'Arbitrary shadow "{{raw}}" in className. Use an RDNA shadow utility (shadow-resting, shadow-raised, shadow-floating, etc.).',
      hardcodedShadowStyle:
        'Hardcoded boxShadow in style prop. Use a CSS variable: var(--shadow-*).',
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
        checkClassName(context, node);
      },
    };
  },
};

function checkClassName(context, valueNode) {
  if (!valueNode) return;
  const strings = getClassNameStrings(valueNode);
  for (const { value, node } of strings) {
    ARBITRARY_SHADOW_CLASS.lastIndex = 0;
    let match;
    while ((match = ARBITRARY_SHADOW_CLASS.exec(value)) !== null) {
      context.report({
        node,
        messageId: 'arbitraryShadow',
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
    if (key !== 'boxShadow') continue;

    const val = prop.value;
    if (val.type === 'Literal' && typeof val.value === 'string') {
      // Allow var(--shadow-*) references
      if (/^var\(--shadow-/.test(val.value)) continue;
      context.report({
        node: val,
        messageId: 'hardcodedShadowStyle',
      });
    }
  }
}

export default rule;
