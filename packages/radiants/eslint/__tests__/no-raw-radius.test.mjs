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
        {
          code: '<div style={{ borderRadius: "6px" }} />',
          errors: [{ messageId: 'hardcodedRadiusStyle' }],
        },
        {
          code: '<div style={{ borderTopLeftRadius: "4px" }} />',
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
    // Clean calls should produce 0
    expect(linter.verify('const c = cn(active && "rounded-md");', config)).toHaveLength(0);
  });
});
