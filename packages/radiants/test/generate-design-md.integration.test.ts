import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { regenerate } from '../scripts/generate-design-md';

const workspaceRoot = resolve(process.cwd(), '..', '..');
const designPath = resolve(process.cwd(), 'DESIGN.md');

describe('generate-design-md integration', () => {
  it('keeps DESIGN.md generated regions in sync with source files', async () => {
    const source = readFileSync(designPath, 'utf8');

    await expect(regenerate(source, workspaceRoot)).resolves.toBe(source);
  });
});
