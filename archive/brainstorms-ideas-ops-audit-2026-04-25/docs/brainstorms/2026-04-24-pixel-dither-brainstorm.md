---
type: brainstorm
---

# Pixel Dither (1-bit Density Ramps) Brainstorm

**Date:** 2026-04-24
**Status:** Shipped in `feat/logo-asset-maker` — see commit `17fd1d4d` (AppWindow chrome overlay)

## Shipped As

- `@rdna/pixel/dither` — `packages/pixel/src/dither/{bayer,ramp,prepare,types}.ts`, exposed via `packages/pixel/src/dither.ts` barrel and `./dither` package subpath export.
- AppWindow consumer — `packages/radiants/components/core/AppWindow/AppWindow.tsx` (`CHROME_DITHER` module-scope ramp; overlay `<div data-appwindow-chrome-dither>` gated on `isStandardWindow`).
- Playground mode — `apps/rad-os/components/apps/pixel-playground/previews/DitherPreview.tsx` + `dither-code-gen.ts`.

**Predecessor:** `docs/brainstorms/2026-04-13-dither-pipeline-brainstorm.md` (this brainstorm commits to **Option A + Spike 1** from that doc — the lightweight CSS-pattern path — and makes it concrete.)

## What We're Building

A `dither` submodule in `@rdna/pixel` that generates 1-bit Bayer density ramps as tall `PixelGrid` bitstrings, delivered through the existing `bitsToMaskURI` → CSS `mask-image` pipeline. Plus a `dither` mode in `pixel-playground` for authoring/previewing/emitting these ramps. First consumer: replace the `AppWindow` shell's `linear-gradient(sun-yellow → cream)` with a stepped 1-bit dither ramp of yellow on cream.

## Why This Approach

`@rdna/pixel` has one rendering contract — `PixelGrid` bitstring → `bitsToPath` → `bitsToMaskURI` → CSS `mask-image` over a solid fill. Icons, corners, and patterns all use it. A Bayer density ramp is just a *tall* non-square `PixelGrid` (8 wide × `steps × matrix` tall) where each horizontal band uses a higher threshold on the same Bayer matrix. Reusing this contract means:

- Two-color output works via the same mask-over-solid trick (`background: cream`, masked fill: `sun-yellow`).
- Dynamic colors live-bind to CSS vars at call time (no per-palette asset explosion).
- The playground can render and code-gen dither tiles using the same `OneBitCanvas` + `PixelCodeOutput` it already uses.
- Zero GPU, zero canvas-at-runtime for consumers — pure CSS `mask-image`.

## Key Decisions

- **Shape:** stepped density ramp (not uniform overlay, not threshold-mapped smooth gradient).
- **Bayer matrix sizes supported:** 2×2, 4×4, 8×8, 16×16 (v1).
- **Step count:** configurable per ramp, default range 4–16 bands.
- **Direction (v1):** vertical only — `'up'` (dense→sparse bottom-up) or `'down'` (dense→sparse top-down).
- **Delivery:** SVG data-URI via existing `bitsToMaskURI`; tall `PixelGrid` with `maskRepeat: 'repeat'` horizontally, `'no-repeat'` vertically.
- **API sketch:**
  ```ts
  // @rdna/pixel/dither
  ditherRamp({
    matrix: 2 | 4 | 8 | 16,
    steps: number,        // 4..16
    direction: 'up' | 'down',
  }): { grid: PixelGrid; mask: MaskAsset; style: MaskHostStyle }
  ```
  Cached by `(matrix, steps, direction)` key. Colors are NOT baked in — consumers set `background-color` and a fill layer using any semantic tokens.
