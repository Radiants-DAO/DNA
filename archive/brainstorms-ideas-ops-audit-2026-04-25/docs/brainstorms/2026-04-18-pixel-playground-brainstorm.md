---
type: note
---

# Pixel Playground Brainstorm

**Date:** 2026-04-18
**Status:** Decided — ready for `/wf-plan`

## What We're Building

A 1-bit pixel-art authoring tool inside `BrandAssetsApp` that lets the user draft corner shapes, tiling patterns, and icons live, then copy out a paste-to-agent snippet that adds the asset to the appropriate registry in the codebase (`packages/pixel/src/shapes.ts`, `packages/pixel/src/patterns.ts`, `packages/radiants/pixel-icons/source.ts`).

Delivered as a new `Pixel` top-level tab in BrandAssets with three sub-modes (Corners / Patterns / Icons) sharing one editor shell. Built by forking the existing Studio app into a pared-down 1-bit-only component that reuses the vendored `@/lib/dotting` canvas.

## Chosen Approach

**Fork Studio → pared-down `PixelPlayground`, reuse `@/lib/dotting`.**

The heavy lifting (canvas rendering, brush-tool dispatch, undo/redo, grid, pan/zoom, Dot/Eraser/Fill/Line/Rect/Ellipse tools) is already implemented in `apps/rad-os/lib/dotting/`. We constrain dotting to two colors (FG `--color-ink` ↔ BG `--color-page`), strip layers and the multi-color palette, and wrap it in a mode-aware shell with a registry sidebar, a context-specific preview, and a `ComponentCodeOutput`-style copy panel.

**Why this over alternatives:**

- **Extract shared 1-bit primitive** (both Studio + Playground consume it): more work up front for a second consumer that may never materialize. Defer until a third surface needs it.
- **In-place Studio mode switch**: blurs Studio's identity (artistic painter vs registry authoring tool) and complicates its UI for both.
- **Build a fresh editor from scratch**: throws away `@/lib/dotting`'s mature tool dispatch and event handling.

## Layout

```
BrandAssets top nav:
  [Logos] [Color] [Fonts] [Pixel] [Components] [AI-Gen]
                           ^ new

Inside Pixel tab (4-region, UI-Library pattern):
┌───────────────────────────┬─────────────────────────────────┬────────────────────────┐
│ LEFT: registry sidebar    │ CENTER: canvas                  │ RIGHT-TOP: preview     │
│                           │                                 │                        │
│  [Corners] [Patterns]     │  ┌─────────────────────────┐    │  mode-specific:        │
│  [Icons]      ← subnav    │  │                         │    │   corners → mock       │
│                           │  │   <Dotting> canvas      │    │     AppWindow (4-way   │
│  Grid size: [8] ▲▼        │  │   fg/bg = 2-color       │    │     mirror preview)    │
│  Symmetry:                │  │                         │    │   patterns → tiled bg  │
│    [X] [Y] [◇] [⊕]        │  └─────────────────────────┘    │     on surface         │
│                           │                                 │   icons → size         │
│  ─── REGISTRY ───         │  ToolPalette (from dotting):    │     specimens (16/24)  │
│  [ + New ]                │   Dot Eraser Fill Line Rect     │                        │
│  ▣ solid                  │   Ellipse Select                │  FG/BG token picker:   │
│  ▣ diagonal               │                                 │   fg: [main ▾]         │
│  ▣ diamond                │  Undo Redo Grid                 │   bg: [page ▾]         │
│  ▣ ...                    │                                 │                        │
│                           │                                 ├────────────────────────┤
│                           │                                 │ RIGHT-BOT: output      │
│                           │                                 │                        │
│                           │                                 │  Output   [Copy]       │
│                           │                                 │  <pre>…</pre>          │
│                           │                                 │  [Prompt|Snippet|      │
│                           │                                 │   Bitstring|SVG]       │
└───────────────────────────┴─────────────────────────────────┴────────────────────────┘
```

## Key Decisions

- **Output flow:** clipboard-only, paste-to-agent. No server/registry writes. User clicks Copy → pastes the output in a future agent chat → that agent edits the registry file.

- **Scope (v1):** Corners + Patterns + Icons, all three modes in the same editor shell.

- **Tab placement:** new top-level `Pixel` tab in BrandAssetsApp between Fonts and Components. Three sub-tab buttons stack vertically in the left column (UI Library pattern), not horizontal `SubTabNav`.

- **Entry flow:** left column shows the full existing registry for the active mode as thumbnails (from `CORNER_SETS` / `PATTERN_REGISTRY` / `pixelIconSource`). Click a thumbnail = fork into canvas to edit. `+New` tile at top opens blank canvas at the mode's default grid size.

