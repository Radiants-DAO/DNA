# Dithwather Two-Tier Rendering Brainstorm

**Date:** 2026-03-16
**Status:** Decided

## What We're Building

A two-tier rendering architecture for dithwather: a **live tier** (existing canvas/WebGPU path for design-time and complex gradients) and a **pre-baked static tier** (CSS sprite strips for production). The bake step is a new command in the DNA Playground CLI that captures dither animations as sprite strips at each breakpoint, producing a manifest that DitherBox auto-detects at runtime.

## Why This Approach

The current DitherBox renders everything live via canvas or WebGPU. This is necessary for design-time iteration but wasteful in production for patterns that don't change — stipple shadows, button hover dissolves, skeleton loading states. Most dither animations are deterministic: given the same props and dimensions, they produce identical output every time.

By baking these to sprite strips + CSS `steps()` animation, we get:
- **Zero JS at runtime** for static patterns (pure CSS)
- **Instant first paint** (no canvas initialization, no WebGPU negotiation)
- **SSR-compatible** output (data URIs or static PNGs)
- **Smaller bundle** for pages that only use pre-baked patterns

The manifest-driven approach means DitherBox remains the single component API. No new components to learn, no explicit opt-in. If baked assets exist and match, they're used. If not, live rendering kicks in transparently.

## Key Decisions

- **Approach:** Manifest-driven auto-switching (Approach A). DitherBox checks for a co-located manifest at runtime. Baked → CSS sprites. No manifest → live canvas fallback.
- **Bake output:** PNG sprite strips per breakpoint + CSS file with `mask-image` + `steps()` animation. One strip per algorithm×threshold-range combo.
- **Bake trigger:** New `dithwather bake` command in the DNA Playground CLI (`tools/playground/`). Runs component in headless context, captures each threshold frame at each breakpoint.
- **Dimension handling:** Baking occurs at implementation time per component. The developer designs with live GPU rendering, then runs the bake command which captures at that component's actual breakpoints.
- **DitherBox API:** No change. Auto-detects baked assets via manifest lookup. Falls back to live canvas if manifest is missing or props don't match.
- **Tile path (flat patterns):** Pre-bake as CSS utility classes with hardcoded data URIs. Only 5 tiles for bayer2x2, 17 for bayer4x4, 65 for bayer8x8. No manifest needed — these are universal.
- **Gradient path:** Pre-bake via `renderGradientDither()` (already Node-safe with `ImageDataShim`). Requires known dimensions → baked per breakpoint.

## Architecture

### Two tiers

| | Pre-baked (static tier) | Live (canvas tier) |
|---|---|---|
| **Flat patterns** | CSS data URI tiles | — |
| **Threshold animations** | CSS sprite + `steps()` | — |
| **Gradients at known sizes** | Baked PNGs per breakpoint | — |
| **Responsive gradients** | — | Canvas/WebGPU |
| **Design-time iteration** | — | Canvas/WebGPU |
| **JS at runtime** | Zero | Full pipeline |
| **SSR** | Works | Client-only |

### Manifest format (sketch)

```json
{
  "version": 1,
  "component": "DitherButton",
  "baked": {
    "hash": "a1b2c3",
    "props": {
      "algorithm": "bayer4x4",
      "colors": ["#000", "#fff"],
      "angle": 90
    },
    "breakpoints": {
      "375": {
        "sprite": "button-375.png",
        "frames": 17,
        "tileSize": [4, 4],
        "pixelScale": 2
      },
      "1440": {
        "sprite": "button-1440.png",
        "frames": 17,
        "tileSize": [4, 4],
        "pixelScale": 2
      }
    },
    "animation": {
      "idle": { "frame": 7 },
      "hover": { "frame": 9 },
      "active": { "frame": 8 },
      "transition": 150
    }
  }
}
```

### DitherBox decision flow

