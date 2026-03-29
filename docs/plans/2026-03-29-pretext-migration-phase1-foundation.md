# Pretext Migration Phase 1 — Foundation

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Make `pretext-type-scale.ts` the single source of truth for all typography token values, with a `tokens:generate` pipeline that outputs CSS tokens as a drop-in replacement for the hand-authored values.

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA-pretext-migration`

**Architecture:** Extend `pretext-type-scale.ts` with static scale, line-height, tracking, and CSS fluid tier definitions. A new `generate-typography-tokens.ts` script reads these and outputs `generated/typography-tokens.css`. The generated file replaces the hand-authored font-size block in `tokens.css`. Root clamp stays in `base.css` (global layout concern, not typography). Output values are exact matches of current CSS — zero visual changes.

**Tech Stack:** TypeScript (Node `--experimental-strip-types`), CSS, Vitest, Turbo

**Brainstorm:** `docs/brainstorms/2026-03-29-rados-pretext-migration-brainstorm.md`

---

## Design decisions from plan review

1. **Root clamp stays in `base.css`.** `html { font-size: clamp(14px, 0.25vw + 12px, 18px) }` affects every rem value system-wide — it's a global layout decision, not a typography concern. Don't couple it to the typography generator. `rootScale` stays in pretext-type-scale.ts as a documented reference constant but the generator does NOT emit it.

2. **Static scale stores exact output values.** `staticScale` contains the pre-computed rem values (0.625, 0.75, 1, 1.333, 1.777, 2.369, 3.157, 4.209, 5.61) — the generator emits these literally, never re-derives from the ratio. This avoids rounding drift (1.333³ = 2.370... ≠ 2.369).

3. **lineHeight / tracking provenance.** Values are extracted from existing `typography.css` @apply rules, which use Tailwind named utilities. These are existing design decisions, not new ones:
   - `none: 1` — headings (`leading-none`)
   - `snug: 1.375` — body text (`leading-snug`), confirmed by GoodNewsApp `BODY_LH_RATIO`
   - `normal: 1.5` — links, inline elements (`leading-normal`)
   - `relaxed: 1.625` — lists, blockquotes, pre (`leading-relaxed`)
   - `tight: -0.025em` — most elements (`tracking-tight`)
   - `wide: 0.025em` — labels, captions (complementary pair)

4. **Multiple @theme blocks coexist.** Tailwind v4 merges all `@theme` blocks. The generated file's `@theme` (font-size tokens) coexists with tokens.css's `@theme` (colors, shadows, radius, etc.). No conflict — font-size tokens are plain rem values with zero `var()` chains, so the chain-depth bug doesn't apply.

5. **Diff gate in Task 6.** Before committing the swap, explicitly diff the generated font-size declarations against the removed hand-authored ones. Catch mismatches inline, not in Task 8.

---

### Task 1: Write failing tests for new pretext-type-scale exports

**Files:**
- Create: `packages/radiants/test/pretext-type-scale.test.ts`

**Step 1: Write the test file**

This test validates that all new exports exist with correct shapes and values. The static scale values must match what tokens.css currently defines (perfect fourth ratio from 16px base). lineHeight values are extracted from typography.css Tailwind utilities. tracking values are Tailwind defaults.

```typescript
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
    // These must match tokens.css hand-authored values exactly
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
    expect(lineHeight.none).toBe(1);       // leading-none
    expect(lineHeight.snug).toBe(1.375);   // leading-snug
    expect(lineHeight.normal).toBe(1.5);   // leading-normal
    expect(lineHeight.relaxed).toBe(1.625); // leading-relaxed
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
    expect(tracking.tight).toBe(-0.025);  // tracking-tight
    expect(tracking.normal).toBe(0);
    expect(tracking.wide).toBe(0.025);    // tracking-wide
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
    // sm: clamp(0.75rem, 0.7rem + 0.25cqi, 0.875rem)
    expect(cssFluidScale.sm).toEqual({ minRem: 0.75, baseRem: 0.7, cqiCoeff: 0.25, maxRem: 0.875 });
    // base: clamp(0.875rem, 0.8rem + 0.5cqi, 1.125rem)
    expect(cssFluidScale.base).toEqual({ minRem: 0.875, baseRem: 0.8, cqiCoeff: 0.5, maxRem: 1.125 });
    // 4xl: clamp(2rem, 1.5rem + 3.5cqi, 4.5rem)
    expect(cssFluidScale['4xl']).toEqual({ minRem: 2, baseRem: 1.5, cqiCoeff: 3.5, maxRem: 4.5 });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pretext-migration && pnpm --filter @rdna/radiants exec vitest run test/pretext-type-scale.test.ts`

Expected: FAIL — `rootScale`, `staticScale`, `lineHeight`, `tracking`, `cssFluidScale` are not exported.

**Step 3: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-migration
git add packages/radiants/test/pretext-type-scale.test.ts
git commit -m "test: add failing tests for pretext-type-scale new exports"
```

