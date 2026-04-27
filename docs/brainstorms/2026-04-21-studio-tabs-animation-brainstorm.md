# Studio Two-Tab Refactor Brainstorm

**Date:** 2026-04-21\
**Status:** Decided

## What We're Building

Split the Studio app into two tabs sharing one window:

* **Radiants tab** — the current editor, locked to 32×32, 3-color palette (ink / cream / sun-yellow), radnom generator. Constraint is the feature.

* **Freeform tab** — full-featured pixel editor that surfaces every useful capability of the vendored Dotting engine: resizable canvas (16/32/64/128 + custom), full palette + custom color picker, pattern brushes, select/copy/paste, multi-layer, plus every other Dotting feature already implemented but not exposed.

Animation/frames is **explicitly deferred** — the user plans to prototype it in a separate editor first.

## Why This Approach

Dotting already implements ~90% of a Photoshop-tier pixel workflow internally; Studio currently surfaces maybe 40% of it. This brainstorm is a discovery that most of the work is **UI wiring, not engine work**. A shared shell with two tabs lets Radiants stay deliberately minimal (the logo/UI-chrome use case) while giving Freeform the space to expose everything. One app, one icon, one window — low catalog noise.

## Key Decisions

* **Single Studio catalog entry** with internal tabs (Radiants / Freeform). Not separate apps.

* **Shared shell**: `CanvasArea`, `StatusBar`, `LayerPanel`, `EditorToolbar` (conditional parts), `ToolPalette` all become parameterized shared components under `studio/shared/`.

* **Per-tab state** in Zustand: Radiants is session-only; Freeform persists (canvas size, palette mode, custom colors, layer data) via Zustand persist → localStorage.

* **Palette**: Radiants locked to 3 colors; Freeform = 10 preset + custom hex picker + persistent custom color list.

* **Canvas**: Radiants locked 32×32; Freeform presets 16/32/64/128 + custom numeric input; resize uses `addGridIndices`/`deleteGridIndices` or `canvasKey` remount depending on whether we want in-place growth vs. clean-slate.

* **Exports (v1)**: PNG + SVG only. Both already supported by `downloadImage`.

* **Keyboard**: existing tool shortcuts (B/E/G/L/R/⇧R/O/⇧O/V) unchanged. Reserve `⇧Tab/Tab` for tab switching, `⇧N` for Radnom (avoid `⇧R` collision with Fill Rect), `1–4` for Freeform canvas-size presets.

* **Animation is NOT in scope** for this plan. Phase-2 work happens in a different editor per user direction.

## Feature Surfacing (Freeform tab)

Every feature below is already implemented in Dotting; Freeform just wires UI:

### Brushes & Patterns

* All 9 tools (DOT / ERASER / PAINT_BUCKET / LINE / RECT / RECT_FILLED / ELLIPSE / ELLIPSE_FILLED / SELECT) — currently shown, keep

* **Pattern brushes** — `setBrushPattern` + `BRUSH_PATTERN_ELEMENT` 2D arrays (Bayer 4×4, checker, stripes, halftones) — **new UI**

* Live shape preview (Editor.tsx:2824) already fires during drag — **free**

### Selection (SELECT tool wiring)

* Marquee select — engine exists, UI absent

* Move selected — drag-to-move implemented, needs keybind

* Extend selected — resize handles implemented (detectSelectedAreaExtendDirection)

* Alt-key symmetric extend — already in engine (`setIsAltPressed`)

* **Clipboard**: `⌘C` → snapshot `getSelectedAreaPixels()`, `⌘X` → snapshot + `erasePixels()`, `⌘V` → `colorPixels()` at current selection origin — **new, small**

* Arrow-nudge (1px) and `⇧+arrow` (8px) for selection — **new, small**

* `Delete`/`Backspace` to clear selection — already in engine (Editor.tsx:3075)

### Layers

* Already wired: add / remove / reorder / show / hide / currentLayer

* **New**: isolate-layer (alt-click eye), show-all — one-line additions to LayerPanel

### Canvas / Grid

* Resize presets (16/32/64/128) + custom numeric input — **new UI**, backed by `addGridIndices`/`deleteGridIndices` or remount-on-key

