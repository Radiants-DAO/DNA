import { describe, it, expect } from 'vitest';
import { classifyTier, inferCategory, dedupByKey, isUserComponent } from '../scannerUtils';

describe('classifyTier', () => {
  it('classifies semantic tokens', () => {
    expect(classifyTier('--color-surface-primary')).toBe('semantic');
    expect(classifyTier('--spacing-content-primary')).toBe('semantic');
    expect(classifyTier('--color-edge-primary')).toBe('semantic');
    expect(classifyTier('--shadow-accent')).toBe('semantic');
    expect(classifyTier('--font-error')).toBe('semantic');
  });

  it('classifies brand tokens', () => {
    expect(classifyTier('--color-sun-yellow')).toBe('brand');
    expect(classifyTier('--spacing-lg')).toBe('brand');
    expect(classifyTier('--radius-pill')).toBe('brand');
    expect(classifyTier('--shadow-card')).toBe('brand');
  });

  it('classifies unknown tokens', () => {
    expect(classifyTier('--custom-thing')).toBe('unknown');
    expect(classifyTier('--tw-ring-offset')).toBe('unknown');
    expect(classifyTier('--scrollbar-width')).toBe('unknown');
  });
});

describe('inferCategory', () => {
  it('maps prefixes to categories', () => {
    expect(inferCategory('--color-primary')).toBe('color');
    expect(inferCategory('--spacing-4')).toBe('spacing');
    expect(inferCategory('--radius-md')).toBe('radius');
    expect(inferCategory('--shadow-lg')).toBe('shadow');
    expect(inferCategory('--font-sans')).toBe('font');
    expect(inferCategory('--motion-ease')).toBe('motion');
    expect(inferCategory('--size-lg')).toBe('size');
  });

  it('returns other for unknown prefixes', () => {
    expect(inferCategory('--tw-ring')).toBe('other');
    expect(inferCategory('--custom-prop')).toBe('other');
  });
});

describe('dedupByKey', () => {
  it('merges items with same key, summing instances', () => {
    const items = [
      { name: 'Button', instances: 3 },
      { name: 'Button', instances: 5 },
      { name: 'Card', instances: 1 },
    ];
    const result = dedupByKey(items, (i) => i.name);
    expect(result).toEqual([
      { name: 'Button', instances: 8 },
      { name: 'Card', instances: 1 },
    ]);
  });

  it('returns empty array for empty input', () => {
    const result = dedupByKey([], (i: { instances: number }) => String(i));
    expect(result).toEqual([]);
  });

  it('preserves single items', () => {
    const items = [{ name: 'Solo', instances: 1 }];
    const result = dedupByKey(items, (i) => i.name);
    expect(result).toEqual([{ name: 'Solo', instances: 1 }]);
  });
});

describe('isUserComponent', () => {
  it('accepts PascalCase names', () => {
    expect(isUserComponent('Button')).toBe(true);
    expect(isUserComponent('NavBar')).toBe(true);
    expect(isUserComponent('App')).toBe(true);
  });

  it('rejects internal/private names', () => {
    expect(isUserComponent('_Internal')).toBe(false);
    expect(isUserComponent('_wrapper')).toBe(false);
  });

  it('rejects lowercase names (hooks, utilities)', () => {
    expect(isUserComponent('useEffect')).toBe(false);
    expect(isUserComponent('div')).toBe(false);
  });

  it('rejects null/empty', () => {
    expect(isUserComponent(null)).toBe(false);
    expect(isUserComponent('')).toBe(false);
  });
});
