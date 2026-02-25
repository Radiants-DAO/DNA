# RDNA Polish Pass Brainstorm

**Date:** 2026-02-24
**Status:** Decided

## What We're Building

A phased polish pass to make the codebase match DESIGN.md. Foundation tokens first, then component refactors, then app-level cleanup. Each phase is independently shippable.

## Why This Approach

The DESIGN.md defines the target. The codebase has ~15 concrete deviations from that target (duplicate tokens, wrong sizes, missing scales, ad-hoc z-indexes, raw brand tokens in components). Foundation-first means we fix the token layer before touching components — prevents chasing a moving target.

## Key Decisions

### Phasing
- **Phase 1: Token Foundation** — token fixes, new scales, visual review gate
- **Phase 2: Component Refactor** — one component per commit, CVA adoption, semantic enforcement
- **Phase 3: App-Level Cleanup** — z-index enforcement, shadow rename migration, RadTools name cleanup

### Phase 1 Scope
1. Kill `--color-warm-cloud` → consolidate to `--color-cream`
2. Remove 3 dead tokens (`success-green-dark`, `warning-yellow-dark`, `error-red-dark`)
3. Fix `--color-content-secondary` to 85% opacity in light mode
4. New rem-based type scale (0.25rem grid, no `sm`, root clamp)
5. Fix `--duration-scalar` for reduced-motion
6. Define z-index tokens in `@theme`
7. Define new shadow elevation tokens (alongside old names — old names removed in Phase 2)
8. Pointer-events audit on all full-viewport overlays
9. **Visual review gate** — spin up dev, check key screens, fix regressions before Phase 2

### Phase 2 Scope
- Add CVA as dependency of `@rdna/radiants`
- Refactor all 24 components one at a time (one commit each)
- Per component: CVA variants, semantic tokens only, 1px borders, correct size scale, new shadow elevation names
- Each commit = one component fully aligned with DESIGN.md

### Phase 3 Scope
- Z-index enforcement in rad-os app components (Desktop, Taskbar, StartMenu, Toast, MobileAppModal)
- Remove old shadow token names (after Phase 2 migrated all usages)
- RadTools → RDNA name cleanup (6 files, already scoped)

### Process
- **Branch strategy**: Direct on main (solo project, fix forward)
- **Shadow rename**: New elevation tokens defined in Phase 1 alongside old names. Components migrate in Phase 2. Old names removed in Phase 3.
- **CVA**: Dependency of `@rdna/radiants` package (not peer or app-level)
- **Component refactor**: One commit per component (24 total). Maximum reviewability.

## Open Questions

- None — all decisions made. Ready for implementation planning.

## Research Notes

### Source Documents
- `packages/radiants/DESIGN.md` — canonical target (1109 lines, 20 sections)
- `docs/brainstorms/2026-02-24-rdna-design-md-brainstorm.md` — 26 design decisions
- Session miner findings — 6 hard-won rules (z-index, pointer-events, icons, CSS units, dark mode completeness, font source)

### Files to Modify (Phase 1)
- `packages/radiants/tokens.css` — type scale, color tokens, shadow elevation tokens, z-index tokens
- `packages/radiants/dark.css` — content-secondary override, shadow overrides
- `packages/radiants/base.css` — duration-scalar fix, root clamp
- `packages/radiants/typography.css` — font size updates
- `apps/rad-os/components/Rad_os/Desktop.tsx` — pointer-events audit, z-index fixes
- `apps/rad-os/components/Rad_os/Taskbar.tsx` — z-index fix
- `apps/rad-os/components/Rad_os/StartMenu.tsx` — z-index fix
- `apps/rad-os/components/Rad_os/MobileAppModal.tsx` — z-index fix
- `apps/rad-os/components/Rad_os/InvertOverlay.tsx` — z-index fix

### Inconsistencies to Fix (from design audit)
1. `--color-cream` / `--color-warm-cloud` duplication
2. Ghost button hover uses raw `bg-sun-yellow`
3. Tab pill inactive uses raw `bg-cream`
4. All button sizes resolve to same h-8
5. `--font-size-sm` and `--font-size-base` both 14px
6. `--duration-scalar` defined but unused
7. Dead tokens (3)
8. Border-2 on Dialog/Alert
9. `content-primary` = `content-secondary` in light mode
10. Ad-hoc z-index values throughout
11. Missing pointer-events: none on viewport overlays
12. Old shadow names (btn, card, card-lg) need migration to elevation names
