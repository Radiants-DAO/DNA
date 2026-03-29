/**
 * Pretext Type Scale — JS-native fluid typography for canvas-based layouts.
 *
 * Single source of truth for text sizing in pretext consumers (GoodNews,
 * editorial layouts, future content apps). Mirrors the design intent of the
 * CSS fluid tokens in tokens.css but lives entirely in JS — no DOM, no
 * reflow, no CSS dependency.
 *
 * Each tier defines a clamp(min, base + coeff × containerWidth/100, max)
 * curve. The formula is identical to the CSS `clamp(min, base + Ncqi, max)`
 * pattern, where 1cqi = 1% of container inline size.
 *
 * Usage:
 *   import { resolveFluid, fluidType } from '@rdna/radiants/patterns/pretext-type-scale'
 *   const fontSize = resolveFluid('xl', containerWidth) // → px number
 */

// ---------------------------------------------------------------------------
// Scale definitions (px values — pretext operates in px)
// ---------------------------------------------------------------------------

export interface FluidTier {
  /** Minimum size in px (floor) */
  min: number;
  /** Base offset in px (intercept when containerWidth = 0) */
  base: number;
  /** Scaling coefficient (multiplied by containerWidth / 100) */
  coeff: number;
  /** Maximum size in px (ceiling) */
  max: number;
}

/**
 * Fluid type tiers — each maps to the equivalent CSS fluid token.
 *
 * The preferred value is: base + coeff × (containerWidth / 100)
 * This mirrors CSS: base_rem + coeff_cqi where 1cqi = 1% of container.
 *
 * Values derived from the CSS tokens (rem × 16 = px):
 *   --font-size-fluid-sm:   clamp(0.75rem,  0.7rem  + 0.25cqi, 0.875rem)
 *   --font-size-fluid-base: clamp(0.875rem, 0.8rem  + 0.5cqi,  1.125rem)
 *   --font-size-fluid-lg:   clamp(1rem,     0.9rem  + 0.75cqi, 1.5rem)
 *   --font-size-fluid-xl:   clamp(1.25rem,  1rem    + 1.25cqi, 2rem)
 *   --font-size-fluid-2xl:  clamp(1.5rem,   1.2rem  + 1.75cqi, 2.5rem)
 *   --font-size-fluid-3xl:  clamp(1.75rem,  1.4rem  + 2.5cqi,  3.5rem)
 *   --font-size-fluid-4xl:  clamp(2rem,     1.5rem  + 3.5cqi,  4.5rem)
 */
export const fluidType = {
  sm:   { min: 12,   base: 11.2, coeff: 0.04,  max: 14   },
  base: { min: 14,   base: 12.8, coeff: 0.08,  max: 18   },
  lg:   { min: 16,   base: 14.4, coeff: 0.12,  max: 24   },
  xl:   { min: 20,   base: 16,   coeff: 0.20,  max: 32   },
  '2xl': { min: 24,  base: 19.2, coeff: 0.28,  max: 40   },
  '3xl': { min: 28,  base: 22.4, coeff: 0.40,  max: 56   },
  '4xl': { min: 32,  base: 24,   coeff: 0.56,  max: 72   },
} as const satisfies Record<string, FluidTier>;

export type FluidTierName = keyof typeof fluidType;

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

/**
 * Compute fluid font size for a given tier and container width.
 *
 * Returns a smooth px value — no Math.round stepping. The caller decides
 * whether to round (canvas measureText handles fractional px fine).
 *
 * @param tier    - Named tier from the scale (e.g. 'xl', '3xl')
 * @param containerWidth - Width of the layout container in px
 */
export function resolveFluid(tier: FluidTierName, containerWidth: number): number {
  const { min, base, coeff, max } = fluidType[tier];
  return Math.min(max, Math.max(min, base + coeff * containerWidth / 100));
}

/**
 * Resolve fluid size from raw tier parameters (for one-off overrides).
 */
export function resolveFluidRaw(tier: FluidTier, containerWidth: number): number {
  const { min, base, coeff, max } = tier;
  return Math.min(max, Math.max(min, base + coeff * containerWidth / 100));
}

// ---------------------------------------------------------------------------
// Spacing scale — all values are multipliers of bodyLh
// ---------------------------------------------------------------------------

/**
 * Named spacing roles for editorial layouts.
 *
 * Every spacing value is a multiplier of `bodyLh` (body line-height) so
 * spacing scales proportionally with type size. No magic pixel values.
 *
 * Usage:
 *   const gap = bodyLh * spacing.paragraph;
 *   const sectionBreak = bodyLh * spacing.section;
 */
export const spacing = {
  /** Between paragraphs in the same section */
  paragraph: 0.75,
  /** Before a heading (establishes new section) */
  headingBefore: 1.5,
  /** After a heading (ties heading to its content) */
  headingAfter: 0.5,
  /** Around horizontal rules */
  rule: 0.5,
  /** Between major sections (rule + gap) */
  section: 2,
  /** Column gutter (between column rules) */
  column: 0.5,
} as const;

export type SpacingRole = keyof typeof spacing;
