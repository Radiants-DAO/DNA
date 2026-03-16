import { DitherBox } from '@rdna/dithwather-react'
import { T } from '../tokens'
import { Badge, sectionStyle, sectionHeadingStyle, sectionDescStyle, cellLabelStyle, cardStyle, cardLabelStyle } from '../shared'

// ============================================================================
// Recipes Section (default export)
// ============================================================================

export default function Recipes() {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <Badge color={T.brand.sunsetFuzz} />
        Recipes
      </h2>
      <p style={sectionDescStyle}>Copy-paste patterns for common use cases. Hover to interact.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>

        {/* Recipe 1: Image Reveal */}
        <div>
          <DitherBox
            colors={['#000000', '#ffffff']}
            gradient="radial"
            algorithm="bayer8x8"
            pixelScale={2}
            mode="mask"
            animate={{
              idle: { threshold: 0 },
              hover: { threshold: 1 },
              transition: 600,
            }}
            className="dither-interactive--sun"
            style={{
              height: 200,
              borderRadius: 8,
              overflow: 'hidden',
              cursor: 'pointer',
              background: `linear-gradient(135deg, #e94560, #fca311, #00f5d4)`,
            }}
          >
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ ...cardLabelStyle, fontSize: 16 }}>Image Reveal</span>
            </div>
          </DitherBox>
          <p style={cellLabelStyle}>mode=&quot;mask&quot; + animate</p>
        </div>

        {/* Recipe 2: Animated Background */}
        <div>
          <DitherBox
            colors={['#0d1b2a', '#FCE184', '#e94560']}
            gradient="conic"
            algorithm="bayer8x8"
            pixelScale={2}
            animate={{
              idle: { threshold: 0.4 },
              hover: { threshold: 0.6 },
              transition: 300,
            }}
            className="dither-interactive--sunset"
            style={{
              ...cardStyle,
              height: 200,
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            <span style={cardLabelStyle}>Animated BG</span>
          </DitherBox>
          <p style={cellLabelStyle}>conic + hover threshold</p>
        </div>

        {/* Recipe 3: Dithered Border */}
        <div>
          <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
            <DitherBox
              colors={['#000000', '#FCE184']}
              algorithm="bayer4x4"
              pixelScale={2}
              threshold={0.5}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 8,
              }}
            />
            <div style={{
              position: 'relative',
              margin: 4,
              background: T.surface.primary,
              borderRadius: 6,
              padding: 24,
              height: 168,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ ...cardLabelStyle, fontSize: 16 }}>Dithered Border</span>
              <span style={{ fontFamily: T.font.body, fontSize: 12, color: T.content.muted }}>
                DitherBox as a frame
              </span>
            </div>
          </div>
          <p style={cellLabelStyle}>absolute positioned frame</p>
        </div>

        {/* Recipe 4: Text Mask */}
        <div>
          <DitherBox
            colors={['#000000', '#ffffff']}
            algorithm="bayer8x8"
            pixelScale={2}
            mode="mask"
            animate={{
              idle: { threshold: 0.55 },
              hover: { threshold: 0.45 },
              transition: 400,
            }}
            className="dither-interactive--sky"
            style={{
              height: 200,
              borderRadius: 8,
              background: `linear-gradient(90deg, ${T.brand.skyBlue}, ${T.brand.green})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <span style={{
              fontFamily: T.font.heading,
              fontSize: 48,
              color: T.content.heading,
              textTransform: 'uppercase',
              textShadow: '2px 2px 0 rgba(0,0,0,0.3)',
            }}>
              Hello
            </span>
          </DitherBox>
          <p style={cellLabelStyle}>text through mask</p>
        </div>
      </div>
    </section>
  )
}
