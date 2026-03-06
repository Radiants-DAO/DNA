// packages/radiants/eslint/__tests__/no-hardcoded-spacing.test.mjs
import { Linter, RuleTester } from 'eslint';
import { describe, expect, it } from 'vitest';
import rule from '../rules/no-hardcoded-spacing.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/no-hardcoded-spacing', () => {
  it('passes RuleTester', () => {
    tester.run('no-hardcoded-spacing', rule, {
      valid: [
        // Standard Tailwind spacing utilities — allowed
        { code: '<div className="mt-3 px-4 gap-2" />' },
        { code: '<div className="p-0 m-0" />' },
        { code: '<div className="space-y-4" />' },
        // Non-spacing arbitrary values — not this rule's job
        { code: '<div className="bg-[#fff]" />' },
        { code: '<div className="text-[1.5rem]" />' },
        // Arbitrary non-spacing brackets
        { code: '<div className="grid-cols-[1fr_2fr]" />' },
      ],
      invalid: [
        // Arbitrary spacing in className
        {
          code: '<div className="p-[12px]" />',
          errors: [{ messageId: 'arbitrarySpacing' }],
        },
        {
          code: '<div className="gap-[13px]" />',
          errors: [{ messageId: 'arbitrarySpacing' }],
        },
        {
          code: '<div className="mx-[5%]" />',
          errors: [{ messageId: 'arbitrarySpacing' }],
        },
        {
          code: '<div className="mt-[1.5rem]" />',
          errors: [{ messageId: 'arbitrarySpacing' }],
        },
        {
          code: 'const classes = cva("p-[12px]");',
          errors: [{ messageId: 'arbitrarySpacing' }],
        },
        // Inline spacing styles
        {
          code: '<div style={{ padding: 12 }} />',
          errors: [{ messageId: 'hardcodedSpacingStyle' }],
        },
        {
          code: '<div style={{ gap: "13px" }} />',
          errors: [{ messageId: 'hardcodedSpacingStyle' }],
        },
        {
          code: '<div style={{ margin: "0 auto 12px" }} />',
          errors: [{ messageId: 'hardcodedSpacingStyle' }],
        },
      ],
    });
  });

  it('flags arbitrary spacing inside class-builder calls', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-hardcoded-spacing', rule);

    const messages = linter.verify('const classes = cva("p-[12px]");', {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      rules: { 'rdna/no-hardcoded-spacing': 'error' },
    });

    expect(messages).toHaveLength(1);
    expect(messages[0]?.messageId).toBe('arbitrarySpacing');
  });
});
