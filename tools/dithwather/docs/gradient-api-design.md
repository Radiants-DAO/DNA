# Gradient API Design for Dithwather

> Gradient dithering as the primary use case, powered entirely by the binary tile pipeline.

---

## Design Principles

1. **Gradients are the default.** The most common usage should require the fewest props.
2. **Progressive complexity.** Simple cases are simple; advanced cases are possible.
3. **Everything through tiles.** No Floyd-Steinberg canvas path for gradients. The new system composites multiple tile layers with CSS, each layer representing one stop-to-stop transition.
4. **Familiar patterns.** The gradient API should feel like CSS gradients to web developers, but with the added dimension of dithering control.
5. **Animatable.** Every numeric property of a gradient (angle, stop positions, center, radius) should be interpolatable via the existing animation system.

---

## Core Types

### `@dithwather/core` — Gradient Type System

```typescript
// ============================================================================
// Gradient Types
// ============================================================================

/** A color stop in a dither gradient */
export interface DitherGradientStop {
  /** CSS color string (hex, rgb, hsl, named) */
  color: string
  /** Position along the gradient axis, 0-1. Auto-distributed if omitted. */
  position?: number
}

/** Gradient shape types */
export type DitherGradientType =
  | 'linear'
  | 'radial'
  | 'conic'
  | 'diamond'
  | 'reflected'

/** Full gradient descriptor */
export interface DitherGradient {
  /** Gradient type */
  type: DitherGradientType

  /** Color stops. Minimum 2. */
  stops: DitherGradientStop[]

  // -- Linear / Reflected --
  /** Angle in degrees (0 = left-to-right, 90 = top-to-bottom). Default: 90 */
  angle?: number

  // -- Radial / Diamond --
  /** Center point as [x, y] in 0-1 range. Default: [0.5, 0.5] */
  center?: [number, number]
  /** Radius as fraction of the container's half-diagonal. Default: 1 */
  radius?: number
  /** Aspect ratio for elliptical radial gradients. Default: 1 (circle) */
  aspect?: number

  // -- Conic --
  /** Start angle for conic gradients, in degrees. Default: 0 */
  startAngle?: number
}

/**
 * Normalized gradient with all positions resolved.
 * Internal type — users never construct this directly.
 */
export interface ResolvedDitherGradient extends DitherGradient {
  stops: Required<DitherGradientStop>[]
}
```

### Why this shape?

- **`stops` as objects, not bare arrays.** `{ color: '#f00', position: 0.3 }` is self-documenting. Position is optional so `[{ color: '#000' }, { color: '#fff' }]` auto-distributes to 0 and 1.
- **Flat geometry props on `DitherGradient`.** Rather than nesting `{ linear: { angle } }` or `{ radial: { center, radius } }`, geometry properties live directly on the gradient object. Only the relevant ones apply for each `type`. This avoids discriminated-union nesting hell and matches how CSS shorthand works.
- **`center` as tuple, not object.** `[0.5, 0.5]` is more concise than `{ x: 0.5, y: 0.5 }` and reads naturally as a coordinate.
- **`reflected` as a first-class type.** Reflected gradients (symmetric around the midpoint) are common in retro/dither aesthetics and trivial to implement as a distance function variant, so they earn a dedicated type rather than a boolean flag.

---

## `DitherBox` Props — New API

### Full interface

