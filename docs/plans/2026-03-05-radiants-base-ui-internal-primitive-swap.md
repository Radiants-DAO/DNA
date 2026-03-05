# Radiants Base UI Internal Primitive Swap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace high-risk interactive primitives in `packages/radiants` with `@base-ui/react` internals while preserving the existing `@rdna/radiants/components/core` API and validating visual parity in RadOS BrandAssets.

**Architecture:** Keep the public Radiants component contract unchanged (`Dialog`, `Sheet`, `Select`, `Tabs`, etc. names and props stay stable). Perform an internal engine swap only for interactive/headless behaviors (focus management, keyboard nav, ARIA state). Preserve current token classes and existing `data-*` hooks so `dark.css` continues to apply without selector rewrites.

**Tech Stack:** React 19, Next.js 16, TypeScript, `@base-ui/react`, Vitest, Testing Library, jsdom, pnpm worktrees

---

## Reality Check (Pre-Execution Validation)

- `@base-ui/react` exports confirmed in local install:
  - `./drawer`
  - `./toast`
  - `./context-menu`
- Current `packages/radiants/components/core` internals are fully custom (no existing Radix/Base UI imports).
- `apps/rad-os` confirmed on `next@16.1.6` / `react@19.2.1`.

## Scope Clarification

- **In-scope internal swaps (this branch):**
  - Accordion, Tabs
  - Dialog, Sheet
  - Popover, DropdownMenu, ContextMenu
  - Select
  - Tooltip, Toast
  - Checkbox, Radio, Switch, Slider

---

## Prerequisites

- Branch model:
  - Baseline worktree: clean copy of `main` for localhost comparison.
  - Feature worktree: dedicated branch for this migration.
- Required skills during execution:
  - `@javascript-testing-patterns`
  - `@verification-before-completion`
  - `@requesting-code-review`

### Baseline/Feature Worktree Commands

```bash
git fetch origin
git worktree add ../DNA-main origin/main

# In feature worktree (this repo)
git checkout -b feat/radiants-base-ui-internal-primitives
```

### Dual localhost commands (RadOS visual compare)

```bash
# Terminal A (baseline)
cd ../DNA-main
pnpm --filter rad-os dev -- --port 3000

# Terminal B (feature)
cd /Users/rivermassey/Desktop/dev/DNA
pnpm --filter rad-os dev -- --port 3100
```

---

### Task 1: Establish Visual QA Harness and Baseline Checklist

**Files:**
- Create: `docs/qa/2026-03-05-radiants-base-ui-visual-compare.md`

**Step 1: Write the failing acceptance checklist**

Create `docs/qa/2026-03-05-radiants-base-ui-visual-compare.md` with this table skeleton:

```md
# Radiants Base UI Visual Compare

## Environment
- Baseline: http://localhost:3000
- Feature: http://localhost:3100
- Primary surface: RadOS -> Brand Assets -> Components tab

## Component Regression Matrix
| Section | Component | Baseline | Feature | Match (Y/N) | Notes |
|---|---|---|---|---|---|
| Forms | Select |  |  |  |  |
| Forms | Checkbox/Radio |  |  |  |  |
| Forms | Switch/Slider |  |  |  |  |
| Navigation | Tabs |  |  |  |  |
| Overlays | Dialog |  |  |  |  |
| Overlays | DropdownMenu |  |  |  |  |
| Overlays | ContextMenu |  |  |  |  |
| Overlays | Popover |  |  |  |  |
| Overlays | Sheet |  |  |  |  |
| Feedback | Tooltip |  |  |  |  |
| Feedback | Toast |  |  |  |  |
| Navigation | Accordion (Auctions app) |  |  |  |  |
```

**Step 2: Run baseline compare to verify checklist starts as incomplete**

Open both localhost instances and confirm the checklist is intentionally unfilled (failing acceptance state).

**Step 3: Record baseline interaction notes (minimal)**

Capture baseline behavior notes for:
- keyboard in Tabs
- keyboard in Select
- overlay open/close flows (Dialog/Sheet/Popover/Dropdown)

**Step 4: Mark baseline as reference complete**

Fill only baseline-side columns (leave Feature/Match pending).

**Step 5: Commit**

```bash
git add docs/qa/2026-03-05-radiants-base-ui-visual-compare.md
git commit -m "docs: add visual regression checklist for radiants base-ui migration"
```

---

### Task 2: Add Radiants Component Test Harness

