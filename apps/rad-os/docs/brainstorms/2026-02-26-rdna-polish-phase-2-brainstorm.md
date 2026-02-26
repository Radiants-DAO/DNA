# RDNA Polish Phase 2 — Component Refactors Brainstorm

**Date:** 2026-02-26
**Status:** Decided

## What We're Building

A tiered component refactor pass across all 25 radiants core components. Each component gets CVA variant definitions, the correct DESIGN.md size scale, semantic tokens only (no raw brand tokens), new elevation shadow names, and standardized Sun/Moon interaction patterns (lift in Sun Mode, glow in Moon Mode). All Moon Mode overrides are CSS-only via dark.css selectors — no runtime dark mode detection.

## Why This Approach

Phase 1 stabilized the token foundation. Phase 2 applies it. The interaction audit revealed that only 2 of 25 components (Button, Switch) have proper Sun/Moon dual-mode interactions. The rest are missing hover states, focus rings, dark mode styling, or all three. CVA adoption gives us type-safe variants at the same time we fix the interaction gaps — one pass, not two.

Tiered batches (high-traffic first) mean we ship the most visible improvements earliest and catch integration issues before touching lower-traffic components.

## Key Decisions

### Interaction Strategy: CSS-Only
- All Moon Mode interaction overrides live in `dark.css` via `data-*` attribute selectors
- No `useDarkMode()` hook extraction — Switch gets refactored to use CSS-only like Button
- Pattern: `[data-variant="primary"]` in dark.css handles hover glow, active glow, border transitions
- Components set `data-variant` and `data-size` attributes; dark.css does the rest

### Tiered Batches
- **Tier 1 (high-traffic):** Button, Input, Select, Tabs, Card, Switch — 6 components
- **Tier 2 (containers):** Dialog, Sheet, Accordion, DropdownMenu, Toast, Alert, Popover — 7 components
- **Tier 3 (remaining):** Checkbox, Breadcrumbs, ContextMenu, Badge, HelpPanel, Tooltip, Progress, Slider, Divider, CountdownTimer, Web3ActionBar, MockStatesPopover — 12 components
- Each tier is a shippable batch with a visual review gate

### Per-Component Refactor Checklist
Every component refactor must:
1. Rewrite variants with CVA (`class-variance-authority`)
2. Fix size scale per DESIGN.md (sm=h-6, md=h-8, lg=h-10 for interactive elements)
3. Replace all raw brand tokens with semantic tokens
4. Replace old shadow names (shadow-btn → shadow-resting, shadow-card → shadow-raised, shadow-card-lg → shadow-floating)
5. Add `focus-visible:ring-2 ring-edge-focus ring-offset-1` to all interactive elements
6. Add `data-variant` attribute for dark.css targeting
7. Ensure 1px borders only (`border`, never `border-2`)
8. Add dark.css Moon Mode interaction overrides (glow + border transitions)

### Shadow Name Migration
- Happens during Phase 2 as each component is touched
- shadow-btn → shadow-resting, shadow-btn-hover → shadow-raised
- shadow-card → shadow-raised, shadow-card-lg → shadow-floating
- shadow-inner → shadow-inset
- Old token definitions stay in tokens.css until Phase 3 removes them

### CVA as Dependency
- Add `class-variance-authority` to `@rdna/radiants` package.json `dependencies` (not peer)
- Every component exports its variants for consumer composition: `export { buttonVariants }`

### Sun/Moon Interaction Pattern
**Sun Mode (CSS in component):**
- Hover: translate-Y lift + shadow elevation increase
- Active: half-lift + base shadow
- Focus: ring-2 ring-edge-focus

**Moon Mode (dark.css overrides):**
- Rest: ink bg, muted border, no shadow
- Hover: border → edge-hover, box-shadow → glow-sm/md
- Active: border → edge-focus, box-shadow → glow-md/lg
- Focus: ring-2 ring-edge-focus (same in both modes)

### Button Size Fix
- Bundled with CVA adoption (sizes are currently all identical at h-8)
- Target: sm=h-6 px-2 text-xs, md=h-8 px-3 text-sm, lg=h-10 px-4 text-base
- Icon-only: sm=w-6 h-6, md=w-8 h-8, lg=w-10 h-10

## Open Questions

- None — all decisions made. Ready for planning.

## Worktree Context

- Path: `/Users/rivermassey/Desktop/dev/DNA` (primary checkout)
- Branch: `main` (fix-forward, solo project)

## Research Notes

### Interaction Audit Results (from this session)
- **Gold standard:** Button (CSS-driven, dark.css overrides) and Switch (runtime useDarkMode)
- **Best app-level:** DesktopIcon (full Sun/Moon dual-mode with shadow-glow tokens)
- **Biggest gaps:** All bare trigger buttons (Dialog, Sheet, Popover, HelpPanel) have zero interaction styling. Select Trigger, Tabs Trigger, and Accordion Trigger missing focus-visible. NFTCard has keyboard handlers but no focus ring.

### Component Inventory (25 total)
Accordion, Alert, Badge, Breadcrumbs, Button, Card, Checkbox, ContextMenu, CountdownTimer, Dialog, Divider, DropdownMenu, HelpPanel, Input, MockStatesPopover, Popover, Progress, Select, Sheet, Slider, Switch, Tabs, Toast, Tooltip, Web3ActionBar

### Files to Modify
- `packages/radiants/package.json` — add CVA dependency
- `packages/radiants/components/core/*/` — 25 component directories
- `packages/radiants/dark.css` — add Moon Mode interaction selectors per component
- `packages/radiants/DESIGN.md` — fix stale text-sm DON'T warning (line 409)

### Pre-Existing Issues to Fix During Refactor
- Button sizes all identical (sm=md=lg=h-8)
- typography.css code element uses raw brand tokens (text-ink, bg-cream)
- tokens.css still has --spacing-* custom tokens (DESIGN.md says use native Tailwind grid)
- MockStatesPopover uses entirely inline styles with hardcoded colors
- 13 components missing focus-visible rings on interactive elements
- 8 components have zero dark mode styling
