# Pixel Corners

CSS-only staircase-style rounded corners for the RDNA design system. Pixel corners replace smooth `border-radius` curves with a 1-bit pixel art aesthetic using `mask-image` compositing.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [CSS Classes](#css-classes)
4. [px() Runtime API](#px-runtime-api)
5. [Shapes](#shapes)
6. [Rules](#rules)
7. [--pixel-scale](#--pixel-scale)
8. [Shadows](#shadows)
9. [Discrete Clamping](#discrete-clamping)
10. [Regenerating CSS](#regenerating-css)
11. [Testing](#testing)
12. [ESLint Enforcement](#eslint-enforcement)

---

## Overview

Pixel corners give UI elements a retro staircase-edge appearance instead of smooth
anti-aliased curves. Each corner is a small N x N bitstring grid where `1` = masked
pixel and `0` = visible pixel. The grid defines only the **top-left** corner; the
other three are derived by mirroring via SVG transforms.

### Why mask-image

The system uses CSS `mask-image` compositing to cut the staircase shape. This was
chosen over two alternatives that were tried and rejected:

| Approach | Problem |
|----------|---------|
| `clip-path: polygon(...)` | Clips `box-shadow`, `border`, and `overflow` on the host element. Required workarounds for every CSS feature that paints outside the clip boundary. |
| SVG overlay components | Requires a React component wrapper, breaks SSR hydration ordering, and adds JS runtime cost. Cannot be applied with a single CSS class. |

With `mask-image`, pixel corners are **pure CSS**. You apply a class and the element
is masked. Borders are drawn by a `::after` pseudo-element that uses its own mask.
No wrapper components, no JS runtime (for pregenerated sizes), no hydration concerns.

---

## Architecture

The pipeline from geometry definition to rendered corner:

```
Bresenham arc (radius)
       |
       v
  generateCorner(radius) -----> PixelCornerSet { tl: PixelGrid, border: PixelGrid }
       |                                 |
       |                          bitstring grids
       |                          (e.g. '111110011000...')
       v                                 |
  bitsToMergedRects(bits, w, h)          |
       |                                 |
       | run-length encoded rects        |
       v                                 |
  bitsToPath(bits, w, h)                 |
       |                                 |
       | SVG path `d` string             |
       | (e.g. 'M0,0h5v1h-5Z...')        |
       v                                 |
  bitsToMaskURI(pathD, gridSize, transform?)
       |
       | data:image/svg+xml URI
       v
  CSS custom properties (--pc-8-cover-tl, --pc-8-border-tl, ...)
       |
       v
  mask-image / -webkit-mask-image rules
       |
       v
  .pixel-rounded-8 { mask-image: ...; }
  .pixel-rounded-8::after { mask-image: ...; }  (border ring)
```

### Key files

| File | Role |
|------|------|
| `packages/pixel/src/generate.ts` | Bresenham midpoint circle algorithm. Produces cover + border bitstring grids for a given radius. |
| `packages/pixel/src/shapes.ts` | Shape registry (circle, chamfer, scallop, octagon, crenellation). Each shape generator returns a `PixelCornerSet`. |
| `packages/pixel/src/path.ts` | `bitsToMergedRects` (run-length encoding), `bitsToPath` (SVG path), `bitsToMaskURI` (data URI). |
| `packages/pixel/src/px.ts` | Runtime `px()` function for dynamic corners. |
| `packages/radiants/scripts/pixel-corners.config.mjs` | Scale configuration: which sizes to generate, legacy aliases. |
| `packages/radiants/scripts/pixel-corners-lib.mjs` | CSS generator: reads config, calls `@rdna/pixel`, emits `.pixel-rounded-*` rules. |
| `packages/radiants/pixel-corners.css` | Shell file: imports generated CSS, defines shadow utilities and focus rings. |
| `packages/radiants/pixel-corners.generated.css` | Auto-generated file (do not edit). Contains `:root` custom properties and all `.pixel-rounded-*` rules. |

### Two-layer mask system

Each pixel-cornered element uses two mask layers:

1. **Host mask** (on the element itself) -- Subtracts the four corner cover regions
   from a full white rectangle. This clips the element content and background to the
   staircase shape.

2. **Border mask** (on `::after`) -- Adds the four corner border arcs plus four
   straight edge strips. The pseudo-element is filled with `var(--color-line)` and
   masked to show only the 1px staircase border.

The host mask uses `mask-composite: subtract` (standard) / `-webkit-mask-composite: destination-out` (WebKit). The border mask uses `mask-composite: add` / `source-over`.

---

## CSS Classes

### Numeric scale (recommended)

The primary API. Each class corresponds to an N x N corner grid:

| Class | Grid size | Typical use |
|-------|-----------|-------------|
| `pixel-rounded-2` | 2 x 2 | Tiny indicators, inline badges |
| `pixel-rounded-4` | 4 x 4 | Small badges, checkboxes |
| `pixel-rounded-6` | 6 x 6 | Compact buttons, tags |
| `pixel-rounded-8` | 8 x 8 | Standard buttons, inputs |
| `pixel-rounded-12` | 12 x 12 | Cards, dropdown menus |
| `pixel-rounded-16` | 16 x 16 | Dialogs, popovers |
| `pixel-rounded-20` | 20 x 20 | Large panels |
| `pixel-rounded-24` | 24 x 24 | App windows |
| `pixel-rounded-32` | 32 x 32 | Hero sections |
| `pixel-rounded-40` | 40 x 40 | Large decorative elements |
| `pixel-rounded-48` | 48 x 48 | Splash screens |
| `pixel-rounded-64` | 64 x 64 | Full-bleed decorative panels |
| `pixel-rounded-full` | 20 x 20 | Canonical circle (avatars, round buttons) |

Usage:

```tsx
<div className="pixel-rounded-8 bg-surface-primary p-4">
  A card with 8px pixel corners
</div>
```

### Legacy t-shirt aliases (deprecated)

These exist for backward compatibility during migration. Prefer the numeric scale.

| Legacy class | Bresenham radius | Grid size | Nearest numeric equivalent |
|-------------|------------------|-----------|---------------------------|
| `pixel-rounded-xs` | 4 | 5 x 5 | `pixel-rounded-4` (close, not exact) |
| `pixel-rounded-sm` | 6 | 7 x 7 | `pixel-rounded-6` (close, not exact) |
| `pixel-rounded-md` | 8 | 9 x 9 | `pixel-rounded-8` (close, not exact) |
| `pixel-rounded-lg` | 12 | 13 x 13 | `pixel-rounded-12` (close, not exact) |
| `pixel-rounded-xl` | 20 | 21 x 21 | `pixel-rounded-20` (close, not exact) |

The legacy aliases generate from their original radii, so `pixel-rounded-md` (grid 9)
is not identical to `pixel-rounded-8` (grid 8). The geometry is close but not
pixel-perfect. Migrate to the numeric scale when possible.

---

## px() Runtime API

For dynamic corners, per-corner control, or non-circle shapes, use the `px()` function
from `@rdna/pixel`. It returns `{ className: string, style: Record<string, string> }`
to spread onto any element.

```ts
import { px } from '@rdna/pixel';
```

### Uniform circle corners

```tsx
// All four corners at size 8
<div {...px(8)}>Content</div>
```

### Per-corner sizes

Arguments follow CSS border-radius order: top-left, top-right, bottom-right, bottom-left.

```tsx
// Top corners only (bottom corners square)
<div {...px(6, 6, 0, 0)}>Top-rounded card</div>

// Mixed sizes
<div {...px(12, 12, 4, 4)}>Large top, small bottom</div>
```

### Shape mode

```tsx
// Chamfered corners
<div {...px('chamfer', 8)}>Chamfer card</div>

// Scallop corners
<div {...px('scallop', 12)}>Scallop card</div>
```

### Full config object

For maximum control, pass a `PxConfig` object:

```tsx
<div {...px({
  mode: 'chamfer',
  radius: [8, 8, 0, 0],
  edges: [1, 1, 0, 1],     // hide bottom edge border
  color: 'var(--color-danger)',  // override border color
})}>
  Config-driven corners
</div>
```

### PxConfig fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `mode` | `string` | `'circle'` | Shape name from the shape registry |
| `radius` | `number \| [Corner, Corner, Corner, Corner]` | -- | Uniform or per-corner sizes (CSS order: TL, TR, BR, BL) |
| `edges` | `[0\|1, 0\|1, 0\|1, 0\|1]` | `[1,1,1,1]` | Which border edges to show (top, right, bottom, left) |
| `color` | `string` | -- | Border color override (sets `--color-line`) |

### Per-corner mixed shapes

Each corner can independently specify a shape:

```tsx
<div {...px(
  ['chamfer', 8],    // TL: chamfer at size 8
  ['chamfer', 8],    // TR: chamfer at size 8
  0,                 // BR: square (no corner)
  0,                 // BL: square (no corner)
)}>
  Mixed shape card
</div>
```

### Options on any overload

Pass a `PxOptions` object as the last argument to any overload:

```tsx
// Uniform with options
<div {...px(8, { edges: [1, 1, 0, 0], color: 'red' })}>
  Top-border only
</div>
```

### How it works

`px()` generates corner masks on the fly by running the same Bresenham/shape
algorithms used at build time. Results are cached by `mode:size` key. The returned
`className` is always `"pixel-corner"`, which references the variable-driven base rule
in the generated CSS. The `style` object sets CSS custom properties (`--px-tl-cover`,
`--px-tl-border`, `--px-tl-s`, etc.) that the base rule reads.

This means `px()` requires the `pixel-corners.css` stylesheet to be loaded, but does
not require any specific `.pixel-rounded-N` class to exist in CSS for the requested
size.

---

## Shapes

Five corner shapes are registered in the shape registry. The default is `circle`.

### circle

Standard Bresenham midpoint circle arc. Produces the classic staircase curve.

```
Grid (8x8):     Visual:
11111111         --------
11111100         ------..
11111000         -----...
11100000         ---....
11100000         ---....
11000000         --......
10000000         -.......
10000000         -.......
```

### chamfer

45-degree diagonal cut. The border is a straight diagonal staircase from top-right to
bottom-left of the grid.

```tsx
<div {...px('chamfer', 8)}>Chamfered</div>
```

### scallop

Concave quarter-circle -- the inverse of `circle`. The corner is scooped inward,
creating a decorative concave curve. The arc center is at the opposite corner of the
grid (bottom-right for the TL quadrant).

```tsx
<div {...px('scallop', 12)}>Scalloped</div>
```

### octagon

Three-segment cut: a horizontal flat, a 45-degree diagonal, and a vertical flat. The
flat segment length is `floor(N/3)` and the diagonal fills the remainder.

```tsx
<div {...px('octagon', 12)}>Octagonal</div>
```

### crenellation

Alternating teeth (battlement pattern). The top portion of the grid alternates between
solid teeth and gaps. Tooth width is `max(1, floor(N/4))`, tooth height is `floor(N/2)`.

```tsx
<div {...px('crenellation', 8)}>Crenellated</div>
```

### Important: shapes are runtime-only

Non-circle shapes are **not pregenerated in CSS**. There are no
`.pixel-chamfer-8` or `.pixel-scallop-12` classes. You must use the `px()` function
to apply them. The `px()` function generates the mask data at runtime and sets it via
inline CSS custom properties.

### Custom shapes

You can register your own shape generators:

```ts
import { registerShape } from '@rdna/pixel';
import type { CornerShapeGenerator } from '@rdna/pixel';

const myShape: CornerShapeGenerator = (gridSize) => {
  // Return a PixelCornerSet with tl (cover) and border grids
  // ...
};

registerShape('diamond', myShape);

// Now usable:
<div {...px('diamond', 8)}>Custom shape</div>
```

---

## Rules

Pixel corners use `mask-image` for clipping and `::after` for borders. This creates
hard constraints on what CSS properties are compatible. Violating these rules produces
visual bugs (clipped borders, invisible shadows, double-clipping).

### No border-\* on pixel-cornered elements

The `::after` pseudo-element draws the visible border via its own mask. Adding native
CSS `border-*` classes creates a second border that gets clipped at the mask edges.

```tsx
// WRONG -- border gets clipped
<div className="pixel-rounded-8 border border-line">...</div>

// CORRECT -- ::after handles the border automatically
<div className="pixel-rounded-8">...</div>
```

To change border color, set the `--color-line` CSS custom property:

```tsx
<div className="pixel-rounded-8" style={{ '--color-line': 'var(--color-danger)' }}>
  Red-bordered card
</div>
```

Or use the provided utility class:

```tsx
<div className="pixel-rounded-8 pixel-border-danger">...</div>
```

### No overflow-hidden

`overflow-hidden` clips the `::after` pseudo-element, making the border partially or
fully invisible. The mask already handles overflow clipping.

```tsx
// WRONG -- clips the ::after border
<div className="pixel-rounded-8 overflow-hidden">...</div>

// CORRECT -- mask-image handles overflow
<div className="pixel-rounded-8">...</div>
```

### No shadow-\* / box-shadow

`mask-image` clips `box-shadow`. Any standard shadow token (`shadow-resting`,
`shadow-raised`, etc.) will be invisible. Use `pixel-shadow-*` utilities or a wrapper
`div` with `filter: drop-shadow()`.

```tsx
// WRONG -- shadow gets clipped by mask
<div className="pixel-rounded-8 shadow-resting">...</div>

// CORRECT -- pixel-shadow utility on a wrapper
<div className="pixel-shadow-resting">
  <div className="pixel-rounded-8">...</div>
</div>
```

See [Shadows](#shadows) for the full pattern.

### No rounded-\*

The mask defines the corner shape. Adding `rounded-*` has no visible effect (the mask
clips any radius) and may confuse maintainers. All `.pixel-rounded-*` classes set
`border-radius: 0` automatically.

```tsx
// WRONG -- rounded-lg is invisible, just noise
<div className="pixel-rounded-8 rounded-lg">...</div>

// CORRECT
<div className="pixel-rounded-8">...</div>
```

### Built-in border width

The border drawn by `::after` is always:

```css
calc(1px * var(--pixel-scale, 1))
```

At `--pixel-scale: 1`, the border is 1px. At `--pixel-scale: 2`, it is 2px. This is
automatic and not configurable per-element (it scales with the pixel grid).

### Built-in border color

The `::after` pseudo-element uses `background-color: var(--color-line)` as its fill.
Override `--color-line` on the element or an ancestor to change the border color.

---

## --pixel-scale

The `--pixel-scale` CSS custom property controls the visual size of corner pixels.
All grid sizes and border widths are multiplied by this value.

```tsx
// 2x scale -- corner pixels are 2px each, border is 2px
<div
  className="pixel-rounded-8"
  style={{ '--pixel-scale': 2 } as React.CSSProperties}
>
  Chunky pixels
</div>
```

### How scaling works

Every size calculation in the generated CSS uses the pattern:

```css
calc(Npx * var(--pixel-scale, 1))
```

Where N is the grid dimension. For `pixel-rounded-8` at `--pixel-scale: 2`:
- Corner grid occupies `8 * 2 = 16px` in each direction
- Border width is `1 * 2 = 2px`
- Edge strips (straight border segments between corners) scale proportionally

### Integer vs fractional

Integer values (1, 2, 3, 4) produce crisp pixel grids. Fractional values (1.5, 2.5)
work but may produce subpixel rendering artifacts depending on the browser. Stick to
integers for the sharpest result.

### Scope

Set `--pixel-scale` on any ancestor to affect all pixel-cornered descendants:

```tsx
// All children use 2x pixel scale
<div style={{ '--pixel-scale': 2 } as React.CSSProperties}>
  <div className="pixel-rounded-8">Card A</div>
  <div className="pixel-rounded-12">Card B</div>
</div>
```

---

## Shadows

Since `mask-image` clips `box-shadow`, pixel-cornered elements need alternative shadow
strategies.

### pixel-shadow-\* utilities

Predefined `filter: drop-shadow()` classes applied to a **wrapper** element around the
pixel-cornered element:

| Class | Filter | Use case |
|-------|--------|----------|
| `pixel-shadow-surface` | `drop-shadow(0 1px 0 var(--color-ink))` | Subtle surface lift |
| `pixel-shadow-resting` | `drop-shadow(0 2px 0 var(--color-ink))` | Default resting state |
| `pixel-shadow-lifted` | `drop-shadow(0 4px 0 var(--color-ink))` | Hover / active lift |
| `pixel-shadow-raised` | `drop-shadow(2px 2px 0 var(--color-ink))` | Offset raised effect |
| `pixel-shadow-floating` | `drop-shadow(4px 4px 0 var(--color-ink))` | Maximum elevation |

Usage pattern -- the shadow class goes on a **wrapper div**, not on the pixel-cornered
element itself:

```tsx
<div className="pixel-shadow-resting">
  <div className="pixel-rounded-12 bg-surface-primary p-4">
    Card with resting shadow
  </div>
</div>
```

### Custom drop-shadow via wrapper

For shadows not covered by the utilities, use `filter: drop-shadow()` on a wrapper:

```tsx
<div style={{ filter: 'drop-shadow(0 4px 8px rgb(0 0 0 / 0.25))' }}>
  <div className="pixel-rounded-8 bg-surface-primary p-4">
    Custom shadow
  </div>
</div>
```

`drop-shadow()` respects the mask shape -- the shadow follows the staircase contour
rather than the rectangular bounding box. This is the correct visual behavior.

### Why wrappers

`filter: drop-shadow()` on the masked element itself would work visually, but it also
affects the `::after` border pseudo-element, potentially creating unwanted shadow on
the border line. Placing the filter on a parent wrapper keeps the shadow on the outer
contour only.

---

## Discrete Clamping

When a pixel corner size exceeds 50% of the element's smallest dimension, the corners
overlap and produce visual artifacts. The system handles this through discrete clamping:
step down through the numeric scale to find the largest size that fits.

### Rule

A corner size fits when:

```
2 * gridSize * pixelScale <= min(elementWidth, elementHeight)
```

If the requested size does not fit, the system walks the numeric scale in descending
order (64, 48, 40, 32, 24, 20, 16, 12, 8, 6, 4, 2) and selects the largest size
that satisfies the constraint.

### Implementation

Clamping is done at the **JS level** (in the preview page and in consuming components),
not in CSS. The `clampCornerSize` function in the preview page demonstrates the pattern:

```ts
const NUMERIC_SIZES = [2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64];

function clampCornerSize(
  requested: number,
  width: number,
  height: number,
  scale: number,
): number {
  const maxGrid = Math.floor(Math.min(width, height) / (2 * scale));
  if (requested <= maxGrid) return requested;
  for (let i = NUMERIC_SIZES.length - 1; i >= 0; i--) {
    if (NUMERIC_SIZES[i] <= maxGrid) return NUMERIC_SIZES[i];
  }
  return NUMERIC_SIZES[0]; // fallback to smallest
}
```

Components that resize dynamically (e.g., via drag handles) should recompute the
clamped size when dimensions change. For fixed-size elements, compute once at render.

---

## Regenerating CSS

The generated CSS file (`pixel-corners.generated.css`) is checked into the repository.
If you modify the scale configuration, shape generators, or the Bresenham algorithm,
regenerate it:

```bash
pnpm --filter @rdna/radiants generate:pixel-corners
```

This runs the generator script which:

1. Reads `NUMERIC_SIZES`, `FULL_SIZE`, and `LEGACY_ALIASES` from `pixel-corners.config.mjs`
2. For each entry, calls `generateCorner()` or `generateShape()` from `@rdna/pixel`
3. Converts bitstring grids to SVG data URIs via `bitsToPath` and `bitsToMaskURI`
4. Emits `:root` custom properties, shared base rules, per-size host masks, per-size `::after` border masks, the `.pixel-corner` variable-driven base (for `px()`), and legacy alias rules
5. Writes the result to `packages/radiants/pixel-corners.generated.css`

### Adding a new size to the scale

Edit `packages/radiants/scripts/pixel-corners.config.mjs`:

```js
export const NUMERIC_SIZES = [
  { suffix: '2', gridSize: 2 },
  { suffix: '4', gridSize: 4 },
  // ... existing sizes ...
  { suffix: '96', gridSize: 96 },  // new size
];
```

Then regenerate:

```bash
pnpm --filter @rdna/radiants generate:pixel-corners
```

The new `.pixel-rounded-96` class will be available after regeneration.

---

## Testing

### Visual preview page

A Next.js page at `/pixel-corners` in the rad-os app provides an interactive preview
of all sizes with controls for:

- Box width / height
- Border color
- Pixel scale (0.5x to 6x)
- Background opacity
- Shadow mode

Source: `apps/rad-os/app/pixel-corners/page.tsx`

Run it:

```bash
pnpm dev  # from monorepo root, then visit localhost:3000/pixel-corners
```

### HTML test viewer

A standalone HTML file for quick visual comparison without running the full app:

```
packages/pixel/test/pixel-corners-viewer.html
```

Open directly in a browser. Useful for checking corner geometry at various sizes and
comparing cover/border layers.

### Unit tests

The `@rdna/pixel` package includes tests for:

- Shape generators (`shapes.test.ts`) -- validates grid dimensions, bitstring length,
  cover/border non-overlap invariant, and boundary conditions for all five shapes
- Bresenham generator (`generate.ts`) -- validates arc symmetry, staircase monotonicity,
  and 8-connectivity bridging

Run:

```bash
pnpm --filter @rdna/pixel test
```

---

## ESLint Enforcement

Two custom ESLint rules in `eslint-plugin-rdna` catch common pixel corner mistakes at
lint time.

### rdna/no-clipped-shadow

Flags RDNA shadow tokens (`shadow-resting`, `shadow-raised`, `shadow-floating`, etc.)
when used on or inside pixel-cornered elements.

Catches two cases:

1. **Same-element** -- the element has both `pixel-rounded-*` and `shadow-*`:
   ```tsx
   // Flagged: shadow-resting on a pixel-cornered element
   <div className="pixel-rounded-8 shadow-resting">...</div>
   ```

2. **Ancestor** -- the element has `shadow-*` and a JSX ancestor has `pixel-rounded-*`:
   ```tsx
   // Flagged: shadow-resting inside a pixel-cornered ancestor
   <div className="pixel-rounded-8">
     <span className="shadow-resting">...</span>
   </div>
   ```

The rule suggests the correct `pixel-shadow-*` equivalent or `filter: drop-shadow()`.

### rdna/no-pixel-border

Flags two incompatible patterns on pixel-cornered elements:

1. **`border-*` classes** -- native CSS borders are clipped by the mask:
   ```tsx
   // Flagged: border on pixel-cornered element
   <div className="pixel-rounded-8 border border-line">...</div>
   ```

2. **`overflow-hidden`** -- clips the `::after` pseudo-element that draws the border:
   ```tsx
   // Flagged: overflow-hidden on pixel-cornered element
   <div className="pixel-rounded-8 overflow-hidden">...</div>
   ```

### Running the lint

```bash
# Full design system lint (includes pixel corner rules)
pnpm lint:design-system

# Or via turbo
pnpm lint
```

Both rules are included in the `recommended` config at `warn` severity. They apply to
`apps/rad-os/**` and `tools/playground/**` by default. The `recommended-strict` config
(not yet activated) will escalate them to `error`.

### Exception format

If a violation is intentional (rare), use the standard RDNA exception format:

```tsx
// eslint-disable-next-line rdna/no-clipped-shadow -- reason:intentional-overlay owner:design-system expires:2027-01-01 issue:DNA-456
<div className="pixel-rounded-8 shadow-resting">...</div>
```

Only `eslint-disable-next-line` is permitted for `rdna/*` rules.

---

## Quick Reference

### Do

```tsx
// Apply pixel corners with a class
<div className="pixel-rounded-8 bg-surface-primary">...</div>

// Shadow via wrapper
<div className="pixel-shadow-resting">
  <div className="pixel-rounded-12">...</div>
</div>

// Override border color
<div className="pixel-rounded-8" style={{ '--color-line': 'red' }}>...</div>

// Dynamic corners via px()
<div {...px(8)}>...</div>

// Per-corner control
<div {...px(12, 12, 0, 0)}>...</div>

// Non-circle shape
<div {...px('chamfer', 8)}>...</div>

// Scale up the pixel grid
<div className="pixel-rounded-8" style={{ '--pixel-scale': 2 }}>...</div>
```

### Do not

```tsx
// No border-* on pixel-cornered elements
<div className="pixel-rounded-8 border border-line">...</div>

// No overflow-hidden
<div className="pixel-rounded-8 overflow-hidden">...</div>

// No box-shadow tokens
<div className="pixel-rounded-8 shadow-resting">...</div>

// No rounded-* (redundant, mask handles shape)
<div className="pixel-rounded-8 rounded-lg">...</div>

// No shadow directly on the masked element
<div className="pixel-rounded-8" style={{ filter: 'drop-shadow(...)' }}>...</div>
```