- **First consumer (`AppWindow.tsx:1190`):** replace the `linear-gradient(0deg, --color-window-chrome-from 0%, --color-window-chrome-to 100%)` shell background with a dither ramp. Light mode: `--color-sun-yellow` masked onto `--color-cream`. Dark mode already flattens both tokens to `--color-ink` → ramp becomes invisible (fine for v1; revisit later).
- **Playground mode:** new `dither` mode in `ModeNav`. Controls: matrix selector (2/4/8/16), step-count slider, direction toggle, optional fill/bg color pickers using RDNA tokens. Renders the ramp tile via `OneBitCanvas`, shows a scaled preview of it applied to a mock AppWindow shell, emits code via `PixelCodeOutput` (both the `ditherRamp({...})` call and the resulting class/style snippet for paste-in).

## Why Not The Alternatives

- **Uniform overlay (A):** doesn't read as a gradient replacement — loses the vertical top-heavy shape AppWindow currently has.
- **Threshold-mapped smooth gradient (C):** would need a real linear gradient + shader-like per-pixel compare; outside the 1-bit/CSS-mask contract.
- **Static tile assets (Q2-A):** any new matrix/step combo requires a build step; scales poorly against the "as many Bayer settings as possible" goal.
- **Canvas runtime (Q2-C):** heavier than necessary for static ramps, and the existing SVG-mask pipeline covers this cleanly.
- **Pre-baked Bayer masks + CSS layering (Q2-D):** close second, but step-count becomes awkward (mask-position math) and composes less cleanly with playground code-gen.

## Open Questions (Non-Blocking For Plan)

- **Dark mode:** ramp disappears when both chrome tokens flatten to `--color-ink`. Acceptable for v1. Follow-up: expose a `dark` variant (e.g., `--color-ink` → `--color-ink-dim`) or skip the ramp entirely when `from === to`.
- **Horizontal/diagonal direction:** out of v1 scope; easy to add (rotate the grid) once vertical is shipped.
- **Dithering *between* arbitrary semantic tokens (not just yellow/cream):** the API is already color-agnostic; verify a second consumer (e.g., a dithered button-hover shadow) after AppWindow lands.
- **Animation:** threshold sweep transitions (Spike 5 in the 2026-04-13 brainstorm) are out of v1 scope. Explore via the canvas fallback later.
- **Tile size tuning:** 8 wide × N tall may alias on high-DPR; may want `scale: 2` option in `maskHostStyle` for crispness.

## Worktree Context

- **Path:** `/Users/rivermassey/Desktop/dev/DNA-logo-maker`
- **Branch:** `feat/logo-asset-maker`

## Research Notes

- **AppWindow gradient to replace:** `packages/radiants/components/core/AppWindow/AppWindow.tsx:1190`.
- **Token chain:** `--color-window-chrome-from` (`tokens.css:138`) = `--color-sun-yellow`; `--color-window-chrome-to` (`tokens.css:139`) = `--color-cream`. Dark mode (`dark.css:126-127`) flattens both to `--color-ink`.
- **House rendering contract:**
  - `packages/pixel/src/path.ts` — `bitsToPath`, `bitsToMaskURI`.
  - `packages/pixel/src/mask.ts` — `buildMaskAsset`, `maskHostStyle` (supports `tiled` + `scale`).
  - `packages/pixel/src/renderer.ts` — canvas fallback for dynamic/animated cases.
- **Existing density-ramp precedents:** `packages/pixel/src/patterns/registry.ts` already ships `fill-75` / `fill-81` / `fill-88` / `fill-94` / `fill-97` as hand-authored 8×8 bands. The `dither` submodule generalizes these into a configurable Bayer ramp.
- **Playground surface:** `apps/rad-os/components/apps/pixel-playground/` already has `ModeNav`, `ToolPalette`, `OneBitCanvas`, `PixelPlaygroundControls`, `PixelCodeOutput`, `RegistryList` — add a `dither` mode alongside existing ones.
- **Prior survey:** `docs/brainstorms/2026-04-13-dither-pipeline-brainstorm.md` — Option A (CSS patterns, no GPU) and Spike 1 (CSS pattern shadows) are what this brainstorm commits to.
