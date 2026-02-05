import { describe, it, expect } from 'vitest';
import { translate, getDropdownOptions } from '../languageAdapters';

describe('languageAdapters', () => {
  it('translates CSS to Tailwind', () => {
    expect(translate('display: flex', 'tailwind')).toBe('flex');
    expect(translate('flex: 1', 'tailwind')).toBe('flex-1');
    expect(translate('gap: 16px', 'tailwind')).toBe('gap-4');
    expect(translate('gap: 24px', 'tailwind')).toBe('gap-6');
    expect(translate('padding: 32px', 'tailwind')).toBe('p-8');
  });

  it('translates CSS to Figma', () => {
    expect(translate('display: flex', 'figma')).toBe('Auto layout');
    expect(translate('flex: 1', 'figma')).toBe('Fill container');
    expect(translate('width: fit-content', 'figma')).toBe('Hug contents');
    expect(translate('gap: 16px', 'figma')).toBe('Item spacing: 16');
  });

  it('translates grid columns', () => {
    expect(translate('grid-template-columns: repeat(3, 1fr)', 'tailwind')).toBe('grid-cols-3');
    expect(translate('grid-template-columns: repeat(3, 1fr)', 'figma')).toBe('3-column grid');
  });

  it('returns raw CSS for unknown declarations', () => {
    expect(translate('z-index: 50', 'tailwind')).toBe('z-index: 50');
  });

  it('CSS adapter is identity', () => {
    expect(translate('display: flex', 'css')).toBe('display: flex');
  });

  it('generates dropdown options', () => {
    const opts = getDropdownOptions('tailwind');
    expect(opts.length).toBeGreaterThan(0);
    expect(opts.find((o) => o.label === 'flex')).toBeDefined();
  });

  it('handles arbitrary gap with bracket notation', () => {
    expect(translate('gap: 13px', 'tailwind')).toBe('gap-[13px]');
  });
});
