import { useState, useMemo, useCallback } from 'react'
import { DitherBox } from '@rdna/dithwather-react'
import type { OrderedAlgorithm, DitherMode, DitherGradientType, DitherGradient } from '@rdna/dithwather-react'
import { T } from '../tokens'
import { Badge, CPSlider, CPSelect, sectionStyle, sectionHeadingStyle, sectionDescStyle, dividerStyle, cpLabelStyle, cpInputStyle } from '../shared'

// ============================================================================
// Constants
// ============================================================================

const ALGORITHM_OPTIONS = [
  { value: 'bayer2x2' as const, label: 'Bayer 2x2' },
  { value: 'bayer4x4' as const, label: 'Bayer 4x4' },
  { value: 'bayer8x8' as const, label: 'Bayer 8x8' },
]

const GRADIENT_TYPE_OPTIONS = [
  { value: 'linear' as const, label: 'Linear' },
  { value: 'radial' as const, label: 'Radial' },
  { value: 'conic' as const, label: 'Conic' },
  { value: 'diamond' as const, label: 'Diamond' },
  { value: 'reflected' as const, label: 'Reflected' },
]

const MODE_OPTIONS = [
  { value: 'background' as const, label: 'Background' },
  { value: 'mask' as const, label: 'Mask' },
  { value: 'full' as const, label: 'Full' },
]

type MaskSubject = 'gradient' | 'card' | 'heading' | 'image' | 'stats'

const MASK_SUBJECT_OPTIONS = [
  { value: 'gradient' as const, label: 'Gradient BG' },
  { value: 'card' as const, label: 'Profile Card' },
  { value: 'heading' as const, label: 'Hero Text' },
  { value: 'image' as const, label: 'Color Image' },
  { value: 'stats' as const, label: 'Stats Panel' },
]

// ============================================================================
// Mask Subject Content
// ============================================================================

