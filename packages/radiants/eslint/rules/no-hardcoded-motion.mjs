/**
 * rdna/no-hardcoded-motion
 * Bans arbitrary duration/easing values in className and style props.
 * Use RDNA motion tokens (duration-instant, duration-fast, duration-base,
 * duration-moderate, duration-slow, ease-standard) instead.
 */
import { motion } from '../contract.mjs';
import {
  getClassNameStrings,
  getObjectPropertyKey,
  getStaticStringValue,
  getStyleObjectExpression,
  isDynamicTemplateLiteral,
  isInsideClassNameAttribute,
  ARBITRARY_DURATION_CLASS,
  ARBITRARY_EASING_CLASS,
} from '../utils.mjs';

const motionStyleProps = new Set([
  'transition',
  'transitionDuration',
  'transitionTimingFunction',
  'animation',
  'animationDuration',
  'animationTimingFunction',
]);

// Detects hardcoded duration values: 200ms, 0.3s, 150ms, etc.
const HARDCODED_DURATION_RE = /\d+\.?\d*m?s\b/;
// Detects hardcoded easing values: ease, ease-in, ease-out, ease-in-out, linear, cubic-bezier(...)
const HARDCODED_EASING_RE = /\b(?:ease-in-out|ease-in|ease-out|ease|linear)\b|cubic-bezier\s*\(/;
const classEasingSuggestion = motion.allowedEasings.join(', ');
const cssEasingSuggestion = motion.easingTokens.join(', ');
const durationSuggestion = motion.durationTokens.join(', ');
const styleSuggestion = [durationSuggestion, cssEasingSuggestion].filter(Boolean).join('; ');

/**
 * Check if a style string contains hardcoded motion values after stripping
 * approved var() token references. This prevents false negatives where a
 * mixed shorthand like "opacity 200ms var(--ease-standard)" contains both
 * tokenized and hardcoded values.
 */
function containsHardcodedMotion(str) {
  const stripped = str.replace(/var\([^)]+\)/g, '');
  return HARDCODED_DURATION_RE.test(stripped) || HARDCODED_EASING_RE.test(stripped);
}

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban arbitrary duration/easing values; require RDNA motion tokens',
    },
    messages: {
      arbitraryDuration:
        `Arbitrary duration "{{raw}}" in className. Use an RDNA duration token (${durationSuggestion}).`,
      arbitraryEasing:
        `Arbitrary easing "{{raw}}" in className. Use an RDNA easing token (${classEasingSuggestion}).`,
      hardcodedMotionStyle:
        `Hardcoded motion value in style prop ({{prop}}). Use RDNA motion tokens/vars: ${styleSuggestion}.`,
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
    ARBITRARY_DURATION_CLASS.lastIndex = 0;
    let match;
    while ((match = ARBITRARY_DURATION_CLASS.exec(value)) !== null) {
      context.report({
        node,
        messageId: 'arbitraryDuration',
        data: { raw: match[0] },
      });
    }

    ARBITRARY_EASING_CLASS.lastIndex = 0;
    while ((match = ARBITRARY_EASING_CLASS.exec(value)) !== null) {
      context.report({
        node,
        messageId: 'arbitraryEasing',
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
    if (!motionStyleProps.has(key)) continue;

    const val = prop.value;
    const staticString = getStaticStringValue(val);
    if (staticString !== null) {
      if (!containsHardcodedMotion(staticString)) continue;
      context.report({
        node: val,
        messageId: 'hardcodedMotionStyle',
        data: { prop: key },
      });
      continue;
    }

    if (isDynamicTemplateLiteral(val)) {
      context.report({
        node: val,
        messageId: 'hardcodedMotionStyle',
        data: { prop: key },
      });
    }
  }
}

export default rule;
