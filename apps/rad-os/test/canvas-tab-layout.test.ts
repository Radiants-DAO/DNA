import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  join(process.cwd(), 'components/apps/pixel-lab/tabs/CanvasTab.tsx'),
  'utf8',
);

describe('CanvasTab placeholder layout', () => {
  it('uses app control-surface slots instead of placing tool rails inside the canvas island', () => {
    expect(source).toContain("side: 'left' as const");
    expect(source).toContain("side: 'right' as const");
    expect(source).toContain("side: 'bottom' as const");
    expect(source).toContain('useControlSurfaceSlot(leftSlot)');
    expect(source).toContain('useControlSurfaceSlot(rightSlot)');
    expect(source).toContain('useControlSurfaceSlot(bottomSlot)');
  });

  it('uses the Radiants canvas/tools/colors left rail structure', () => {
    expect(source).toContain('title="CANVAS"');
    expect(source).toContain('title="TOOLS"');
    expect(source).toContain('title="COLORS"');
    expect(source).not.toContain('title="BRUSH"');
    expect(source).toContain('Grid');
    expect(source).toContain('64 × 64');
  });

  it('keeps the central placeholder as the square canvas surface', () => {
    expect(source).toContain('aria-label="Reserved canvas surface"');
    expect(source).toContain('aspect-square');
  });
});
