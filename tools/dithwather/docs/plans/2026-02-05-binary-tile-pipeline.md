# Binary Tile Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the per-pixel canvas rendering pipeline with precomputed binary tiles for Bayer algorithms, using CSS `mask-image` for coloring, eliminating per-frame pixel processing entirely.

**Architecture:** Bayer dithering produces a small repeating NxN pattern. Instead of processing every pixel of a full-size canvas per frame, precompute all possible threshold levels as tiny binary tiles (87 total across all Bayer sizes), cache them, and let the browser's CSS compositor handle tiling and coloring via `mask-image` + `background-color`. Floyd-Steinberg and gradient sources stay on the existing canvas path.

**Tech Stack:** TypeScript, React 18+, CSS mask-image, OffscreenCanvas, vitest

---

## Background: Key Decisions from Research

- **Tile storage:** 3-layer cache — binary integers (eager, module load) → OffscreenCanvas (lazy) → data URL (lazy)
- **CSS coloring:** `mask-image` approach. Tile is a black/transparent alpha mask. `background-color` provides the visible color. Color changes = CSS property change, zero tile work.
- **Duotone:** Container has `background-color: bg`, masked overlay has `background-color: fg`
- **Mono:** Container transparent, masked overlay has `background-color: fg`
- **Animation:** Color-only transitions update CSS custom properties (no canvas). Threshold transitions swap cached tiles.
- **Floyd-Steinberg:** Stays on existing canvas path. DitherBox branches on `isOrderedAlgorithm()`.
- **Gradients:** Stay on canvas path (position-dependent, cannot tile).
- **Brightness/contrast for solid sources:** Map to threshold offset — select a different precomputed tile instead of per-pixel math.

## Files Overview

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `packages/core/src/tiles/bayer-tiles.ts` | Tile precomputation + 3-layer cache |
| CREATE | `packages/core/src/tiles/index.ts` | Barrel export |
| CREATE | `packages/core/src/tiles/bayer-tiles.test.ts` | Tests for tile generation |
| MODIFY | `packages/core/src/index.ts` | Export tile module |
| CREATE | `packages/react/src/hooks/useBayerTile.ts` | React hook for tile lookup |
| MODIFY | `packages/react/src/components/DitherBox.tsx` | Algorithm branching + CSS mask rendering |
| MODIFY | `packages/react/src/index.ts` | Export new hook |

| KEEP | File | Why |
|------|------|-----|
| KEEP | `packages/core/src/algorithms/bayer.ts` | Source matrices used by tile generation |
| KEEP | `packages/core/src/algorithms/floyd-steinberg.ts` | Untouched, still canvas path |
| KEEP | `packages/core/src/renderer/canvas.ts` | Kept for F-S and gradient fallback |
| KEEP | `packages/react/src/hooks/useDitherAnimation.ts` | Produces config; consumer decides path |
| KEEP | `packages/react/src/hooks/useResizeObserver.ts` | Kept but tiles don't need it |
| KEEP | `packages/react/src/context/DitherContext.tsx` | Config passthrough unchanged |
| KEEP | `packages/react/src/components/DitherButton.tsx` | Inherits DitherBox changes |

---

## Task 1: Tile Bit Table (Core Layer 1)

Precompute all possible Bayer threshold levels as binary integers. This is the foundation — pure math, no DOM, SSR-safe.

**Files:**
- Create: `packages/core/src/tiles/bayer-tiles.ts`
- Create: `packages/core/src/tiles/bayer-tiles.test.ts`
- Read: `packages/core/src/algorithms/bayer.ts` (source matrices at lines 15-42)

**Step 1: Write the failing tests**

