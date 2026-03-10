# OKLCH Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate all color values in the radiants theme layer from hex/rgba to OKLCH, extract repeated dark-mode glow literals into tokens, extend ESLint autofix logic for arbitrary OKLCH classes, add a new enforcement rule banning legacy color formats in token CSS files, and update documentation.

**Worktree:** `/private/tmp/claude/dna-oklch` (branch: `feat/oklch-migration`)

**Architecture:** The semantic token API (`--color-surface-primary`, etc.) stays stable — only the underlying assigned values change. Brand tokens in `tokens.css` are the single source of truth; semantic tokens that reference them via `var()` inherit oklch for free. The repeated `rgba(254, 248, 226, 0.3/0.4)` box-shadow literals in `dark.css` get extracted into two new glow tokens before conversion. Enforcement happens in two places: a comment-aware token CSS scanner rejects non-OKLCH live values in `tokens.css`/`dark.css`, and `rdna/no-hardcoded-colors` is extended to auto-fix arbitrary `oklch(...)` Tailwind classes instead of relying on dead token-map entries.

**Tech Stack:** CSS (oklch), Tailwind v4 `@theme`, ESLint (custom rule), Node.js (conversion script), Vitest (tests)

**Brainstorm:** `docs/brainstorms/2026-03-10-oklch-migration-brainstorm.md`

---

## Preconditions

- Node.js 18+ (for the conversion script)
- `pnpm install` must succeed in the worktree
- `pnpm lint:design-system` must exit 0 before starting (current baseline is clean)

---

## Task 1: Generate OKLCH Conversion Reference Table

**Files:**
- Create: `packages/radiants/ops/hex-to-oklch.mjs`

This script is the single source of truth for all conversions in subsequent tasks. Every oklch value used in this plan comes from this script's output.

**Step 1: Install `culori` as a dev dependency**

```bash
cd /private/tmp/claude/dna-oklch
pnpm add -D culori --filter @rdna/radiants
```

**Step 2: Write the conversion script**

```js
// packages/radiants/ops/hex-to-oklch.mjs
import { converter, formatCss } from 'culori';

const toOklch = converter('oklch');

// All hex values from tokens.css and dark.css
const hexValues = {
  // Brand palette (tokens.css)
  '--color-cream':        '#FEF8E2',
  '--color-ink':          '#0F0E0C',
  '--color-pure-black':   '#000000',
  '--color-sun-yellow':   '#FCE184',
  '--color-sky-blue':     '#95BAD2',
  '--color-sunset-fuzz':  '#FCC383',
  '--color-sun-red':      '#FF6B63',
  '--color-mint':         '#CEF5CA',
  '--color-pure-white':   '#FFFFFF',
  '--color-success-mint': '#22C55E',

  // Dark-only (dark.css)
  '--color-surface-tertiary-dark': '#3D2E1A',
};

// All rgba values from tokens.css and dark.css (unique base colors)
const rgbaValues = {
  'ink @ various alphas':       'rgb(15, 14, 12)',
  'cream @ various alphas':     'rgb(254, 248, 226)',
  'sun-yellow @ various alphas':'rgb(252, 225, 132)',
  'sun-red @ various alphas':   'rgb(255, 107, 99)',
  'mint @ various alphas':      'rgb(206, 245, 202)',
  'sky-blue @ various alphas':  'rgb(149, 186, 210)',
};

function fmt(oklch) {
  // Round: L to 4 decimals, C to 4, H to 2
  const l = oklch.l.toFixed(4);
  const c = oklch.c.toFixed(4);
  const h = oklch.h != null ? oklch.h.toFixed(2) : '0';
  return `oklch(${l} ${c} ${h})`;
}

console.log('=== HEX → OKLCH ===\n');
for (const [name, hex] of Object.entries(hexValues)) {
  const oklch = toOklch(hex);
  console.log(`${name.padEnd(38)} ${hex.padEnd(10)} → ${fmt(oklch)}`);
}

console.log('\n=== RGBA BASE COLORS → OKLCH (add " / alpha" suffix) ===\n');
for (const [name, rgb] of Object.entries(rgbaValues)) {
  const oklch = toOklch(rgb);
  console.log(`${name.padEnd(38)} → ${fmt(oklch)}`);
}
```

**Step 3: Run the script and record output**

```bash
cd /private/tmp/claude/dna-oklch
node packages/radiants/ops/hex-to-oklch.mjs
```

Expected: a table of oklch values for every hex/rgba base color in the theme. Save this output — all subsequent tasks use these exact values.

**Step 4: Commit**

```bash
git add packages/radiants/ops/hex-to-oklch.mjs packages/radiants/package.json pnpm-lock.yaml
git commit -m "chore(radiants): add hex-to-oklch conversion script"
```

---

## Task 2: Convert Brand Tokens in tokens.css

**Files:**
- Modify: `packages/radiants/tokens.css` (lines 12–23)

Replace the 10 hex brand token values with oklch equivalents from Task 1's output.

**Step 1: Replace hex values**

