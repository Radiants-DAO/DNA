import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../rules/no-arbitrary-icon-size.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/no-arbitrary-icon-size', () => {
  it('passes RuleTester', () => {
    tester.run('no-arbitrary-icon-size', rule, {
      valid: [
        { code: '<Icon name="search" />' },
        { code: '<Icon name="search" size={21} />' },
        { code: '<Icon name="search" large />' },
      ],
      invalid: [
        {
          code: '<Icon name="search" size={16} />',
          errors: [{ messageId: 'preferDefaultSize' }],
        },
        {
          code: '<Icon name="search" size={24} />',
          errors: [{ messageId: 'preferLarge' }],
        },
        {
          code: '<Icon name="search" size={18} />',
          errors: [{ messageId: 'arbitrarySize' }],
        },
        {
          code: '<Icon name="search" size={iconSize} />',
          errors: [{ messageId: 'dynamicSize' }],
        },
        {
          code: '<Icon name="search" iconSet={24} />',
          errors: [{ messageId: 'bannedIconSet' }],
        },
      ],
    });
  });
});