```
DitherBox mount
  ├─ manifest found?
  │   ├─ props match hash? → render CSS sprite (static tier)
  │   └─ props drifted    → render live canvas (live tier)
  └─ no manifest          → render live canvas (live tier)
```

### Bake workflow

```
1. Developer designs component with live DitherBox (GPU rendering)
2. Happy with result → runs: rdna-playground dithwather bake <component>
3. CLI spins up headless browser at each breakpoint
4. Captures each threshold frame → assembles sprite strip PNGs
5. Writes manifest + sprite assets co-located with component
6. Next render: DitherBox finds manifest, switches to CSS sprites
```

### Static tile utilities (no bake needed)

For flat repeating patterns (stipple shadows, textures), pre-generate at build time:

```css
/* Generated from TILE_BITS — universal, no manifest */
.dither-2x2-50 {
  background-image: url('data:image/png;base64,...');
  background-size: 2px 2px;
  background-repeat: repeat;
  image-rendering: pixelated;
}
```

Bayer2x2 at threshold 0.5 = classic checkerboard stipple. Covers the retro Mac shadow use case with zero JS.

## Shipping Order

1. **Dithwather static tier** — CSS tile utilities + DitherBox manifest auto-detect. Unblocks RadOS.
2. **RadOS components** — Finalize using dithwather (live path for design, static tiles for production stipple shadows/patterns).
3. **Playground bake command** — Later. Tool for dialing in rendering settings and baking gradient animations at breakpoints. Not blocking RadOS.

The static tile utilities (`.dither-2x2-50` etc.) are the immediate deliverable. The playground bake command is the capstone for gradient pre-baking — it needs the playground's headless browser infra and only matters once components are being polished for final production.

## Open Questions

- **Manifest discovery:** Co-located file next to component? Imported via a webpack/vite plugin? Or a global registry?
- **Cache invalidation:** When does a baked asset go stale? Prop hash comparison is the baseline, but should the manifest also track dithwather version?
- **Frame quantization for bayer8x8:** 65 frames is a lot for a sprite strip. Should we quantize to ~12-16 perceptually distinct levels for animation strips?
- **OKLCH migration timing:** The planned OKLCH color migration (docs/plans/2026-03-16-oklch-color-migration.md) will affect baked color output. Should baking wait until after that migration?

## Research Notes

### Existing architecture (supports this cleanly)

- `renderGradientDither()` is already Node-safe (has `ImageDataShim`) — can run in headless/CLI context
- `TILE_BITS` precomputation is SSR-safe, runs on module load, pure BigInt math
- `getTileDataURL()` is the only DOM-dependent tile function — target for static replacement
- `DitherSkeleton` already has a reduced-motion static branch (single frame render)
- Animation system interpolates: `threshold` (smooth), `algorithm` (snap), `colors` (RGB lerp)
- On gradient path, only `threshold` and `algorithm` changes animate — colors are baked into the gradient render

### Frame counts per algorithm

| Algorithm | Total levels | Recommended bake frames |
|---|---|---|
| bayer2x2 | 5 (0-4 pixels) | 5 (all) |
| bayer4x4 | 17 (0-16 pixels) | 17 (all) |
| bayer8x8 | 65 (0-64 pixels) | ~16 (quantized) |

### Key files

- `tools/dithwather/packages/core/src/tiles/bayer-tiles.ts` — tile bit precomputation + data URL generation
- `tools/dithwather/packages/core/src/gradients/render.ts` — Node-safe gradient renderer
- `tools/dithwather/packages/react/src/components/DitherBox.tsx` — main component, tile vs gradient decision
- `tools/dithwather/packages/react/src/hooks/useBayerTile.ts` — CSS mask-image tile path
- `tools/dithwather/packages/react/src/hooks/useDitherAnimation.ts` — rAF animation loop
- `tools/playground/bin/rdna-playground.mjs` — playground CLI (bake command will live here)

## Worktree Context

- Path: `/private/tmp/claude/dithwather-static-tier`
- Branch: `feat/dithwather-static-tier`
