/**
 * @vitest-environment jsdom
 *
 * Performance benchmarks for renderGradientDither.
 *
 * Key metrics:
 * - Single frame render time at various resolutions
 * - Gradient type comparison (linear, radial, conic, diamond, reflected)
 * - pixelScale impact (the primary perf lever)
 * - Algorithm comparison (bayer2x2, bayer4x4, bayer8x8)
 *
 * Run:  pnpm vitest bench src/gradients/render.bench.ts
 */
import { bench, describe } from 'vitest'
import { renderGradientDither } from './render'
import type { ResolvedGradient } from './types'
import type { DitherGradientType } from './types'
import type { OrderedAlgorithm } from '../algorithms'

function makeGradient(
  type: DitherGradientType = 'linear',
  overrides: Partial<ResolvedGradient> = {},
): ResolvedGradient {
  return {
    type,
    stops: [
      { color: '#000000', position: 0 },
      { color: '#ffffff', position: 1 },
    ],
    angle: 135,
    center: [0.5, 0.5],
    radius: 1,
    aspect: 1,
    startAngle: 0,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Resolution scaling — the most important factor for DitherWipe performance.
// DitherWipe renders at ceil(w/pixelScale) x ceil(h/pixelScale), so a 600x1000
// element at pixelScale=3 renders 200x334 = ~67k pixels per frame.
// ---------------------------------------------------------------------------
describe('resolution scaling (linear, bayer4x4)', () => {
  const gradient = makeGradient('linear')

  bench('100x100 (10k px)', () => {
    renderGradientDither({ gradient, algorithm: 'bayer4x4', width: 100, height: 100 })
  })

  bench('200x334 (67k px — typical DitherWipe door)', () => {
    renderGradientDither({ gradient, algorithm: 'bayer4x4', width: 200, height: 334 })
  })

  bench('400x667 (267k px — large element, pixelScale=1)', () => {
    renderGradientDither({ gradient, algorithm: 'bayer4x4', width: 400, height: 667 })
  })

  bench('800x1334 (1M px — full-screen no scaling)', () => {
    renderGradientDither({ gradient, algorithm: 'bayer4x4', width: 800, height: 1334 })
  })
})

// ---------------------------------------------------------------------------
// pixelScale impact — rendering at reduced resolution then stretching via CSS
// ---------------------------------------------------------------------------
describe('pixelScale effect (600x1000 element, bayer4x4)', () => {
  const gradient = makeGradient('linear')

  bench('pixelScale=1 (600x1000 = 600k px)', () => {
    renderGradientDither({ gradient, algorithm: 'bayer4x4', width: 600, height: 1000, pixelScale: 1 })
  })

  bench('pixelScale=2 (300x500 = 150k px)', () => {
    renderGradientDither({ gradient, algorithm: 'bayer4x4', width: 300, height: 500, pixelScale: 1 })
  })

  bench('pixelScale=3 (200x334 = 67k px)', () => {
    renderGradientDither({ gradient, algorithm: 'bayer4x4', width: 200, height: 334, pixelScale: 1 })
  })

  bench('pixelScale=5 (120x200 = 24k px)', () => {
    renderGradientDither({ gradient, algorithm: 'bayer4x4', width: 120, height: 200, pixelScale: 1 })
  })
})

// ---------------------------------------------------------------------------
// Gradient type comparison — distance function cost
// ---------------------------------------------------------------------------
describe('gradient types (200x334, bayer4x4)', () => {
  const opts = { algorithm: 'bayer4x4' as const, width: 200, height: 334 }

  bench('linear', () => {
    renderGradientDither({ ...opts, gradient: makeGradient('linear') })
  })

  bench('radial', () => {
    renderGradientDither({ ...opts, gradient: makeGradient('radial') })
  })

  bench('conic', () => {
    renderGradientDither({ ...opts, gradient: makeGradient('conic') })
  })

  bench('diamond', () => {
    renderGradientDither({ ...opts, gradient: makeGradient('diamond') })
  })

  bench('reflected', () => {
    renderGradientDither({ ...opts, gradient: makeGradient('reflected') })
  })
})

// ---------------------------------------------------------------------------
// Algorithm comparison — matrix size affects pattern lookup
// ---------------------------------------------------------------------------
describe('algorithm comparison (200x334, linear)', () => {
  const gradient = makeGradient('linear')
  const opts = { gradient, width: 200, height: 334 }

  bench('bayer2x2', () => {
    renderGradientDither({ ...opts, algorithm: 'bayer2x2' as OrderedAlgorithm })
  })

  bench('bayer4x4', () => {
    renderGradientDither({ ...opts, algorithm: 'bayer4x4' as OrderedAlgorithm })
  })

  bench('bayer8x8', () => {
    renderGradientDither({ ...opts, algorithm: 'bayer8x8' as OrderedAlgorithm })
  })
})

// ---------------------------------------------------------------------------
// Multi-stop gradients — stop segment lookup cost
// ---------------------------------------------------------------------------
describe('stop count (200x334, linear, bayer4x4)', () => {
  const opts = { algorithm: 'bayer4x4' as const, width: 200, height: 334 }

  bench('2 stops (black→white)', () => {
    renderGradientDither({ ...opts, gradient: makeGradient('linear') })
  })

  bench('4 stops (wipe mask pattern)', () => {
    renderGradientDither({
      ...opts,
      gradient: makeGradient('linear', {
        stops: [
          { color: '#000000', position: 0 },
          { color: '#000000', position: 0.3 },
          { color: '#ffffff', position: 0.5 },
          { color: '#ffffff', position: 1 },
        ],
      }),
    })
  })

  bench('8 stops (complex gradient)', () => {
    renderGradientDither({
      ...opts,
      gradient: makeGradient('linear', {
        stops: [
          { color: '#000000', position: 0 },
          { color: '#333333', position: 0.15 },
          { color: '#000000', position: 0.3 },
          { color: '#666666', position: 0.45 },
          { color: '#999999', position: 0.6 },
          { color: '#ffffff', position: 0.75 },
          { color: '#cccccc', position: 0.9 },
          { color: '#ffffff', position: 1 },
        ],
      }),
    })
  })
})
