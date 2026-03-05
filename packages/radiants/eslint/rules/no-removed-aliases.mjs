/**
 * rdna/no-removed-aliases
 * Bans usage of removed token alias names.
 * Scans all string literals and template literals for var(--removed-alias).
 */
import { removedAliases } from '../token-map.mjs';

const aliasPattern = new RegExp(
  removedAliases.map(a => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'g'
);

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
      aliasPattern.lastIndex = 0;
      let match;
      while ((match = aliasPattern.exec(value)) !== null) {
        context.report({
          node,
          messageId: 'removedAlias',
          data: { alias: match[0] },
        });
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