**Files:**
- Modify: `packages/radiants/package.json`
- Create: `packages/radiants/vitest.config.ts`
- Create: `packages/radiants/test/setup.ts`
- Create: `packages/radiants/test/render.tsx`
- Test: `packages/radiants/components/core/__tests__/smoke.test.tsx`

**Step 1: Write the failing smoke test**

```tsx
import { render, screen } from '@testing-library/react';
import { Button, Select, Dialog } from '../index';

test('core exports render', () => {
  render(<Button>Test</Button>);
  expect(screen.getByRole('button', { name: 'Test' })).toBeInTheDocument();
  expect(Select).toBeTruthy();
  expect(Dialog).toBeTruthy();
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @rdna/radiants test:components
```

Expected: FAIL (missing script/deps/config).

If the test already passes (after local setup), treat it as baseline coverage and continue.

**Step 3: Write minimal test infrastructure**

Add scripts and dev dependencies in `packages/radiants/package.json`:

```json
{
  "scripts": {
    "test:components": "vitest run",
    "test:components:watch": "vitest"
  }
}
```

Add `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['components/core/**/*.test.tsx'],
  },
});
```

Add `test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @rdna/radiants test:components
```

Expected: PASS for smoke test.

**Step 5: Commit**

```bash
git add packages/radiants/package.json packages/radiants/vitest.config.ts packages/radiants/test/setup.ts packages/radiants/test/render.tsx packages/radiants/components/core/__tests__/smoke.test.tsx
git commit -m "test: add vitest harness for radiants core components"
```

---

### Knowledge Checkpoint 1: Component Test Harness Pattern (Post-Task 2)

> **Skill:** `/compound-knowledge`
> **Output:** `docs/solutions/tooling/vitest-component-harness-pnpm-monorepo.md`

**Capture after Task 2 passes.** Document the reusable pattern for adding a vitest + testing-library + jsdom harness to any package in this monorepo. Include:
- Minimal `vitest.config.ts` shape for component packages
- `test/setup.ts` with `@testing-library/jest-dom/vitest`
- pnpm filter commands for scoped test runs
- Gotchas encountered (React 19 compat, jsdom quirks, path resolution)

**Why here:** Every new RDNA theme package will need this same test scaffold. Capture it once.

---

### Task 3: Migrate Tabs and Accordion Internals to Base UI

**Files:**
- Modify: `packages/radiants/package.json`
- Modify: `packages/radiants/components/core/Tabs/Tabs.tsx`
- Modify: `packages/radiants/components/core/Accordion/Accordion.tsx`
- Test: `packages/radiants/components/core/Tabs/Tabs.test.tsx`
- Test: `packages/radiants/components/core/Accordion/Accordion.test.tsx`

**Step 1: Write failing interaction tests**

`Tabs.test.tsx` (keyboard nav expected):

```tsx
test('tabs arrow keys move focus and selection', async () => {
  // render Tabs wrapper with 3 triggers/panels
  // focus first tab, press ArrowRight
  // expect second tab selected and corresponding panel visible
});
```

`Accordion.test.tsx` (trigger keyboard expected):

```tsx
test('accordion toggles with Enter and exposes aria-expanded', async () => {
  // render Accordion wrapper with one item
  // press Enter on trigger
  // expect panel visible and aria-expanded true
});
```

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- Tabs
pnpm --filter @rdna/radiants test:components -- Accordion
```

Expected: FAIL on keyboard behavior assertions.

If behavior tests already pass on current custom implementation, document as baseline and continue with refactor under green tests.

**Step 3: Implement minimal Base UI wrappers**

- Add dependency:

```bash
pnpm --filter @rdna/radiants add @base-ui/react
```

- In `Tabs.tsx`, keep existing public API but map internal rendering to Base UI parts:
  - `Tabs.Provider` -> `BaseTabs.Root`
  - `Tabs.List` -> `BaseTabs.List`
  - `Tabs.Trigger` -> `BaseTabs.Tab`
  - `Tabs.Content` -> `BaseTabs.Panel`
- Preserve existing classnames and `data-variant` hooks.
- In `Accordion.tsx`, keep `useAccordionState` API but render with Base UI accordion parts for trigger/content semantics.

**Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- Tabs
pnpm --filter @rdna/radiants test:components -- Accordion
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/package.json packages/radiants/components/core/Tabs/Tabs.tsx packages/radiants/components/core/Accordion/Accordion.tsx packages/radiants/components/core/Tabs/Tabs.test.tsx packages/radiants/components/core/Accordion/Accordion.test.tsx
git commit -m "feat: swap tabs and accordion internals to base-ui"
```

