# Colors Tab Refactor — Fibonacci Spiral + Semantic Audit

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Replace the scroll-heavy Colors tab with a **Fibonacci spiral mosaic** of the brand + extended palette, sized by usage hierarchy. Clicking a tile opens a detail pane on the side that reuses the existing consumer info card. Semantic tokens move to a sibling sub-tab (layout unchanged, values audited against `tokens.css`/`dark.css`). Light/Dark hierarchy toggle remaps tile sizes to reflect each mode's actual usage pattern.

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA-logo-maker` on `feat/logo-asset-maker`.

**Architecture:** Extract colors-tab code into `apps/rad-os/components/apps/brand-assets/colors-tab/` (mirrors sibling `LogoMaker.tsx`/`brand-assets/` convention). **No schema change** — keep `lightHex`/`darkHex` as the display-primary format for designers. **Audit, don't migrate**: fix stale semantic values so the UI matches `tokens.css`. The mosaic uses CSS grid with explicit column/row placement following the Fibonacci rectangle. Two split-tone blocks pair related primitives vertically (cream+pure-white, ink+pure-black).

**Tech Stack:** React 19, TypeScript, Tailwind v4 (semantic tokens), `@rdna/radiants/components/core` (AppWindow, Button, Switch), reuses existing `SubTabNav` pattern.

**Brainstorm:** `archive/brainstorms-ideas-ops-audit-2026-04-25/docs/brainstorms/2026-04-18-colors-tab-refactor-brainstorm.md`

---

## Conventions & Gotchas

- **No RDNA violations.** Semantic tokens only. The three color-data constants (`BRAND_COLORS`, `EXTENDED_COLORS`, `SEMANTIC_CATEGORIES`) and the tile/detail inline `style={{ backgroundColor: color.hex }}` require the repo's exception comment: `// eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase owner:design expires:2027-01-01 issue:DNA-001`.
- **Pixel corners rules** (from `packages/radiants/CLAUDE.md`): `pixel-rounded-*` elements cannot have `border-*`, `overflow-hidden`, `shadow-*`, or `ring-*`. Use `outline-*` for selected-state rings and `pixel-shadow-*` for elevation.
- **AppWindow discipline:** use `AppWindow.Content layout="sidebar"` + two `AppWindow.Island`s. Follow the Logo Maker pattern (`apps/rad-os/components/apps/brand-assets/LogoMaker.tsx`).
- **Don't start a dev server.** One is already on :3004. Visual verification is the user's call.
- **Commit per task** with conventional messages.
- **Source of truth:** `packages/radiants/tokens.css` (light/primitives) and `packages/radiants/dark.css` (dark overrides). Any value displayed in the Semantic sub-tab must match what the CSS actually resolves to.
- **Hex stays primary** in the UI. OKLCH is shown as secondary info (already present for primitives). Semantic tokens display hex; no OKLCH migration of the data.
- **Keep the existing info components.** `BrandColorCard`, `ExtendedColorSwatch`, `SemanticTokenRow`, `SemanticCategoryCard`, `CopyableRow` all get **moved** into `colors-tab/` and reused — not replaced.

---

## Hierarchy & Layout Reference

### Usage hierarchy (tile sizes)

Fibonacci squares: **21, 13, 8, 5, 3, 2, 1** — largest → smallest.

**Light mode (brand identity priority):**
| Size | Color |
|---|---|
| 21 | sun-yellow |
| 13 | cream *(split with pure-white)* |
| 8 | ink *(split with pure-black)* |
| 5 | mint |
| 3 | sky-blue |
| 2 | sun-red |
| 1 | sunset-fuzz |

**Dark mode (actual usage):**
| Size | Color |
|---|---|
| 21 | ink *(split with pure-black)* — canvas dominates |
| 13 | sun-yellow — primary accent |
| 8 | cream *(split with pure-white)* — foreground, sparingly |
| 5 | mint |
| 3 | sky-blue |
| 2 | sun-red |
| 1 | sunset-fuzz |

### Split-tone blocks

Two blocks contain two primitives each, split **vertically** (left/right halves):
- **Cream block** → left half = `cream`, right half = `pure-white`
- **Ink block** → left half = `ink`, right half = `pure-black`

Each half is independently clickable and opens its own detail.

### Fibonacci grid geometry

Vertical orientation, 21 cols × 34 rows:

```
cols 1-21, rows 1-21       = SIZE_21  (21×21)
cols 1-13, rows 22-34      = SIZE_13  (13×13)   — split-capable
cols 14-21, rows 22-29     = SIZE_8   (8×8)     — split-capable
cols 17-21, rows 30-34     = SIZE_5   (5×5)
cols 14-16, rows 30-32     = SIZE_3   (3×3)
cols 14-15, rows 33-34     = SIZE_2   (2×2)
col  16,    rows 33-34     = SIZE_1   (1×2)     — fills residual, accepts 1×1 tile stretched
```

The `SIZE_1` cell is technically 1×2 (not pure Fibonacci) to fill the rectangle cleanly. Rendered tile stretches to fill.

### Data audit checklist (Task 2)

**Light mode stale values to fix:**
| Token | Current | Should be | Reason |
|---|---|---|---|
| `card.lightHex` | `#FFFCF3` | `#FFFFFF` | `--color-card: var(--color-pure-white)` |
| `sub.lightHex` | `#0F0E0C` | `rgba(15,14,12,0.85)` | `--color-sub: ink at 85%` |
| `link.lightHex` | `#95BAD2` | `#4A7FA7` | `--color-link: var(--color-sky-blue-dark)` — approx hex of `oklch(0.47 0.08 237)` |
| `danger.lightHex` (both entries) | `#FF6B63` | `#FF7F7F` | `--color-danger: var(--color-sun-red)` |

