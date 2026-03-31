# Radiants Pixel Art System Brainstorm

**Date:** 2026-03-31
**Status:** Decided

## What We're Building

A unified pixel art engine (`@rdna/pixel`) that treats patterns, 16px icons, pixel corners, and animated transitions as the same primitive: **1-bit grids stored as bitstrings, rendered via canvas**. The current CSS mask pipeline (`patterns.css`, base64 PNGs), the SVG icon pipeline (SVGO → SVGR), and the clip-path pixel corners system (`pixel-corners.generated.css`) are all replaced by a single canvas renderer inspired by `@chenglou/pretext`'s lightweight, DOM-free philosophy.

## Why This Approach

**Core insight:** Patterns (8×8 tiled masks), 16px pixel icons (16×16 SVGs), and pixel corners (clip-path polygons) are all the same data structure — a binary grid where each pixel is on or off. Today they're stored in three completely different formats and rendered through three different pipelines. Unifying them:

1. **Eliminates the PNG/base64 encoding step** — bitstring → `Uint8Array` → canvas `fillRect` is simpler and natively animatable
2. **Enables free transitions** — any pattern can morph into any other pattern (or icon) via auto bit-flip interpolation, zero authoring required
3. **Drastically simplifies storage** — 51 patterns become 51 bitstrings in a single registry, 155 icons become 155 bitstrings alongside them
4. **Kills the clip-path pain** — pixel corners become small canvas overlays drawn from bitstrings, eliminating `clip-path: polygon()`, `::after` ring borders, `position: relative` requirements, and the `box-shadow`/`border`/`overflow-hidden` restrictions
5. **One editor for all pixel art** — `dotting` canvas editor creates patterns, icons, AND corner shapes

## Key Decisions

- **1-bit monochrome** — each pixel is on/off. Color applied at render time (canvas `fillStyle`). No palette indexing.
- **Bitstring format** — human-readable `"10101010..."` strings (64 chars for 8×8, 256 chars for 16×16). Visible in source, diffable in git, trivial to parse.
- **Canvas-only rendering** — drop CSS masks entirely. All pixel art renders through canvas components. `rdna-pat--*` classes removed, `patterns.css` deprecated. Requires React for all pixel art consumption.
- **Auto bit-flip animation** — primary transition mode. Diff two bitstrings, flip N bits per frame in configurable spatial patterns (random, radial, scanline, scatter). Keyframe strips supported as extension for authored multi-frame animations.
- **Standalone `@rdna/pixel` package** — zero coupling to radiants theme tokens. Radiants and any future theme import from it.
- **16px + 8×8 now, 24px later** — unify the clear pixel-art systems first. 24px icons stay as SVGs; format spec accommodates them for future migration.
- **Pixel corners via overlay, not clip-path** — elements use standard CSS `rounded-*` corners. Small canvas overlays at each corner draw bg-colored pixels (hiding the smooth curve) + pixel corner art on top. No more `clip-path`, `::after` rings, or shadow/border restrictions.
- **Explicit cornerBg prop** — overlay needs to know the color behind the element. Passed as a semantic token prop (e.g., `cornerBg="var(--color-page)"`), defaulting to `--color-page` since most pixel-cornered elements sit on the desktop.

## Architecture

```
packages/pixel/              # @rdna/pixel — the engine
  core.ts                    # bitstring → Uint8Array, grid math
  renderer.ts                # canvas painter (fillRect per set bit)
  transition.ts              # bit-flip interpolation engine
  corners.ts                 # corner overlay positioning + rendering
  types.ts                   # PixelGrid, TransitionMode, etc.
  index.ts                   # public API

packages/radiants/
  patterns/registry.ts       # 51 patterns as bitstrings (imports @rdna/pixel)
  icons/                     # 16px migrated to bitstrings (imports @rdna/pixel)
                             # 24px stays as SVGs
  components/core/
    Pattern/Pattern.tsx       # rewritten: canvas internally via @rdna/pixel
    PixelIcon/PixelIcon.tsx   # new: 16px icons via canvas
    PixelTransition/          # new: animated morph between any two grids
    PixelCorner/              # new: replaces pixel-rounded-* clip-path system
```

### Data Model

```ts
// A pixel grid — the universal primitive
interface PixelGrid {
  name: string;
  width: number;   // 8 for patterns, 16 for icons, varies for corners
  height: number;
  bits: string;    // "10101010..." — length = width × height
}

// Corner set — 4 corner grids + metadata
interface PixelCornerSet {
  name: string;           // 'sm', 'md', 'lg', 'xl'
  tl: PixelGrid;          // top-left corner art (others derived by mirroring)
  borderWidth?: number;   // optional: pixel border thickness (default 1)
}

// Transition between two grids
interface PixelTransition {
  from: PixelGrid;
  to: PixelGrid;
  mode: 'random' | 'radial' | 'scanline' | 'scatter';
  duration: number;  // ms
}

// Keyframe animation (extension)
interface PixelAnimation {
  name: string;
  width: number;
  height: number;
  fps: number;
  frames: string[];  // array of bitstrings
}
```

### Pixel Corner Overlay Model

Replaces the current `clip-path: polygon()` + `::after` ring system.

