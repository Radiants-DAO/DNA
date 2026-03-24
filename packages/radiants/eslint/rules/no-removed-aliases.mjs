/**
 * rdna/no-removed-aliases
 * Bans usage of removed token alias names.
 * Scans all string literals and template literals for var(--removed-alias).
 */
import { tokenMap } from '../contract.mjs';

const removedAliases = tokenMap.removedAliases;

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban removed RDNA token aliases',
    },
    messages: {
      removedAlias:
        'Removed token alias "{{alias}}" found. This token was removed from RDNA. Check DESIGN.md for the current equivalent.',
    },
    schema: [],
  },

  create(context) {
    function checkString(node, value) {
      for (const alias of removedAliases) {
        let startIndex = value.indexOf(alias);
        while (startIndex !== -1) {
          const endIndex = startIndex + alias.length;
          const prevChar = value[startIndex - 1] ?? '';
          const nextChar = value[endIndex] ?? '';
          const hasTokenBoundary = !/[\w-]/.test(prevChar) && !/[\w-]/.test(nextChar);

          if (hasTokenBoundary) {
            context.report({
              node,
              messageId: 'removedAlias',
              data: { alias },
            });
          }

          startIndex = value.indexOf(alias, endIndex);
        }
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') {
          checkString(node, node.value);
        }
      },
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          checkString(quasi, quasi.value.raw);
        }
      },
    };
  },
};

export default rule;
