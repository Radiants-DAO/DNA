import { describe, expect, it } from 'vitest';

import { generateDitherCode } from '../dither-code-gen';

const baseOpts = { matrix: 8, steps: 17, direction: 'down', pixelScale: 2 } as const;

describe('generateDitherCode', () => {
  it('snippet format emits a ready-to-paste ditherBands call', () => {
    expect(generateDitherCode('snippet', baseOpts)).toBe(
      `ditherBands({ matrix: 8, steps: 17, direction: 'down' })`,
    );
  });

  it('prompt format describes the band-stack render pattern with pixel scale', () => {
    const out = generateDitherCode('prompt', { ...baseOpts, matrix: 4, steps: 17, direction: 'up', pixelScale: 3 });
    expect(out).toContain("import { ditherBands } from '@rdna/pixel/dither'");
    expect(out).toContain('matrix: 4');
    expect(out).toContain('steps: 17');
    expect(out).toContain("direction: 'up'");
    expect(out).toContain('mask-size = 12px 12px');
    expect(out).toContain('pixelScale 3');
  });

  it('bitstring format groups output by band', () => {
    const out = generateDitherCode('bitstring', { matrix: 2, steps: 3, direction: 'down', pixelScale: 1 });
    expect(out).toContain('band 0');
    expect(out).toContain('band 1');
    expect(out).toContain('band 2');
  });
});