**Dark mode stale values to fix:**
| Token | Current | Should be | Reason |
|---|---|---|---|
| `inv.darkHex` | `#FEF8E2` | `#0F0E0C` | `--color-inv: var(--color-ink)` (unchanged in dark) |
| `card.darkHex` | `rgba(252,225,132,0.05)` | `#000000` | `--color-card: var(--color-pure-black)` |
| `depth.darkHex` | `rgba(252,225,132,0.08)` | `#221E18` | `--color-depth: oklch(0.22 0.0100 84.59)` — approx hex |
| `head.darkHex` | `#FFFCF3` | `#FFFFFF` | `--color-head: var(--color-pure-white)` |
| `sub.darkHex` | `#FEF8E2` | `rgba(254,248,226,0.85)` | `--color-sub: cream at 85%` |
| `flip.darkHex` | `#0F0E0C` | `#FEF8E2` | `--color-flip: var(--color-cream)` (unchanged) |
| `accent-inv.darkHex` | `#FEF8E2` | `#0F0E0C` | `--color-accent-inv: var(--color-ink)` (unchanged) |
| `danger.darkHex` (both entries) | `#FF6B63` | `#FF7F7F` | `--color-danger: var(--color-sun-red)` |

All other values match and stay as-is.

---

## Phase 1: Scaffolding + Data

### Task 1: Create `colors-tab/` module directory + empty shell

**Files:**
- Create: `apps/rad-os/components/apps/brand-assets/colors-tab/index.ts`
- Create: `apps/rad-os/components/apps/brand-assets/colors-tab/types.ts`
- Create: `apps/rad-os/components/apps/brand-assets/colors-tab/ColorsTab.tsx`

**Step 1:** Write `types.ts`:

```ts
export interface BrandColor {
  name: string;
  hex: string;
  oklch: string;
  role: string;
  description: string;
  cssVar: string;
  tailwind: string;
}

export interface ExtendedColor {
  name: string;
  hex: string;
  oklch: string;
  cssVar: string;
  tailwind: string;
  role: string;
}

export interface SemanticToken {
  name: string;
  cssVar: string;
  tailwind: string;
  lightHex: string;
  darkHex: string;
  note: string;
}

export interface SemanticCategory {
  name: string;
  description: string;
  tokens: SemanticToken[];
}

/** Which primitive gets which Fibonacci size slot, per mode. */
export type FibSlot = 21 | 13 | 8 | 5 | 3 | 2 | 1;

/** Entry in the spiral — single or paired tones. */
export interface FibTile {
  slot: FibSlot;
  tones: readonly (BrandColor | ExtendedColor)[];  // 1 or 2 entries; 2 = split block
}

export type HierarchyMode = 'light' | 'dark';

export type ColorsSubTab = 'palette' | 'semantic';
```

**Step 2:** Write `ColorsTab.tsx` stub:

```tsx
'use client';

export function ColorsTab() {
  return <div className="p-5 text-sm text-mute">Colors tab refactor — in progress.</div>;
}
```

**Step 3:** Write `index.ts`:

```ts
export { ColorsTab } from './ColorsTab';
export type {
  BrandColor,
  ExtendedColor,
  SemanticToken,
  SemanticCategory,
  FibSlot,
  FibTile,
  HierarchyMode,
  ColorsSubTab,
} from './types';
```

**Step 4:** Verify:

```bash
cd /Users/rivermassey/Desktop/dev/DNA-logo-maker/apps/rad-os && pnpm exec tsc --noEmit 2>&1 | tail -5
```

Expected: clean.

**Step 5:** Commit:

```bash
cd /Users/rivermassey/Desktop/dev/DNA-logo-maker && git add apps/rad-os/components/apps/brand-assets/colors-tab/
git commit -m "chore(colors-tab): scaffold module directory"
```

---

### Task 2: Move data + audit semantic values

Moves the three color constants into `colors-tab/data.ts`, adds `pure-white` + `pure-black` as brand primitives (so they can appear as clickable halves in split-tone blocks), and fixes every stale value against `tokens.css`/`dark.css` per the audit checklist above.

**Files:**
- Create: `apps/rad-os/components/apps/brand-assets/colors-tab/data.ts`
- Modify: `apps/rad-os/components/apps/BrandAssetsApp.tsx` (remove the three `const` exports + the `SemanticToken`/`SemanticCategory` interfaces; import from new location)

**Step 1:** Write `data.ts`. Copy `BRAND_COLORS` and `EXTENDED_COLORS` verbatim from `BrandAssetsApp.tsx`, **add two new primitive entries** (`pure-white`, `pure-black`), and rewrite `SEMANTIC_CATEGORIES` with the audit fixes from the table above. Keep `pure-white`/`pure-black` as `BrandColor` shape (they have a description/role so the detail pane renders correctly).

