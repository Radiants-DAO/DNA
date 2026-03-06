/**
 * rdna/no-hardcoded-colors
 * Bans hardcoded color values in className and style props.
 * Auto-fixes arbitrary Tailwind color classes when a 1:1 token mapping exists.
 */
import { hexToSemantic } from '../token-map.mjs';
import {
  normalizeHex,
  extractPrefixContext,
  prefixToContext,
  getClassNameStrings,
  isInsideClassNameAttribute,
  HEX_PATTERN,
  RGB_PATTERN,
  HSL_PATTERN,
} from '../utils.mjs';

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban hardcoded color values; require RDNA semantic tokens',
    },
    fixable: 'code',
    messages: {
      arbitraryColor:
        'Hardcoded color "{{raw}}" in className. Use a semantic token instead (e.g. {{suggestion}}).',
      hardcodedColorStyle:
        'Hardcoded color "{{raw}}" in style prop. Use a CSS variable: var(--color-*).',
    },
    schema: [],
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name === 'className') checkClassNameValue(context, node.value);
        if (node.name.name === 'style') checkStyleObject(context, node.value);
      },
      CallExpression(node) {
        if (!isInsideClassNameAttribute(node)) checkClassNameValue(context, node);
      },
    };
  },
};

function checkClassNameValue(context, valueNode) {
  if (!valueNode) return;
  const strings = getClassNameStrings(valueNode);
  for (const { value, node } of strings) {
    findAndReportArbitraryColors(context, node, value);
  }
}

function findAndReportArbitraryColors(context, node, text) {
  // Find arbitrary Tailwind color classes, including modifier prefixes: hover:bg-[#fff], dark:text-[rgb(...)], etc.
  const classRegex = /(?:[\w-]+:)*(?:bg|text|border|ring|outline|decoration|accent|caret|fill|stroke|from|via|to|divide|placeholder)-\[(?:#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))\]/g;
  let match;
  while ((match = classRegex.exec(text)) !== null) {
    const raw = match[0];
    // Separate modifier prefixes (hover:, dark:, etc.) from the utility class
    const modifierMatch = raw.match(/^((?:[\w-]+:)+)/);
    const modifiers = modifierMatch ? modifierMatch[1] : '';
    const prefix = extractPrefixContext(raw);
    const ctxKey = prefix ? prefixToContext(prefix) : null;

    // Try to extract hex for auto-fix lookup
    const hexMatch = raw.match(/#[0-9a-fA-F]{3,8}/);
    let fix = null;
    let suggestion = 'bg-surface-primary, text-content-primary, etc.';

    if (hexMatch && ctxKey) {
      const normalized = normalizeHex(hexMatch[0]);
      const mapping = hexToSemantic[normalized];
      if (mapping && mapping[ctxKey]) {
        fix = `${modifiers}${prefix}-${mapping[ctxKey]}`;
        suggestion = `${prefix}-${mapping[ctxKey]}`;
      }
    }

    context.report({
      node,
      messageId: 'arbitraryColor',
      data: { raw, suggestion },
      fix: fix
        ? (fixer) => {
            const src = context.sourceCode.getText(node);
            const newSrc = src.replace(raw, fix);
            return fixer.replaceText(node, newSrc);
          }
        : null,
    });
  }
}

function checkStyleObject(context, valueNode) {
  if (!valueNode || valueNode.type !== 'JSXExpressionContainer') return;
  const expr = valueNode.expression;
  if (expr.type !== 'ObjectExpression') return;

  for (const prop of expr.properties) {
    if (prop.type !== 'Property') continue;
    const val = prop.value;
    if (val.type !== 'Literal' || typeof val.value !== 'string') continue;

    const str = val.value;
    HEX_PATTERN.lastIndex = 0;
    RGB_PATTERN.lastIndex = 0;
    HSL_PATTERN.lastIndex = 0;
    if (HEX_PATTERN.test(str) || RGB_PATTERN.test(str) || HSL_PATTERN.test(str)) {
      HEX_PATTERN.lastIndex = 0;
      RGB_PATTERN.lastIndex = 0;
      HSL_PATTERN.lastIndex = 0;
      context.report({
        node: val,
        messageId: 'hardcodedColorStyle',
        data: { raw: str },
      });
    }
  }
}

export default rule;
