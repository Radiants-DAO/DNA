# Pixel Corner Consumer Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `wf-execute` to implement this plan phase-by-phase.

**Goal:** Replace all 115 usages of legacy `pixel-rounded-*` CSS classes with `<PixelBorder>` (or `<PixelBorderEdges>`) across the `@rdna/radiants` package, then delete the Bresenham corner generator, the CSS polygon generator, and the generated CSS file. End state: one pixel-corner system (hand-drawn, algorithm-verified), zero legacy CSS classes.

**Worktree:** `/Users/rivermassey/Desktop/dev/DNA-pixel-art` (branch: `feat/pixel-art-system`)

**Prerequisite (already shipped on this branch):**

- `generatePixelCornerBorder(R)` in `@rdna/pixel` — cell-center rasterization matching user's hand-drawn SVG fixtures at R=4/6/8/12/16/20
- `PixelBorder` component rewritten to consume it (per-corner radii, per-edge flags, container clamp via ResizeObserver)
- 10 PixelBorder tests + 9 generator tests + 6 SVG fixtures all passing
- Live preview page at `/pixel-corners`
- Previous commit on this branch: the per-corner + edges + clamp feature

**Tech Stack:** React 19, TypeScript, Tailwind v4, Vitest, @testing-library/react, pnpm workspaces

---

## Reference: The New API

All imports from `@rdna/radiants/components/core`:

```tsx
import {
  PixelBorder,
  PixelBorderEdges,
  PIXEL_BORDER_RADII,
  clampPixelCornerRadii,
} from '@rdna/radiants/components/core';
import type {
  PixelBorderProps,
  PixelBorderSize,
  PixelBorderRadius,
  PixelBorderEdgesFlags,
} from '@rdna/radiants/components/core';
```

**`PixelBorder`** — wrapper variant. Takes children, renders `<div class="relative"><div class="overflow-hidden">{children}</div>{edges}</div>`. Handles ResizeObserver-based clamping automatically.

**`PixelBorderEdges`** — fragment variant. Renders only the corner SVGs + straight edge divs. Use inside an already-positioned parent that cannot be wrapped (e.g., when the parent needs a ref that would be lost, or semantic element types incompatible with wrapping).

**Radius props:**

```tsx
// Uniform preset (most common)
<PixelBorder size="sm">{children}</PixelBorder>

// Uniform numeric
<PixelBorder radius={10}>{children}</PixelBorder>

// Per-corner preset
<PixelBorder radius={{ tl: 'sm', tr: 'sm', bl: 0, br: 0 }}>{children}</PixelBorder>

// Per-corner numeric
<PixelBorder radius={{ tl: 6, tr: 6 }}>{children}</PixelBorder>
//                                        ^ unspecified corners default to 0
```

**Preset sizes:** `xs=4, sm=6, md=8, lg=12, xl=20` (see `PIXEL_BORDER_RADII`).

**Edges prop** — omit any straight edge:

```tsx
<PixelBorder edges={{ bottom: false }}>{children}</PixelBorder>
```

**Color prop** — override the default `var(--color-line)`:

```tsx
<PixelBorder color="var(--color-danger)">{children}</PixelBorder>
```

**Shadow prop** — `filter: drop-shadow()` that follows the staircase:

```tsx
<PixelBorder shadow="4px 4px 0 var(--color-ink)">{children}</PixelBorder>
```

---

## Reference: Legacy → New Mapping

| Legacy class | New equivalent |
|---|---|
| `pixel-rounded-xs` on a wrapper div | `<PixelBorder size="xs">` |
| `pixel-rounded-sm` on a wrapper div | `<PixelBorder size="sm">` |
| `pixel-rounded-md` on a wrapper div | `<PixelBorder size="md">` |
| `pixel-rounded-lg` on a wrapper div | `<PixelBorder size="lg">` |
| `pixel-rounded-xl` on a wrapper div | `<PixelBorder size="xl">` |
| `pixel-rounded-xs--wrapper` + inner element | `<PixelBorder size="xs">` (wrapping pattern is built-in) |
| `pixel-rounded-t-sm` (Tabs.chrome only) | `<PixelBorder radius={{tl:'sm', tr:'sm'}} edges={{bottom: false}}>` |

