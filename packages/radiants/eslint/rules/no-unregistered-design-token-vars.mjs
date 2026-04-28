/**
 * rdna/no-unregistered-design-token-vars
 * Validates known RDNA design-token CSS variable families against generated
 * contract data plus the current static z/radius/font token families.
 */
import { tokenMap, typography, shadows, motion } from '../contract.mjs';
import {
  getClassNameStrings,
  getStaticStringValue,
  getStyleObjectExpression,
  isInsideClassNameAttribute,
} from '../utils.mjs';

const DESIGN_VAR_RE = /var\(\s*(--(?:color|font|font-size|font-weight|leading|shadow|duration|easing|radius|z-index)-[a-z0-9-]+)\b[^)]*\)/gi;

const STATIC_TOKEN_VARS = new Set([
  '--radius-none',
  '--radius-xs',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-full',
  '--z-index-base',
  '--z-index-desktop',
  '--z-index-windows',
  '--z-index-chrome',
  '--z-index-menus',
  '--z-index-toasts',
  '--z-index-modals',
  '--z-index-system',
  '--font-sans',
  '--font-heading',
  '--font-mono',
  '--font-display',
  '--font-caption',
  '--font-tiny',
  '--font-mondwest',
  '--font-joystix',
  '--font-pixel-code',
  '--font-blackletter',
  '--font-blackletter-shadow',
  '--font-blackletter-inline',
  '--font-pixeloid',
  '--font-waves-tiny',
]);

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban references to unknown RDNA design-token CSS variables',
    },
    messages: {
      unknownDesignTokenVar:
        'Unknown RDNA design token "{{name}}". Use a generated/registered design token.',
    },
    schema: [],
  },

  create(context) {
    const knownVars = buildKnownVars();

    function checkText(node, text) {
      DESIGN_VAR_RE.lastIndex = 0;
      let match;
      while ((match = DESIGN_VAR_RE.exec(text)) !== null) {
        const name = match[1].toLowerCase();
        if (knownVars.has(name)) continue;
        context.report({
          node,
          messageId: 'unknownDesignTokenVar',
          data: { name },
        });
      }
    }

    return {
      JSXAttribute(node) {
        if (node.name.name === 'className') {
          const strings = getClassNameStrings(node.value);
          for (const { value, node: stringNode } of strings) checkText(stringNode, value);
        }

        if (node.name.name === 'style') {
          const expr = getStyleObjectExpression(node.value);
          if (!expr) return;
          for (const prop of expr.properties) {
            const value = getStaticStringValue(prop.value);
            if (typeof value === 'string') checkText(prop.value, value);
          }
        }
      },
      CallExpression(node) {
        if (isInsideClassNameAttribute(node)) return;
        const strings = getClassNameStrings(node);
        for (const { value, node: stringNode } of strings) checkText(stringNode, value);
      },
    };
  },
};

function buildKnownVars() {
  const known = new Set(STATIC_TOKEN_VARS);

  for (const suffix of tokenMap.semanticColorSuffixes || []) {
    known.add(`--color-${suffix}`);
  }
  for (const suffix of Object.values(tokenMap.brandPalette || {})) {
    known.add(`--color-${suffix}`);
  }
  for (const suffix of [
    'cell-bg',
    'track',
    'fill',
    'thumb',
    'label',
    'value',
    'text-active',
    'border-active',
    'border-inactive',
    'rule',
    'glow',
  ]) {
    known.add(`--color-ctrl-${suffix}`);
  }

  for (const token of typography.validSizes || []) {
    known.add(`--font-size-${stripPrefix(token, 'text-')}`);
  }
  for (const token of typography.validWeights || []) {
    known.add(`--font-weight-${stripPrefix(token, 'font-')}`);
  }
  for (const token of typography.validLeading || []) {
    known.add(`--leading-${stripPrefix(token, 'leading-')}`);
  }
  for (const token of typography.validFontFamilies || []) {
    known.add(`--font-${stripPrefix(token, 'font-')}`);
  }

  for (const token of [
    ...(shadows.validStandard || []),
    ...(shadows.validGlow || []),
  ]) {
    known.add(`--${token}`);
  }

  for (const token of motion.durationTokens || []) {
    known.add(`--${token}`);
  }
  for (const token of motion.easingTokens || []) {
    known.add(token);
  }

  return known;
}

function stripPrefix(value, prefix) {
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

export default rule;
