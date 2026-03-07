import { Linter, RuleTester } from 'eslint';
import { describe, expect, it } from 'vitest';
import rule from '../rules/no-hardcoded-motion.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/no-hardcoded-motion', () => {
  it('passes RuleTester', () => {
    tester.run('no-hardcoded-motion', rule, {
      valid: [
        { code: '<div className="duration-base ease-standard" />' },
        { code: '<div className="transition-colors duration-base" />' },
        { code: '<div className="duration-fast" />' },
        { code: '<div className="duration-slow" />' },
        { code: '<div className="duration-moderate" />' },
        { code: '<div className="duration-instant" />' },
        // var() references in style are allowed — standalone or composed in shorthand
        { code: '<div style={{ transitionDuration: "var(--duration-base)" }} />' },
        { code: '<div style={{ transition: "opacity var(--duration-base) var(--ease-standard)" }} />' },
        { code: '<div style={{ transition: "all var(--duration-fast) var(--ease-standard)" }} />' },
        // Non-motion arbitrary values — not this rule's job
        { code: '<div className="bg-[#fff]" />' },
        { code: '<div className="p-[12px]" />' },
      ],
      invalid: [
        {
          code: '<div className="duration-[175ms]" />',
          errors: [{ messageId: 'arbitraryDuration' }],
        },
        {
          code: '<div className="ease-[cubic-bezier(0.4,0,0.2,1)]" />',
          errors: [{ messageId: 'arbitraryEasing' }],
        },
        {
          code: '<div className="hover:duration-[200ms]" />',
          errors: [{ messageId: 'arbitraryDuration' }],
        },
        // Inline style: transition shorthand
        {
          code: '<div style={{ transition: "all 200ms ease-out" }} />',
          errors: [{ messageId: 'hardcodedMotionStyle' }],
        },
        // Inline style: animationDuration
        {
          code: '<div style={{ animationDuration: "150ms" }} />',
          errors: [{ messageId: 'hardcodedMotionStyle' }],
        },
        // Inline style: transitionDuration
        {
          code: '<div style={{ transitionDuration: "200ms" }} />',
          errors: [{ messageId: 'hardcodedMotionStyle' }],
        },
        // Inline style: animationTimingFunction
        {
          code: '<div style={{ animationTimingFunction: "ease-in-out" }} />',
          errors: [{ messageId: 'hardcodedMotionStyle' }],
        },
        // Mixed shorthand: hardcoded duration + tokenized easing
        {
          code: '<div style={{ transition: "opacity 200ms var(--ease-standard)" }} />',
          errors: [{ messageId: 'hardcodedMotionStyle' }],
        },
        // Mixed shorthand: tokenized duration + hardcoded easing
        {
          code: '<div style={{ transition: "opacity var(--duration-base) ease-out" }} />',
          errors: [{ messageId: 'hardcodedMotionStyle' }],
        },
      ],
    });
  });

  it('flags arbitrary motion inside class-builder calls', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-hardcoded-motion', rule);
    const config = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      rules: { 'rdna/no-hardcoded-motion': 'error' },
    };

    expect(linter.verify('const c = cn(["duration-[175ms]"]);', config)).toHaveLength(1);
    expect(linter.verify('const c = clsx(active && "ease-[cubic-bezier(0.4,0,0.2,1)]");', config)).toHaveLength(1);
    // Clean calls should produce 0
    expect(linter.verify('const c = cn("duration-base ease-standard");', config)).toHaveLength(0);
  });

  it('does not double-report when cn() is inside JSX className', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-hardcoded-motion', rule);
    const config = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      rules: { 'rdna/no-hardcoded-motion': 'error' },
    };

    const result = linter.verify('<div className={cn("duration-[175ms]")} />', config);
    expect(result).toHaveLength(1);
  });
});
