/**
 * rdna/no-raw-layout-values
 * Bans fixed arbitrary sizing/positioning values. This is separate from
 * spacing because layout exceptions are more common in rendering surfaces.
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

const MOD = '(?:[\\w-]+:)*';
const NEG = '-?';
const RAW_LAYOUT_CLASS = new RegExp(
  `(?:^|\\s)(${MOD}${NEG}(?:w|h|size|basis|min-w|max-w|min-h|max-h|inset|inset-x|inset-y|top|right|bottom|left|start|end|translate|translate-x|translate-y)-\\[[^\\]]+\\])(?=\\s|$)`,
  'g',
);

const LAYOUT_STYLE_PROPS = new Set([
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'inlineSize',
  'blockSize',
  'minInlineSize',
  'maxInlineSize',
  'minBlockSize',
  'maxBlockSize',
  'flexBasis',
  'inset',
  'insetBlock',
  'insetInline',
  'insetBlockStart',
  'insetBlockEnd',
  'insetInlineStart',
  'insetInlineEnd',
  'top',
  'right',
  'bottom',
  'left',
  'translate',
]);

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban fixed arbitrary layout sizing/positioning values',
    },
    messages: {
      rawLayoutClass:
        'Raw layout value "{{raw}}" is not allowed. Use a token, standard utility, %, rem, or CSS math function.',
      rawLayoutStyle:
        'Raw layout value in style prop ({{prop}}) is not allowed. Use a token, %, rem, or CSS math function.',
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
    const filename = context.filename || context.getFilename();
    if (isExemptPath(filename, options.exemptPaths || [])) return {};

    return {
      JSXAttribute(node) {
        if (node.name.name === 'className') checkClassName(context, node.value);
        if (node.name.name === 'style') checkStyle(context, node.value);
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
    RAW_LAYOUT_CLASS.lastIndex = 0;
    let match;
    while ((match = RAW_LAYOUT_CLASS.exec(value)) !== null) {
      const raw = match[1];
      if (isAllowedArbitraryLayout(raw)) continue;
      context.report({
        node,
        messageId: 'rawLayoutClass',
        data: { raw },
      });
    }
  }
}

function checkStyle(context, valueNode) {
  const expr = getStyleObjectExpression(valueNode);
  if (!expr) return;

  for (const prop of expr.properties) {
    const key = getObjectPropertyKey(prop);
    if (!LAYOUT_STYLE_PROPS.has(key)) continue;

    const val = prop.value;
    if (val.type === 'Literal' && typeof val.value === 'number') {
      context.report({ node: val, messageId: 'rawLayoutStyle', data: { prop: key } });
      continue;
    }

    const staticValue = getStaticStringValue(val);
    if (staticValue !== null) {
      if (isAllowedLayoutValue(staticValue)) continue;
      context.report({ node: val, messageId: 'rawLayoutStyle', data: { prop: key } });
      continue;
    }

    if (isDynamicTemplateLiteral(val) && !isAllowedDynamicLayoutValue(val)) {
      context.report({ node: val, messageId: 'rawLayoutStyle', data: { prop: key } });
    }
  }
}

function isAllowedArbitraryLayout(raw) {
  const match = raw.match(/\[([^\]]+)\]/);
  return match ? isAllowedLayoutValue(match[1]) : false;
}

function isAllowedLayoutValue(value) {
  const trimmed = value.trim();
  if (/^--[a-z0-9-]+$/.test(trimmed)) return true;
  if (isAllowedCssVar(trimmed)) return true;
  if (/^-?\d+(?:\.\d+)?%$/.test(trimmed)) return true;
  if (/^-?\d+(?:\.\d+)?rem$/.test(trimmed)) return true;
  if (/^(?:clamp|calc|min|max)\(/.test(trimmed)) return true;
  return false;
}

function isAllowedDynamicLayoutValue(node) {
  if (node.type !== 'TemplateLiteral') return false;
  const representative = node.quasis
    .map(quasi => quasi.value.cooked ?? quasi.value.raw)
    .join('0')
    .trim();
  return isAllowedLayoutValue(representative);
}

function isExemptPath(filename, patterns) {
  const normalized = filename.replace(/\\/g, '/');
  return patterns.some((pattern) => {
    const normalizedPattern = pattern.replace(/\\/g, '/');
    if (normalizedPattern.includes('*')) {
      const regex = new RegExp(
        normalizedPattern
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
          .replace(/\\\*\\\*/g, '.*')
          .replace(/\\\*/g, '[^/]*'),
      );
      return regex.test(normalized);
    }
    return normalized.includes(normalizedPattern);
  });
}

export default rule;
