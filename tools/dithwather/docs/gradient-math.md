# Gradient Math Primitives for Dithwather

Technical reference for mapping pixel positions to gradient values `[0, 1]` for the tile-based dithering pipeline.

## Overview

The gradient pipeline works as follows:

1. For each pixel `(x, y)` in the render area, compute a **gradient value** `t` in `[0, 1]`
2. Use `t` with the gradient stops to compute a **local threshold** for that position
3. Quantize the threshold to a Bayer tile level
4. Stamp the corresponding precomputed tile

All gradient functions below produce the raw `t` value (step 1). The stop interpolation and quantization logic are shared utilities described at the end.

---

## 1. Linear Gradient

### CSS Reference

```css
linear-gradient(angle, color-stop1, color-stop2, ...)
```

CSS angles: `0deg` = to top, `90deg` = to right, values increase clockwise.

### Math

The CSS spec defines a **gradient line** through the center of the box. The line's length is determined by projecting the box corners onto it -- the gradient line extends from the corner projection that gives the minimum value to the one that gives the maximum. This ensures the gradient always covers the entire box regardless of angle.

For a pixel at `(x, y)` in a box of `(width, height)`:

```
1. Convert angle to radians: rad = angleDeg * PI / 180
2. Compute gradient direction vector: dx = sin(rad), dy = -cos(rad)
   (CSS: 0deg = up, clockwise positive)
3. Compute gradient line half-length by projecting corners:
   halfLength = abs(width/2 * dx) + abs(height/2 * dy)
4. Translate pixel to center-relative coords:
   px = x - width/2, py = y - height/2
5. Project pixel onto gradient direction:
   projection = px * dx + py * dy
6. Normalize to [0, 1]:
   t = (projection + halfLength) / (2 * halfLength)
7. Clamp: t = clamp(t, 0, 1)
```

### TypeScript Implementation

```typescript
function linearGradientValue(
  x: number,
  y: number,
  width: number,
  height: number,
  angleDeg: number
): number {
  const rad = (angleDeg * Math.PI) / 180
  // CSS gradient direction: 0deg = bottom-to-top, clockwise
  const dx = Math.sin(rad)
  const dy = -Math.cos(rad)

  // Gradient line half-length (corner projection)
  const halfLength = Math.abs((width / 2) * dx) + Math.abs((height / 2) * dy)
  if (halfLength === 0) return 0.5

  // Center-relative pixel position
  const px = x - width / 2
  const py = y - height / 2

  // Project onto gradient direction and normalize
  const projection = px * dx + py * dy
  return Math.max(0, Math.min(1, (projection + halfLength) / (2 * halfLength)))
}
```

### Edge Cases

- **0-degree angle**: Pure vertical gradient (bottom to top)
- **90-degree angle**: Pure horizontal gradient (left to right)
- **45-degree angle**: Diagonal, gradient line is longer than width or height alone
- **Zero-dimension box**: Returns 0.5 (midpoint)
- **The gradient line length changes with angle** -- a 45-degree gradient on a square is `sqrt(2)` times longer than a 0-degree gradient. This is correct CSS behavior.

---

## 2. Radial Gradient

### CSS Reference

```css
radial-gradient(circle 100px at 50% 50%, color-stop1, color-stop2, ...)
radial-gradient(ellipse 100px 50px at 50% 50%, color-stop1, color-stop2, ...)
```

### Math

For a **circle** with center `(cx, cy)` and radius `r`:

```
distance = sqrt((x - cx)^2 + (y - cy)^2)
t = distance / r
t = clamp(t, 0, 1)
```

For an **ellipse** with center `(cx, cy)` and radii `(rx, ry)`:

```
// Normalized distance using the ellipse equation
// A point is on the ellipse when ((x-cx)/rx)^2 + ((y-cy)/ry)^2 = 1
dx = (x - cx) / rx
dy = (y - cy) / ry
t = sqrt(dx^2 + dy^2)
t = clamp(t, 0, 1)
```

This is the standard approach: the ellipse equation `(dx/rx)^2 + (dy/ry)^2 = 1` defines the boundary where `t = 1`. Inside the ellipse, `t < 1`; outside, `t > 1` (clamped to 1).

### TypeScript Implementation

```typescript
function radialGradientValue(
  x: number,
  y: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number
): number {
  if (rx === 0 || ry === 0) return 1

  const dx = (x - cx) / rx
  const dy = (y - cy) / ry
  const t = Math.sqrt(dx * dx + dy * dy)

  return Math.max(0, Math.min(1, t))
}
```

For a circle, call with `rx = ry = radius`.

### Edge Cases

