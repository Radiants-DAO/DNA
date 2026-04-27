import { describe, expect, it } from 'vitest';

import { bitsToMaskURI, bitsToPath } from '../path';
import { getPattern, preparePattern } from '../patterns';

describe('preparePattern', () => {
  it('derives path, mask URI, density, token, and aliases from the authored registry', () => {
    const checkerboard = getPattern('checkerboard');

    expect(checkerboard).toBeDefined();

    const path = bitsToPath(
      checkerboard!.bits,
      checkerboard!.width,
      checkerboard!.height,
    );

    expect(preparePattern('checkerboard')).toEqual({
      ...checkerboard,
      aliases: [],
      fill: 50,
      token: '--pat-checkerboard',
      path,
      maskImage: bitsToMaskURI(path, checkerboard!.width, checkerboard!.height),
    });
  });

  it('caches prepared pattern artifacts by canonical name', () => {
    expect(preparePattern('checkerboard')).toBe(preparePattern('checkerboard'));
  });

  it('returns undefined for unknown patterns', () => {
    expect(preparePattern('definitely-not-real')).toBeUndefined();
  });
});