```typescript
export interface DitherBoxProps {
  // -- Gradient (primary path) --
  /**
   * Gradient configuration. This is the primary API.
   * - Pass an object for full control
   * - Pass a string for shorthand gradient type with default stops
   */
  gradient?: DitherGradient | DitherGradientType

  // -- Shorthand props (applied when gradient is a string or omitted) --
  /** Shorthand: gradient colors. Creates evenly-spaced stops. */
  colors?: string[]
  /** Shorthand: gradient angle in degrees (linear/reflected only) */
  angle?: number

  // -- Dither engine config --
  /** Algorithm for the dither pattern. Default: 'bayer4x4' */
  algorithm?: DitherConfig['algorithm']
  /** Pixel scale for visible dither patterns. Default: 1 */
  pixelScale?: number
  /** Global threshold bias (-0.5 to 0.5). Shifts all stop transitions. Default: 0 */
  threshold?: number
  /** Brightness adjustment (-1 to 1). Default: 0 */
  brightness?: number
  /** Contrast adjustment (-1 to 1). Default: 0 */
  contrast?: number

  // -- Display --
  /** How to apply the dither effect */
  mode?: 'background' | 'mask' | 'full'

  // -- Animation --
  /** State-based animation config */
  animate?: DitherAnimateConfig
  /** Mount/unmount dissolve */
  dissolve?: DitherDissolveConfig

  // -- Container --
  children?: ReactNode
  className?: string
  style?: CSSProperties

  // -- Escape hatch --
  /** Full config override (advanced usage) */
  config?: PartialDitherConfig
}
```

### What changed from v1

| v1 Prop | New Prop | Rationale |
|---------|----------|-----------|
| `source?: 'gradient' \| 'solid'` | **Removed.** | Gradients are the default. A single-stop gradient is a solid fill. |
| `gradientColors?: string[]` | `colors?: string[]` | Shorter name. Now a shorthand that creates evenly-spaced stops. |
| `gradientAngle?: number` | `angle?: number` | Shorter name. Only applies to linear/reflected types. |
| `colorMode?: 'mono' \| 'duotone'` | **Removed from top-level.** | The tile pipeline now derives this per-segment: each stop pair is inherently duotone (two stop colors). Mono mode is achievable by setting one stop color to `'transparent'`. |
| `colors?: DitherColors` (fg/bg) | **Removed.** | Replaced by gradient stops. No more separate `fg`/`bg` concept at the component level. |
| `intensity?: number` | **Removed for now.** | Intensity as opacity blending is orthogonal to gradient dithering. Users can use CSS `opacity` or a future `intensity` prop if needed. |
| `threshold?: number` | `threshold?: number` | **Retained** as a global bias. It shifts all transitions darker or lighter. Sensible default is 0 (no bias). |

### Backward compatibility

The old `source="solid"` + `colors={{ fg, bg }}` pattern maps to:

```tsx
// OLD
<DitherBox source="solid" colors={{ fg: '#0f0', bg: '#000' }} threshold={0.5} />

// NEW — equivalent
<DitherBox colors={['#000', '#0f0']} threshold={0} />
```

We can ship a deprecation adapter that maps old props to new ones for one major version.

---

## Usage Examples

### Simplest possible

```tsx
// Two-color linear gradient, default angle (90deg = top-to-bottom)
<DitherBox colors={['#000', '#fff']}>
  <h1>Hello</h1>
</DitherBox>
```

### Shorthand with gradient type

```tsx
// Radial gradient, auto-distributed stops
<DitherBox gradient="radial" colors={['#1a1a2e', '#e94560', '#0f3460']}>
  <Card />
</DitherBox>
```

### Full gradient object

```tsx
<DitherBox
  gradient={{
    type: 'linear',
    angle: 135,
    stops: [
      { color: '#0a0a0a', position: 0 },
      { color: '#1a1a2e', position: 0.4 },
      { color: '#e94560', position: 0.6 },
      { color: '#f5f5f5', position: 1 },
    ],
  }}
  algorithm="bayer8x8"
  pixelScale={3}
>
  <Button>Click me</Button>
</DitherBox>
```

### Radial with custom center

```tsx
<DitherBox
  gradient={{
    type: 'radial',
    center: [0.3, 0.7],
    radius: 1.2,
    stops: [
      { color: '#ff6b6b' },
      { color: '#1a1a2e' },
    ],
  }}
  algorithm="bayer4x4"
  pixelScale={2}
/>
```

### Conic gradient

```tsx
<DitherBox
  gradient={{
    type: 'conic',
    startAngle: 45,
    center: [0.5, 0.5],
    stops: [
      { color: '#ff0000', position: 0 },
      { color: '#00ff00', position: 0.33 },
      { color: '#0000ff', position: 0.66 },
      { color: '#ff0000', position: 1 },
    ],
  }}
/>
```

