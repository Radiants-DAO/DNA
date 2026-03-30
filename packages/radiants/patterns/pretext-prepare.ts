/**
 * Pretext Prepare — convenience wrappers for hyphenated text preparation.
 *
 * This is the only pretext-pattern module with a DOM dependency (offscreen
 * canvas for font measurement). The other modules (hyphenation, justify)
 * are pure JS.
 *
 * Usage:
 *   import { prepareHyphenated, measureSpaceWidth, measureHyphenWidth }
 *     from '@rdna/radiants/patterns/pretext-prepare'
 *
 *   const spaceW = measureSpaceWidth(font)
 *   const hyphenW = measureHyphenWidth(font)
 *   const prepared = prepareHyphenated(text, font)
 *   const lines = optimalLayout(prepared, maxWidth, spaceW, hyphenW)
 */

import { prepareWithSegments, type PreparedTextWithSegments } from '@chenglou/pretext';
import { hyphenateText } from './pretext-hyphenation';

// ---------------------------------------------------------------------------
// Shared offscreen canvas for font measurement
// ---------------------------------------------------------------------------

let _measureCtx: CanvasRenderingContext2D | null = null;

function getMeasureCtx(): CanvasRenderingContext2D {
  if (!_measureCtx) {
    if (typeof document === 'undefined') {
      throw new Error('pretext-prepare requires a DOM environment (canvas measurement)');
    }
    const canvas = document.createElement('canvas');
    _measureCtx = canvas.getContext('2d')!;
  }
  return _measureCtx;
}

// ---------------------------------------------------------------------------
// Measurement helpers
// ---------------------------------------------------------------------------

/**
 * Measure the width of a normal space character in the given font.
 * Result is cached per font string for the lifetime of the page.
 */
const _spaceCache = new Map<string, number>();

export function measureSpaceWidth(font: string): number {
  const cached = _spaceCache.get(font);
  if (cached !== undefined) return cached;
  const ctx = getMeasureCtx();
  ctx.font = font;
  const w = ctx.measureText(' ').width;
  _spaceCache.set(font, w);
  return w;
}

/**
 * Measure the width of a hyphen character in the given font.
 */
const _hyphenCache = new Map<string, number>();

export function measureHyphenWidth(font: string): number {
  const cached = _hyphenCache.get(font);
  if (cached !== undefined) return cached;
  const ctx = getMeasureCtx();
  ctx.font = font;
  const w = ctx.measureText('-').width;
  _hyphenCache.set(font, w);
  return w;
}

// ---------------------------------------------------------------------------
// Hyphenated prepare
// ---------------------------------------------------------------------------

/**
 * Hyphenate text at syllable boundaries, then prepare with pretext.
 * Equivalent to `prepareWithSegments(hyphenateText(text), font)` but
 * documents the intended pipeline.
 */
export function prepareHyphenated(
  text: string,
  font: string,
): PreparedTextWithSegments {
  return prepareWithSegments(hyphenateText(text), font);
}
