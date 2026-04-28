import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../rules/no-z-index-literals.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/no-z-index-literals', () => {
  it('passes RuleTester', () => {
    tester.run('no-z-index-literals', rule, {
      valid: [
        { code: '<div className="z-base z-menus z-system" />' },
        { code: '<div style={{ zIndex: "var(--z-index-modals)" }} />' },
      ],
      invalid: [
        {
          code: '<div className="z-10 z-[9999]" />',
          errors: [{ messageId: 'rawZIndexClass' }, { messageId: 'rawZIndexClass' }],
        },
        {
          code: '<div style={{ zIndex: 999, "--z-index-local": 10 }} />',
          errors: [{ messageId: 'rawZIndexStyle' }, { messageId: 'rawZIndexStyle' }],
        },
      ],
    });
  });
});
