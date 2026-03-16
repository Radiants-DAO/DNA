import { Linter, RuleTester } from 'eslint';
import { describe, expect, it } from 'vitest';
import rule from '../rules/no-viewport-breakpoints-in-window-layout.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/no-viewport-breakpoints-in-window-layout', () => {
  it('passes RuleTester', () => {
    tester.run('no-viewport-breakpoints-in-window-layout', rule, {
      valid: [
        // Container query variants are fine
        { code: '<div className="@sm:grid-cols-2" />' },
        { code: '<div className="@md:flex-row" />' },
        { code: '<div className="@lg:hidden" />' },
        // No breakpoint prefix at all
        { code: '<div className="flex gap-2 rounded-md" />' },
        // Modifier prefixes that are NOT viewport breakpoints
        { code: '<div className="hover:bg-page" />' },
        { code: '<div className="dark:text-main" />' },
        { code: '<div className="focus:ring-2" />' },
      ],
      invalid: [
        {
          code: '<div className="md:grid-cols-2" />',
          errors: [{ messageId: 'viewportBreakpoint' }],
        },
        {
          code: '<div className="lg:flex" />',
          errors: [{ messageId: 'viewportBreakpoint' }],
        },
        {
          code: '<div className="sm:hidden" />',
          errors: [{ messageId: 'viewportBreakpoint' }],
        },
        {
          code: '<div className="xl:gap-4" />',
          errors: [{ messageId: 'viewportBreakpoint' }],
        },
        {
          code: '<div className="2xl:max-w-[42rem]" />',
          errors: [{ messageId: 'viewportBreakpoint' }],
        },
        // Multiple breakpoints in one className
        {
          code: '<div className="sm:hidden md:block lg:flex" />',
          errors: [
            { messageId: 'viewportBreakpoint' },
            { messageId: 'viewportBreakpoint' },
            { messageId: 'viewportBreakpoint' },
          ],
        },
        // Complex variant chains — full token preserved in diagnostic
        {
          code: '<div className="md:data-[state=open]:flex" />',
          errors: [{ messageId: 'viewportBreakpoint' }],
        },
        {
          code: '<div className="md:[&_svg]:hidden" />',
          errors: [{ messageId: 'viewportBreakpoint' }],
        },
      ],
    });
  });

  it('flags viewport breakpoints inside class-builder calls', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-viewport-breakpoints-in-window-layout', rule);
    const config = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      rules: { 'rdna/no-viewport-breakpoints-in-window-layout': 'error' },
    };

    expect(linter.verify('const c = cn("md:grid-cols-2");', config)).toHaveLength(1);
    expect(linter.verify('const c = cn(active && "lg:flex");', config)).toHaveLength(1);
    expect(linter.verify('const c = cn({ "md:grid-cols-2": active });', config)).toHaveLength(1);
    // Container queries should pass
    expect(linter.verify('const c = cn("@md:flex-row");', config)).toHaveLength(0);
  });

  it('does not double-report when cn() is inside JSX className', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-viewport-breakpoints-in-window-layout', rule);
    const config = {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      rules: { 'rdna/no-viewport-breakpoints-in-window-layout': 'error' },
    };

    const result = linter.verify('<div className={cn("md:grid-cols-2")} />', config);
    expect(result).toHaveLength(1);
  });
});
