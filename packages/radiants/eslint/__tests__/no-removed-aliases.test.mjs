// packages/radiants/eslint/__tests__/no-removed-aliases.test.mjs
import { Linter, RuleTester } from 'eslint';
import { describe, expect, it } from 'vitest';
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
        { code: 'const x = "var(--color-black-opaque)";' },
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

  it('does not flag alias prefixes inside distinct token names', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-removed-aliases', rule);

    const messages = linter.verify('const x = "var(--color-black-opaque)";', {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      rules: { 'rdna/no-removed-aliases': 'error' },
    });

    expect(messages).toHaveLength(0);
  });
});
