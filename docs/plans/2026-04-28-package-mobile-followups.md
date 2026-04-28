# Package And Mobile Follow-Ups Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Continue cleanup after the RadOS lint baseline is green without starting a high-risk package reorg too early.

**Architecture:** Keep `@rdna/radiants` intact until package boundaries are explicit and tested. Take low-risk mobile wins in `AppWindow` and app surfaces first, because they improve product quality without changing package imports.

**Tech Stack:** pnpm workspaces, Next.js/RadOS, React 19, Tailwind v4, `@rdna/radiants`, `@rdna/ctrl`, `@rdna/pixel`, Vitest.

---

## Current Checkpoint

- Root gates now pass: `pnpm lint`, `pnpm test:ci`, and `pnpm build`.
- RadOS lint compatibility includes the currently referenced RDNA rule names.
- CommandPalette has Radix title/description wiring.
- `AppWindow.Content` allows empty content, matching existing empty shell usage.
- Dev-only RadOS pages are under `/dev/*`; public preview links were updated.

## Recommended Order

1. Mobile/AppWindow low-risk wins.
2. Package strategy decision and package-boundary tests.
3. ESLint plugin extraction prework.
4. Direct-import/eject/update integration.
5. Larger package moves.

Do not start a broad package split before item 2 is written down and reviewed.

## Task 1: AppWindow Container Breakpoints

**Files:**
- Modify: `packages/radiants/components/core/AppWindow/AppWindow.tsx`
- Modify: `packages/radiants/components/core/AppWindow/appwindow.css`
- Test: `packages/radiants/components/core/AppWindow/AppWindow.test.tsx`

**Steps:**
1. Add a container query root to the AppWindow shell/content area.
2. Collapse `split`, `sidebar`, and `three` content layouts by AppWindow width, not viewport width.
3. Keep fullscreen/desktop behavior unchanged above desktop-sized widths.
4. Add tests asserting the shell exposes the responsive container attributes/classes.
5. Run `pnpm --filter @rdna/radiants test -- AppWindow`.
6. Run `pnpm lint && pnpm test:ci && pnpm build`.
7. Commit as `feat(radiants): add app window container breakpoints`.

## Task 2: Control Surface Narrow-Width Behavior

**Files:**
- Modify: `packages/radiants/components/core/AppWindow/AppWindow.tsx`
- Modify: `packages/radiants/components/core/AppWindow/appwindow.css`
- Test: `packages/radiants/components/core/AppWindow/AppWindow.test.tsx`

**Steps:**
1. Define how left/right rails behave below narrow AppWindow widths: collapse to bottom, overlay, or tab-only.
2. Prefer a prop-free default if existing rails can adapt from container width.
3. Verify PixelPlayground and Studio still render their rail controls.
4. Run AppWindow tests plus `pnpm --filter rad-os test -- test/pixel-playground-layout.test.ts test/studio-layers-rail.test.ts`.
5. Commit as `feat(radiants): adapt app window rails at narrow widths`.

## Task 3: Easy Mobile App Surface Pass

**Files:**
- Modify: `apps/rad-os/components/apps/PreferencesApp.tsx`
- Modify: `apps/rad-os/components/apps/pixel-playground/PixelPlayground.tsx`
- Modify: `apps/rad-os/components/apps/studio/PixelArtEditor.tsx`
- Modify as needed: app-specific tests under `apps/rad-os/test/`

**Steps:**
1. Audit only the apps already touched by the cleanup branch.
2. Replace viewport assumptions with AppWindow/container-aware layout classes.
3. Keep app workflows intact; avoid content redesign.
4. Add source or render tests for any structural layout change.
5. Run focused RadOS tests, then root gates.
6. Commit as `fix(rad-os): improve narrow app window layouts`.

## Task 4: Package Strategy Decision

**Files:**
- Modify: `docs/plans/2026-04-27-radiants-package-split.md`
- Modify or create: `docs/plans/2026-04-28-rdna-package-map.md`

**Decision to record:**
- `@rdna/pixel` owns pixel-engine functions and subpaths such as `corners`, `patterns`, `icons`, and `dither`.
- `@rdna/ctrl` remains the dense control-surface package.
- `@rdna/os` is plausible for first-class OS/app-shell components, but only after RadOS components are stable enough to promote.
- Theme packages should use a single clear pattern before moving files: either `packages/themes/*` with compatible package names, `@rdna/theme-*`, or one `@rdna/theme` package with subpath exports.
- `@rdna/dither` from the dithwather repo should stay deferred or land as a documented stub only.
- Direct-import plus `rdna-eject`/`rdna-update` should be integrated after package names stabilize.

**Steps:**
1. Write the package map.
2. Include a migration order and compatibility policy.
3. Explicitly answer Monolith/SKR support.
4. Commit docs only as `docs: define rdna package map`.

## Task 5: ESLint Plugin Extraction Prework

**Files:**
- Modify: `eslint.rdna.config.mjs`
- Modify: `scripts/lint-design-system-staged.mjs`
- Modify: `scripts/report-new-rdna-exceptions.mjs`
- Modify: `packages/radiants/eslint/index.mjs`
- Test: `packages/radiants/eslint/__tests__/*`

**Steps:**
1. Remove direct root imports of `packages/radiants/eslint/*` internals where practical.
2. Decide how RDNA rule contract data is loaded: generated snapshot, exported Radiants contract, or config path.
3. Add tests for whichever contract source is chosen.
4. Do not move the plugin package yet unless the prework stays small.
5. Run `pnpm lint && pnpm test:ci`.
6. Commit as `refactor(eslint): prepare rdna plugin boundary`.

## Task 6: Direct-Import/Eject Branch Review

**Reference:**
- `/Users/rivermassey/Desktop/dev/DNA-direct-import/docs/plans/2026-04-16-direct-import-model.md`

**Steps:**
1. Review the direct-import branch after the package map exists.
2. Keep library-first imports as the default.
3. Preserve `rdna-eject` provenance metadata.
4. Rebase only the pieces that still match current package names.
5. Add a dedicated test pass for deep imports and ejected metadata.
6. Commit as one or more focused package/tooling commits.

## Decision-Gated Backlog

- Decide whether `[data-theme='skr']` remains supported.
- Decide whether `@rdna/monolith` becomes a theme package, folds into the theme family, or is removed.
- Fix `@rdna/ctrl` LayerRow React `act(...)` warnings.
- Triage deferred dependency upgrades on dedicated branches.
- Confirm whether `ops/paper-assets/item58`, the tabs refactor plan, and the skills cleanup plan remain active.
