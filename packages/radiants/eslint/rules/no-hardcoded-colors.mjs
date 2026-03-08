/**
 * rdna/no-hardcoded-colors
 * Bans hardcoded color values in className and style props.
 * Auto-fixes arbitrary Tailwind color classes when a 1:1 token mapping exists.
 */
import { hexToSemantic } from '../token-map.mjs';
import {
  ARBITRARY_COLOR_CLASS,
  getObjectPropertyKey,
  getStaticStringValue,
  getStyleObjectExpression,
  normalizeHex,
  extractPrefixContext,
  prefixToContext,
  getClassNameStrings,
  isDynamicTemplateLiteral,
  isInsideClassNameAttribute,
  HEX_PATTERN,
  RGB_PATTERN,
  HSL_PATTERN,
} from '../utils.mjs';

/** CSS properties that accept color values. Only these trigger style-object reports. */
const COLOR_PROPERTIES = new Set([
  'color',
  'backgroundColor',
  'background',
  'backgroundImage',
  'borderColor',
  'border',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'borderTop',
  'borderRight',
  'borderBottom',
  'borderLeft',
  'borderBlock',
  'borderBlockColor',
  'borderInline',
  'borderInlineColor',
  'outlineColor',
  'outline',
  'textDecorationColor',
  'caretColor',
  'accentColor',
  'fill',
  'stroke',
  'stopColor',
  'floodColor',
  'lightingColor',
  'boxShadow',
  'textShadow',
  'columnRuleColor',
  'scrollbarColor',
]);

const RAW_TAILWIND_COLOR_KEYWORDS = new Set(['white', 'black']);
const RAW_TAILWIND_COLOR_SCALE_RE = /^(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950)$/;
const NAMED_COLOR_UTILITY_RE = /^(bg|text|outline|decoration|accent|caret|fill|stroke|from|via|to|placeholder|ring(?:-offset)?|border(?:-[trblxyse]{1,2})?|divide(?:-[xy])?)-(.+)$/;

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban hardcoded color values; require RDNA color tokens',
    },
    fixable: 'code',
    messages: {
      arbitraryColor:
        'Hardcoded color "{{raw}}" in className. Use an RDNA color token instead (e.g. {{suggestion}}).',
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
    findAndReportNamedPaletteColors(context, node, value);
  }
}

function findAndReportArbitraryColors(context, node, text) {
  // Find arbitrary Tailwind color classes, including modifier prefixes: hover:bg-[#fff], dark:text-[rgb(...)], etc.
  const classRegex = ARBITRARY_COLOR_CLASS;
  classRegex.lastIndex = 0;
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

function findAndReportNamedPaletteColors(context, node, text) {
  const tokens = text.split(/\s+/).filter(Boolean);

  for (const token of tokens) {
    if (!isDisallowedRawTailwindColorToken(token)) continue;

    context.report({
      node,
      messageId: 'arbitraryColor',
      data: {
        raw: token,
        suggestion: getNamedColorSuggestion(token),
      },
    });
  }
}

function isDisallowedRawTailwindColorToken(token) {
  const stripped = token.replace(/^(?:[\w-]+:)+/, '');
  if (stripped.includes('[')) return false;

  const match = stripped.match(NAMED_COLOR_UTILITY_RE);
  if (!match) return false;

  const suffix = match[2];
  const baseSuffix = suffix.split('/')[0];

  if (baseSuffix === 'transparent' || baseSuffix === 'current' || baseSuffix === 'inherit') {
    return false;
  }

  return RAW_TAILWIND_COLOR_KEYWORDS.has(baseSuffix) || RAW_TAILWIND_COLOR_SCALE_RE.test(baseSuffix);
}

function getNamedColorSuggestion(token) {
  const stripped = token.replace(/^(?:[\w-]+:)+/, '');
  const match = stripped.match(NAMED_COLOR_UTILITY_RE);
  const prefix = match?.[1] ?? 'bg';

  if (prefix === 'bg' || prefix === 'from' || prefix === 'via' || prefix === 'to') {
    return `${prefix}-surface-primary`;
  }

  if (
    prefix === 'text' ||
    prefix === 'decoration' ||
    prefix === 'accent' ||
    prefix === 'caret' ||
    prefix === 'placeholder' ||
    prefix === 'fill' ||
    prefix === 'stroke'
  ) {
    return `${prefix}-content-primary`;
  }

  if (prefix === 'outline' || prefix.startsWith('border') || prefix.startsWith('divide')) {
    return `${prefix}-edge-primary`;
  }

  if (prefix.startsWith('ring')) {
    return `${prefix}-edge-focus`;
  }

  return 'bg-surface-primary';
}

function checkStyleObject(context, valueNode) {
  const expr = getStyleObjectExpression(valueNode);
  if (!expr) return;

  for (const prop of expr.properties) {
    const key = getObjectPropertyKey(prop);
    if (key == null) continue;
    if (!COLOR_PROPERTIES.has(key)) continue;
    const val = prop.value;
    const str = getStaticStringValue(val);

    if (str === null) {
      if (!isDynamicTemplateLiteral(val)) continue;
      context.report({
        node: val,
        messageId: 'hardcodedColorStyle',
        data: { raw: context.sourceCode.getText(val) },
      });
      continue;
    }

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
