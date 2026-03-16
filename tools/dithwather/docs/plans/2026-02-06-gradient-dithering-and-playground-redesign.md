# Gradient Dithering System + Playground Redesign

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the solid-tile Bayer path with a gradient-first dithering system using per-pixel Bayer comparison, supporting 5 gradient types and multi-color stops, then redesign the playground with the radiants theme.

**Architecture:** Gradient dithering works by evaluating a distance function (linear, radial, conic, diamond, reflected) at each pixel to get a 0–1 value, finding which color-stop segment that value falls in, then comparing the local threshold against the Bayer matrix cell at that pixel position to choose one of two adjacent stop colors. This replaces both the old solid-tile CSS path and the Floyd-Steinberg canvas path for Bayer algorithms. Floyd-Steinberg is removed entirely — Bayer + per-pixel comparison produces better results for all gradient types.

**Tech Stack:** TypeScript, React 18, Vitest, Canvas API, pnpm monorepo (Turborepo)

**Research Docs:**
- `docs/gradient-api-design.md` — API surface
- `docs/gradient-math.md` — gradient math functions
- `docs/playground-design-spec.md` — radiants design spec
- `docs/brainstorms/2026-02-05-binary-tile-pipeline-brainstorm.md`

---

## Task 1: Gradient Types in Core

**Files:**
- Create: `packages/core/src/gradients/types.ts`
- Create: `packages/core/src/gradients/index.ts`
- Test: `packages/core/src/gradients/types.test.ts`

**Step 1: Create the gradient type definitions**

```typescript
// packages/core/src/gradients/types.ts

/** Gradient shape types */
export type DitherGradientType =
  | 'linear'
  | 'radial'
  | 'conic'
  | 'diamond'
  | 'reflected'

/** A color stop in a dither gradient */
export interface DitherGradientStop {
  /** CSS color string (hex, rgb, hsl, named) */
  color: string
  /** Position along the gradient axis, 0-1. Auto-distributed if omitted. */
  position?: number
}

/** Full gradient descriptor */
export interface DitherGradient {
  type: DitherGradientType
  stops: DitherGradientStop[]
  /** Angle in degrees for linear/reflected. CSS convention: 0=to-top, 90=to-right. Default: 90 */
  angle?: number
  /** Center point as [x, y] in 0-1 range. Default: [0.5, 0.5] */
  center?: [number, number]
  /** Radius as fraction of container half-diagonal. Default: 1 */
  radius?: number
  /** Aspect ratio for elliptical radial. Default: 1 (circle) */
  aspect?: number
  /** Start angle for conic gradients, degrees. Default: 0 */
  startAngle?: number
}

/** Internal resolved gradient — all positions filled in */
export interface ResolvedGradient {
  type: DitherGradientType
  stops: Required<DitherGradientStop>[]
  angle: number
  center: [number, number]
  radius: number
  aspect: number
  startAngle: number
}

/** Result of finding which stop segment a gradient value falls in */
export interface StopSegment {
  colorA: string
  colorB: string
  localT: number
}

/**
 * Distribute positions for stops that don't specify one.
 * First stop defaults to 0, last to 1, intermediates evenly spaced.
 */
export function resolveStops(
  stops: DitherGradientStop[]
): Required<DitherGradientStop>[] {
  if (stops.length === 0) return [{ color: '#000000', position: 0 }, { color: '#ffffff', position: 1 }]
  if (stops.length === 1) return [{ color: stops[0].color, position: 0 }, { color: stops[0].color, position: 1 }]

  return stops.map((s, i) => ({
    color: s.color,
    position: s.position ?? i / (stops.length - 1),
  }))
}

/**
 * Resolve shorthand props into a full ResolvedGradient.
 */
export function resolveGradient(
  gradient: DitherGradient | DitherGradientType | undefined,
  colors: string[] | undefined,
  angle: number | undefined
): ResolvedGradient {
  const type: DitherGradientType =
    typeof gradient === 'string' ? gradient
    : gradient?.type ?? 'linear'

  const rawStops: DitherGradientStop[] =
    (typeof gradient === 'object' ? gradient.stops : undefined) ??
    (colors ?? ['#000000', '#ffffff']).map((color) => ({ color }))

  return {
    type,
    stops: resolveStops(rawStops),
    angle: angle ?? (typeof gradient === 'object' ? gradient.angle : undefined) ?? 90,
    center: (typeof gradient === 'object' ? gradient.center : undefined) ?? [0.5, 0.5],
    radius: (typeof gradient === 'object' ? gradient.radius : undefined) ?? 1,
    aspect: (typeof gradient === 'object' ? gradient.aspect : undefined) ?? 1,
    startAngle: (typeof gradient === 'object' ? gradient.startAngle : undefined) ?? 0,
  }
}

/**
 * Find which stop segment a gradient value t falls in.
 */
export function findStopSegment(
  t: number,
  stops: Required<DitherGradientStop>[]
): StopSegment {
  t = Math.max(0, Math.min(1, t))

  if (stops.length < 2) {
    return { colorA: stops[0]?.color ?? '#000000', colorB: stops[0]?.color ?? '#000000', localT: 0 }
  }

  for (let i = 0; i < stops.length - 1; i++) {
    if (t <= stops[i + 1].position) {
      const segLen = stops[i + 1].position - stops[i].position
      const localT = segLen > 0 ? (t - stops[i].position) / segLen : 0
      return {
        colorA: stops[i].color,
        colorB: stops[i + 1].color,
        localT: Math.max(0, Math.min(1, localT)),
      }
    }
  }

  const last = stops[stops.length - 1]
  return { colorA: last.color, colorB: last.color, localT: 1 }
}
```

