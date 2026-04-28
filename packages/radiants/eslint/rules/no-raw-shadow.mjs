/**
 * rdna/no-raw-shadow
 * Bans arbitrary shadow values in className and style props.
 * Use RDNA elevation/shadow tokens (shadow-resting, shadow-raised, shadow-floating, etc.) instead.
 */
import { shadows } from '../contract.mjs';
import {
  getClassNameStrings,
  getObjectPropertyKey,
  getStaticStringValue,
  getStyleObjectExpression,
  isAllowedCssVar,
  isDynamicTemplateLiteral,
  isInsideClassNameAttribute,
  ARBITRARY_SHADOW_CLASS,
} from '../utils.mjs';

const allowedShadowTokens = [
  ...shadows.validStandard,
  ...shadows.validPixel,
  ...shadows.validGlow,
].join(', ');

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban arbitrary shadow values; require RDNA elevation/shadow tokens',
    },
    messages: {
      arbitraryShadow:
        `Arbitrary shadow "{{raw}}" in className. Use an RDNA shadow utility (${allowedShadowTokens}).`,
      hardcodedShadowStyle:
        'Hardcoded boxShadow in style prop. Use a CSS variable: var(--shadow-*).',
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
    ARBITRARY_SHADOW_CLASS.lastIndex = 0;
    let match;
    while ((match = ARBITRARY_SHADOW_CLASS.exec(value)) !== null) {
      context.report({
        node,
        messageId: 'arbitraryShadow',
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
    if (key !== 'boxShadow' && key !== 'filter') continue;

    const val = prop.value;
    const staticString = getStaticStringValue(val);
    if (staticString !== null) {
      if (key === 'boxShadow') {
        if (isAllowedCssVar(staticString, 'shadow-')) continue;
      } else {
        if (!staticString.includes('drop-shadow(')) continue;
        if (hasOnlyTokenizedDropShadows(staticString)) continue;
      }
      context.report({
        node: prop,
        messageId: 'hardcodedShadowStyle',
      });
      continue;
    }

    if (
      isDynamicTemplateLiteral(val) &&
      (key === 'boxShadow' || context.sourceCode.getText(val).includes('drop-shadow('))
    ) {
      context.report({
        node: prop,
        messageId: 'hardcodedShadowStyle',
      });
    }
  }
}

function hasOnlyTokenizedDropShadows(value) {
  const args = extractFunctionArguments(value, 'drop-shadow');
  if (args.length === 0) return false;
  return args.every(arg => isAllowedCssVar(arg, 'shadow-'));
}

function extractFunctionArguments(value, functionName) {
  const args = [];
  const prefix = `${functionName}(`;
  let searchStart = 0;

  while (searchStart < value.length) {
    const start = value.indexOf(prefix, searchStart);
    if (start === -1) break;

    let depth = 1;
    let index = start + prefix.length;
    const argStart = index;

    while (index < value.length && depth > 0) {
      const char = value[index];
      if (char === '(') {
        depth += 1;
      } else if (char === ')') {
        depth -= 1;
      }
      index += 1;
    }

    if (depth !== 0) return [];

    args.push(value.slice(argStart, index - 1).trim());
    searchStart = index;
  }

  return args;
}

export default rule;
