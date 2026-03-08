import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';
import rule from '../rules/require-exception-metadata.mjs';

describe('rdna/require-exception-metadata', () => {
  function lint(code, options = { today: '2026-03-07' }) {
    const linter = new Linter({ configType: 'eslintrc' });
    linter.defineRule('rdna/require-exception-metadata', rule);
    // Define a stub rule so eslint-disable-next-line rdna/no-hardcoded-colors is valid
    linter.defineRule('rdna/no-hardcoded-colors', { meta: {}, create() { return {}; } });
    linter.defineRule('rdna/no-hardcoded-spacing', { meta: {}, create() { return {}; } });
    return linter.verify(code, {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      rules: {
        'rdna/require-exception-metadata': ['error', options],
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

  it('allows fully-annotated block eslint-disable-next-line comments for rdna rules', () => {
    const result = lint(
      '/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:gradient owner:design-system expires:2026-04-01 issue:DNA-456 */\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(0);
  });

  it('allows multiline block comments with metadata on following lines', () => {
    const result = lint(
      '/* eslint-disable-next-line rdna/no-hardcoded-colors --\nreason:legacy gradient\nowner:design-system\nexpires:2026-04-01\nissue:DNA-123\n*/\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(0);
  });

  it('allows formatted block comments with leading star prefixes', () => {
    const result = lint(
      '/*\n * eslint-disable-next-line rdna/no-hardcoded-colors --\n * reason:legacy gradient\n * owner:design-system\n * expires:2026-04-01\n * issue:DNA-123\n */\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(0);
  });

  it('allows a single metadata block for multiple rdna rules on eslint-disable-next-line', () => {
    const result = lint(
      '// eslint-disable-next-line rdna/no-hardcoded-colors, rdna/no-hardcoded-spacing -- reason:legacy owner:design-system expires:2026-04-01 issue:DNA-123\nconst x = 1;'
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

  it('ignores broad rdna disable comments because structural enforcement lives in a separate rule', () => {
    const result = lint(
      '/* eslint-disable rdna/no-hardcoded-colors -- reason:legacy owner:design-system expires:2026-04-01 issue:DNA-123 */\nconst x = 1;'
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
    expect(ours[0].message).toContain('missing');
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

  it('flags empty metadata values as malformed', () => {
    const result = lint(
      '// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:   owner:design-system expires:2026-04-01 issue:DNA-123\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(1);
    expect(ours[0].message).toContain('malformed');
    expect(ours[0].message).toContain('reason');
  });

  it('flags malformed owner values', () => {
    const result = lint(
      '// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:legacy owner:Design Team expires:2026-04-01 issue:DNA-123\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(1);
    expect(ours[0].message).toContain('owner');
    expect(ours[0].message).toContain('malformed');
  });

  it('flags slash-separated owner values because owner must be a slug', () => {
    const result = lint(
      '// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:legacy owner:design/system expires:2026-04-01 issue:DNA-123\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(1);
    expect(ours[0].message).toContain('owner');
    expect(ours[0].message).toContain('malformed');
  });

  it('flags malformed expires values that are not YYYY-MM-DD', () => {
    const result = lint(
      '// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:legacy owner:design-system expires:soon issue:DNA-123\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(1);
    expect(ours[0].message).toContain('expires');
    expect(ours[0].message).toContain('YYYY-MM-DD');
  });

  it('flags impossible calendar dates', () => {
    const result = lint(
      '// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:legacy owner:design-system expires:2026-02-30 issue:DNA-123\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(1);
    expect(ours[0].message).toContain('expires');
    expect(ours[0].message).toContain('malformed');
  });

  it('flags expired exceptions based on the injected UTC today value', () => {
    const result = lint(
      '// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:legacy owner:design-system expires:2026-03-06 issue:DNA-123\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(1);
    expect(ours[0].message).toContain('expired');
    expect(ours[0].message).toContain('2026-03-06');
  });

  it('accepts an exception expiring on the current UTC day', () => {
    const result = lint(
      '// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:legacy owner:design-system expires:2026-03-07 issue:DNA-123\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(0);
  });

  it('flags malformed issue values', () => {
    const result = lint(
      '// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:legacy owner:design-system expires:2026-04-01 issue:none\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(1);
    expect(ours[0].message).toContain('issue');
    expect(ours[0].message).toContain('malformed');
  });

  it('accepts https issue links', () => {
    const result = lint(
      '// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:legacy owner:design-system expires:2026-04-01 issue:https://dna.test/issues/DNA-123\nconst x = 1;'
    );
    const ours = result.filter(m => m.ruleId === 'rdna/require-exception-metadata');
    expect(ours).toHaveLength(0);
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
