import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../rules/prefer-ctrl-components.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/prefer-ctrl-components', () => {
  it('passes RuleTester', () => {
    tester.run('prefer-ctrl-components', rule, {
      valid: [
        { code: 'import { Slider } from "@rdna/ctrl"; <div data-ctrl-surface><Slider value={50} /></div>' },
        { code: '<div data-ctrl-surface><div><span>Label</span></div></div>' },
        { code: '<div><button>Outside ctrl surface</button></div>' },
        { code: '<div data-aw="control-surface"><Knob value={50} /></div>' },
        { code: '<div data-aw="control-surface"><button data-aw="control-surface-tab-button" /></div>' },
      ],
      invalid: [
        {
          code: '<div data-ctrl-surface><button>Play</button></div>',
          errors: [{ messageId: 'preferCtrlComponent' }],
        },
        {
          code: '<div data-ctrl-surface><input type="range" /></div>',
          errors: [{ messageId: 'preferCtrlComponent' }],
        },
        {
          code: '<div data-aw="control-surface"><select><option>A</option></select></div>',
          errors: [{ messageId: 'preferCtrlComponent' }],
        },
        {
          code: 'import { Button, Slider } from "@rdna/radiants/components/core"; <div data-ctrl-surface><Button /><Slider /></div>',
          errors: [
            { messageId: 'preferCtrlImport' },
            { messageId: 'preferCtrlImport' },
          ],
        },
      ],
    });
  });
});