**Step 2: Create barrel export**

```typescript
// packages/core/src/gradients/index.ts
export {
  type DitherGradientType,
  type DitherGradientStop,
  type DitherGradient,
  type ResolvedGradient,
  type StopSegment,
  resolveStops,
  resolveGradient,
  findStopSegment,
} from './types'
```

**Step 3: Write the tests**

```typescript
// packages/core/src/gradients/types.test.ts
import { describe, it, expect } from 'vitest'
import { resolveStops, resolveGradient, findStopSegment } from './types'

describe('resolveStops', () => {
  it('auto-distributes 2 stops to 0 and 1', () => {
    const result = resolveStops([{ color: '#000' }, { color: '#fff' }])
    expect(result).toEqual([
      { color: '#000', position: 0 },
      { color: '#fff', position: 1 },
    ])
  })

  it('auto-distributes 3 stops evenly', () => {
    const result = resolveStops([{ color: '#f00' }, { color: '#0f0' }, { color: '#00f' }])
    expect(result[0].position).toBe(0)
    expect(result[1].position).toBe(0.5)
    expect(result[2].position).toBe(1)
  })

  it('preserves explicit positions', () => {
    const result = resolveStops([
      { color: '#000', position: 0 },
      { color: '#fff', position: 0.3 },
    ])
    expect(result[1].position).toBe(0.3)
  })

  it('returns black-to-white for empty input', () => {
    const result = resolveStops([])
    expect(result.length).toBe(2)
  })

  it('duplicates single stop', () => {
    const result = resolveStops([{ color: '#f00' }])
    expect(result.length).toBe(2)
    expect(result[0].color).toBe('#f00')
    expect(result[1].color).toBe('#f00')
  })
})

describe('resolveGradient', () => {
  it('defaults to linear black-to-white at 90deg', () => {
    const g = resolveGradient(undefined, undefined, undefined)
    expect(g.type).toBe('linear')
    expect(g.angle).toBe(90)
    expect(g.stops.length).toBe(2)
  })

  it('resolves string shorthand', () => {
    const g = resolveGradient('radial', ['#f00', '#00f'], undefined)
    expect(g.type).toBe('radial')
    expect(g.stops[0].color).toBe('#f00')
  })

  it('resolves full gradient object', () => {
    const g = resolveGradient(
      { type: 'conic', stops: [{ color: '#f00' }, { color: '#00f' }], startAngle: 45 },
      undefined, undefined
    )
    expect(g.type).toBe('conic')
    expect(g.startAngle).toBe(45)
  })

  it('colors prop creates evenly-spaced stops', () => {
    const g = resolveGradient(undefined, ['#f00', '#0f0', '#00f'], undefined)
    expect(g.stops[1].position).toBe(0.5)
  })

  it('angle prop overrides gradient object angle', () => {
    const g = resolveGradient(undefined, undefined, 135)
    expect(g.angle).toBe(135)
  })
})

describe('findStopSegment', () => {
  const stops = [
    { color: '#f00', position: 0 },
    { color: '#0f0', position: 0.5 },
    { color: '#00f', position: 1 },
  ] as Required<{ color: string; position: number }>[]

  it('returns first segment for t=0.25', () => {
    const seg = findStopSegment(0.25, stops)
    expect(seg.colorA).toBe('#f00')
    expect(seg.colorB).toBe('#0f0')
    expect(seg.localT).toBe(0.5)
  })

  it('returns second segment for t=0.75', () => {
    const seg = findStopSegment(0.75, stops)
    expect(seg.colorA).toBe('#0f0')
    expect(seg.colorB).toBe('#00f')
    expect(seg.localT).toBe(0.5)
  })

  it('clamps t below 0', () => {
    const seg = findStopSegment(-0.5, stops)
    expect(seg.colorA).toBe('#f00')
    expect(seg.localT).toBe(0)
  })

  it('clamps t above 1', () => {
    const seg = findStopSegment(1.5, stops)
    expect(seg.colorA).toBe('#00f')
  })

  it('handles exact stop boundary', () => {
    const seg = findStopSegment(0.5, stops)
    expect(seg.localT).toBe(1)
    expect(seg.colorB).toBe('#0f0')
  })
})
```

**Step 4: Run tests to verify they fail**

Run: `cd packages/core && pnpm vitest run src/gradients/types.test.ts`
Expected: FAIL (module not found)

**Step 5: Verify tests pass after creating the files**

Run: `cd packages/core && pnpm vitest run src/gradients/types.test.ts`
Expected: PASS (all tests green)

**Step 6: Commit**

```bash
git add packages/core/src/gradients/
git commit -m "feat(core): add gradient types, stop resolution, and segment lookup"
```

---

## Task 2: Gradient Distance Functions

**Files:**
- Create: `packages/core/src/gradients/distance.ts`
- Test: `packages/core/src/gradients/distance.test.ts`
- Modify: `packages/core/src/gradients/index.ts` — add exports

**Step 1: Write the distance functions**

