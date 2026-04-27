import { describe, expect, it } from 'vitest';

import * as pixel from '../index';
import * as dither from '../dither';

describe('@rdna/pixel dither barrel', () => {
  it('re-exports ditherBands and bayerMatrix from the package root', () => {
    expect(typeof pixel.ditherBands).toBe('function');
    expect(typeof pixel.bayerMatrix).toBe('function');
    expect(typeof pixel.bayerThresholdBits).toBe('function');
    expect(typeof pixel.defaultDitherSteps).toBe('function');
  });

  it('re-exports the API from the dither subpath barrel', () => {
    expect(typeof dither.ditherBands).toBe('function');
    expect(typeof dither.ditherRampBits).toBe('function');
    expect(typeof dither.bayerMatrix).toBe('function');
    expect(typeof dither.bayerThresholdBits).toBe('function');
    expect(typeof dither.defaultDitherSteps).toBe('function');
  });

  it('root barrel ditherBands matches the submodule ditherBands', () => {
    expect(pixel.ditherBands).toBe(dither.ditherBands);
  });
});
