import { describe, expect, it } from 'vitest';
import { resolveReportDiffSpec } from '../../../../scripts/report-new-rdna-exceptions.mjs';

describe('report-new-rdna-exceptions', () => {
  it('uses an explicit from/to diff range when provided', () => {
    const diffSpec = resolveReportDiffSpec(new Map([
      ['--from-ref', 'abc123'],
      ['--to-ref', 'def456'],
    ]));

    expect(diffSpec).toEqual({
      label: 'abc123..def456',
      mode: 'range',
      refs: ['abc123', 'def456'],
    });
  });

  it('falls back to merge-base against origin/main when only base-ref is provided', () => {
    const diffSpec = resolveReportDiffSpec(new Map());

    expect(diffSpec).toEqual({
      baseRef: 'origin/main',
      headRef: 'HEAD',
      label: 'origin/main...HEAD',
      mode: 'merge-base',
    });
  });
});
