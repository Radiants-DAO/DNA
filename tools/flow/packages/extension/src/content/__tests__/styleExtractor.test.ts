import { describe, it, expect, afterEach } from 'vitest';
import { extractGroupedStyles } from '../styleExtractor';

describe('extractGroupedStyles', () => {
  let el: HTMLElement;

  afterEach(() => {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  it('groups styles into 9 categories', () => {
    el = document.createElement('div');
    document.body.appendChild(el);
    el.style.display = 'flex';
    el.style.padding = '16px';
    el.style.fontSize = '14px';
    el.style.color = 'red';
    el.style.borderRadius = '8px';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    el.style.opacity = '0.5';

    const result = extractGroupedStyles(el);

    expect(result.layout.some((e) => e.property === 'display')).toBe(true);
    expect(result.typography.some((e) => e.property === 'font-size')).toBe(true);
    expect(result.colors.some((e) => e.property === 'color')).toBe(true);
    expect(result.shadows.some((e) => e.property === 'box-shadow')).toBe(true);
    expect(result.effects.some((e) => e.property === 'opacity')).toBe(true);
  });

  it('filters out default values', () => {
    el = document.createElement('div');
    document.body.appendChild(el);

    const result = extractGroupedStyles(el);

    // Default div should have very few non-default entries
    const totalEntries = Object.values(result).flat().length;
    expect(totalEntries).toBeLessThan(10);
  });

  it('returns all 9 category keys', () => {
    el = document.createElement('div');
    document.body.appendChild(el);

    const result = extractGroupedStyles(el);

    expect(Object.keys(result)).toEqual([
      'layout',
      'spacing',
      'size',
      'typography',
      'colors',
      'borders',
      'shadows',
      'effects',
      'animations',
    ]);
  });

  it('captures spacing properties', () => {
    el = document.createElement('div');
    document.body.appendChild(el);
    el.style.margin = '20px';
    el.style.padding = '10px';

    const result = extractGroupedStyles(el);

    expect(result.spacing.some((e) => e.property.includes('margin'))).toBe(true);
    expect(result.spacing.some((e) => e.property.includes('padding'))).toBe(true);
  });
});
