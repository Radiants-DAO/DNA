import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../rules/no-raw-layout-values.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/no-raw-layout-values', () => {
  it('passes RuleTester', () => {
    tester.run('no-raw-layout-values', rule, {
      valid: [
        { code: '<div className="w-full h-full min-w-0 max-w-full inset-0 translate-x-0" />' },
        { code: '<div className="w-[50%] max-w-[calc(100%-1rem)] h-[clamp(12rem,50%,24rem)] min-h-[--ctrl-row-height]" />' },
        { code: '<div style={{ width: "50%", maxWidth: "calc(100% - 1rem)", left: "var(--layout-left)", top: `${offset}%` }} />' },
        {
          code: '<div className="w-[21px]" />',
          filename: '/repo/apps/rad-os/components/apps/studio/CanvasArea.tsx',
          options: [{ exemptPaths: ['**/studio/**'] }],
        },
      ],
      invalid: [
        {
          code: '<div className="w-[22rem] h-[120px] left-[17px] -translate-y-[3px]" />',
          errors: [
            { messageId: 'rawLayoutClass' },
            { messageId: 'rawLayoutClass' },
            { messageId: 'rawLayoutClass' },
            { messageId: 'rawLayoutClass' },
          ],
        },
        {
          code: '<div style={{ width: 320, height: "120px", top: `${offset}px` }} />',
          errors: [
            { messageId: 'rawLayoutStyle' },
            { messageId: 'rawLayoutStyle' },
            { messageId: 'rawLayoutStyle' },
          ],
        },
      ],
    });
  });
});
