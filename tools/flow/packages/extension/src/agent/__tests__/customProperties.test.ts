import { describe, it, expect } from 'vitest';
import { classifyTier } from '../customProperties';

describe('classifyTier', () => {
  it('classifies semantic surface tokens', () => {
    expect(classifyTier('--color-surface-primary')).toBe('semantic');
    expect(classifyTier('--color-surface-secondary')).toBe('semantic');
  });

  it('classifies semantic content tokens', () => {
    expect(classifyTier('--color-content-primary')).toBe('semantic');
    expect(classifyTier('--color-content-inverted')).toBe('semantic');
  });

  it('classifies semantic edge tokens', () => {
    expect(classifyTier('--color-edge-primary')).toBe('semantic');
  });

  it('classifies semantic spacing tokens', () => {
    expect(classifyTier('--spacing-surface-padding')).toBe('semantic');
  });

  it('classifies brand tokens', () => {
    expect(classifyTier('--color-sun-yellow')).toBe('brand');
    expect(classifyTier('--color-midnight')).toBe('brand');
    expect(classifyTier('--spacing-base')).toBe('brand');
  });

  it('classifies unknown tokens', () => {
    expect(classifyTier('--my-custom-thing')).toBe('unknown');
    expect(classifyTier('--z-index-modal')).toBe('unknown');
  });
});
