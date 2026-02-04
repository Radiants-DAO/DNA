import { describe, it, expect } from 'vitest';
import {
  getContrastRatio,
  meetsWcagAA,
  meetsWcagAAA,
  getApcaContrast,
  suggestAccessibleColor,
} from '../features/accessibility';

describe('accessibility feature', () => {
  describe('getContrastRatio', () => {
    it('computes high contrast ratio for black on white', () => {
      expect(getContrastRatio('#000000', '#ffffff')).toBeGreaterThan(20);
    });

    it('computes low contrast ratio for similar colors', () => {
      expect(getContrastRatio('#808080', '#909090')).toBeLessThan(2);
    });

    it('handles rgb format', () => {
      const ratio = getContrastRatio('rgb(0, 0, 0)', 'rgb(255, 255, 255)');
      expect(ratio).toBeGreaterThan(20);
    });

    it('handles oklch format', () => {
      const ratio = getContrastRatio('oklch(0 0 0)', 'oklch(1 0 0)');
      expect(ratio).toBeGreaterThan(20);
    });
  });

  describe('WCAG compliance checks', () => {
    it('passes WCAG AA for black on white', () => {
      expect(meetsWcagAA('#000000', '#ffffff')).toBe(true);
    });

    it('passes WCAG AAA for black on white', () => {
      expect(meetsWcagAAA('#000000', '#ffffff')).toBe(true);
    });

    it('fails WCAG AA for low contrast', () => {
      expect(meetsWcagAA('#777777', '#888888')).toBe(false);
    });

    it('has lower threshold for large text', () => {
      // This combo might fail normal AA but pass large text AA
      expect(meetsWcagAA('#666666', '#ffffff', true)).toBe(true);
    });
  });

  describe('APCA contrast', () => {
    it('returns high absolute value for high contrast', () => {
      const apca = getApcaContrast('#000000', '#ffffff');
      expect(Math.abs(apca)).toBeGreaterThan(100);
    });

    it('returns low absolute value for low contrast', () => {
      const apca = getApcaContrast('#808080', '#909090');
      expect(Math.abs(apca)).toBeLessThan(20);
    });
  });

  describe('suggestAccessibleColor', () => {
    it('suggests a color that meets contrast requirements', () => {
      const suggestion = suggestAccessibleColor('#777777', '#ffffff', 4.5);
      const ratio = getContrastRatio(suggestion, '#ffffff');
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('returns OKLCH format', () => {
      const suggestion = suggestAccessibleColor('#888888', '#ffffff');
      expect(suggestion).toContain('oklch');
    });
  });
});
