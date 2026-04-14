import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

const darkCss = readFileSync(
  path.resolve(process.cwd(), '../../packages/radiants/dark.css'),
  'utf8',
);
const rootDarkBlock = darkCss.match(/\.dark\s*\{([\s\S]*?)^\}/m)?.[1] ?? '';

describe('dark theme text glow', () => {
  test('does not inherit glow from the dark root', () => {
    expect(rootDarkBlock).not.toMatch(/\btext-shadow\s*:/);
  });

  test('keeps glow as an opt-in treatment for headings and chrome labels', () => {
    expect(darkCss).toContain('--rdna-text-glow');
    expect(darkCss).toMatch(
      /\.dark\s*:is\([\s\S]*h1[\s\S]*h6[\s\S]*label[\s\S]*\.font-heading[\s\S]*\[data-slot="button-face"\][\s\S]*\[data-slot="tab-trigger"\][\s\S]*\)\s*\{/,
    );
    expect(darkCss).toMatch(/text-shadow:\s*var\(--rdna-text-glow\)/);
  });
});