- **Zero radius**: All pixels are outside the gradient (return 1)
- **Center outside the box**: Gradient still works, `t` starts > 0 for all visible pixels
- **Ellipse with very different radii**: Can produce extreme stretching; works mathematically but may look odd with coarse Bayer matrices
- **CSS `closest-side` / `farthest-corner` sizing**: These determine the radius from the box geometry. For our API, we accept explicit radii.

---

## 3. Conic Gradient

### CSS Reference

```css
conic-gradient(from 0deg at 50% 50%, color-stop1, color-stop2, ...)
```

### Math

For a pixel at `(x, y)` relative to center `(cx, cy)` with start angle `startDeg`:

```
1. Compute angle from center to pixel:
   theta = atan2(x - cx, -(y - cy))
   (using sin=x, cos=-y to match CSS: 0deg = up, clockwise)
2. Apply start angle offset:
   theta = theta - startRad
3. Normalize to [0, 2*PI):
   theta = ((theta % (2*PI)) + 2*PI) % (2*PI)
4. Convert to [0, 1]:
   t = theta / (2*PI)
```

Note: We use `atan2(x - cx, -(y - cy))` rather than the standard `atan2(y, x)` because CSS conic gradients measure angles clockwise from the top (12 o'clock position), not counter-clockwise from the right (3 o'clock position).

### TypeScript Implementation

```typescript
function conicGradientValue(
  x: number,
  y: number,
  cx: number,
  cy: number,
  startAngleDeg: number
): number {
  const startRad = (startAngleDeg * Math.PI) / 180

  // atan2 with swapped args to get angle from top, clockwise
  let theta = Math.atan2(x - cx, -(y - cy))

  // Apply start angle offset
  theta -= startRad

  // Normalize to [0, 2*PI)
  const TWO_PI = Math.PI * 2
  theta = ((theta % TWO_PI) + TWO_PI) % TWO_PI

  return theta / TWO_PI
}
```

### Edge Cases

- **Pixel at exact center**: `atan2(0, 0)` returns 0 in most implementations. This is fine -- center pixels get `t = 0` (or whatever the start angle maps to).
- **Seam at 0/360 degrees**: There is a hard discontinuity where `t` jumps from ~1 back to 0. With dithering this creates a visible seam line. Mitigation: if the first and last color stops are the same color, the seam is invisible.
- **Negative start angles**: Work correctly due to the modulo normalization.

---

## 4. Diamond Gradient

### CSS Reference

No native CSS equivalent. This is a custom gradient type.

### Math

Diamond gradients use **Manhattan distance** (L1 norm / taxicab distance) from the center, producing a diamond (rhombus) shape instead of the circular shape of Euclidean distance.

```
dx = abs(x - cx)
dy = abs(y - cy)
manhattanDist = dx + dy
t = manhattanDist / size
t = clamp(t, 0, 1)
```

Where `size` is the Manhattan distance from center to the edge of the diamond. For a diamond inscribed in a box of `(width, height)`, `size = (width + height) / 2` to reach the corners, or `size = min(width, height) / 2` to be inscribed.

For an axis-aligned diamond with independent horizontal/vertical radii:

```
dx = abs(x - cx) / rx
dy = abs(y - cy) / ry
t = dx + dy
t = clamp(t, 0, 1)
```

### TypeScript Implementation

```typescript
function diamondGradientValue(
  x: number,
  y: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number
): number {
  if (rx === 0 || ry === 0) return 1

  const dx = Math.abs(x - cx) / rx
  const dy = Math.abs(y - cy) / ry
  const t = dx + dy

  return Math.max(0, Math.min(1, t))
}
```

### Edge Cases

- **Square diamond**: Set `rx = ry = radius` for a 45-degree rotated square shape
- **Zero size**: All pixels outside (return 1)
- **Relationship to radial**: Diamond is to Manhattan distance what radial is to Euclidean distance. The isolines are squares rotated 45 degrees instead of circles.

---

## 5. Reflected (Mirror) Gradient

### CSS Reference

No native CSS equivalent. (CSS has `repeating-linear-gradient` but not reflected.)

### Math

A reflected gradient is a linear gradient that mirrors at the midpoint. Instead of going 0 to 1, it goes 0 to 1 to 0 (or equivalently, the absolute distance from the midpoint).

```
1. Compute linear gradient value t_linear using the linear formula
2. Reflect: t = 1 - abs(2 * t_linear - 1)
   Equivalently: t = t_linear <= 0.5 ? 2 * t_linear : 2 * (1 - t_linear)
```

This creates a symmetric gradient: `t=0` at both edges, `t=1` at the center line.

If you want the inverse (1 at edges, 0 at center):

```
t = abs(2 * t_linear - 1)
```

### TypeScript Implementation

```typescript
function reflectedGradientValue(
  x: number,
  y: number,
  width: number,
  height: number,
  angleDeg: number
): number {
  const tLinear = linearGradientValue(x, y, width, height, angleDeg)
  // Mirror: 0 -> 1 -> 0
  return 1 - Math.abs(2 * tLinear - 1)
}
```