---

### Knowledge Checkpoint 2: Base UI Wrapper Pattern (Post-Task 3)

> **Skill:** `/compound-knowledge`
> **Output:** `docs/solutions/integration-issues/base-ui-api-preserving-wrapper-pattern.md`

**Capture after Task 3 passes.** This is the core migration pattern — document it thoroughly. Include:
- The wrapper anatomy: public compound component API → Base UI internals → preserved `data-*`/class hooks
- How to map custom state hooks (e.g., `useAccordionState`) onto Base UI controlled state
- Import path convention (`@base-ui/react/tabs` vs barrel)
- Which Base UI parts need `render` prop vs direct children
- Any React 19 / Next.js 16 compatibility issues encountered
- Before/after code comparison for one component (Tabs is ideal)

**Why here:** This pattern repeats for every component in Tasks 4–8. Capturing after the first real migration means the template is fresh and specific.

---

### Task 4: Migrate Dialog and Sheet Internals to Base UI

**Files:**
- Modify: `packages/radiants/components/core/Dialog/Dialog.tsx`
- Modify: `packages/radiants/components/core/Sheet/Sheet.tsx`
- Test: `packages/radiants/components/core/Dialog/Dialog.test.tsx`
- Test: `packages/radiants/components/core/Sheet/Sheet.test.tsx`

**Step 1: Write failing focus/escape tests**

`Dialog.test.tsx`:

```tsx
test('dialog traps focus and closes on Escape', async () => {
  // open dialog
  // tab cycles within dialog
  // press Escape -> closes
});
```

`Sheet.test.tsx`:

```tsx
test('sheet closes on Escape and backdrop click', async () => {
  // open sheet
  // Escape closes
  // reopen, click backdrop closes
});
```

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- Dialog
pnpm --filter @rdna/radiants test:components -- Sheet
```

Expected: FAIL for focus-trap and/or lifecycle assertions.

If behavior tests already pass, document baseline and continue with internal swap.

**Step 3: Implement Base UI-backed internals**

- `Dialog.tsx`:
  - Keep `Dialog.Provider`, `Dialog.Trigger`, `Dialog.Content`, `Dialog.Close`, etc.
  - Render Base UI `Dialog.Root/Trigger/Portal/Backdrop/Popup/Title/Description/Close` internally.
- `Sheet.tsx`:
  - Keep existing exports (`SheetTrigger`, `SheetContent`, etc.).
  - Implement with Base UI `Drawer` internals (`side` mapped from existing `SheetSide`).
- Preserve existing CSS class hooks and element structure needed by `dark.css`.

**Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- Dialog
pnpm --filter @rdna/radiants test:components -- Sheet
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/components/core/Dialog/Dialog.tsx packages/radiants/components/core/Sheet/Sheet.tsx packages/radiants/components/core/Dialog/Dialog.test.tsx packages/radiants/components/core/Sheet/Sheet.test.tsx
git commit -m "feat: migrate dialog and sheet internals to base-ui"
```

---

### Checkpoint A: Overlay Gate (Post-Task 4)

**Goal:** Ensure branch is in a safe fallback state before continuing to menus/select/tooltip/toast.

Run:

```bash
pnpm --filter @rdna/radiants test:components -- Dialog
pnpm --filter @rdna/radiants test:components -- Sheet
pnpm --filter rad-os build
```

Expected: PASS.

If PASS:
- create checkpoint tag/commit note and proceed to Task 5.

If FAIL:
- stop here and fix before continuing.

---

### Knowledge Checkpoint 3: Overlay/Portal Migration Patterns (Post-Checkpoint A)

> **Skill:** `/compound-knowledge`
> **Output:** `docs/solutions/integration-issues/base-ui-overlay-portal-migration.md`

**Capture after Checkpoint A passes.** Overlays (Dialog, Sheet) have fundamentally different migration concerns than inline components. Document:
- Portal rendering: how Base UI portals interact with existing CSS scoping (`dark.css`, token layers)
- Focus trap: what Base UI handles automatically vs what needed manual wiring
- Backdrop/overlay: mapping existing backdrop classes to Base UI's `Backdrop` part
- Sheet → Drawer mapping: how `side` prop maps, animation preservation
- Testing overlays in jsdom: workarounds for missing `HTMLDialogElement`, portal rendering in test env
- CSS class hook preservation checklist for overlay components