function MaskSubjectContent({ subject }: { subject: MaskSubject }) {
  switch (subject) {
    case 'gradient':
      return (
        <span style={{
          fontFamily: T.font.heading,
          fontSize: '16px',
          fontWeight: 700,
          color: T.surface.primary,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          revealed
        </span>
      )
    case 'card':
      return (
        <div style={{ textAlign: 'center', padding: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${T.brand.skyBlue}, ${T.brand.green})`,
            margin: '0 auto 12px',
          }} />
          <div style={{
            fontFamily: T.font.heading,
            fontSize: '14px',
            color: T.content.heading,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '4px',
          }}>
            user profile
          </div>
          <div style={{
            fontFamily: T.font.code,
            fontSize: '11px',
            color: T.content.muted,
            marginBottom: '12px',
          }}>
            dither-masked card component
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {['Following', 'Message'].map(label => (
              <span key={label} style={{
                fontFamily: T.font.code,
                fontSize: '9px',
                color: T.brand.skyBlue,
                border: `1px solid ${T.brand.skyBlue}`,
                borderRadius: '3px',
                padding: '3px 8px',
                textTransform: 'uppercase',
              }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      )
    case 'heading':
      return (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{
            fontFamily: T.font.heading,
            fontSize: '28px',
            fontWeight: 700,
            color: T.content.heading,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            lineHeight: 1.1,
            marginBottom: '8px',
          }}>
            hello world
          </div>
          <div style={{
            fontFamily: T.font.code,
            fontSize: '12px',
            color: T.content.muted,
            letterSpacing: '0.02em',
          }}>
            dithered text reveal -- mask mode transition
          </div>
        </div>
      )
    case 'image':
      return (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            conic-gradient(from 45deg at 30% 40%, ${T.brand.sunRed}, ${T.brand.sunYellow}, ${T.brand.green}, ${T.brand.skyBlue}, ${T.brand.sunRed}),
            linear-gradient(135deg, ${T.brand.sunsetFuzz}, ${T.brand.sunRed})
          `,
          backgroundBlendMode: 'overlay',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: T.font.heading,
            fontSize: '14px',
            color: T.surface.primary,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            textShadow: '0 1px 2px rgba(255,255,255,0.3)',
          }}>
            color image
          </span>
        </div>
      )
    case 'stats':
      return (
        <div style={{ display: 'flex', gap: '24px', padding: '16px' }}>
          {[
            { value: '12.4k', label: 'Users', color: T.brand.sunYellow },
            { value: '98%', label: 'Uptime', color: T.brand.green },
            { value: '3.2s', label: 'Avg Load', color: T.brand.skyBlue },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{
                fontFamily: T.font.heading,
                fontSize: '20px',
                fontWeight: 700,
                color: stat.color,
                marginBottom: '2px',
              }}>
                {stat.value}
              </div>
              <div style={{
                fontFamily: T.font.code,
                fontSize: '9px',
                color: T.content.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )
  }
}

function getMaskSubjectBackground(subject: MaskSubject): string {
  switch (subject) {
    case 'gradient':
      return `linear-gradient(135deg, ${T.brand.sunRed}, ${T.brand.sunYellow}, ${T.brand.green})`
    case 'card':
      return T.surface.elevated
    case 'heading':
      return T.surface.elevated
    case 'image':
      return T.surface.primary
    case 'stats':
      return T.surface.elevated
  }
}

// ============================================================================
// Control Panel / Sandbox Section (default export)
// ============================================================================

export default function Sandbox() {
  const [algorithm, setAlgorithm] = useState<OrderedAlgorithm>('bayer4x4')
  const [gradientType, setGradientType] = useState<DitherGradientType>('linear')
  const [mode, setMode] = useState<DitherMode>('background')
  const [threshold, setThreshold] = useState(0.5)
  const [pixelScale, setPixelScale] = useState(2)

  const [colorStops, setColorStops] = useState<string[]>([T.surface.primary, T.brand.sunYellow])
  const [angle, setAngle] = useState(90)
  const [centerX, setCenterX] = useState(0.5)
  const [centerY, setCenterY] = useState(0.5)
  const [radius, setRadius] = useState(0.5)
  const [startAngle, setStartAngle] = useState(0)

  const [glitch, setGlitch] = useState(0)
  const [maskSubject, setMaskSubject] = useState<MaskSubject>('gradient')

  const [animateEnabled, setAnimateEnabled] = useState(false)
  const [hoverThreshold, setHoverThreshold] = useState(0.65)
  const [transitionMs, setTransitionMs] = useState(300)

  const needsAngle = gradientType === 'linear' || gradientType === 'reflected'
  const needsCenter = gradientType === 'radial' || gradientType === 'conic' || gradientType === 'diamond'
  const needsRadius = gradientType === 'radial' || gradientType === 'diamond'
  const needsStartAngle = gradientType === 'conic'

  const gradient = useMemo((): DitherGradient => ({
    type: gradientType,
    stops: colorStops.map((color, i) => ({
      color,
      position: colorStops.length > 1 ? i / (colorStops.length - 1) : 0,
    })),
    ...(needsAngle && { angle }),
    ...(needsCenter && { center: [centerX, centerY] as [number, number] }),
    ...(needsRadius && { radius }),
    ...(needsStartAngle && { startAngle }),
  }), [gradientType, colorStops, needsAngle, angle, needsCenter, centerX, centerY, needsRadius, radius, needsStartAngle, startAngle])

  const animateConfig = animateEnabled ? {
    idle: { threshold },
    hover: { threshold: hoverThreshold },
    transition: transitionMs,
  } : undefined

  const addStop = useCallback(() => {
    if (colorStops.length >= 5) return
    setColorStops([...colorStops, '#ffffff'])
  }, [colorStops])

  const removeStop = useCallback((index: number) => {
    if (colorStops.length <= 2) return
    setColorStops(colorStops.filter((_, i) => i !== index))
  }, [colorStops])

  const updateStop = useCallback((index: number, color: string) => {
    setColorStops(colorStops.map((c, i) => i === index ? color : c))
  }, [colorStops])

  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <Badge color={T.brand.green} />
        Control Panel
      </h2>
      <p style={sectionDescStyle}>
        full parameter control -- every DitherBox prop in one place
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: '24px',
        border: `1px solid ${T.edge.muted}`,
        borderRadius: '4px',
        boxShadow: T.shadow.card,
        overflow: 'hidden',
      }}>
        {/* Controls */}
        <div style={{
          padding: '20px',
          background: T.surface.elevated,
          overflowY: 'auto',
          maxHeight: '520px',
        }}>
          {/* Dithering */}
          <h3 style={{
            fontFamily: T.font.heading,
            fontSize: '11px',
            color: T.brand.sunYellow,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '12px',
          }}>
            Dithering
          </h3>
          <CPSelect label="Algorithm" value={algorithm} onChange={setAlgorithm} options={ALGORITHM_OPTIONS} />
          <CPSlider label="Threshold" value={threshold} onChange={setThreshold} />
          <CPSlider label="Pixel Scale" value={pixelScale} onChange={setPixelScale} min={1} max={8} step={1} />
          <CPSlider label="Glitch" value={glitch} onChange={setGlitch} min={0} max={3} step={0.1} />
          <CPSelect label="Mode" value={mode} onChange={setMode} options={MODE_OPTIONS} />
          {mode === 'mask' && (
            <CPSelect label="Subject" value={maskSubject} onChange={setMaskSubject} options={MASK_SUBJECT_OPTIONS} />
          )}

          {/* Gradient */}
          <h3 style={{
            fontFamily: T.font.heading,
            fontSize: '11px',
            color: T.brand.skyBlue,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginTop: '20px',
            marginBottom: '12px',
          }}>
            Gradient
          </h3>
          <CPSelect label="Type" value={gradientType} onChange={setGradientType} options={GRADIENT_TYPE_OPTIONS} />

          {/* Color stops */}
          <label style={cpLabelStyle}>Color Stops</label>
          {colorStops.map((color, i) => (
            <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
              <input
                type="color"
                value={color}
                onChange={(e) => updateStop(i, e.target.value)}
                style={{ width: '32px', height: '28px', border: 'none', cursor: 'pointer', flexShrink: 0 }}
              />
              <input
                type="text"
                value={color}
                onChange={(e) => updateStop(i, e.target.value)}
                style={{ ...cpInputStyle, flex: 1 }}
              />
              {colorStops.length > 2 && (
                <button
                  onClick={() => removeStop(i)}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${T.edge.muted}`,
                    color: T.brand.sunRed,
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontFamily: T.font.code,
                    fontSize: '10px',
                    padding: '4px 6px',
                    flexShrink: 0,
                  }}
                >
                  x
                </button>
              )}
            </div>
          ))}
          {colorStops.length < 5 && (
            <button
              onClick={addStop}
              style={{
                width: '100%',
                padding: '6px',
                background: 'transparent',
                border: `1px dashed ${T.edge.muted}`,
                color: T.content.muted,
                borderRadius: '3px',
                cursor: 'pointer',
                fontFamily: T.font.code,
                fontSize: '10px',
                marginBottom: '10px',
              }}
            >
              + add stop
            </button>
          )}

          {needsAngle && (
            <CPSlider label="Angle" value={angle} onChange={setAngle} min={0} max={360} step={1} />
          )}
          {needsCenter && (
            <>
              <CPSlider label="Center X" value={centerX} onChange={setCenterX} />
              <CPSlider label="Center Y" value={centerY} onChange={setCenterY} />
            </>
          )}
          {needsRadius && (
            <CPSlider label="Radius" value={radius} onChange={setRadius} min={0.1} max={1.5} />
          )}
          {needsStartAngle && (
            <CPSlider label="Start Angle" value={startAngle} onChange={setStartAngle} min={0} max={360} step={1} />
          )}

          {/* Animation */}
          <h3 style={{
            fontFamily: T.font.heading,
            fontSize: '11px',
            color: T.brand.sunsetFuzz,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginTop: '20px',
            marginBottom: '12px',
          }}>
            Animation
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <input
              type="checkbox"
              checked={animateEnabled}
              onChange={(e) => setAnimateEnabled(e.target.checked)}
              style={{ accentColor: T.brand.sunsetFuzz }}
            />
            <label style={{ ...cpLabelStyle, margin: 0 }}>Enable hover animation</label>
          </div>
          {animateEnabled && (
            <>
              <CPSlider label="Hover Threshold" value={hoverThreshold} onChange={setHoverThreshold} />
              <CPSlider label="Transition (ms)" value={transitionMs} onChange={setTransitionMs} min={50} max={1000} step={50} />
            </>
          )}
        </div>

        {/* Preview */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: T.surface.muted,
          minHeight: '320px',
          padding: '24px',
        }}>
          <DitherBox
            gradient={mode === 'mask'
              ? { ...gradient, stops: [{ color: '#000000', position: 0 }, { color: '#ffffff', position: 1 }] }
              : gradient
            }
            algorithm={algorithm}
            pixelScale={pixelScale}
            threshold={threshold}
            mode={mode}
            glitch={glitch}
            animate={animateConfig}
            style={{
              width: '100%',
              height: '280px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              position: 'relative',
              overflow: 'hidden',
              cursor: animateEnabled ? 'pointer' : undefined,
              ...(mode === 'mask' && { background: getMaskSubjectBackground(maskSubject) }),
            }}
          >
            {mode === 'mask' ? (
              <MaskSubjectContent subject={maskSubject} />
            ) : (
              <span style={{
                fontFamily: T.font.code,
                fontSize: '14px',
                fontWeight: 600,
                color: T.content.heading,
                textShadow: '0 1px 4px rgba(0,0,0,0.9)',
              }}>
                {gradientType} / {algorithm} / {mode}
              </span>
            )}
          </DitherBox>
        </div>
      </div>
      <div style={dividerStyle} />
    </section>
  )
}
