import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../rules/no-viewport-units-in-window-layout.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/no-viewport-units-in-window-layout', () => {
  it('passes RuleTester', () => {
    tester.run('no-viewport-units-in-window-layout', rule, {
      valid: [
        { code: '<div className="absolute inset-0 w-full min-h-full @md:flex" />' },
        { code: '<div style={{ width: "100%", minHeight: "100%" }} />' },
        { code: '<div data-rdna-window-layout="outside-app-window" className="fixed z-system" style={{ top: 56, right: 16 }} />' },
      ],
      invalid: [
        {
          code: '<div className="fixed inset-0 min-h-screen w-screen max-h-[100dvh] w-[50vw]" />',
          errors: [
            { messageId: 'fixedPosition' },
            { messageId: 'screenUtility' },
            { messageId: 'screenUtility' },
            { messageId: 'viewportUnit' },
            { messageId: 'viewportUnit' },
          ],
        },
        {
          code: '<div style={{ position: "fixed", height: "100vh", width: `calc(100vw - 2rem)` }} />',
          errors: [
            { messageId: 'fixedPositionStyle' },
            { messageId: 'viewportUnitStyle' },
            { messageId: 'viewportUnitStyle' },
          ],
        },
      ],
    });
  });
});
