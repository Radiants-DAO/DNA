import { DitherBox } from '@rdna/dithwather-react'
import type { OrderedAlgorithm, DitherMode, DitherGradientType } from '@rdna/dithwather-react'
import { T } from '../tokens'
import { Badge, sectionStyle, sectionHeadingStyle, sectionDescStyle, cellLabelStyle, dividerStyle, cardStyle, cardLabelStyle } from '../shared'

// ============================================================================
// Bayer Gradient Pipeline
// ============================================================================

const BAYER_ALGORITHMS: OrderedAlgorithm[] = ['bayer2x2', 'bayer4x4', 'bayer8x8']
const MODES: DitherMode[] = ['background', 'mask', 'full']

function BayerGradientGrid() {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <Badge color={T.brand.sunYellow} />
        Bayer Gradient Pipeline
      </h2>
      <p style={sectionDescStyle}>
        3 algorithms x 3 modes -- per-pixel bayer comparison with zero canvas work
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {BAYER_ALGORITHMS.map((algo) =>
          MODES.map((mode) => (
            <div key={`${algo}-${mode}`}>
              <DitherBox
                colors={[T.surface.primary, T.brand.sunYellow]}
                algorithm={algo}
                threshold={0.475}
                pixelScale={3}
                mode={mode}
                className="dither-card"
                style={cardStyle}
              >
                <span style={{ ...cardLabelStyle, color: T.brand.sunYellow }}>
                  {algo}
                </span>
              </DitherBox>
              <p style={cellLabelStyle}>{mode}</p>
            </div>
          ))
        )}
      </div>
      <div style={dividerStyle} />
    </section>
  )
}

// ============================================================================
// Gradient Types
// ============================================================================

function GradientTypesRow() {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <Badge color={T.brand.skyBlue} />
        Gradient Types
      </h2>
      <p style={sectionDescStyle}>
        5 gradient distance functions -- linear, radial, conic, diamond, reflected
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        {(['linear', 'radial', 'conic', 'diamond', 'reflected'] as const).map((type) => (
          <div key={type}>
            <DitherBox
              gradient={type}
              colors={[T.surface.primary, T.brand.skyBlue]}
              algorithm="bayer8x8"
              pixelScale={2}
              className="dither-card"
              style={cardStyle}
            >
              <span style={{ ...cardLabelStyle, color: T.brand.skyBlue }}>
                {type}
              </span>
            </DitherBox>
            <p style={cellLabelStyle}>bayer8x8</p>
          </div>
        ))}
      </div>
      <div style={dividerStyle} />
    </section>
  )
}

// ============================================================================
// Multi-Stop & Custom Gradients
// ============================================================================

function AdvancedGradients() {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <Badge color={T.brand.sunRed} />
        Multi-Stop & Custom Gradients
      </h2>
      <p style={sectionDescStyle}>
        multi-stop gradients, off-center radial, color wheel conic
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {/* 3-stop linear sunrise */}
        <div>
          <DitherBox
            gradient={{
              type: 'linear',
              stops: [
                { color: '#1a0a2e', position: 0 },
                { color: T.brand.sunRed, position: 0.5 },
                { color: T.brand.sunYellow, position: 1 },
              ],
            }}
            algorithm="bayer8x8"
            pixelScale={2}
            className="dither-card"
            style={cardStyle}
          >
            <span style={{ ...cardLabelStyle, color: T.brand.sunYellow }}>
              sunrise
            </span>
          </DitherBox>
          <p style={cellLabelStyle}>linear / 3 stops</p>
        </div>

        {/* Off-center radial */}
        <div>
          <DitherBox
            gradient={{
              type: 'radial',
              stops: [
                { color: T.surface.primary, position: 0 },
                { color: T.brand.skyBlue, position: 1 },
              ],
              center: [0.25, 0.25],
              radius: 0.8,
            }}
            algorithm="bayer4x4"
            pixelScale={2}
            className="dither-card"
            style={cardStyle}
          >
            <span style={{ ...cardLabelStyle, color: T.brand.skyBlue }}>
              off-center
            </span>
          </DitherBox>
          <p style={cellLabelStyle}>radial / center [.25, .25]</p>
        </div>

        {/* Color wheel conic */}
        <div>
          <DitherBox
            gradient={{
              type: 'conic',
              stops: [
                { color: T.brand.sunRed, position: 0 },
                { color: T.brand.sunYellow, position: 0.25 },
                { color: T.brand.green, position: 0.5 },
                { color: T.brand.skyBlue, position: 0.75 },
                { color: T.brand.sunRed, position: 1 },
              ],
            }}
            algorithm="bayer8x8"
            pixelScale={2}
            className="dither-card"
            style={cardStyle}
          >
            <span style={{ ...cardLabelStyle, color: T.content.heading }}>
              color wheel
            </span>
          </DitherBox>
          <p style={cellLabelStyle}>conic / 5 stops</p>
        </div>
      </div>
      <div style={dividerStyle} />
    </section>
  )
}