```typescript
// packages/core/src/gradients/distance.ts
import type { DitherGradientType } from './types'

/**
 * Linear gradient: project pixel onto gradient line.
 * CSS convention: 0deg = bottom-to-top, 90deg = left-to-right.
 */
export function linearGradientValue(
  x: number, y: number,
  width: number, height: number,
  angleDeg: number
): number {
  const rad = (angleDeg * Math.PI) / 180
  const dx = Math.sin(rad)
  const dy = -Math.cos(rad)

  const halfLength = Math.abs((width / 2) * dx) + Math.abs((height / 2) * dy)
  if (halfLength === 0) return 0.5

  const px = x - width / 2
  const py = y - height / 2
  const projection = px * dx + py * dy

  return Math.max(0, Math.min(1, (projection + halfLength) / (2 * halfLength)))
}

/**
 * Radial gradient: normalized Euclidean distance from center.
 * Supports ellipses via separate rx/ry.
 */
export function radialGradientValue(
  x: number, y: number,
  cx: number, cy: number,
  rx: number, ry: number
): number {
  if (rx === 0 || ry === 0) return 1
  const ndx = (x - cx) / rx
  const ndy = (y - cy) / ry
  return Math.max(0, Math.min(1, Math.sqrt(ndx * ndx + ndy * ndy)))
}

/**
 * Conic gradient: atan2-based angle from center.
 * CSS convention: 0deg = top, clockwise.
 */
export function conicGradientValue(
  x: number, y: number,
  cx: number, cy: number,
  startAngleDeg: number
): number {
  const startRad = (startAngleDeg * Math.PI) / 180
  let theta = Math.atan2(x - cx, -(y - cy))
  theta -= startRad
  const TWO_PI = Math.PI * 2
  theta = ((theta % TWO_PI) + TWO_PI) % TWO_PI
  return theta / TWO_PI
}

/**
 * Diamond gradient: Manhattan distance (L1 norm) from center.
 */
export function diamondGradientValue(
  x: number, y: number,
  cx: number, cy: number,
  rx: number, ry: number
): number {
  if (rx === 0 || ry === 0) return 1
  const ndx = Math.abs(x - cx) / rx
  const ndy = Math.abs(y - cy) / ry
  return Math.max(0, Math.min(1, ndx + ndy))
}

/**
 * Reflected gradient: linear that mirrors at midpoint (0 → 1 → 0).
 */
export function reflectedGradientValue(
  x: number, y: number,
  width: number, height: number,
  angleDeg: number
): number {
  const tLinear = linearGradientValue(x, y, width, height, angleDeg)
  return 1 - Math.abs(2 * tLinear - 1)
}

/**
 * Unified dispatcher: evaluates the gradient distance function at (x, y).
 */
export function gradientValue(
  x: number, y: number,
  width: number, height: number,
  type: DitherGradientType,
  angleDeg: number,
  cx: number, cy: number,
  rx: number, ry: number,
  startAngleDeg: number
): number {
  switch (type) {
    case 'linear':
      return linearGradientValue(x, y, width, height, angleDeg)
    case 'radial':
      return radialGradientValue(x, y, cx, cy, rx, ry)
    case 'conic':
      return conicGradientValue(x, y, cx, cy, startAngleDeg)
    case 'diamond':
      return diamondGradientValue(x, y, cx, cy, rx, ry)
    case 'reflected':
      return reflectedGradientValue(x, y, width, height, angleDeg)
  }
}
```

**Step 2: Write the tests**

