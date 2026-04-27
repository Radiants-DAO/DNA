/**
 * rdna/no-translucent-ink
 * Bans semi-transparent opacity and ink/black alpha styling. Use opaque
 * semantic surfaces/text tokens instead of alpha-blending UI chrome.
 */
import {
  getClassNameStrings,
  getObjectPropertyKey,
  getStaticStringValue,
  getStyleObjectExpression,
  isInsideClassNameAttribute,
} from '../utils.mjs';

const COLOR_UTILITY_PREFIX =
  '(?:bg|text|border(?:-[trblxyse]{1,2})?|divide(?:-[xy])?|outline|ring(?:-offset)?|shadow|drop-shadow|fill|stroke|from|via|to|placeholder|caret|accent|decoration)';

const TRANSLUCENT_INK_UTILITY_RE = new RegExp(
  `\\b${COLOR_UTILITY_PREFIX}-(?:black|ink|pure-black)/(?:\\d+|\\[[^\\]]+\\])\\b`,
  'g',
);
const OPACITY_UTILITY_RE = /\b(?:[\w-]+:)*opacity-(?:\d+|\[[^\]]+\])\b/g;

const BLACK_ALPHA_RE =
  /(?:rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*(?:0?\.\d+|[1-9]\d*%)\s*\)|rgb\(\s*0\s+0\s+0\s*\/\s*(?:0?\.\d+|[1-9]\d*%)\s*\)|#(?:000[1-9a-f]|000000[0-9a-f]{2}|00000000)\b)/i;
const INK_ALPHA_RE =
  /(?:rgba?\(\s*var\(\s*--color-(?:ink|pure-black)\s*\)|color-mix\([^)]*(?:--color-(?:ink|pure-black)|\bblack\b)[^)]*(?:\d{1,2}%|0?\.\d+))/i;
const COLOR_PROPS = new Set([
  'color',
  'background',
  'backgroundColor',
  'border',
  'borderColor',
  'borderTop',
  'borderTopColor',
  'borderRight',
  'borderRightColor',
  'borderBottom',
  'borderBottomColor',
  'borderLeft',
  'borderLeftColor',
  'outline',
  'outlineColor',
  'boxShadow',
  'textShadow',
  'filter',
  'fill',
  'stroke',
]);

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban semi-transparent ink/black styling. Use opaque semantic surfaces instead.',
    },
    messages: {
      translucentInkUtility:
        'Semi-transparent ink/black utility "{{raw}}" is not allowed. Use an opaque semantic token instead.',
      opacityOnInk:
        'Semi-transparent opacity utility "{{raw}}" is not allowed. Use an opaque semantic token instead. opacity-0/opacity-100 are allowed for visibility states.',
      translucentInkValue:
        'Semi-transparent ink/black value "{{raw}}" is not allowed. Use an opaque semantic token instead.',
      opacityStyleOnInk:
        'Semi-transparent style opacity is not allowed. Use an opaque semantic token instead. 0 and 1 are allowed for visibility states.',
    },
    schema: [],
  },

  create(context) {
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
    reportRegexMatches(context, node, value, TRANSLUCENT_INK_UTILITY_RE, 'translucentInkUtility');
    reportOpacityMatches(context, node, value);

    if (BLACK_ALPHA_RE.test(value) || INK_ALPHA_RE.test(value)) {
      context.report({
        node,
        messageId: 'translucentInkValue',
        data: { raw: value },
      });
    }
  }
}

function reportRegexMatches(context, node, value, re, messageId) {
  re.lastIndex = 0;
  let match;
  while ((match = re.exec(value)) !== null) {
    context.report({
      node,
      messageId,
      data: { raw: match[0] },
    });
  }
}

function reportOpacityMatches(context, node, value) {
  OPACITY_UTILITY_RE.lastIndex = 0;
  let match;
  while ((match = OPACITY_UTILITY_RE.exec(value)) !== null) {
    const raw = match[0];
    const amount = raw.slice(raw.lastIndexOf('opacity-') + 'opacity-'.length);
    if (amount === '0' || amount === '100') continue;
    context.report({
      node,
      messageId: 'opacityOnInk',
      data: { raw },
    });
  }
}

function checkStyle(context, valueNode) {
  const obj = getStyleObjectExpression(valueNode);
  if (!obj) return;

  const opacityProps = [];

  for (const prop of obj.properties) {
    if (prop.type !== 'Property') continue;
    const key = getObjectPropertyKey(prop);
    if (typeof key !== 'string') continue;

    const value = getStaticStringValue(prop.value);
    if (key === 'opacity') {
      if (isSemiTransparentOpacity(prop.value)) opacityProps.push(prop);
      continue;
    }
    if (!COLOR_PROPS.has(key) || typeof value !== 'string') continue;

    if (BLACK_ALPHA_RE.test(value) || INK_ALPHA_RE.test(value)) {
      context.report({
        node: prop.value,
        messageId: 'translucentInkValue',
        data: { raw: value },
      });
    }
  }

  for (const prop of opacityProps) {
    context.report({
      node: prop,
      messageId: 'opacityStyleOnInk',
    });
  }
}

function isSemiTransparentOpacity(valueNode) {
  if (!valueNode) return false;
  if (valueNode.type === 'Literal') {
    if (typeof valueNode.value === 'number') return valueNode.value > 0 && valueNode.value < 1;
    if (typeof valueNode.value === 'string') {
      const value = Number(valueNode.value);
      return Number.isFinite(value) && value > 0 && value < 1;
    }
  }
  const staticValue = getStaticStringValue(valueNode);
  if (typeof staticValue !== 'string') return false;
  const value = Number(staticValue);
  return Number.isFinite(value) && value > 0 && value < 1;
}

export default rule;