The legacy CSS applied `clip-path` to the target element and required a sibling `::after` pseudo-element for the border. The new component handles all of that via SVG overlays — do NOT preserve the clip-path or ::after patterns.

---

## Reference: Consumer Inventory

Run this to see current scope:
```bash
cd /Users/rivermassey/Desktop/dev/DNA-pixel-art
grep -rn "pixel-rounded-" --include="*.tsx" --include="*.ts" | \
  grep -v node_modules | grep -v dist | grep -v ".test." | grep -v "/test/"
```

**Expected counts (before migration):**

| Variant | Count | Notes |
|---|---|---|
| `pixel-rounded-xs` | 72 | Most common — inputs, checkboxes, small UI |
| `pixel-rounded-xs--wrapper` | 10 | Same underlying usage, wrapper variant |
| `pixel-rounded-sm` | 27 | Buttons, cards, medium surfaces |
| `pixel-rounded-md` | 2 | Dialogs |
| `pixel-rounded-lg` | 2 | App windows, large panels |
| `pixel-rounded-xl` | 2 | Hero sections |
| `pixel-rounded-t-sm` | 1 | **`Tabs.tsx:122`** — the only per-corner case |

**Total:** 116 usages across ~55 files (mostly `packages/radiants/components/core/**`).

---

## Reference: Key Files to Migrate

These 4 files establish the patterns; migrate them FIRST by hand and visually verify before parallelizing the rest.

| File | Pattern | Why It's the POC |
|---|---|---|
| `packages/radiants/components/core/Input/Input.tsx` | wrapper + error state + icon variants | Tests the `color` prop override for error, wrapping a void `<input>`, className composition |
| `packages/radiants/components/core/Checkbox/Checkbox.tsx` | simple inline usage | Tests the minimal wrap case |
| `packages/radiants/components/core/Tabs/Tabs.tsx` | `pixel-rounded-xs` AND `pixel-rounded-t-sm` | Tests per-corner + edges.bottom=false |
| `packages/radiants/components/core/Tooltip/Tooltip.tsx` | overlay/portal content | Tests wrapping inside a floating UI element |

---

## Reference: Migration Patterns

### Pattern 1 — simple div wrapper

**Before:**
```tsx
<div className="bg-card pixel-rounded-sm px-3 py-2">
  {children}
</div>
```

**After:**
```tsx
<PixelBorder size="sm">
  <div className="bg-card px-3 py-2">
    {children}
  </div>
</PixelBorder>
```

Note: the `pixel-rounded-sm` class is removed; `bg-card` stays on the inner element; padding and layout classes stay on the inner element. The `PixelBorder` wrapper only owns the border/clipping.

### Pattern 2 — wrapper variant

**Before:**
```tsx
<div className="pixel-rounded-xs--wrapper w-full">
  <input className={`pixel-rounded-xs ${classes}`} {...props} />
</div>
```

**After:**
```tsx
<PixelBorder size="xs" className="w-full">
  <input className={classes} {...props} />
</PixelBorder>
```

The `--wrapper` variant was a legacy workaround for CSS-not-applying-to-void-elements. `PixelBorder` already wraps its child in a clipper, so the wrapper div is subsumed.

### Pattern 3 — error state

**Before:**
```tsx
const wrapperClassName = [
  'pixel-rounded-xs--wrapper',
  fullWidth ? 'w-full' : '',
  showStandaloneError ? 'pixel-border-danger' : '',
].filter(Boolean).join(' ');

<div className={wrapperClassName}>
  <input ... />
</div>
```

**After:**
```tsx
<PixelBorder
  size="xs"
  className={fullWidth ? 'w-full' : ''}
  color={showStandaloneError ? 'var(--color-danger)' : undefined}
>
  <input ... />
</PixelBorder>
```

The legacy `pixel-border-danger` class overrode the border color via CSS. The new `color` prop takes any CSS color, so pass the token directly.

### Pattern 4 — ref preservation

Wrapping with `<PixelBorder>` does NOT change where the ref points:

```tsx
// Before: ref goes to input directly
<input ref={ref} className="pixel-rounded-xs" ... />

// After: ref still goes to input — PixelBorder is just a wrapper div above it
<PixelBorder size="xs">
  <input ref={ref} ... />
</PixelBorder>
```

