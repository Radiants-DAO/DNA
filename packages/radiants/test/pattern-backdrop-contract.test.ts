import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('PatternBackdrop contract', () => {
  it('uses checkerboard masking for popup and dialog backdrops', () => {
    const source = readFileSync(
      resolve(__dirname, '../components/core/_shared/PatternBackdrop.tsx'),
      'utf8',
    );

    expect(source).toContain("maskImage: 'var(--pat-checkerboard)'");
    expect(source).toContain("WebkitMaskImage: 'var(--pat-checkerboard)'");
  });
});
