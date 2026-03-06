---
title: Visual Regression Workflow for Component Migrations
category: tooling
date: 2026-03-05
tags: [visual-regression, qa, component-migration, headless-ui, base-ui, worktree, testing]
---

# Visual Regression Workflow for Component Migrations

## Symptom

When swapping internal primitives (e.g., custom implementations to a headless UI library like `@base-ui/react`), automated unit tests pass but visual and interaction regressions slip through. Components render differently, animations break, overlays misposition, or keyboard flows change in ways that only surface during live testing in the host application.

## Investigation

During the Radiants Base UI internal primitive swap, the team discovered that unit tests alone were insufficient to catch the full spectrum of regressions. The migration touched 14 components across 4 categories (Forms, Navigation, Overlays, Feedback). Automated tests validated ARIA semantics and keyboard handlers in isolation, but the following classes of regression only appeared in the running application:

1. **Layout regressions**: Base UI Slider's `Indicator` part + sr-only thumb element added unexpected height to the slider track, making the thumb appear oversized.
2. **Composition regressions**: Toast was re-implemented with custom markup instead of composing the existing Alert component, breaking visual consistency.
3. **CSS tooling regressions**: Sheet slide transitions broke because dynamic Tailwind class interpolation (`data-[starting-style]:${variable}`) was not detected by the Tailwind scanner, producing missing utility classes.
4. **Positioning regressions**: Select dropdown rendered via a fixed-position Portal instead of scrolling with its trigger, breaking in-context placement inside scrollable containers.

These four patterns are representative of what headless UI swaps commonly introduce.

## Root Cause

Visual regressions in headless UI migrations stem from a fundamental mismatch: the new library's internal DOM structure, portal strategy, and CSS hooks differ from the original implementation, even when the public component API is preserved. Unit tests validate behavior (keyboard, ARIA, state), but they run in jsdom where layout, animation, scroll position, and CSS class generation do not exist.

A structured side-by-side visual comparison process is needed to bridge this gap.

## Solution

### 1. Dual-Localhost Setup

Run the baseline (pre-migration) and feature (post-migration) versions of the app simultaneously on different ports.

**When a baseline worktree IS needed:**
- The feature branch has diverged from `main` and `main` has received other changes
- You need a clean, unmodified baseline for comparison
- Multiple developers are working on the same branch

```bash
# Create baseline worktree from main
git fetch origin
git worktree add ../DNA-main origin/main

# Terminal A — baseline on :3000
cd ../DNA-main
pnpm --filter rad-os dev -- --port 3000

# Terminal B — feature on :3100
cd /path/to/DNA
pnpm --filter rad-os dev -- --port 3100
```

**When a baseline worktree is NOT needed:**
- `main` has not changed since the feature branch was created
- You can use the deployed production/preview URL as baseline
- The feature branch is the only active work and you can `git stash` to toggle

In the Radiants Base UI migration, main had not changed, so no separate worktree was created. The feature branch dev server on `:3000` served as both baseline (before each component swap) and feature (after).

### 2. QA Matrix Template

Create a component regression matrix at the start of migration, before any code changes. This becomes the acceptance gate.

```markdown
# [Project] Visual Regression Matrix

## Environment
- Baseline: http://localhost:3000
- Feature: http://localhost:3100
- Primary surface: [App] -> [Route/Tab where components are rendered]

## Component Regression Matrix
| Section | Component | Baseline Behavior | Feature Behavior | Match (Y/N) | Notes |
|---------|-----------|-------------------|------------------|-------------|-------|
| Forms | Select | [describe baseline] | | | |
| Forms | Checkbox/Radio | [describe baseline] | | | |
| Forms | Switch/Slider | [describe baseline] | | | |
| Navigation | Tabs | [describe baseline] | | | |
| Overlays | Dialog | [describe baseline] | | | |
| Overlays | Sheet | [describe baseline] | | | |
| Overlays | DropdownMenu | [describe baseline] | | | |
| Overlays | Popover | [describe baseline] | | | |
| Feedback | Tooltip | [describe baseline] | | | |
| Feedback | Toast | [describe baseline] | | | |
```

**Process:**
1. Fill the "Baseline Behavior" column first by testing each component in the running app. Record keyboard interactions, visual appearance, and any notable behavior.
2. Leave "Feature Behavior" and "Match" empty until after migration.
3. After migration, fill Feature columns by repeating the same tests.
4. Mark `Y` or `N` with concrete notes explaining any delta.

### 3. Keyboard Interaction Checklist by Category

Test these keyboard interactions in order of regression likelihood (highest risk first):