```ts
// apps/rad-os/components/apps/brand-assets/colors-tab/data.ts
import type { BrandColor, ExtendedColor, SemanticCategory } from './types';

export const BRAND_COLORS: readonly BrandColor[] = [
  {
    name: 'Sun Yellow', hex: '#FCE184', oklch: 'oklch(0.9126 0.1170 93.68)', role: 'Primary Accent',
    description: 'Actions, highlights, focus states, and energy. The signature color of Radiants.',
    cssVar: '--color-sun-yellow', tailwind: 'sun-yellow',
  },
  {
    name: 'Cream', hex: '#FEF8E2', oklch: 'oklch(0.9780 0.0295 94.34)', role: 'Canvas',
    description: 'Surfaces, backgrounds, and the warm foundation of all layouts.',
    cssVar: '--color-cream', tailwind: 'cream',
  },
  {
    name: 'Ink', hex: '#0F0E0C', oklch: 'oklch(0.1641 0.0044 84.59)', role: 'Anchor',
    description: 'Typography, borders, depth. Grounds the visual hierarchy.',
    cssVar: '--color-ink', tailwind: 'ink',
  },
  {
    name: 'Pure White', hex: '#FFFFFF', oklch: 'oklch(1.0000 0.0000 0)', role: 'Highlight',
    description: 'Absolute white. Reserved for elevated card surfaces and brightest pixel highlights.',
    cssVar: '--color-pure-white', tailwind: 'pure-white',
  },
  {
    name: 'Pure Black', hex: '#000000', oklch: 'oklch(0.0000 0.0000 0)', role: 'Depth',
    description: 'Absolute black. Reserved for deepest Moon Mode elevations (darker than ink).',
    cssVar: '--color-pure-black', tailwind: 'pure-black',
  },
];

export const EXTENDED_COLORS: readonly ExtendedColor[] = [
  { name: 'Sky Blue',    hex: '#95BAD2', oklch: 'oklch(0.7701 0.0527 236.81)', cssVar: '--color-sky-blue',    tailwind: 'sky-blue',    role: 'Links & Info' },
  { name: 'Sunset Fuzz', hex: '#FCC383', oklch: 'oklch(0.8546 0.1039 68.93)',  cssVar: '--color-sunset-fuzz', tailwind: 'sunset-fuzz', role: 'Warm CTA' },
  { name: 'Sun Red',     hex: '#FF7F7F', oklch: 'oklch(0.7429 0.1568 21.43)',  cssVar: '--color-sun-red',     tailwind: 'sun-red',     role: 'Error & Danger' },
  { name: 'Mint',        hex: '#CEF5CA', oklch: 'oklch(0.9312 0.0702 142.51)', cssVar: '--color-mint',        tailwind: 'mint',        role: 'Success' },
];

/**
 * Audited against packages/radiants/tokens.css (light) and packages/radiants/dark.css (dark).
 * All values reflect what the CSS actually resolves to at runtime.
 */
export const SEMANTIC_CATEGORIES: readonly SemanticCategory[] = [
  {
    name: 'Surface',
    description: 'Background colors for containers and sections',
    tokens: [
      { name: 'primary',   cssVar: '--color-page',   tailwind: 'page',   lightHex: '#FEF8E2',                 darkHex: '#0F0E0C',                 note: 'Main page background' },
      { name: 'secondary', cssVar: '--color-inv',    tailwind: 'inv',    lightHex: '#0F0E0C',                 darkHex: '#0F0E0C',                 note: 'Inverted sections' },
      { name: 'tertiary',  cssVar: '--color-tinted', tailwind: 'tinted', lightHex: '#FCC383',                 darkHex: '#3D2E1A',                 note: 'Accent containers' },
      { name: 'elevated',  cssVar: '--color-card',   tailwind: 'card',   lightHex: '#FFFFFF',                 darkHex: '#000000',                 note: 'Cards, raised panels' },
      { name: 'muted',     cssVar: '--color-depth',  tailwind: 'depth',  lightHex: '#FEF8E2',                 darkHex: '#221E18',                 note: 'Subtle backgrounds' },
    ],
  },
  {
    name: 'Content',
    description: 'Text and foreground colors',
    tokens: [
      { name: 'primary',   cssVar: '--color-main', tailwind: 'main', lightHex: '#0F0E0C',                 darkHex: '#FEF8E2',                 note: 'Body text' },
      { name: 'heading',   cssVar: '--color-head', tailwind: 'head', lightHex: '#0F0E0C',                 darkHex: '#FFFFFF',                 note: 'Headings' },
      { name: 'secondary', cssVar: '--color-sub',  tailwind: 'sub',  lightHex: 'rgba(15,14,12,0.85)',     darkHex: 'rgba(254,248,226,0.85)',   note: 'Supporting text' },
      { name: 'inverted',  cssVar: '--color-flip', tailwind: 'flip', lightHex: '#FEF8E2',                 darkHex: '#FEF8E2',                 note: 'Text on dark bg' },
      { name: 'muted',     cssVar: '--color-mute', tailwind: 'mute', lightHex: 'rgba(15,14,12,0.6)',      darkHex: 'rgba(254,248,226,0.6)',   note: 'Captions, hints' },
      { name: 'link',      cssVar: '--color-link', tailwind: 'link', lightHex: '#4A7FA7',                 darkHex: '#95BAD2',                 note: 'Hyperlinks' },
    ],
  },
  {
    name: 'Edge',
    description: 'Borders, outlines, and focus indicators',
    tokens: [
      { name: 'primary', cssVar: '--color-line',       tailwind: 'line',       lightHex: '#0F0E0C',             darkHex: 'rgba(254,248,226,0.2)',   note: 'Default borders' },
      { name: 'muted',   cssVar: '--color-rule',       tailwind: 'rule',       lightHex: 'rgba(15,14,12,0.2)', darkHex: 'rgba(254,248,226,0.12)',  note: 'Subtle dividers' },
      { name: 'hover',   cssVar: '--color-line-hover', tailwind: 'line-hover', lightHex: 'rgba(15,14,12,0.3)', darkHex: 'rgba(254,248,226,0.35)',  note: 'Hover state borders' },
      { name: 'focus',   cssVar: '--color-focus',      tailwind: 'focus',      lightHex: '#FCE184',             darkHex: '#FCE184',                 note: 'Focus rings' },
    ],
  },
  {
    name: 'Action',
    description: 'Interactive element colors for buttons and controls',
    tokens: [
      { name: 'primary',     cssVar: '--color-accent',      tailwind: 'accent',      lightHex: '#FCE184', darkHex: '#FCE184', note: 'Primary buttons' },
      { name: 'secondary',   cssVar: '--color-accent-inv',  tailwind: 'accent-inv',  lightHex: '#0F0E0C', darkHex: '#0F0E0C', note: 'Secondary buttons' },
      { name: 'destructive', cssVar: '--color-danger',      tailwind: 'danger',      lightHex: '#FF7F7F', darkHex: '#FF7F7F', note: 'Delete, remove' },
      { name: 'accent',      cssVar: '--color-accent-soft', tailwind: 'accent-soft', lightHex: '#FCC383', darkHex: '#FCC383', note: 'Warm highlight CTA' },
    ],
  },
  {
    name: 'Status',
    description: 'Feedback and state indicator colors',
    tokens: [
      { name: 'success', cssVar: '--color-success', tailwind: 'success', lightHex: '#CEF5CA', darkHex: '#CEF5CA', note: 'Success states' },
      { name: 'warning', cssVar: '--color-warning', tailwind: 'warning', lightHex: '#FCE184', darkHex: '#FCE184', note: 'Warnings, caution' },
      { name: 'error',   cssVar: '--color-danger',  tailwind: 'danger',  lightHex: '#FF7F7F', darkHex: '#FF7F7F', note: 'Errors, failures' },
      { name: 'info',    cssVar: '--color-link',    tailwind: 'link',    lightHex: '#4A7FA7', darkHex: '#95BAD2', note: 'Informational' },
    ],
  },
];
```

