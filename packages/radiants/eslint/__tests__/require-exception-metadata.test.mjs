import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';
import rule from '../rules/require-exception-metadata.mjs';

describe('rdna/require-exception-metadata', () => {
  function lint(code) {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/require-exception-metadata', rule);
    // Define a stub rule so eslint-disable-next-line rdna/no-hardcoded-colors is valid
    linter.defineRule('rdna/no-hardcoded-colors', { meta: {}, create() { return {}; } });
    linter.defineRule('rdna/no-hardcoded-spacing', { meta: {}, create() { return {}; } });
    return linter.verify(code, {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      rules: {
        'rdna/require-exception-metadata': 'error',
        'rdna/no-hardcoded-colors': 'warn',
        'rdna/no-hardcoded-spacing': 'warn',
      },
    });
  }

  it('allows fully-annotated eslint-disable-next-line for rdna rules', () => {
    const result = lint(
      '// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:legacy owner:design expires:2026-04-01 issue:DNA-123\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(0);
  });

  it('allows fully-annotated eslint-disable for rdna rules', () => {
    const result = lint(
      '/* eslint-disable rdna/no-hardcoded-colors -- reason:gradient owner:design expires:2026-04-01 issue:DNA-456 */\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(0);
  });

  it('allows multiline block comments with metadata on following lines', () => {
    const result = lint(
      '/* eslint-disable rdna/no-hardcoded-colors --\nreason:legacy\nowner:design\nexpires:2026-04-01\nissue:DNA-123\n*/\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(0);
  });

  it('ignores non-rdna disable comments', () => {
    const result = lint(
      '// eslint-disable-next-line no-unused-vars\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(0);
  });

  it('flags missing reason', () => {
    const result = lint(
      '// eslint-disable-next-line rdna/no-hardcoded-colors -- owner:design expires:2026-04-01 issue:DNA-123\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(1);
    expect(ours[0].message).toContain('reason');
  });

  it('flags missing owner', () => {
    const result = lint(
      '// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:legacy expires:2026-04-01 issue:DNA-123\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(1);
    expect(ours[0].message).toContain('owner');
  });

  it('flags missing expires', () => {
    const result = lint(
      '// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:legacy owner:design issue:DNA-123\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(1);
    expect(ours[0].message).toContain('expires');
  });

  it('flags missing issue', () => {
    const result = lint(
      '// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:legacy owner:design expires:2026-04-01\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(1);
    expect(ours[0].message).toContain('issue');
  });

  it('flags rdna disable with no metadata at all', () => {
    const result = lint(
      '// eslint-disable-next-line rdna/no-hardcoded-colors\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(1);
  });

  it('flags multiple missing fields in one message', () => {
    const result = lint(
      '// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:legacy\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(1);
    expect(ours[0].message).toContain('owner');
    expect(ours[0].message).toContain('expires');
    expect(ours[0].message).toContain('issue');
  });

  it('does not treat field-like substrings inside other metadata values as valid fields', () => {
    const result = lint(
      '// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:legacy expires:2026-04-01 issue:https://dna.test/exceptions?owner:fake\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(1);
    expect(ours[0].message).toContain('owner');
  });
});
