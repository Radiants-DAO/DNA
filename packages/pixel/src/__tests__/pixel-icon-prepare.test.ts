import { describe, expect, it } from 'vitest';

import { bitsToMaskURI, bitsToPath } from '../path';
import {
  getPixelIconDefinition,
  pixelIconRegistry,
  preparePixelIcon,
} from '../icons';

describe('pixel icon registry', () => {
  it('stores authored pixel icon definitions in one canonical registry', () => {
    expect(pixelIconRegistry.length).toBeGreaterThan(0);
    expect(pixelIconRegistry.every((entry) => entry.bits.length === entry.width * entry.height)).toBe(true);

    const caret = getPixelIconDefinition('caret');

    expect(caret).toBe(pixelIconRegistry.find((entry) => entry.name === 'caret'));
    expect(caret).toMatchObject({
      name: 'caret',
      width: 16,
      height: 16,
    });
  });
});

describe('preparePixelIcon', () => {
  it('derives a path and mask URI once from the authored grid', () => {
    const caret = getPixelIconDefinition('caret');
    const prepared = preparePixelIcon('caret');

    expect(caret).toBeDefined();
    expect(prepared).toBeDefined();
    expect(prepared).toMatchObject({
      name: 'caret',
      width: 16,
      height: 16,
      bits: caret?.bits,
      path: bitsToPath(caret!.bits, caret!.width, caret!.height),
      maskImage: bitsToMaskURI(
        bitsToPath(caret!.bits, caret!.width, caret!.height),
        caret!.width,
        caret!.height,
      ),
    });
  });
});