**Step 2:** Delete the three `const` exports (`BRAND_COLORS`, `EXTENDED_COLORS`, `SEMANTIC_CATEGORIES`) and the two interfaces (`SemanticToken`, `SemanticCategory`) from `BrandAssetsApp.tsx`. Add an import at the top:

```tsx
import {
  BRAND_COLORS,
  EXTENDED_COLORS,
  SEMANTIC_CATEGORIES,
} from './brand-assets/colors-tab/data';
import type { SemanticToken, SemanticCategory } from './brand-assets/colors-tab/types';
```

Update `BrandColorCard` / `ExtendedColorSwatch` type annotations to use the named types (`BrandColor`, `ExtendedColor`) rather than `typeof BRAND_COLORS[0]`.

The existing `BRAND_COLORS` usage on the Colors tab will now include pure-white + pure-black as two extra brand cards. That's acceptable transitional state — the whole scroll layout gets replaced in Task 7, so the duplicate Cream/Pure-White visual during Phase 1-3 is temporary.

**Step 3:** Verify:

```bash
cd /Users/rivermassey/Desktop/dev/DNA-logo-maker/apps/rad-os && pnpm exec tsc --noEmit 2>&1 | tail -5
cd /Users/rivermassey/Desktop/dev/DNA-logo-maker && pnpm lint:design-system 2>&1 | tail -10
```

Both clean.

**Step 4:** Commit:

```bash
git add apps/rad-os/components/apps/brand-assets/colors-tab/ apps/rad-os/components/apps/BrandAssetsApp.tsx
git commit -m "refactor(colors-tab): extract data, audit semantic values against tokens.css"
```

---

## Phase 2: UI Components

### Task 3: `FibonacciMosaic` — spiral tile grid + split-tone blocks

**Files:**
- Create: `apps/rad-os/components/apps/brand-assets/colors-tab/FibonacciMosaic.tsx`

**Step 1:** Define the mosaic. Single component, light/dark hierarchy hard-coded, split-block pairings declared inline. Uses CSS grid with explicit `grid-column` / `grid-row` placement for each Fib square.

