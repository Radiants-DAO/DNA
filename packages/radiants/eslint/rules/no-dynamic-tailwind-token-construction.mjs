/**
 * rdna/no-dynamic-tailwind-token-construction
 * Prevents template-built Tailwind token classes that evade static linting.
 */
import { isInsideClassNameAttribute } from '../utils.mjs';

const CLASS_BUILDERS = new Set(['cva', 'cn', 'clsx', 'cx', 'twMerge']);
const DYNAMIC_CLASS_TOKEN_RE =
  /(?:^|\s)(?:[!\w-]+:)*-?(?:bg|text|border|ring|outline|decoration|accent|caret|fill|stroke|from|via|to|p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|w|h|size|min-w|max-w|min-h|max-h|inset|top|right|bottom|left|translate|translate-x|translate-y|rounded|shadow|drop-shadow|z|duration|ease|opacity)-[^\s`]*\$\{/;

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban dynamic Tailwind token construction in className/class builders',
    },
    messages: {
      dynamicClassToken:
        'Dynamic Tailwind token construction "{{raw}}" hides design-system usage from lint. Use an explicit map or CVA variant.',
    },
    schema: [],
  },

  create(context) {
    return {
      TemplateLiteral(node) {
        if (node.expressions.length === 0) return;
        if (!isClassContext(node)) return;

        const raw = templatePattern(node);
        if (!DYNAMIC_CLASS_TOKEN_RE.test(raw)) return;

        context.report({
          node,
          messageId: 'dynamicClassToken',
          data: { raw },
        });
      },
    };
  },
};

function templatePattern(node) {
  let result = '';
  for (let index = 0; index < node.quasis.length; index += 1) {
    result += node.quasis[index].value.raw;
    if (index < node.expressions.length) result += '${}';
  }
  return result;
}

function isClassContext(node) {
  if (isInsideClassNameAttribute(node)) return true;

  let current = node.parent;
  while (current) {
    if (current.type === 'CallExpression' && isClassBuilderCall(current)) return true;
    if (current.type === 'JSXAttribute') return current.name?.name === 'className';
    current = current.parent;
  }
  return false;
}

function isClassBuilderCall(node) {
  const callee = node.callee;
  return callee.type === 'Identifier' && CLASS_BUILDERS.has(callee.name);
}

export default rule;
