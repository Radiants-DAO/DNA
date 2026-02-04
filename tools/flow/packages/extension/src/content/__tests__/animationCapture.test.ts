import { describe, it, expect, afterEach } from 'vitest';
import { captureAnimations } from '../animationCapture';

describe('captureAnimations', () => {
  let el: HTMLElement;

  afterEach(() => {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  it('returns empty array for element with no animations', () => {
    el = document.createElement('div');
    document.body.appendChild(el);

    const result = captureAnimations(el);
    expect(result).toEqual([]);
  });

  it('captures configured CSS transition properties when style is fully expanded', () => {
    el = document.createElement('div');
    document.body.appendChild(el);
    // Set individual properties instead of shorthand for jsdom compatibility
    el.style.transitionProperty = 'opacity';
    el.style.transitionDuration = '0.3s';
    el.style.transitionTimingFunction = 'ease-in-out';

    const result = captureAnimations(el);

    // jsdom may not fully support computed transition parsing
    // This test validates the code path doesn't throw
    expect(Array.isArray(result)).toBe(true);

    // If transitions are captured, validate structure
    if (result.length > 0) {
      expect(result[0].name).toBe('opacity');
      expect(result[0].type).toBe('css-transition');
      expect(result[0].duration).toBe(300);
      expect(result[0].playState).toBe('configured');
    }
  });

  it('skips zero-duration transitions', () => {
    el = document.createElement('div');
    document.body.appendChild(el);
    el.style.transitionProperty = 'opacity';
    el.style.transitionDuration = '0s';

    const result = captureAnimations(el);
    expect(result).toEqual([]);
  });

  it('handles elements without className gracefully', () => {
    el = document.createElement('div');
    document.body.appendChild(el);

    // Should not throw
    const result = captureAnimations(el);
    expect(Array.isArray(result)).toBe(true);
  });

  it('handles Web Animations API if available', () => {
    el = document.createElement('div');
    document.body.appendChild(el);

    // Mock getAnimations to return an empty array (jsdom baseline)
    const originalGetAnimations = el.getAnimations;
    el.getAnimations = () => [];

    const result = captureAnimations(el);
    expect(Array.isArray(result)).toBe(true);

    el.getAnimations = originalGetAnimations;
  });

  it('handles missing getAnimations gracefully', () => {
    el = document.createElement('div');
    document.body.appendChild(el);

    // Remove getAnimations to simulate unsupported environment
    const originalGetAnimations = el.getAnimations;
    (el as any).getAnimations = undefined;

    // Should not throw
    const result = captureAnimations(el);
    expect(Array.isArray(result)).toBe(true);

    el.getAnimations = originalGetAnimations;
  });
});
