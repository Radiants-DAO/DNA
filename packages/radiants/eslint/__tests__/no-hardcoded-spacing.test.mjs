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
        // Tokenized spacing vars in style are allowed
        { code: '<div style={{ gap: "var(--space-4)" }} />' },
        { code: '<div style={{ padding: "var(--spacing-md)" }} />' },
        // Non-spacing arbitrary values — not this rule's job
        { code: '<div className="bg-[#fff]" />' },
        { code: '<div className="text-[1.5rem]" />' },
        // Arbitrary non-spacing brackets
        { code: '<div className="grid-cols-[1fr_2fr]" />' },
        // Percentage-based arbitrary spacing — allowed (responsive)
        { code: '<div className="mx-[5%]" />' },
        { code: '<div className="p-[8%]" />' },
        { code: '<div className="m-[6%]" />' },
        // Rem-based arbitrary spacing — allowed (scalable)
        { code: '<div className="mt-[1.5rem]" />' },
        { code: '<div className="p-[2rem]" />' },
        { code: '<div className="gap-[1rem]" />' },
        // Tokenized CSS vars — allowed.
        { code: '<div className="gap-[--ctrl-cell-gap]" />' },
        // CSS math functions — allowed (responsive)
        { code: '<div className="p-[clamp(1rem,2vw,2rem)]" />' },
        { code: '<div className="gap-[calc(1rem+4px)]" />' },
        { code: '<div className="m-[min(2rem,5%)]" />' },
        { code: '<div className="p-[max(1rem,16px)]" />' },
        // With Tailwind modifier prefixes — still allowed
        { code: '<div className="hover:p-[2rem]" />' },
        { code: '<div className="dark:gap-[5%]" />' },
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
        {
          code: '<div style={{ gap: `${size}px` }} />',
          errors: [{ messageId: 'hardcodedSpacingStyle' }],
        },
      ],
    });
  });

  it('flags arbitrary spacing inside class-builder calls', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-hardcoded-spacing', rule);
    const config = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      rules: { 'rdna/no-hardcoded-spacing': 'error' },
    };

    // Direct string arg
    expect(linter.verify('const classes = cva("p-[12px]");', config)).toHaveLength(1);

    // Logical: active && "p-[12px]"
    expect(linter.verify('const c = cn(active && "p-[12px]");', config)).toHaveLength(1);

    // Conditional: active ? "gap-[13px]" : "gap-4"
    expect(linter.verify('const c = clsx(active ? "gap-[13px]" : "gap-4");', config)).toHaveLength(1);

    // Array arg: ["p-[12px]"]
    expect(linter.verify('const c = cn(["p-[12px]"]);', config)).toHaveLength(1);

    // Object arg: { "p-[12px]": active }
    expect(linter.verify('const c = cn({ "p-[12px]": active });', config)).toHaveLength(1);

    // Clean calls should produce 0
    expect(linter.verify('const c = cn(active && "p-4");', config)).toHaveLength(0);
  });

  it('allows tokenized spacing vars and flags template-literal style values', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-hardcoded-spacing', rule);
    const config = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      rules: { 'rdna/no-hardcoded-spacing': 'error' },
    };

    expect(linter.verify('<div style={{ gap: "var(--space-4)" }} />', config)).toHaveLength(0);

    const templateMessages = linter.verify('<div style={{ gap: `${size}px` }} />', config);
    expect(templateMessages).toHaveLength(1);
    expect(templateMessages[0].messageId).toBe('hardcodedSpacingStyle');
  });

  it('flags computed literal spacing style keys', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-hardcoded-spacing', rule);
    const config = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      rules: { 'rdna/no-hardcoded-spacing': 'error' },
    };

    const messages = linter.verify('<div style={{ ["gap"]: "13px" }} />', config);
    expect(messages).toHaveLength(1);
    expect(messages[0].messageId).toBe('hardcodedSpacingStyle');
  });

  it('allows scale spacing in class builders and computed tokenized style keys', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-hardcoded-spacing', rule);
    const classConfig = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      rules: { 'rdna/no-hardcoded-spacing': 'error' },
    };
    const styleConfig = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      rules: { 'rdna/no-hardcoded-spacing': 'error' },
    };

    expect(linter.verify('const c = cn({ "p-4": active, "gap-2": ready });', classConfig)).toHaveLength(0);
    expect(linter.verify('<div style={{ ["gap"]: "var(--space-4)" }} />', styleConfig)).toHaveLength(0);
  });
});
