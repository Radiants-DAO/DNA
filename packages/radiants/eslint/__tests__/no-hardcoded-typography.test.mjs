import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../rules/no-hardcoded-typography.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/no-hardcoded-typography', () => {
  it('passes RuleTester', () => {
    tester.run('no-hardcoded-typography', rule, {
      valid: [
        // Allowed text sizes
        { code: '<p className="text-xs" />' },
        { code: '<p className="text-sm" />' },
        { code: '<p className="text-base" />' },
        { code: '<p className="text-lg" />' },
        { code: '<p className="text-xl" />' },
        { code: '<p className="text-2xl" />' },
        { code: '<p className="text-3xl" />' },
        // Allowed font weights
        { code: '<p className="font-normal" />' },
        { code: '<p className="font-medium" />' },
        { code: '<p className="font-semibold" />' },
        { code: '<p className="font-bold" />' },
        // text-* that aren't font sizes (colors, alignment, etc.)
        { code: '<p className="text-content-primary text-center" />' },
        // Non-typography arbitrary values
        { code: '<p className="bg-[#fff]" />' },
      ],
      invalid: [
        // Arbitrary font size — px
        {
          code: '<p className="text-[44px]" />',
          errors: [{ messageId: 'arbitraryTextSize' }],
        },
        // Arbitrary font size — rem
        {
          code: '<p className="text-[1.1rem]" />',
          errors: [{ messageId: 'arbitraryTextSize' }],
        },
        // Arbitrary font weight
        {
          code: '<p className="font-[450]" />',
          errors: [{ messageId: 'arbitraryFontWeight' }],
        },
        // Modifier prefix — hover:text-[size]
        {
          code: '<p className="hover:text-[20px]" />',
          errors: [{ messageId: 'arbitraryTextSize' }],
        },
        // Stacked modifiers — dark:hover:font-[weight]
        {
          code: '<p className="dark:hover:font-[700]" />',
          errors: [{ messageId: 'arbitraryFontWeight' }],
        },
        // Style object — fontSize
        {
          code: '<p style={{ fontSize: "14px" }} />',
          errors: [{ messageId: 'hardcodedTypographyStyle' }],
        },
        // Style object — fontWeight as number
        {
          code: '<p style={{ fontWeight: 450 }} />',
          errors: [{ messageId: 'hardcodedTypographyStyle' }],
        },
      ],
    });
  });
});
