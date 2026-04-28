import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const pixelArtEditorSource = readFileSync(
  join(process.cwd(), 'components/apps/studio/PixelArtEditor.tsx'),
  'utf8',
);

const studioRightRailSource = readFileSync(
  join(process.cwd(), 'components/apps/studio/StudioRightRail.tsx'),
  'utf8',
);

describe('Studio layers rail', () => {
  it('uses compact default layer labels', () => {
    expect(pixelArtEditorSource).toContain("return 'L1'");
    expect(pixelArtEditorSource).toContain('return `L${m[1]}`');
  });

  it('caps the layers side rail near four xl icon cells', () => {
    expect(pixelArtEditorSource).toContain('maxWidth: 172');
  });

  it('keeps rename editing from expanding the row chrome', () => {
    expect(studioRightRailSource).toContain('[&:has(input:focus)_[role=toolbar]]:hidden');
  });
});
