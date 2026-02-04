import { describe, it, expect } from 'vitest';
import { applyTypography } from '../features/typography';
import { applyTextEdit } from '../features/textEdit';

describe('typography feature', () => {
  it('sets font-size and returns diff', () => {
    const el = document.createElement('div');
    const diff = applyTypography(el, { fontSize: '20px' });
    expect(diff.changes[0].property).toBe('font-size');
    expect(el.style.fontSize).toBe('20px');
  });

  it('sets font-family and returns diff', () => {
    const el = document.createElement('div');
    const diff = applyTypography(el, { fontFamily: 'Arial' });
    expect(diff.changes[0].property).toBe('font-family');
  });

  it('records old value before change', () => {
    const el = document.createElement('div');
    el.style.fontSize = '14px';
    const diff = applyTypography(el, { fontSize: '18px' });
    expect(diff.changes[0].oldValue).toBe('14px');
  });
});

describe('text edit feature', () => {
  it('changes text content', () => {
    const el = document.createElement('div');
    el.textContent = 'Hello';
    const diff = applyTextEdit(el, 'World');
    expect(el.textContent).toBe('World');
    expect(diff.type).toBe('text');
  });

  it('records old text value', () => {
    const el = document.createElement('div');
    el.textContent = 'Original';
    const diff = applyTextEdit(el, 'Changed');
    expect(diff.changes[0].oldValue).toBe('Original');
    expect(diff.changes[0].newValue).toBe('Changed');
  });
});
