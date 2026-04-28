/**
 * rdna/no-arbitrary-icon-size
 *
 * Enforces that <Icon> uses the supported rendered icon sizes.
 * Flags:
 *   - size={n} where n is not an approved literal size
 *   - any usage of the removed `iconSet` prop
 *   - size={16} as redundant (it's the default)
 *   - size={24} as prefer-large
 */
import { isRadiantsInternal } from '../utils.mjs';

const DEFAULT_ALLOWED_SIZES = [16, 21, 24];

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Restrict Icon size to approved literal sizes and ban removed iconSet prop',
    },
    messages: {
      arbitrarySize:
        'Icon size must be one of {{allowed}}, got {{value}}. Use the approved bitmap icon sizes.',
      preferDefaultSize:
        'size={16} is the default — remove it.',
      preferLarge:
        'Prefer `large` prop over size={24}.',
      bannedIconSet:
        'The `iconSet` prop has been removed. Size now determines the icon set directly.',
      dynamicSize:
        'Icon size must be an approved literal size, not a dynamic expression.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedSizes: {
            type: 'array',
            items: { type: 'number' },
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const allowedSizes = new Set(options.allowedSizes || DEFAULT_ALLOWED_SIZES);
    const allowedList = [...allowedSizes].sort((a, b) => a - b).join(', ');
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

                if (!allowedSizes.has(val)) {
                  context.report({
                    node: attr,
                    messageId: 'arbitrarySize',
                    data: { value: String(val), allowed: allowedList },
                  });
                } else if (val === 16) {
                  context.report({ node: attr, messageId: 'preferDefaultSize' });
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
              if (!Number.isNaN(parsed) && !allowedSizes.has(parsed)) {
                context.report({
                  node: attr,
                  messageId: 'arbitrarySize',
                  data: { value: attr.value.value, allowed: allowedList },
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
