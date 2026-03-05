// packages/radiants/eslint/__tests__/no-removed-aliases.test.mjs
import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../rules/no-removed-aliases.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/no-removed-aliases', () => {
  it('passes RuleTester', () => {
    tester.run('no-removed-aliases', rule, {
      valid: [
        // Current token names — allowed
        { code: '<div className="bg-surface-primary" />' },
        { code: '<div style={{ color: "var(--color-ink)" }} />' },
        { code: 'const x = "var(--color-content-primary)";' },
      ],
      invalid: [
        // Removed alias in className
        {
          code: '<div className="text-[var(--color-black)]" />',
          errors: [{ messageId: 'removedAlias' }],
        },
        // Removed alias in style
        {
          code: '<div style={{ color: "var(--color-white)" }} />',
          errors: [{ messageId: 'removedAlias' }],
        },
        // Removed alias in string literal
        {
          code: 'const bg = "var(--color-green)";',
          errors: [{ messageId: 'removedAlias' }],
        },
        {
          code: 'const bg = "var(--color-success-green)";',
          errors: [{ messageId: 'removedAlias' }],
        },
        {
          code: 'const glow = "var(--glow-green)";',
          errors: [{ messageId: 'removedAlias' }],
        },
      ],
    });
  });
});
