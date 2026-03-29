/**
 * rdna/no-raw-font-family
 * Bans hardcoded font-family values in style props.
 * Allows CSS variable references (var(--font-*)) and Tailwind font classes.
 * Exempts files that import from @chenglou/pretext (canvas measurement needs literal names).
 */
import {
  getObjectPropertyKey,
  getStaticStringValue,
  getStyleObjectExpression,
  isAllowedCssVar,
  isDynamicTemplateLiteral,
} from '../utils.mjs';

// Valid Tailwind font-family utility classes (not checked here —
// className font-* classes are already semantic aliases and always valid).
// This rule focuses on style={{ fontFamily: ... }} enforcement.

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban hardcoded font-family in style props; require RDNA font tokens',
    },
    messages: {
      hardcodedFontFamily:
        'Hardcoded font-family in style prop. Use a CSS variable: var(--font-sans), var(--font-heading), var(--font-mono), var(--font-blackletter), var(--font-pixeloid).',
    },
    schema: [],
  },

  create(context) {
    // Check if this file imports from @chenglou/pretext — if so, exempt it entirely.
    // Pretext needs literal font names for canvas measurement.
    let hasPretextImport = false;

    return {
      ImportDeclaration(node) {
        if (
          node.source &&
          typeof node.source.value === 'string' &&
          node.source.value.startsWith('@chenglou/pretext')
        ) {
          hasPretextImport = true;
        }
      },
      CallExpression(node) {
        // Also check dynamic require('@chenglou/pretext')
        if (
          node.callee.name === 'require' &&
          node.arguments.length > 0 &&
          node.arguments[0].type === 'Literal' &&
          typeof node.arguments[0].value === 'string' &&
          node.arguments[0].value.startsWith('@chenglou/pretext')
        ) {
          hasPretextImport = true;
        }
      },
      JSXAttribute(node) {
        if (hasPretextImport) return;
        if (node.name.name === 'style') checkStyleObject(context, node.value);
      },
    };
  },
};

function checkStyleObject(context, valueNode) {
  const expr = getStyleObjectExpression(valueNode);
  if (!expr) return;

  for (const prop of expr.properties) {
    const key = getObjectPropertyKey(prop);
    if (key !== 'fontFamily') continue;

    const val = prop.value;

    const staticString = getStaticStringValue(val);
    if (staticString !== null) {
      // Allow any var(--font-*) reference
      if (isAllowedCssVar(staticString, 'font-')) continue;
      context.report({ node: val, messageId: 'hardcodedFontFamily' });
      continue;
    }

    if (isDynamicTemplateLiteral(val)) {
      context.report({ node: val, messageId: 'hardcodedFontFamily' });
    }
  }
}

export default rule;
