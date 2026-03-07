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

    // Track identifiers assigned from cva() calls that contain semantic colors
    const cvaIdentifiersWithColors = new Set();

    // Track per-file: variant usage nodes and semantic color presence
    const variantNodes = new Map(); // variant -> Set of JSXOpeningElement nodes
    const elementsWithSemanticColors = new Set(); // JSXOpeningElement nodes

    return {
      // Track: const x = cva("bg-surface-primary ...")
      VariableDeclarator(node) {
        if (
          node.init &&
          node.init.type === 'CallExpression' &&
          node.init.callee.type === 'Identifier' &&
          node.init.callee.name === 'cva' &&
          node.id.type === 'Identifier'
        ) {
          const strings = getClassNameStrings(node.init);
          for (const { value } of strings) {
            if (SEMANTIC_COLOR_UTILITY_RE.test(value)) {
              cvaIdentifiersWithColors.add(node.id.name);
              break;
            }
          }
        }
      },

      JSXAttribute(node) {
        const openingEl = node.parent;
        if (!openingEl || openingEl.type !== 'JSXOpeningElement') return;

        // Track data-variant attributes
        if (node.name.type === 'JSXIdentifier' && node.name.name === 'data-variant') {
          const variant = getStaticStringValue(node.value);
          if (variant && themeVariants.has(variant)) {
            if (!variantNodes.has(variant)) variantNodes.set(variant, new Set());
            variantNodes.get(variant).add(openingEl);
          }
        }

        // Track className with semantic color utilities (direct or via cva identifier)
        if (node.name.name === 'className' && node.value) {
          // Direct: className="bg-surface-primary ..."
          const strings = getClassNameStrings(node.value);
          for (const { value } of strings) {
            if (SEMANTIC_COLOR_UTILITY_RE.test(value)) {
              elementsWithSemanticColors.add(openingEl);
              break;
            }
          }

          // Indirect: className={cvaResult()} or className={cvaResult({ ... })}
          if (!elementsWithSemanticColors.has(openingEl)) {
            if (referencesCvaWithColors(node.value, cvaIdentifiersWithColors)) {
              elementsWithSemanticColors.add(openingEl);
            }
          }
        }
      },

      'Program:exit'() {
        const reported = new Set();

        for (const [variant, elements] of variantNodes.entries()) {
          for (const el of elements) {
            if (!elementsWithSemanticColors.has(el)) continue;
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
      },
    };
  },
};

/**
 * Check if a className value node references a cva-bound identifier that
 * contains semantic colors. Handles patterns like:
 *   className={triggerVariants()}
 *   className={faceVariants({ variant: "secondary" })}
 */
function referencesCvaWithColors(valueNode, cvaIdentifiers) {
  if (!valueNode) return false;
  if (valueNode.type === 'JSXExpressionContainer') {
    return referencesCvaWithColors(valueNode.expression, cvaIdentifiers);
  }
  if (valueNode.type === 'CallExpression') {
    const callee = valueNode.callee;
    if (callee.type === 'Identifier' && cvaIdentifiers.has(callee.name)) {
      return true;
    }

    for (const arg of valueNode.arguments) {
      if (referencesCvaWithColors(arg, cvaIdentifiers)) {
        return true;
      }
    }
  }
  if (valueNode.type === 'LogicalExpression') {
    return (
      referencesCvaWithColors(valueNode.left, cvaIdentifiers) ||
      referencesCvaWithColors(valueNode.right, cvaIdentifiers)
    );
  }
  if (valueNode.type === 'ConditionalExpression') {
    return (
      referencesCvaWithColors(valueNode.consequent, cvaIdentifiers) ||
      referencesCvaWithColors(valueNode.alternate, cvaIdentifiers)
    );
  }
  if (valueNode.type === 'ArrayExpression') {
    return valueNode.elements.some(element =>
      element ? referencesCvaWithColors(element, cvaIdentifiers) : false
    );
  }
  if (valueNode.type === 'SequenceExpression') {
    return valueNode.expressions.some(expression =>
      referencesCvaWithColors(expression, cvaIdentifiers)
    );
  }
  return false;
}

function getStaticStringValue(valueNode) {
  if (!valueNode) return null;
  if (valueNode.type === 'Literal' && typeof valueNode.value === 'string') {
    return valueNode.value;
  }
  if (valueNode.type === 'JSXExpressionContainer') {
    return getStaticStringValue(valueNode.expression);
  }
  if (valueNode.type === 'TemplateLiteral' && valueNode.expressions.length === 0) {
    return valueNode.quasis[0]?.value.cooked ?? null;
  }
  return null;
}

export default rule;