### Diamond gradient

```tsx
<DitherBox
  gradient={{
    type: 'diamond',
    center: [0.5, 0.5],
    stops: [
      { color: '#ffffff' },
      { color: '#000000' },
    ],
  }}
  algorithm="bayer2x2"
  pixelScale={4}
/>
```

### Reflected gradient (symmetric)

```tsx
<DitherBox
  gradient={{
    type: 'reflected',
    angle: 0,
    stops: [
      { color: '#000000' },
      { color: '#ffffff' },
    ],
  }}
/>
// Produces: black -> white -> black (mirrored at midpoint)
```

### Animated gradient

```tsx
<DitherBox
  gradient={{
    type: 'linear',
    angle: 45,
    stops: [
      { color: '#1a1a2e' },
      { color: '#e94560' },
    ],
  }}
  animate={{
    idle: { threshold: -0.1 },
    hover: { threshold: 0.1 },
    transition: 300,
  }}
/>
```

### Using DitherProvider defaults

```tsx
<DitherProvider defaults={{ algorithm: 'bayer8x8', pixelScale: 3 }}>
  {/* All DitherBoxes inherit algorithm and pixelScale */}
  <DitherBox colors={['#000', '#0f0']}>
    <Nav />
  </DitherBox>
  <DitherBox gradient="radial" colors={['#000', '#f00']}>
    <Hero />
  </DitherBox>
</DitherProvider>
```

---

## Gradient Resolution

When the user provides shorthand props, they are resolved into a full `ResolvedDitherGradient` before rendering.

```typescript
// Resolution logic (internal)
function resolveGradient(
  gradient: DitherGradient | DitherGradientType | undefined,
  colors: string[] | undefined,
  angle: number | undefined
): ResolvedDitherGradient {
  // Default: linear gradient, black to white
  const type: DitherGradientType =
    typeof gradient === 'string'
      ? gradient
      : gradient?.type ?? 'linear'

  const rawStops: DitherGradientStop[] =
    (typeof gradient === 'object' ? gradient.stops : undefined) ??
    (colors ?? ['#000000', '#ffffff']).map((color) => ({ color }))

  // Auto-distribute positions for stops that don't have one
  const stops = distributeStopPositions(rawStops)

  const base: ResolvedDitherGradient = {
    type,
    stops,
    angle: angle ?? (typeof gradient === 'object' ? gradient.angle : undefined) ?? 90,
    center: (typeof gradient === 'object' ? gradient.center : undefined) ?? [0.5, 0.5],
    radius: (typeof gradient === 'object' ? gradient.radius : undefined) ?? 1,
    aspect: (typeof gradient === 'object' ? gradient.aspect : undefined) ?? 1,
    startAngle: (typeof gradient === 'object' ? gradient.startAngle : undefined) ?? 0,
  }

  return base
}

/**
 * Distribute positions for stops that don't specify one.
 * Follows CSS gradient rules: first stop defaults to 0, last to 1,
 * intermediate stops are evenly spaced between their neighbors.
 */
function distributeStopPositions(
  stops: DitherGradientStop[]
): Required<DitherGradientStop>[] {
  const result = stops.map((s, i) => ({
    color: s.color,
    position: s.position ?? (stops.length === 1 ? 0.5 : i / (stops.length - 1)),
  }))
  return result as Required<DitherGradientStop>[]
}
```

---

## Rendering Pipeline

### How gradient tiles work (high-level)

A gradient with N stops produces N-1 **segments**. Each segment is a transition from one stop color to the next. For each segment, the renderer:

1. **Computes a distance field** for the gradient type (linear, radial, conic, diamond, reflected) to determine the 0-1 interpolation value `t` at each point in the container.
2. **Maps `t` to the segment range** — only the portion of `t` between `stop[i].position` and `stop[i+1].position` is active for this segment.
3. **Generates a tile** at the appropriate threshold for the local `t` within this segment. The tile uses the two adjacent stop colors as its fg/bg pair.
4. **Composites** all segment layers using CSS stacking or canvas compositing.

