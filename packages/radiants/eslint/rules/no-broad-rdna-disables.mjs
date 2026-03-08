/**
 * rdna/no-broad-rdna-disables
 * Only allow eslint-disable-next-line for rdna/* rules.
 */
import { parseRdnaDisableComment } from '../rdna-disable-comment-utils.mjs';

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ban broad or same-line eslint-disable comments for rdna/* rules; only eslint-disable-next-line is allowed',
    },
    messages: {
      broadDisable:
        'RDNA rules may only be disabled with eslint-disable-next-line. {{kind}} is not allowed for {{rules}}.',
    },
    schema: [],
  },

  create(context) {
    return {
      Program() {
        const sourceCode = context.sourceCode || context.getSourceCode();
        const comments = sourceCode.getAllComments();

        for (const comment of comments) {
          const parsed = parseRdnaDisableComment(comment.value);
          if (!parsed || parsed.kind === 'disable-next-line') continue;

          context.report({
            loc: comment.loc,
            messageId: 'broadDisable',
            data: {
              kind: `eslint-${parsed.kind}`,
              rules: parsed.rdnaRules.join(', '),
            },
          });
        }
      },
    };
  },
};

export default rule;
