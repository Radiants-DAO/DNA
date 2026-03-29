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
  headingBefore: 0.75,
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

// ---------------------------------------------------------------------------
// Root scale — reference constant (NOT used by generator)
// ---------------------------------------------------------------------------

/**
 * Viewport-based root font-size clamp parameters.
 *
 * Documents the base.css rule: html { font-size: clamp(14px, 12px + 0.25vw, 18px) }
 *
 * The root clamp stays in base.css because it affects every rem value
 * system-wide — a global layout decision, not a typography concern.
 * This constant is here for reference by pretext consumers who need
 * to know the viewport scaling bounds.
 */
export const rootScale = {
  min: 14,
  base: 12,
  coeff: 0.25,
  max: 18,
  unit: 'vw',
} as const;

// ---------------------------------------------------------------------------
// Static scale — generates @theme { --font-size-*: Nrem } tokens
// ---------------------------------------------------------------------------

/**
 * Perfect fourth (1.333) from 16px base.
 * xs/sm are fixed for UI legibility (not ratio-derived).
 *
 * IMPORTANT: These are exact pre-computed values, not re-derived from
 * the ratio. The generator emits them literally. Do not replace with
 * Math.pow(1.333, n) — that produces different rounding (e.g. 1.333³
 * = 2.370..., not 2.369).
 *
 * Used by Tailwind utilities (text-sm, text-base, etc.) for UI chrome.
 * Pretext content apps use fluidType + resolveFluid() instead.
 */
export const staticScale = {
  xs:      0.625,   //  10px — fixed: small labels
  sm:      0.75,    //  12px — fixed: buttons, small UI
  base:    1,       //  16px — base
  lg:      1.333,   // ~21px — base × 1.333
  xl:      1.777,   // ~28px — base × 1.333²
  '2xl':   2.369,   // ~38px — base × 1.333³
  '3xl':   3.157,   // ~50px — base × 1.333⁴
  '4xl':   4.209,   // ~67px — base × 1.333⁵
  '5xl':   5.61,    // ~90px — base × 1.333⁶
  display: 5.61,    // alias: same as 5xl, named for hero/display use
} as const satisfies Record<string, number>;

export type StaticScaleTier = keyof typeof staticScale;

// ---------------------------------------------------------------------------
// Line-height roles (unitless multipliers)
// ---------------------------------------------------------------------------

/**
 * Named line-height roles.
 *
 * Provenance: extracted from typography.css @apply rules which use
 * Tailwind's named leading-* utilities. These are existing design
 * decisions, not new ones.
 *
 *   none    = leading-none    (headings)
 *   snug    = leading-snug    (body text / Mondwest)
 *   normal  = leading-normal  (links, inline elements)
 *   relaxed = leading-relaxed (lists, blockquotes, pre)
 *
 * In pretext content layouts, use these as multipliers of the resolved
 * font size to compute line height in px.
 */
export const lineHeight = {
  none:    1,
  snug:    1.375,
  normal:  1.5,
  relaxed: 1.625,
} as const satisfies Record<string, number>;

export type LineHeightRole = keyof typeof lineHeight;

// ---------------------------------------------------------------------------
// Letter-spacing roles (em values)
// ---------------------------------------------------------------------------

/**
 * Named tracking roles. Matches Tailwind tracking-* defaults.
 *
 * Provenance: extracted from typography.css @apply rules.
 *   tight  = tracking-tight  (most UI text)
 *   wide   = tracking-wide   (labels, captions)
 */
export const tracking = {
  tight:  -0.025,
  normal:  0,
  wide:    0.025,
} as const satisfies Record<string, number>;

export type TrackingRole = keyof typeof tracking;

// ---------------------------------------------------------------------------
// CSS fluid scale — generates @layer base { :root { --font-size-fluid-* } }
// ---------------------------------------------------------------------------

/**
 * CSS container-query-based fluid tiers. Each tier generates:
 *   clamp(minRem, baseRem + cqiCoeff × 1cqi, maxRem)
 *
 * These values exactly match the current hand-authored tokens.css fluid
 * block. They use cqi (container query inline) units — text scales with
 * AppWindow width, not viewport.
 *
 * NOTE: cqiCoeff values are ~100x larger than fluidType.coeff because
 * cqi is a CSS length unit (1cqi = 1% of container inline size) while
 * fluidType.coeff is tuned for gentle canvas scaling in pretext columns.
 * At container width 600px:
 *   CSS sm:  0.7rem + 0.25 × 6px = 12.7px
 *   JS  sm:  11.2 + 0.04 × 6    = 11.44px
 *
 * After Phase 2 (all apps migrated to pretext), these CSS fluid tokens
 * can be removed — content apps will use resolveFluid() directly.
 */
export interface CssFluidTier {
  minRem: number;
  baseRem: number;
  cqiCoeff: number;
  maxRem: number;
}

export const cssFluidScale = {
  sm:    { minRem: 0.75,  baseRem: 0.7,  cqiCoeff: 0.25, maxRem: 0.875 },
  base:  { minRem: 0.875, baseRem: 0.8,  cqiCoeff: 0.5,  maxRem: 1.125 },
  lg:    { minRem: 1,     baseRem: 0.9,  cqiCoeff: 0.75, maxRem: 1.5   },
  xl:    { minRem: 1.25,  baseRem: 1,    cqiCoeff: 1.25, maxRem: 2     },
  '2xl': { minRem: 1.5,   baseRem: 1.2,  cqiCoeff: 1.75, maxRem: 2.5   },
  '3xl': { minRem: 1.75,  baseRem: 1.4,  cqiCoeff: 2.5,  maxRem: 3.5   },
  '4xl': { minRem: 2,     baseRem: 1.5,  cqiCoeff: 3.5,  maxRem: 4.5   },
} as const satisfies Record<string, CssFluidTier>;

export type CssFluidTierName = keyof typeof cssFluidScale;
