/**
 * rdna/prefer-rdna-components
 * Bans raw HTML elements when an RDNA component equivalent exists.
 * v1 is intentionally capability-aware:
 * - always bans button, textarea, select, dialog, details
 * - bans input only for text-like inputs and missing type
 * - exempts native-only controls like file, checkbox, radio, date, hidden
 * No auto-fix — replacement requires prop mapping.
 */
import { rdnaComponentMap } from '../token-map.mjs';
import { isRadiantsInternal } from '../utils.mjs';

const bannedElements = new Set(Object.keys(rdnaComponentMap));
const textLikeInputTypes = new Set(['text', 'email', 'password', 'search', 'url', 'tel', 'number']);

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer RDNA components over raw HTML elements',
    },
    messages: {
      preferRdnaComponent:
        'Use RDNA <{{component}}> instead of raw <{{element}}>. Import from {{importPath}}.{{note}}',
    },
    schema: [
      {
        type: 'object',
        properties: {
          exemptPaths: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const exemptPaths = options.exemptPaths || [];
    const filename = context.filename || context.getFilename();

    // Check if file is exempt
    const isExempt = exemptPaths.some(pattern => {
      // Simple glob matching — check if filename contains the core path
      if (pattern.includes('*')) {
        // Use basic pattern matching
        const regexStr = pattern
          .replace(/\*\*/g, '<<DOUBLESTAR>>')
          .replace(/\*/g, '[^/]*')
          .replace(/<<DOUBLESTAR>>/g, '.*');
        return new RegExp(regexStr).test(filename);
      }
      return filename.includes(pattern);
    });

    if (isExempt || isRadiantsInternal(filename)) return {};

    return {
      JSXOpeningElement(node) {
        const name = node.name;
        // Only check simple element names (not member expressions like Foo.Bar)
        if (name.type !== 'JSXIdentifier') return;

        const element = name.name;
        // JSX elements starting with lowercase are HTML elements
        if (element[0] !== element[0].toLowerCase()) return;

        if (!bannedElements.has(element)) return;
        if (element === 'input' && !isTextLikeInput(node)) return;

        const mapping = rdnaComponentMap[element];
        context.report({
          node,
          messageId: 'preferRdnaComponent',
          data: {
            component: mapping.component,
            element,
            importPath: mapping.import,
            note: mapping.note ? ` (${mapping.note})` : '',
          },
        });
      },
    };
  },
};

function isTextLikeInput(node) {
  const typeAttr = node.attributes.find(
    attr =>
      attr.type === 'JSXAttribute' &&
      attr.name &&
      attr.name.name === 'type'
  );

  if (!typeAttr || !typeAttr.value) return true;

  if (typeAttr.value.type === 'Literal' && typeof typeAttr.value.value === 'string') {
    return textLikeInputTypes.has(typeAttr.value.value);
  }

  if (typeAttr.value.type === 'JSXExpressionContainer') {
    const expr = typeAttr.value.expression;
    if (expr.type === 'Literal' && typeof expr.value === 'string') {
      return textLikeInputTypes.has(expr.value);
    }

    // Dynamic input types are conservative violations because they may resolve
    // to text-like controls at runtime and bypass the wrapper policy.
    return true;
  }

  return true;
}

export default rule;
