import { describe, it, expect, afterEach } from 'vitest';
import { inferLayoutStructure } from '../layoutInference';

describe('inferLayoutStructure', () => {
  let el: HTMLElement;

  afterEach(() => {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  it('detects flex layout', () => {
    el = document.createElement('div');
    document.body.appendChild(el);
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.gap = '16px';

    const result = inferLayoutStructure(el);
    expect(result.type).toBe('flex');
    expect(result.flexDirection).toBe('column');
    expect(result.gap).toBe('16px');
  });

  it('detects grid layout with columns', () => {
    el = document.createElement('div');
    document.body.appendChild(el);
    el.style.display = 'grid';
    el.style.gridTemplateColumns = '1fr 1fr 1fr';

    // Add children for row inference
    for (let i = 0; i < 6; i++) {
      el.appendChild(document.createElement('div'));
    }

    const result = inferLayoutStructure(el);
    expect(result.type).toBe('grid');
    expect(result.inferredColumns).toBe(3);
    expect(result.inferredRows).toBe(2);
  });

  it('returns block for normal div', () => {
    el = document.createElement('div');
    document.body.appendChild(el);

    const result = inferLayoutStructure(el);
    expect(result.type).toBe('block');
  });

  it('detects inline elements when explicitly set', () => {
    el = document.createElement('div');
    document.body.appendChild(el);
    el.style.display = 'inline';

    const result = inferLayoutStructure(el);
    expect(result.type).toBe('inline');
  });

  it('detects inline-block elements', () => {
    el = document.createElement('div');
    document.body.appendChild(el);
    el.style.display = 'inline-block';

    const result = inferLayoutStructure(el);
    expect(result.type).toBe('inline');
  });

  it('detects hidden elements', () => {
    el = document.createElement('div');
    document.body.appendChild(el);
    el.style.display = 'none';

    const result = inferLayoutStructure(el);
    expect(result.type).toBe('none');
  });

  it('captures flex alignment properties', () => {
    el = document.createElement('div');
    document.body.appendChild(el);
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'space-between';

    const result = inferLayoutStructure(el);
    expect(result.type).toBe('flex');
    expect(result.alignItems).toBe('center');
    expect(result.justifyContent).toBe('space-between');
  });

  it('handles inline-flex display', () => {
    el = document.createElement('div');
    document.body.appendChild(el);
    el.style.display = 'inline-flex';

    const result = inferLayoutStructure(el);
    expect(result.type).toBe('flex');
  });

  it('handles inline-grid display', () => {
    el = document.createElement('div');
    document.body.appendChild(el);
    el.style.display = 'inline-grid';

    const result = inferLayoutStructure(el);
    expect(result.type).toBe('grid');
  });
});
