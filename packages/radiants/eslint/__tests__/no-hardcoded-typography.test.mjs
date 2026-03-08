import { Linter, RuleTester } from 'eslint';
import { describe, expect, it } from 'vitest';
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
        // Tokenized typography vars in style are allowed
        { code: '<p style={{ fontSize: "var(--font-size-sm)" }} />' },
        { code: '<p style={{ fontWeight: "var(--font-weight-semibold)" }} />' },
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
        {
          code: '<p style={{ fontSize: `${size}px` }} />',
          errors: [{ messageId: 'hardcodedTypographyStyle' }],
        },
      ],
    });
  });

  it('allows tokenized typography vars and flags template-literal style values', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-hardcoded-typography', rule);
    const config = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      rules: { 'rdna/no-hardcoded-typography': 'error' },
    };

    expect(linter.verify('<p style={{ fontSize: "var(--font-size-sm)" }} />', config)).toHaveLength(0);
    expect(linter.verify('<p style={{ fontWeight: "var(--font-weight-semibold)" }} />', config)).toHaveLength(0);

    const templateMessages = linter.verify('<p style={{ fontSize: `${size}px` }} />', config);
    expect(templateMessages).toHaveLength(1);
    expect(templateMessages[0].messageId).toBe('hardcodedTypographyStyle');
  });

  it('flags computed literal typography style keys', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-hardcoded-typography', rule);
    const config = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      rules: { 'rdna/no-hardcoded-typography': 'error' },
    };

    const messages = linter.verify('<p style={{ ["fontSize"]: "14px" }} />', config);
    expect(messages).toHaveLength(1);
    expect(messages[0].messageId).toBe('hardcodedTypographyStyle');
  });

  it('flags arbitrary typography inside object-syntax class-builder calls', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-hardcoded-typography', rule);
    const config = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      rules: { 'rdna/no-hardcoded-typography': 'error' },
    };

    const messages = linter.verify('const c = cn({ "text-[44px]": active, "font-[450]": ready });', config);
    expect(messages).toHaveLength(2);
    expect(messages[0].messageId).toBe('arbitraryTextSize');
    expect(messages[1].messageId).toBe('arbitraryFontWeight');
  });

  it('allows tokenized typography inside class builders and computed style keys', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-hardcoded-typography', rule);
    const classConfig = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      rules: { 'rdna/no-hardcoded-typography': 'error' },
    };
    const styleConfig = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      rules: { 'rdna/no-hardcoded-typography': 'error' },
    };

    expect(linter.verify('const c = cn({ "text-base": active, "font-semibold": ready });', classConfig)).toHaveLength(0);
    expect(
      linter.verify(
        '<p style={{ ["fontSize"]: "var(--font-size-sm)", ["fontWeight"]: "var(--font-weight-semibold)" }} />',
        styleConfig
      )
    ).toHaveLength(0);
  });
});
