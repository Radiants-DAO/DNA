/**
 * rdna/require-exception-metadata
 * Requires structured metadata on eslint-disable comments that target rdna/* rules.
 * Format: -- reason:<reason> owner:<team> expires:YYYY-MM-DD issue:<link-or-id>
 *
 * Only inspects comments that disable rdna/ rules. Non-rdna disable comments are ignored.
 */

const REQUIRED_FIELDS = ['reason', 'owner', 'expires', 'issue'];
const DISABLE_PATTERN = /eslint-disable(?:-next-line)?\s+(.+)/;

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require reason, owner, expires, and issue on rdna/* eslint-disable comments',
    },
    messages: {
      missingMetadata:
        'RDNA exception missing required fields: {{missing}}. Format: -- reason:<why> owner:<team> expires:YYYY-MM-DD issue:<link>',
    },
    schema: [],
  },

  create(context) {
    return {
      Program() {
        const sourceCode = context.sourceCode || context.getSourceCode();
        const comments = sourceCode.getAllComments();

        for (const comment of comments) {
          const text = comment.value.trim();
          const match = text.match(DISABLE_PATTERN);
          if (!match) continue;

          const afterDirective = match[1];

          // Check if any rdna/ rule is being disabled
          if (!afterDirective.includes('rdna/')) continue;

          // Extract the metadata portion after --
          const dashIndex = afterDirective.indexOf('--');
          const metadata = dashIndex >= 0 ? afterDirective.slice(dashIndex + 2) : '';

          const missing = REQUIRED_FIELDS.filter(
            field => !metadata.includes(field + ':')
          );

          if (missing.length > 0) {
            context.report({
              loc: comment.loc,
              messageId: 'missingMetadata',
              data: { missing: missing.join(', ') },
            });
          }
        }
      },
    };
  },
};

export default rule;
