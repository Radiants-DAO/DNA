import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../rules/no-dynamic-tailwind-token-construction.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/no-dynamic-tailwind-token-construction', () => {
  it('passes RuleTester', () => {
    tester.run('no-dynamic-tailwind-token-construction', rule, {
      valid: [
        { code: '<div className={active ? "bg-page" : "bg-card"} />' },
        { code: '<div className={`bg-page ${active ? "text-main" : "text-mute"}`} />' },
        { code: 'cn("bg-page", toneMap[tone])' },
      ],
      invalid: [
        {
          code: '<div className={`bg-${tone} text-main`} />',
          errors: [{ messageId: 'dynamicClassToken' }],
        },
        {
          code: 'cn("p-2", `text-${tone}`, active && `w-[${size}px]`)',
          errors: [{ messageId: 'dynamicClassToken' }, { messageId: 'dynamicClassToken' }],
        },
      ],
    });
  });
});