### Per-segment tile approach (CSS layers)

For each adjacent pair of stops, the system generates a CSS layer:

```
Segment 0: stop[0].color <-> stop[1].color
Segment 1: stop[1].color <-> stop[2].color
...
```

Each layer is a repeating tile pattern (from the Bayer matrix) that acts as a mask. The threshold varies spatially based on the gradient distance function — but since tiles are fixed patterns, the spatial variation is achieved by **generating multiple tiles at different threshold levels and tiling them in bands**, or by **using a single canvas render per segment** where the distance function determines the threshold at each pixel.

The preferred approach: a small canvas per segment evaluates the distance function, thresholds against the Bayer matrix, and outputs a duotone bitmap. These are composited as CSS `background-image` layers.

### Internal hook: `useGradientDither`

```typescript
export interface UseGradientDitherOptions {
  gradient: ResolvedDitherGradient
  algorithm: OrderedAlgorithm
  pixelScale: number
  threshold: number
  width: number
  height: number
}

export interface UseGradientDitherResult {
  /** CSS properties to apply to the container */
  style: CSSProperties
  /** Whether the gradient is ready to display */
  ready: boolean
}

export function useGradientDither(
  options: UseGradientDitherOptions
): UseGradientDitherResult
```

This hook replaces both `useBayerTile` (for the solid tile path) and the canvas `useEffect` (for the old gradient path). It is the single rendering path for all gradient types.

---

## Animation Design

### What can be animated

| Property | Animatable | Method |
|----------|-----------|--------|
| `angle` | Yes | Lerp |
| `startAngle` | Yes | Lerp |
| `center` | Yes | Lerp each component |
| `radius` | Yes | Lerp |
| `aspect` | Yes | Lerp |
| Stop `position` | Yes | Lerp |
| Stop `color` | Yes | Lerp in RGB (or perceptual space later) |
| `threshold` | Yes | Lerp |
| `algorithm` | No | Snap at midpoint |
| `gradient.type` | No | Snap at midpoint |
| `pixelScale` | No | Snap at midpoint |

### Gradient-aware animation config

The existing `DitherAnimateConfig` extends to support gradient overrides:

```typescript
export interface DitherAnimateConfig {
  idle?: AnimatableGradientConfig
  hover?: AnimatableGradientConfig
  focus?: AnimatableGradientConfig
  active?: AnimatableGradientConfig
  transition?: number
}

/** Properties that can be animated on state change */
export interface AnimatableGradientConfig extends PartialDitherConfig {
  angle?: number
  center?: [number, number]
  radius?: number
  startAngle?: number
  threshold?: number
  /** Override stop positions/colors for this state */
  stops?: DitherGradientStop[]
}
```

Example:

```tsx
<DitherBox
  gradient={{
    type: 'linear',
    angle: 45,
    stops: [
      { color: '#1a1a2e' },
      { color: '#e94560' },
    ],
  }}
  animate={{
    idle: { angle: 45 },
    hover: { angle: 135, stops: [
      { color: '#e94560' },
      { color: '#1a1a2e' },
    ]},
    transition: 500,
  }}
/>
```

### Continuous animation (future, but API-ready)

```tsx
<DitherBox
  gradient={{ type: 'conic', stops: [...] }}
  animate={{
    continuous: {
      startAngle: { from: 0, to: 360, duration: 3000, repeat: Infinity },
    },
  }}
/>
```

This is a future extension. The type system accommodates it without breaking changes.

---

## Editor Integration

### DitherEditor changes

The editor needs new panels for gradient configuration:

```typescript
export interface DitherEditorProps {
  // ... existing props ...

  /** Show gradient controls */
  showGradient?: boolean  // default: true
}
```

### Required UI controls by gradient type

