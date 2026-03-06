import { Linter, RuleTester } from 'eslint';
import { describe, expect, it } from 'vitest';
import rule from '../rules/no-raw-shadow.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/no-raw-shadow', () => {
  it('passes RuleTester', () => {
    tester.run('no-raw-shadow', rule, {
      valid: [
        { code: '<div className="shadow-floating" />' },
        { code: '<div className="shadow-focused" />' },
        { code: '<div className="shadow-none" />' },
        { code: '<div className="shadow-raised" />' },
        { code: '<div className="shadow-resting hover:shadow-lifted" />' },
        // Non-shadow arbitrary values — not this rule's job
        { code: '<div className="bg-[#fff]" />' },
        { code: '<div className="p-[12px]" />' },
      ],
      invalid: [
        {
          code: '<div className="shadow-[0_0_0_1px_#000]" />',
          errors: [{ messageId: 'arbitraryShadow' }],
        },
        {
          code: '<div className="drop-shadow-[0_4px_0_#000]" />',
          errors: [{ messageId: 'arbitraryShadow' }],
        },
        {
          code: '<div className="hover:shadow-[0_2px_4px_rgba(0,0,0,0.1)]" />',
          errors: [{ messageId: 'arbitraryShadow' }],
        },
        {
          code: '<div style={{ boxShadow: "0 4px 0 #000" }} />',
          errors: [{ messageId: 'hardcodedShadowStyle' }],
        },
      ],
    });
  });

  it('flags arbitrary shadow inside class-builder calls', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-raw-shadow', rule);
    const config = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      rules: { 'rdna/no-raw-shadow': 'error' },
    };

    expect(linter.verify('const c = clsx(active ? "shadow-[0_0_0_1px_#000]" : "shadow-floating");', config)).toHaveLength(1);
    expect(linter.verify('const c = cn(["shadow-[4px_4px_0_0_#000]"]);', config)).toHaveLength(1);
    // Clean calls should produce 0
    expect(linter.verify('const c = cn(active && "shadow-floating");', config)).toHaveLength(0);
  });
});
