import { describe, expect, it } from 'vitest';
import { generatePixelCode } from '../pixel-code-gen';
import type { PixelGrid } from '@rdna/pixel';

const sample: PixelGrid = {
  name: 'starfield',
  width: 8,
  height: 8,
  bits: '10000000000100000000001000100000000000000010100000000000001000010000000000000001',
};

describe('generatePixelCode — patterns', () => {
  it('snippet format emits a TS object literal', () => {
    const out = generatePixelCode('patterns', 'snippet', sample);
    expect(out).toContain("name: 'starfield'");
    expect(out).toContain("width: 8");
    expect(out).toContain("height: 8");
    expect(out).toContain("bits: '10000000000100000000001000100000000000000010100000000000001000010000000000000001'");
  });

  it('prompt format points at the planned @rdna/pixel authoring registry', () => {
    const out = generatePixelCode('patterns', 'prompt', sample);
    expect(out).toContain('packages/pixel/src/patterns/registry.ts');
    expect(out).toContain('@rdna/pixel is the authoring source of truth');
    expect(out).toContain('Radiants materializes checked-in CSS and registries from prepared artifacts.');
    expect(out).toContain("name: 'starfield'");
  });

  it('bitstring format shows row-by-row visualization', () => {
    const out = generatePixelCode('patterns', 'bitstring', sample);
    // 8 rows of 8 chars, with · for 0 and ■ for 1
    const lines = out.split('\n').filter((l) => l.length > 0);
    expect(lines[0]).toContain('■');
    expect(lines[0]).toContain('·');
    expect(lines[0]).toHaveLength(8 * 2 - 1); // 8 glyphs + 7 spaces
  });

  it('svg format emits a self-contained <svg>', () => {
    const out = generatePixelCode('patterns', 'svg', sample);
    expect(out.startsWith('<svg ')).toBe(true);
    expect(out).toContain('width="8"');
    expect(out).toContain('height="8"');
    expect(out).toContain('<path');
  });
});

describe('generatePixelCode — icons', () => {
  it('prompt points at the authored registry and converted icon runtime pipeline', () => {
    const icon: PixelGrid = { name: 'arrow', width: 16, height: 16, bits: '0'.repeat(256) };
    const out = generatePixelCode('icons', 'prompt', icon);
    expect(out).toContain('packages/pixel/src/icons/registry.ts');
    expect(out).toContain('packages/pixel/src/icons/source.ts');
    expect(out).toContain('Converted runtime icon previews and shipped masks come from @rdna/pixel/icons.');
    expect(out).toContain('BitmapIcon/getBitmapIcon read the generated 16px and 24px registries.');
    expect(out).toContain('SVG icons stay on the separate prepared manifest pipeline in packages/radiants/icons/manifest.ts.');
  });
});

describe('generatePixelCode — corners', () => {
  it('prompt points at the planned corner registry and authoring guidance', () => {
    const corner: PixelGrid = { name: 'notch-8', width: 8, height: 8, bits: '0'.repeat(64) };
    const out = generatePixelCode('corners', 'prompt', corner);
    expect(out).toContain('packages/pixel/src/corners/registry.ts');
    expect(out).toContain('Theme-following corners stay bound to <html data-corner-shape>');
    expect(out).toContain('Fixed corners use an explicit shape override.');
    expect(out).toContain('Chrome tabs are the reference theme-following surface.');
  });
});

describe('generatePixelCode — dither', () => {
  it('prompt points at the dither ramp helper without treating it as an authored registry', () => {
    const ramp: PixelGrid = { name: 'bayer-8', width: 8, height: 8, bits: '0'.repeat(64) };
    const out = generatePixelCode('dither', 'prompt', ramp);
    expect(out).toContain('packages/pixel/src/dither/prepare.ts');
    expect(out).toContain('Dither stays as a generated ramp helper instead of a registry of authored bit rows.');
    expect(out).toContain('Rad OS consume prepared dither bands');
  });
});
