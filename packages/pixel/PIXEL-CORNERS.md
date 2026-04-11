# @rdna/pixel — Pixel Corner System

A 1-bit pixel art engine for generating staircase-style rounded corners. Replaces CSS `clip-path` polygon corners with lightweight SVG overlays that don't restrict `box-shadow`, `border`, or `overflow` on the host element.

## How It Works

Every pixel corner is defined as two bitstring grids:

- **Cover grid** — painted in the page background color to hide the browser's smooth `border-radius` underneath
- **Border grid** — painted in the border color to draw the 1px staircase edge

Both grids represent the **top-left corner only**. The other three corners are derived at render time by mirroring horizontally (TR), vertically (BL), or both (BR).

```
TL (source)    TR (mirrorH)    BL (mirrorV)    BR (mirrorHV)
██░              ░██              ░░░              ░░░
█░░              ░░█              █░░              ░░█
░░░              ░░░              ██░              ░██
```

## Preset Sizes

Five sizes ship in the `CORNER_SETS` registry, matching the existing `pixel-rounded-*` CSS classes:

| Size | Grid | Bresenham R | CSS `border-radius` | Use case |
|------|------|-------------|---------------------|----------|
| `xs` | 2×2 | 1 | `3px` | Badges, checkboxes, small inline elements |
| `sm` | 5×5 | 4 | `6px` | Buttons, inputs, cards |
| `md` | 9×9 | 8 | `10px` | Dialogs, popovers, dropdown menus |
| `lg` | 12×12 | 11 | `13px` | App windows, large panels |
| `xl` | 19×19 | 18 | `20px` | Hero sections, splash screens |

> **Border-radius rule:** The CSS `border-radius` must be **grid size + 1px** (e.g. 9×9 → `10px`). The PixelCorner SVGs are positioned at `-1px` offset to overlap the container's CSS border, so the radius needs to be 1px larger than the grid to be fully covered by the pixel staircase.

### Visual Reference

Each size rendered at 8× scale (cover in red, border in green, composite on dark bg):

#### XS (2×2)

```
Cover    Border   Composite
██       ░░       ██░
█░       ░█       █B·
```

#### SM (5×5)

```
Cover     Border    Composite
█████     ░░░░░     █████
███░░     ░░░██     ███BB
██░░░     ░░█░░     ██B··
█░░░░     ░█░░░     █B···
█░░░░     ░█░░░     █B···
```

#### MD (9×9)

```
Cover         Border
█████████     ░░░░░░░░░
██████░░░     ░░░░░░███
█████░░░░     ░░░░░█░░░
███░░░░░░     ░░░██░░░░
███░░░░░░     ░░░█░░░░░
██░░░░░░░     ░░█░░░░░░
█░░░░░░░░     ░█░░░░░░░
█░░░░░░░░     ░█░░░░░░░
█░░░░░░░░     ░█░░░░░░░
```

#### LG (12×12)

```
Cover            Border
████████████     ░░░░░░░░░░░░
█████████░░░     ░░░░░░░░░███
████████░░░░     ░░░░░░░░█░░░
██████░░░░░░     ░░░░░░██░░░░
████░░░░░░░░     ░░░░██░░░░░░
████░░░░░░░░     ░░░░█░░░░░░░
███░░░░░░░░░     ░░░█░░░░░░░░
███░░░░░░░░░     ░░░█░░░░░░░░
██░░░░░░░░░░     ░░█░░░░░░░░░
█░░░░░░░░░░░     ░█░░░░░░░░░░
█░░░░░░░░░░░     ░█░░░░░░░░░░
█░░░░░░░░░░░     ░█░░░░░░░░░░
```

## Bitstring Format

Each grid is stored as a flat binary string where `1` = opaque pixel (drawn) and `0` = transparent:

```ts
const SM_COVER: PixelGrid = {
  name: 'corner-sm-cover',
  width: 5,
  height: 5,
  bits:
    '11111' +  // row 0: fully covered (top edge)
    '11100' +  // row 1: staircase steps right
    '11000' +  // row 2
    '10000' +  // row 3
    '10000',   // row 4
};
```

Length must equal `width × height`. Rows are stored top-to-bottom, left-to-right within each row.

## Deriving Corners from Polygon Coordinates

The bitstrings are rasterized from the `pixel-corners.config.mjs` polygon coordinates using scanline boundary tracing:

1. **Walk the polygon** — for each vertical segment at x=X spanning y₁→y₂, record x=X as the boundary for rows y₁ through y₂-1
2. **Handle diagonals** — step through intermediate integer coordinates, recording the boundary at each row
3. **Fill gaps** — if a row has no boundary but rows above/below do, interpolate from the next row below (ensures smooth cover)
4. **Separate layers** — the outer polygon defines the cover boundary; the inner polygon (1px inset) defines where cover ends and border begins

```
For each row r:
  cover[r]  = pixels where col < outerBoundary[r]
  border[r] = pixels where outerBoundary[r] ≤ col < innerBoundary[r]
  content   = pixels where col ≥ innerBoundary[r]
```

## API

### Core Types