Create `packages/core/src/tiles/bayer-tiles.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  TILE_BITS,
  thresholdToLevel,
  getTileBits,
} from './bayer-tiles'

describe('thresholdToLevel', () => {
  it('maps threshold 0 to level 0 for bayer4x4', () => {
    expect(thresholdToLevel('bayer4x4', 0)).toBe(0)
  })

  it('maps threshold 1 to max level for bayer4x4', () => {
    expect(thresholdToLevel('bayer4x4', 1)).toBe(16)
  })

  it('maps threshold 0.5 to level 8 for bayer4x4', () => {
    expect(thresholdToLevel('bayer4x4', 0.5)).toBe(8)
  })

  it('maps threshold 0 to level 0 for bayer2x2', () => {
    expect(thresholdToLevel('bayer2x2', 0)).toBe(0)
  })

  it('maps threshold 1 to level 4 for bayer2x2', () => {
    expect(thresholdToLevel('bayer2x2', 1)).toBe(4)
  })

  it('maps threshold 1 to level 64 for bayer8x8', () => {
    expect(thresholdToLevel('bayer8x8', 1)).toBe(64)
  })

  it('clamps threshold below 0', () => {
    expect(thresholdToLevel('bayer4x4', -0.5)).toBe(0)
  })

  it('clamps threshold above 1', () => {
    expect(thresholdToLevel('bayer4x4', 1.5)).toBe(16)
  })
})

describe('TILE_BITS', () => {
  it('has 5 entries for bayer2x2 (levels 0-4)', () => {
    for (let i = 0; i <= 4; i++) {
      expect(TILE_BITS.has('bayer2x2_' + i)).toBe(true)
    }
  })

  it('has 17 entries for bayer4x4 (levels 0-16)', () => {
    for (let i = 0; i <= 16; i++) {
      expect(TILE_BITS.has('bayer4x4_' + i)).toBe(true)
    }
  })

  it('has 65 entries for bayer8x8 (levels 0-64)', () => {
    for (let i = 0; i <= 64; i++) {
      expect(TILE_BITS.has('bayer8x8_' + i)).toBe(true)
    }
  })

  it('level 0 has all bits off (no pixels on)', () => {
    expect(TILE_BITS.get('bayer4x4_0')).toBe(0)
  })

  it('level 16 has all bits on for bayer4x4', () => {
    expect(TILE_BITS.get('bayer4x4_16')).toBe(0xFFFF)
  })

  it('level 4 has all bits on for bayer2x2', () => {
    expect(TILE_BITS.get('bayer2x2_4')).toBe(0xF)
  })

  it('each level has exactly N pixels on for bayer4x4', () => {
    for (let level = 0; level <= 16; level++) {
      const bits = TILE_BITS.get('bayer4x4_' + level)!
      let count = 0
      for (let i = 0; i < 16; i++) {
        if ((bits >> i) & 1) count++
      }
      expect(count).toBe(level)
    }
  })

  it('each level is a superset of the previous level', () => {
    for (let level = 1; level <= 16; level++) {
      const prev = TILE_BITS.get('bayer4x4_' + (level - 1))!
      const curr = TILE_BITS.get('bayer4x4_' + level)!
      expect(prev & curr).toBe(prev)
    }
  })
})

describe('getTileBits', () => {
  it('returns bits for bayer4x4 at threshold 0.5', () => {
    const bits = getTileBits('bayer4x4', 0.5)
    let count = 0
    for (let i = 0; i < 16; i++) {
      if ((bits >> i) & 1) count++
    }
    expect(count).toBe(8)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/rivermassey/Desktop/dev/dithwather && npx vitest run packages/core/src/tiles/bayer-tiles.test.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

Create `packages/core/src/tiles/bayer-tiles.ts`:

```typescript
/**
 * Binary Tile Precomputation for Bayer Dithering
 *
 * Precomputes all possible threshold levels as binary integers.
 * A 4x4 tile = 16 bits. Bit N is set if pixel N is "on" at that threshold.
 *
 * Layer 1 of the 3-layer tile cache:
 *   Layer 1: TILE_BITS (binary integers, eager, SSR-safe)
 *   Layer 2: OffscreenCanvas cache (lazy, requires DOM)
 *   Layer 3: Data URL cache (lazy, requires DOM)
 */

import type { OrderedAlgorithm } from '../types'
import { BAYER_MATRICES } from '../algorithms/bayer'