### Pattern 5 — Tabs.chrome (per-corner + edges)

**Before** (`packages/radiants/components/core/Tabs/Tabs.tsx:122`):
```tsx
chrome: 'pixel-rounded-t-sm h-8 px-2 justify-center',
```

This is a Tailwind variant class used in `cva()`. The class carries styling metadata that needs to be broken apart — the geometry goes to `<PixelBorder>`, the rest stays as Tailwind.

**After:**
```tsx
// In the JSX rendering the chrome variant:
{variant === 'chrome' ? (
  <PixelBorder
    radius={{ tl: 'sm', tr: 'sm' }}
    edges={{ bottom: false }}
  >
    <div className="h-8 px-2 justify-center flex items-center">
      {children}
    </div>
  </PixelBorder>
) : (
  // other variants...
)}
```

Note: `flex items-center` may need to be added back since the wrapping might lose the parent's flex context; verify visually.

### Pattern 6 — compound className with tailwind variants (`cva`)

Some files use `class-variance-authority` and include `pixel-rounded-*` in variant class strings. Treat these the same way: remove the `pixel-rounded-*` from the variant string, then wrap the rendered element.

---

## Reference: NOT Targets for Migration

- **Test fixture files** (`/test/` and `*.test.*`) — leave alone; they reference legacy classes as historical fixtures for the old generator
- `packages/radiants/pixel-corners.generated.css` — deleted wholesale in Phase 3
- `packages/radiants/components/core/PixelCorner/` — this is the OLD overlay component (4 SVGs with cover + border grids). It has its own consumers; leave it for a separate migration. Don't delete it in this plan.

---

## Phase 1: Proof-of-Concept Migration (Manual)

**Goal:** Establish the patterns. Migrate 4 representative files by hand and verify each visually in the dev server before any parallelization.

### Task 1.1: Migrate `Input.tsx`

**File:** `packages/radiants/components/core/Input/Input.tsx`

Migrate both the `Input` export and the `TextArea` export. Both use the wrapper pattern with error state, and Input has icon variants. Use Pattern 2 and Pattern 3.

**Acceptance:**
- No `pixel-rounded-xs` or `pixel-rounded-xs--wrapper` classes remain in the file
- No `pixel-border-danger` class remains; replaced with `color` prop
- Error state still tints the border red (manually toggle in storybook/playground)
- Input with icon: icon still aligned correctly inside the padded input
- fullWidth prop still makes the whole thing fill its container
- `ref` forwarding still works: `const ref = useRef<HTMLInputElement>(null)` still resolves to the `<input>`, not the wrapper

### Task 1.2: Migrate `Checkbox.tsx` and `Radio`

**File:** `packages/radiants/components/core/Checkbox/Checkbox.tsx`

This file exports `Checkbox`, `Radio`, and `RadioGroup`. Use Pattern 1.

**Acceptance:**
- No `pixel-rounded-*` classes remain
- Click / hover / focus states still work (base-ui primitives untouched)
- Checked / unchecked icons still render at correct size

### Task 1.3: Migrate `Tooltip.tsx`

**File:** `packages/radiants/components/core/Tooltip/Tooltip.tsx`

Tooltips render inside a base-ui Popover portal. Use Pattern 1, but be careful that the wrapping doesn't break the floating UI positioning.

**Acceptance:**
- Tooltip still appears on hover
- Tooltip positioning (top/bottom/left/right) still works via base-ui props
- Arrow pointer (if present) still aligned

### Task 1.4: Migrate `Tabs.tsx` (per-corner case)

**File:** `packages/radiants/components/core/Tabs/Tabs.tsx`

This is the ONE per-corner migration. Use Pattern 5 for the `chrome` variant. The `capsule` variant uses plain `pixel-rounded-xs` — migrate that with Pattern 1.

**Acceptance:**
- `capsule` variant renders as a rounded pill
- `chrome` variant renders with rounded top corners and NO bottom border (flows into the tab content panel below it)
- Tab switching / keyboard navigation still works
- Active tab indicator still correct