Before:
```css
--color-cream: #FEF8E2;
--color-ink: #0F0E0C;
--color-pure-black: #000000;
--color-sun-yellow: #FCE184;
--color-sky-blue: #95BAD2;
--color-sunset-fuzz: #FCC383;
--color-sun-red: #FF6B63;
--color-mint: #CEF5CA;
--color-pure-white: #FFFFFF;
--color-success-mint: #22C55E;
```

After (use exact values from Task 1 output):
```css
--color-cream: oklch(L C H);        /* was #FEF8E2 */
--color-ink: oklch(L C H);          /* was #0F0E0C */
--color-pure-black: oklch(0 0 0);   /* was #000000 */
--color-sun-yellow: oklch(L C H);   /* was #FCE184 */
--color-sky-blue: oklch(L C H);     /* was #95BAD2 */
--color-sunset-fuzz: oklch(L C H);  /* was #FCC383 */
--color-sun-red: oklch(L C H);      /* was #FF6B63 */
--color-mint: oklch(L C H);         /* was #CEF5CA */
--color-pure-white: oklch(1 0 0);   /* was #FFFFFF */
--color-success-mint: oklch(L C H); /* was #22C55E */
```

**Naming convention for comments:** Include `/* was #HEX */` on the same line for traceability during migration. These comments can be removed in a future cleanup pass.

**Verification note:** The migration comments are expected to remain after this plan. Any grep-based verification later in the plan must target live values, not comment text.

**Step 2: Verify CSS parses**

```bash
cd /private/tmp/claude/dna-oklch
npx tailwindcss --input packages/radiants/tokens.css --content '' 2>&1 | head -5
```

Expected: no parse errors. (The `--content ''` flag means no HTML scanning, just CSS validation.)

If Tailwind CLI is not directly available, alternatively verify by running:
```bash
pnpm --filter @rdna/rad-os build 2>&1 | tail -20
```

**Step 3: Commit**

```bash
git add packages/radiants/tokens.css
git commit -m "feat(radiants): convert brand tokens to oklch"
```

---

## Task 3: Convert Alpha Tokens in tokens.css

**Files:**
- Modify: `packages/radiants/tokens.css` (lines 55–57, 66–67, 129–133)

Replace the 9 rgba values with oklch equivalents. The oklch alpha syntax is `oklch(L C H / alpha)`.

**Step 1: Convert content/edge rgba values (lines 55–67)**

Before:
```css
--color-content-secondary: rgba(15, 14, 12, 0.85);
--color-content-muted: rgba(15, 14, 12, 0.6);
--color-edge-muted: rgba(15, 14, 12, 0.2);
--color-edge-hover: rgba(15, 14, 12, 0.3);
```

