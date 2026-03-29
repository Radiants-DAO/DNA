import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const generatedPath = join(__dirname, '..', 'generated', 'typography-tokens.css');

describe('generate-typography-tokens', () => {
  let css: string;

  beforeAll(() => {
    execSync(
      'node --experimental-strip-types scripts/generate-typography-tokens.ts',
      { cwd: join(__dirname, '..'), stdio: 'pipe' }
    );
    css = readFileSync(generatedPath, 'utf8');
  });

  it('outputs a non-empty CSS file', () => {
    expect(css.length).toBeGreaterThan(0);
  });

  it('contains the auto-generated header comment', () => {
    expect(css).toContain('Auto-generated from pretext-type-scale.ts');
    expect(css).toContain('do not edit');
  });

  // --- Static scale (@theme block) ---

  it('outputs @theme block with all static font-size tokens', () => {
    expect(css).toContain('@theme');
    expect(css).toContain('--font-size-xs: 0.625rem');
    expect(css).toContain('--font-size-sm: 0.75rem');
    expect(css).toContain('--font-size-base: 1rem');
    expect(css).toContain('--font-size-lg: 1.333rem');
    expect(css).toContain('--font-size-xl: 1.777rem');
    expect(css).toContain('--font-size-2xl: 2.369rem');
    expect(css).toContain('--font-size-3xl: 3.157rem');
    expect(css).toContain('--font-size-4xl: 4.209rem');
    expect(css).toContain('--font-size-5xl: 5.61rem');
    expect(css).toContain('--font-size-display: 5.61rem');
  });

  // --- Fluid scale (@layer base) ---

  it('outputs @layer base block with fluid font-size tokens', () => {
    expect(css).toContain('@layer base');
    expect(css).toContain('--font-size-fluid-sm: clamp(0.75rem, 0.7rem + 0.25cqi, 0.875rem)');
    expect(css).toContain('--font-size-fluid-base: clamp(0.875rem, 0.8rem + 0.5cqi, 1.125rem)');
    expect(css).toContain('--font-size-fluid-lg: clamp(1rem, 0.9rem + 0.75cqi, 1.5rem)');
    expect(css).toContain('--font-size-fluid-xl: clamp(1.25rem, 1rem + 1.25cqi, 2rem)');
    expect(css).toContain('--font-size-fluid-2xl: clamp(1.5rem, 1.2rem + 1.75cqi, 2.5rem)');
    expect(css).toContain('--font-size-fluid-3xl: clamp(1.75rem, 1.4rem + 2.5cqi, 3.5rem)');
    expect(css).toContain('--font-size-fluid-4xl: clamp(2rem, 1.5rem + 3.5cqi, 4.5rem)');
  });

  // --- Root clamp is NOT generated ---

  it('does NOT contain html root font-size (stays in base.css)', () => {
    expect(css).not.toMatch(/html\s*\{/);
    expect(css).not.toContain('0.25vw');
  });
});