```
Current clip-path approach:
  ┌── clip-path: polygon(...) clips entire element ──┐
  │   ::after pseudo-element with ring polygon        │
  │   position: relative required                     │
  │   border-*, overflow-hidden, box-shadow FORBIDDEN │
  └───────────────────────────────────────────────────┘

Proposed overlay approach:
  ┌── standard rounded-* CSS corners ──┐
  │   normal border, shadow, overflow   │  ← everything works
  │                                     │
  │  ┌──┐                        ┌──┐  │
  │  │TL│  (corner canvases)     │TR│  │  ← 4 small canvases
  │  └──┘                        └──┘  │     positioned at corners
  │                                     │
  │  ┌──┐                        ┌──┐  │  Layer 1: bg-colored pixels
  │  │BL│                        │BR│  │           (hide smooth curve)
  │  └──┘                        └──┘  │  Layer 2: corner art pixels
  └─────────────────────────────────────┘           (visible staircase)
```

Each corner canvas:
1. Draws pixels in `cornerBg` color to cover the smooth CSS border-radius
2. Draws the pixel corner art on top (the visible staircase + border)
3. The corner art is a `PixelGrid` drawn in the dotting editor, stored as a bitstring

**cornerBg resolution:** explicit prop defaulting to `var(--color-page)`.
```tsx
// Most common — window on desktop (default works)
<AppWindow cornerSize="md">

// Card inside a different surface
<Card cornerSize="sm" cornerBg="var(--color-card)">
```

**What this eliminates from radiants:**
- `pixel-corners.generated.css` (230 lines of clip-path polygons)
- `pixel-corners.css` (manual utilities, drop-shadow workarounds)
- `scripts/pixel-corners-lib.mjs` (396 lines of geometry math)
- `scripts/pixel-corners.config.mjs` (98 lines of profile config)
- `scripts/generate-pixel-corners.mjs` (generator script)
- ESLint rule `rdna/no-clipped-shadow` (no longer needed)
- ESLint rule `rdna/no-pixel-border` (no longer needed)
- All `position: relative` / inline `position: absolute` override hacks

### Rendering Pipeline (pretext-inspired)

```
Current:   hex → PNG → base64 → CSS var → mask-image → browser decode → paint
Proposed:  bitstring → Uint8Array → canvas fillRect → done
```

Key parallels to pretext:
- **Prepare once**: parse bitstring to typed array (like `prepare()` caches word widths)
- **Render fast**: canvas `fillRect` per set bit (~0.01ms for 16×16)
- **Animate free**: update typed array + repaint per frame (like pretext reflows on drag at ~2ms/frame)
- **No DOM overhead**: canvas is a single element, no mask decoding or PNG parsing

### Migration Path

1. Build `@rdna/pixel` core (bitstring parser, canvas renderer, transition engine, corner overlay)
2. Convert 51 existing patterns from hex to bitstrings (automated — `parseInt(hex, 16).toString(2)`)
3. Convert 155 existing 16px icons from SVG to bitstrings (script: rasterize SVG at 16×16, extract bits)
4. Draw corner art for each size (xs, sm, md, lg, xl) in dotting editor, save as bitstrings
5. Rewrite `<Pattern>` component to use canvas renderer
6. New `<PixelIcon>` component for 16px icons via canvas
7. New `<PixelCorner>` component replacing `pixel-rounded-*` clip-path system
8. New `<PixelTransition>` component for animated morphs
9. Remove `patterns.css`, `rdna-pat--*` classes, base64 PNG tokens
10. Remove `pixel-corners.generated.css`, generator scripts, clip-path ESLint rules
11. Update `pattern-shadows.css` to canvas-based shadow system

## Open Questions

- **Pattern shadows**: Current system uses `::after` pseudo-elements with mask-image for dithered shadows. Canvas-only means these need a different approach — canvas shadow elements? Composited canvas layers?
- **SSR**: Canvas requires browser APIs. Static patterns on server-rendered pages would need a fallback (possibly generated PNG as `<img>` placeholder, hydrated to canvas on client).
- **Performance at scale**: Many simultaneous canvas elements (e.g., a grid of 20 pattern swatches + 4 corner canvases per window) — need to test if offscreen canvas or shared context helps.
- **Corner edge cases**: Corners where the background is a gradient, image, or transparent — the overlay approach assumes a solid bg. May need a different strategy for those rare cases.
- **dotting bundle size**: Need to audit `hunkim98/dotting` dependency footprint. If too heavy, may need a lighter custom editor or lazy-load it aggressively.

## Research Notes

- Patterns: 51 entries in `packages/radiants/patterns/registry.ts`, stored as hex strings (8 bytes each), rendered as base64 PNG masks via CSS `mask-image` + `background-color`
- Icons: 155 × 16px + 662 × 24px SVGs in `packages/radiants/assets/icons/`, generated to React components via SVGO + SVGR pipeline
- Pixel corners: 5 profiles (xs/sm/md/lg/xl) + 8 variants, generated via `pixel-corners-lib.mjs` (400 lines of mirror/inset/seam math), rendered as `clip-path: polygon()` + `::after` pseudo-element ring borders. Enforced by 2 ESLint rules (`no-clipped-shadow`, `no-pixel-border`). Pain points: no `border-*`, no `overflow-hidden`, no `box-shadow`, `position: relative` required
- Pretext (`@chenglou/pretext`): Already a dependency in both `rad-os` and `radiants`. Demonstrates the canvas-over-DOM philosophy — `prepare()` + `layout()` at ~0.0002ms proves the performance model
- Dotting (`hunkim98/dotting`): React canvas editor with layers, brush tools (dot, eraser, paint bucket, shapes), `{rowIndex, columnIndex, color}` data model, pan/zoom support. No built-in animation or export.

## Worktree Context

- Path: `/Users/rivermassey/Desktop/dev/DNA-pixel-art`
- Branch: `feat/pixel-art-system`