```typescript
// packages/core/src/gradients/distance.test.ts
import { describe, it, expect } from 'vitest'
import {
  linearGradientValue,
  radialGradientValue,
  conicGradientValue,
  diamondGradientValue,
  reflectedGradientValue,
  gradientValue,
} from './distance'

describe('linearGradientValue', () => {
  // 90deg = left to right
  it('returns 0 at left edge for 90deg', () => {
    expect(linearGradientValue(0, 50, 100, 100, 90)).toBeCloseTo(0, 1)
  })

  it('returns 1 at right edge for 90deg', () => {
    expect(linearGradientValue(100, 50, 100, 100, 90)).toBeCloseTo(1, 1)
  })

  it('returns 0.5 at center for 90deg', () => {
    expect(linearGradientValue(50, 50, 100, 100, 90)).toBeCloseTo(0.5, 1)
  })

  // 0deg = bottom to top
  it('returns 0 at bottom for 0deg', () => {
    expect(linearGradientValue(50, 100, 100, 100, 0)).toBeCloseTo(0, 1)
  })

  it('returns 1 at top for 0deg', () => {
    expect(linearGradientValue(50, 0, 100, 100, 0)).toBeCloseTo(1, 1)
  })

  it('returns 0.5 for zero-size box', () => {
    expect(linearGradientValue(0, 0, 0, 0, 90)).toBe(0.5)
  })
})

describe('radialGradientValue', () => {
  it('returns 0 at center', () => {
    expect(radialGradientValue(50, 50, 50, 50, 50, 50)).toBe(0)
  })

  it('returns 1 at edge of circle', () => {
    expect(radialGradientValue(100, 50, 50, 50, 50, 50)).toBeCloseTo(1, 1)
  })

  it('clamps beyond radius to 1', () => {
    expect(radialGradientValue(200, 50, 50, 50, 50, 50)).toBe(1)
  })

  it('returns 1 for zero radius', () => {
    expect(radialGradientValue(50, 50, 50, 50, 0, 0)).toBe(1)
  })
})

describe('conicGradientValue', () => {
  // At 12 o'clock (directly above center), angle should be ~0
  it('returns ~0 directly above center with startAngle=0', () => {
    expect(conicGradientValue(50, 0, 50, 50, 0)).toBeCloseTo(0, 1)
  })

  // At 3 o'clock (right of center), angle should be ~0.25
  it('returns ~0.25 directly right of center', () => {
    expect(conicGradientValue(100, 50, 50, 50, 0)).toBeCloseTo(0.25, 1)
  })

  // At 6 o'clock (below center), angle should be ~0.5
  it('returns ~0.5 directly below center', () => {
    expect(conicGradientValue(50, 100, 50, 50, 0)).toBeCloseTo(0.5, 1)
  })

  it('startAngle rotates the result', () => {
    // With 90deg start, the "top" position should now read ~0.75
    const val = conicGradientValue(50, 0, 50, 50, 90)
    expect(val).toBeCloseTo(0.75, 1)
  })
})

describe('diamondGradientValue', () => {
  it('returns 0 at center', () => {
    expect(diamondGradientValue(50, 50, 50, 50, 50, 50)).toBe(0)
  })

  it('returns 1 at corner of diamond', () => {
    // Manhattan distance: |50/50| + |0/50| = 1
    expect(diamondGradientValue(100, 50, 50, 50, 50, 50)).toBeCloseTo(1, 1)
  })

  it('returns 1 for zero radius', () => {
    expect(diamondGradientValue(50, 50, 50, 50, 0, 0)).toBe(1)
  })
})

describe('reflectedGradientValue', () => {
  // For 90deg: left=0, center=1, right=0
  it('returns 0 at left edge', () => {
    expect(reflectedGradientValue(0, 50, 100, 100, 90)).toBeCloseTo(0, 1)
  })

  it('returns 1 at center', () => {
    expect(reflectedGradientValue(50, 50, 100, 100, 90)).toBeCloseTo(1, 1)
  })

  it('returns 0 at right edge', () => {
    expect(reflectedGradientValue(100, 50, 100, 100, 90)).toBeCloseTo(0, 1)
  })
})

describe('gradientValue dispatcher', () => {
  it('dispatches linear correctly', () => {
    const val = gradientValue(50, 50, 100, 100, 'linear', 90, 50, 50, 50, 50, 0)
    expect(val).toBeCloseTo(0.5, 1)
  })

  it('dispatches radial correctly', () => {
    const val = gradientValue(50, 50, 100, 100, 'radial', 0, 50, 50, 50, 50, 0)
    expect(val).toBe(0)
  })

  it('dispatches diamond correctly', () => {
    const val = gradientValue(50, 50, 100, 100, 'diamond', 0, 50, 50, 50, 50, 0)
    expect(val).toBe(0)
  })
})
```

**Step 3: Add exports to barrel**

Add to `packages/core/src/gradients/index.ts`:

```typescript
export {
  linearGradientValue,
  radialGradientValue,
  conicGradientValue,
  diamondGradientValue,
  reflectedGradientValue,
  gradientValue,
} from './distance'
```

**Step 4: Run tests**

Run: `cd packages/core && pnpm vitest run src/gradients/distance.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/core/src/gradients/
git commit -m "feat(core): add gradient distance functions for all 5 types"
```

---

## Task 3: Gradient Dither Renderer

**Files:**
- Create: `packages/core/src/gradients/render.ts`
- Test: `packages/core/src/gradients/render.test.ts`
- Modify: `packages/core/src/gradients/index.ts` — add exports
- Modify: `packages/core/src/index.ts` — add gradient exports

This is the core rendering function: per-pixel Bayer comparison on a gradient field.

**Step 1: Write the renderer**

```typescript
// packages/core/src/gradients/render.ts
import type { ResolvedGradient } from './types'
import type { OrderedAlgorithm } from '../types'
import { findStopSegment } from './types'
import { gradientValue } from './distance'
import { BAYER_MATRICES } from '../algorithms/bayer'
import { hexToRgb } from '../utils/color'

export interface GradientDitherOptions {
  gradient: ResolvedGradient
  algorithm: OrderedAlgorithm
  width: number
  height: number
  /** Global threshold bias (-0.5 to 0.5). Shifts all transitions. Default: 0 */
  threshold?: number
  /** Pixel scale — each logical pixel maps to a scale×scale block. Default: 1 */
  pixelScale?: number
}

/**
 * Render a dithered gradient to ImageData using per-pixel Bayer comparison.
 * Zero banding — continuous threshold comparison, no tile quantization.
 */
export function renderGradientDither(options: GradientDitherOptions): ImageData {
  const {
    gradient,
    algorithm,
    width,
    height,
    threshold: bias = 0,
    pixelScale = 1,
  } = options

  const matrix = BAYER_MATRICES[algorithm]
  if (!matrix) throw new Error(`Unknown algorithm: ${algorithm}`)

  const matrixSize = matrix.length
  const imageData = new ImageData(width, height)
  const data = imageData.data

  // Pre-resolve center/radius to pixel coordinates
  const cx = gradient.center[0] * width
  const cy = gradient.center[1] * height
  const maxDim = Math.sqrt(width * width + height * height) / 2
  const rx = gradient.radius * maxDim * (1 / gradient.aspect)
  const ry = gradient.radius * maxDim

  // Pre-parse stop colors to RGB
  const stopRGBs = gradient.stops.map((s) => hexToRgb(s.color))

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const i = (py * width + px) * 4

      // Logical pixel position (for Bayer matrix lookup with pixelScale)
      const lx = Math.floor(px / pixelScale)
      const ly = Math.floor(py / pixelScale)

      // 1. Evaluate gradient distance function
      const t = gradientValue(
        px, py, width, height,
        gradient.type, gradient.angle,
        cx, cy, rx, ry, gradient.startAngle
      )

      // 2. Find stop segment
      const seg = findStopSegment(t, gradient.stops)

      // 3. Get Bayer threshold at this logical pixel
      const bayerThreshold = matrix[ly % matrixSize][lx % matrixSize]

      // 4. Compare local threshold (with bias) against Bayer value
      const useColorB = (seg.localT + bias) > bayerThreshold

      // 5. Pick color — use pre-parsed RGB for the matching stop index
      let segAIndex = 0
      let segBIndex = 1
      for (let si = 0; si < gradient.stops.length - 1; si++) {
        if (t <= gradient.stops[si + 1].position) {
          segAIndex = si
          segBIndex = si + 1
          break
        }
        segAIndex = gradient.stops.length - 1
        segBIndex = gradient.stops.length - 1
      }

      const rgb = useColorB ? stopRGBs[segBIndex] : stopRGBs[segAIndex]
      data[i] = rgb.r
      data[i + 1] = rgb.g
      data[i + 2] = rgb.b
      data[i + 3] = 255
    }
  }

  return imageData
}

/**
 * Render a dithered gradient to a data URL.
 * Requires DOM (document.createElement).
 */
export function renderGradientToDataURL(options: GradientDitherOptions): string {
  if (typeof document === 'undefined') return ''

  const imageData = renderGradientDither(options)
  const canvas = document.createElement('canvas')
  canvas.width = options.width
  canvas.height = options.height
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL()
}
```