### Edge Cases

- **The midpoint is always at t=1** (maximum intensity). Stops are applied to the 0-1 range of each half independently.
- **Angles work identically** to linear gradients; only the output mapping changes.
- **For repeating reflected gradients**: Apply modulo before reflecting: `t_linear = t_linear % 1`, then reflect.

---

## Gradient Stop Interpolation

All gradient types produce a raw `t` value in `[0, 1]`. This `t` must then be mapped through the color stops to determine the actual color (or, for dithering, the local threshold between two adjacent colors).

### Stop Data Structure

```typescript
interface GradientStop {
  color: string    // hex color
  position: number // 0-1, position along the gradient
}
```

### Finding the Active Segment

Given a `t` value and an array of sorted stops:

```typescript
interface StopSegment {
  stopA: GradientStop  // lower stop
  stopB: GradientStop  // upper stop
  localT: number       // 0-1 position within this segment
}

function findStopSegment(t: number, stops: GradientStop[]): StopSegment {
  // Clamp t to valid range
  t = Math.max(0, Math.min(1, t))

  // Handle edge cases
  if (stops.length === 0) {
    return { stopA: { color: '#000000', position: 0 }, stopB: { color: '#ffffff', position: 1 }, localT: t }
  }
  if (stops.length === 1) {
    return { stopA: stops[0], stopB: stops[0], localT: 0 }
  }

  // Find which two stops t falls between
  for (let i = 0; i < stops.length - 1; i++) {
    if (t <= stops[i + 1].position) {
      const segmentLength = stops[i + 1].position - stops[i].position
      const localT = segmentLength > 0
        ? (t - stops[i].position) / segmentLength
        : 0
      return {
        stopA: stops[i],
        stopB: stops[i + 1],
        localT: Math.max(0, Math.min(1, localT)),
      }
    }
  }

  // Past the last stop
  const last = stops[stops.length - 1]
  return { stopA: last, stopB: last, localT: 1 }
}
```

### How This Works for Dithering

For traditional image dithering, you interpolate the color between stops. For **tile-based Bayer dithering**, the approach is different:

1. The `localT` value IS the dither threshold for this pixel
2. `stopA.color` is the "dark" color for this segment
3. `stopB.color` is the "light" color for this segment
4. The Bayer tile at this threshold level determines which pixels get `stopA` vs `stopB`

So the gradient stop system maps each pixel to:
- Which two colors to dither between
- What density of light vs dark pixels to use (via `localT`)

### Multi-Color Gradient Example

For stops: `red@0.0, green@0.5, blue@1.0`

- At `t = 0.25`: segment = red-green, `localT = 0.5` (half red, half green)
- At `t = 0.5`: segment = green-blue, `localT = 0.0` (all green)
- At `t = 0.75`: segment = green-blue, `localT = 0.5` (half green, half blue)

Each segment is dithered independently with its own color pair and threshold.

---

## Quantization for Bayer Tile Stamping

### Quantization Levels

Each Bayer matrix size supports a fixed number of distinct threshold levels:

| Matrix | Size | Levels | Step Size | Values |
|--------|------|--------|-----------|--------|
| bayer2x2 | 2x2 | 5 | 0.25 | 0, 0.25, 0.5, 0.75, 1.0 |
| bayer4x4 | 4x4 | 17 | 1/16 | 0/16, 1/16, ..., 16/16 |
| bayer8x8 | 8x8 | 65 | 1/64 | 0/64, 1/64, ..., 64/64 |

The "levels" count is `n^2 + 1` where `n` is the matrix dimension. Level 0 = all dark, level `n^2` = all light, and each intermediate level turns on one more pixel in the tile according to the Bayer threshold ordering.

### Quantization Function

```typescript
function quantizeThreshold(
  t: number,
  levels: number
): number {
  // levels is n^2 + 1 (e.g., 5 for bayer2x2, 17 for bayer4x4, 65 for bayer8x8)
  const maxIndex = levels - 1
  const index = Math.round(t * maxIndex)
  return index / maxIndex
}
```

### Banding Artifacts and Mitigation

**The problem**: With coarse matrices (especially bayer2x2 with only 5 levels), quantization creates visible bands -- flat regions where adjacent threshold levels map to the same tile.

**Why it happens**: A smooth gradient with continuous `t` values gets snapped to 5 discrete levels. The boundaries between levels create hard edges.

**Mitigation strategies**:

1. **Use larger matrices**: bayer8x8 has 65 levels, which is perceptually smooth for most gradients. This is the simplest and most effective approach.

