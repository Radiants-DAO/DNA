import { describe, expect, it } from 'vitest';
import {
  fluidType,
  resolveFluid,
  resolveFluidRaw,
  spacing,
  rootScale,
  staticScale,
  lineHeight,
  tracking,
  cssFluidScale,
  type FluidTier,
  type CssFluidTier,
} from '../patterns/pretext-type-scale';

// ---------------------------------------------------------------------------
// Existing exports (smoke test — these should already work)
// ---------------------------------------------------------------------------

describe('fluidType (existing)', () => {
  it('has 7 tiers', () => {
    expect(Object.keys(fluidType)).toHaveLength(7);
  });

  it('resolveFluid returns clamped values', () => {
    expect(resolveFluid('base', 0)).toBe(fluidType.base.min);
    expect(resolveFluid('base', 100000)).toBe(fluidType.base.max);
  });
});

// ---------------------------------------------------------------------------
// New: rootScale (reference constant — not used by generator)
// ---------------------------------------------------------------------------

describe('rootScale', () => {
  it('exists with correct shape', () => {
    expect(rootScale).toMatchObject({
      min: expect.any(Number),
      base: expect.any(Number),
      coeff: expect.any(Number),
      max: expect.any(Number),
      unit: 'vw',
    });
  });

  it('matches base.css clamp bounds (14px min, 18px max)', () => {
    expect(rootScale.min).toBe(14);
    expect(rootScale.max).toBe(18);
  });
});

// ---------------------------------------------------------------------------
// New: staticScale
// ---------------------------------------------------------------------------

describe('staticScale', () => {
  it('has all expected tiers', () => {
    const tiers = Object.keys(staticScale);
    for (const t of ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', 'display']) {
      expect(tiers).toContain(t);
    }
  });

  it('stores exact pre-computed rem values (not re-derived from ratio)', () => {
    expect(staticScale.xs).toBe(0.625);
    expect(staticScale.sm).toBe(0.75);
    expect(staticScale.base).toBe(1);
    expect(staticScale.lg).toBe(1.333);
    expect(staticScale.xl).toBe(1.777);
    expect(staticScale['2xl']).toBe(2.369);
    expect(staticScale['3xl']).toBe(3.157);
    expect(staticScale['4xl']).toBe(4.209);
    expect(staticScale['5xl']).toBe(5.61);
  });

  it('display is an alias for 5xl', () => {
    expect(staticScale.display).toBe(staticScale['5xl']);
  });
});

// ---------------------------------------------------------------------------
// New: lineHeight (provenance: typography.css Tailwind leading-* utilities)
// ---------------------------------------------------------------------------

describe('lineHeight', () => {
  it('has all roles matching Tailwind leading-* values', () => {
    expect(lineHeight.none).toBe(1);
    expect(lineHeight.snug).toBe(1.375);
    expect(lineHeight.normal).toBe(1.5);
    expect(lineHeight.relaxed).toBe(1.625);
  });

  it('snug matches GoodNewsApp BODY_LH_RATIO', () => {
    expect(lineHeight.snug).toBe(1.375);
  });

  it('values are in ascending order', () => {
    expect(lineHeight.none).toBeLessThan(lineHeight.snug);
    expect(lineHeight.snug).toBeLessThan(lineHeight.normal);
    expect(lineHeight.normal).toBeLessThan(lineHeight.relaxed);
  });
});

// ---------------------------------------------------------------------------
// New: tracking (provenance: Tailwind tracking-* defaults)
// ---------------------------------------------------------------------------

describe('tracking', () => {
  it('has tight, normal, wide with Tailwind values', () => {
    expect(tracking.tight).toBe(-0.025);
    expect(tracking.normal).toBe(0);
    expect(tracking.wide).toBe(0.025);
  });
});

// ---------------------------------------------------------------------------
// New: cssFluidScale
// ---------------------------------------------------------------------------

describe('cssFluidScale', () => {
  it('has same tier names as fluidType', () => {
    expect(Object.keys(cssFluidScale).sort()).toEqual(
      Object.keys(fluidType).sort()
    );
  });

  it('each tier has rem-based clamp components with min < max', () => {
    for (const [, tier] of Object.entries(cssFluidScale)) {
      expect(tier).toMatchObject({
        minRem: expect.any(Number),
        baseRem: expect.any(Number),
        cqiCoeff: expect.any(Number),
        maxRem: expect.any(Number),
      });
      expect(tier.minRem).toBeLessThan(tier.maxRem);
    }
  });

  it('matches current tokens.css values exactly', () => {
    expect(cssFluidScale.sm).toEqual({ minRem: 0.75, baseRem: 0.7, cqiCoeff: 0.25, maxRem: 0.875 });
    expect(cssFluidScale.base).toEqual({ minRem: 0.875, baseRem: 0.8, cqiCoeff: 0.5, maxRem: 1.125 });
    expect(cssFluidScale['4xl']).toEqual({ minRem: 2, baseRem: 1.5, cqiCoeff: 3.5, maxRem: 4.5 });
  });
});