```tsx
'use client';

import type { BrandColor, ExtendedColor, FibSlot, FibTile, HierarchyMode } from './types';
import { BRAND_COLORS, EXTENDED_COLORS } from './data';

interface FibonacciMosaicProps {
  mode: HierarchyMode;
  selectedCssVar: string;
  onSelect: (color: BrandColor | ExtendedColor) => void;
}

// Helpers to look up a primitive by cssVar without exporting yet-another index.
const byVar = (cssVar: string) =>
  [...BRAND_COLORS, ...EXTENDED_COLORS].find((c) => c.cssVar === cssVar)!;

// Light mode: brand identity order. Dark mode: actual usage (ink dominates).
const HIERARCHY: Record<HierarchyMode, readonly FibTile[]> = {
  light: [
    { slot: 21, tones: [byVar('--color-sun-yellow')] },
    { slot: 13, tones: [byVar('--color-cream'), byVar('--color-pure-white')] },
    { slot: 8,  tones: [byVar('--color-ink'),   byVar('--color-pure-black')] },
    { slot: 5,  tones: [byVar('--color-mint')] },
    { slot: 3,  tones: [byVar('--color-sky-blue')] },
    { slot: 2,  tones: [byVar('--color-sun-red')] },
    { slot: 1,  tones: [byVar('--color-sunset-fuzz')] },
  ],
  dark: [
    { slot: 21, tones: [byVar('--color-ink'),   byVar('--color-pure-black')] },
    { slot: 13, tones: [byVar('--color-sun-yellow')] },
    { slot: 8,  tones: [byVar('--color-cream'), byVar('--color-pure-white')] },
    { slot: 5,  tones: [byVar('--color-mint')] },
    { slot: 3,  tones: [byVar('--color-sky-blue')] },
    { slot: 2,  tones: [byVar('--color-sun-red')] },
    { slot: 1,  tones: [byVar('--color-sunset-fuzz')] },
  ],
};

// Grid placement per Fib slot — vertical 21×34 rectangle.
// Format: [colStart, colEnd, rowStart, rowEnd] (end-exclusive CSS grid values).
const PLACEMENT: Record<FibSlot, [number, number, number, number]> = {
  21: [1, 22,  1, 22],
  13: [1, 14, 22, 35],
  8:  [14, 22, 22, 30],
  5:  [17, 22, 30, 35],
  3:  [14, 17, 30, 33],
  2:  [14, 16, 33, 35],
  1:  [16, 17, 33, 35],
};

// Light-toned hexes need dark text captions; dark tones need light.
const LIGHT_TONES = new Set([
  '#FEF8E2', '#FCE184', '#CEF5CA', '#FCC383', '#95BAD2', '#FF7F7F', '#FFFFFF',
]);

export function FibonacciMosaic({ mode, selectedCssVar, onSelect }: FibonacciMosaicProps) {
  const tiles = HIERARCHY[mode];

  return (
    <div
      className="grid w-full aspect-[21/34] gap-1"
      style={{
        gridTemplateColumns: 'repeat(21, minmax(0, 1fr))',
        gridTemplateRows: 'repeat(34, minmax(0, 1fr))',
      }}
    >
      {tiles.map(({ slot, tones }) => {
        const [colStart, colEnd, rowStart, rowEnd] = PLACEMENT[slot];
        return (
          <div
            key={slot}
            className="flex"
            style={{
              gridColumn: `${colStart} / ${colEnd}`,
              gridRow: `${rowStart} / ${rowEnd}`,
            }}
          >
            {tones.map((tone, idx) => (
              <MosaicTile
                key={tone.cssVar}
                color={tone}
                slot={slot}
                isSplit={tones.length > 1}
                splitPosition={tones.length > 1 ? (idx === 0 ? 'left' : 'right') : 'full'}
                selected={tone.cssVar === selectedCssVar}
                onSelect={onSelect}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

interface MosaicTileProps {
  color: BrandColor | ExtendedColor;
  slot: FibSlot;
  isSplit: boolean;
  splitPosition: 'left' | 'right' | 'full';
  selected: boolean;
  onSelect: (color: BrandColor | ExtendedColor) => void;
}

function MosaicTile({ color, slot, isSplit, splitPosition, selected, onSelect }: MosaicTileProps) {
  const isLight = LIGHT_TONES.has(color.hex);
  const showCaption = slot >= 5; // tiles 3/2/1 too small for readable text
  const showRole = slot >= 8;

  return (
    // eslint-disable-next-line rdna/prefer-rdna-components -- reason:tile-button-chrome-too-heavy owner:design expires:2027-01-01 issue:DNA-001
    <button
      type="button"
      onClick={() => onSelect(color)}
      aria-pressed={selected}
      aria-label={color.name}
      title={`${color.name} — ${color.role}`}
      className={`pixel-rounded-sm flex-1 cursor-pointer relative ${selected ? 'outline-2 outline-accent outline-offset-2' : ''} ${isSplit && splitPosition === 'left' ? 'mr-0.5' : ''}`}
    >
      {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase owner:design expires:2027-01-01 issue:DNA-001 */}
      <div
        className={`w-full h-full flex flex-col ${showCaption ? 'justify-between p-2' : ''}`}
        style={{ backgroundColor: color.hex }}
      >
        {showCaption && (
          <>
            {showRole && (
              /* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase owner:design expires:2027-01-01 issue:DNA-001 */
              <span className={`font-joystix text-xs uppercase tracking-tight self-start px-1 py-0.5 ${isLight ? 'bg-ink text-cream' : 'bg-cream text-ink'}`}>
                {color.role}
              </span>
            )}
            {/* eslint-disable-next-line rdna/no-hardcoded-colors -- reason:brand-showcase owner:design expires:2027-01-01 issue:DNA-001 */}
            <span className={`font-joystix text-sm leading-none ${isLight ? 'text-ink' : 'text-cream'}`}>
              {color.name}
            </span>
          </>
        )}
      </div>
    </button>
  );
}
```

**Step 2:** Verify:

```bash
cd /Users/rivermassey/Desktop/dev/DNA-logo-maker/apps/rad-os && pnpm exec tsc --noEmit 2>&1 | tail -5
cd /Users/rivermassey/Desktop/dev/DNA-logo-maker && pnpm lint:design-system 2>&1 | tail -10
```

Clean.

**Step 3:** Commit:

```bash
git add apps/rad-os/components/apps/brand-assets/colors-tab/FibonacciMosaic.tsx
git commit -m "feat(colors-tab): fibonacci spiral mosaic with split-tone blocks"
```

---

### Task 4: Move + reuse `BrandColorCard` / `ExtendedColorSwatch` / `CopyableRow` for the detail pane

Rather than rewriting the detail info, move the existing three components into `colors-tab/` and wrap them in a thin `<ColorDetail>` dispatcher.

**Files:**
- Create: `apps/rad-os/components/apps/brand-assets/colors-tab/ColorCards.tsx` (move from `BrandAssetsApp.tsx`)
- Create: `apps/rad-os/components/apps/brand-assets/colors-tab/ColorDetail.tsx`
- Modify: `apps/rad-os/components/apps/BrandAssetsApp.tsx` (delete the moved functions, add imports)

**Step 1:** Create `ColorCards.tsx`. Copy `BrandColorCard`, `ExtendedColorSwatch`, `CopyableRow` from `BrandAssetsApp.tsx:161-248, 330-351` verbatim. Update imports at top:

```tsx
'use client';
import { useState } from 'react';
import type { BrandColor, ExtendedColor } from './types';

// BrandColorCard, ExtendedColorSwatch, CopyableRow functions here, verbatim from BrandAssetsApp.tsx.
// Update type annotations: `typeof BRAND_COLORS[0]` → `BrandColor`, `typeof EXTENDED_COLORS[0]` → `ExtendedColor`.
// The `index` prop now becomes optional since the detail pane doesn't number a single card.

export function BrandColorCard({ color, index = 0 }: { color: BrandColor; index?: number }) { /* ... */ }
export function ExtendedColorSwatch({ color, index = 0 }: { color: ExtendedColor; index?: number }) { /* ... */ }
export function CopyableRow({ label, value, displayValue }: { label: string; value: string; displayValue?: string }) { /* ... */ }
```

**Step 2:** Write `ColorDetail.tsx`:

```tsx
'use client';

import type { BrandColor, ExtendedColor } from './types';
import { BRAND_COLORS } from './data';
import { BrandColorCard, ExtendedColorSwatch } from './ColorCards';

interface ColorDetailProps {
  color: BrandColor | ExtendedColor;
}

export function ColorDetail({ color }: ColorDetailProps) {
  // Brand primitives get the fuller card (has description); extended get the compact swatch.
  const isBrand = BRAND_COLORS.some((c) => c.cssVar === color.cssVar);

  return isBrand ? (
    <BrandColorCard color={color as BrandColor} />
  ) : (
    <ExtendedColorSwatch color={color as ExtendedColor} />
  );
}
```

**Step 3:** Delete `BrandColorCard`, `ExtendedColorSwatch`, `CopyableRow` from `BrandAssetsApp.tsx`. The file will now have broken references at the existing Colors-tab render (line 467+ area) — that's fine; Task 7 rewrites that branch entirely. **For Phase 1-3 transitional state**, temporarily import the moved components from `colors-tab/ColorCards` so `BrandAssetsApp.tsx` still compiles:

```tsx
import { BrandColorCard, ExtendedColorSwatch } from './brand-assets/colors-tab/ColorCards';
```

`SemanticCategoryCard` and `SemanticTokenRow` stay in `BrandAssetsApp.tsx` for now; they'll move in Task 5.

**Step 4:** Verify:

```bash
cd /Users/rivermassey/Desktop/dev/DNA-logo-maker/apps/rad-os && pnpm exec tsc --noEmit 2>&1 | tail -5
cd /Users/rivermassey/Desktop/dev/DNA-logo-maker && pnpm lint:design-system 2>&1 | tail -10
```

Clean.

**Step 5:** Commit:

```bash
git add apps/rad-os/components/apps/brand-assets/colors-tab/ apps/rad-os/components/apps/BrandAssetsApp.tsx
git commit -m "refactor(colors-tab): move color card components into module + detail wrapper"
```

---

### Task 5: Move `SemanticCategoryCard` + `SemanticTokenRow`, build `SemanticView`

Mirror of Task 4 for the semantic side.

**Files:**
- Modify: `apps/rad-os/components/apps/brand-assets/colors-tab/ColorCards.tsx` (add `SemanticCategoryCard`, `SemanticTokenRow` exports)
- Create: `apps/rad-os/components/apps/brand-assets/colors-tab/SemanticView.tsx`
- Modify: `apps/rad-os/components/apps/BrandAssetsApp.tsx` (delete moved functions, add import)

**Step 1:** Move `SemanticTokenRow` (lines ~250-295) and `SemanticCategoryCard` (lines ~297-328) from `BrandAssetsApp.tsx` into `ColorCards.tsx`. Update type imports to use `SemanticToken` / `SemanticCategory` from `./types`. Export both.

**Step 2:** Write `SemanticView.tsx`:

```tsx
'use client';

import { SEMANTIC_CATEGORIES } from './data';
import { SemanticCategoryCard } from './ColorCards';

export function SemanticView() {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-end justify-between border-b border-rule pb-3 gap-4">
        <div>
          <h2 className="text-main leading-tight">Semantic Tokens</h2>
          <p className="text-sm text-mute mt-1">Purpose-based tokens that flip in light/dark mode. Audited against <code className="font-mono text-xs">tokens.css</code>.</p>
        </div>
        <span className="font-mono text-xs text-mute shrink-0">tokens.css / dark.css</span>
      </div>
      <div className="space-y-3">
        {SEMANTIC_CATEGORIES.map((category, i) => (
          <SemanticCategoryCard key={category.name} category={category} index={i} />
        ))}
      </div>
    </div>
  );
}
```

**Step 3:** Delete `SemanticTokenRow` and `SemanticCategoryCard` from `BrandAssetsApp.tsx`. Transitional imports:

```tsx
import { SemanticCategoryCard } from './brand-assets/colors-tab/ColorCards';
```

**Step 4:** Verify:

```bash
cd /Users/rivermassey/Desktop/dev/DNA-logo-maker/apps/rad-os && pnpm exec tsc --noEmit 2>&1 | tail -5
cd /Users/rivermassey/Desktop/dev/DNA-logo-maker && pnpm lint:design-system 2>&1 | tail -10
```

Clean.

**Step 5:** Commit:

```bash
git add apps/rad-os/components/apps/brand-assets/colors-tab/ apps/rad-os/components/apps/BrandAssetsApp.tsx
git commit -m "refactor(colors-tab): move semantic card components + semantic view wrapper"
```

---

## Phase 3: Composition + Integration

