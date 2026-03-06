# Binary Tile Pipeline Brainstorm

**Date:** 2026-02-05
**Status:** Decided

## What We're Building

Replace the per-pixel canvas rendering pipeline with a precomputed binary tile system. Each stage of the current pipeline (source, adjustments, dither, color mapping) becomes either a precomputed tile or a CSS property, eliminating per-frame pixel processing for Bayer algorithms entirely.

## Why This Approach

The current pipeline processes every pixel 3-4 times per render (adjustments, dither, color mapping) and encodes a full-resolution PNG via `toDataURL()` on every animation frame. This is the #1 performance problem identified by all three reviewers.

Bayer dithering is fundamentally a tiling pattern -- the output for any threshold is a small repeating matrix (4x4 = 16 pixels, 8x8 = 64 pixels). By precomputing all possible threshold states as tiny binary tiles and letting the browser's CSS compositor handle tiling and coloring, we move from O(width*height) per frame to O(1).

## The Tile Pipeline

### Stage 1: Dither Pattern (precomputed)

For each Bayer algorithm, precompute all possible threshold levels:
- **2x2**: 5 tiles (0-4 pixels on)
- **4x4**: 17 tiles (0-16 pixels on)
- **8x8**: 65 tiles (0-64 pixels on)

Each tile is a tiny black-and-white image. Binary representation: a 4x4 tile = 16 bits = one `number`. An 8x8 tile = 64 bits.

Tiles are generated once on init and cached as tiny data URLs or `ImageBitmap` objects.

### Stage 2: Color Mapping (CSS, zero precomputation)

Keep tiles as pure black/white. Use CSS `mix-blend-mode` to recolor:

```
Container (bg-color: user's bg)
  -> Dither tile layer (black/white, repeated)
      mix-blend-mode: screen (or multiply)
  -> Content layer (z-index above)
```

Color changes (even during animation) = changing a CSS custom property. No tile regeneration.

Alternative: use the tile as an alpha mask (`mask-image`) with CSS `background-color` as the visible color. This works for mono mode naturally.

### Stage 3: Brightness/Contrast (threshold shift)

For solid-color sources, brightness/contrast adjustments change the effective threshold. Instead of per-pixel math, map the adjustment to a threshold offset:
- `brightness +0.2` at `threshold 0.5` = effective threshold `0.3` (more pixels "on")
- `contrast` adjusts the steepness of the threshold curve

This means brightness/contrast just select a different precomputed tile -- no pixel math.

### Stage 4: Source Handling

**Solid color sources**: Entire pipeline collapses to a single precomputed tile + CSS colors. Zero runtime computation.

**Gradient sources**: Cannot tile uniformly. Two options:
1. Render gradient at full resolution, quantize to discrete threshold bands, assign each band a precomputed tile (hybrid approach)
2. Keep the current canvas pipeline for gradients only

Gradients are the special case. Everything else tiles.

## Key Decisions

- **Tiles are black/white only** -- CSS handles all coloring via mix-blend-mode
- **Gradients remain special-cased** -- they need per-element rendering but could be band-quantized in the future
- **Floyd-Steinberg stays on the canvas path** -- error diffusion is non-tiling by nature
- **Animation becomes CSS-only for solid sources** -- interpolate threshold -> swap tile + transition CSS colors
- **Precomputation is per-algorithm, not per-config** -- total tiles: 87 across all 3 Bayer sizes

## Performance Impact

| Scenario | Current | Binary Tiles |
|----------|---------|-------------|
| Static solid-color Bayer | Full canvas pipeline | One-time tile lookup |
| Hover animation (Bayer) | Full pipeline per frame (~5-10ms) | CSS transition + tile swap (~0ms) |
| Resize | Full re-render | CSS `background-repeat` handles it |
| Color change | Full re-render | CSS property change |
| Floyd-Steinberg | Full pipeline | No change (still canvas) |
| Gradient source | Full pipeline | Full pipeline (special case) |

## Open Questions

- Best CSS blend mode for duotone recoloring? `screen` lightens, `multiply` darkens -- may need a two-layer stack (multiply for bg + screen for fg) or use `mask-image` approach instead
- Should tiles be stored as data URLs, ImageBitmap, or inline SVG? Data URLs are simplest; SVG could be even smaller for simple patterns
- Should the tile precomputation happen eagerly (all 87 on init) or lazily (on first use per threshold level)?
- How to handle the `intensity` config (blend original/dithered) in the tile model? Could use CSS `opacity` on the tile layer.

## Research Notes

- `canvas.ts:166-244` -- current monolithic render pipeline, 4 pixel passes
- `bayer.ts:15-42` -- three pre-computed matrices, values already normalized 0-1
- `DitherBox.tsx:166-182` -- renders to data URL on every config/size change
- `useDitherAnimation.ts` -- animates by interpolating config values and re-rendering
- All three team reviewers flagged `toDataURL()` per animation frame as the existential performance problem
- A 4x4 Bayer tile at 1x is literally 16 bytes of pixel data; current approach processes 160,000+ pixels for a modestly sized element
