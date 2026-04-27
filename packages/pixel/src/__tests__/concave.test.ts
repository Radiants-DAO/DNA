import { describe, expect, it } from 'vitest';

import { prepareCornerProfile } from '../corners/prepare.js';
import { concave } from '../concave.js';

function expectMaskURI(val: string) {
  expect(val).toMatch(/^url\("data:image\/svg\+xml,/);
}

describe('concave(config)', () => {
  it('returns a runtime concave corner host with mask and size variables', () => {
    const result = concave({
      corner: 'br',
      radiusPx: 8,
      themeShape: 'circle',
    });

    expect(result.className).toBe('pixel-concave-corner pixel-concave-br');
    expectMaskURI(result.style['--px-concave-mask']);
    expect(result.style['--px-concave-s']).toBe('calc(9px * var(--pixel-scale, 1))');
  });

  it('uses the prepared cover mask for the requested corner', () => {
    const profile = prepareCornerProfile('circle', 8);
    const result = concave({
      corner: 'tr',
      radiusPx: 8,
      themeShape: 'circle',
    });

    expect(result.style['--px-concave-mask']).toBe(profile.cover.tr.maskImage);
  });

  it('lets a fixed shape override the theme shape', () => {
    const fixedChamfer = concave({
      corner: 'tl',
      radiusPx: 8,
      shape: 'chamfer',
      themeShape: 'circle',
    });
    const themeCircle = concave({
      corner: 'tl',
      radiusPx: 8,
      themeShape: 'circle',
    });

    expect(fixedChamfer.style['--px-concave-mask']).toBe(
      prepareCornerProfile('chamfer', 8).cover.tl.maskImage,
    );
    expect(fixedChamfer.style['--px-concave-mask']).not.toBe(
      themeCircle.style['--px-concave-mask'],
    );
  });
});