**Why here:** Overlay migration is the highest-risk category. Capturing these patterns prevents re-discovering portal/focus-trap gotchas in future headless UI swaps.

---

### Task 5: Migrate Popover, DropdownMenu, and ContextMenu Internals

**Files:**
- Modify: `packages/radiants/components/core/Popover/Popover.tsx`
- Modify: `packages/radiants/components/core/DropdownMenu/DropdownMenu.tsx`
- Modify: `packages/radiants/components/core/ContextMenu/ContextMenu.tsx`
- Test: `packages/radiants/components/core/Popover/Popover.test.tsx`
- Test: `packages/radiants/components/core/DropdownMenu/DropdownMenu.test.tsx`
- Test: `packages/radiants/components/core/ContextMenu/ContextMenu.test.tsx`

**Step 1: Write failing keyboard/navigation tests**

`DropdownMenu.test.tsx`:

```tsx
test('dropdown supports arrow-key item navigation and Escape close', async () => {
  // open menu
  // ArrowDown moves active item
  // Escape closes menu
});
```

`ContextMenu.test.tsx`:

```tsx
test('context menu opens on contextmenu event and selects item via keyboard', async () => {
  // right click target
  // ArrowDown + Enter activates item
});
```

`Popover.test.tsx`:

```tsx
test('popover positions and closes on outside click', async () => {
  // open popover via trigger
  // click document body
  // expect closed
});
```

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- Popover
pnpm --filter @rdna/radiants test:components -- DropdownMenu
pnpm --filter @rdna/radiants test:components -- ContextMenu
```

Expected: FAIL.

If behavior tests already pass, document baseline and continue with internal swap under the same assertions.

**Step 3: Implement Base UI internals**

- Popover: map to Base UI Popover parts.
- DropdownMenu: map to Base UI Menu parts with existing export names.
- ContextMenu: map to Base UI `ContextMenu` primitives with existing API shape.
- Keep `data-variant`/state class hooks used by current CSS.

**Step 4: Run tests to verify they pass**

Run the same commands as Step 2.

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/components/core/Popover/Popover.tsx packages/radiants/components/core/DropdownMenu/DropdownMenu.tsx packages/radiants/components/core/ContextMenu/ContextMenu.tsx packages/radiants/components/core/Popover/Popover.test.tsx packages/radiants/components/core/DropdownMenu/DropdownMenu.test.tsx packages/radiants/components/core/ContextMenu/ContextMenu.test.tsx
git commit -m "feat: migrate menu and popover primitives to base-ui"
```

---

### Task 6: Migrate Select Internals to Base UI

**Files:**
- Modify: `packages/radiants/components/core/Select/Select.tsx`
- Test: `packages/radiants/components/core/Select/Select.test.tsx`

**Step 1: Write failing listbox semantics test**

```tsx
test('select has combobox/listbox semantics and keyboard selection', async () => {
  // render Select wrapper
  // trigger has aria-expanded updates
  // ArrowDown navigates options
  // Enter selects and closes
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- Select
```

Expected: FAIL.

If behavior tests already pass, document baseline and continue with internal swap.

**Step 3: Implement Base UI Select-backed wrapper**

- Keep existing public exports:
  - `Select.Provider`, `Select.Trigger`, `Select.Content`, `Select.Option`, `useSelectState`.
