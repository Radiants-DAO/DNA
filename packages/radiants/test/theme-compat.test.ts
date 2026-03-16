import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const tokensCssPath = join(__dirname, '..', 'tokens.css');

function getThemeBlock() {
  const tokensCss = readFileSync(tokensCssPath, 'utf8');
  const match = tokensCss.match(/@theme\s*\{([\s\S]*?)\n\}/);

  if (!match) {
    throw new Error('Expected tokens.css to contain an @theme block');
  }

  return match[1];
}

describe('radiants theme compatibility aliases', () => {
  it('keeps pre-migration semantic color aliases available in @theme', () => {
    const themeBlock = getThemeBlock();

    for (const alias of [
      '--color-accent',
      '--color-accent-inv',
      '--color-accent-soft',
      '--color-danger',
      '--color-success',
      '--color-warning',
    ]) {
      expect(themeBlock).toContain(`${alias}:`);
    }
  });
});