- **Corners target `shapes.ts`, not `PixelBorder`.** `PixelBorder` is circle-only (single int radius). Custom non-circular corners live in `packages/pixel/src/shapes.ts` (circle / chamfer / scallop / octagon / crenellation / sawtooth / notch) and are consumed via the `px()` helper + `.pixel-{shape}-{size}` CSS classes. New corners land here.

- **Corner canvas draws top-left only.** The user never authors four corners directly. The preview panel live-mirrors TL → TR/BL/BR onto a mock `AppWindow` so the mirrored result is always visible but never hand-edited.

- **Grid size is variable per mode with sensible defaults:**
  - Patterns: default 8×8 (range 4×4 → 16×16)
  - Icons: default 16×16 (range 8×8 → 32×32)
  - Corners: default 8×8 (range 2×2 → 24×24) — TL quarter only

- **Architecture:** fork Studio into a new component (`apps/rad-os/components/apps/pixel-playground/` or under a new BrandAssets subdirectory — decide in plan). Studio stays untouched as the multi-color painting app.

- **Reused from Studio/dotting (verbatim):** `<Dotting>` canvas, `useBrush` hook, ToolPalette (Dot/Eraser/Fill/Line/Rect/Rect-Filled/Ellipse/Ellipse-Filled/Select), EditorToolbar undo/redo + grid toggle, 3-column layout scaffolding.

- **Dropped from Studio:** LayerPanel, ColorPalette (10-color grid), Radnom button, 32×32 hard-lock on `minColumnCount`/`maxColumnCount`.

- **Added on top of dotting:**
  - Registry sidebar (left column)
  - Symmetry modes (mirror X / Y / diag / 4-way radial) — implemented as a post-stroke transform wrapping dotting's brush dispatch
  - FG/BG semantic-token picker (preview-only colorization; canvas stays 1-bit)
  - Preview-in-context island (mode-specific)
  - Output panel modeled on `ComponentCodeOutput` (`apps/rad-os/components/ui/ui-library/ComponentCodeOutput.tsx`): single `<pre>` block, bottom `ToggleGroup` for format, single Copy button that copies the active format.

- **Output formats (toggle):**
  - **Prompt** — natural-language instruction + registry snippet, ready to paste into an agent chat (e.g. "Add this pattern to PATTERN_REGISTRY in packages/pixel/src/patterns.ts under Figurative: { name: 'starfield', ... }")
  - **Snippet** — bare TS object literal (just the `{ name, width, height, bits }`)
  - **Bitstring** — monospace row-by-row visualization + the concatenated bits string
  - **SVG** — inline `<svg>` markup for paste-to-Figma/Slack

- **Deferred from v1:** shape-generator seeds (Bresenham / chamfer / scallop / etc. dropdowns), SVG/image import via `packages/pixel/src/import.ts`, animation/transition keyframe authoring.

- **Wireframing intent:** once the architecture lands, the tab itself is the sketchpad — multiple layout variations get tried live in the running app before the final polish pass.

## Open Questions (for `/wf-plan`)

- **File layout:** `apps/rad-os/components/apps/pixel-playground/` (sibling to `studio/`) vs `apps/rad-os/components/apps/BrandAssetsApp/pixel/` (nested under the host app). The latter matches the "lives only inside BrandAssets" framing; the former leaves the door open to expose it elsewhere.

- **Symmetry implementation:** mirror each individual dot-paint event (simpler, breaks for Rect/Ellipse/Line), or mirror the completed stroke as a post-transform on dotting's layer data (works with all tools, more complex). Lean toward post-stroke transform.

- **Output format for corners (Snippet tab):**
  - Option A — append to `shapes.ts` as a new named shape generator (best for reusable shapes like a custom crenellation variant)
  - Option B — emit an explicit `PixelCornerSet` literal (`{ name, tl: {width, height, bits}, border: {...} }`) as a one-off pre-registered entry
  - Option C — emit a custom-cells list + bounding radius for a future `PixelBorder` `customCells` prop (requires runtime component change)
  - Decide based on how the consuming CSS class system (`px()`) is expected to resolve custom corners.

- **Border grid for corners:** auto-derive from the cover grid (1px outer trace) at copy-time, or expose a second editable grid? Recommend auto-derive for v1 — matches how `generate.ts` already works; user can edit the generator output in a follow-up if needed.

- **Registry thumbnail rendering in left column:** use the runtime components (`<Pattern>`, `<PixelIcon>`, `<PixelBorder>`) or inline SVG from the bitstrings directly? Runtime components are higher fidelity but heavier; inline SVG is cheaper for a 50-thumbnail scroll list.

