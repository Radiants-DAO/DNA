import { useState, useRef, useCallback } from 'react'
import {
  renderGradientDither,
  getWebGPURenderer,
  isWebGPUSupported,
  resolveGradient,
  type OrderedAlgorithm,
  type DitherGradientType,
  type DitherRenderer,
} from '@rdna/dithwather-core'
import { T } from '../tokens'
import { CPSelect, CPSlider, sectionHeadingStyle, sectionDescStyle } from '../shared'

// ============================================================================
// Types
// ============================================================================

interface BenchResult {
  renderer: 'canvas' | 'webgpu'
  iterations: number
  totalMs: number
  perFrameMs: number
  dataURL: string
}

interface RunConfig {
  width: number
  height: number
  pixelScale: number
  algorithm: OrderedAlgorithm
  gradientType: DitherGradientType
  iterations: number
}

// ============================================================================
// Helpers
// ============================================================================

function imageDataToDataURL(imageData: ImageData): string {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  canvas.getContext('2d')!.putImageData(imageData, 0, 0)
  return canvas.toDataURL()
}

async function runCanvas(config: RunConfig): Promise<BenchResult> {
  const gradient = resolveGradient(config.gradientType, ['#FEF8E2', '#C7505A', '#1F3D6B'], undefined)
  const opts = {
    gradient,
    algorithm: config.algorithm,
    width: config.width,
    height: config.height,
    pixelScale: config.pixelScale,
  }

  // warm-up
  renderGradientDither(opts)

  const start = performance.now()
  let last: ImageData | null = null
  for (let i = 0; i < config.iterations; i++) {
    last = renderGradientDither(opts)
  }
  const totalMs = performance.now() - start

  return {
    renderer: 'canvas',
    iterations: config.iterations,
    totalMs,
    perFrameMs: totalMs / config.iterations,
    dataURL: imageDataToDataURL(last!),
  }
}

async function runWebGPU(config: RunConfig): Promise<BenchResult> {
  const gpuRenderer = await getWebGPURenderer()
  if (!gpuRenderer) throw new Error('WebGPU not available')

  const gradient = resolveGradient(config.gradientType, ['#FEF8E2', '#C7505A', '#1F3D6B'], undefined)
  const opts = {
    gradient,
    algorithm: config.algorithm,
    width: config.width,
    height: config.height,
    pixelScale: config.pixelScale,
  }

  // warm-up
  await gpuRenderer.render(opts)

  const start = performance.now()
  let last: ImageData | null = null
  for (let i = 0; i < config.iterations; i++) {
    last = await gpuRenderer.render(opts)
  }
  const totalMs = performance.now() - start

  return {
    renderer: 'webgpu',
    iterations: config.iterations,
    totalMs,
    perFrameMs: totalMs / config.iterations,
    dataURL: imageDataToDataURL(last!),
  }
}

// ============================================================================
// Result Card
// ============================================================================

