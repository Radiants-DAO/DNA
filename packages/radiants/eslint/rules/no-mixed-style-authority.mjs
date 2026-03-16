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
import { getClassNameStrings, getStaticStringValue } from '../utils.mjs';

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

    // Track identifiers that resolve to cva itself or to simple cva wrappers.
    const cvaFactoryCandidates = new Map();
    const cvaIdentifiersWithColors = new Set();
    const variantBuilderCandidates = [];

    // Track import aliases like `import { cva as makeVariants } from '...'`
    const cvaImportAliases = new Set();

    // Track per-file: variant usage nodes and semantic color presence
    const variantNodes = new Map(); // variant -> Set of JSXOpeningElement nodes
    const elementsWithSemanticColors = new Set(); // JSXOpeningElement nodes
    const classNameValueNodes = new Map(); // JSXOpeningElement -> JSXAttribute value node

    return {
      ImportDeclaration(node) {
        const source = node.source && node.source.value;
        if (source !== 'class-variance-authority' && source !== 'cva') return;

        for (const spec of node.specifiers) {
          if (
            spec.type === 'ImportSpecifier' &&
            spec.imported.name === 'cva' &&
            spec.local.name !== 'cva'
          ) {
            cvaImportAliases.add(spec.local.name);
          }
        }
      },

      VariableDeclarator(node) {
        if (node.id.type !== 'Identifier' || !node.init) return;

        cvaFactoryCandidates.set(node.id.name, node.init);

        if (node.init.type === 'CallExpression') {
          variantBuilderCandidates.push({
            init: node.init,
            name: node.id.name,
          });
        }
      },

      FunctionDeclaration(node) {
        if (!node.id?.name) return;
        cvaFactoryCandidates.set(node.id.name, node);
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
          classNameValueNodes.set(openingEl, node.value);

          // Direct: className="bg-page ..."
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
        const cvaFactories = resolveCvaFactoryIdentifiers(cvaFactoryCandidates, cvaImportAliases);

        for (const candidate of variantBuilderCandidates) {
          if (!isKnownCvaFactoryCall(candidate.init, cvaFactories)) continue;

          for (const arg of candidate.init.arguments) {
            const strings = getClassNameStrings(arg);
            for (const { value } of strings) {
              if (SEMANTIC_COLOR_UTILITY_RE.test(value)) {
                cvaIdentifiersWithColors.add(candidate.name);
                break;
              }
            }

            if (cvaIdentifiersWithColors.has(candidate.name)) break;
          }
        }

        for (const [openingEl, valueNode] of classNameValueNodes.entries()) {
          if (elementsWithSemanticColors.has(openingEl)) continue;
          if (referencesCvaWithColors(valueNode, cvaIdentifiersWithColors)) {
            elementsWithSemanticColors.add(openingEl);
          }
        }

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

function resolveCvaFactoryIdentifiers(candidates, importAliases) {
  const knownFactories = new Set(['cva']);
  if (importAliases) {
    for (const alias of importAliases) {
      knownFactories.add(alias);
    }
  }
  let changed = true;

  while (changed) {
    changed = false;
    for (const [name, candidate] of candidates.entries()) {
      if (knownFactories.has(name)) continue;
      if (isCvaFactoryCandidate(candidate, knownFactories)) {
        knownFactories.add(name);
        changed = true;
      }
    }
  }

  return knownFactories;
}

function isCvaFactoryCandidate(candidate, knownFactories) {
  if (!candidate) return false;

  if (candidate.type === 'Identifier') {
    return knownFactories.has(candidate.name);
  }

  if (
    candidate.type === 'ArrowFunctionExpression' ||
    candidate.type === 'FunctionExpression' ||
    candidate.type === 'FunctionDeclaration'
  ) {
    const returnedExpr = getReturnedExpression(candidate);
    return returnedExpr ? isKnownCvaFactoryCall(returnedExpr, knownFactories) : false;
  }

  return false;
}

function getReturnedExpression(fnNode) {
  if (fnNode.body.type !== 'BlockStatement') {
    return fnNode.body;
  }

  for (const statement of fnNode.body.body) {
    if (statement.type === 'ReturnStatement') {
      return statement.argument;
    }
  }

  return null;
}

function isKnownCvaFactoryCall(node, knownFactories) {
  if (node?.type !== 'CallExpression') return false;
  return node.callee.type === 'Identifier' && knownFactories.has(node.callee.name);
}

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

export default rule;