### Task 1.5: Run tests and visual verify

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pixel-art
pnpm --filter @rdna/radiants test -- --run components/core/Input components/core/Checkbox components/core/Tooltip components/core/Tabs
pnpm --filter rad-os dev
```

Open `http://localhost:3001` and poke at every affected component. Do NOT proceed to Phase 2 until all four POC components look correct.

---

## Phase 2: Parallel Migration of Remaining Files

**Goal:** Migrate the remaining ~51 files using the established patterns.

### Task 2.1: List remaining files

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pixel-art
grep -rln "pixel-rounded-" --include="*.tsx" --include="*.ts" | \
  grep -v node_modules | grep -v dist | grep -v ".test." | grep -v "/test/" | \
  grep -v "Input/Input.tsx" | grep -v "Checkbox/Checkbox.tsx" | \
  grep -v "Tooltip/Tooltip.tsx" | grep -v "Tabs/Tabs.tsx"
```

### Task 2.2: Split into batches of ~12 files each

Group by directory when possible:
- **Batch A — Forms:** Input, NumberField, Switch, Select, Combobox, Slider, Meter, ToggleGroup, Toggle (skip already-done Input)
- **Batch B — Menus & overlays:** DropdownMenu, ContextMenu, Menubar, NavigationMenu, PreviewCard, Popover, Sheet, Drawer, Dialog, AlertDialog, HoverCard
- **Batch C — Layout & containers:** Card, Tabs (skip), Tooltip (skip), Accordion, Collapsible, ScrollArea, Separator, Toolbar, Breadcrumbs
- **Batch D — Feedback & content:** Alert, Badge, Button, IconButton, Avatar, Spinner, Toast, CountdownTimer, InputSet, Drawer

Adjust the batching to whatever `grep` actually returns; the goal is 4 batches of ~12 each.

### Task 2.3: Spawn one `general-purpose` Agent per batch

Each agent prompt should be a tight brief pointing at:
1. This plan file
2. The four POC commits from Phase 1 as exemplars
3. The specific file list for that batch
4. An acceptance criterion: all files compile, all tests in the affected modules pass, no `pixel-rounded-*` matches remain in the assigned files

Agent invocation template:

```
Migrate the pixel-rounded-* CSS classes to <PixelBorder> in these files:
[list of 12 files]

Background: feat/pixel-art-system branch in /Users/rivermassey/Desktop/dev/DNA-pixel-art.
The new API is documented in docs/plans/2026-04-11-pixel-corners-consumer-migration.md
— read that first (especially the Legacy → New Mapping and Migration Patterns sections).

Exemplar commits (what "done" looks like):
[git log hashes from Phase 1]

