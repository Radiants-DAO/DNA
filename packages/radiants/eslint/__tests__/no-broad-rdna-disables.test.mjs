import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';
import rule from '../rules/no-broad-rdna-disables.mjs';

describe('rdna/no-broad-rdna-disables', () => {
  function lint(code) {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/no-broad-rdna-disables', rule);
    linter.defineRule('rdna/no-hardcoded-colors', { meta: {}, create() { return {}; } });
    linter.defineRule('rdna/no-hardcoded-spacing', { meta: {}, create() { return {}; } });

    return linter.verify(code, {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      rules: {
        'rdna/no-broad-rdna-disables': 'error',
        'rdna/no-hardcoded-colors': 'warn',
        'rdna/no-hardcoded-spacing': 'warn',
      },
    });
  }

  it('allows eslint-disable-next-line for rdna rules', () => {
    const result = lint(
      '// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:legacy owner:design-system expires:2026-04-01 issue:DNA-123\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/no-broad-rdna-disables');
    expect(ours).toHaveLength(0);
  });

  it('allows eslint-disable-next-line comments that target multiple rdna rules', () => {
    const result = lint(
      '// eslint-disable-next-line rdna/no-hardcoded-colors, rdna/no-hardcoded-spacing -- reason:legacy owner:design-system expires:2026-04-01 issue:DNA-123\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/no-broad-rdna-disables');
    expect(ours).toHaveLength(0);
  });

  it('allows block comments when they still use eslint-disable-next-line', () => {
    const result = lint(
      '/* eslint-disable-next-line rdna/no-hardcoded-colors --\nreason:legacy\nowner:design-system\nexpires:2026-04-01\nissue:DNA-123\n*/\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/no-broad-rdna-disables');
    expect(ours).toHaveLength(0);
  });

  it('flags eslint-disable for rdna rules even with metadata', () => {
    const result = lint(
      '/* eslint-disable rdna/no-hardcoded-colors -- reason:legacy owner:design-system expires:2026-04-01 issue:DNA-123 */\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/no-broad-rdna-disables');
    expect(ours).toHaveLength(1);
    expect(ours[0].message).toContain('eslint-disable-next-line');
  });

  it('flags formatted block comments with leading star prefixes for broad rdna disables', () => {
    const result = lint(
      '/*\n * eslint-disable rdna/no-hardcoded-colors --\n * reason:legacy\n * owner:design-system\n * expires:2026-04-01\n * issue:DNA-123\n */\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/no-broad-rdna-disables');
    expect(ours).toHaveLength(1);
    expect(ours[0].message).toContain('eslint-disable-next-line');
  });

  it('flags eslint-disable-line for rdna rules', () => {
    const result = lint(
      'const x = 1; // eslint-disable-line rdna/no-hardcoded-colors -- reason:legacy owner:design-system expires:2026-04-01 issue:DNA-123'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/no-broad-rdna-disables');
    expect(ours).toHaveLength(1);
    expect(ours[0].message).toContain('eslint-disable-line');
  });

  it('ignores broad disables for non-rdna rules', () => {
    const result = lint(
      '/* eslint-disable no-console */\nconsole.log("x");'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/no-broad-rdna-disables');
    expect(ours).toHaveLength(0);
  });

  it('flags comments that mix rdna and non-rdna rules in a broad disable', () => {
    const result = lint(
      '/* eslint-disable no-console, rdna/no-hardcoded-colors -- reason:legacy owner:design-system expires:2026-04-01 issue:DNA-123 */\nconsole.log("x");'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/no-broad-rdna-disables');
    expect(ours).toHaveLength(1);
    expect(ours[0].message).toContain('rdna/no-hardcoded-colors');
  });
});
