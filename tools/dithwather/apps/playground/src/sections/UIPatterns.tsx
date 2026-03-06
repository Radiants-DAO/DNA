import { useState, useRef, useCallback } from 'react'
import { DitherBox, DitherButton, DitherSkeleton } from '@dithwather/react'
import { mixHex } from '@dithwather/core'
import { T } from '../tokens'
import { Badge, CPSlider, CPSelect, sectionStyle, sectionHeadingStyle, sectionDescStyle, cellLabelStyle, dividerStyle, cardStyle, cardLabelStyle } from '../shared'

// ============================================================================
// Hero Section
// ============================================================================

function HeroDemo() {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <Badge color={T.brand.skyBlue} />
        Hero Section
      </h2>
      <p style={sectionDescStyle}>Full-width dithered gradient behind content. The most common use case.</p>
      <DitherBox
        gradient={{
          type: 'radial',
          stops: [
            { color: '#1a0a2e', position: 0 },
            { color: '#e94560', position: 0.6 },
            { color: '#0F0E0C', position: 1 },
          ],
          center: [0.35, 0.5],
          radius: 1.6,
        }}
        algorithm="bayer8x8"
        pixelScale={2}
        style={{
          borderRadius: 8,
          padding: '64px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          border: `1px solid ${T.edge.muted}`,
        }}
      >
        <h3 style={{
          fontFamily: T.font.heading,
          fontSize: 32,
          color: T.content.heading,
          margin: 0,
          textShadow: '2px 2px 0 rgba(0,0,0,0.5)',
          textTransform: 'uppercase',
          position: 'relative',
          zIndex: 3,
        }}>
          Your Product
        </h3>
        <p style={{
          fontFamily: T.font.body,
          fontSize: 16,
          color: T.content.primary,
          margin: 0,
          maxWidth: 400,
          lineHeight: 1.5,
          position: 'relative',
          zIndex: 3,
        }}>
          A dithered gradient hero makes any landing page feel crafted and intentional.
        </p>
        <DitherButton
          colors={['#e94560', '#fca311']}
          algorithm="bayer4x4"
          pixelScale={2}
          className="dither-btn dither-btn--yellow"
          buttonStyle={{
            fontFamily: T.font.heading,
            fontSize: 12,
            textTransform: 'uppercase',
            color: T.content.heading,
            padding: '10px 20px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Get Started
        </DitherButton>
      </DitherBox>
    </section>
  )
}

// ============================================================================
// Mask Reveal
// ============================================================================

const maskRevealCard: React.CSSProperties = {
  width: '100%',
  height: '200px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '4px',
  border: `1px solid ${T.edge.muted}`,
  boxShadow: T.shadow.card,
  cursor: 'pointer',
  overflow: 'hidden',
}

function MaskRevealDemo() {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <Badge color={T.brand.green} />
        Mask Reveal
      </h2>
      <p style={sectionDescStyle}>
        mode="mask" as a hover transition -- dither pattern uncovers content underneath
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {/* 1. Gradient background reveal */}
        <div>
          <DitherBox
            colors={['#000000', '#ffffff']}
            algorithm="bayer8x8"
            pixelScale={2}
            mode="mask"
            animate={{
              idle: { threshold: 0 },
              hover: { threshold: 1 },
              transition: 500,
            }}
            className="dither-interactive"
            style={{
              ...maskRevealCard,
              background: `linear-gradient(135deg, ${T.brand.sunRed}, ${T.brand.sunYellow}, ${T.brand.green})`,
            }}
          >
            <span style={{
              fontFamily: T.font.heading,
              fontSize: '14px',
              fontWeight: 700,
              color: T.surface.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              gradient reveal
            </span>
          </DitherBox>
          <p style={cellLabelStyle}>hover to reveal / bayer8x8</p>
        </div>

        {/* 2. UI card reveal */}
        <div>
          <DitherBox
            gradient="radial"
            colors={['#000000', '#ffffff']}
            algorithm="bayer4x4"
            pixelScale={3}
            mode="mask"
            animate={{
              idle: { threshold: 0 },
              hover: { threshold: 1 },
              transition: 400,
            }}
            className="dither-interactive"
            style={{
              ...maskRevealCard,
              background: T.surface.elevated,
            }}
          >
            <div style={{
              textAlign: 'center',
              padding: '16px',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${T.brand.skyBlue}, ${T.brand.green})`,
                margin: '0 auto 12px',
              }} />
              <div style={{
                fontFamily: T.font.heading,
                fontSize: '12px',
                color: T.content.heading,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '4px',
              }}>
                user profile
              </div>
              <div style={{
                fontFamily: T.font.code,
                fontSize: '10px',
                color: T.content.muted,
              }}>
                dither-masked card component
              </div>
            </div>
          </DitherBox>
          <p style={cellLabelStyle}>radial mask / ui card</p>
        </div>

        {/* 3. Diamond wipe reveal */}
        <div>
          <DitherBox
            gradient="diamond"
            colors={['#000000', '#ffffff']}
            algorithm="bayer4x4"
            pixelScale={2}
            mode="mask"
            animate={{
              idle: { threshold: 0 },
              hover: { threshold: 1 },
              transition: 600,
            }}
            className="dither-interactive"
            style={{
              ...maskRevealCard,
              background: `conic-gradient(from 45deg, ${T.brand.sunYellow}, ${T.brand.sunsetFuzz}, ${T.brand.sunRed}, ${T.brand.skyBlue}, ${T.brand.sunYellow})`,
            }}
          >
            <span style={{
              fontFamily: T.font.heading,
              fontSize: '14px',
              fontWeight: 700,
              color: T.surface.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              diamond wipe
            </span>
          </DitherBox>
          <p style={cellLabelStyle}>diamond gradient / center out</p>
        </div>
      </div>
      <div style={dividerStyle} />
    </section>
  )
}

// ============================================================================
// Animation States
// ============================================================================

function AnimationStates() {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <Badge color={T.brand.sunsetFuzz} />
        Animation States
      </h2>
      <p style={sectionDescStyle}>
        idle / hover / focus / active -- state priority with animated threshold transitions
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        {/* Hover only */}
        <div>
          <DitherBox
            colors={[T.surface.primary, T.brand.sunYellow]}
            algorithm="bayer8x8"
            threshold={0.4}
            pixelScale={2}
            animate={{
              idle: { threshold: 0.4 },
              hover: { threshold: 0.6 },
              transition: 300,
            }}
            className="dither-interactive dither-interactive--sun"
            style={{ ...cardStyle, height: '160px', cursor: 'pointer' }}
          >
            <span style={{ ...cardLabelStyle, color: T.brand.sunYellow }}>
              hover me
            </span>
          </DitherBox>
          <p style={cellLabelStyle}>hover: threshold 0.4 → 0.6</p>
        </div>

        {/* Focus + hover (with focusable child) */}
        <div>
          <DitherBox
            gradient="radial"
            colors={[T.surface.primary, T.brand.green]}
            algorithm="bayer4x4"
            pixelScale={3}
            animate={{
              idle: { threshold: 0.375 },
              hover: { threshold: 0.475 },
              focus: { threshold: 0.575 },
              active: { threshold: 0.675 },
              transition: 200,
            }}
            className="dither-interactive dither-interactive--green"
            style={{ ...cardStyle, height: '160px', cursor: 'pointer' }}
          >
            <button
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: T.font.code,
                fontSize: '12px',
                fontWeight: 600,
                color: T.brand.green,
                textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                padding: '8px 16px',
              }}
            >
              tab / hover / click
            </button>
          </DitherBox>
          <p style={cellLabelStyle}>all 4 states / priority: active {'>'} focus {'>'} hover</p>
        </div>

        {/* Gradient hover animation */}
        <div>
          <DitherBox
            gradient="radial"
            colors={[T.surface.primary, T.brand.sunsetFuzz]}
            algorithm="bayer4x4"
            threshold={0.4}
            pixelScale={2}
            animate={{
              idle: { threshold: 0.4 },
              hover: { threshold: 0.6 },
              transition: 300,
            }}
            className="dither-interactive dither-interactive--sunset"
            style={{ ...cardStyle, height: '160px', cursor: 'pointer' }}
          >
            <span style={{ ...cardLabelStyle, color: T.brand.sunsetFuzz }}>
              radial hover
            </span>
          </DitherBox>
          <p style={cellLabelStyle}>gradient pipeline / sunset-fuzz</p>
        </div>
      </div>
      <div style={dividerStyle} />
    </section>
  )
}

// ============================================================================
// Loading Skeleton (direct canvas, animated gradient pulse)
// ============================================================================

type GradientType = 'linear' | 'radial' | 'diamond' | 'reflected'

function LoadingSkeletonDemo() {
  // Controls
  const [bandWidth, setBandWidth] = useState(0.25)
  const [speed, setSpeed] = useState(2500)
  const [opacity, setOpacity] = useState(0.2)
  const [gradType, setGradType] = useState<GradientType>('linear')
  const [angle, setAngle] = useState(90)
  const [pixelScale, setPixelScale] = useState(3)
  const [wrap, setWrap] = useState(true)
  const [blend, setBlend] = useState(true)
  const [bandStops, setBandStops] = useState(['#ffffff'])
  const [bgColor, setBgColor] = useState<string>(T.surface.primary)
  const [colorOpacity, setColorOpacity] = useState(1)
  const [borderColor, setBorderColor] = useState('#ffffff')
  const [borderOpacity, setBorderOpacity] = useState(0.08)
  const [algorithm, setAlgorithm] = useState<'bayer2x2' | 'bayer4x4' | 'bayer8x8'>('bayer4x4')
  const [easing, setEasing] = useState<'linear' | 'ease-out' | 'ease-in-out'>('linear')

  // Pre-blend band colors for colorOpacity control
  const blendedColors = colorOpacity < 1
    ? bandStops.map(c => mixHex(bgColor, c, colorOpacity))
    : bandStops

  const skeletonProps = {
    speed,
    bandWidth,
    opacity,
    gradient: gradType as GradientType,
    angle,
    pixelScale,
    wrap,
    blend,
    color: blendedColors,
    bgColor,
    colorOpacity: 1, // already pre-blended
    algorithm,
    easing,
    borderColor,
    borderOpacity,
  }

  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <Badge color={T.brand.skyBlue} />
        Loading Skeleton
      </h2>
      <p style={sectionDescStyle}>Pulsing dither as a loading placeholder. Replaces boring shimmer effects.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>
        {/* Controls */}
        <div style={{ padding: 16, background: T.surface.elevated, borderRadius: 6, border: `1px solid ${T.edge.muted}`, maxHeight: 600, overflowY: 'auto' }}>
          <CPSelect label="Gradient" value={gradType} onChange={setGradType} options={[
            { value: 'linear', label: 'Linear' },
            { value: 'radial', label: 'Radial' },
            { value: 'diamond', label: 'Diamond' },
            { value: 'reflected', label: 'Reflected' },
          ]} />
          <CPSelect label="Algorithm" value={algorithm} onChange={setAlgorithm} options={[
            { value: 'bayer2x2', label: 'Bayer 2x2' },
            { value: 'bayer4x4', label: 'Bayer 4x4' },
            { value: 'bayer8x8', label: 'Bayer 8x8' },
          ]} />
          <CPSelect label="Easing" value={easing} onChange={setEasing} options={[
            { value: 'linear', label: 'Linear' },
            { value: 'ease-out', label: 'Ease Out' },
            { value: 'ease-in-out', label: 'Ease In-Out' },
          ]} />
          <CPSlider label="Band Width" value={bandWidth} onChange={setBandWidth} min={0.05} max={0.5} step={0.01} />
          <CPSlider label="Speed (ms)" value={speed} onChange={setSpeed} min={500} max={5000} step={100} />
          <CPSlider label="Canvas Opacity" value={opacity} onChange={setOpacity} min={0.05} max={1} step={0.05} />
          <CPSlider label="Color Opacity" value={colorOpacity} onChange={setColorOpacity} min={0.05} max={1} step={0.05} />
          <CPSlider label="Angle" value={angle} onChange={setAngle} min={0} max={360} step={1} />
          <CPSlider label="Pixel Scale" value={pixelScale} onChange={setPixelScale} min={1} max={6} step={1} />

          {/* Gradient Stops */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ fontFamily: T.font.code, fontSize: 9, color: T.content.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Band Stops</label>
              {bandStops.length < 4 && (
                <button
                  onClick={() => setBandStops([...bandStops, '#ffffff'])}
                  style={{ background: 'none', border: `1px solid ${T.edge.muted}`, borderRadius: 2, color: T.content.muted, fontFamily: T.font.code, fontSize: 9, padding: '1px 5px', cursor: 'pointer' }}
                >+</button>
              )}
            </div>
            {bandStops.map((color, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const next = [...bandStops]
                    next[i] = e.target.value
                    setBandStops(next)
                  }}
                  style={{ width: '100%', height: 20, border: 'none', cursor: 'pointer', background: 'none', flex: 1 }}
                />
                {bandStops.length > 1 && (
                  <button
                    onClick={() => setBandStops(bandStops.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: `1px solid ${T.edge.muted}`, borderRadius: 2, color: T.content.muted, fontFamily: T.font.code, fontSize: 9, padding: '1px 4px', cursor: 'pointer', flexShrink: 0 }}
                  >x</button>
                )}
              </div>
            ))}
          </div>

          {/* BG Color */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <label style={{ fontFamily: T.font.code, fontSize: 9, color: T.content.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>BG Color</label>
            </div>
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ width: '100%', height: 24, border: 'none', cursor: 'pointer', background: 'none' }} />
          </div>

          {/* Border */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <label style={{ fontFamily: T.font.code, fontSize: 9, color: T.content.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Border Color</label>
            </div>
            <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} style={{ width: '100%', height: 24, border: 'none', cursor: 'pointer', background: 'none' }} />
          </div>
          <CPSlider label="Border Opacity" value={borderOpacity} onChange={setBorderOpacity} min={0} max={0.5} step={0.01} />

          {/* Toggles */}
          {[
            { label: 'Wrap', checked: wrap, onChange: setWrap },
            { label: 'Blend Edges', checked: blend, onChange: setBlend },
          ].map(({ label, checked, onChange }) => (
            <div key={label} style={{ marginBottom: 6 }}>
              <label style={{
                fontFamily: T.font.code, fontSize: 9, color: T.content.muted,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              }}>
                <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: T.brand.sunYellow }} />
                {label}
              </label>
            </div>
          ))}
        </div>
        {/* Skeleton preview */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <DitherSkeleton {...skeletonProps} height={120} borderRadius={6} />
            <DitherSkeleton {...skeletonProps} height={16} borderRadius={4} width="70%" />
            <DitherSkeleton {...skeletonProps} height={16} borderRadius={4} width="50%" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[100, 95, 80, 100, 60].map((w, i) => (
              <DitherSkeleton key={i} {...skeletonProps} height={12} borderRadius={3} width={`${w}%`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// Theme Toggle (direct canvas mask, animated diamond wipe)
// ============================================================================

function DarkLightToggle() {
  const [isDark, setIsDark] = useState(true)
  const [threshold, setThreshold] = useState(1)
  const animRef = useRef(0)
  const thresholdRef = useRef(1)

  const toggle = useCallback(() => {
    setIsDark(prev => {
      const newDark = !prev
      const from = thresholdRef.current
      const to = newDark ? 1 : 0
      const duration = 600
      const start = performance.now()

      cancelAnimationFrame(animRef.current)
      const animate = (time: number) => {
        const progress = Math.min((time - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        const current = from + (to - from) * eased
        thresholdRef.current = current
        setThreshold(current)
        if (progress < 1) animRef.current = requestAnimationFrame(animate)
      }
      animRef.current = requestAnimationFrame(animate)
      return newDark
    })
  }, [])

  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <Badge color={T.brand.skyBlue} />
        Theme Toggle
      </h2>
      <p style={sectionDescStyle}>Click to toggle. The dither mask wipes between dark and light.</p>
      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', height: 200 }}>
        {/* Light layer */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: '#f5f0e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}>
          <span style={{ fontFamily: T.font.heading, fontSize: 20, color: '#1a1a1a', textTransform: 'uppercase' }}>
            Light Mode
          </span>
        </div>

        {/* Dark layer with DitherBox mask */}
        <DitherBox
          gradient="diamond"
          colors={['#ffffff', '#000000']}
          algorithm="bayer4x4"
          pixelScale={3}
          mode="mask"
          threshold={threshold}
          style={{
            position: 'absolute',
            inset: 0,
            background: T.surface.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontFamily: T.font.heading, fontSize: 20, color: T.content.heading, textTransform: 'uppercase' }}>
            Dark Mode
          </span>
        </DitherBox>

        {/* Toggle button */}
        <button
          onClick={toggle}
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            zIndex: 10,
            fontFamily: T.font.code,
            fontSize: 11,
            textTransform: 'uppercase',
            padding: '6px 12px',
            background: isDark ? T.surface.elevated : '#e0dcd4',
            color: isDark ? T.content.primary : '#1a1a1a',
            border: `1px solid ${isDark ? T.edge.muted : '#ccc'}`,
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Toggle
        </button>
      </div>
    </section>
  )
}

// ============================================================================
// Buttons
// ============================================================================

const btnBase: React.CSSProperties = {
  fontFamily: T.font.heading,
  fontSize: '12px',
  fontWeight: 700,
  color: T.content.heading,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  padding: '12px 24px',
  border: `1px solid ${T.edge.muted}`,
  borderRadius: '4px',
  boxShadow: T.shadow.btn,
}

function ButtonShowcase() {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <Badge color={T.brand.sunYellow} />
        Buttons
      </h2>
      <p style={sectionDescStyle}>
        DitherButton with default hover/active animations
      </p>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <DitherButton
          colors={[T.surface.primary, T.brand.green]}
          algorithm="bayer2x2"
          pixelScale={4}
          className="dither-btn dither-btn--green"
          buttonStyle={btnBase}
        >
          Bayer 2x2
        </DitherButton>
        <DitherButton
          colors={[T.surface.primary, T.brand.skyBlue]}
          algorithm="bayer4x4"
          pixelScale={3}
          className="dither-btn dither-btn--sky"
          buttonStyle={btnBase}
        >
          Bayer 4x4
        </DitherButton>
        <DitherButton
          colors={[T.surface.primary, T.brand.sunRed]}
          algorithm="bayer8x8"
          pixelScale={2}
          className="dither-btn dither-btn--red"
          buttonStyle={btnBase}
        >
          Bayer 8x8
        </DitherButton>
        <DitherButton
          gradient="linear"
          colors={[T.surface.primary, T.brand.sunYellow]}
          angle={90}
          algorithm="bayer4x4"
          pixelScale={2}
          className="dither-btn dither-btn--yellow"
          buttonStyle={btnBase}
        >
          Gradient
        </DitherButton>
      </div>
    </section>
  )
}

// ============================================================================
// UI Patterns Section (default export)
// ============================================================================

export default function UIPatterns() {
  return (
    <>
      <HeroDemo />
      <MaskRevealDemo />
      <LoadingSkeletonDemo />
      <DarkLightToggle />
      <AnimationStates />
      <ButtonShowcase />
    </>
  )
}
