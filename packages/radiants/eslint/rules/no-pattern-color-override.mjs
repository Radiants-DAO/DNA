/**
 * rdna/no-pattern-color-override
 * Bans hardcoded color values on pattern-mode elements.
 *
 * Pattern buttons and rdna-pat elements derive their colors from semantic tokens
 * (--color-line, --color-main) that flip correctly in dark/light mode.
 * Overriding --pat-color, backgroundColor, or color with a hardcoded value
 * breaks dark-mode switching and the mouse-follower glow system.
 *
 * Catches:
 *   <Button mode="pattern" style={{ backgroundColor: '#000' }}>
 *   <div className="rdna-pat--mist" style={{ '--pat-color': 'red' }}>
 *
 * OK:
 *   <Button mode="pattern" style={{ backgroundColor: 'var(--color-inv)' }}>
 *   <div className="rdna-pat--mist" style={{ '--pat-color': 'var(--color-line)' }}>
 */
import {
  getObjectPropertyKey,
  getStaticStringValue,
  getStyleObjectExpression,
  getClassNameStrings,
  HEX_PATTERN,
  RGB_PATTERN,
  HSL_PATTERN,
} from '../utils.mjs';

const COLOR_FUNCTION_RE = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\s*\(/i;
const CSS_VAR_RE = /^\s*var\(\s*--/;
const SEMANTIC_KEYWORD_RE = /^(?:transparent|currentcolor|inherit|unset|initial)$/i;

/** Style properties that should not be hardcoded on pattern elements. */
const PATTERN_COLOR_PROPS = new Set([
  'color',
  'backgroundColor',
  'background',
  '--pat-color',
]);

/** className patterns that mark an element as pattern-driven. */
const PAT_CLASS_RE = /\brdna-pat(?:--[\w-]+)?\b/;

function isHardcodedColor(value) {
  if (!value || typeof value !== 'string') return false;
  if (CSS_VAR_RE.test(value)) return false;
  if (SEMANTIC_KEYWORD_RE.test(value.trim())) return false;

  HEX_PATTERN.lastIndex = 0;
  RGB_PATTERN.lastIndex = 0;
  HSL_PATTERN.lastIndex = 0;

  return (
    HEX_PATTERN.test(value) ||
    RGB_PATTERN.test(value) ||
    HSL_PATTERN.test(value) ||
    COLOR_FUNCTION_RE.test(value)
  );
}

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban hardcoded colors on pattern-mode buttons and rdna-pat elements — use semantic tokens so dark/light mode works correctly',
    },
    messages: {
      patternColorOverride:
        'Hardcoded "{{prop}}: {{value}}" on a pattern element breaks dark/light mode. Use a semantic token: var(--color-*).',
    },
    schema: [],
  },

  create(context) {
    return {
      JSXOpeningElement(node) {
        const isPatternElement = hasPatternMode(node) || hasPatternClassName(node);
        if (!isPatternElement) return;

        const styleAttr = node.attributes.find(
          (a) => a.type === 'JSXAttribute' && a.name && a.name.name === 'style'
        );
        if (!styleAttr) return;

        const expr = getStyleObjectExpression(styleAttr.value);
        if (!expr) return;

        for (const prop of expr.properties) {
          if (prop.type !== 'Property') continue;
          const key = getObjectPropertyKey(prop);
          if (!key || !PATTERN_COLOR_PROPS.has(key)) continue;

          const value = getStaticStringValue(prop.value);
          if (value !== null && isHardcodedColor(value)) {
            context.report({
              node: prop,
              messageId: 'patternColorOverride',
              data: { prop: key, value },
            });
          }
        }
      },
    };
  },
};

/** Check if a JSXOpeningElement has mode="pattern". */
function hasPatternMode(node) {
  return node.attributes.some((attr) => {
    if (attr.type !== 'JSXAttribute' || !attr.name) return false;
    if (attr.name.name !== 'mode') return false;
    const val = getStaticStringValue(attr.value);
    return val === 'pattern';
  });
}

/** Check if a JSXOpeningElement has an rdna-pat className. */
function hasPatternClassName(node) {
  const classAttr = node.attributes.find(
    (a) => a.type === 'JSXAttribute' && a.name && a.name.name === 'className'
  );
  if (!classAttr) return false;

  const strings = getClassNameStrings(classAttr.value);
  return strings.some(({ value }) => PAT_CLASS_RE.test(value));
}

export default rule;