---

### Task 2: Implement new exports in pretext-type-scale.ts

**Files:**
- Modify: `packages/radiants/patterns/pretext-type-scale.ts`

**Step 1: Add new types and exports**

Append after line 115 (after `export type SpacingRole`):

```typescript
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
```

**Step 2: Run tests**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pretext-migration && pnpm --filter @rdna/radiants exec vitest run test/pretext-type-scale.test.ts`

Expected: ALL PASS

**Step 3: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-migration
git add packages/radiants/patterns/pretext-type-scale.ts
git commit -m "feat: add staticScale, lineHeight, tracking, cssFluidScale to pretext-type-scale"
```

---

### Task 3: Write failing test for the token generator script

**Files:**
- Create: `packages/radiants/test/generate-typography-tokens.test.ts`

**Step 1: Write the test**

This test runs the generator and validates the CSS output matches current hand-authored values exactly. Note: the generator does NOT emit the root clamp — that stays in base.css.

```typescript
import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const generatedPath = join(__dirname, '..', 'generated', 'typography-tokens.css');

describe('generate-typography-tokens', () => {
  let css: string;

  beforeAll(() => {
    execSync(
      'node --experimental-strip-types scripts/generate-typography-tokens.ts',
      { cwd: join(__dirname, '..'), stdio: 'pipe' }
    );
    css = readFileSync(generatedPath, 'utf8');
  });

  it('outputs a non-empty CSS file', () => {
    expect(css.length).toBeGreaterThan(0);
  });

  it('contains the auto-generated header comment', () => {
    expect(css).toContain('Auto-generated from pretext-type-scale.ts');
    expect(css).toContain('do not edit');
  });

  // --- Static scale (@theme block) ---

  it('outputs @theme block with all static font-size tokens', () => {
    expect(css).toContain('@theme');
    expect(css).toContain('--font-size-xs: 0.625rem');
    expect(css).toContain('--font-size-sm: 0.75rem');
    expect(css).toContain('--font-size-base: 1rem');
    expect(css).toContain('--font-size-lg: 1.333rem');
    expect(css).toContain('--font-size-xl: 1.777rem');
    expect(css).toContain('--font-size-2xl: 2.369rem');
    expect(css).toContain('--font-size-3xl: 3.157rem');
    expect(css).toContain('--font-size-4xl: 4.209rem');
    expect(css).toContain('--font-size-5xl: 5.61rem');
    expect(css).toContain('--font-size-display: 5.61rem');
  });

  // --- Fluid scale (@layer base) ---

  it('outputs @layer base block with fluid font-size tokens', () => {
    expect(css).toContain('@layer base');
    expect(css).toContain('--font-size-fluid-sm: clamp(0.75rem, 0.7rem + 0.25cqi, 0.875rem)');
    expect(css).toContain('--font-size-fluid-base: clamp(0.875rem, 0.8rem + 0.5cqi, 1.125rem)');
    expect(css).toContain('--font-size-fluid-lg: clamp(1rem, 0.9rem + 0.75cqi, 1.5rem)');
    expect(css).toContain('--font-size-fluid-xl: clamp(1.25rem, 1rem + 1.25cqi, 2rem)');
    expect(css).toContain('--font-size-fluid-2xl: clamp(1.5rem, 1.2rem + 1.75cqi, 2.5rem)');
    expect(css).toContain('--font-size-fluid-3xl: clamp(1.75rem, 1.4rem + 2.5cqi, 3.5rem)');
    expect(css).toContain('--font-size-fluid-4xl: clamp(2rem, 1.5rem + 3.5cqi, 4.5rem)');
  });

  // --- Root clamp is NOT generated ---

  it('does NOT contain html root font-size (stays in base.css)', () => {
    expect(css).not.toMatch(/html\s*\{/);
    expect(css).not.toContain('0.25vw');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pretext-migration && pnpm --filter @rdna/radiants exec vitest run test/generate-typography-tokens.test.ts`

