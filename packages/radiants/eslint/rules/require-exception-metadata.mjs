/**
 * rdna/require-exception-metadata
 * Requires valid structured metadata on rdna/* eslint-disable-next-line comments.
 * Format: -- reason:<reason> owner:<team-slug> expires:YYYY-MM-DD issue:DNA-123|https://...
 *
 * Structural enforcement for broad disables lives in rdna/no-broad-rdna-disables.
 */
import {
  REQUIRED_EXCEPTION_FIELDS,
  parseRdnaDisableComment,
  validateExceptionMetadata,
} from '../rdna-disable-comment-utils.mjs';

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require valid reason, owner, expires, and issue metadata on rdna/* eslint-disable-next-line comments',
    },
    messages: {
      missingMetadata:
        'RDNA exception missing required fields: {{missing}}. Format: -- reason:<why> owner:<team-slug> expires:YYYY-MM-DD issue:DNA-123 or https://...',
      malformedMetadata:
        'RDNA exception has malformed metadata: {{fields}}. owner must be a lowercase team slug, expires must be a real YYYY-MM-DD date, and issue must be DNA-123 or https://...',
      expiredMetadata:
        'RDNA exception expired on {{expires}} (today: {{today}}). Renew it explicitly or fix the underlying violation.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          today: {
            type: 'string',
            description: 'UTC YYYY-MM-DD override for deterministic expiry tests',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};

    return {
      Program() {
        const sourceCode = context.sourceCode || context.getSourceCode();
        const comments = sourceCode.getAllComments();

        for (const comment of comments) {
          const parsed = parseRdnaDisableComment(comment.value);
          if (!parsed || parsed.kind !== 'disable-next-line') continue;

          const validation = validateExceptionMetadata(parsed.metadataText, options);
          const missing = REQUIRED_EXCEPTION_FIELDS.filter(field => validation.missing.includes(field));

          if (missing.length > 0) {
            context.report({
              loc: comment.loc,
              messageId: 'missingMetadata',
              data: { missing: missing.join(', ') },
            });
            continue;
          }

          if (validation.malformed.length > 0) {
            context.report({
              loc: comment.loc,
              messageId: 'malformedMetadata',
              data: { fields: validation.malformed.join(', ') },
            });
            continue;
          }

          if (validation.expired) {
            context.report({
              loc: comment.loc,
              messageId: 'expiredMetadata',
              data: {
                expires: validation.expired,
                today: validation.today,
              },
            });
          }
        }
      },
    };
  },
};

export default rule;
