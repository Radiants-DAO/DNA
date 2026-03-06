/**
 * rdna/no-raw-radius
 * Bans arbitrary border-radius values in className and style props.
 * Use RDNA radius tokens (rounded-xs, rounded-sm, rounded-md, rounded-full) instead.
 */
import { getClassNameStrings, isInsideClassNameAttribute, ARBITRARY_RADIUS_CLASS } from '../utils.mjs';

const radiusStyleProps = new Set([
  'borderRadius',
  'borderTopLeftRadius', 'borderTopRightRadius',
  'borderBottomLeftRadius', 'borderBottomRightRadius',
]);

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban arbitrary border-radius values; require RDNA radius tokens',
    },
    messages: {
      arbitraryRadius:
        'Arbitrary radius "{{raw}}" in className. Use an RDNA radius utility (rounded-xs, rounded-sm, rounded-md, rounded-full).',
      hardcodedRadiusStyle:
        'Hardcoded border-radius in style prop ({{prop}}). Use a CSS variable: var(--radius-*).',
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
    ARBITRARY_RADIUS_CLASS.lastIndex = 0;
    let match;
    while ((match = ARBITRARY_RADIUS_CLASS.exec(value)) !== null) {
      context.report({
        node,
        messageId: 'arbitraryRadius',
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
    if (!radiusStyleProps.has(key)) continue;

    const val = prop.value;
    if (val.type === 'Literal' && typeof val.value === 'string') {
      if (/^var\(--radius-/.test(val.value)) continue;
      context.report({
        node: val,
        messageId: 'hardcodedRadiusStyle',
        data: { prop: key },
      });
    }
    if (val.type === 'Literal' && typeof val.value === 'number') {
      context.report({
        node: val,
        messageId: 'hardcodedRadiusStyle',
        data: { prop: key },
      });
    }
    if (val.type === 'TemplateLiteral') {
      context.report({
        node: val,
        messageId: 'hardcodedRadiusStyle',
        data: { prop: key },
      });
    }
  }
}

export default rule;