**Step 2: Write tests**

```typescript
// packages/core/src/gradients/render.test.ts
import { describe, it, expect } from 'vitest'
import { renderGradientDither } from './render'
import type { ResolvedGradient } from './types'

function makeGradient(overrides: Partial<ResolvedGradient> = {}): ResolvedGradient {
  return {
    type: 'linear',
    stops: [
      { color: '#000000', position: 0 },
      { color: '#ffffff', position: 1 },
    ],
    angle: 90,
    center: [0.5, 0.5],
    radius: 1,
    aspect: 1,
    startAngle: 0,
    ...overrides,
  }
}

describe('renderGradientDither', () => {
  it('returns ImageData of correct dimensions', () => {
    const result = renderGradientDither({
      gradient: makeGradient(),
      algorithm: 'bayer4x4',
      width: 32,
      height: 32,
    })
    expect(result.width).toBe(32)
    expect(result.height).toBe(32)
    expect(result.data.length).toBe(32 * 32 * 4)
  })

  it('produces only two colors for a 2-stop gradient', () => {
    const result = renderGradientDither({
      gradient: makeGradient(),
      algorithm: 'bayer4x4',
      width: 16,
      height: 16,
    })
    const colors = new Set<string>()
    for (let i = 0; i < result.data.length; i += 4) {
      colors.add(`${result.data[i]},${result.data[i + 1]},${result.data[i + 2]}`)
    }
    expect(colors.size).toBe(2)
    expect(colors.has('0,0,0')).toBe(true)
    expect(colors.has('255,255,255')).toBe(true)
  })

  it('left edge is darker than right edge for 90deg linear', () => {
    const result = renderGradientDither({
      gradient: makeGradient({ angle: 90 }),
      algorithm: 'bayer4x4',
      width: 64,
      height: 16,
    })
    // Count white pixels in leftmost 16 columns vs rightmost 16
    let leftWhite = 0, rightWhite = 0
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const i = (y * 64 + x) * 4
        if (result.data[i] === 255) leftWhite++
      }
      for (let x = 48; x < 64; x++) {
        const i = (y * 64 + x) * 4
        if (result.data[i] === 255) rightWhite++
      }
    }
    expect(rightWhite).toBeGreaterThan(leftWhite)
  })

  it('all-black gradient produces all-black pixels', () => {
    const result = renderGradientDither({
      gradient: makeGradient({
        stops: [{ color: '#000000', position: 0 }, { color: '#000000', position: 1 }],
      }),
      algorithm: 'bayer4x4',
      width: 8,
      height: 8,
    })
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i]).toBe(0)
    }
  })

  it('works with 3-stop gradient', () => {
    const result = renderGradientDither({
      gradient: makeGradient({
        stops: [
          { color: '#ff0000', position: 0 },
          { color: '#00ff00', position: 0.5 },
          { color: '#0000ff', position: 1 },
        ],
      }),
      algorithm: 'bayer4x4',
      width: 32,
      height: 8,
    })
    // Should have at least 2 distinct colors
    const colors = new Set<string>()
    for (let i = 0; i < result.data.length; i += 4) {
      colors.add(`${result.data[i]},${result.data[i + 1]},${result.data[i + 2]}`)
    }
    expect(colors.size).toBeGreaterThanOrEqual(2)
  })

  it('works with all 3 Bayer algorithms', () => {
    for (const alg of ['bayer2x2', 'bayer4x4', 'bayer8x8'] as const) {
      const result = renderGradientDither({
        gradient: makeGradient(),
        algorithm: alg,
        width: 16,
        height: 16,
      })
      expect(result.width).toBe(16)
    }
  })

  it('throws for unknown algorithm', () => {
    expect(() =>
      renderGradientDither({
        gradient: makeGradient(),
        algorithm: 'invalid' as any,
        width: 16,
        height: 16,
      })
    ).toThrow('Unknown algorithm')
  })

  it('radial gradient has darker edges than center', () => {
    const result = renderGradientDither({
      gradient: makeGradient({ type: 'radial' }),
      algorithm: 'bayer4x4',
      width: 32,
      height: 32,
    })
    // Center pixel should be more likely white
    const centerI = (16 * 32 + 16) * 4
    const cornerI = (0 * 32 + 0) * 4
    // Count white in 4x4 center vs 4x4 corner
    let centerWhite = 0, cornerWhite = 0
    for (let dy = -2; dy < 2; dy++) {
      for (let dx = -2; dx < 2; dx++) {
        const ci = ((16 + dy) * 32 + (16 + dx)) * 4
        if (result.data[ci] === 255) centerWhite++
        const coi = ((0 + Math.max(0, dy)) * 32 + Math.max(0, dx)) * 4
        if (result.data[coi] === 255) cornerWhite++
      }
    }
    // Radial: center = t≈0 (black), edge = t≈1 (white)
    // So corner should have MORE white
    expect(cornerWhite).toBeGreaterThanOrEqual(centerWhite)
  })

  it('pixelScale creates block patterns', () => {
    const result = renderGradientDither({
      gradient: makeGradient({
        stops: [{ color: '#000000', position: 0 }, { color: '#ffffff', position: 1 }],
      }),
      algorithm: 'bayer4x4',
      width: 16,
      height: 16,
      pixelScale: 2,
    })
    // With pixelScale=2, adjacent pixels in a 2x2 block should be the same
    for (let y = 0; y < 16; y += 2) {
      for (let x = 0; x < 16; x += 2) {
        const i00 = (y * 16 + x) * 4
        const i10 = (y * 16 + (x + 1)) * 4
        const i01 = ((y + 1) * 16 + x) * 4
        const i11 = ((y + 1) * 16 + (x + 1)) * 4
        expect(result.data[i00]).toBe(result.data[i10])
        expect(result.data[i00]).toBe(result.data[i01])
        expect(result.data[i00]).toBe(result.data[i11])
      }
    }
  })
})
```