* Grid toggle — already wired

* Pan/zoom enabled in Freeform (disabled in Radiants) — flip `isPanZoomable`

### Data & History

* Undo/redo — already wired, full action stack (Color, ColorSize, SelectAreaMove, LayerCreate/Delete, LayerOrder) all emit correctly

* Autosave on `strokeEnd` event → Zustand persist

### Overlays

* Hover indicator with color preview — engine emits `CanvasHoverPixelChange`, StatusBar should show row/col

* `setIndicatorPixels` — held in reserve for preview-stamps / onion-skin when animation comes later

### Export

* PNG + SVG via existing `downloadImage({type})` — add SVG button to EditorToolbar

* Foreground canvas access (`getForegroundCanvas`) reserved for future custom exports

## File Shape (Target)

```text
components/apps/studio/
├── PixelArtEditor.tsx          # root; renders StudioTabs + active tab
├── StudioTabs.tsx              # tab bar (Radiants / Freeform)
├── tabs/
│   ├── RadiantsTab.tsx         # locked 32×32, 3-color, radnom
│   └── FreeformTab.tsx         # full-featured editor
├── shared/
│   ├── CanvasArea.tsx          # props: canvasSize, bgColor, gridStrokeColor, isPanZoomable
│   ├── ToolPalette.tsx         # props: availableTools (filter of TOOL_DEFS)
│   ├── ColorPalette.tsx        # props: palette + onCustomAdd
│   ├── LayerPanel.tsx          # unchanged + isolate/show-all
│   ├── EditorToolbar.tsx       # props: showRadnom, exportFormats[]
│   └── StatusBar.tsx           # props: show hover coords
├── controls/
│   ├── CanvasSizeControl.tsx   # Freeform-only: presets + custom
│   ├── CustomColorPicker.tsx   # Freeform-only: hex input
│   ├── PatternBrushPicker.tsx  # Freeform-only: Bayer/checker/stripe library
│   └── PaletteSwitcher.tsx     # Freeform-only: preset ↔ custom
├── palettes/
│   ├── radiants.ts             # [ink, cream, sun-yellow]
│   └── freeform.ts             # current 10 + patterns
├── patterns/
│   └── brush-patterns.ts       # BRUSH_PATTERN_ELEMENT arrays (Bayer/checker/etc)
├── constants.ts                # TOOL_DEFS, DEFAULT_* (shared)
└── radnom.ts                   # unchanged (Radiants-only import)
```

## Harvested from pixel-playground

* **Lift to shared**: `bits-from-layer.ts` → `lib/dotting/utils/export.ts` (canonical "read pixels out" helper, sparse-safe, tested).

* **Pattern to copy**: `canvasKey` resetKey trick (PixelPlayground.tsx:29–32) — already used by Radnom; reuse for Freeform canvas-size changes.

* **Pattern to copy**: `useResolvedColor('--color-*', fallback)` for theme-aware grid/bg colors (OneBitCanvas.tsx:57–59).

* **Pattern to copy**: `useData(ref, resetKey)` subscription for autosave / live preview.

* **Don't copy**: playground's mode-coupled preview registry, `MODE_CONFIG` size-tied-to-mode, `PixelPlaygroundState` monolithic shape.

## Store Shape (Zustand slice)

```ts
interface StudioSlice {
  activeTab: 'radiants' | 'freeform';
  setActiveTab: (tab) => void;

  // Radiants — session-only, not persisted
  radiants: {
    layers: LayerProps[];           // reset per-session
  };

  // Freeform — persisted to localStorage
  freeform: {
    canvasSize: number;             // 16 | 32 | 64 | 128 | custom
    paletteMode: 'preset' | 'custom';
    customColors: string[];         // user-added hex list
    layers: LayerProps[];           // live pixel data
    gridVisible: boolean;
    lastBrushTool: BrushTool;
    lastBrushColor: string;
  };
}
```

Persist partialize: only `freeform.*` persisted; `activeTab` optional; `radiants` never.

## Open Questions

* **Canvas resize strategy**: in-place grow/shrink via `addGridIndices`/`deleteGridIndices` (preserves existing art) vs. remount via `canvasKey` bump (clean slate, simpler). Default: in-place.

