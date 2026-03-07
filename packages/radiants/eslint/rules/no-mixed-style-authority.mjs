/**
 * rdna/no-mixed-style-authority
 * Flags components that mix local semantic color utilities (bg-surface-*, text-content-*,
 * border-edge-*, etc.) with data-variant/data-slot hooks that the theme CSS also targets.
 *
 * When theme CSS targets [data-variant="X"], the component should not also hardcode
 * semantic color utilities — that creates two competing sources of truth for color.
 *
 * Config: Pass themeVariants via rule options to specify which variant values are
 * targeted by theme CSS. Falls back to an empty list (no reports).
 */
import { getClassNameStrings } from '../utils.mjs';

// Ported from scripts/audit-style-authority.mjs
const SEMANTIC_COLOR_UTILITY_RE = /\b(?:!|[a-z-]+:)*?(?:bg|text|border)-(?:surface|content|action|edge|status)-[a-z0-9-]+\b/;

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ban mixing local semantic color utilities with theme-targeted data-variant hooks',
    },
    messages: {
      mixedAuthority:
        'Mixed style authority: semantic color utilities are used alongside data-variant="{{variant}}" which is already styled by theme CSS. Move color to the theme layer or remove the variant hook.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          themeVariants: {
            type: 'array',
            items: { type: 'string' },
            description: 'Variant values targeted by theme CSS selectors',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const themeVariants = new Set(options.themeVariants || []);
    if (themeVariants.size === 0) return {};

    // Track per-file: variant usage nodes and semantic color presence
    const variantNodes = new Map(); // variant -> Set of JSXOpeningElement nodes
    const elementsWithSemanticColors = new Set(); // JSXOpeningElement nodes

    return {
      JSXAttribute(node) {
        const openingEl = node.parent;
        if (!openingEl || openingEl.type !== 'JSXOpeningElement') return;

        // Track data-variant attributes
        if (
          node.name.type === 'JSXNamespacedName'
            ? false
            : node.name.name === 'data-variant'
        ) {
          const val = node.value;
          if (val && val.type === 'Literal' && typeof val.value === 'string') {
            const variant = val.value;
            if (themeVariants.has(variant)) {
              if (!variantNodes.has(variant)) variantNodes.set(variant, new Set());
              variantNodes.get(variant).add(openingEl);
            }
          }
        }

        // Track className with semantic color utilities
        if (node.name.name === 'className' && node.value) {
          const strings = getClassNameStrings(node.value);
          for (const { value } of strings) {
            if (SEMANTIC_COLOR_UTILITY_RE.test(value)) {
              elementsWithSemanticColors.add(openingEl);
              break;
            }
          }
        }
      },

      // Also catch cva() calls at module scope that feed into elements with variants
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== 'Identifier' || callee.name !== 'cva') return;

        const strings = getClassNameStrings(node);
        for (const { value } of strings) {
          if (SEMANTIC_COLOR_UTILITY_RE.test(value)) {
            // Mark cva node for later cross-reference
            node._rdnaHasSemanticColors = true;
            break;
          }
        }
      },

      'Program:exit'() {
        const reported = new Set();

        for (const [variant, elements] of variantNodes.entries()) {
          for (const el of elements) {
            // Direct: element itself has semantic color utilities
            if (elementsWithSemanticColors.has(el)) {
              const key = `${variant}:${el.loc.start.line}`;
              if (reported.has(key)) continue;
              reported.add(key);
              context.report({
                node: el,
                messageId: 'mixedAuthority',
                data: { variant },
              });
              continue;
            }

            // Indirect: element's className references a cva() call with semantic colors
            for (const attr of el.attributes) {
              if (attr.name && attr.name.name === 'className' && attr.value) {
                if (hasCvaWithSemanticColors(attr.value)) {
                  const key = `${variant}:${el.loc.start.line}`;
                  if (reported.has(key)) continue;
                  reported.add(key);
                  context.report({
                    node: el,
                    messageId: 'mixedAuthority',
                    data: { variant },
                  });
                }
              }
            }
          }
        }
      },
    };
  },
};

function hasCvaWithSemanticColors(valueNode) {
  if (!valueNode) return false;
  if (valueNode.type === 'JSXExpressionContainer') {
    return hasCvaWithSemanticColors(valueNode.expression);
  }
  if (valueNode.type === 'CallExpression') {
    if (valueNode._rdnaHasSemanticColors) return true;
    // Check if the callee is a function that was called with a cva result
    for (const arg of valueNode.arguments) {
      if (hasCvaWithSemanticColors(arg)) return true;
    }
  }
  return false;
}

export default rule;
