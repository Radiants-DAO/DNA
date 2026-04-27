/**
 * rdna/no-translucent-bg
 * Bans translucent bg utilities like `bg-page/80`, `bg-accent/30`.
 * Chrome surfaces must be opaque — use semantic tokens (bg-depth, bg-card,
 * bg-tinted, bg-accent-soft, bg-line, etc.).
 */
import {
  getClassNameStrings,
  isInsideClassNameAttribute,
} from '../utils.mjs';

const TRANSLUCENT_BG = /\bbg-[a-z][a-z0-9-]*\/\d+\b/g;

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban translucent bg utilities (bg-*/N). Chrome surfaces must be opaque — use semantic tokens (bg-depth, bg-card, bg-tinted, bg-accent-soft, bg-line).',
    },
    messages: {
      translucentBg:
        'Translucent bg "{{raw}}" is not allowed. Use an opaque semantic token (bg-depth, bg-card, bg-tinted, bg-accent-soft, bg-line, etc.).',
    },
    schema: [],
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name === 'className') checkClassName(context, node.value);
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
    TRANSLUCENT_BG.lastIndex = 0;
    let match;
    while ((match = TRANSLUCENT_BG.exec(value)) !== null) {
      context.report({
        node,
        messageId: 'translucentBg',
        data: { raw: match[0] },
      });
    }
  }
}

export default rule;