// Key format: "bayer4x4_8" = algorithm + level
export const TILE_BITS = new Map<string, number>()

// Sorted cell indices per algorithm, used for incremental bit building
const SORTED_CELLS = new Map<
  string,
  Array<{ x: number; y: number; val: number }>
>()

function precompute(): void {
  const algorithms: OrderedAlgorithm[] = ['bayer2x2', 'bayer4x4', 'bayer8x8']

  for (const alg of algorithms) {
    const matrix = BAYER_MATRICES[alg]
    if (!matrix) continue
    const size = matrix.length
    const total = size * size

    // Flatten and sort by threshold value (ascending)
    const cells: Array<{ x: number; y: number; val: number }> = []
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        cells.push({ x, y, val: matrix[y][x] })
      }
    }
    cells.sort((a, b) => a.val - b.val)
    SORTED_CELLS.set(alg, cells)

    // Build each level incrementally
    let bits = 0
    TILE_BITS.set(`${alg}_0`, 0)

    for (let level = 1; level <= total; level++) {
      const { x, y } = cells[level - 1]
      bits |= 1 << (y * size + x)
      TILE_BITS.set(`${alg}_${level}`, bits)
    }
  }
}

// Run on module load — pure integer math, ~0.05ms, SSR-safe
precompute()

/**
 * Convert a 0-1 threshold to a discrete tile level.
 */
export function thresholdToLevel(
  algorithm: OrderedAlgorithm,
  threshold: number
): number {
  const matrix = BAYER_MATRICES[algorithm]
  if (!matrix) return 0
  const size = matrix.length
  const total = size * size
  const clamped = Math.max(0, Math.min(1, threshold))
  return Math.round(clamped * total)
}

/**
 * Get the binary bit pattern for a given algorithm and threshold.
 */
export function getTileBits(
  algorithm: OrderedAlgorithm,
  threshold: number
): number {
  const level = thresholdToLevel(algorithm, threshold)
  return TILE_BITS.get(`${algorithm}_${level}`) ?? 0
}

/**
 * Get the tile size (width/height in pixels) for an algorithm.
 */