- Use Base UI Select internals for popup/list/item semantics.
- Preserve existing visual hooks:
  - `data-variant="select"`
  - `data-size`
  - `data-open`

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- Select
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/components/core/Select/Select.tsx packages/radiants/components/core/Select/Select.test.tsx
git commit -m "feat: migrate select internals to base-ui"
```

---

### Knowledge Checkpoint 4: Select/Combobox Migration Gotchas (Post-Task 6)

> **Skill:** `/compound-knowledge`
> **Output:** `docs/solutions/integration-issues/base-ui-select-combobox-migration.md`

**Capture after Task 6 passes.** Select is historically the trickiest primitive to migrate. Document:
- ARIA role mapping: how Base UI Select roles differ from custom implementation (combobox vs listbox vs menu)
- Controlled value semantics: any mismatches between existing `useSelectState` and Base UI's value model
- `data-open` / `data-size` / `data-variant` preservation strategy
- Keyboard behavior delta: any differences in arrow-key/enter/escape behavior between old and new
- Form integration: hidden input, name attribute, native form submission compatibility
- Common failure modes and their fixes

**Why here:** Select migration breaks in subtle ways that don't surface until integration testing. This doc saves future debugging time.

---

### Task 7: Migrate Tooltip and Toast Internals

**Files:**
- Modify: `packages/radiants/components/core/Tooltip/Tooltip.tsx`
- Modify: `packages/radiants/components/core/Toast/Toast.tsx`
- Test: `packages/radiants/components/core/Tooltip/Tooltip.test.tsx`
- Test: `packages/radiants/components/core/Toast/Toast.test.tsx`

**Step 1: Write failing behavior tests**

`Tooltip.test.tsx`:

```tsx
test('tooltip opens on hover/focus and closes on blur', async () => {
  // hover trigger -> tooltip visible
  // unhover -> tooltip hidden
});
```

`Toast.test.tsx`:

```tsx
test('toast announces and dismisses via close action', async () => {
  // call useToast add/show
  // expect role=alert content visible
  // click close, expect removed
});
```

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- Tooltip
pnpm --filter @rdna/radiants test:components -- Toast
```

Expected: FAIL.

If behavior tests already pass, document baseline and continue with internal swap.

**Step 3: Implement Base UI internals**

- Tooltip: wrap Base UI Tooltip parts while keeping `Tooltip` public signature.
- Toast: keep `ToastProvider` + `useToast` contract, use Base UI toast manager internals.
- Ensure existing motion and classNames still apply.

**Step 4: Run tests to verify they pass**

Run same commands from Step 2.

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/components/core/Tooltip/Tooltip.tsx packages/radiants/components/core/Toast/Toast.tsx packages/radiants/components/core/Tooltip/Tooltip.test.tsx packages/radiants/components/core/Toast/Toast.test.tsx
git commit -m "feat: migrate tooltip and toast internals to base-ui"
```

---

### Task 8: Migrate Checkbox, Radio, Switch, and Slider Internals

**Files:**
- Modify: `packages/radiants/components/core/Checkbox/Checkbox.tsx`
- Modify: `packages/radiants/components/core/Switch/Switch.tsx`
- Modify: `packages/radiants/components/core/Slider/Slider.tsx`
- Test: `packages/radiants/components/core/Checkbox/Checkbox.test.tsx`
- Test: `packages/radiants/components/core/Switch/Switch.test.tsx`
- Test: `packages/radiants/components/core/Slider/Slider.test.tsx`

**Step 1: Write failing behavior tests**

`Checkbox.test.tsx`:

```tsx
test('checkbox and radio fire onChange and reflect checked state', async () => {
  // render controlled Checkbox + Radio pair
  // click and keyboard activate
  // assert checked state and onChange payloads
});
```

`Switch.test.tsx`:

```tsx
test('switch toggles by click/keyboard and respects disabled', async () => {
  // render controlled Switch
  // Space/Enter toggles
  // disabled switch does not toggle
});
```

`Slider.test.tsx`:

```tsx
test('slider supports keyboard step changes and min/max bounds', async () => {
  // render controlled Slider
  // Arrow keys update by step
  // Home/End clamp to min/max
});
```

**Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @rdna/radiants test:components -- Checkbox
pnpm --filter @rdna/radiants test:components -- Switch
pnpm --filter @rdna/radiants test:components -- Slider
```

Expected: FAIL.

If behavior tests already pass, document baseline and continue with internal swap.

**Step 3: Implement Base UI-backed internals while preserving Radiants API**

- `Checkbox.tsx`:
  - Implement `Checkbox` via Base UI `Checkbox.Root/Indicator`.
  - Implement `Radio` via Base UI radio primitives while preserving current `label`, `checked`, `name`, `value`, and native form behavior expectations.
- `Switch.tsx`:
  - Implement via Base UI `Switch.Root/Thumb`.
  - Preserve `size`, `labelPosition`, and existing `data-variant="switch"` hooks used by `dark.css`.
- `Slider.tsx`:
  - Implement via Base UI `Slider.Root/Control/Track/Indicator/Thumb`.
  - Preserve numeric controlled API (`value: number`, `onChange(number)`), size classes, label/value display, and keyboard behavior.

**Step 4: Run tests to verify they pass**