After (use ink's oklch base from Task 1):
```css
--color-content-secondary: oklch(L C H / 0.85);  /* was rgba(15, 14, 12, 0.85) */
--color-content-muted: oklch(L C H / 0.6);        /* was rgba(15, 14, 12, 0.6) */
--color-edge-muted: oklch(L C H / 0.2);           /* was rgba(15, 14, 12, 0.2) */
--color-edge-hover: oklch(L C H / 0.3);           /* was rgba(15, 14, 12, 0.3) */
```

Where `L C H` are ink's oklch coordinates.

**Step 2: Convert glow rgba values (lines 129–133)**

Before:
```css
--glow-sun-yellow: rgba(252, 225, 132, 0);
--glow-sun-yellow-subtle: rgba(252, 225, 132, 0);
--glow-sun-red: rgba(255, 107, 99, 0);
--glow-mint: rgba(206, 245, 202, 0);
--glow-sky-blue: rgba(149, 186, 210, 0);
```

After (use each color's oklch base from Task 1):
```css
--glow-sun-yellow: oklch(L C H / 0);         /* was rgba(252, 225, 132, 0) */
--glow-sun-yellow-subtle: oklch(L C H / 0);  /* was rgba(252, 225, 132, 0) */
--glow-sun-red: oklch(L C H / 0);            /* was rgba(255, 107, 99, 0) */
--glow-mint: oklch(L C H / 0);               /* was rgba(206, 245, 202, 0) */
--glow-sky-blue: oklch(L C H / 0);           /* was rgba(149, 186, 210, 0) */
```

**Step 3: Commit**

```bash
git add packages/radiants/tokens.css
git commit -m "feat(radiants): convert alpha tokens to oklch"
```

---

## Task 4: Extract Glow Cream Tokens in dark.css

**Files:**
- Modify: `packages/radiants/dark.css` (add 2 new token declarations at top of `.dark {}`)

The values `rgba(254, 248, 226, 0.3)` and `rgba(254, 248, 226, 0.4)` appear across ~28 box-shadow lines. Extract them into tokens before converting.

**Step 1: Add new glow tokens at the top of the first `.dark {}` block**

Add after the existing glow token declarations (after line 83):

```css
/* Cream glow opacity steps for hover/active states */
--glow-cream-hover: oklch(L C H / 0.3);   /* was rgba(254, 248, 226, 0.3) */
--glow-cream-active: oklch(L C H / 0.4);  /* was rgba(254, 248, 226, 0.4) */
```

Where `L C H` are cream's oklch coordinates from Task 1.

**Step 2: Do NOT replace the inline rgba references yet — that's Task 6**

This task only declares the tokens. Task 5 converts the remaining token overrides, and Task 6 replaces the box-shadow inline values with `var(--glow-cream-*)`.

**Step 3: Commit**

```bash
git add packages/radiants/dark.css
git commit -m "feat(radiants): extract glow-cream-hover/active tokens"
```

---

## Task 5: Convert dark.css Token Override Declarations

**Files:**
- Modify: `packages/radiants/dark.css` (lines 11–83)

Convert the token override values in the first `.dark {}` block.

**Step 1: Convert the standalone hex**

Before (line 19):
```css
--color-surface-tertiary: #3D2E1A;
```

After:
```css
--color-surface-tertiary: oklch(L C H);  /* was #3D2E1A */
```

**Step 2: Convert rgba token declarations**

Replace all `rgba(...)` in token override declarations (lines 21–83). These are the token-level overrides, NOT the box-shadow inline values.

All `rgba(252, 225, 132, X)` → `oklch(sun-yellow-L sun-yellow-C sun-yellow-H / X)`
All `rgba(254, 248, 226, X)` → `oklch(cream-L cream-C cream-H / X)`
All `rgba(255, 107, 99, X)` → `oklch(sun-red-L sun-red-C sun-red-H / X)`
All `rgba(206, 245, 202, X)` → `oklch(mint-L mint-C mint-H / X)`
All `rgba(149, 186, 210, X)` → `oklch(sky-blue-L sky-blue-C sky-blue-H / X)`

Specific conversions in order of appearance:

```css
/* Line 21 */ --color-surface-muted: oklch(L C H / 0.08);           /* sun-yellow */
/* Line 24 */ --color-surface-overlay-subtle: oklch(L C H / 0.04);  /* sun-yellow */
/* Line 25 */ --color-surface-overlay-medium: oklch(L C H / 0.08);  /* sun-yellow */
/* Line 28 */ --color-hover-overlay: oklch(L C H / 0.08);           /* sun-yellow */
/* Line 29 */ --color-active-overlay: oklch(L C H / 0.12);          /* sun-yellow */
/* Line 38 */ --color-content-secondary: oklch(L C H / 0.85);       /* cream */
/* Line 40 */ --color-content-muted: oklch(L C H / 0.6);            /* cream */
/* Line 47 */ --color-edge-primary: oklch(L C H / 0.2);             /* cream */
/* Line 48 */ --color-edge-muted: oklch(L C H / 0.12);              /* cream */
/* Line 49 */ --color-edge-hover: oklch(L C H / 0.35);              /* cream */
/* Line 79 */ --glow-sun-yellow: oklch(L C H / 0.6);                /* sun-yellow */
/* Line 80 */ --glow-sun-yellow-subtle: oklch(L C H / 0.3);         /* sun-yellow */
/* Line 81 */ --glow-sun-red: oklch(L C H / 0.5);                   /* sun-red */
/* Line 82 */ --glow-mint: oklch(L C H / 0.5);                      /* mint */
/* Line 83 */ --glow-sky-blue: oklch(L C H / 0.5);                  /* sky-blue */
```

**Step 3: Verify no remaining legacy formats in token override declarations**

```bash
cd /private/tmp/claude/dna-oklch
rg -n '^[[:space:]]*--[a-z0-9-]+:\s*(?:#[0-9A-Fa-f]{3,8}|(?:rgba?|hsla?|hwb|lab|lch|oklab|color|color-mix|device-cmyk)\()' packages/radiants/dark.css
```

Expected: zero results. This check only targets live custom-property declarations, so `/* was ... */` comments do not count.

**Step 4: Commit**

```bash
git add packages/radiants/dark.css
git commit -m "feat(radiants): convert dark.css token overrides to oklch"
```

---

## Task 6: Replace Repeated Box-Shadow rgba Literals in dark.css

**Files:**
- Modify: `packages/radiants/dark.css` (lines 120–522, second `.dark {}` block)

Replace the ~28 inline `rgba(254, 248, 226, 0.3)` and `rgba(254, 248, 226, 0.4)` values with `var(--glow-cream-hover)` and `var(--glow-cream-active)` respectively.

Also convert the one remaining inline `rgba(255, 107, 99, 0.4)` (destructive button hover border-color, line 420) to oklch.

**Step 1: Replace hover glow pattern**

Find all occurrences of:
```css
0 0 4px rgba(254, 248, 226, 0.3),
```

Replace with:
```css
0 0 4px var(--glow-cream-hover),
```

This appears in: primary button hover, ghost button hover, ghost button selected, secondary button hover, secondary selected hover, outline button hover, accordion hover, switch hover, select trigger hover, pill tab hover, scrollbar thumb hover.

**Step 2: Replace active glow pattern**

Find all occurrences of:
```css
0 0 6px rgba(254, 248, 226, 0.4),
```

Replace with:
```css
0 0 6px var(--glow-cream-active),
```

This appears in: primary button active, ghost button active, secondary button active, secondary selected active, outline button active, switch active, select trigger open.

**Step 3: Convert destructive button inline rgba**

Line 420:
```css
border-color: rgba(255, 107, 99, 0.4);
```

Replace with:
```css
border-color: oklch(L C H / 0.4);  /* sun-red at 40% */
```

Line 428:
```css
0 0 6px rgba(255, 107, 99, 0.4),
```

Replace with:
```css
0 0 6px oklch(L C H / 0.4),  /* sun-red at 40% */
```

**Step 4: Spot-audit the remaining live legacy colors in dark.css**

```bash
cd /private/tmp/claude/dna-oklch
rg -n 'rgba\(' packages/radiants/dark.css
```

Expected: zero results or only `/* was ... */` migration comments. Full-file, comment-aware enforcement is added in Tasks 10-12 and becomes the authoritative check in Task 15.

**Step 5: Commit**

```bash
git add packages/radiants/dark.css
git commit -m "feat(radiants): replace dark.css box-shadow rgba with glow tokens"
```

---

## Task 7: Smoke Test Tailwind v4 Build

**Files:** None (verification only)

**Step 1: Run rad-os dev build**

```bash
cd /private/tmp/claude/dna-oklch
pnpm --filter @rdna/rad-os build 2>&1 | tail -20
```

Expected: build succeeds with no CSS parsing errors.

**Step 2: Run existing lint baseline**

```bash
cd /private/tmp/claude/dna-oklch
pnpm lint:design-system 2>&1 | tail -10
```

Expected: exit 0, same baseline as before migration.

**Step 3: Run TypeScript check**

```bash
cd /private/tmp/claude/dna-oklch
pnpm tsc --noEmit -p apps/rad-os/tsconfig.json 2>&1 | tail -5
```

Expected: exit 0.

If any step fails, stop and investigate before continuing. The CSS token layer must be clean before touching component code.

---

## Task 8: Update MockStatesPopover.tsx Fallback Values

**Files:**
- Modify: `packages/radiants/components/core/MockStatesPopover/MockStatesPopover.tsx` (lines 108–246)

**Step 1: Replace hex fallbacks**

| Line | Before | After |
|------|--------|-------|
| 108 | `var(--color-action-primary, #FCE184)` | `var(--color-action-primary, oklch(L C H))` |
| 110 | `var(--color-content-primary, #0F0E0C)` | `var(--color-content-primary, oklch(L C H))` |
| 169 | `var(--color-surface-primary, #FEF8E2)` | `var(--color-surface-primary, oklch(L C H))` |
| 171 | `var(--color-edge-primary, #0F0E0C)` | `var(--color-edge-primary, oklch(L C H))` |

Use the oklch values from Task 1 for sun-yellow, ink, cream, and ink respectively.

**Step 2: Replace rgba fallbacks**

| Line | Before | After |
|------|--------|-------|
| 116 | `var(--color-hover-overlay, rgba(15, 14, 12, 0.05))` | `var(--color-hover-overlay, oklch(L C H / 0.05))` |
| 138 | `var(--color-content-secondary, rgba(15, 14, 12, 0.7))` | `var(--color-content-secondary, oklch(L C H / 0.7))` |
| 185 | `var(--color-edge-muted, rgba(15, 14, 12, 0.2))` | `var(--color-edge-muted, oklch(L C H / 0.2))` |
| 216 | `var(--color-content-secondary, rgba(15, 14, 12, 0.7))` | `var(--color-content-secondary, oklch(L C H / 0.7))` |
| 238 | `var(--color-edge-muted, rgba(15, 14, 12, 0.2))` | `var(--color-edge-muted, oklch(L C H / 0.2))` |
| 240 | `var(--color-surface-muted, rgba(15, 14, 12, 0.03))` | `var(--color-surface-muted, oklch(L C H / 0.03))` |
| 246 | `var(--color-content-secondary, rgba(15, 14, 12, 0.7))` | `var(--color-content-secondary, oklch(L C H / 0.7))` |

Use ink's oklch base from Task 1 for all (they're all ink-based rgba).

**Step 3: Verify TypeScript compiles**

```bash
cd /private/tmp/claude/dna-oklch
pnpm tsc --noEmit -p packages/radiants/tsconfig.json 2>&1 | tail -5
```

Expected: exit 0.

**Step 4: Commit**

```bash
git add packages/radiants/components/core/MockStatesPopover/MockStatesPopover.tsx
git commit -m "feat(radiants): convert MockStatesPopover fallbacks to oklch"
```

---

## Task 9: Teach `rdna/no-hardcoded-colors` Autofix About OKLCH Arbitrary Utilities

**Files:**
- Modify: `packages/radiants/eslint/token-map.mjs`
- Modify: `packages/radiants/eslint/utils.mjs`
- Modify: `packages/radiants/eslint/rules/no-hardcoded-colors.mjs`
- Modify: `packages/radiants/eslint/__tests__/no-hardcoded-colors.test.mjs`

The current fixer only auto-fixes arbitrary hex values. It does **not** look up raw `oklch(...)` values yet, so simply adding oklch keys to `brandPalette`/`hexToSemantic` would be dead data. This task updates the rule logic and tests so arbitrary classes like `bg-[oklch(...)]` can be normalized and auto-fixed to semantic tokens.

**Step 1: Keep `brandPalette` hex/primitive-only; add a dedicated OKLCH lookup map**

```js
// Keep brandPalette for primitive suffix detection only.
export const brandPalette = {
  '#fef8e2': 'cream',
  '#0f0e0c': 'ink',
  // ...
};

// Add a new lookup keyed by normalized oklch strings.
export const oklchToSemantic = {
  'oklch(L C H)': { bg: 'surface-primary', text: 'content-inverted' },
  'oklch(L C H)': { bg: 'surface-secondary', text: 'content-primary', border: 'edge-primary' },
  // ... only for safe 1:1 mappings
};
```

Use the exact values from Task 1, lowercased. Do **not** duplicate meaningless oklch keys into `brandPalette`.

**Step 2: Add an `normalizeOklch()` helper in `packages/radiants/eslint/utils.mjs`**

Implement a small normalizer for arbitrary utility payloads:

```js
export function normalizeOklch(value) {
  const match = value.trim().toLowerCase().match(/^oklch\(\s*([^)]+?)\s*\)$/);
  if (!match) return null;

  const body = match[1]
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+/g, ' ')
    .trim();

  return `oklch(${body})`;
}
```

This is enough for values copied from the generated token table while tolerating whitespace differences like `oklch(.../0.3)` vs `oklch(... / 0.3)`.

**Step 3: Update `no-hardcoded-colors.mjs` to use the new lookup**

In `buildUtilityFix()`:
- keep the current semantic-var fast path
- keep the current hex lookup for legacy values
- add a new branch for raw `oklch(...)` arbitrary values:
  - `const normalizedOklch = normalizeOklch(utility.value);`
  - look up `oklchToSemantic[normalizedOklch]`
  - if a safe mapping exists for the current context (`bg`, `text`, `border`, `ring`), return the semantic class fix
- leave unmatched OKLCH values reported but un-fixed

Also update imports accordingly:

```js
import { brandPalette, hexToSemantic, oklchToSemantic } from '../token-map.mjs';
import { /* existing helpers */, normalizeOklch } from '../utils.mjs';
```

**Step 4: Add targeted ESLint tests for OKLCH autofix**

Extend `packages/radiants/eslint/__tests__/no-hardcoded-colors.test.mjs` with cases like:

```js
{
  code: '<div className="bg-[oklch(L C H)]" />',
  errors: [{ messageId: 'arbitraryColor' }],
  output: '<div className="bg-surface-primary" />',
},
{
  code: '<div className="dark:hover:text-[oklch(L C H)]" />',
  errors: [{ messageId: 'arbitraryColor' }],
  output: '<div className="dark:hover:text-content-primary" />',
},
{
  code: '<div className="bg-[oklch(0 0 0)]" />',
  errors: [{ messageId: 'arbitraryColor' }],
}
```

Use exact Task 1 values in the passing autofix fixtures.

**Step 5: Run ESLint tests**

```bash
cd /private/tmp/claude/dna-oklch
pnpm --dir packages/radiants exec vitest run eslint/__tests__/no-hardcoded-colors.test.mjs
```

Expected: all tests pass, including the new OKLCH autofix cases.

**Step 6: Commit**

```bash
git add packages/radiants/eslint/token-map.mjs packages/radiants/eslint/utils.mjs packages/radiants/eslint/rules/no-hardcoded-colors.mjs packages/radiants/eslint/__tests__/no-hardcoded-colors.test.mjs
git commit -m "feat(radiants): autofix arbitrary oklch classes to semantic tokens"
```

---

## Task 10: Write Tests for CSS Token Enforcement Rule

**Files:**
- Create: `packages/radiants/eslint/__tests__/no-legacy-color-format.test.mjs`

This rule is different from the existing ESLint rules — it scans CSS files, not JSX. It should be implemented as a standalone Node utility (not an ESLint rule) since ESLint doesn't parse CSS. The scanner must be comment-aware and reject live non-OKLCH color syntax, not just hex/rgba.

**Step 1: Write the test**

```js
// packages/radiants/eslint/__tests__/no-legacy-color-format.test.mjs
import { describe, it, expect } from 'vitest';
import { scanForLegacyColors } from '../lib/no-legacy-color-format.mjs';

describe('no-legacy-color-format', () => {
  it('passes clean oklch-only content', () => {
    const css = `
      @theme {
        --color-cream: oklch(0.9777 0.0228 95.80);
        --color-ink: oklch(0.1303 0.0049 67.20);
      }
    `;
    expect(scanForLegacyColors(css, 'tokens.css')).toEqual([]);
  });

  it('flags hex values', () => {
    const css = `
      @theme {
        --color-cream: #FEF8E2;
      }
    `;
    const results = scanForLegacyColors(css, 'tokens.css');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      line: expect.any(Number),
      value: '#FEF8E2',
      type: 'hex',
    });
  });

  it('flags rgba values', () => {
    const css = `
      .dark {
        --color-content-secondary: rgba(254, 248, 226, 0.85);
      }
    `;
    const results = scanForLegacyColors(css, 'dark.css');
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('rgba');
  });

  it('flags rgb values', () => {
    const css = `--color-ink: rgb(15, 14, 12);`;
    const results = scanForLegacyColors(css, 'tokens.css');
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('rgb');
  });

  it('flags hsl values', () => {
    const css = `--color-ink: hsl(30, 12%, 4%);`;
    const results = scanForLegacyColors(css, 'tokens.css');
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('hsl');
  });

  it('flags lab values', () => {
    const css = `--color-ink: lab(12% 1 1);`;
    const results = scanForLegacyColors(css, 'tokens.css');
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('lab');
  });

  it('flags color-mix values', () => {
    const css = `--color-hover-overlay: color-mix(in oklch, white 50%, black);`;
    const results = scanForLegacyColors(css, 'tokens.css');
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('color-mix');
  });

  it('ignores var() references', () => {
    const css = `
      --color-surface-primary: var(--color-cream);
      --color-edge-focus: var(--color-sun-yellow);
    `;
    expect(scanForLegacyColors(css, 'tokens.css')).toEqual([]);
  });

  it('ignores non-color values', () => {
    const css = `
      --radius-md: 0.5rem;
      --duration-fast: 100ms;
      --shadow-btn: 0 1px 0 0 var(--color-ink);
    `;
    expect(scanForLegacyColors(css, 'tokens.css')).toEqual([]);
  });

  it('ignores comments containing hex values', () => {
    const css = `
      --color-cream: oklch(0.9777 0.0228 95.80); /* was #FEF8E2 */
    `;
    expect(scanForLegacyColors(css, 'tokens.css')).toEqual([]);
  });

  it('ignores multi-line comments containing legacy values', () => {
    const css = `
      /*
       * Legacy reference:
       * --color-cream: #FEF8E2;
       * --color-edge-muted: rgba(15, 14, 12, 0.2);
       */
      --color-cream: oklch(0.9777 0.0228 95.80);
    `;
    expect(scanForLegacyColors(css, 'tokens.css')).toEqual([]);
  });

  it('reports multiple violations with correct line numbers', () => {
    const css = [
      '--color-cream: #FEF8E2;',
      '--color-ink: oklch(0.1303 0.0049 67.20);',
      '--color-edge-muted: rgba(15, 14, 12, 0.2);',
    ].join('\n');
    const results = scanForLegacyColors(css, 'tokens.css');
    expect(results).toHaveLength(2);
    expect(results[0].line).toBe(1);
    expect(results[1].line).toBe(3);
  });
});
```

**Step 2: Run the test to verify it fails**

```bash
cd /private/tmp/claude/dna-oklch
pnpm --dir packages/radiants exec vitest run eslint/__tests__/no-legacy-color-format.test.mjs
```

Expected: FAIL — module not found.

**Step 3: Commit**

```bash
git add packages/radiants/eslint/__tests__/no-legacy-color-format.test.mjs
git commit -m "test(radiants): add tests for no-legacy-color-format rule"
```

---

## Task 11: Implement CSS Token Enforcement Rule

**Files:**
- Create: `packages/radiants/eslint/lib/no-legacy-color-format.mjs`

**Step 1: Implement the scanner**

```js
// packages/radiants/eslint/lib/no-legacy-color-format.mjs

/**
 * Scans CSS content for live non-OKLCH color formats in token CSS files.
 * Comments are stripped before scanning so migration notes such as
 * "was #FEF8E2" do not fail the check.
 *
 * @param {string} css - Raw CSS file content
 * @param {string} filename - For error reporting
 * @returns {Array<{line: number, column: number, value: string, type: string, file: string}>}
 */
export function scanForLegacyColors(css, filename) {
  const violations = [];
  const commentStrippedCss = css.replace(/\/\*[\s\S]*?\*\//g, match =>
    match.replace(/[^\n]/g, ' ')
  );
  const lines = commentStrippedCss.split('\n');
  const patterns = [
    { type: 'hex', re: /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g },
    { type: 'rgba', re: /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/g },
    { type: 'rgb', re: /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g },
    { type: 'hsla', re: /hsla\(\s*[^)]+\)/g },
    { type: 'hsl', re: /hsl\(\s*[^)]+\)/g },
    { type: 'hwb', re: /hwb\(\s*[^)]+\)/g },
    { type: 'lab', re: /lab\(\s*[^)]+\)/g },
    { type: 'lch', re: /lch\(\s*[^)]+\)/g },
    { type: 'oklab', re: /oklab\(\s*[^)]+\)/g },
    { type: 'color-mix', re: /color-mix\(\s*[^)]+\)/g },
    { type: 'color', re: /color\(\s*[^)]+\)/g },
    { type: 'device-cmyk', re: /device-cmyk\(\s*[^)]+\)/g },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    if (line.trim() === '') continue;

    for (const { type, re } of patterns) {
      for (const match of line.matchAll(re)) {
        violations.push({
          line: lineNum,
          column: match.index + 1,
          value: match[0],
          type,
          file: filename,
        });
      }
    }
  }

  return violations;
}
```

**Step 2: Run tests to verify they pass**

```bash
cd /private/tmp/claude/dna-oklch
pnpm --dir packages/radiants exec vitest run eslint/__tests__/no-legacy-color-format.test.mjs
```

Expected: all tests pass, including the new `lab()`, `color-mix()`, and multi-line-comment cases.

**Step 3: Commit**

```bash
git add packages/radiants/eslint/lib/no-legacy-color-format.mjs
git commit -m "feat(radiants): implement no-legacy-color-format scanner"
```

---

## Task 12: Wire Enforcement Into Lint Commands

**Files:**
- Create: `scripts/lint-token-colors.mjs`
- Modify: root `package.json` (add script)
- Modify: `scripts/lint-design-system-staged.mjs`

**Step 1: Write the CLI runner**

```js
// scripts/lint-token-colors.mjs
import { readFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { scanForLegacyColors } from '../packages/radiants/eslint/lib/no-legacy-color-format.mjs';

const DEFAULT_TOKEN_FILES = [
  'packages/radiants/tokens.css',
  'packages/radiants/dark.css',
];
const targetFiles = process.argv.slice(2);
const files = targetFiles.length > 0 ? targetFiles : DEFAULT_TOKEN_FILES;

let totalViolations = 0;

for (const relPath of files) {
  const absPath = resolve(relPath);
  const css = readFileSync(absPath, 'utf-8');
  const violations = scanForLegacyColors(css, basename(relPath));

  for (const v of violations) {
    console.error(`${relPath}:${v.line}:${v.column} - Legacy ${v.type} color: ${v.value}`);
    totalViolations++;
  }
}

if (totalViolations > 0) {
  console.error(`\n✗ ${totalViolations} legacy color format(s) found. Use oklch() instead.`);
  process.exit(1);
} else {
  console.log('✓ All token CSS files use oklch color format.');
  process.exit(0);
}
```

**Step 2: Add npm script**

In root `package.json`, add to `"scripts"`:

```json
"lint:token-colors": "node scripts/lint-token-colors.mjs",
"lint:design-system": "pnpm exec eslint --config eslint.rdna.config.mjs 'packages/radiants/components/core/**/*.{ts,tsx}' 'apps/rad-os/**/*.{ts,tsx}' 'apps/radiator/**/*.{ts,tsx}' && pnpm lint:token-colors"
```

This makes the full design-system lint path enforce token CSS color format too.

**Step 3: Update `scripts/lint-design-system-staged.mjs` so pre-commit enforces token CSS too**

Add staged token-file support:
- detect staged `packages/radiants/tokens.css`
- detect staged `packages/radiants/dark.css`
- if either is staged, run `node scripts/lint-token-colors.mjs <staged-token-files...>`
- keep the existing staged TS/TSX ESLint behavior unchanged
- only print the "nothing to lint" message when neither staged TS/TSX files nor staged token CSS files are present

The existing `.githooks/pre-commit` hook already calls `pnpm lint:design-system:staged`, so updating this script is enough to enforce the new check at commit time.

**Step 4: Verify the rule passes on migrated files**

```bash
cd /private/tmp/claude/dna-oklch
pnpm lint:token-colors
```

Expected: `✓ All token CSS files use oklch color format.`

**Step 5: Verify the staged path also passes**

```bash
cd /private/tmp/claude/dna-oklch
pnpm lint:design-system
```

Expected: exit 0.

**Step 6: Verify the rule would catch regression without editing tracked files**

Create a temporary CSS file with a bad token value and run the scanner directly against it:

```bash
cd /private/tmp/claude/dna-oklch
cat >/tmp/token-colors-smoke.css <<'EOF'
@theme {
  --test-color: #FF0000;
}
EOF
node scripts/lint-token-colors.mjs /tmp/token-colors-smoke.css
```

Expected: exit code `1` with an error showing `#FF0000`.

**Step 7: Commit**

```bash
git add scripts/lint-token-colors.mjs scripts/lint-design-system-staged.mjs package.json
git commit -m "feat(radiants): enforce oklch token colors in lint paths"
```

---

## Task 13: Update DESIGN.md

**Files:**
- Modify: `packages/radiants/DESIGN.md` (lines 172–183, 205–213, and any other hex references in token tables)

**Step 1: Update Brand Palette table**

Replace the hex values in the `Value` column with oklch values. Keep the same token names and descriptions.

Before:
```markdown
| `--color-cream` | `#FEF8E2` | Primary warm neutral |
```

After:
```markdown
| `--color-cream` | `oklch(L C H)` | Primary warm neutral |
```

Do this for all 9 brand tokens in the table.

**Step 2: Update dark mode value references**

Line 209:
```markdown
| `--color-surface-tertiary` | sunset-fuzz | `#3D2E1A` |
```

Replace `#3D2E1A` with its oklch equivalent.

Line 211:
```markdown
| `--color-surface-muted` | cream | `rgba(252,225,132, 0.08)` |
```

Replace the rgba with oklch equivalent.

**Step 3: Add a note about color format convention**

After the Brand Palette table (around line 184), add:

```markdown
> **Color format:** All token values use [OKLCH](https://oklch.com/) — a perceptually uniform color space. The format is `oklch(lightness chroma hue)` or `oklch(lightness chroma hue / alpha)`. Legacy hex values are noted in `/* was #HEX */` comments in the CSS source during migration, and the token-color scanner intentionally ignores those comments.
```

**Step 4: Commit**

```bash
git add packages/radiants/DESIGN.md
git commit -m "docs(radiants): update DESIGN.md color values to oklch"
```

---

## Task 14: Update theme-spec.md

**Files:**
- Modify: `docs/theme-spec.md` (lines 276, 298–300)

**Step 1: Update illustrative token examples**

Line 276:
```
| Brand | `--color-{name}` | Raw palette | `--color-sun-yellow: #FCE184` |
```

Change to:
```
| Brand | `--color-{name}` | Raw palette | `--color-sun-yellow: oklch(L C H)` |
```

Lines 298–300 (CSS example):
```css
--color-sun-yellow: #FCE184;
--color-black: #0F0E0C;
--color-warm-cloud: #FEF8E2;
```

Change to:
```css
--color-sun-yellow: oklch(L C H);
--color-ink: oklch(L C H);
--color-cream: oklch(L C H);
```

Note: also update the deprecated token names (`--color-black` → `--color-ink`, `--color-warm-cloud` → `--color-cream`) since these were already renamed.

**Step 2: Leave the "bad example" lines unchanged**

Lines 613, 619 (`bg-[#FEF8E2]`, `shadow-[4px_4px_0_0_#000]`) are deliberately bad examples showing what NOT to do. They should stay as-is because they illustrate violations.

**Step 3: Commit**

```bash
git add docs/theme-spec.md
git commit -m "docs(spec): update theme-spec color examples to oklch"
```

---

## Task 15: Final Verification

**Files:** None (verification only)

**Step 1: Verify no remaining legacy colors in token files**

```bash
cd /private/tmp/claude/dna-oklch
pnpm lint:token-colors
```

Expected: `✓ All token CSS files use oklch color format.`

**Step 2: Verify ESLint baseline is clean**

```bash
pnpm lint:design-system 2>&1 | tail -10
```

Expected: exit 0.

**Step 3: Verify build**

```bash
pnpm --filter @rdna/rad-os build 2>&1 | tail -10
```

Expected: build succeeds.

**Step 4: Verify TypeScript**

```bash
pnpm tsc --noEmit -p apps/rad-os/tsconfig.json 2>&1 | tail -5
pnpm tsc --noEmit -p packages/radiants/tsconfig.json 2>&1 | tail -5
```

Expected: both exit 0.

**Step 5: Run all ESLint plugin tests**

```bash
pnpm --dir packages/radiants exec vitest run eslint/__tests__/
```

Expected: all tests pass.

**Step 6: Optional audit for migration comments vs live values**

```bash
rg -n '#[0-9A-Fa-f]{3,8}|rgba?\(' packages/radiants/tokens.css packages/radiants/dark.css
```

Expected: only migration comments such as `/* was #FEF8E2 */` may remain. There should be no live violations because `pnpm lint:token-colors` already passed.

**Step 7: Verify MockStatesPopover has no hex/rgba**

```bash
grep -n '#[0-9a-fA-F]\{3,8\}\|rgba\?' packages/radiants/components/core/MockStatesPopover/MockStatesPopover.tsx
```

Expected: zero results.

---

## Summary

| Task | What | Files | Commit message |
|------|------|-------|----------------|
| 1 | Conversion script | `ops/hex-to-oklch.mjs` | `chore: add hex-to-oklch conversion script` |
| 2 | Brand tokens → oklch | `tokens.css` | `feat: convert brand tokens to oklch` |
| 3 | Alpha tokens → oklch | `tokens.css` | `feat: convert alpha tokens to oklch` |
| 4 | Extract glow-cream tokens | `dark.css` | `feat: extract glow-cream-hover/active tokens` |
| 5 | Dark token overrides → oklch | `dark.css` | `feat: convert dark.css token overrides to oklch` |
| 6 | Box-shadow → glow refs | `dark.css` | `feat: replace dark.css box-shadow rgba with glow tokens` |
| 7 | Smoke test | — | (no commit) |
| 8 | MockStatesPopover fallbacks | `MockStatesPopover.tsx` | `feat: convert MockStatesPopover fallbacks to oklch` |
| 9 | OKLCH arbitrary-class autofix | `token-map.mjs`, `utils.mjs`, `no-hardcoded-colors.mjs`, tests | `feat: autofix arbitrary oklch classes to semantic tokens` |
| 10 | Enforcement tests | `no-legacy-color-format.test.mjs` | `test: add tests for no-legacy-color-format` |
| 11 | Enforcement impl | `no-legacy-color-format.mjs` | `feat: implement no-legacy-color-format scanner` |
| 12 | Wire lint enforcement | `lint-token-colors.mjs`, `lint-design-system-staged.mjs`, `package.json` | `feat: enforce oklch token colors in lint paths` |
| 13 | DESIGN.md | `DESIGN.md` | `docs: update DESIGN.md color values to oklch` |
| 14 | theme-spec.md | `theme-spec.md` | `docs: update theme-spec color examples to oklch` |
| 15 | Final verification | — | (no commit) |
