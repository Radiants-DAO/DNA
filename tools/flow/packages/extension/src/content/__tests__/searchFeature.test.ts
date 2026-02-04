import { describe, it, expect } from 'vitest';
import { normalizeQuery } from '../features/search';

describe('search feature', () => {
  it('maps images alias to img selector', () => {
    expect(normalizeQuery('images')).toBe('img');
  });

  it('maps text alias to text element selectors', () => {
    const result = normalizeQuery('text');
    expect(result).toContain('p');
    expect(result).toContain('h1');
    expect(result).toContain('a');
  });

  it('passes through standard selectors', () => {
    expect(normalizeQuery('.my-class')).toBe('.my-class');
    expect(normalizeQuery('#my-id')).toBe('#my-id');
    expect(normalizeQuery('div')).toBe('div');
  });
});