function ResultCard({ result, isFaster }: { result: BenchResult; isFaster: boolean }) {
  const accentColor = result.renderer === 'webgpu' ? T.brand.skyBlue : T.brand.sunYellow

  return (
    <div style={{
      flex: '1 1 0',
      minWidth: 0,
      border: `1px solid ${isFaster ? accentColor : T.edge.muted}`,
      borderRadius: 4,
      overflow: 'hidden',
      background: T.surface.elevated,
    }}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.edge.muted}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: T.font.code,
            fontSize: 11,
            fontWeight: 700,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            {result.renderer}
          </span>
          {isFaster && (
            <span style={{
              fontFamily: T.font.code,
              fontSize: 9,
              color: accentColor,
              background: `${accentColor}22`,
              padding: '2px 6px',
              borderRadius: 2,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>faster</span>
          )}
        </div>
        <div style={{ marginTop: 8 }}>
          <span style={{
            fontFamily: T.font.heading,
            fontSize: 28,
            fontWeight: 700,
            color: T.content.heading,
            lineHeight: 1,
          }}>
            {result.perFrameMs.toFixed(2)}
          </span>
          <span style={{ fontFamily: T.font.code, fontSize: 11, color: T.content.muted, marginLeft: 4 }}>
            ms / frame
          </span>
        </div>
        <div style={{ marginTop: 4, fontFamily: T.font.code, fontSize: 10, color: T.content.muted }}>
          {result.totalMs.toFixed(0)}ms total · {result.iterations}× iterations
        </div>
      </div>
      <img
        src={result.dataURL}
        alt={`${result.renderer} output`}
        style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block', imageRendering: 'pixelated' }}
      />
    </div>
  )
}

// ============================================================================
// Benchmark Section
// ============================================================================

const SIZE_OPTIONS = [
  { value: '200x150',  label: '200 × 150  (small)' },
  { value: '400x300',  label: '400 × 300  (medium)' },
  { value: '800x600',  label: '800 × 600  (large)' },
  { value: '1200x800', label: '1200 × 800 (xl)' },
]

const ALGORITHM_OPTIONS: { value: OrderedAlgorithm; label: string }[] = [
  { value: 'bayer2x2', label: 'Bayer 2×2' },
  { value: 'bayer4x4', label: 'Bayer 4×4' },
  { value: 'bayer8x8', label: 'Bayer 8×8' },
]

const GRADIENT_OPTIONS: { value: DitherGradientType; label: string }[] = [
  { value: 'linear',    label: 'Linear' },
  { value: 'radial',    label: 'Radial' },
  { value: 'conic',     label: 'Conic' },
  { value: 'diamond',   label: 'Diamond' },
  { value: 'reflected', label: 'Reflected' },
]

type BenchState = 'idle' | 'running-canvas' | 'running-webgpu' | 'done'

export default function Benchmark() {
  const [sizeKey, setSizeKey] = useState('400x300')
  const [algorithm, setAlgorithm] = useState<OrderedAlgorithm>('bayer4x4')
  const [gradientType, setGradientType] = useState<DitherGradientType>('linear')
  const [pixelScale, setPixelScale] = useState(1)
  const [iterations, setIterations] = useState(10)
  const [benchState, setBenchState] = useState<BenchState>('idle')
  const [results, setResults] = useState<{ canvas?: BenchResult; webgpu?: BenchResult } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef(false)

  const webGPUAvailable = isWebGPUSupported()

  const run = useCallback(async (rendererChoice: DitherRenderer) => {
    abortRef.current = false
    setError(null)
    setResults(null)

    const [w, h] = sizeKey.split('x').map(Number)
    const config: RunConfig = { width: w, height: h, pixelScale, algorithm, gradientType, iterations }

    const runBoth = rendererChoice === 'auto'

    if (runBoth || rendererChoice === 'canvas') {
      setBenchState('running-canvas')
      const canvasResult = await runCanvas(config)
      if (abortRef.current) return
      setResults(prev => ({ ...prev, canvas: canvasResult }))
    }

    if (runBoth || rendererChoice === 'webgpu') {
      setBenchState('running-webgpu')
      try {
        const webgpuResult = await runWebGPU(config)
        if (abortRef.current) return
        setResults(prev => ({ ...prev, webgpu: webgpuResult }))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'WebGPU render failed')
      }
    }

    setBenchState('done')
  }, [sizeKey, pixelScale, algorithm, gradientType, iterations])

  const canvasPerFrame = results?.canvas?.perFrameMs
  const webgpuPerFrame = results?.webgpu?.perFrameMs
  const speedup = canvasPerFrame && webgpuPerFrame ? canvasPerFrame / webgpuPerFrame : null

  return (
    <div>
      <div style={sectionHeadingStyle}>Renderer Benchmark</div>
      <p style={sectionDescStyle}>
        Canvas (CPU, synchronous) vs WebGPU (compute shader, async) — same gradient, same output.
        {!webGPUAvailable && (
          <span style={{ color: '#C7505A', marginLeft: 8 }}>
            WebGPU not available in this browser.
          </span>
        )}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 32, alignItems: 'start' }}>
        {/* Controls */}
        <div style={{
          background: T.surface.elevated,
          border: `1px solid ${T.edge.muted}`,
          borderRadius: 4,
          padding: 16,
        }}>
          <CPSelect
            label="Size"
            value={sizeKey}
            onChange={setSizeKey}
            options={SIZE_OPTIONS}
          />
          <CPSelect
            label="Algorithm"
            value={algorithm}
            onChange={setAlgorithm}
            options={ALGORITHM_OPTIONS}
          />
          <CPSelect
            label="Gradient"
            value={gradientType}
            onChange={setGradientType}
            options={GRADIENT_OPTIONS}
          />
          <CPSlider label="Pixel Scale" value={pixelScale} onChange={v => setPixelScale(Math.round(v))} min={1} max={8} step={1} />
          <CPSlider label="Iterations" value={iterations} onChange={v => setIterations(Math.round(v))} min={1} max={50} step={1} />

          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              onClick={() => run('auto')}
              disabled={benchState === 'running-canvas' || benchState === 'running-webgpu'}
              style={{
                fontFamily: T.font.code,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '8px 12px',
                background: T.brand.sunYellow,
                color: T.surface.primary,
                border: 'none',
                borderRadius: 3,
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              Run Both
            </button>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => run('canvas')}
                disabled={benchState === 'running-canvas' || benchState === 'running-webgpu'}
                style={{
                  flex: 1,
                  fontFamily: T.font.code,
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '6px 8px',
                  background: 'transparent',
                  color: T.brand.sunYellow,
                  border: `1px solid ${T.brand.sunYellow}44`,
                  borderRadius: 3,
                  cursor: 'pointer',
                }}
              >
                Canvas only
              </button>
              <button
                onClick={() => run('webgpu')}
                disabled={!webGPUAvailable || benchState === 'running-canvas' || benchState === 'running-webgpu'}
                style={{
                  flex: 1,
                  fontFamily: T.font.code,
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '6px 8px',
                  background: 'transparent',
                  color: T.brand.skyBlue,
                  border: `1px solid ${T.brand.skyBlue}44`,
                  borderRadius: 3,
                  cursor: webGPUAvailable ? 'pointer' : 'not-allowed',
                  opacity: webGPUAvailable ? 1 : 0.4,
                }}
              >
                WebGPU only
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          {/* Status */}
          {(benchState === 'running-canvas' || benchState === 'running-webgpu') && (
            <div style={{
              fontFamily: T.font.code,
              fontSize: 12,
              color: T.content.muted,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: benchState === 'running-webgpu' ? T.brand.skyBlue : T.brand.sunYellow,
                animation: 'pulse 1s ease-in-out infinite',
              }} />
              Running {benchState === 'running-canvas' ? 'canvas' : 'webgpu'}…
            </div>
          )}

          {error && (
            <div style={{
              fontFamily: T.font.code,
              fontSize: 11,
              color: '#C7505A',
              background: '#C7505A11',
              border: '1px solid #C7505A44',
              borderRadius: 3,
              padding: '8px 12px',
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          {/* Result cards */}
          {results && (results.canvas || results.webgpu) && (
            <>
              {speedup !== null && (
                <div style={{
                  marginBottom: 16,
                  fontFamily: T.font.code,
                  fontSize: 12,
                  color: T.content.muted,
                }}>
                  Speedup:{' '}
                  <span style={{
                    color: speedup > 1 ? T.brand.skyBlue : T.brand.sunYellow,
                    fontWeight: 700,
                    fontSize: 14,
                  }}>
                    {speedup > 1 ? `${speedup.toFixed(1)}× faster (WebGPU)` : `${(1 / speedup).toFixed(1)}× faster (Canvas)`}
                  </span>
                  {' '}· {sizeKey} · {algorithm} · pixelScale={pixelScale}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                {results.canvas && (
                  <ResultCard
                    result={results.canvas}
                    isFaster={!webgpuPerFrame || (canvasPerFrame! <= webgpuPerFrame)}
                  />
                )}
                {results.webgpu && (
                  <ResultCard
                    result={results.webgpu}
                    isFaster={!canvasPerFrame || (webgpuPerFrame! <= canvasPerFrame)}
                  />
                )}
              </div>
            </>
          )}

          {/* Empty state */}
          {!results && benchState === 'idle' && (
            <div style={{
              border: `1px dashed ${T.edge.muted}`,
              borderRadius: 4,
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: T.font.code,
              fontSize: 11,
              color: T.content.muted,
              letterSpacing: '0.04em',
            }}>
              configure and run to see results
            </div>
          )}

          {/* Note about what's being measured */}
          {benchState === 'done' && results && (
            <div style={{
              marginTop: 16,
              fontFamily: T.font.code,
              fontSize: 10,
              color: T.content.muted,
              lineHeight: 1.6,
            }}>
              <span style={{ color: T.brand.sunYellow }}>canvas</span> = CPU JS pixel loop + putImageData.{' '}
              <span style={{ color: T.brand.skyBlue }}>webgpu</span> = GPU compute dispatch + CPU readback + putImageData.
              Both include one warm-up render before timing starts.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