**Step 3: Add to barrel exports**

Add to `packages/core/src/gradients/index.ts`:

```typescript
export { renderGradientDither, renderGradientToDataURL, type GradientDitherOptions } from './render'
```

Add to `packages/core/src/index.ts` (after existing tile exports):

```typescript
// Gradients
export {
  type DitherGradientType,
  type DitherGradientStop,
  type DitherGradient,
  type ResolvedGradient,
  type StopSegment,
  type GradientDitherOptions,
  resolveStops,
  resolveGradient,
  findStopSegment,
  linearGradientValue,
  radialGradientValue,
  conicGradientValue,
  diamondGradientValue,
  reflectedGradientValue,
  gradientValue,
  renderGradientDither,
  renderGradientToDataURL,
} from './gradients'
```

**Step 4: Run all core tests**

Run: `cd packages/core && pnpm vitest run`
Expected: ALL PASS (existing 116 tests + new gradient tests)

**Step 5: Commit**

```bash
git add packages/core/src/gradients/ packages/core/src/index.ts
git commit -m "feat(core): add gradient dither renderer with per-pixel Bayer comparison"
```

---

## Task 4: New DitherBox Gradient API

**Files:**
- Modify: `packages/react/src/components/DitherBox.tsx`
- Modify: `packages/react/src/index.ts` — export new types

This replaces the old `source`/`gradientColors`/`gradientAngle`/`colorMode`/`colors` props with the new `gradient`/`colors`/`angle` API. Old props are kept but console-warned as deprecated.

**Step 1: Update DitherBoxProps interface**

In `packages/react/src/components/DitherBox.tsx`, replace the interface and add the gradient rendering path:

```typescript
// NEW props to ADD (keep all existing props for backward compat):

export interface DitherBoxProps {
  // -- NEW: Gradient (primary path) --
  /** Gradient config. String shorthand or full object. */
  gradient?: DitherGradient | DitherGradientType
  /** Shorthand: gradient colors (evenly-spaced stops) */
  colors?: string[]
  /** Shorthand: gradient angle in degrees */
  angle?: number

  // -- EXISTING (kept for backward compat, deprecated) --
  algorithm?: DitherConfig['algorithm']
  colorMode?: DitherConfig['colorMode']
  /** @deprecated Use `colors` (string[]) or `gradient.stops` instead */
  ditherColors?: DitherConfig['colors']
  intensity?: number
  threshold?: number
  brightness?: number
  contrast?: number
  mode?: DitherMode
  animate?: DitherAnimateConfig
  dissolve?: DitherDissolveConfig
  pixelScale?: number
  /** @deprecated Use `gradient` prop instead */
  source?: 'gradient' | 'solid'
  /** @deprecated Use `colors` prop instead */
  gradientColors?: string[]
  /** @deprecated Use `angle` prop instead */
  gradientAngle?: number
  children?: ReactNode
  className?: string
  style?: CSSProperties
  config?: PartialDitherConfig
}
```

**Step 2: Add gradient rendering path inside DitherBox**

The component should detect whether new API or old API is being used, and route accordingly:

- **New API** (has `gradient`, `colors`, or `angle` prop): resolve gradient → call `renderGradientToDataURL` → use as background-image
- **Old solid API** (has `source="solid"`): use existing `useBayerTile` path
- **Old gradient API** (has `source="gradient"` or `gradientColors`): use existing canvas path with deprecation warning