* **Custom color picker UI**: bare hex input vs. HSV sliders vs. full picker (library?). Start with hex + 8-swatch recent-colors strip.

* **Pattern brush library**: how many patterns to ship v1? Proposed: Bayer 2×2, 4×4, 8×8 + horizontal stripes + vertical stripes + checker + dot matrix = 7 patterns.

* **Tab switcher placement**: top of window (standard) vs. right-rail above tool palette. Default: top.

* **Window sizing**: Freeform at 64×64 or 128×128 wants more screen real-estate; Studio is currently sized for 32×32. AppWindow defaultSize may need to grow, or Freeform uses `isPanZoomable=true` to fit any canvas in the existing window.

* **SelectAreaRange persistence across tab switch**: preserve active selection when switching Radiants↔Freeform? Likely no — clear on switch.

* **Radnom in Freeform**: available or Radiants-only? Default: Radiants-only.

* **Animation**: explicitly deferred. When it lands, the research here (hybrid frame model via `setLayers`, custom-overlay onion-skin, `setInterval` playback, gif.js export) is the starting point.

## Worktree Context

* **Path**: `/Users/rivermassey/Desktop/dev/DNA-logo-maker`

* **Branch**: `feat/logo-asset-maker`

## Research Notes

### Dotting engine capability inventory (agent)

* `apps/rad-os/lib/dotting/components/Canvas/Editor.tsx` (3840 lines) — all methods catalogued

* `InteractionLayer.tsx:183` — selection state; `InteractionLayer.tsx:435+` — extend selected; `InteractionLayer.tsx:289` — getSelectedAreaPixels

* `Editor.tsx:402` — setBrushPattern; `:416` — setIndicatorPixels; `:1113` — setLayers; `:865` — getLayersAsArray; `:1408` — addGridIndices; `:1504` — deleteGridIndices; `:2414` — colorPixels; `:2378` — erasePixels; `:3588` — downloadImage

* 9 brush tools, 5 action types, 7 event handlers, full pan/zoom, selection + move + extend + delete already implemented; export only supports PNG/SVG today

* "103 dead symbols" are mostly internal scheduling / mobile pinch / indicator plumbing — keep the engine intact

### Studio UI audit (agent)

* Needs split: `PixelArtEditor.tsx` (monolithic shell), `ColorPalette.tsx` (hardcoded palette), `CanvasArea.tsx` (hardcoded size), `constants.ts`

* Shared-ready: `StatusBar`, `LayerPanel`, `EditorToolbar` (minus Radnom), `ToolPalette`

* Radiants-only: `radnom.ts`, Radnom button in toolbar, fixed 32×32 constants

* Store: new `studioSlice` with per-tab state; only freeform persisted

### Pixel-playground harvest (agent)

* `bits-from-layer.ts` is the canonical read-out helper — lift to shared utils

* `OneBitCanvas` pattern (constrained wrapper around Dotting) — don't lift, but borrow structure

* `useData(ref, resetKey)` pairing with `canvasKey` remount is the right pattern

* Don't inherit pixel-playground's mode-enum coupling or state shape

### Animation research (agent, deferred)

* Dotting has **no native animation**. All rAF hits are just render scheduling.

* Recommended model when we build it: hybrid `frames: Array<{id, name, layers: LayerProps[]}>` + `setLayers(frames[i].layers)` atomic swap — round-trips cleanly via `getLayersAsArray`/`setLayers`

* Onion-skin: custom transparent canvas overlay (setIndicatorPixels is full-alpha only, would require engine fork)

* Playback: `setInterval` + `setLayers`, ~O(1) per swap, fine at 12–24fps

* Export: gif.js browser lib + PNG sprite sheet for v1

* **Deferred** per user direction — phase 2, different editor.

## Next Steps

1. Proceed to `/wf-plan` in this worktree — this brainstorm will be auto-detected.

2. Plan should stage as: (a) extract shared shell + parameterize, (b) RadiantsTab (refactor-only, no feature change), (c) FreeformTab MVP (resize + full palette + custom color picker), (d) Freeform polish (pattern brushes + select clipboard + isolate-layer + hover coords + SVG export).

⠀