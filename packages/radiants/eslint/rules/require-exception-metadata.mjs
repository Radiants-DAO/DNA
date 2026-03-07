/**
 * rdna/require-exception-metadata
 * Requires structured metadata on eslint-disable comments that target rdna/* rules.
 * Format: -- reason:<reason> owner:<team> expires:YYYY-MM-DD issue:<link-or-id>
 *
 * Only inspects comments that disable rdna/ rules. Non-rdna disable comments are ignored.
 */

const REQUIRED_FIELDS = ['reason', 'owner', 'expires', 'issue'];
const DISABLE_PATTERN = /eslint-disable(?:-next-line|-line)?\s+([\s\S]+)/;
const FIELD_PATTERN = /(?:^|\s)(reason|owner|expires|issue):/g;

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

          const afterDirective = match[1].trim();

          // Check if any rdna/ rule is being disabled
          if (!afterDirective.includes('rdna/')) continue;

          // Extract the metadata portion after --
          const dashIndex = afterDirective.indexOf('--');
          const metadata = dashIndex >= 0 ? afterDirective.slice(dashIndex + 2) : '';
          const foundFields = parseMetadataFields(metadata);
          const missing = REQUIRED_FIELDS.filter(field => !foundFields.has(field));

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

function parseMetadataFields(metadata) {
  const fields = new Set();
  for (const match of metadata.matchAll(FIELD_PATTERN)) {
    fields.add(match[1]);
  }
  return fields;
}

export default rule;