The gradient rendering runs inside a `useEffect` that depends on `[resolvedGradient, algorithm, width, height, pixelScale, threshold]`. Output is a data URL set as `backgroundImage`.

**Step 3: Wire up the gradient rendering**

Inside the component, before the return JSX:

```typescript
// Detect which API is in use
const usesNewAPI = gradient !== undefined || colors !== undefined || angle !== undefined

// Resolve gradient from props
const resolvedGradient = useMemo(() => {
  if (!usesNewAPI) return null
  return resolveGradient(gradient, colors, angle)
}, [usesNewAPI, gradient, colors, angle])

// Render gradient dither
const [gradientDataURL, setGradientDataURL] = useState<string | null>(null)

useEffect(() => {
  if (!resolvedGradient) return
  if (!isOrderedAlgorithm(algorithm ?? 'bayer4x4')) return
  if (width <= 0 || height <= 0) return

  const url = renderGradientToDataURL({
    gradient: resolvedGradient,
    algorithm: (algorithm ?? 'bayer4x4') as OrderedAlgorithm,
    width,
    height,
    threshold: threshold ?? 0,
    pixelScale: pixelScale ?? 1,
  })
  setGradientDataURL(url)
}, [resolvedGradient, algorithm, width, height, threshold, pixelScale])
```

Then in the styles:

```typescript
// If new gradient API, use gradient data URL
if (usesNewAPI && gradientDataURL) {
  switch (mode) {
    case 'background':
      return { backgroundImage: `url(${gradientDataURL})`, backgroundSize: 'cover' }
    case 'mask':
      return {
        maskImage: `url(${gradientDataURL})`,
        WebkitMaskImage: `url(${gradientDataURL})`,
        maskSize: 'cover',
        WebkitMaskSize: 'cover',
      }
    case 'full':
      return {}
  }
}
```

**Step 4: Update react index exports**

In `packages/react/src/index.ts`, re-export the gradient types from core:

```typescript
export type {
  DitherGradient,
  DitherGradientType,
  DitherGradientStop,
} from '@dithwather/core'
```

**Step 5: Build and verify**

Run: `pnpm build`
Expected: All 4 packages build cleanly

**Step 6: Commit**

```bash
git add packages/react/src/components/DitherBox.tsx packages/react/src/index.ts
git commit -m "feat(react): add gradient API to DitherBox with per-pixel Bayer rendering"
```

---

## Task 5: Update DitherButton for Gradient API

**Files:**
- Modify: `packages/react/src/components/DitherButton.tsx`

**Step 1: Add gradient props passthrough**

Destructure and forward the new `gradient`, `colors`, `angle` props to the inner `DitherBox`:

```typescript
// In the destructuring:
gradient,
colors,
angle,

// In the DitherBox JSX:
<DitherBox
  gradient={gradient}
  colors={colors}
  angle={angle}
  // ... rest of existing props
>
```

**Step 2: Update the default animation to use threshold**

This was already done in the previous fix, but ensure the defaults work with the gradient API. The default animate config should use `threshold` tweening.

**Step 3: Build and verify**

Run: `pnpm build`
Expected: Clean build

**Step 4: Commit**

```bash
git add packages/react/src/components/DitherButton.tsx
git commit -m "feat(react): pass gradient props through DitherButton to DitherBox"
```

---

## Task 6: Update DitherEditor for Gradients

**Files:**
- Modify: `packages/editor/src/DitherEditor.tsx`

**Step 1: Replace old color controls with gradient controls**

The editor needs:
- Gradient type picker (`select` with 5 types)
- Color stop bar (for now: 2-color picker, stop positions auto-distributed)
- Angle slider (linear/reflected only)
- Center X/Y sliders (radial/conic/diamond)
- Radius slider (radial/diamond)
- Keep: algorithm picker, pixel scale slider, threshold slider

**Step 2: Update the preview DitherBox**

Pass the resolved gradient props to the preview DitherBox:

```tsx
<DitherBox
  gradient={{
    type: gradientType,
    stops: gradientStops,
    angle: gradientAngle,
    center: [centerX, centerY],
    radius: gradientRadius,
  }}
  algorithm={config.algorithm}
  pixelScale={pixelScale}
  threshold={config.threshold}
  style={{ width: '200px', height: '80px', ... }}
>
  <span style={{ color: '#fff', fontWeight: 600 }}>Preview</span>
</DitherBox>
```

**Step 3: Update export code template**

```typescript
const code = `<DitherBox
  gradient={{
    type: '${gradientType}',
    stops: [${gradientStops.map(s => `{ color: '${s.color}', position: ${s.position} }`).join(', ')}],
    angle: ${gradientAngle},
  }}
  algorithm="${config.algorithm}"
  pixelScale={${pixelScale}}
/>`
```

**Step 4: Build and verify**

Run: `pnpm build`
Expected: Clean build

**Step 5: Commit**

```bash
git add packages/editor/src/DitherEditor.tsx
git commit -m "feat(editor): update DitherEditor with gradient type/stops controls"
```

---

## Task 7: Playground Redesign with Radiants Theme

**Files:**
- Modify: `apps/playground/src/App.tsx`
- Create: `apps/playground/src/styles.css` (for hover/active pseudo-classes)
- Modify: `apps/playground/index.html` — link stylesheet

The full design spec is in `docs/playground-design-spec.md`. Key changes:

**Step 1: Create a tokens object**

