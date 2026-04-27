import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  join(process.cwd(), 'components/apps/pixel-lab/tabs/DitherTab.tsx'),
  'utf8',
);

describe('DitherTab layout', () => {
  it('separates matrix, ramp, render, output, and details responsibilities', () => {
    expect(source).toContain('<StudioRailDropdown');
    expect(source).toContain('title="MATRIX"');
    expect(source).toContain('title="RAMP"');
    expect(source).toContain('title="RENDER"');
    expect(source).toContain('title="OUTPUT"');
    expect(source).toContain('title="DETAILS"');
  });

  it('uses Radiants-style tabless control-surface drawers', () => {
    expect(source).toContain('hideTab: true');
    expect(source).toContain('isOpen: true');
    expect(source).toContain('<StudioRailSection>');
  });

  it('surfaces derived recipe metadata alongside the center preview', () => {
    expect(source).toContain('BANDS');
    expect(source).toContain('TILE');
    expect(source).toContain('DIRECTION');
  });
});
