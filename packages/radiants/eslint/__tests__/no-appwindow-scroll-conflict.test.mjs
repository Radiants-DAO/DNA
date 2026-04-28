import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../rules/no-appwindow-scroll-conflict.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/no-appwindow-scroll-conflict', () => {
  it('passes RuleTester', () => {
    tester.run('no-appwindow-scroll-conflict', rule, {
      valid: [
        {
          code: `
            <AppWindow.Island>
              <div className="min-h-full p-4" />
            </AppWindow.Island>
          `,
        },
        {
          code: `
            <AppWindow.Island noScroll>
              <div className="h-full min-h-0 overflow-y-auto" />
            </AppWindow.Island>
          `,
        },
        {
          code: `
            <AppWindow.Island noScroll={true}>
              <div className="h-full min-h-0 overflow-y-auto" />
            </AppWindow.Island>
          `,
        },
        { code: '<div className="h-full min-h-0 overflow-y-auto" />' },
        { code: '<div style={{ height: "100%", minHeight: 0, overflowY: "auto" }} />' },
      ],
      invalid: [
        {
          code: `
            <AppWindow.Island>
              <div className="h-full min-h-0 overflow-y-auto" />
            </AppWindow.Island>
          `,
          errors: [{ messageId: 'nestedIslandScroll' }],
        },
        {
          code: `
            <AppWindow.Island noScroll={false}>
              <div className="h-full min-h-0 overflow-y-auto" />
            </AppWindow.Island>
          `,
          errors: [{ messageId: 'nestedIslandScroll' }],
        },
        {
          code: '<div className="min-h-full overflow-y-auto" />',
          errors: [{ messageId: 'unboundedScrollClass' }],
        },
        {
          code: '<div style={{ minHeight: "100%", overflowY: "auto" }} />',
          errors: [{ messageId: 'unboundedScrollStyle' }],
        },
      ],
    });
  });
});
