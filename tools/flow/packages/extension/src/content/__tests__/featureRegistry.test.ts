import { describe, it, expect } from 'vitest';
import { featureIds } from '../features';

describe('feature registry ids', () => {
  it('includes spacing and typography', () => {
    expect(featureIds).toContain('spacing');
    expect(featureIds).toContain('typography');
  });

  it('includes all core features', () => {
    expect(featureIds).toContain('colors');
    expect(featureIds).toContain('shadows');
    expect(featureIds).toContain('layout');
    expect(featureIds).toContain('position');
    expect(featureIds).toContain('move');
  });

  it('includes contextual features', () => {
    expect(featureIds).toContain('search');
    expect(featureIds).toContain('accessibility');
    expect(featureIds).toContain('imageswap');
    expect(featureIds).toContain('screenshot');
  });
});
