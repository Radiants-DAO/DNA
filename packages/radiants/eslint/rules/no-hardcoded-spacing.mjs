/**
 * rdna/no-hardcoded-spacing
 * Bans arbitrary bracket spacing values in Tailwind classes and inline styles.
 * Standard Tailwind scale utilities (mt-3, px-4, gap-2) are ALLOWED.
 * Only arbitrary values like p-[12px], gap-[13px], mx-[5%] are banned.
 * v1 intentionally excludes width/height and positioning utilities.
 */
import { getClassNameStrings, isInsideClassNameAttribute, ARBITRARY_SPACING_CLASS } from '../utils.mjs';

// Style properties that represent spacing
const spacingStyleProps = new Set([
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'paddingInline', 'paddingBlock', 'paddingInlineStart', 'paddingInlineEnd',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'marginInline', 'marginBlock', 'marginInlineStart', 'marginInlineEnd',
  'gap', 'rowGap', 'columnGap',
]);

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban arbitrary spacing bracket values; allow standard Tailwind scale utilities',
    },
    messages: {
      arbitrarySpacing:
        'Arbitrary spacing value "{{raw}}". Use a standard Tailwind spacing utility (e.g. p-4, gap-2) instead of bracket values.',
      hardcodedSpacingStyle:
        'Hardcoded spacing in style prop ({{prop}}). Use CSS variable or Tailwind class instead.',
    },
    schema: [],
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name === 'className') {
          checkClassName(context, node.value);
        }
        if (node.name.name === 'style') {
          checkStyleObject(context, node.value);
        }
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
    ARBITRARY_SPACING_CLASS.lastIndex = 0;
    let match;
    while ((match = ARBITRARY_SPACING_CLASS.exec(value)) !== null) {
      context.report({
        node,
        messageId: 'arbitrarySpacing',
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
    if (!spacingStyleProps.has(key)) continue;

    const val = prop.value;
    // Ban numeric literals (e.g. padding: 12) and string literals with units (e.g. gap: "13px")
    if (val.type === 'Literal' && (typeof val.value === 'number' || typeof val.value === 'string')) {
      context.report({
        node: val,
        messageId: 'hardcodedSpacingStyle',
        data: { prop: key },
      });
    }
  }
}

export default rule;