Run same commands from Step 2.

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/components/core/Checkbox/Checkbox.tsx packages/radiants/components/core/Switch/Switch.tsx packages/radiants/components/core/Slider/Slider.tsx packages/radiants/components/core/Checkbox/Checkbox.test.tsx packages/radiants/components/core/Switch/Switch.test.tsx packages/radiants/components/core/Slider/Slider.test.tsx
git commit -m "feat: migrate checkbox radio switch and slider internals to base-ui"
```

---

### Task 9: RadOS Integration Verification and Visual Regression Pass

**Files:**
- Modify: `docs/qa/2026-03-05-radiants-base-ui-visual-compare.md`
- Optional Modify (if needed): `apps/rad-os/components/ui/DesignSystemTab.tsx`

**Step 1: Write failing acceptance notes before fixes**

In the QA doc, add a `## Feature Comparison Results` section with all rows set to `Match = N` before running final verification.

**Step 2: Run verification commands**

```bash
pnpm --filter @rdna/radiants test:components
pnpm --filter rad-os lint
pnpm --filter rad-os build
```

Expected: PASS.

**Step 3: Execute side-by-side visual and interaction checks**

- Open baseline `http://localhost:3000` and feature `http://localhost:3100`.
- In both:
  - Open **Brand Assets** app.
  - Switch to **Components** tab.
  - Validate sections: Forms, Navigation, Overlays, Feedback.
- Also validate **Auctions app** accordion behavior (outside BrandAssets).
- Record keyboard checks:
  - `Tabs`: ArrowLeft/ArrowRight
  - `Select`: ArrowDown/Enter/Escape
  - Menus: ArrowDown/Enter/Escape
  - Dialog/Sheet: focus loop + Escape

**Step 4: Mark acceptance pass/fail in QA doc**

Update every matrix row to `Match = Y` or `N` with concrete notes and follow-up tickets for any `N`.

**Step 5: Commit**

```bash
git add docs/qa/2026-03-05-radiants-base-ui-visual-compare.md
git commit -m "docs: finalize side-by-side visual QA for base-ui primitive swap"
```

---

### Knowledge Checkpoint 5: Visual Regression Workflow for Component Migrations (Post-Task 9)

> **Skill:** `/compound-knowledge`
> **Output:** `docs/solutions/tooling/visual-regression-workflow-component-migration.md`

**Capture after Task 9 QA doc is filled.** Document the side-by-side visual regression process itself as a reusable workflow. Include:
- Dual worktree + dual localhost setup (baseline:3000 / feature:3100)
- The QA matrix template (sections, components, baseline/feature/match columns)
- Keyboard interaction checklist by component category (forms, overlays, navigation, feedback)
- How to efficiently spot-check: what to compare first, what reveals most regressions fastest
- When to flag `Match = N` vs fix inline — decision criteria
- Lessons learned: which component categories had the most visual drift and why

**Why here:** This workflow applies to any future headless UI swap, theme migration, or major dependency upgrade across RDNA packages.

---

### Task 10: Final Hardening and Branch Readiness

**Files:**
- Modify: `packages/radiants/README.md`
- Modify: `docs/plans/2026-03-05-radiants-base-ui-internal-primitive-swap.md` (mark completed tasks if desired)

**Step 1: Write failing documentation check**

Identify missing docs in README (new dependency and architecture note) and mark as TODO.

**Step 2: Run verification to confirm docs gap**

Manual check: README has no mention of Base UI internal primitives.

Expected: FAIL (doc gap).

**Step 3: Write minimal documentation update**

Add section to `packages/radiants/README.md`:

```md
## Internal Primitive Engine

Interactive primitives in this package use `@base-ui/react` internally for accessibility and keyboard/focus behavior. Public `@rdna/radiants/components/core` APIs remain stable.
```

**Step 4: Run final full checks**

```bash
pnpm --filter @rdna/radiants test:components
pnpm --filter rad-os build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add packages/radiants/README.md
git commit -m "docs: document base-ui internal primitive engine in radiants"
```

---

## Definition of Done

- Public API for `@rdna/radiants/components/core` remains unchanged for consumers.
- Interactive primitives listed in this plan are Base UI-backed internally.
- Component tests cover core keyboard/focus/ARIA behavior.
- RadOS baseline (`:3000`) vs feature (`:3100`) comparison completed and documented.
- BrandAssets Components tab validated as primary visual regression gate.
- No unresolved `Match = N` items without explicit follow-up issues.
