import { describe, it, expect } from 'vitest';
import { getTargetImages, swapImageSrc } from '../features/imageswap';

describe('imageswap feature', () => {
  it('returns selected images when provided', () => {
    const img = document.createElement('img');
    expect(getTargetImages([img])).toEqual([img]);
  });

  it('returns empty array for non-images', () => {
    const div = document.createElement('div');
    expect(getTargetImages([div as unknown as HTMLImageElement])).toEqual([div]);
  });

  it('swaps image src', () => {
    const img = document.createElement('img');
    img.src = 'old.png';
    const result = swapImageSrc(img, 'new.png');
    expect(img.src).toContain('new.png');
    expect(result.oldSrc).toContain('old.png');
  });
});