Expected: FAIL — script does not exist yet.

**Step 3: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-migration
git add packages/radiants/test/generate-typography-tokens.test.ts
git commit -m "test: add failing tests for typography token generator"
```

---

### Task 4: Implement the token generator script

**Files:**
- Create: `packages/radiants/scripts/generate-typography-tokens.ts`

**Step 1: Write the generator script**

```typescript
#!/usr/bin/env node
/**
 * generate-typography-tokens.ts
 *
 * Reads pretext-type-scale.ts (the single source of truth) and outputs
 * generated/typography-tokens.css containing:
 *   1. @theme block with static --font-size-* tokens
 *   2. @layer base block with fluid --font-size-fluid-* tokens (cqi-based)
 *
 * The root clamp (html { font-size }) is NOT generated here — it stays
 * in base.css as a global layout concern.
 *
 * Run: node --experimental-strip-types scripts/generate-typography-tokens.ts
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

import { staticScale, cssFluidScale } from '../patterns/pretext-type-scale';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a number, trimming trailing zeros: 1.000 → "1", 0.750 → "0.75" */
function fmt(n: number): string {
  const s = n.toFixed(3);
  return s.replace(/\.?0+$/, '') || '0';
}

// ---------------------------------------------------------------------------
// Generate CSS
// ---------------------------------------------------------------------------

