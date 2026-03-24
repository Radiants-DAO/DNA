/**
 * rdna/no-hardcoded-typography
 * Bans arbitrary font sizes and font weights.
 * Allows only RDNA token-mapped text-* and font-* classes.
 */
import { typography } from '../contract.mjs';
import {
  getClassNameStrings,
  getObjectPropertyKey,
  getStaticStringValue,
  getStyleObjectExpression,
  isAllowedCssVar,
  isDynamicTemplateLiteral,
  isInsideClassNameAttribute,
  ARBITRARY_FONT_WEIGHT_CLASS,
  ARBITRARY_TEXT_SIZE_CLASS,
} from '../utils.mjs';

const sizeSuggestion = typography.validSizes.join(', ');
const weightSuggestion = typography.validWeights.join(', ');

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban arbitrary font sizes/weights; require RDNA typography tokens',
    },
    messages: {
      arbitraryTextSize:
        `Arbitrary font size "{{raw}}". Use an RDNA text size: ${sizeSuggestion}.`,
      arbitraryFontWeight:
        `Arbitrary font weight "{{raw}}". Use a standard weight: ${weightSuggestion}.`,
      hardcodedTypographyStyle:
        'Hardcoded typography value in style prop. Use CSS variable: var(--font-size-*) or var(--font-weight-*).',
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
    // Check arbitrary text sizes: text-[44px], hover:text-[1.1rem]
    const sizeRegex = ARBITRARY_TEXT_SIZE_CLASS;
    sizeRegex.lastIndex = 0;
    let match;
    while ((match = sizeRegex.exec(value)) !== null) {
      context.report({
        node,
        messageId: 'arbitraryTextSize',
        data: { raw: match[0] },
      });
    }

    // Check arbitrary font weights: font-[450], dark:font-[700]
    const weightRegex = ARBITRARY_FONT_WEIGHT_CLASS;
    weightRegex.lastIndex = 0;
    while ((match = weightRegex.exec(value)) !== null) {
      context.report({
        node,
        messageId: 'arbitraryFontWeight',
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
    const val = prop.value;

    if (key === 'fontSize') {
      if (val.type === 'Literal' && typeof val.value === 'number') {
        context.report({ node: val, messageId: 'hardcodedTypographyStyle' });
        continue;
      }
      const staticString = getStaticStringValue(val);
      if (staticString !== null) {
        if (isAllowedCssVar(staticString, 'font-size-')) continue;
        context.report({ node: val, messageId: 'hardcodedTypographyStyle' });
        continue;
      }
      if (isDynamicTemplateLiteral(val)) {
        context.report({ node: val, messageId: 'hardcodedTypographyStyle' });
      }
    }

    if (key === 'fontWeight') {
      if (val.type === 'Literal' && typeof val.value === 'number') {
        context.report({ node: val, messageId: 'hardcodedTypographyStyle' });
        continue;
      }
      const staticString = getStaticStringValue(val);
      if (staticString !== null) {
        if (isAllowedCssVar(staticString, 'font-weight-')) continue;
        context.report({ node: val, messageId: 'hardcodedTypographyStyle' });
        continue;
      }
      if (isDynamicTemplateLiteral(val)) {
        context.report({ node: val, messageId: 'hardcodedTypographyStyle' });
      }
    }
  }
}

export default rule;
