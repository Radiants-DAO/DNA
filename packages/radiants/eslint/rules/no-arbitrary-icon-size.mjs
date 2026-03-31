/**
 * rdna/no-arbitrary-icon-size
 *
 * Enforces that <Icon> only uses size={16} or size={24} (or the `large` prop).
 * Flags:
 *   - size={n} where n is not 16 or 24
 *   - any usage of the removed `iconSet` prop
 *   - size={16} as redundant (it's the default)
 *   - size={24} as prefer-large
 */
import { isRadiantsInternal } from '../utils.mjs';

const VALID_SIZES = new Set([16, 24]);

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Restrict Icon size to 16 or 24 and ban removed iconSet prop',
    },
    messages: {
      arbitrarySize:
        'Icon size must be 16 or 24, got {{value}}. Use default (16px) or `large` (24px).',
      redundantSize16:
        'size={16} is the default — remove it.',
      preferLarge:
        'Prefer `large` prop over size={24}.',
      bannedIconSet:
        'The `iconSet` prop has been removed. Size now determines the icon set directly.',
      dynamicSize:
        'Icon size must be a literal 16 or 24, not a dynamic expression.',
    },
    schema: [],
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    if (isRadiantsInternal(filename)) return {};

    return {
      JSXOpeningElement(node) {
        const name = node.name;
        if (name.type !== 'JSXIdentifier' || name.name !== 'Icon') return;

        for (const attr of node.attributes) {
          if (attr.type !== 'JSXAttribute' || !attr.name) continue;
          const propName = attr.name.name;

          // Ban iconSet prop
          if (propName === 'iconSet') {
            context.report({ node: attr, messageId: 'bannedIconSet' });
            continue;
          }

          // Check size prop
          if (propName === 'size' && attr.value) {
            // size={expr}
            if (attr.value.type === 'JSXExpressionContainer') {
              const expr = attr.value.expression;

              if (expr.type === 'Literal' && typeof expr.value === 'number') {
                const val = expr.value;

                if (!VALID_SIZES.has(val)) {
                  context.report({
                    node: attr,
                    messageId: 'arbitrarySize',
                    data: { value: String(val) },
                  });
                } else if (val === 16) {
                  context.report({ node: attr, messageId: 'redundantSize16' });
                } else if (val === 24) {
                  context.report({ node: attr, messageId: 'preferLarge' });
                }
              } else if (
                expr.type !== 'Literal' &&
                expr.type !== 'JSXEmptyExpression'
              ) {
                // Dynamic expression — can't verify at lint time
                context.report({ node: attr, messageId: 'dynamicSize' });
              }
            }
            // size="16" (string literal) — unusual but catch it
            else if (
              attr.value.type === 'Literal' &&
              typeof attr.value.value === 'string'
            ) {
              const parsed = Number(attr.value.value);
              if (!Number.isNaN(parsed) && !VALID_SIZES.has(parsed)) {
                context.report({
                  node: attr,
                  messageId: 'arbitrarySize',
                  data: { value: attr.value.value },
                });
              }
            }
          }
        }
      },
    };
  },
};

export default rule;
