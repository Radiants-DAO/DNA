# Pretext Layout Editor Brainstorm

**Date:** 2026-03-28
**Status:** Decided

## What We're Building

An InDesign-style **inspector panel for pretext layouts** — a control surface within `@rdna/controls` that surfaces wrap settings, obstacle offsets, column geometry, and font specs for elements already rendered in the DOM by a pretext-powered component. Not a canvas editor. The layout already exists (e.g., GoodNewsApp's newspaper spread). This tool lets you hover elements to see an overlay, click to inspect, tweak spatial settings live (with pretext re-layout on every change), and export a descriptor for LLM consumption.

Think DialKit for spatial typography — same pattern (visual tool → dial in values → copy result → LLM reads and applies), but the "knobs" are wrap sides, offsets, contour types, column widths, and font specs instead of scalar sliders.

## Why This Approach

Pretext gives you per-line layout control that CSS can't — but there's no visual authoring surface for it. You have to manually write `computeLayout()` functions, guess at obstacle geometry, and iterate by refreshing the browser. InDesign solves this with a Text Wrap panel + direct selection. We bring that same workflow to the web:

1. **Hover** an element in your pretext layout → DOM overlay highlights it (same pattern as interface-kit / agentation)
2. **Click** → inspector panel pops up with that element's settings
3. **Tweak** wrap side, offsets, contour, font, line height → pretext re-layouts live
4. **Copy** the layout descriptor → paste into an LLM conversation (or a pretext-aware skill) → LLM writes/edits the code

No code generation in the editor itself. The editor is the interface; the LLM is the code-gen backend.

## Key Decisions

- **Lives in `@rdna/controls`** as a subpath export (`@rdna/controls/pretext`). Tree-shakeable — consumers who don't use pretext don't pay for it. `@chenglou/pretext` is a peer dependency of this entrypoint only.
- **Pretext-only scope** — no CSS column/float fallback mode. This targets `layoutNextLine()` consumers exclusively.
- **DOM overlay selection model** — hover shows outline, click opens inspector. Same UX as interface-kit/agentation. No separate canvas. The consumer's existing pretext DOM *is* the canvas.
- **Live pretext reflow** — the editor actually runs `prepareWithSegments` + `layoutNextLine` on changes. True WYSIWYG, not placeholder lines.
- **Consumer registration API** — the host component registers its elements (columns, obstacles, text blocks) with refs and initial settings. The inspector reads and writes through this registration.
- **Output format** — Layout descriptor JSON (directly translatable to pretext API calls) + optional screenshot. Designed for LLM interpretation, not direct code paste.

## InDesign Text Wrap Panel Mapping

The InDesign Text Wrap panel maps directly to pretext's `layoutNextLine(prepared, cursor, maxWidth)` model:

| InDesign setting | Pretext equivalent | Inspector control |
|---|---|---|
| Wrap To: Left Side | `lineW = obstacle.x - offset - col.x` | Select dropdown |
| Wrap To: Right Side | `lineX = obstacle.right + offset` | Select dropdown |
| Wrap To: Both Sides | Two `layoutNextLine` calls per y-band | Select dropdown |
| Wrap To: Largest Area | `Math.max(leftAvail, rightAvail)` | Select dropdown |
| Offset (top/right/bottom/left) | Margin added to obstacle bounds before computing available width | 4x numeric inputs (linked/unlinked) |
| Contour: Bounding Box | Rectangular obstacle — simple `if (y >= top && y < bottom)` | Select dropdown |
| Contour: Object Shape | Per-scanline polygon hull (already implemented in GoodNewsApp via `getWrapHull`) | Select dropdown |
| Invert | Text flows *inside* the obstacle shape, not outside | Toggle |

Additional settings not in InDesign but needed for pretext:

| Setting | Purpose | Control |
|---|---|---|
| Font string | `prepare()` font parameter | Text input + font picker |
| Line height | Vertical advance per line | Numeric input |
| Max column height | Column overflow threshold | Numeric input |
| Column width | `maxWidth` base value | Numeric input (or drag column edge) |
| Column x position | Horizontal offset | Numeric input |

## Consumer API Sketch

```tsx
import { PretextInspector, usePretextSurface } from '@rdna/controls/pretext';

function MyEditorialLayout() {
  const logoRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  const surface = usePretextSurface({
    columns: [
      { id: 'left', x: 16, width: 180 },
      { id: 'center', x: 210, width: 340 },
      { id: 'right', x: 564, width: 180 },
    ],
    obstacles: [
      { id: 'logo', ref: logoRef, wrap: 'rightSide', offsets: [8, 8, 8, 8], contour: 'polygon' },
      { id: 'hero', ref: heroRef, wrap: 'both', offsets: [0, 12, 12, 12], contour: 'boundingBox' },
    ],
    textBlocks: [
      { id: 'body', font: '16px Mondwest', lineHeight: 19.2 },
    ],
    onLayoutChange: (descriptor) => {
      // Called on every setting change — triggers pretext re-layout in host
    },
  });

  return (
    <>
      {/* Your existing pretext layout */}
      <div>{/* ... rendered lines, obstacles, etc. */}</div>

      {/* The inspector — dockable via @rdna/controls surface pattern */}
      <PretextInspector surface={surface} />
    </>
  );
}
```

## Output Descriptor Format

```json
{
  "version": 1,
  "columns": [
    { "id": "left", "x": 16, "width": 180 },
    { "id": "center", "x": 210, "width": 340 },
    { "id": "right", "x": 564, "width": 180 }
  ],
  "obstacles": [
    {
      "id": "logo",
      "bounds": [16, 600, 200, 200],
      "wrap": "rightSide",
      "offsets": { "top": 8, "right": 8, "bottom": 8, "left": 8 },
      "contour": "polygon"
    },
    {
      "id": "hero",
      "bounds": [210, 0, 340, 240],
      "wrap": "both",
      "offsets": { "top": 0, "right": 12, "bottom": 12, "left": 12 },
      "contour": "boundingBox"
    }
  ],
  "textBlocks": [
    {
      "id": "body",
      "font": "16px Mondwest",
      "lineHeight": 19.2,
      "maxColumnHeight": 900
    }
  ]
}
```

This is mechanically translatable to a `computeLayout()` function by an LLM or a pretext-aware skill.

## Relationship to Existing Work

- **`@rdna/controls` (brainstorm 2026-03-27):** This is a new control *type* within the controls library. Uses the same dock/detach/CD-player integration pattern. The inspector panel is built from `@rdna/controls` primitives (Select, Slider, TextInput, Folder) composed into a pretext-specific layout.
- **GoodNewsApp:** First consumer. Already has drag + resize + polygon hull wrapping. Currently hardcoded — the inspector would surface these settings as editable controls.
- **DialKit pattern:** Same "visual tool → copy → LLM applies" workflow. The pretext inspector is DialKit for spatial typography.
- **interface-kit:** DOM overlay + click-to-inspect UX is directly borrowed from interface-kit's selection model.

## Build Order

| Phase | What |
|---|---|
| P0 | `usePretextSurface` hook — registration API for columns, obstacles, text blocks |
| P0 | DOM overlay system — hover highlight + click selection (shared with `@rdna/controls` core) |
| P0 | Inspector panel — wrap side, offsets (linked/unlinked), contour type selects |
| P0 | Live reflow — `onLayoutChange` callback triggers host's pretext re-layout |
| P1 | Font/lineHeight/maxColumnHeight controls in inspector |
| P1 | JSON export (copy to clipboard) |
| P1 | GoodNewsApp integration (first consumer) |
| P2 | Draggable obstacle repositioning via inspector (numeric x/y/w/h inputs) |
| P2 | Pretext-aware skill that reads the descriptor and writes `computeLayout()` |
| P3 | Column edge dragging (direct manipulation of column widths in the layout) |

## Open Questions

- Should the DOM overlay system be shared across all `@rdna/controls` control types, or is it pretext-specific? (Likely shared — interface-kit's overlay model is useful for any DOM inspection.)
- How does the inspector handle nested obstacles (obstacle inside a column that's inside another column)?
- Should the export include the actual text content, or just the geometry? (Probably just geometry — text is in the host component.)
- Does `contour: 'polygon'` need a way to specify the hull source (SVG path, image alpha, manual points)?
- Should the inspector support undo/redo for setting changes?

## Worktree Context

- Path: `/Users/rivermassey/Desktop/dev/DNA`
- Branch: `main` (brainstorm only — implementation on `feat/rdna-controls` or `feat/pretext-editor`)

## Research Notes

- **GoodNewsApp** (`apps/rad-os/components/apps/GoodNewsApp.tsx`): Already implements drag + resize + polygon hull text wrapping. Uses `prepareWithSegments`, `layoutNextLine`, `layout`. Drag uses React Pointer Events with `setPointerCapture`. Hull from `getWrapHull()`. 3-column layout with `MAX_COL_H = 900`.
- **`@rdna/controls` brainstorm** (2026-03-27): Defines the control surface architecture — DialKit store pattern, RDNA wrappers, dock/detach CD-player metaphor. P0 controls (Slider, Toggle, Select, TextInput, Action, Folder) are the building blocks for the pretext inspector.
- **Control surface brainstorm** (2026-03-26): Original docking/detaching architecture. DOM overlay pattern from interface-kit. Hybrid store (Zustand lifecycle + useSyncExternalStore hot values).
- **Pretext API** (`@chenglou/pretext@0.0.2`): `prepare()`, `prepareWithSegments()`, `layout()`, `layoutWithLines()`, `layoutNextLine()`, `walkLineRanges()`. Two-phase: expensive prepare (Canvas measureText), cheap layout (pure arithmetic). 7680/7680 accuracy across browsers.
- **InDesign Text Wrap panel**: Wrap modes (no wrap, bounding box, object shape, jump object, jump to next column), wrap side (right, left, both, towards spine, away from spine, largest area), offsets (top/right/bottom/left with link toggle), contour options (bounding box, detect edges, alpha channel, photoshop path, graphic frame).
