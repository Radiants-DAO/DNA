/**
 * rdna/no-hardcoded-spacing
 * Bans arbitrary bracket spacing values in Tailwind classes and inline styles.
 * Standard Tailwind scale utilities (mt-3, px-4, gap-2) are ALLOWED.
 * Responsive/scalable arbitrary values (%, rem, clamp(), calc(), min(), max()) are ALLOWED.
 * Only fixed-unit arbitrary values like p-[12px], gap-[13px] are banned.
 * v1 intentionally excludes width/height and positioning utilities.
 */
import {
  getClassNameStrings,
  getObjectPropertyKey,
  getStaticStringValue,
  getStyleObjectExpression,
  isAllowedCssVar,
  isDynamicTemplateLiteral,
  isInsideClassNameAttribute,
  ARBITRARY_SPACING_CLASS,
} from '../utils.mjs';

/**
 * Check whether the bracket content of an arbitrary Tailwind class uses
 * responsive/scalable units or CSS math functions that should be allowed.
 * Percentages, rem, and functions like clamp()/calc()/min()/max() are
 * intentional choices for responsive design — only fixed-unit values (px, etc.)
 * should be flagged.
 */
function isResponsiveArbitraryValue(cls) {
  const bracketMatch = cls.match(/\[([^\]]+)\]/);
  if (!bracketMatch) return false;
  const inner = bracketMatch[1];
  // Allow percentage values: 8%, 50%, etc.
  if (/%$/.test(inner)) return true;
  // Allow rem values: 1.5rem, 2rem, etc.
  if (/rem$/.test(inner)) return true;
  // Allow CSS math functions: clamp(...), calc(...), min(...), max(...)
  if (/^(?:clamp|calc|min|max)\(/.test(inner)) return true;
  return false;
}

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
        'Fixed-unit arbitrary spacing "{{raw}}". Use a standard Tailwind spacing utility (e.g. p-4, gap-2). Percentage, rem, and CSS math function values (%, rem, clamp(), calc()) are allowed.',
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
      // Skip responsive/scalable values (%, rem, clamp, calc, min, max)
      if (isResponsiveArbitraryValue(match[0])) continue;
      context.report({
        node,
        messageId: 'arbitrarySpacing',
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
    if (!spacingStyleProps.has(key)) continue;

    const val = prop.value;
    // Ban numeric literals (e.g. padding: 12) and hardcoded strings (e.g. gap: "13px")
    if (val.type === 'Literal' && typeof val.value === 'number') {
      context.report({
        node: val,
        messageId: 'hardcodedSpacingStyle',
        data: { prop: key },
      });
      continue;
    }

    const staticString = getStaticStringValue(val);
    if (staticString !== null) {
      if (isAllowedCssVar(staticString)) continue;
      context.report({
        node: val,
        messageId: 'hardcodedSpacingStyle',
        data: { prop: key },
      });
      continue;
    }

    if (isDynamicTemplateLiteral(val)) {
      context.report({
        node: val,
        messageId: 'hardcodedSpacingStyle',
        data: { prop: key },
      });
    }
  }
}

export default rule;
