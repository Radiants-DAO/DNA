import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../rules/no-unregistered-design-token-vars.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/no-unregistered-design-token-vars', () => {
  it('passes RuleTester', () => {
    tester.run('no-unregistered-design-token-vars', rule, {
      valid: [
        { code: '<div className="bg-[var(--color-page)] shadow-[var(--shadow-raised)]" />' },
        { code: '<div className="bg-[var(--color-ink)] text-[var(--color-cream)]" />' },
        { code: '<div style={{ color: "var(--color-main)", zIndex: "var(--z-index-menus)", borderRadius: "var(--radius-sm)" }} />' },
        { code: '<div style={{ color: "var(--color-ctrl-glow)" }} />' },
        { code: '<div style={{ width: "var(--app-specific-width)" }} />' },
      ],
      invalid: [
        {
          code: '<div className="bg-[var(--color-brand-new)] shadow-[var(--shadow-mega)]" />',
          errors: [
            { messageId: 'unknownDesignTokenVar' },
            { messageId: 'unknownDesignTokenVar' },
          ],
        },
        {
          code: '<div style={{ color: "var(--color-missing)", zIndex: "var(--z-index-overlay)" }} />',
          errors: [
            { messageId: 'unknownDesignTokenVar' },
            { messageId: 'unknownDesignTokenVar' },
          ],
        },
      ],
    });
  });
});
