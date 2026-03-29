/**
 * rdna/no-raw-line-height
 * Bans arbitrary line-height values in className and style props.
 * Allows only RDNA token-mapped leading-* classes and CSS variable references.
 */
import {
  getClassNameStrings,
  getObjectPropertyKey,
  getStaticStringValue,
  getStyleObjectExpression,
  isAllowedCssVar,
  isDynamicTemplateLiteral,
  isInsideClassNameAttribute,
} from '../utils.mjs';

// Optional Tailwind modifier prefix: hover:, dark:, md:, focus:, etc. (stackable)
const MOD = '(?:[\\w-]+:)*';

// Matches arbitrary leading values: leading-[24px], leading-[1.4], leading-[1.4rem], etc.
const ARBITRARY_LEADING_CLASS = new RegExp(`${MOD}leading-\\[[^\\]]+\\]`, 'g');

// Token-mapped leading classes that are allowed
const VALID_LEADING_CLASSES = new Set([
  'leading-tight',
  'leading-heading',
  'leading-snug',
  'leading-normal',
  'leading-relaxed',
  'leading-none',
]);

const validSuggestion = [...VALID_LEADING_CLASSES].join(', ');

/**
 * Strip all Tailwind modifier prefixes (hover:, dark:, md:, etc.) from a class.
 */
function stripModifiers(cls) {
  return cls.replace(/^(?:[\w-]+:)+/, '');
}

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban arbitrary line-height values; require RDNA leading tokens',
    },
    messages: {
      arbitraryLeading:
        `Arbitrary line-height "{{raw}}" in className. Use an RDNA leading token: ${validSuggestion}.`,
      hardcodedLineHeightStyle:
        `Hardcoded line-height in style prop. Use a CSS variable: var(--leading-*).`,
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
    ARBITRARY_LEADING_CLASS.lastIndex = 0;
    let match;
    while ((match = ARBITRARY_LEADING_CLASS.exec(value)) !== null) {
      const bare = stripModifiers(match[0]);
      // Allow if it's a valid token-mapped class (shouldn't match the regex, but defensive)
      if (VALID_LEADING_CLASSES.has(bare)) continue;
      context.report({
        node,
        messageId: 'arbitraryLeading',
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
    if (key !== 'lineHeight') continue;

    const val = prop.value;

    // Allow numeric literals that are unitless (CSS lineHeight as number)
    // — still flag them; RDNA wants token usage
    if (val.type === 'Literal' && typeof val.value === 'number') {
      context.report({ node: val, messageId: 'hardcodedLineHeightStyle' });
      continue;
    }

    const staticString = getStaticStringValue(val);
    if (staticString !== null) {
      if (isAllowedCssVar(staticString, 'leading-')) continue;
      context.report({ node: val, messageId: 'hardcodedLineHeightStyle' });
      continue;
    }

    if (isDynamicTemplateLiteral(val)) {
      context.report({ node: val, messageId: 'hardcodedLineHeightStyle' });
    }
  }
}

export default rule;
