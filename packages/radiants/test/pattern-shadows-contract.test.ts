import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('pattern-shadows.css contract', () => {
  it('does not suppress pixel-shape shadows in dark mode', () => {
    const css = readFileSync(resolve(__dirname, '../pattern-shadows.css'), 'utf8');

    expect(css).not.toContain('.dark .pat-pixel-shadow');
  });
});