### Task 6: `ColorsTab` — sub-tab nav + palette view + semantic view

Composes the module into its public entry point. Sub-tab switches between Palette (Fibonacci + detail) and Semantic (existing card stack). Light/Dark hierarchy toggle lives at the top of the Palette sub-tab only.

**Files:**
- Modify: `apps/rad-os/components/apps/brand-assets/colors-tab/ColorsTab.tsx`
- Create: `apps/rad-os/components/apps/brand-assets/colors-tab/ColorsSubNav.tsx`

**Step 1:** `ColorsSubNav.tsx`:

```tsx
'use client';
import { Button } from '@rdna/radiants/components/core';
import type { ColorsSubTab } from './types';

interface ColorsSubNavProps {
  active: ColorsSubTab;
  onChange: (tab: ColorsSubTab) => void;
}

const TABS: { value: ColorsSubTab; label: string }[] = [
  { value: 'palette',  label: 'Palette' },
  { value: 'semantic', label: 'Semantic' },
];

export function ColorsSubNav({ active, onChange }: ColorsSubNavProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {TABS.map(({ value, label }) => (
        <Button key={value} quiet={active !== value} size="sm" compact onClick={() => onChange(value)}>
          {label}
        </Button>
      ))}
    </div>
  );
}
```

**Step 2:** Replace `ColorsTab.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { AppWindow, Switch } from '@rdna/radiants/components/core';
import { BRAND_COLORS } from './data';
import { FibonacciMosaic } from './FibonacciMosaic';
import { ColorDetail } from './ColorDetail';
import { SemanticView } from './SemanticView';
import { ColorsSubNav } from './ColorsSubNav';
import type { BrandColor, ExtendedColor, ColorsSubTab, HierarchyMode } from './types';

export function ColorsTab() {
  const [subTab, setSubTab] = useState<ColorsSubTab>('palette');
  const [mode, setMode] = useState<HierarchyMode>('light');
  // Default selection = whichever primitive has the slot-21 tile in the current mode.
  const [selected, setSelected] = useState<BrandColor | ExtendedColor>(BRAND_COLORS[0]); // sun-yellow

  if (subTab === 'semantic') {
    return (
      <AppWindow.Content>
        <AppWindow.Island corners="pixel" padding="none" className="@container">
          <div className="shrink-0 px-3 py-2 border-b border-ink bg-card">
            <ColorsSubNav active={subTab} onChange={setSubTab} />
          </div>
          <SemanticView />
        </AppWindow.Island>
      </AppWindow.Content>
    );
  }

  return (
    <AppWindow.Content layout="sidebar">
      {/* Mosaic — flex-1 main */}
      <AppWindow.Island corners="pixel" padding="none" className="flex-1">
        <div className="shrink-0 px-3 py-2 border-b border-ink bg-card flex items-center justify-between gap-3">
          <ColorsSubNav active={subTab} onChange={setSubTab} />
          <div className="flex items-center gap-2">
            <span className={`font-heading text-xs uppercase tracking-tight ${mode === 'light' ? 'text-main' : 'text-mute'}`}>Light</span>
            <Switch checked={mode === 'dark'} onChange={(c) => setMode(c ? 'dark' : 'light')} size="sm" />
            <span className={`font-heading text-xs uppercase tracking-tight ${mode === 'dark' ? 'text-main' : 'text-mute'}`}>Dark</span>
          </div>
        </div>
        <div className="p-4 flex-1 min-h-0 overflow-auto">
          <FibonacciMosaic
            mode={mode}
            selectedCssVar={selected.cssVar}
            onSelect={setSelected}
          />
        </div>
      </AppWindow.Island>

      {/* Detail — fixed sidebar */}
      <AppWindow.Island width="w-[22rem]" corners="pixel" padding="md">
        <ColorDetail color={selected} />
      </AppWindow.Island>
    </AppWindow.Content>
  );
}
```

**Step 3:** Update `index.ts` to export `ColorsSubNav` if needed (probably not — internal only).

**Step 4:** Verify:

```bash
cd /Users/rivermassey/Desktop/dev/DNA-logo-maker/apps/rad-os && pnpm exec tsc --noEmit 2>&1 | tail -5
cd /Users/rivermassey/Desktop/dev/DNA-logo-maker && pnpm lint:design-system 2>&1 | tail -10
```

Clean.

**Step 5:** Commit:

```bash
git add apps/rad-os/components/apps/brand-assets/colors-tab/
git commit -m "feat(colors-tab): sub-tab nav, palette/semantic views, light-dark hierarchy toggle"
```

---

### Task 7: Swap old render branch in `BrandAssetsApp.tsx`

**Files:**
- Modify: `apps/rad-os/components/apps/BrandAssetsApp.tsx`

**Step 1:** Add import at top:

```tsx
import { ColorsTab } from './brand-assets/colors-tab';
```

**Step 2:** Move `colors` into its own ternary branch (like `components` and `pixel`), since `ColorsTab` renders its own `AppWindow.Content` + `Island`s and should not be wrapped by the shared outer island used by `logos` / `fonts` / `ai-gen`.

Around line 451 (`activeTab === 'pixel' ? ...`), add:

```tsx
) : activeTab === 'colors' ? (
  <ColorsTab />
```

Then delete the `{activeTab === 'colors' && (...)}` block inside the shared else-branch (lines ~467-518). That entire JSX section with brand palette / extended palette / semantic tokens sections disappears.

**Step 3:** Clean up transitional imports. `BrandColorCard`, `ExtendedColorSwatch`, `SemanticCategoryCard` are no longer referenced in `BrandAssetsApp.tsx` — remove the `./brand-assets/colors-tab/ColorCards` import added during Phase 2. Verify with:

```bash
grep -n "BrandColorCard\|ExtendedColorSwatch\|SemanticCategoryCard\|SemanticTokenRow\|CopyableRow" /Users/rivermassey/Desktop/dev/DNA-logo-maker/apps/rad-os/components/apps/BrandAssetsApp.tsx
```

Expected: no matches. If any remain, delete those references.

Also: `SemanticToken` and `SemanticCategory` type imports from `./brand-assets/colors-tab/types` are unused now — remove.

**Step 4:** Verify:

```bash
cd /Users/rivermassey/Desktop/dev/DNA-logo-maker/apps/rad-os && pnpm exec tsc --noEmit 2>&1 | tail -10
cd /Users/rivermassey/Desktop/dev/DNA-logo-maker && pnpm lint:design-system 2>&1 | tail -15
```

Both clean. Any previously existing warnings on files we didn't touch are out of scope.

**Step 5:** Commit:

```bash
git add apps/rad-os/components/apps/BrandAssetsApp.tsx
git commit -m "feat(brand-assets): swap colors tab to fibonacci mosaic layout"
```

---

## Phase 4: Quality Pass

### Task 8: Final lint + type-check + visual verification

**Step 1:** Full verification:

```bash
cd /Users/rivermassey/Desktop/dev/DNA-logo-maker && pnpm lint:design-system 2>&1 | tail -15
cd /Users/rivermassey/Desktop/dev/DNA-logo-maker/apps/rad-os && pnpm exec tsc --noEmit 2>&1 | tail -5
cd /Users/rivermassey/Desktop/dev/DNA-logo-maker/apps/rad-os && pnpm exec vitest run 2>&1 | tail -10
cd /Users/rivermassey/Desktop/dev/DNA-logo-maker && pnpm lint 2>&1 | tail -10
```

Each must be clean (no new errors or warnings; pre-existing noise on unrelated files stays out of scope).

**Step 2:** Dead-code audit:

```bash
grep -rn "BRAND_COLORS\|EXTENDED_COLORS\|SEMANTIC_CATEGORIES" /Users/rivermassey/Desktop/dev/DNA-logo-maker/apps/rad-os 2>&1 | head -20
```

All references should be inside `colors-tab/`.

**Step 3:** Visual verification (user-facing). Dev server running on `:3004`. Open BrandAssets → Color:

- **Palette sub-tab** shows a Fibonacci spiral: big yellow top, cream+white block mid-left, ink+black block mid-right, then mint/sky/red/fuzz cascading smaller in the bottom-right corner.
- **Light/Dark toggle** in the header flips the spiral — ink becomes the biggest tile in dark mode.
- **Clicking a tile** updates the detail island on the right with the full consumer info card (name, role, description, CSS var, Tailwind class, OKLCH, hex).
- **Split-block halves** are independently clickable — clicking `cream` half vs `pure-white` half opens different details.
- **Semantic sub-tab** renders the existing card stack unchanged; values match `tokens.css` (the audit fixes — e.g., `--color-card` swatch is pure white in light mode, pure black in dark mode).
- **Zero scrolling** on the Palette sub-tab for typical window sizes (720×620 and up). The mosaic uses `aspect-[21/34]` so it scales cleanly with window size.
- Both Light and Dark app modes render correctly.

**Step 4:** Commit any cleanup:

```bash
git add -p
git commit -m "chore(colors-tab): lint + cleanup pass"
```

If nothing to commit, this phase is complete.

---

## Deferred (explicitly out of scope)

- **Keyboard nav through tiles.** Tiles are `<button>` so Tab works; arrow-key grid nav is nice-to-have.
- **Per-field copy formats in the dev rows** (e.g., "copy `bg-` prefix" vs. "copy raw class name"). Current design copies `var(...)` for CSS var and raw class for Tailwind.
- **Deep-link selection** (`?color=sun-yellow`). Revisit once more tabs follow this methodology.
- **Accessibility audit.** RDNA lint covers most of it.
- **Pure-white / pure-black showing their OKLCH approximation** when the detail pane renders. They use the exact `oklch(1 0 0)` / `oklch(0 0 0)` strings — fine.
- **Dark-mode semantic hex audit.** Already done in Task 2; any further drift should land via tokens update, not here.

---

## Summary of Files Touched

**New:**
- `apps/rad-os/components/apps/brand-assets/colors-tab/index.ts`
- `apps/rad-os/components/apps/brand-assets/colors-tab/types.ts`
- `apps/rad-os/components/apps/brand-assets/colors-tab/data.ts`
- `apps/rad-os/components/apps/brand-assets/colors-tab/ColorCards.tsx`
- `apps/rad-os/components/apps/brand-assets/colors-tab/FibonacciMosaic.tsx`
- `apps/rad-os/components/apps/brand-assets/colors-tab/ColorDetail.tsx`
- `apps/rad-os/components/apps/brand-assets/colors-tab/SemanticView.tsx`
- `apps/rad-os/components/apps/brand-assets/colors-tab/ColorsSubNav.tsx`
- `apps/rad-os/components/apps/brand-assets/colors-tab/ColorsTab.tsx`

**Modified:**
- `apps/rad-os/components/apps/BrandAssetsApp.tsx` — remove data constants, card components, and old scroll layout; render `<ColorsTab />`.

**Untouched but read-from:**
- `packages/radiants/tokens.css` — light/primitive source of truth.
- `packages/radiants/dark.css` — dark override source of truth.
- `apps/rad-os/components/apps/brand-assets/LogoMaker.tsx` — methodology reference.