function generateCss(): string {
  const lines: string[] = [];

  lines.push('/* =============================================================================');
  lines.push('   Auto-generated from pretext-type-scale.ts — do not edit.');
  lines.push('   Run: pnpm tokens:generate');
  lines.push('   ============================================================================= */');
  lines.push('');

  // --- @theme: static font-size tokens ---
  lines.push('@theme {');
  const scaleComments: Record<string, string> = {
    xs:      '10px - fixed: small labels',
    sm:      '12px - fixed: buttons, small UI',
    base:    '16px - base',
    lg:      '~21px - base × 1.333',
    xl:      '~28px - base × 1.333²',
    '2xl':   '~38px - base × 1.333³',
    '3xl':   '~50px - base × 1.333⁴',
    '4xl':   '~67px - base × 1.333⁵',
    '5xl':   '~90px - base × 1.333⁶',
    display: 'alias: same as 5xl',
  };

  for (const [tier, rem] of Object.entries(staticScale)) {
    const comment = scaleComments[tier] ? `  /* ${scaleComments[tier]} */` : '';
    lines.push(`  --font-size-${tier}: ${fmt(rem)}rem;${comment}`);
  }
  lines.push('}');
  lines.push('');

  // --- @layer base: fluid tokens ---
  lines.push('@layer base {');
  lines.push('  :root {');

  for (const [tier, t] of Object.entries(cssFluidScale)) {
    const clamp = `clamp(${fmt(t.minRem)}rem, ${fmt(t.baseRem)}rem + ${fmt(t.cqiCoeff)}cqi, ${fmt(t.maxRem)}rem)`;
    lines.push(`    --font-size-fluid-${tier}: ${clamp};`);
  }

  lines.push('  }');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const outDir = join(dirname(new URL(import.meta.url).pathname), '..', 'generated');
mkdirSync(outDir, { recursive: true });

const outPath = join(outDir, 'typography-tokens.css');
const css = generateCss();
writeFileSync(outPath, css, 'utf8');

console.log(`[tokens:generate] wrote ${outPath} (${css.length} bytes)`);
```

**Step 2: Run generator to verify it works**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pretext-migration && node --experimental-strip-types packages/radiants/scripts/generate-typography-tokens.ts`

Expected: prints success message, `generated/typography-tokens.css` written.

**Step 3: Run tests**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pretext-migration && pnpm --filter @rdna/radiants exec vitest run test/generate-typography-tokens.test.ts`

Expected: ALL PASS

**Step 4: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-migration
git add packages/radiants/scripts/generate-typography-tokens.ts packages/radiants/generated/typography-tokens.css
git commit -m "feat: add typography token generator (pretext-type-scale → CSS)"
```

---

### Task 5: Wire tokens:generate into the pipeline

**Files:**
- Modify: `packages/radiants/package.json` (add `generate:tokens` script)
- Modify: `package.json` (root — add `tokens:generate` script)

**Step 1: Add generate:tokens to packages/radiants/package.json**

In the `"scripts"` block, add after `"generate:pixel-corners"`:

```json
"generate:tokens": "node --experimental-strip-types scripts/generate-typography-tokens.ts",
```

**Step 2: Add tokens:generate to root package.json**

In the `"scripts"` block, add after `"registry:generate"`:

```json
"tokens:generate": "pnpm --filter @rdna/radiants generate:tokens",
```

**Step 3: Test the pipeline command**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pretext-migration && pnpm tokens:generate`

Expected: Prints success message.

**Step 4: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-migration
git add packages/radiants/package.json package.json
git commit -m "feat: wire tokens:generate into turbo pipeline"
```

---

### Task 6: Replace hand-authored font-sizes in tokens.css with generated import

This is the highest-risk step. The generated CSS must produce identical values.

**Files:**
- Modify: `packages/radiants/tokens.css` (remove font-size block from @theme, remove fluid @layer base block)
- Modify: `packages/radiants/index.css` (add import for generated file)

**Step 1: Capture the current values for diffing**

Before making any changes, extract the values we're about to remove:

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pretext-migration && grep -- '--font-size' packages/radiants/tokens.css > /tmp/tokens-before.txt && cat /tmp/tokens-before.txt`

This captures all `--font-size-*` declarations from the hand-authored file.

**Step 2: Remove static font-size tokens from tokens.css @theme block**

In `packages/radiants/tokens.css`, remove lines 183–199 (the `TYPOGRAPHY SCALE` comment and all `--font-size-*` declarations):

```css
  /* ============================================
     TYPOGRAPHY SCALE
     Perfect fourth (1.333) from 16px base.
     xs/sm are fixed for UI legibility.
     base -> 5xl follow the ratio.
     ============================================ */

  --font-size-xs: 0.625rem;     /*  10px - fixed: small labels */
  --font-size-sm: 0.75rem;      /*  12px - fixed: buttons, small UI */
  --font-size-base: 1rem;       /*  16px - base */
  --font-size-lg: 1.333rem;     /* ~21px - base x 1.333 */
  --font-size-xl: 1.777rem;     /* ~28px - base x 1.333^2 */
  --font-size-2xl: 2.369rem;    /* ~38px - base x 1.333^3 */
  --font-size-3xl: 3.157rem;    /* ~50px - base x 1.333^4 */
  --font-size-4xl: 4.209rem;    /* ~67px - base x 1.333^5 */
  --font-size-5xl: 5.61rem;     /* ~90px - base x 1.333^6 */
  --font-size-display: 5.61rem; /* alias: same as 5xl, named for hero/display use */
```

**Step 3: Remove fluid typography block from tokens.css**

Remove the entire `FLUID TYPOGRAPHY` comment block and `@layer base { :root { --font-size-fluid-* } }` block (lines 265–294 in the original file):

```css
/* =============================================================================
   FLUID TYPOGRAPHY
   ... (entire comment + @layer base block)
   ============================================================================= */

@layer base {
  :root {
    --font-size-fluid-sm: clamp(0.75rem, 0.7rem + 0.25cqi, 0.875rem);
    ...
  }
}
```

**Step 4: Add generated import to index.css**

In `packages/radiants/index.css`, add the generated import BEFORE the tokens.css import (so the `@theme` block is processed first):

```css
/* Generated typography tokens (from pretext-type-scale.ts) */
@import './generated/typography-tokens.css';

/* Theme tokens - semantic color mappings */
@import './tokens.css';
```

**Step 5: DIFF GATE — verify generated values match removed values**

Run:
```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-migration
grep -- '--font-size' packages/radiants/generated/typography-tokens.css > /tmp/tokens-after.txt
diff /tmp/tokens-before.txt /tmp/tokens-after.txt
```

Expected: The diff should show only cosmetic differences (comment format, whitespace). The actual CSS property names and values must be identical:
- `--font-size-xs: 0.625rem` ↔ `--font-size-xs: 0.625rem`
- `--font-size-fluid-sm: clamp(0.75rem, 0.7rem + 0.25cqi, 0.875rem)` ↔ same

If ANY value differs, stop and fix the generator before proceeding.

**Step 6: Run build**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pretext-migration && pnpm tokens:generate && pnpm build`

Expected: Build succeeds. All Tailwind utilities (`text-sm`, `text-base`, etc.) resolve correctly — the `@theme` block now comes from the generated file and coexists with the remaining `@theme` block in tokens.css (colors, shadows, etc.).

**Step 7: Run existing tests**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pretext-migration && pnpm --filter @rdna/radiants test`

Expected: ALL PASS

**Step 8: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-migration
git add packages/radiants/tokens.css packages/radiants/index.css
git commit -m "refactor: replace hand-authored font-size tokens with generated import"
```

---

### Task 7: Add freshness test and update theme-compat

**Files:**
- Create: `packages/radiants/test/typography-tokens-freshness.test.ts`

**Step 1: Write freshness test**

This test ensures the generated file stays in sync with pretext-type-scale.ts. If someone edits the source but forgets `pnpm tokens:generate`, this catches it.

```typescript
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const generatedPath = join(__dirname, '..', 'generated', 'typography-tokens.css');

describe('typography-tokens freshness', () => {
  it('generated/typography-tokens.css exists', () => {
    expect(existsSync(generatedPath)).toBe(true);
  });

  it('is in sync with pretext-type-scale.ts (regenerating produces identical output)', () => {
    const before = readFileSync(generatedPath, 'utf8');

    execSync(
      'node --experimental-strip-types scripts/generate-typography-tokens.ts',
      { cwd: join(__dirname, '..'), stdio: 'pipe' }
    );

    const after = readFileSync(generatedPath, 'utf8');
    expect(after).toBe(before);
  });
});
```

**Step 2: Run all radiants tests**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pretext-migration && pnpm --filter @rdna/radiants test`

Expected: ALL PASS

**Step 3: Commit**

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pretext-migration
git add packages/radiants/test/typography-tokens-freshness.test.ts
git commit -m "test: add typography tokens freshness check"
```

---

### Task 8: Full verification — build, lint, test

**Files:** None (verification only)

**Step 1: Full test suite**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pretext-migration && pnpm test`

Expected: ALL PASS

**Step 2: Lint**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pretext-migration && pnpm lint`

Expected: No new errors.

**Step 3: Design system lint**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pretext-migration && pnpm lint:design-system`

Expected: No new warnings or errors.

**Step 4: Dev server**

Run: `cd /Users/rivermassey/Desktop/dev/DNA-pretext-migration && pnpm dev`

Expected: rad-os starts without errors. Typography renders identically — this is a zero-visual-change refactor.

**Step 5: Visual spot-check**

Open `localhost:3000` (rad-os). Verify:
- Headings use fluid sizes (resize window to confirm scaling)
- Body text in ManifestoApp renders at correct size
- GoodNewsApp newspaper layout is unchanged
- Button labels, tab titles, badges render correctly

If anything looks different, the generated values don't match. Check `generated/typography-tokens.css` against the diff captured in Task 6.

---

## Summary

After Phase 1, the state is:

| Before | After |
|--------|-------|
| Font sizes hand-authored in tokens.css | Font sizes generated from pretext-type-scale.ts |
| Root clamp in base.css | Root clamp stays in base.css (unchanged) |
| Two parallel scale definitions (JS + CSS) | One source of truth (JS), CSS derived |
| typography.css still exists | typography.css still exists (deleted in Phase 2) |
| No generator pipeline | `pnpm tokens:generate` in turbo pipeline |

**Next:** Phase 2 plan — migrate apps one-by-one to pretext reflow, starting with ManifestoApp.