For each file:
- Remove all `pixel-rounded-*` classes
- Wrap the appropriate element with <PixelBorder size="..."> (or <PixelBorderEdges>
  if the parent can't be wrapped)
- Preserve refs, event handlers, and data-* attributes on the original element
- For error-state classes like `pixel-border-danger`, replace with the `color` prop

Before claiming done:
- `grep -l "pixel-rounded-" [your files]` must return empty
- `npx vitest run [affected test files]` must pass
- Report under 200 words: what you migrated, any surprises, anything you
  couldn't migrate and why.
```

### Task 2.4: Review each agent's work

As each agent returns, spot-check its diff:
- No `pixel-rounded-*` classes in modified files
- Tests pass
- Wrap-not-replace — inner element still present with its original props

If any file looks wrong, reject that file and re-delegate with more specific guidance.

### Task 2.5: Run full test suite and visual spot-check

```bash
pnpm --filter @rdna/radiants test
pnpm --filter rad-os dev
```

Walk the major components in the browser (especially forms, menus, dialogs, app windows).

---

## Phase 3: Delete Legacy Generator and CSS

Only enter this phase after Phase 2 is fully landed and visually verified.

### Task 3.1: Verify zero remaining consumers

```bash
grep -rn "pixel-rounded-" --include="*.tsx" --include="*.ts" | \
  grep -v node_modules | grep -v dist | grep -v ".test." | grep -v "/test/"
```

Must return empty. If it doesn't, stop and migrate the stragglers before deleting anything.

### Task 3.2: Delete files

```bash
cd /Users/rivermassey/Desktop/dev/DNA-pixel-art
rm packages/radiants/pixel-corners.generated.css
rm packages/radiants/scripts/generate-pixel-corners.mjs
rm packages/radiants/scripts/pixel-corners-lib.mjs
rm packages/radiants/scripts/pixel-corners.config.mjs
rm packages/radiants/test/pixel-corners-generator.test.ts
rm packages/pixel/src/generate.ts
rm packages/pixel/src/corner-sets.ts
rm packages/pixel/src/__tests__/generate.test.ts
rm packages/pixel/src/__tests__/corner-sets.test.ts
```

### Task 3.3: Update `packages/pixel/src/index.ts`

Remove the exports that reference deleted files:

```diff
- export { CORNER_SETS, getCornerSet } from './corner-sets.js';
- export type { CornerSize } from './corner-sets.js';
- export { generateCorner } from './generate.js';
```

Keep `mirrorForCorner`, `getCornerStyle`, `CORNER_POSITIONS` from `corners.ts` — the old `PixelCorner` component still uses them and is NOT part of this migration.

### Task 3.4: Update `packages/radiants/package.json`

Remove the `generate:pixel-corners` npm script entry (if it exists). Do NOT remove scripts that still have consumers.

### Task 3.5: Remove CSS import

Find where `pixel-corners.generated.css` is imported (likely `packages/radiants/index.css` or a similar aggregator) and remove the `@import` line.

```bash
grep -rn "pixel-corners.generated" packages/radiants --include="*.css" --include="*.ts"
```

### Task 3.6: Rebuild and run full test suite

```bash
pnpm --filter @rdna/pixel build
pnpm --filter @rdna/pixel test
pnpm --filter @rdna/radiants test
```

All must pass.

### Task 3.7: Run dev server and final visual verification

```bash
pnpm --filter rad-os dev
```

Open `http://localhost:3001` — walk through every app. Pay particular attention to anything with visible borders: inputs, buttons, cards, dialogs, tabs.

---

## Commit Strategy

Recommended commit layout:

1. `refactor(radiants): migrate Input/Checkbox/Tooltip/Tabs to PixelBorder` — Phase 1 POC
2. `refactor(radiants): migrate forms batch to PixelBorder` — Batch A
3. `refactor(radiants): migrate menus/overlays batch to PixelBorder` — Batch B
4. `refactor(radiants): migrate layout/container batch to PixelBorder` — Batch C
5. `refactor(radiants): migrate feedback/content batch to PixelBorder` — Batch D
6. `chore(pixel): delete legacy Bresenham corner generator and polygon CSS` — Phase 3

Each batch commit should be self-contained and leave the repo in a passing state.

---

## Risk Checklist

- **Ref forwarding:** the wrapper div is a new DOM node but the `ref` still points to the inner element. Verify this by searching for `useRef<HTMLDivElement>` bindings that currently reference an element with `pixel-rounded-*`.
- **Focus states:** `:focus-visible` styles defined on the old wrapper class will need to be moved to the inner element.
- **Position: absolute children:** if the old class was on an absolutely-positioned element, the wrapper becomes the positioning context. Usually fine; check tooltip/popover positioning.
- **CSS specificity conflicts:** `<PixelBorder>` applies `position: relative` to its wrapper. If the child has its own `position: ...`, the child's positioning is respected inside the relative wrapper.
- **Inline display:** `<PixelBorder>` renders a `<div>`. If the consumer was inline (e.g., inline Badge inside text), the wrapping div may break the flow. In those cases, add `className="inline-block"` to the PixelBorder.
- **Tabs.chrome flex context:** the old class applied directly to the tab trigger; the new wrapper adds a `<div>` between the Tabs list and the trigger content. Verify the flex/grid layout of the tab list still works — you may need to forward `className` onto `<PixelBorder>` with the original flex/alignment classes.

---

## Not In Scope

- **Per-corner scaling / stroke thickness** — deferred. There's a separate pending task for `scale?: number` on PixelBorder (1–10x), which is blocked on the Pattern component refactor. Do not add it in this migration.
- **PixelCorner (the OLD overlay component)** — has its own consumers and its own migration plan. Don't touch it.
- **Main branch consumers** — this migration is scoped to the `feat/pixel-art-system` worktree only. Main branch will pick up the changes when this branch merges.