// ============================================================================
// Palette Grid
// ============================================================================

const PALETTES: { name: string; colors: string[]; type?: DitherGradientType }[] = [
  { name: 'Sunset', colors: ['#1a0a2e', '#e94560', '#fca311'] },
  { name: 'Ocean', colors: ['#0d1b2a', '#1b4965', '#95BAD2'] },
  { name: 'Forest', colors: ['#1b2d1b', '#4a7c59', '#CEF5CA'] },
  { name: 'Ember', colors: ['#1a0000', '#FF6B63', '#FCC383'] },
  { name: 'Neon', colors: ['#0a0a0a', '#ff006e', '#00f5d4'] },
  { name: 'Cream', colors: ['#0F0E0C', '#3D2E1A', '#FEF8E2'] },
  { name: 'Arctic', colors: ['#0d1b2a', '#778da9', '#e0e1dd'] },
  { name: 'Berry', colors: ['#2d0036', '#9b2335', '#ff6b9d'] },
  { name: 'Gold', colors: ['#1a1200', '#b8860b', '#FCE184'] },
  { name: 'Midnight', colors: ['#020024', '#090979', '#95BAD2'] },
  { name: 'Earth', colors: ['#2c1810', '#8b5e3c', '#d4a574'] },
  { name: 'Vapor', colors: ['#1a0033', '#ff71ce', '#01cdfe'], type: 'reflected' },
]

function PaletteGrid() {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <Badge color={T.brand.sunYellow} />
        Palette Grid
      </h2>
      <p style={sectionDescStyle}>12 curated color palettes. Each one a starting point for your own design.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {PALETTES.map(p => (
          <DitherBox
            key={p.name}
            colors={p.colors}
            gradient={p.type ?? 'linear'}
            angle={135}
            algorithm="bayer8x8"
            pixelScale={2}
            className="dither-card"
            style={{ ...cardStyle, height: 80 }}
          >
            <span style={{ ...cardLabelStyle, fontSize: 10 }}>{p.name}</span>
          </DitherBox>
        ))}
      </div>
    </section>
  )
}

// ============================================================================
// Pixel Scale Explorer
// ============================================================================

function PixelScaleExplorer() {
  const scales = [1, 2, 4, 8]
  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <Badge color={T.brand.sunYellow} />
        Pixel Scale
      </h2>
      <p style={sectionDescStyle}>Same gradient at different pixel scales. Larger = chunkier pattern.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {scales.map(s => (
          <div key={s}>
            <DitherBox
              colors={['#0d1b2a', '#FCE184']}
              gradient="radial"
              algorithm="bayer8x8"
              pixelScale={s}
              className="dither-card"
              style={{ ...cardStyle, height: 140 }}
            >
              <span style={cardLabelStyle}>{s}x</span>
            </DitherBox>
            <p style={cellLabelStyle}>{s === 1 ? '1px (crisp)' : `${s}px blocks`}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ============================================================================
// Gallery Section (default export)
// ============================================================================

export default function Gallery() {
  return (
    <>
      <GradientTypesRow />
      <BayerGradientGrid />
      <PaletteGrid />
      <PixelScaleExplorer />
      <AdvancedGradients />
    </>
  )
}
