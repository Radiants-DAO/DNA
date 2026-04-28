import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../rules/require-icon-button-label.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/require-icon-button-label', () => {
  it('passes RuleTester', () => {
    tester.run('require-icon-button-label', rule, {
      valid: [
        { code: '<button aria-label="Close"><Icon name="x" /></button>' },
        { code: '<button><span className="sr-only">Close</span><Icon name="x" /></button>' },
        { code: '<Button icon={<Icon name="x" />} aria-label="Close" />' },
        { code: '<Button icon="copy">{copied ? "Copied" : "Copy"}</Button>' },
        { code: '<IconCell label="Undo"><Icon name="undo" /></IconCell>' },
        { code: '<button>Save</button>' },
      ],
      invalid: [
        {
          code: '<button><Icon name="x" /></button>',
          errors: [{ messageId: 'missingIconButtonLabel' }],
        },
        {
          code: '<Button icon={<Icon name="x" />} />',
          errors: [{ messageId: 'missingIconButtonLabel' }],
        },
        {
          code: '<IconCell><Icon name="undo" /></IconCell>',
          errors: [{ messageId: 'missingIconButtonLabel' }],
        },
      ],
    });
  });
});
