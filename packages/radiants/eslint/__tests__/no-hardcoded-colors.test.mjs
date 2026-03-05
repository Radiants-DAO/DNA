import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../rules/no-hardcoded-colors.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/no-hardcoded-colors', () => {
  it('passes RuleTester', () => {
    tester.run('no-hardcoded-colors', rule, {
      valid: [
        // Semantic token classes — allowed
        { code: '<div className="bg-surface-primary text-content-primary" />' },
        { code: '<div className="border-edge-primary" />' },
        { code: '<div className="text-content-link hover:bg-action-primary" />' },
        // Non-color arbitrary values — not this rule's job
        { code: '<div className="p-[12px]" />' },
        // Empty className
        { code: '<div className="" />' },
        // No className
        { code: '<div id="test" />' },
        // Template literal with only dynamic parts
        { code: '<div className={active ? "bg-surface-primary" : "bg-surface-secondary"} />' },
      ],
      invalid: [
        // Arbitrary hex in Tailwind class
        {
          code: '<div className="bg-[#FEF8E2]" />',
          errors: [{ messageId: 'arbitraryColor' }],
          output: '<div className="bg-surface-primary" />',
        },
        // Arbitrary hex — lowercase
        {
          code: '<div className="text-[#0f0e0c]" />',
          errors: [{ messageId: 'arbitraryColor' }],
          output: '<div className="text-content-primary" />',
        },
        // Arbitrary hex — no auto-fix when ambiguous (pure-black has no safe mapping)
        {
          code: '<div className="bg-[#000000]" />',
          errors: [{ messageId: 'arbitraryColor' }],
        },
        // Arbitrary rgb
        {
          code: '<div className="bg-[rgb(254,248,226)]" />',
          errors: [{ messageId: 'arbitraryColor' }],
        },
        // Multiple violations in one className
        {
          code: '<div className="bg-[#FEF8E2] text-[#0f0e0c]" />',
          errors: [{ messageId: 'arbitraryColor' }, { messageId: 'arbitraryColor' }],
          output: '<div className="bg-surface-primary text-content-primary" />',
        },
        // Modifier prefix — hover:bg-[#hex]
        {
          code: '<div className="hover:bg-[#FEF8E2]" />',
          errors: [{ messageId: 'arbitraryColor' }],
          output: '<div className="hover:bg-surface-primary" />',
        },
        // Stacked modifiers — dark:hover:text-[#hex]
        {
          code: '<div className="dark:hover:text-[#0f0e0c]" />',
          errors: [{ messageId: 'arbitraryColor' }],
          output: '<div className="dark:hover:text-content-primary" />',
        },
        // Style object with hex literal
        {
          code: '<div style={{ color: "#0F0E0C" }} />',
          errors: [{ messageId: 'hardcodedColorStyle' }],
        },
        // Style object with rgb
        {
          code: '<div style={{ backgroundColor: "rgb(254, 248, 226)" }} />',
          errors: [{ messageId: 'hardcodedColorStyle' }],
        },
      ],
    });
  });
});
