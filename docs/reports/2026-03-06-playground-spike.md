# Playground Spike Report

**Date:** 2026-03-09
**Branch:** `feat/playground-phase0`
**Plan:** `docs/plans/2026-03-06-dna-playground-integration.md`

## Phase 0 Gate Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `apps/playground` runs locally | Pass | `tsc --noEmit` exits 0 (Select.tsx upstream error fixed). Dev server starts on port 3004. |
| 2 | 3 real Radiants components render on canvas | Pass | Registry exports Button, Card, Input from `@rdna/radiants/components/core`; ComponentNode renders via Suspense. |
| 3 | Claude can generate 1+ variation to disk | Pass | `claude --print` produced 106-line `button.iteration-1.tsx` with flat/bottom-border treatment. Route captures stdout, extracts fenced TSX blocks, writes to `iterations/`. Loader resolves both named and default exports so generated candidates render in compare mode. |
| 4 | Side-by-side baseline vs candidate comparison | Pass | ComparisonView renders BaselineComponent (left) vs CandidateComponent (right) with viewport presets. |
| 5 | Generated files pass RDNA lint | Pass | `verify:iterations` exits 0 on `button.iteration-1.tsx`. `eslint --config eslint.rdna.config.mjs` reports 0 RDNA violations. |
| 6 | Adopted variation doesn't break typecheck/lint | Pass | Adopt route runs ESLint + `tsc --noEmit`, validates filenames (path traversal, cross-component), rolls back on failure. |

## Verification Evidence

- **TypeScript**: `tsc --noEmit -p apps/playground/tsconfig.json` exits 0 (upstream Select.tsx error fixed in this branch)
- **RDNA lint**: `eslint --config eslint.rdna.config.mjs apps/playground/` — 0 violations
- **Generated code**: `button.iteration-1.tsx` passes both RDNA lint and `tsc --noEmit`
- **Unit tests**: 23/23 pass in `iteration-naming.test.ts` covering parse, sort, filter, and adoption validation
- **Shared logic**: `lib/iteration-naming.ts` extracted as single source of truth, imported by both `/api/generate` and `/api/adopt`
- **Live generation**: `claude --print` (v2.1.71) → 106-line TSX output → extracted and written to `iterations/button.iteration-1.tsx`

## What Was Built

- `apps/playground` — Next.js 16 workspace app with Radiants CSS (port 3004)
- ReactFlow canvas with drag-and-drop component nodes
- Manual registry for Button, Card, Input
- Claude-backed `/api/generate` route — captures `claude --print` stdout, extracts TSX code blocks, writes to `iterations/`
- Adoption `/api/adopt` route with lint + typecheck + automatic rollback
- Side-by-side comparison view with viewport presets
- Sun/Moon mode toggle
- RDNA review checklist UI
- Iteration prompt with DESIGN.md + schema context
- Verification script for generated code
- Shared `iteration-naming.ts` with 23 unit tests

## What Broke

- **`claude --print` doesn't write files**: Original route expected `claude --print` to write iteration files directly to disk. It outputs text to stdout only. Fixed by extracting fenced TSX code blocks from stdout and writing them in the route handler.
- **Export contract mismatch**: Prompt asks for named exports (`export function Button`), but loader only checked `mod.default`. Fixed by falling back to the first named function export when no default exists.
- **CVA not a direct dependency**: Generated iterations use `class-variance-authority`, which was only an indirect dep via `@rdna/radiants`. Added as direct dependency.
- **`@xyflow/react` missing type exports**: `OnDrop`/`OnDragOver` types don't exist — replaced with `React.DragEvent`.
- **`PRESETS` const narrowing**: Tailwind v4 `as const` array required explicit `ViewportPreset` union type for `useState`.
- **Select.tsx upstream error**: `props.value` on `HTMLProps<any>` in render callback — fixed by using `BaseSelect.Value` with `data-[placeholder]` styling.

## Go/No-Go Decision

**Go.** All 6 gate criteria pass with recorded evidence. No structural blockers.

## Recommended Next Steps

1. Start shared component registry (`docs/plans/2026-03-08-shared-component-registry.md`)
2. Replace manual `registry.tsx` with shared component metadata in `packages/radiants`
3. Point both playground and `DesignSystemTab` at the shared registry