- **`+New` grid size:** start at the mode's default (8/16/8) or remember the last-used size for that mode via preferences slice?

- **FG/BG preview tokens:** restrict to semantic surface/content tokens (main/page/accent/line/sub/mute) or allow any `--color-*`?

- **Prompt output precision:** should the Prompt format hard-code the target file path (`packages/pixel/src/patterns.ts`) and category hint (`under Figurative`)? The category hint is not derivable from the bitstring — would need a category selector on the canvas.

- **Mobile fallback:** BrandAssetsApp has a mobile modal variant. Desktop only for v1, or collapse to a single-column tall layout on narrow widths?

- **Does this replace / relate to the existing standalone `pattern-playground` app?** That app is a picker, not an authoring tool — but two places to browse patterns is confusing. Option: keep pattern-playground, have Pixel link to it. Option: fold pattern-playground into Pixel and remove the standalone app.

## Worktree Context

- **Current checkout:** `/Users/rivermassey/Desktop/dev/DNA` on `main`.
- **Related worktree:** `/Users/rivermassey/Desktop/dev/DNA-pixel-art` on `feat/pixel-art-system` — that branch holds the big runtime pixel-system refactor (icon authoring, corner migration). Overlaps in philosophy but not in code: this playground is UI-only.
- **Recommended before `/wf-plan`:** spin up a dedicated worktree to keep the editor work separate from the runtime refactor.
  ```bash
  git worktree add ../DNA-pixel-playground -b feat/pixel-playground
  ```
- **Handoff path + branch** to record once created: `../DNA-pixel-playground` on `feat/pixel-playground`.

## Research Notes

- **BrandAssetsApp host:** `apps/rad-os/components/apps/BrandAssetsApp.tsx:484-504` — top-level tabs use `AppWindow.Nav` with `useState('logos')`. Adding a `Pixel` tab is a one-line addition to `TABS` + a new branch in the renderer below.
- **UI Library layout to mirror:** `apps/rad-os/components/ui/UILibraryTab.tsx:555-596` — 3-column (navigator / gallery / props+code) with border-rule separators. Our left column replaces navigator with sub-tab buttons + registry list.
- **Output panel reference:** `apps/rad-os/components/ui/ui-library/ComponentCodeOutput.tsx` — header with Copy, `<pre>` body, bottom `ToggleGroup` for format. Direct model for our output island.
- **Studio shell to fork:** `apps/rad-os/components/apps/studio/PixelArtEditor.tsx` — entry; `CanvasArea.tsx` wraps `<Dotting>` with `minColumnCount`/`maxColumnCount` locked to 32 — change to mode-driven; `ToolPalette.tsx` enumerates `TOOL_DEFS` from `constants.ts`, all of which are 1-bit-friendly; `ColorPalette.tsx` + `LayerPanel.tsx` are dropped.
- **Dotting primitives:** `apps/rad-os/lib/dotting/` — `<Dotting>` component, `useBrush` hook, `BrushTool` enum (DOT/ERASER/PAINT_BUCKET/LINE/RECTANGLE/RECTANGLE_FILLED/ELLIPSE/ELLIPSE_FILLED/SELECT/NONE).
- **Registry sources (all consumed by the left sidebar):**
  - `packages/pixel/src/patterns.ts` — `PATTERN_REGISTRY` (50 × 8×8 named patterns; `PatternName` type; `getPattern(name)`).
  - `packages/radiants/pixel-icons/source.ts` — `pixelIconSource` (4 × 16×16 entries currently — big gap, primary use case for icon authoring).
  - `packages/pixel/src/shapes.ts` — corner shape registry (circle / chamfer / scallop / octagon / crenellation / sawtooth / notch generators; each takes `gridSize`).
  - `packages/pixel/src/corner-sets.ts` — `CORNER_SETS` (Bresenham xs/sm/md/lg/xl; generated, not hand-authored).
- **Current corner runtime:** `packages/radiants/components/core/PixelBorder/PixelBorder.tsx` takes `radius: number` and computes `clip-path: polygon(...)` + 1px border staircase at render time. Circle-only, no custom cells. Multi-shape corners still run through `packages/pixel/src/px.ts` + `.pixel-{shape}-{size}` CSS classes from the old clip-path generator.
- **Sibling brainstorm:** `docs/brainstorms/2026-04-18-logo-asset-maker-brainstorm.md` — uses `PATTERN_REGISTRY` as a source (consumer); Pixel Playground is the tool that feeds that registry.
- **Related big plan:** `docs/plans/2026-04-15-pixel-art-system-plan-rewrite-from-stash.md` on `feat/pixel-art-system` — runtime/migration work. Distinct from this UI tool.