| Control | Linear | Radial | Conic | Diamond | Reflected |
|---------|--------|--------|-------|---------|-----------|
| **Angle dial** | Yes | -- | -- | -- | Yes |
| **Center point** (x,y pad) | -- | Yes | Yes | Yes | -- |
| **Radius slider** | -- | Yes | -- | Yes | -- |
| **Aspect ratio slider** | -- | Yes | -- | -- | -- |
| **Start angle dial** | -- | -- | Yes | -- | -- |
| **Gradient type picker** | Shared | Shared | Shared | Shared | Shared |
| **Color stop bar** | Shared | Shared | Shared | Shared | Shared |

### Color stop bar

A horizontal bar showing the gradient with draggable color stops:

- Click on the bar to add a new stop
- Drag stops to reposition (updates `position` 0-1)
- Click a stop to select it and edit its color
- Double-click or delete key to remove a stop (min 2 stops)
- Stops snap to 0.01 increments

### Editor export code example

```typescript
// Generated code for a configured gradient
<DitherBox
  gradient={{
    type: 'radial',
    center: [0.3, 0.7],
    radius: 1.2,
    stops: [
      { color: '#ff6b6b', position: 0 },
      { color: '#1a1a2e', position: 1 },
    ],
  }}
  algorithm="bayer4x4"
  pixelScale={2}
>
  {children}
</DitherBox>
```

---

## Helper: `gradient()` builder

For developers who prefer a functional style, export a builder function:

```typescript
import { gradient } from '@dithwather/react'

// Builder pattern
const g = gradient('linear', 135)
  .stop('#1a1a2e', 0)
  .stop('#e94560', 0.5)
  .stop('#f5f5f5', 1)
  .build()

<DitherBox gradient={g}>...</DitherBox>

// Implementation
export function gradient(
  type: DitherGradientType,
  angleOrOptions?: number | Partial<Omit<DitherGradient, 'type' | 'stops'>>
): GradientBuilder {
  return new GradientBuilder(type, angleOrOptions)
}

class GradientBuilder {
  private _type: DitherGradientType
  private _stops: DitherGradientStop[] = []
  private _options: Partial<Omit<DitherGradient, 'type' | 'stops'>>

  constructor(
    type: DitherGradientType,
    angleOrOptions?: number | Partial<Omit<DitherGradient, 'type' | 'stops'>>
  ) {
    this._type = type
    this._options = typeof angleOrOptions === 'number'
      ? { angle: angleOrOptions }
      : angleOrOptions ?? {}
  }

  stop(color: string, position?: number): this {
    this._stops.push({ color, position })
    return this
  }

  build(): DitherGradient {
    return {
      type: this._type,
      ...this._options,
      stops: this._stops,
    }
  }
}
```

---

## Migration Path

### Phase 1: Add new API alongside old

- Add `gradient`, `colors` (new shorthand), `angle` props
- Old `source`, `gradientColors`, `gradientAngle`, `colorMode`, `colors` (fg/bg) still work
- Internal logic detects which API is being used and routes accordingly
- Console warning on deprecated prop usage in dev mode

### Phase 2: Deprecation

- Mark old props as `@deprecated` in TypeScript
- Add codemod for automated migration
- Document migration guide

### Phase 3: Removal

- Remove deprecated props in next major version

---

## Summary: API at a glance

```tsx
// Minimal
<DitherBox colors={['#000', '#fff']} />

// With type
<DitherBox gradient="radial" colors={['#000', '#f00', '#fff']} />

// Full control
<DitherBox
  gradient={{
    type: 'linear',
    angle: 135,
    stops: [
      { color: '#0a0a0a', position: 0 },
      { color: '#e94560', position: 0.6 },
      { color: '#f5f5f5', position: 1 },
    ],
  }}
  algorithm="bayer8x8"
  pixelScale={3}
  threshold={0}
  mode="background"
/>

// Animated
<DitherBox
  gradient={{ type: 'linear', angle: 45, stops: [...] }}
  animate={{
    idle: { angle: 45 },
    hover: { angle: 135 },
    transition: 300,
  }}
/>
```