```ts
interface PixelGrid {
  name: string;
  width: number;
  height: number;
  bits: string;  // '0' and '1' characters, length = width × height
}

interface PixelCornerSet {
  name: string;
  tl: PixelGrid;       // top-left cover grid (source of truth)
  border?: PixelGrid;   // top-left border grid (same dimensions)
  borderWidth?: number; // pixel border thickness (default 1)
}
```

### Registry Functions

```ts
import { getCornerSet, CORNER_SETS } from '@rdna/pixel';

// Look up a corner set by size name
const md = getCornerSet('md');
// md.tl      → PixelGrid (9×9 cover)
// md.border  → PixelGrid (9×9 border)

// All available sets
Object.keys(CORNER_SETS); // ['xs', 'sm', 'md', 'lg', 'xl']
```

### Mirroring

```ts
import { mirrorForCorner } from '@rdna/pixel';

const tlGrid = md.tl;
const trGrid = mirrorForCorner(tlGrid, 'tr');  // horizontal mirror
const blGrid = mirrorForCorner(tlGrid, 'bl');  // vertical mirror
const brGrid = mirrorForCorner(tlGrid, 'br');  // both axes
```

### Rendering to SVG

```ts
import { listFilledRects } from '@rdna/pixel';

const rects = listFilledRects(grid, pixelSize);
// Returns: [{ x, y, width, height }, ...]
// Each rect is one opaque pixel at the given scale.
// Use as SVG <rect> elements with fill="currentColor".
```

### Rendering to Canvas

```ts
import { paintGrid } from '@rdna/pixel';

const ctx = canvas.getContext('2d');
paintGrid(ctx, grid, '#000000', pixelSize);
// Paints opaque pixels as filled rectangles.
// NOTE: canvas fillStyle cannot accept CSS var() — resolve
// via getComputedStyle first if using design tokens.
```

## React Component

The `PixelCorner` component renders four SVG overlays positioned at each corner of a `position: relative` parent:

```tsx
import { PixelCorner } from '@rdna/radiants/components/core';

<div className="relative rounded-md border border-line shadow-md">
  <PixelCorner size="md" />
  {children}
</div>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `CornerSize \| Record<CornerPosition, CornerSize>` | — | Corner size or per-corner sizes |
| `cornerBg` | `string` | `var(--color-page)` | Background color for the cover layer |
| `borderColor` | `string` | `var(--color-line)` | Color for the staircase edge |
| `pixelSize` | `number` | `1` | CSS pixels per grid cell |
| `corners` | `CornerPosition[]` | all four | Which corners to render |

### Mixed Corner Sizes

```tsx
<PixelCorner size={{ tl: 'lg', tr: 'lg', bl: 'sm', br: 'sm' }} />
```

### Selective Corners

```tsx
// Only top corners (e.g. bottom sheet header)
<PixelCorner size="md" corners={['tl', 'tr']} />
```

## Why SVG Over Canvas

The rendering layer uses inline SVG instead of canvas:

| | SVG | Canvas |
|---|---|---|
| CSS custom properties | Direct in `fill` attribute | Requires `getComputedStyle` hack |
| SSR | Works | Requires DOM |
| Resize handling | Automatic | Needs `ResizeObserver` |
| DPR scaling | Automatic | Manual `ctx.scale(dpr, dpr)` |
| Bundle cost | Zero JS runtime | ~2KB renderer |
| Interaction | Supports `pointer-events` | Separate hit-testing |

Canvas rendering is still available via `paintGrid` for use cases that need it (e.g. animated transitions, offscreen compositing).

## Why Overlays Instead of Clip-Path

The old system used `clip-path: polygon(...)` to cut staircase corners. This blocked:

- `box-shadow` (clipped away — required `filter: drop-shadow()` workaround)
- `border` (clipped to polygon edge — required `::after` pseudo-element)
- `overflow: hidden` (double-clipping conflict)
- `position: absolute` on the element itself (overridden by `position: relative` requirement)

The overlay system paints corner shapes ON TOP of a normally-rendered element. All standard CSS properties work. The element uses standard `border-radius` as a base, and the SVG overlays paint the pixel staircase over the smooth curves.

## Adding Custom Corner Sizes

To add a new corner size:

1. Define the cover and border `PixelGrid` bitstrings in `packages/pixel/src/corner-sets.ts`
2. Add to the `CORNER_SETS` registry
3. The `PixelCorner` component picks it up automatically

For automated derivation from polygon coordinates, use the rasterization approach documented above, or hand-draw the grid and convert to a bitstring.

## File Map

```
packages/pixel/
├── src/
│   ├── types.ts          # PixelGrid, PixelCornerSet, CornerPosition
│   ├── core.ts           # parseBits, validateGrid, mirrorH, mirrorV
│   ├── corners.ts        # mirrorForCorner, getCornerStyle, CORNER_POSITIONS
│   ├── corner-sets.ts    # CORNER_SETS registry (xs–xl bitstrings)
│   ├── renderer.ts       # paintGrid, paintTiledGrid (canvas)
│   ├── svg.ts            # listFilledRects (SVG rect generation)
│   ├── patterns.ts       # PATTERN_REGISTRY (51 tiling patterns)
│   ├── transition.ts     # animateTransition, computeFlipOrder
│   └── index.ts          # barrel exports
└── test/
    └── corner-visual-compare.html  # A/B visual comparison tool
```
