/**
 * rdna/no-hardcoded-typography
 * Bans arbitrary font sizes and font weights.
 * Allows only RDNA token-mapped text-* and font-* classes.
 */

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban arbitrary font sizes/weights; require RDNA typography tokens',
    },
    messages: {
      arbitraryTextSize:
        'Arbitrary font size "{{raw}}". Use an RDNA text size: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl.',
      arbitraryFontWeight:
        'Arbitrary font weight "{{raw}}". Use a standard weight: font-normal, font-medium, font-semibold, font-bold.',
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
    };
  },
};

function checkClassName(context, valueNode) {
  if (!valueNode) return;

  const strings = extractStrings(valueNode);
  for (const { value, node } of strings) {
    // Check arbitrary text sizes: text-[44px], text-[1.1rem]
    const sizeRegex = /text-\[\d+(?:\.\d+)?(?:px|rem|em|%|vw|vh)\]/g;
    let match;
    while ((match = sizeRegex.exec(value)) !== null) {
      context.report({
        node,
        messageId: 'arbitraryTextSize',
        data: { raw: match[0] },
      });
    }

    // Check arbitrary font weights: font-[450]
    const weightRegex = /font-\[\d+\]/g;
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
  if (!valueNode || valueNode.type !== 'JSXExpressionContainer') return;
  const expr = valueNode.expression;
  if (expr.type !== 'ObjectExpression') return;

  for (const prop of expr.properties) {
    if (prop.type !== 'Property') continue;
    const key = prop.key.name || prop.key.value;
    const val = prop.value;

    if (key === 'fontSize') {
      if (val.type === 'Literal' && (typeof val.value === 'string' || typeof val.value === 'number')) {
        context.report({ node: val, messageId: 'hardcodedTypographyStyle' });
      }
    }

    if (key === 'fontWeight') {
      if (val.type === 'Literal' && (typeof val.value === 'number' || typeof val.value === 'string')) {
        context.report({ node: val, messageId: 'hardcodedTypographyStyle' });
      }
    }
  }
}

function extractStrings(node) {
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return [{ value: node.value, node }];
  }
  if (node.type === 'JSXExpressionContainer') {
    return extractStrings(node.expression);
  }
  if (node.type === 'TemplateLiteral') {
    return node.quasis.map(q => ({ value: q.value.raw, node: q }));
  }
  return [];
}

export default rule;
