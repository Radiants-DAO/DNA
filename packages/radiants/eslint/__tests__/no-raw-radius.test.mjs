import { Linter, RuleTester } from 'eslint';
import { describe, expect, it } from 'vitest';
import rule from '../rules/no-raw-radius.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/no-raw-radius', () => {
  it('passes RuleTester', () => {
    tester.run('no-raw-radius', rule, {
      valid: [
        { code: '<div className="rounded-sm" />' },
        { code: '<div className="rounded-md" />' },
        { code: '<div className="rounded-none" />' },
        { code: '<div className="rounded-full" />' },
        { code: '<div className="rounded-xs" />' },
        // Non-radius arbitrary values — not this rule's job
        { code: '<div className="bg-[#fff]" />' },
        { code: '<div className="p-[12px]" />' },
        // var(--radius-*) in style is allowed
        { code: '<div style={{ borderRadius: "var(--radius-sm)" }} />' },
      ],
      invalid: [
        {
          code: '<div className="rounded-[6px]" />',
          errors: [{ messageId: 'arbitraryRadius' }],
        },
        {
          code: '<div className="rounded-t-[8px]" />',
          errors: [{ messageId: 'arbitraryRadius' }],
        },
        {
          code: '<div className="hover:rounded-[6px]" />',
          errors: [{ messageId: 'arbitraryRadius' }],
        },
        // String style
        {
          code: '<div style={{ borderRadius: "6px" }} />',
          errors: [{ messageId: 'hardcodedRadiusStyle' }],
        },
        {
          code: '<div style={{ borderTopLeftRadius: "4px" }} />',
          errors: [{ messageId: 'hardcodedRadiusStyle' }],
        },
        // Numeric style
        {
          code: '<div style={{ borderRadius: 6 }} />',
          errors: [{ messageId: 'hardcodedRadiusStyle' }],
        },
        // Template literal style
        {
          code: '<div style={{ borderRadius: `${size}px` }} />',
          errors: [{ messageId: 'hardcodedRadiusStyle' }],
        },
      ],
    });
  });

  it('flags arbitrary radius inside class-builder calls', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-raw-radius', rule);
    const config = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      rules: { 'rdna/no-raw-radius': 'error' },
    };

    expect(linter.verify('const c = cn(active && "rounded-[6px]");', config)).toHaveLength(1);
    expect(linter.verify('const c = clsx(active ? "rounded-[6px]" : "rounded-md");', config)).toHaveLength(1);
    expect(linter.verify('const c = cn(["rounded-[8px]"]);', config)).toHaveLength(1);
    expect(linter.verify('const c = cn({ "rounded-[6px]": active });', config)).toHaveLength(1);
    // Clean calls should produce 0
    expect(linter.verify('const c = cn(active && "rounded-md");', config)).toHaveLength(0);
  });

  it('does not double-report when cn() is inside JSX className', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-raw-radius', rule);
    const config = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      rules: { 'rdna/no-raw-radius': 'error' },
    };

    const result = linter.verify('<div className={cn("rounded-[6px]")} />', config);
    expect(result).toHaveLength(1);
  });

  it('flags computed literal radius style keys', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-raw-radius', rule);
    const config = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      rules: { 'rdna/no-raw-radius': 'error' },
    };

    const messages = linter.verify('<div style={{ ["borderRadius"]: "8px" }} />', config);
    expect(messages).toHaveLength(1);
    expect(messages[0].messageId).toBe('hardcodedRadiusStyle');
  });

  it('allows tokenized radius values inside class builders and computed style keys', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-raw-radius', rule);
    const classConfig = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      rules: { 'rdna/no-raw-radius': 'error' },
    };
    const styleConfig = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      rules: { 'rdna/no-raw-radius': 'error' },
    };

    expect(linter.verify('const c = cn({ "rounded-md": active, "rounded-full": ready });', classConfig)).toHaveLength(0);
    expect(linter.verify('<div style={{ ["borderRadius"]: "var(--radius-sm)" }} />', styleConfig)).toHaveLength(0);
  });
});
