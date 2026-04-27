import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const packageRoot = path.resolve(import.meta.dirname, '..');
const iconMetaPath = path.join(
  packageRoot,
  'components/core/Icon/Icon.meta.ts',
);
const iconSchemaPath = path.join(
  packageRoot,
  'components/core/Icon/Icon.schema.json',
);
const designDocPath = path.join(packageRoot, 'DESIGN.md');

function read(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

describe('Icon metadata and docs', () => {
  it('does not describe the Icon component as an SVG fetcher anymore', () => {
    const iconMeta = read(iconMetaPath);
    const iconSchema = read(iconSchemaPath);

    for (const content of [iconMeta, iconSchema]) {
      expect(content).not.toMatch(/dynamic SVG/i);
      expect(content).not.toMatch(/filename without \.svg/i);
      expect(content).not.toMatch(/fetched SVG compatibility/i);
      expect(content).toMatch(/bitmap/i);
    }
  });

  it('documents the bitmap-backed Icon API in DESIGN.md', () => {
    const designDoc = read(designDocPath);

    expect(designDoc).not.toContain('runtime SVG loader');
    expect(designDoc).not.toContain('/assets/icons/');
    expect(designDoc).not.toContain('<Icon name="broadcast-dish" size={20} />');
    expect(designDoc).toContain('<Icon name="broadcast-dish" size={24} />');
  });
});