2. **Don't quantize -- use direct comparison**: Instead of pre-selecting a tile, compare the continuous `localT` directly against each Bayer matrix cell at the pixel's position:
   ```
   pixel_on = localT > bayerMatrix[y % n][x % n]
   ```
   This produces the maximum number of perceptual levels and completely eliminates banding. The cost is that you can't use precomputed tile bitmaps -- you must evaluate per-pixel. However, this is still very fast since it's just a comparison.

3. **Hybrid approach**: For tile stamping (where precomputed tiles are required), round to the nearest tile level. The bayer8x8 matrix with 65 levels is fine for virtually all use cases. Only bayer2x2 produces objectionable banding on smooth gradients.

4. **Spatial offset (dithered quantization)**: Add a small spatial noise to `t` before quantizing. This breaks up band edges but adds noise. Not recommended for ordered dithering where the clean pattern is the aesthetic goal.

### Recommendation

For the tile-stamping pipeline, use **direct per-pixel comparison** when possible (no precomputed tiles needed -- just compare `localT > bayerMatrix[y % n][x % n]` and pick colorA or colorB). This gives perfect gradient reproduction with zero banding.

If precomputed tiles are required for performance, use bayer4x4 (17 levels) as the minimum for gradients, and prefer bayer8x8 (65 levels) which is perceptually banding-free.

---

## Complete Gradient Value Function

A unified function that dispatches to the appropriate gradient type:

```typescript
type GradientType = 'linear' | 'radial' | 'conic' | 'diamond' | 'reflected'

interface GradientConfig {
  type: GradientType
  // Linear / Reflected
  angleDeg?: number
  // Radial / Diamond / Conic
  cx?: number // center x (defaults to width/2)
  cy?: number // center y (defaults to height/2)
  // Radial / Diamond
  rx?: number // horizontal radius (defaults to max needed)
  ry?: number // vertical radius (defaults to max needed)
  // Conic
  startAngleDeg?: number // start angle (defaults to 0)
  // All types
  stops: GradientStop[]
}

function gradientValue(
  x: number,
  y: number,
  width: number,
  height: number,
  config: GradientConfig
): number {
  const cx = config.cx ?? width / 2
  const cy = config.cy ?? height / 2

  switch (config.type) {
    case 'linear':
      return linearGradientValue(x, y, width, height, config.angleDeg ?? 0)

    case 'radial': {
      const rx = config.rx ?? Math.max(cx, width - cx)
      const ry = config.ry ?? Math.max(cy, height - cy)
      return radialGradientValue(x, y, cx, cy, rx, ry)
    }

    case 'conic':
      return conicGradientValue(x, y, cx, cy, config.startAngleDeg ?? 0)

    case 'diamond': {
      const rx = config.rx ?? Math.max(cx, width - cx)
      const ry = config.ry ?? Math.max(cy, height - cy)
      return diamondGradientValue(x, y, cx, cy, rx, ry)
    }

    case 'reflected':
      return reflectedGradientValue(x, y, width, height, config.angleDeg ?? 0)
  }
}
```

---

## Per-Pixel Rendering Loop

Putting it all together for the dithering pipeline:

```typescript
function renderGradientDither(
  width: number,
  height: number,
  gradientConfig: GradientConfig,
  bayerMatrix: number[][],
): ImageData {
  const matrixSize = bayerMatrix.length
  const imageData = new ImageData(width, height)
  const data = imageData.data

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4

      // 1. Get raw gradient position
      const t = gradientValue(x, y, width, height, gradientConfig)

      // 2. Find which stop segment we're in
      const segment = findStopSegment(t, gradientConfig.stops)

      // 3. Get Bayer threshold for this pixel position
      const bayerThreshold = bayerMatrix[y % matrixSize][x % matrixSize]

      // 4. Compare local threshold against Bayer value
      const useColorB = segment.localT > bayerThreshold

      // 5. Pick color
      const color = useColorB ? segment.stopB.color : segment.stopA.color
      const rgb = hexToRgb(color)

      data[i] = rgb.r
      data[i + 1] = rgb.g
      data[i + 2] = rgb.b
      data[i + 3] = 255
    }
  }

  return imageData
}
```

This is the direct per-pixel comparison approach (no precomputed tiles, no quantization, no banding). Each pixel simply asks: "is my local gradient threshold above or below the Bayer matrix value at my position?" and picks one of the two surrounding stop colors.

---

## Summary Table

| Gradient | Formula | Parameters | CSS Native |
|----------|---------|------------|------------|
| Linear | Dot product projection onto gradient line | angle | Yes |
| Radial | Euclidean distance (normalized by radii) | cx, cy, rx, ry | Yes |
| Conic | `atan2` angle from center | cx, cy, startAngle | Yes |
| Diamond | Manhattan distance (normalized by radii) | cx, cy, rx, ry | No |
| Reflected | Linear with `1 - abs(2t - 1)` mirror | angle | No |
