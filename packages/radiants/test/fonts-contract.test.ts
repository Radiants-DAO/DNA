import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const fontsCssPath = resolve(process.cwd(), 'fonts.css');

describe('@rdna/radiants font contract', () => {
  it('does not reference unshipped Mondwest font files', () => {
    const css = readFileSync(fontsCssPath, 'utf8');

    expect(css).not.toContain('./fonts/Mondwest.woff2');
    expect(css).not.toContain('./fonts/Mondwest-Bold.woff2');
  });
});
