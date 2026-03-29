import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const generatedPath = join(__dirname, '..', 'generated', 'typography-tokens.css');

describe('typography-tokens freshness', () => {
  it('generated/typography-tokens.css exists', () => {
    expect(existsSync(generatedPath)).toBe(true);
  });

  it('is in sync with pretext-type-scale.ts (regenerating produces identical output)', () => {
    const before = readFileSync(generatedPath, 'utf8');

    execSync(
      'node --experimental-strip-types scripts/generate-typography-tokens.ts',
      { cwd: join(__dirname, '..'), stdio: 'pipe' }
    );

    const after = readFileSync(generatedPath, 'utf8');
    expect(after).toBe(before);
  });
});
