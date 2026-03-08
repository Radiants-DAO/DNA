// packages/radiants/eslint/__tests__/prefer-rdna-components.test.mjs
import { Linter, RuleTester } from 'eslint';
import { describe, expect, it } from 'vitest';
import rule from '../rules/prefer-rdna-components.mjs';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe('rdna/prefer-rdna-components', () => {
  it('passes RuleTester', () => {
    tester.run('prefer-rdna-components', rule, {
      valid: [
        // RDNA components — allowed
        { code: '<Button>Click</Button>' },
        { code: '<Input placeholder="Search" />' },
        { code: '<Select />' },
        { code: '<Dialog open><DialogContent /></Dialog>' },
        // Native controls intentionally exempted in v1
        { code: '<input type="hidden" name="token" />' },
        { code: '<input type="file" />' },
        { code: '<input type="checkbox" />' },
        { code: '<input type="date" />' },
        // Non-mapped elements — allowed
        { code: '<div>content</div>' },
        { code: '<span>text</span>' },
        { code: '<form onSubmit={handleSubmit}><Input /></form>' },
        { code: '<a href="/about">About</a>' },
        { code: '<img src="logo.png" />' },
        // Internals file — exempt (uses filename option)
        {
          code: '<button onClick={handleClick}>internal</button>',
          options: [{ exemptPaths: ['**/packages/radiants/components/core/**'] }],
          filename: '/repo/packages/radiants/components/core/Button/Button.tsx',
        },
      ],
      invalid: [
        // Raw HTML button
        {
          code: '<button onClick={handleClick}>Save</button>',
          errors: [{ messageId: 'preferRdnaComponent' }],
        },
        // Raw HTML input
        {
          code: '<input type="text" placeholder="Name" />',
          errors: [{ messageId: 'preferRdnaComponent' }],
        },
        {
          code: '<input placeholder="Name" />',
          errors: [{ messageId: 'preferRdnaComponent' }],
        },
        {
          code: '<input type={"text"} placeholder="Name" />',
          errors: [{ messageId: 'preferRdnaComponent' }],
        },
        {
          code: '<input type={inputType} placeholder="Name" />',
          errors: [{ messageId: 'preferRdnaComponent' }],
        },
        // Raw HTML select
        {
          code: '<select><option>A</option></select>',
          errors: [{ messageId: 'preferRdnaComponent' }],
        },
        // Raw HTML textarea
        {
          code: '<textarea rows={5} />',
          errors: [{ messageId: 'preferRdnaComponent' }],
        },
        // Raw HTML dialog
        {
          code: '<dialog open>content</dialog>',
          errors: [{ messageId: 'preferRdnaComponent' }],
        },
        // Raw HTML details
        {
          code: '<details><summary>Title</summary>Body</details>',
          errors: [{ messageId: 'preferRdnaComponent' }],
        },
        // details+summary fires only ONE diagnostic (summary is suppressed)
        {
          code: '<details><summary>Click</summary><p>Content</p></details>',
          errors: [{ messageId: 'preferRdnaComponent' }],
        },
        // Standalone summary (not inside details) still fires
        {
          code: '<summary>Click</summary>',
          errors: [{ messageId: 'preferRdnaComponent' }],
        },
        // summary inside details via Fragment — still suppressed (1 error for details only)
        {
          code: '<details><><summary>Click</summary></><p>Body</p></details>',
          errors: [{ messageId: 'preferRdnaComponent' }],
        },
      ],
    });
  });

  it('flags string expressions and dynamic input types', () => {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/prefer-rdna-components', rule);

    for (const code of [
      '<input type={"text"} placeholder="Name" />',
      '<input type={inputType} placeholder="Name" />',
    ]) {
      const messages = linter.verify(code, {
        parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
        rules: { 'rdna/prefer-rdna-components': 'error' },
      });
      expect(messages).toHaveLength(1);
      expect(messages[0]?.messageId).toBe('preferRdnaComponent');
    }
  });
});