**Overlays (highest regression risk)**
- Dialog: focus trap cycles within content; Escape closes; backdrop click closes; focus returns to trigger on close
- Sheet: Escape closes; backdrop click closes; slide animation plays on open/close
- Popover: trigger click toggles; outside click closes; Escape closes
- DropdownMenu: trigger click opens; ArrowDown/Up navigates items; Enter activates; Escape closes
- ContextMenu: right-click opens; arrow navigation works; Enter selects

**Forms (high regression risk)**
- Select: trigger opens on click/Enter/Space; ArrowDown/Up navigates options; Enter selects; Escape closes without change
- Checkbox/Radio: Space toggles; label click toggles; onChange fires with correct value
- Switch: Space/Enter toggles; disabled state blocks interaction
- Slider: ArrowLeft/Right adjusts by step; Home/End jump to min/max

**Navigation (moderate regression risk)**
- Tabs: ArrowLeft/Right moves focus between triggers; active panel updates; Tab key exits tab list into panel
- Accordion: Enter/Space toggles panel; aria-expanded reflects state

**Feedback (lower regression risk)**
- Tooltip: appears on hover and focus; disappears on blur and mouseleave
- Toast: appears with role=alert; close action dismisses; auto-dismiss timer works

### 4. Regression Priority Order

Check components in this order to find regressions fastest:

1. **Overlays first** — Portal rendering, focus management, and z-index stacking are where headless UI swaps diverge most from custom implementations. These regressions are also the most user-visible.
2. **Forms second** — Value semantics, controlled state, and hidden input behavior differ between libraries. Select is historically the trickiest.
3. **Navigation third** — Tabs and Accordion are structurally simpler but keyboard behavior deltas surface here.
4. **Feedback last** — Tooltip and Toast are generally the most stable through swaps, but animation timing and positioning can drift.

### 5. Common Visual Regression Patterns from Headless UI Swaps

| Pattern | Example | Detection Method |
|---------|---------|-----------------|
| **Extra DOM nodes** | Base UI adds wrapper elements (Indicator, sr-only thumb) that affect layout | Visual size comparison; inspect element count |
| **Portal positioning** | Dropdowns/selects render in a fixed portal instead of flowing with trigger | Scroll the page while overlay is open |
| **Missing CSS classes** | Dynamic Tailwind classes using template literals aren't detected by the scanner | Check for unstyled elements; inspect computed styles |
| **Animation breakage** | Transition classes reference data attributes that changed names | Open/close overlays; check for missing enter/exit transitions |
| **Composition breaks** | New implementation duplicates markup instead of composing existing components | Visual inconsistency with other components using the same base |
| **ARIA role changes** | Library uses different roles (e.g., `combobox` vs `listbox` for select) | Screen reader testing; inspect role attributes |

### 6. Decision Criteria: Fix Inline vs Create Ticket

**Fix inline when:**
- The regression is in a component you are actively migrating
- The fix is localized (CSS adjustment, prop mapping, class preservation)
- The fix can be verified immediately on the dev server
- The regression blocks testing of other components (e.g., broken Dialog blocks testing DropdownMenu inside Dialog)

**Create a ticket when:**
- The regression is in a component outside the current migration scope
- The fix requires architectural changes (e.g., rethinking the portal strategy)
- The regression is cosmetic and does not block further testing
- The fix requires coordination with other team members or packages

In the Base UI migration, all four discovered regressions were fixed inline because they were within scope and could be verified immediately. The rule of thumb: if you can fix and re-verify in under 15 minutes, fix inline.

## Prevention

For future component migrations (headless UI swaps, major dependency upgrades, theme overhauls):

1. **Create the QA matrix before writing any migration code.** The baseline behavior documentation is itself a deliverable — it catches assumptions about current behavior.
2. **Record baseline keyboard interactions explicitly.** Do not assume you know how the current implementation behaves. Test and document.
3. **Test overlays in scrollable containers.** Portal and positioning regressions only appear when the trigger is not at the top of the viewport.
4. **Avoid dynamic Tailwind class interpolation.** Use complete literal class strings or safelist patterns. Template literals like `` `data-[starting-style]:${direction}` `` will silently fail.
5. **Compose existing components.** When the new library provides a primitive (e.g., Toast), wrap it with the existing visual component (e.g., Alert) rather than re-implementing the visual layer.
6. **Run the dual-localhost comparison after each component category**, not just at the end. Catching regressions early is cheaper than debugging a batch of failures.

## Related

- [QA matrix template](../../qa/2026-03-05-radiants-base-ui-visual-compare.md) — the actual checklist used during this migration
- Base UI migration plan: archived in `_references/dna-completed-plans/2026-03-05-radiants-base-ui-internal-primitive-swap.md` (outside repo); use it for the original dual-localhost setup and task structure
- [Vitest component harness](./vitest-component-harness-pnpm-monorepo.md) — the automated test infrastructure that complements visual regression
- DNA component pattern: `Component.tsx` / `Component.schema.json` / `Component.dna.json`
