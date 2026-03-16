import { useState, useEffect, useRef, useCallback } from 'react'
import { DitherBox } from '@rdna/dithwather-react'
import { renderGradientDitherAuto } from '@rdna/dithwather-core'
import { T } from '../tokens'
import { Badge, CPSlider, sectionStyle, sectionHeadingStyle, sectionDescStyle, cellLabelStyle, cardStyle, cardLabelStyle } from '../shared'

// ============================================================================
// Diagnostics: FPS Counter
// ============================================================================

const diagLabelStyle: React.CSSProperties = {
  fontFamily: T.font.code,
  fontSize: '9px',
  color: T.content.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const diagValueStyle: React.CSSProperties = {
  fontFamily: T.font.code,
  fontSize: '11px',
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
}

function useFps() {
  const [fps, setFps] = useState(0)
  const framesRef = useRef(0)
  const lastTimeRef = useRef(0)

  useEffect(() => {
    let raf: number
    lastTimeRef.current = performance.now()
    const tick = (now: number) => {
      framesRef.current++
      const delta = now - lastTimeRef.current
      if (delta >= 1000) {
        setFps(Math.round((framesRef.current * 1000) / delta))
        framesRef.current = 0
        lastTimeRef.current = now
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return fps
}

function FpsCounter() {
  const fps = useFps()
  const color = fps >= 50 ? T.brand.green : fps >= 30 ? T.brand.sunYellow : T.brand.sunRed
  return (
    <div style={{
      position: 'fixed',
      top: 12,
      right: 12,
      zIndex: 9999,
      background: 'rgba(15, 14, 12, 0.92)',
      border: `1px solid ${T.edge.muted}`,
      borderRadius: 4,
      padding: '6px 10px',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      backdropFilter: 'blur(8px)',
    }}>
      <span style={diagLabelStyle}>FPS</span>
      <span style={{ ...diagValueStyle, color, minWidth: 24, textAlign: 'right' }}>{fps}</span>
    </div>
  )
}

// ============================================================================
// Diagnostics: Perf Overlay (inline stats for a component)
// ============================================================================

interface PerfStats {
  moveRate: number
  appliedRate: number
  center: [number, number]
  renderWidth: number
  renderHeight: number
  pixelCount: number
  renderTimeMs: number
}

function PerfOverlay({ stats }: { stats: PerfStats }) {
  const renderColor = stats.renderTimeMs < 8 ? T.brand.green
    : stats.renderTimeMs < 16 ? T.brand.sunYellow
    : stats.renderTimeMs < 33 ? T.brand.sunsetFuzz
    : T.brand.sunRed

  const dropRate = stats.moveRate > 0
    ? Math.round((1 - stats.appliedRate / stats.moveRate) * 100)
    : 0

  const rows: [string, string, string][] = [
    ['events/s', String(stats.moveRate), stats.moveRate > 100 ? T.brand.sunYellow : T.content.muted],
    ['applied/s', String(stats.appliedRate), T.brand.green],
    ['dropped', `${dropRate}%`, dropRate > 50 ? T.brand.sunRed : dropRate > 20 ? T.brand.sunYellow : T.content.muted],
    ['center', `${stats.center[0].toFixed(3)}, ${stats.center[1].toFixed(3)}`, T.content.muted],
    ['render px', `${stats.renderWidth}x${stats.renderHeight}`, T.content.muted],
    ['total px', stats.pixelCount.toLocaleString(), stats.pixelCount > 200_000 ? T.brand.sunRed : T.content.muted],
    ['render ms', stats.renderTimeMs.toFixed(1), renderColor],
  ]

  return (
    <div style={{
      position: 'absolute',
      top: 8,
      left: 8,
      zIndex: 10,
      background: 'rgba(15, 14, 12, 0.88)',
      border: `1px solid ${T.edge.muted}`,
      borderRadius: 4,
      padding: '8px 10px',
      pointerEvents: 'none',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
    }}>
      {rows.map(([label, value, color]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={diagLabelStyle}>{label}</span>
          <span style={{ ...diagValueStyle, color, minWidth: 80, textAlign: 'right' }}>{value}</span>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Glitch Mode
// ============================================================================

function GlitchModeDemo() {
  const [open, setOpen] = useState(false)
  const [glitch, setGlitch] = useState(0.7)

  return (
    <section style={{
      ...sectionStyle,
      border: `1px dashed ${T.edge.muted}`,
      borderRadius: 6,
      padding: 16,
      opacity: open ? 1 : 0.7,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <h2 style={{ ...sectionHeadingStyle, marginBottom: 0 }}>
          <Badge color={T.brand.sunRed} />
          Glitch Mode
          <span style={{
            fontFamily: T.font.code,
            fontSize: '8px',
            fontWeight: 600,
            color: T.brand.sunRed,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            border: `1px solid ${T.brand.sunRed}`,
            borderRadius: 2,
            padding: '2px 5px',
            marginLeft: 4,
          }}>
            experimental
          </span>
        </h2>
        <span style={{
          fontFamily: T.font.code,
          fontSize: 10,
          color: T.content.muted,
          marginLeft: 'auto',
        }}>
          {open ? '▾' : '▸'}
        </span>
      </button>
      <p style={{ ...sectionDescStyle, marginTop: 8 }}>
        deliberate stride offset -- scanline shift + RGBA channel fringing. performance may vary.
      </p>

      {open && (
        <>
          {/* Preset values */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'no glitch', value: 0 },
              { label: 'subtle', value: 0.3 },
              { label: 'medium', value: 0.7 },
              { label: 'heavy', value: 1.5 },
            ].map(({ label, value }) => (
              <div key={label}>
                <DitherBox
                  colors={[T.surface.primary, T.brand.sunRed]}
                  algorithm="bayer8x8"
                  pixelScale={2}
                  glitch={value}
                  className="dither-card"
                  style={cardStyle}
                >
                  <span style={{ ...cardLabelStyle, color: T.brand.sunRed }}>
                    {label}
                  </span>
                </DitherBox>
                <p style={cellLabelStyle}>glitch: {value}</p>
              </div>
            ))}
          </div>

          {/* Interactive slider */}
          <div style={{
            border: `1px solid ${T.edge.muted}`,
            borderRadius: '4px',
            boxShadow: T.shadow.card,
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: '200px 1fr',
            gap: '24px',
          }}>
            <div style={{ padding: '20px', background: T.surface.elevated }}>
              <CPSlider
                label="Glitch"
                value={glitch}
                onChange={setGlitch}
                min={0}
                max={3}
                step={0.1}
              />
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: T.surface.muted,
              minHeight: '160px',
              padding: '16px',
            }}>
              <DitherBox
                gradient="radial"
                colors={[T.surface.primary, T.brand.sunYellow, T.brand.sunRed]}
                algorithm="bayer4x4"
                pixelScale={2}
                glitch={glitch}
                style={{
                  width: '100%',
                  height: '140px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                }}
              >
                <span style={{
                  fontFamily: T.font.code,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: T.content.heading,
                  textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                }}>
                  glitch: {glitch.toFixed(1)}
                </span>
              </DitherBox>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

// ============================================================================
// Mouse Follower
// ============================================================================

function MouseFollower() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<[number, number]>([0.5, 0.5])
  const rafRef = useRef(0)
  const sizeRef = useRef({ width: 0, height: 0 })

  const pendingRef = useRef(false)

  // --- diagnostics ---
  const moveCountRef = useRef(0)
  const appliedCountRef = useRef(0)
  const renderTimeMsRef = useRef(0)
  const [diagSnap, setDiagSnap] = useState<PerfStats>({
    moveRate: 0, appliedRate: 0,
    center: [0.5, 0.5],
    renderWidth: 0, renderHeight: 0, pixelCount: 0, renderTimeMs: 0,
  })

  // Snapshot diagnostics once per second (only React setState in the whole component)
  useEffect(() => {
    const id = setInterval(() => {
      setDiagSnap({
        moveRate: moveCountRef.current,
        appliedRate: appliedCountRef.current,
        center: centerRef.current,
        renderWidth: sizeRef.current.width,
        renderHeight: sizeRef.current.height,
        pixelCount: sizeRef.current.width * sizeRef.current.height,
        renderTimeMs: renderTimeMsRef.current,
      })
      moveCountRef.current = 0
      appliedCountRef.current = 0
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Track container size
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      sizeRef.current = { width: Math.round(width), height: Math.round(height) }
      // Re-render at current center with new size
      renderFrame(centerRef.current)
    })
    ro.observe(el)
    return () => ro.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Direct canvas render — no React, no DitherBox, no toBlob
  const renderFrame = useCallback((center: [number, number]) => {
    const canvas = canvasRef.current
    const { width, height } = sizeRef.current
    if (!canvas || width <= 0 || height <= 0 || pendingRef.current) return

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }

    const t0 = performance.now()
    pendingRef.current = true
    renderGradientDitherAuto({
      gradient: {
        type: 'radial',
        stops: [
          { color: '#FCE184', position: 0 },
          { color: '#e94560', position: 0.5 },
          { color: '#0F0E0C', position: 1 },
        ],
        angle: 0,
        center,
        radius: 0.8,
        aspect: 1,
        startAngle: 0,
      },
      algorithm: 'bayer8x8',
      width,
      height,
      pixelScale: 2,
    }).then(imageData => {
      pendingRef.current = false
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.putImageData(imageData, 0, 0)
      renderTimeMsRef.current = performance.now() - t0
      appliedCountRef.current++
    }).catch(() => { pendingRef.current = false })
  }, [])

  // Initial render
  useEffect(() => {
    renderFrame(centerRef.current)
    return () => cancelAnimationFrame(rafRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    moveCountRef.current++
    const rect = e.currentTarget.getBoundingClientRect()
    centerRef.current = [
      (e.clientX - rect.left) / rect.width,
      (e.clientY - rect.top) / rect.height,
    ]

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0
        renderFrame(centerRef.current)
      })
    }
  }, [renderFrame])

  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <Badge color={T.brand.green} />
        Mouse Follower
      </h2>
      <p style={sectionDescStyle}>Radial gradient center tracks your cursor. Move your mouse around.</p>
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        style={{
          position: 'relative',
          height: 300,
          borderRadius: 8,
          border: `1px solid ${T.edge.muted}`,
          cursor: 'crosshair',
          overflow: 'hidden',
        }}
      >
        <PerfOverlay stats={diagSnap} />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        />
        <span style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...cardLabelStyle,
          fontSize: 14,
          opacity: 0.4,
          pointerEvents: 'none',
        }}>
          move your mouse
        </span>
      </div>
    </section>
  )
}

// ============================================================================
// Click Pulse (idle-optimized: rAF only when pulses exist)
// ============================================================================

interface Pulse {
  id: number
  center: [number, number]
  startTime: number
}

function ClickPulse() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pulsesRef = useRef<Pulse[]>([])
  const nextId = useRef(0)
  const animFrameRef = useRef<number>(0)
  const runningRef = useRef(false)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setSize({ width: Math.round(width), height: Math.round(height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const startLoop = useCallback(() => {
    if (runningRef.current) return
    runningRef.current = true

    const canvas = canvasRef.current
    if (!canvas || size.width <= 0 || size.height <= 0) {
      runningRef.current = false
      return
    }

    canvas.width = size.width
    canvas.height = size.height
    const ctx = canvas.getContext('2d')!

    const DURATION = 800
    const MAX_RADIUS = 1.5

    const animate = () => {
      const now = performance.now()
      pulsesRef.current = pulsesRef.current.filter(p => now - p.startTime < DURATION)

      if (pulsesRef.current.length === 0) {
        runningRef.current = false
        return
      }

      // Capture timing params synchronously before any async work
      const jobs = pulsesRef.current.map(pulse => {
        const progress = (now - pulse.startTime) / DURATION
        const eased = 1 - Math.pow(1 - progress, 3)
        return {
          center: pulse.center,
          radius: 0.1 + eased * MAX_RADIUS,
          threshold: 0.5 - eased * 1.5,
          progress,
        }
      })

      // Fire all pulse renders in parallel
      Promise.all(jobs.map(job => renderGradientDitherAuto({
        gradient: {
          type: 'radial',
          stops: [
            { color: '#FCE184', position: 0 },
            { color: '#0F0E0C', position: 1 },
          ],
          angle: 0,
          center: job.center,
          radius: job.radius,
          aspect: 1,
          startAngle: 0,
        },
        algorithm: 'bayer4x4',
        width: size.width,
        height: size.height,
        threshold: job.threshold,
        pixelScale: 3,
      }))).then(imageDataList => {
        ctx.clearRect(0, 0, size.width, size.height)
        for (const [i, imageData] of imageDataList.entries()) {
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = size.width
          tempCanvas.height = size.height
          const tempCtx = tempCanvas.getContext('2d')!
          tempCtx.putImageData(imageData, 0, 0)
          ctx.globalAlpha = 1 - jobs[i].progress
          ctx.drawImage(tempCanvas, 0, 0)
          ctx.globalAlpha = 1
        }
        animFrameRef.current = requestAnimationFrame(animate)
      }).catch(() => {
        animFrameRef.current = requestAnimationFrame(animate)
      })
    }

    animFrameRef.current = requestAnimationFrame(animate)
  }, [size])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      runningRef.current = false
    }
  }, [])

  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const center: [number, number] = [
      (e.clientX - rect.left) / rect.width,
      (e.clientY - rect.top) / rect.height,
    ]
    pulsesRef.current.push({
      id: nextId.current++,
      center,
      startTime: performance.now(),
    })
    startLoop()
  }, [startLoop])

  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <Badge color={T.brand.green} />
        Click Pulse
      </h2>
      <p style={sectionDescStyle}>Click anywhere to spawn radial dither pulses. Multiple pulses composite together.</p>
      <div
        ref={containerRef}
        onClick={handleClick}
        style={{
          position: 'relative',
          height: 300,
          borderRadius: 8,
          border: `1px solid ${T.edge.muted}`,
          background: T.surface.primary,
          cursor: 'pointer',
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        />
        <span style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...cardLabelStyle,
          fontSize: 14,
          opacity: 0.4,
          pointerEvents: 'none',
        }}>
          click anywhere
        </span>
      </div>
    </section>
  )
}

// ============================================================================
// Scroll Reveal (scoped container for tab context)
// ============================================================================

function ScrollReveal() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const canvasLeftRef = useRef<HTMLCanvasElement>(null)
  const canvasRightRef = useRef<HTMLCanvasElement>(null)
  const cardLeftRef = useRef<HTMLDivElement>(null)
  const cardRightRef = useRef<HTMLDivElement>(null)
  const thresholdRef = useRef(0)
  const rafRef = useRef(0)
  const [thresholdDisplay, setThresholdDisplay] = useState(0)

  const renderMasks = useCallback((threshold: number) => {
    const jobs: Promise<void>[] = []

    // Left card: linear mask, bayer8x8, pixelScale 2
    const cL = canvasLeftRef.current
    const dL = cardLeftRef.current
    if (cL && dL) {
      const w = Math.round(dL.clientWidth)
      const h = Math.round(dL.clientHeight)
      if (w > 0 && h > 0) {
        if (cL.width !== w || cL.height !== h) { cL.width = w; cL.height = h }
        jobs.push(renderGradientDitherAuto({
          gradient: {
            type: 'linear', angle: 0, center: [0.5, 0.5], radius: 0.5, aspect: 1, startAngle: 0,
            stops: [{ color: '#000000', position: 0 }, { color: '#ffffff', position: 1 }],
          },
          algorithm: 'bayer8x8', width: w, height: h, pixelScale: 2,
          threshold: (threshold - 0.5) * 2,
        }).then(imageData => { cL.getContext('2d')!.putImageData(imageData, 0, 0) }))
      }
    }

    // Right card: diamond mask, bayer4x4, pixelScale 3
    const cR = canvasRightRef.current
    const dR = cardRightRef.current
    if (cR && dR) {
      const w = Math.round(dR.clientWidth)
      const h = Math.round(dR.clientHeight)
      if (w > 0 && h > 0) {
        if (cR.width !== w || cR.height !== h) { cR.width = w; cR.height = h }
        jobs.push(renderGradientDitherAuto({
          gradient: {
            type: 'diamond', angle: 0, center: [0.5, 0.5], radius: 0.5, aspect: 1, startAngle: 0,
            stops: [{ color: '#000000', position: 0 }, { color: '#ffffff', position: 1 }],
          },
          algorithm: 'bayer4x4', width: w, height: h, pixelScale: 3,
          threshold: (threshold - 0.5) * 2,
        }).then(imageData => { cR.getContext('2d')!.putImageData(imageData, 0, 0) }))
      }
    }

    Promise.all(jobs).catch(() => {})
  }, [])

  useEffect(() => {
    renderMasks(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleScroll = () => {
      const progress = Math.max(0, Math.min(1, el.scrollTop / (el.scrollHeight - el.clientHeight)))
      thresholdRef.current = progress

      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = 0
          renderMasks(thresholdRef.current)
          setThresholdDisplay(thresholdRef.current)
        })
      }
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [renderMasks])

  const maskCardStyle: React.CSSProperties = {
    position: 'relative',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <Badge color={T.brand.green} />
        Scroll Reveal
      </h2>
      <p style={sectionDescStyle}>Scroll inside the container to reveal content through a dither mask. Threshold tracks scroll position.</p>
      <div
        ref={scrollRef}
        style={{
          height: 400,
          overflowY: 'auto',
          borderRadius: 8,
          border: `1px solid ${T.edge.muted}`,
        }}
      >
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ ...cardLabelStyle, fontSize: 14, opacity: 0.4 }}>scroll down</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 16 }}>
          {/* Left card */}
          <div ref={cardLeftRef} style={{ ...maskCardStyle, background: `linear-gradient(135deg, ${T.brand.sunYellow}, ${T.brand.sunRed})` }}>
            <span style={{ ...cardLabelStyle, fontSize: 20, position: 'relative', zIndex: 1 }}>Hello</span>
            <canvas ref={canvasLeftRef} style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              mixBlendMode: 'multiply',
            }} />
          </div>
          {/* Right card */}
          <div ref={cardRightRef} style={{ ...maskCardStyle, background: `linear-gradient(135deg, ${T.brand.skyBlue}, ${T.brand.green})` }}>
            <span style={{ ...cardLabelStyle, fontSize: 20, position: 'relative', zIndex: 1 }}>World</span>
            <canvas ref={canvasRightRef} style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              mixBlendMode: 'multiply',
            }} />
          </div>
        </div>
        <div style={{ height: 300 }} />
      </div>
      <p style={{ ...sectionDescStyle, marginTop: 12, marginBottom: 0 }}>
        threshold: {thresholdDisplay.toFixed(2)}
      </p>
    </section>
  )
}

// ============================================================================
// Interactive Section (default export)
// ============================================================================

export default function Interactive() {
  return (
    <>
      <FpsCounter />
      <MouseFollower />
      <ClickPulse />
      <ScrollReveal />
      <GlitchModeDemo />
    </>
  )
}