```typescript
const T = {
  surface: { primary: '#0F0E0C', elevated: '#1A1918', muted: '#252422', tertiary: '#3D2E1A' },
  content: { heading: '#FFFFFF', primary: '#FEF8E2', muted: 'rgba(254, 248, 226, 0.6)' },
  edge: { primary: '#FEF8E2', muted: 'rgba(254, 248, 226, 0.2)', focus: '#FCE184' },
  action: { primary: '#FCE184', accent: '#FCC383' },
  brand: {
    sunYellow: '#FCE184', skyBlue: '#95BAD2', sunsetFuzz: '#FCC383',
    sunRed: '#FF6B63', green: '#CEF5CA',
  },
  font: {
    heading: "'Joystix Monospace', monospace",
    body: "'Mondwest', system-ui, sans-serif",
    code: "'PixelCode', 'SF Mono', 'Fira Code', monospace",
  },
  shadow: { card: '2px 2px 0 0 #000000', btn: '0 1px 0 0 #000000', btnHover: '0 3px 0 0 #000000' },
} as const
```

**Step 2: Update all sections with radiants colors**

Per the design spec:
- **Bayer section**: sun-yellow (`#FCE184`) fg on `#0F0E0C` bg
- **Floyd-Steinberg section**: sky-blue (`#95BAD2`) fg on `#0F0E0C` bg
- **Interactive demo**: sun-yellow for Bayer, sunset-fuzz for F-S
- **Buttons**: green, sky-blue, sun-red, sun-yellow — one per button
- **Editor**: sunset-fuzz accent, card card

**Step 3: Switch all demos to use the new gradient API**

Replace old `source="solid"` / `source="gradient"` / `colors={{ fg, bg }}` with:

```tsx
// Bayer example
<DitherBox
  colors={[T.surface.primary, T.brand.sunYellow]}
  algorithm="bayer4x4"
  pixelScale={3}
  threshold={-0.05}
/>

// Radial example
<DitherBox
  gradient="radial"
  colors={[T.brand.skyBlue, T.surface.primary]}
  algorithm="bayer8x8"
  pixelScale={2}
/>
```

**Step 4: Add CSS for hover/active pseudo-classes**

Create `apps/playground/src/styles.css`:

```css
.dither-card:hover {
  border-color: rgba(254, 248, 226, 0.4);
}

.dither-interactive:hover {
  box-shadow: 0 0 12px var(--glow-color);
}

.dither-btn:hover {
  transform: translateY(-0.5px);
  box-shadow: 0 3px 0 0 #000000;
}

.dither-btn:active {
  transform: translateY(0.5px);
  box-shadow: 0 0 0 0 #000000;
}

:focus-visible {
  outline: 2px solid #FCE184;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; }
}
```

**Step 5: Add header gradient bar**

```tsx
<div style={{
  marginTop: '24px',
  height: '1px',
  background: `linear-gradient(90deg, ${T.brand.sunYellow}, ${T.brand.sunsetFuzz}, ${T.brand.sunRed}, ${T.brand.skyBlue}, transparent)`,
}} />
```

**Step 6: Build and manually verify**

Run: `pnpm build && pnpm --filter @dithwather/playground dev`
Expected: Playground renders with radiants dark theme, all demos using gradient API

**Step 7: Commit**

```bash
git add apps/playground/
git commit -m "feat(playground): redesign with radiants theme and gradient API demos"
```

---

## Task 8: Remove Floyd-Steinberg Dependencies

**Files:**
- Modify: `packages/core/src/types.ts` — keep `ErrorDiffusionAlgorithm` type but deprecate
- Modify: `packages/react/src/components/DitherBox.tsx` — remove old canvas path for gradient source

This is cleanup. The old `renderToCanvas` + Floyd-Steinberg canvas path is no longer needed for the primary use case. Keep `renderToCanvas` in core (it's a valid API for programmatic use), but remove the `useEffect` in DitherBox that calls it for `source="gradient"`.

**Step 1: Clean up DitherBox canvas path**

Remove the old canvas-path `useEffect` that called `renderToDataURL` from `@dithwather/core` for gradients. The gradient path now uses `renderGradientToDataURL`. Keep the solid tile path (`useBayerTile`) as a fast path for single-color backgrounds.

**Step 2: Run all tests**

Run: `pnpm test`
Expected: All tests pass

**Step 3: Build**

Run: `pnpm build`
Expected: Clean build

**Step 4: Commit**

```bash
git add packages/react/src/components/DitherBox.tsx
git commit -m "refactor(react): remove Floyd-Steinberg canvas path from DitherBox"
```

---

## Task 9: Final Integration Test

**Files:**
- Verify: all packages build
- Verify: all tests pass
- Verify: playground renders correctly

**Step 1: Run full test suite**

Run: `pnpm build && cd packages/core && pnpm vitest run`
Expected: All tests pass (116 existing + ~40 new gradient tests)

**Step 2: Run playground**

Run: `pnpm --filter @dithwather/playground dev`
Expected: Opens in browser with radiants-themed playground showing all 5 gradient types

**Step 3: Verify visually**

Check:
- [ ] Linear gradient dithering works (visible pattern transitions left→right or at angle)
- [ ] Radial gradient dithering works (circular pattern from center)
- [ ] All 3 Bayer algorithms produce distinct patterns
- [ ] pixelScale makes patterns visibly larger
- [ ] Buttons animate on hover (threshold change)
- [ ] Editor controls work (gradient type picker, color pickers, sliders)
- [ ] Export generates correct code

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: gradient dithering system with 5 gradient types + radiants playground"
```