export function getTileSize(algorithm: OrderedAlgorithm): number {
  const matrix = BAYER_MATRICES[algorithm]
  return matrix ? matrix.length : 4
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/rivermassey/Desktop/dev/dithwather && npx vitest run packages/core/src/tiles/bayer-tiles.test.ts`
Expected: PASS — all tests green

**Step 5: Commit**

```bash
git add packages/core/src/tiles/bayer-tiles.ts packages/core/src/tiles/bayer-tiles.test.ts
git commit -m "feat(core): add binary tile bit table for Bayer dithering

Precomputes all 87 threshold levels (5 + 17 + 65) as binary integers
on module load. Layer 1 of the 3-layer tile cache. SSR-safe, ~700 bytes."
```

---

## Task 2: Tile Materialization (Core Layer 2 + 3)

Convert binary integers to displayable formats: OffscreenCanvas and data URLs. This is the lazy cache layer that requires DOM.

**Files:**
- Modify: `packages/core/src/tiles/bayer-tiles.ts`
- Modify: `packages/core/src/tiles/bayer-tiles.test.ts`
- Read: `packages/core/src/utils/color.ts:10-30` (hexToRgb)

**Step 1: Write the failing tests**

Append to `packages/core/src/tiles/bayer-tiles.test.ts`:

```typescript
import {
  // ... existing imports
  getTileDataURL,
  getTileSize,
  clearTileCache,
} from './bayer-tiles'

describe('getTileDataURL', () => {
  it('returns a data URL string', () => {
    const url = getTileDataURL('bayer4x4', 0.5)
    expect(url).toMatch(/^data:image\/png;base64,/)
  })

  it('returns the same string for the same inputs (cached)', () => {
    clearTileCache()
    const url1 = getTileDataURL('bayer4x4', 0.5)
    const url2 = getTileDataURL('bayer4x4', 0.5)
    expect(url1).toBe(url2)
  })

  it('returns different URLs for different thresholds', () => {
    const url1 = getTileDataURL('bayer4x4', 0.0)
    const url2 = getTileDataURL('bayer4x4', 1.0)
    expect(url1).not.toBe(url2)
  })

  it('returns different URLs for different algorithms', () => {
    const url1 = getTileDataURL('bayer2x2', 0.5)
    const url2 = getTileDataURL('bayer4x4', 0.5)
    expect(url1).not.toBe(url2)
  })
})

describe('getTileSize', () => {
  it('returns 2 for bayer2x2', () => {
    expect(getTileSize('bayer2x2')).toBe(2)
  })

  it('returns 4 for bayer4x4', () => {
    expect(getTileSize('bayer4x4')).toBe(4)
  })

  it('returns 8 for bayer8x8', () => {
    expect(getTileSize('bayer8x8')).toBe(8)
  })
})

describe('clearTileCache', () => {
  it('clears cached data URLs', () => {
    const url1 = getTileDataURL('bayer4x4', 0.5)
    clearTileCache()
    // After clearing, calling again should regenerate (still returns same pattern)
    const url2 = getTileDataURL('bayer4x4', 0.5)
    expect(url2).toMatch(/^data:image\/png;base64,/)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/rivermassey/Desktop/dev/dithwather && npx vitest run packages/core/src/tiles/bayer-tiles.test.ts`
Expected: FAIL — `getTileDataURL`, `clearTileCache` not exported

**Step 3: Write the implementation**

Add to `packages/core/src/tiles/bayer-tiles.ts`:

```typescript
// ============================================================================
// Layer 2 + 3: Materialization (lazy, requires DOM)
// ============================================================================

const dataURLCache = new Map<string, string>()

/**
 * Materialize a binary tile into a tiny canvas and return a data URL.
 * The tile is rendered as white-on-transparent (alpha mask):
 * - "on" pixels: rgba(255, 255, 255, 255)
 * - "off" pixels: rgba(0, 0, 0, 0)
 *
 * This makes it usable as a CSS mask-image where white = opaque, black = transparent.
 */
export function getTileDataURL(
  algorithm: OrderedAlgorithm,
  threshold: number
): string {
  const level = thresholdToLevel(algorithm, threshold)
  const cacheKey = `${algorithm}_${level}`

  const cached = dataURLCache.get(cacheKey)
  if (cached) return cached

  const bits = TILE_BITS.get(cacheKey) ?? 0
  const size = getTileSize(algorithm)

  // Create a tiny canvas
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.createImageData(size, size)
  const data = imageData.data

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const bitIndex = y * size + x
      const isOn = (bits >> bitIndex) & 1
      const i = (y * size + x) * 4

      // White + opaque for "on", transparent for "off"
      data[i] = isOn ? 255 : 0
      data[i + 1] = isOn ? 255 : 0
      data[i + 2] = isOn ? 255 : 0
      data[i + 3] = isOn ? 255 : 0
    }
  }

  ctx.putImageData(imageData, 0, 0)
  const url = canvas.toDataURL('image/png')

  dataURLCache.set(cacheKey, url)
  return url
}

/**
 * Clear the materialized tile caches. Useful for testing or memory management.
 */
export function clearTileCache(): void {
  dataURLCache.clear()
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/rivermassey/Desktop/dev/dithwather && npx vitest run packages/core/src/tiles/bayer-tiles.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/core/src/tiles/bayer-tiles.ts packages/core/src/tiles/bayer-tiles.test.ts
git commit -m "feat(core): add tile materialization layer (data URL cache)

Lazily materializes binary tile bits into tiny PNG data URLs via canvas.
Tiles are white-on-transparent alpha masks for use with CSS mask-image.
Cache keyed by (algorithm, level)."
```

---

## Task 3: Export Tile Module from Core

Wire up the barrel exports so the React package can import tile functions.

**Files:**
- Create: `packages/core/src/tiles/index.ts`
- Modify: `packages/core/src/index.ts` (line ~20, after existing exports)

**Step 1: Create barrel export**

Create `packages/core/src/tiles/index.ts`:

```typescript
export {
  TILE_BITS,
  thresholdToLevel,
  getTileBits,
  getTileSize,
  getTileDataURL,
  clearTileCache,
} from './bayer-tiles'
```

**Step 2: Add to core index**

In `packages/core/src/index.ts`, add after the existing exports:

```typescript
// Tile system
export {
  TILE_BITS,
  thresholdToLevel,
  getTileBits,
  getTileSize,
  getTileDataURL,
  clearTileCache,
} from './tiles'
```

**Step 3: Verify build**

Run: `cd /Users/rivermassey/Desktop/dev/dithwather && pnpm build --filter @dithwather/core`
Expected: Build succeeds, `dist/index.js` and `dist/index.d.ts` include tile exports

**Step 4: Commit**

```bash
git add packages/core/src/tiles/index.ts packages/core/src/index.ts
git commit -m "feat(core): export tile module from core barrel"
```

---

## Task 4: useBayerTile Hook

A React hook that encapsulates tile lookup and provides CSS-ready values. This is the bridge between the core tile system and DitherBox.

**Files:**
- Create: `packages/react/src/hooks/useBayerTile.ts`
- Modify: `packages/react/src/index.ts`
- Read: `packages/core/src/types.ts` (OrderedAlgorithm, ColorMode, DitherColors)

**Step 1: Write the hook**

Create `packages/react/src/hooks/useBayerTile.ts`:

```typescript
import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { OrderedAlgorithm, ColorMode, DitherColors, DuotoneColors } from '@dithwather/core'
import { getTileDataURL, getTileSize } from '@dithwather/core'

export interface BayerTileResult {
  /** CSS properties for the container element */
  containerStyle: CSSProperties
  /** CSS properties for the mask overlay layer */
  maskLayerStyle: CSSProperties
  /** The tile size in pixels */
  tileSize: number
  /** The tile data URL (for debugging/export) */
  tileDataURL: string
}

/**
 * Hook that returns CSS-ready styles for a Bayer tile pattern.
 *
 * Uses CSS mask-image for coloring:
 * - The tile is a white-on-transparent alpha mask
 * - background-color on the mask layer provides the fg color
 * - background-color on the container provides the bg color (duotone)
 */
export function useBayerTile(
  algorithm: OrderedAlgorithm,
  threshold: number,
  colorMode: ColorMode,
  colors: DitherColors
): BayerTileResult {
  const tileSize = getTileSize(algorithm)

  // Only recompute tile when algorithm or threshold changes
  const tileDataURL = useMemo(
    () => {
      if (typeof document === 'undefined') return ''
      return getTileDataURL(algorithm, threshold)
    },
    [algorithm, threshold]
  )

  const maskUrl = `url(${tileDataURL})`

  const containerStyle = useMemo((): CSSProperties => {
    if (colorMode === 'duotone') {
      const bg = (colors as DuotoneColors).bg
      return { backgroundColor: bg }
    }
    return {}
  }, [colorMode, colors])

  const maskLayerStyle = useMemo((): CSSProperties => {
    if (!tileDataURL) return { display: 'none' }

    return {
      position: 'absolute',
      inset: 0,
      backgroundColor: colors.fg,
      WebkitMaskImage: maskUrl,
      maskImage: maskUrl,
      WebkitMaskSize: `${tileSize}px ${tileSize}px`,
      maskSize: `${tileSize}px ${tileSize}px`,
      WebkitMaskRepeat: 'repeat',
      maskRepeat: 'repeat',
      imageRendering: 'pixelated',
      pointerEvents: 'none',
    } as CSSProperties
  }, [tileDataURL, tileSize, colors.fg, maskUrl])

  return { containerStyle, maskLayerStyle, tileSize, tileDataURL }
}
```

**Step 2: Export from index**

In `packages/react/src/index.ts`, add:

```typescript
export { useBayerTile, type BayerTileResult } from './hooks/useBayerTile'
```

**Step 3: Verify build**

Run: `cd /Users/rivermassey/Desktop/dev/dithwather && pnpm build --filter @dithwather/react`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add packages/react/src/hooks/useBayerTile.ts packages/react/src/index.ts
git commit -m "feat(react): add useBayerTile hook

Returns CSS-ready mask-image styles for Bayer tile patterns.
Colors are pure CSS properties — no canvas work for color changes.
SSR-safe (returns hidden layer when document unavailable)."
```

---

## Task 5: Integrate Tile Path into DitherBox

The main event. Branch DitherBox to use the tile path for Bayer algorithms and the existing canvas path for Floyd-Steinberg/gradients.

**Files:**
- Modify: `packages/react/src/components/DitherBox.tsx`
- Read: `packages/core/src/algorithms/index.ts:28` (isOrderedAlgorithm)

**Step 1: Add imports**

At top of `DitherBox.tsx`, add:

```typescript
import { isOrderedAlgorithm } from '@dithwather/core'
import { useBayerTile } from '../hooks/useBayerTile'
```

**Step 2: Add the algorithm branch**

The key change is in the rendering `useEffect` (current lines 166-182). Replace it with a branching strategy.

After the existing `animatedConfig` / `baseConfig` resolution (around line 168-169), determine whether to use tiles:

```typescript
  // Determine which pipeline to use
  const configToUse = animate ? animatedConfig : { ...DEFAULT_CONFIG, ...baseConfig }
  const usesTilePath =
    isOrderedAlgorithm(configToUse.algorithm) && source !== 'gradient'

  // TILE PATH: Bayer + solid source
  const bayerTile = useBayerTile(
    configToUse.algorithm as any,
    configToUse.threshold ?? 0.5,
    configToUse.colorMode ?? 'duotone',
    configToUse.colors ?? { fg: '#ffffff', bg: '#000000' }
  )

  // CANVAS PATH: Floyd-Steinberg or gradient source (existing logic)
  const [canvasBackgroundImage, setCanvasBackgroundImage] = useState<string | null>(null)

  useEffect(() => {
    if (usesTilePath) return  // Skip canvas work for tile path
    if (width <= 0 || height <= 0) return

    const dataURL = renderToDataURL(configToUse, {
      width,
      height,
      pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
      source:
        source === 'gradient'
          ? { type: 'gradient', colors: gradientColors, angle: gradientAngle }
          : { type: 'solid', color: gradientColors[0] ?? '#808080' },
    })
    setCanvasBackgroundImage(dataURL)
  }, [usesTilePath, width, height, animatedConfig, baseConfig, animate, source, gradientColors, gradientAngle])
```

**Step 3: Update the style computation**

Replace the `ditherStyles` useMemo (current lines 185-211) with branching:

```typescript
  const ditherStyles = useMemo((): CSSProperties => {
    if (usesTilePath) {
      // Tile path styles are handled by the mask layer, not backgroundImage
      return bayerTile.containerStyle
    }

    // Canvas path (existing logic)
    if (!canvasBackgroundImage) return {}

    switch (mode) {
      case 'background':
        return {
          backgroundImage: `url(${canvasBackgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      case 'mask':
        return {
          maskImage: `url(${canvasBackgroundImage})`,
          WebkitMaskImage: `url(${canvasBackgroundImage})`,
          maskSize: 'cover',
          WebkitMaskSize: 'cover',
        }
      case 'full':
        return {}
      default:
        return {}
    }
  }, [usesTilePath, bayerTile.containerStyle, canvasBackgroundImage, mode])
```

**Step 4: Update the JSX to include the mask layer**

In the return JSX, add the tile mask layer:

```typescript
  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        ...ditherStyles,
        ...style,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* TILE PATH: CSS mask layer */}
      {usesTilePath && bayerTile.tileDataURL && (
        <div style={bayerTile.maskLayerStyle} />
      )}

      {/* CANVAS PATH: full mode overlay (existing) */}
      {!usesTilePath && mode === 'full' && canvasBackgroundImage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${canvasBackgroundImage})`,
            backgroundSize: 'cover',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      <div style={{ position: 'relative', zIndex: usesTilePath || mode === 'full' ? 2 : undefined }}>
        {children}
      </div>
    </div>
  )
```

**Step 5: Verify build**

Run: `cd /Users/rivermassey/Desktop/dev/dithwather && pnpm build`
Expected: All packages build successfully

**Step 6: Verify playground**

Run: `cd /Users/rivermassey/Desktop/dev/dithwather && pnpm dev --filter @dithwather/playground`
Expected: Dev server starts. Open in browser. Bayer examples should render using tile path. Floyd-Steinberg examples should still render using canvas path. Visual output should be identical to before for all examples.

**Step 7: Commit**

```bash
git add packages/react/src/components/DitherBox.tsx
git commit -m "feat(react): integrate binary tile pipeline into DitherBox

Bayer algorithms with solid sources now use precomputed tiles + CSS mask-image.
Floyd-Steinberg and gradient sources stay on the existing canvas path.
Color changes are pure CSS — no canvas work. Resize is free for tiles."
```

---

## Task 6: Update Existing Tests

Make sure existing tests still pass and add integration-level tests for the algorithm branching.

**Files:**
- Read: `packages/core/src/algorithms/bayer.test.ts` (existing tests)
- Read: `packages/core/src/renderer/canvas.test.ts` (existing tests)

**Step 1: Run all existing tests**

Run: `cd /Users/rivermassey/Desktop/dev/dithwather && npx vitest run`
Expected: All 91 existing tests still pass. The tile system is additive — nothing was removed.

**Step 2: Commit (if any test fixes needed)**

```bash
git commit -m "test: fix any test regressions from tile pipeline integration"
```

---

## Task 7: Build Verification and Cleanup

Final verification that everything works end-to-end.

**Step 1: Full build**

Run: `cd /Users/rivermassey/Desktop/dev/dithwather && pnpm clean && pnpm install && pnpm build`
Expected: Clean build of all packages succeeds

**Step 2: Full test suite**

Run: `cd /Users/rivermassey/Desktop/dev/dithwather && npx vitest run`
Expected: All tests pass (91 existing + new tile tests)

**Step 3: Type check**

Run: `cd /Users/rivermassey/Desktop/dev/dithwather && pnpm typecheck`
Expected: Zero type errors

**Step 4: Verify playground renders correctly**

Run: `cd /Users/rivermassey/Desktop/dev/dithwather && pnpm dev --filter @dithwather/playground`
Check:
- Bayer 2x2, 4x4, 8x8 examples render with visible dithering patterns
- Floyd-Steinberg example still renders correctly
- DitherButton examples work with hover animations
- DitherEditor produces live preview

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: binary tile pipeline complete — build and test verification"
```

---

## Summary: What Changed

### New files (3):
- `packages/core/src/tiles/bayer-tiles.ts` — 3-layer tile cache (bits → canvas → data URL)
- `packages/core/src/tiles/index.ts` — barrel export
- `packages/react/src/hooks/useBayerTile.ts` — CSS-ready tile hook

### Modified files (3):
- `packages/core/src/index.ts` — export tile module
- `packages/react/src/components/DitherBox.tsx` — algorithm branching + mask layer
- `packages/react/src/index.ts` — export new hook

### Untouched (everything else):
All existing algorithms, renderer, hooks, context, DitherButton, editor, and playground are unchanged. The tile system is purely additive — the canvas path remains as a fallback for Floyd-Steinberg and gradient sources.

### Performance impact:
- **Bayer + solid source**: From O(width*height) per frame → O(1) per frame
- **Color changes**: From full re-render → CSS property change
- **Resize**: From full re-render → free (tiles repeat via CSS)
- **Animation**: Color lerps are CSS-only. Threshold lerps swap tiny cached tiles.
- **Floyd-Steinberg**: No change (still canvas path)
- **Gradients**: No change (still canvas path)
