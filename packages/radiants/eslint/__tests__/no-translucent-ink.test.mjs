import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../rules/no-translucent-ink.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/no-translucent-ink', () => {
  it('passes RuleTester', () => {
    tester.run('no-translucent-ink', rule, {
      valid: [
        { code: '<div className="bg-page text-main border-rule" />' },
        { code: '<div className="bg-depth opacity-0" />' },
        { code: '<div className="bg-depth opacity-100" />' },
        { code: '<div style={{ backgroundColor: "var(--color-page)" }} />' },
        { code: '<div style={{ opacity: 0.5, backgroundColor: "var(--color-page)" }} />' },
      ],
      invalid: [
        {
          code: '<div className="bg-black/50" />',
          errors: [{ messageId: 'translucentInkUtility' }],
        },
        {
          code: '<div className="border-ink/20" />',
          errors: [{ messageId: 'translucentInkUtility' }],
        },
        {
          code: '<div className="bg-black opacity-50" />',
          errors: [{ messageId: 'opacityOnInk' }],
        },
        {
          code: '<div className={cn("bg-depth", active && "opacity-70")} />',
          errors: [{ messageId: 'opacityOnInk' }],
        },
        {
          code: '<div className="shadow-[0_4px_20px_rgba(0,0,0,0.25)]" />',
          errors: [{ messageId: 'translucentInkValue' }],
        },
        {
          code: '<div style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }} />',
          errors: [{ messageId: 'translucentInkValue' }],
        },
        {
          code: '<div style={{ backgroundColor: "black", opacity: 0.5 }} />',
          errors: [{ messageId: 'opacityStyleOnInk' }],
        },
        {
          code: '<div style={{ color: "var(--color-page)", opacity: 0.5 }} />',
          errors: [{ messageId: 'opacityStyleOnInk' }],
        },
        {
          code: '<div style={{ color: "var(--color-ink)", opacity: "0.7" }} />',
          errors: [{ messageId: 'opacityStyleOnInk' }],
        },
      ],
    });
  });
});
