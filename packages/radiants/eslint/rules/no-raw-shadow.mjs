/**
 * rdna/no-raw-shadow
 * Bans arbitrary shadow values in className and style props.
 * Use RDNA elevation/shadow tokens (shadow-resting, shadow-raised, shadow-floating, etc.) instead.
 */
import {
  getClassNameStrings,
  getObjectPropertyKey,
  getStaticStringValue,
  getStyleObjectExpression,
  isAllowedCssVar,
  isDynamicTemplateLiteral,
  isInsideClassNameAttribute,
  ARBITRARY_SHADOW_CLASS,
} from '../utils.mjs';

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
        if (!isInsideClassNameAttribute(node)) checkClassName(context, node);
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
  const expr = getStyleObjectExpression(valueNode);
  if (!expr) return;

  for (const prop of expr.properties) {
    const key = getObjectPropertyKey(prop);
    if (key !== 'boxShadow') continue;

    const val = prop.value;
    const staticString = getStaticStringValue(val);
    if (staticString !== null) {
      if (isAllowedCssVar(staticString, 'shadow-')) continue;
      context.report({
        node: val,
        messageId: 'hardcodedShadowStyle',
      });
      continue;
    }

    if (isDynamicTemplateLiteral(val)) {
      context.report({
        node: val,
        messageId: 'hardcodedShadowStyle',
      });
    }
  }
}

export default rule;
