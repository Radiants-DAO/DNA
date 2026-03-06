# Playground Showcase Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reorganize the playground into 4 showcase sections (UI Patterns, Interactive Toys, Visual Gallery, Recipes) with ~16 demos, plus a click-to-pulse radial dither effect.

**Architecture:** All demos live in `apps/playground/src/App.tsx` as section components following the existing pattern: design tokens from `T`, inline styles, CSS classes for interaction states. Interactive demos (mouse tracker, click pulse, scroll reveal) use local state + event handlers + DitherBox props — no new library code needed. The click pulse uses a standalone `<canvas>` rendered via `renderGradientDither` with its own rAF loop.

**Tech Stack:** React 18, @dithwather/react (DitherBox, DitherButton), @dithwather/core (renderGradientDither for the pulse canvas), Vite 6

---

## Existing Patterns Reference

Before any task, know these conventions from the current `App.tsx`:

- **Design tokens:** `const T = { surface: {primary, elevated, muted, tertiary}, content: {heading, primary, muted}, edge: {primary, muted, focus}, action: {primary, accent}, brand: {sunYellow, skyBlue, sunsetFuzz, sunRed, green}, font: {heading, body, code}, shadow: {card, btn, btnHover} }`
- **Shared styles:** `sectionStyle`, `sectionHeadingStyle`, `sectionDescStyle`, `cellLabelStyle`, `dividerStyle`, `cardStyle`, `cardLabelStyle` — all `React.CSSProperties` objects defined near the top of the file
- **Section component pattern:** Each demo is a function component that returns a `<section style={sectionStyle}>` with an `<h2 style={sectionHeadingStyle}>` and content below
- **Badge pattern:** Each section heading has a tiny 8x8 colored square: `<span style={{ width: 8, height: 8, borderRadius: 2, background: T.brand.someColor }} />`
- **Grid layouts:** `display: 'grid'`, `gridTemplateColumns: 'repeat(N, 1fr)'`, `gap: '16px'`
- **DitherBox card pattern:** `<DitherBox colors={[...]} algorithm="bayer4x4" pixelScale={2} className="dither-card" style={cardStyle}><span style={cardLabelStyle}>Label</span></DitherBox>`
- **Container:** `maxWidth: 960px`, centered, `padding: '48px 24px'`
- **CSS classes:** `.dither-card` (border hover), `.dither-interactive--{color}` (glow hover), `.dither-btn--{color}` (button variants)

---

## Task 1: Restructure App.tsx — Section Wrapper + Navigation

Reorganize the file into 4 sections with a sticky nav. Existing demos stay where they are (renamed/regrouped in later tasks).

**Files:**
- Modify: `apps/playground/src/App.tsx`
- Modify: `apps/playground/src/styles.css`

**Step 1: Add section wrapper and navigation components**

At the top of App.tsx (after shared styles, before demo components), add:

```tsx
// Section IDs for navigation
const SECTIONS = [
  { id: 'gallery', label: 'Gallery', color: T.brand.sunYellow },
  { id: 'ui-patterns', label: 'UI Patterns', color: T.brand.skyBlue },
  { id: 'interactive', label: 'Interactive', color: T.brand.green },
  { id: 'recipes', label: 'Recipes', color: T.brand.sunsetFuzz },
  { id: 'sandbox', label: 'Sandbox', color: T.brand.sunRed },
] as const

function SectionNav() {
  return (
    <nav style={{
      display: 'flex',
      gap: '8px',
      marginBottom: 48,
      flexWrap: 'wrap',
    }}>
      {SECTIONS.map(s => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="dither-btn"
          style={{
            fontFamily: T.font.code,
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: T.content.primary,
            textDecoration: 'none',
            padding: '6px 12px',
            border: `1px solid ${T.edge.muted}`,
            borderRadius: 4,
            background: T.surface.elevated,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 1, background: s.color, display: 'inline-block', marginRight: 6 }} />
          {s.label}
        </a>
      ))}
    </nav>
  )
}
```

**Step 2: Add section IDs to existing demo wrappers**

In the App component's return JSX, wrap each group with an `id` attribute:

```tsx
<SectionNav />

<div id="gallery">
  <BayerGradientGrid />
  <GradientTypesRow />
  <AdvancedGradients />
</div>

<div style={dividerStyle} />

<div id="ui-patterns">
  <MaskRevealDemo />
  <AnimationStates />
  <ButtonShowcase />
</div>

<div style={dividerStyle} />

<div id="interactive">
  <GlitchModeDemo />
  {/* New interactive demos will go here */}
</div>

<div style={dividerStyle} />

<div id="recipes">
  {/* New recipe demos will go here */}
</div>

<div style={dividerStyle} />

<div id="sandbox">
  <ControlPanel />
</div>
```

**Step 3: Add smooth scroll CSS**

In `styles.css`, add at the top:
```css
html {
  scroll-behavior: smooth;
}
```

**Step 4: Run dev server and verify**

Run: `pnpm --filter playground dev`
Verify: all existing demos render, nav links scroll to sections.

**Step 5: Commit**

```bash
git add apps/playground/src/App.tsx apps/playground/src/styles.css
git commit -m "refactor(playground): add section navigation and reorganize layout"
```

---

## Task 2: Gallery — Palette Grid

A curated grid of 12 beautiful color palette presets in a tight grid. Each cell is a small DitherBox showing off the palette.

**Files:**
- Modify: `apps/playground/src/App.tsx`

**Step 1: Add PaletteGrid component**

Add after the existing AdvancedGradients component:

```tsx
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
        <span style={{ width: 8, height: 8, borderRadius: 2, background: T.brand.sunYellow }} />
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
```

**Step 2: Add to the gallery section in App**

Inside `<div id="gallery">`, add `<PaletteGrid />` after `<AdvancedGradients />`.

**Step 3: Verify visually**

Run dev server, confirm 4x3 grid of colorful dither patterns with labels.

**Step 4: Commit**

```bash
git add apps/playground/src/App.tsx
git commit -m "feat(playground): add palette grid with 12 curated color presets"
```

---

## Task 3: Gallery — Pixel Scale Explorer

Same gradient rendered at pixelScale 1, 2, 4, 8 side by side.

**Files:**
- Modify: `apps/playground/src/App.tsx`

**Step 1: Add PixelScaleExplorer component**

```tsx
function PixelScaleExplorer() {
  const scales = [1, 2, 4, 8]
  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: T.brand.sunYellow }} />
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
            <span style={cellLabelStyle}>{s === 1 ? '1px (crisp)' : `${s}px blocks`}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
```

**Step 2: Add to gallery section after PaletteGrid**

**Step 3: Verify visually, commit**

```bash
git add apps/playground/src/App.tsx
git commit -m "feat(playground): add pixel scale explorer demo"
```

---

## Task 4: UI Patterns — Hero Section

Full-width dithered gradient behind a headline. The most common real-world use case.

**Files:**
- Modify: `apps/playground/src/App.tsx`

**Step 1: Add HeroDemo component**

```tsx
function HeroDemo() {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: T.brand.skyBlue }} />
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
          center: [0.3, 0.4],
          radius: 1.2,
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
```

**Step 2: Add to ui-patterns section**

Place `<HeroDemo />` at the top of `<div id="ui-patterns">`.

**Step 3: Verify visually, commit**

```bash
git add apps/playground/src/App.tsx
git commit -m "feat(playground): add hero section demo"
```

---

## Task 5: UI Patterns — Loading Skeleton

Pulsing dither pattern as a content placeholder. Threshold animates back and forth.

**Files:**
- Modify: `apps/playground/src/App.tsx`

**Step 1: Add LoadingSkeletonDemo component**

This uses a simple `useEffect` + `requestAnimationFrame` to oscillate threshold between two values, then passes the animated threshold as a prop to DitherBox. It does NOT use the `animate` config (which is event-driven), it uses direct prop control.

```tsx
function LoadingSkeletonDemo() {
  const [t, setT] = useState(0.35)

  useEffect(() => {
    let frame: number
    const animate = (time: number) => {
      // Oscillate between 0.3 and 0.55 over 2 seconds
      const cycle = (Math.sin(time / 1000) + 1) / 2
      setT(0.3 + cycle * 0.25)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: T.brand.skyBlue }} />
        Loading Skeleton
      </h2>
      <p style={sectionDescStyle}>Pulsing dither as a loading placeholder. Replaces boring shimmer effects.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Card skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <DitherBox
            colors={[T.surface.muted, T.surface.tertiary]}
            algorithm="bayer4x4"
            pixelScale={3}
            threshold={t}
            style={{ height: 120, borderRadius: 6 }}
          />
          <DitherBox
            colors={[T.surface.muted, T.surface.tertiary]}
            algorithm="bayer4x4"
            pixelScale={3}
            threshold={t}
            style={{ height: 16, borderRadius: 4, width: '70%' }}
          />
          <DitherBox
            colors={[T.surface.muted, T.surface.tertiary]}
            algorithm="bayer4x4"
            pixelScale={3}
            threshold={t}
            style={{ height: 16, borderRadius: 4, width: '50%' }}
          />
        </div>
        {/* Text skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[100, 95, 80, 100, 60].map((w, i) => (
            <DitherBox
              key={i}
              colors={[T.surface.muted, T.surface.tertiary]}
              algorithm="bayer4x4"
              pixelScale={3}
              threshold={t}
              style={{ height: 12, borderRadius: 3, width: `${w}%` }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Add to ui-patterns section after the existing card/animation demos**

**Step 3: Verify the pulse animation is smooth, commit**

```bash
git add apps/playground/src/App.tsx
git commit -m "feat(playground): add loading skeleton demo with pulsing dither"
```

---

## Task 6: Interactive — Mouse Follower

Radial gradient whose center tracks the cursor. Container is a large div.

**Files:**
- Modify: `apps/playground/src/App.tsx`

**Step 1: Add MouseFollower component**

```tsx
function MouseFollower() {
  const [center, setCenter] = useState<[number, number]>([0.5, 0.5])
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setCenter([
      (e.clientX - rect.left) / rect.width,
      (e.clientY - rect.top) / rect.height,
    ])
  }, [])

  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: T.brand.green }} />
        Mouse Follower
      </h2>
      <p style={sectionDescStyle}>Radial gradient center tracks your cursor. Move your mouse around.</p>
      <DitherBox
        gradient={{
          type: 'radial',
          stops: [
            { color: '#FCE184', position: 0 },
            { color: '#e94560', position: 0.5 },
            { color: '#0F0E0C', position: 1 },
          ],
          center,
          radius: 0.8,
        }}
        algorithm="bayer8x8"
        pixelScale={2}
        style={{
          height: 300,
          borderRadius: 8,
          border: `1px solid ${T.edge.muted}`,
          cursor: 'crosshair',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseMove={handleMouseMove}
      >
        <span style={{
          ...cardLabelStyle,
          fontSize: 14,
          opacity: 0.6,
          pointerEvents: 'none',
        }}>
          move your mouse
        </span>
      </DitherBox>
    </section>
  )
}
```

Note: `onMouseMove` works because DitherBox's root `<div>` spreads no extra mouse handlers — it only uses `onMouseEnter/Leave/Down/Up` for animation states. The `onMouseMove` needs to be added to the DitherBox's wrapper or we wrap it in an outer div. Check if DitherBox passes unknown props. If not, wrap in an outer div:

```tsx
<div onMouseMove={handleMouseMove}>
  <DitherBox ...>
</div>
```

The implementer should check whether DitherBox forwards extra div props. If not, use the wrapper div pattern.

**Step 2: Add to interactive section**

**Step 3: Verify mouse tracking is responsive and not janky, commit**

```bash
git add apps/playground/src/App.tsx
git commit -m "feat(playground): add mouse follower interactive demo"
```

---

## Task 7: Interactive — Click Pulse

A contained div where clicking spawns a radial dither pulse that expands outward from the click point and fades. This uses a `<canvas>` element rendered via `renderGradientDither` directly, with its own animation loop.

**Files:**
- Modify: `apps/playground/src/App.tsx`

**Step 1: Add ClickPulse component**

This is the most complex demo. It manages a list of "pulses" — each is a radial gradient centered at the click point with an animated radius that expands and a threshold that shifts toward fully transparent.

```tsx
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
  const [size, setSize] = useState({ width: 0, height: 0 })

  // Track container size
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

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || size.width <= 0 || size.height <= 0) return

    canvas.width = size.width
    canvas.height = size.height
    const ctx = canvas.getContext('2d')!

    const DURATION = 800 // ms per pulse
    const MAX_RADIUS = 1.5

    const animate = () => {
      const now = performance.now()

      // Clear canvas
      ctx.clearRect(0, 0, size.width, size.height)

      // Remove expired pulses
      pulsesRef.current = pulsesRef.current.filter(p => now - p.startTime < DURATION)

      // Render each active pulse
      for (const pulse of pulsesRef.current) {
        const progress = (now - pulse.startTime) / DURATION
        const eased = 1 - Math.pow(1 - progress, 3) // ease-out
        const radius = 0.1 + eased * MAX_RADIUS
        // Threshold shifts from 0.5 (visible) to -1 (fully transparent) as pulse fades
        const threshold = 0.5 - eased * 1.5

        const imageData = renderGradientDither({
          gradient: {
            type: 'radial',
            stops: [
              { color: '#FCE184', position: 0 },
              { color: '#0F0E0C', position: 1 },
            ],
            angle: 0,
            center: pulse.center,
            radius,
            aspect: 1,
            startAngle: 0,
          },
          algorithm: 'bayer4x4',
          width: size.width,
          height: size.height,
          threshold,
          pixelScale: 3,
        })

        // Composite pulse onto canvas (only non-black pixels)
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = size.width
        tempCanvas.height = size.height
        const tempCtx = tempCanvas.getContext('2d')!
        tempCtx.putImageData(imageData, 0, 0)
        ctx.globalAlpha = 1 - progress
        ctx.drawImage(tempCanvas, 0, 0)
        ctx.globalAlpha = 1
      }

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [size])

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
  }, [])

  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: T.brand.green }} />
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
```

**Important:** This component needs to import `renderGradientDither` from `@dithwather/core`:

```tsx
import { renderGradientDither, type ResolvedGradient } from '@dithwather/core'
```

This import should be added alongside the existing core imports at the top of App.tsx.

**Step 2: Add to interactive section after MouseFollower**

**Step 3: Performance check**

Click rapidly. If frame drops are noticeable at the container size, reduce the canvas resolution by dividing `size.width`/`size.height` by 2 and scaling the canvas via CSS. The `pixelScale: 3` already reduces the Bayer loop cost significantly.

**Step 4: Commit**

```bash
git add apps/playground/src/App.tsx
git commit -m "feat(playground): add click pulse interactive demo

Renders radial dither pulses on click using direct canvas rendering
via renderGradientDither. Multiple pulses composite with fade-out."
```

---

## Task 8: Interactive — Scroll-Driven Reveal

Content sections that reveal through a dither mask as you scroll. Uses IntersectionObserver + scroll position to drive threshold.

**Files:**
- Modify: `apps/playground/src/App.tsx`

**Step 1: Add ScrollReveal component**

```tsx
function ScrollReveal() {
  const [threshold, setThreshold] = useState(0)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const el = sectionRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const viewH = window.innerHeight
      // Progress: 0 when section enters viewport, 1 when fully visible
      const progress = Math.max(0, Math.min(1, 1 - rect.top / viewH))
      setThreshold(progress)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // initial check
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section style={sectionStyle} ref={sectionRef}>
      <h2 style={sectionHeadingStyle}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: T.brand.green }} />
        Scroll Reveal
      </h2>
      <p style={sectionDescStyle}>Scroll down to reveal content through a dither mask. Threshold tracks scroll position.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <DitherBox
          colors={['#000000', '#ffffff']}
          algorithm="bayer8x8"
          pixelScale={2}
          mode="mask"
          threshold={threshold}
          style={{
            height: 200,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${T.brand.sunYellow}, ${T.brand.sunRed})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ ...cardLabelStyle, fontSize: 20 }}>Hello</span>
        </DitherBox>
        <DitherBox
          colors={['#000000', '#ffffff']}
          gradient="diamond"
          algorithm="bayer4x4"
          pixelScale={3}
          mode="mask"
          threshold={threshold}
          style={{
            height: 200,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${T.brand.skyBlue}, ${T.brand.green})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ ...cardLabelStyle, fontSize: 20 }}>World</span>
        </DitherBox>
      </div>
      <p style={{ ...sectionDescStyle, marginTop: 12, marginBottom: 0 }}>
        threshold: {threshold.toFixed(2)}
      </p>
    </section>
  )
}
```

**Step 2: Add to interactive section**

**Step 3: Verify scroll interaction, commit**

```bash
git add apps/playground/src/App.tsx
git commit -m "feat(playground): add scroll-driven dither reveal demo"
```

---

## Task 9: Recipes — Image Reveal

A real photo revealed through a dither mask on hover. Practical copy-paste pattern.

**Files:**
- Modify: `apps/playground/src/App.tsx`

**Step 1: Add ImageRevealRecipe component**

Uses a placeholder image URL (picsum.photos or a solid gradient fallback). The pattern is: DitherBox with mode="mask" wrapping an `<img>`.

```tsx
function RecipesSection() {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: T.brand.sunsetFuzz }} />
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
          <span style={cellLabelStyle}>mode=&quot;mask&quot; + animate</span>
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
          <span style={cellLabelStyle}>conic + hover threshold</span>
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
          <span style={cellLabelStyle}>absolute positioned frame</span>
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
          <span style={cellLabelStyle}>text through mask</span>
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Add to recipes section in App**

Inside `<div id="recipes">`, add `<RecipesSection />`.

**Step 3: Verify all 4 recipe cards, commit**

```bash
git add apps/playground/src/App.tsx
git commit -m "feat(playground): add recipes section with 4 copy-paste patterns

Image reveal, animated background, dithered border, and text mask."
```

---

## Task 10: Dark/Light Mode Toggle Demo

A toggle that wipes between dark and light content using a dither mask transition.

**Files:**
- Modify: `apps/playground/src/App.tsx`

**Step 1: Add DarkLightToggle component**

```tsx
function DarkLightToggle() {
  const [isDark, setIsDark] = useState(true)

  return (
    <section style={sectionStyle}>
      <h2 style={sectionHeadingStyle}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: T.brand.skyBlue }} />
        Theme Toggle
      </h2>
      <p style={sectionDescStyle}>Click to toggle. The dither mask wipes between dark and light.</p>
      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', height: 200 }}>
        {/* Light layer (always rendered) */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: '#f5f0e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: 24,
        }}>
          <span style={{ fontFamily: T.font.heading, fontSize: 20, color: '#1a1a1a', textTransform: 'uppercase' }}>
            Light Mode
          </span>
        </div>

        {/* Dark layer with dither mask */}
        <DitherBox
          colors={['#000000', '#ffffff']}
          gradient="diamond"
          algorithm="bayer8x8"
          pixelScale={3}
          mode="mask"
          threshold={isDark ? 1 : 0}
          animate={{
            idle: { threshold: isDark ? 1 : 0 },
            transition: 0,
          }}
          style={{
            position: 'absolute',
            inset: 0,
            background: T.surface.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'none',
          }}
        >
          <span style={{ fontFamily: T.font.heading, fontSize: 20, color: T.content.heading, textTransform: 'uppercase', position: 'relative', zIndex: 3 }}>
            Dark Mode
          </span>
        </DitherBox>

        {/* Toggle button */}
        <button
          onClick={() => setIsDark(d => !d)}
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
```

**Note:** The threshold toggle from 0 to 1 will be instant since `transition: 0`. The implementer should experiment with either using the `animate` config properly (idle threshold that changes based on `isDark` state) or using a manual `useDitherAnimation` call. The simplest approach: just change the `threshold` prop directly and let the render cycle handle it — the dither pattern will update immediately, giving a snappy wipe effect. For a smoother wipe, set `transition: 500`.

**Step 2: Add to ui-patterns section**

**Step 3: Verify toggle works, commit**

```bash
git add apps/playground/src/App.tsx
git commit -m "feat(playground): add dark/light theme toggle demo"
```

---

## Task 11: Clean Up — Remove Old Redundant Sections

The existing BayerGradientGrid, GradientTypesRow, and AdvancedGradients have been superseded by the new Gallery demos (PaletteGrid, PixelScaleExplorer) plus the existing GradientTypes row. Consolidate.

**Files:**
- Modify: `apps/playground/src/App.tsx`

**Step 1: Evaluate redundancy**

Review which existing sections still add unique value vs which overlap with new demos:

- **BayerGradientGrid** (3 algorithms × 3 modes) — useful, keep as "Algorithm × Mode Matrix" in Gallery
- **GradientTypesRow** (5 gradient types) — keep in Gallery, already a good comparison
- **AdvancedGradients** (multi-stop, off-center, etc.) — partially redundant with PaletteGrid, but shows API flexibility. Keep but shrink to 3 best examples instead of 6.
- **MaskRevealDemo** — keep in UI Patterns (already there)
- **AnimationStates** — keep in UI Patterns
- **ButtonShowcase** — keep in UI Patterns
- **GlitchModeDemo** — keep in Interactive

**Step 2: Trim AdvancedGradients to 3 cards**

Keep only the most visually distinct: 3-color sunrise, off-center radial, and 5-color conic wheel. Remove the other 3.

**Step 3: Verify final section ordering**

The final App layout should be:

```
Header
SectionNav

GALLERY
  - GradientTypesRow (5 types)
  - BayerGradientGrid (algorithm × mode)
  - PaletteGrid (12 palettes)
  - PixelScaleExplorer (1/2/4/8)
  - AdvancedGradients (3 best)

UI PATTERNS
  - HeroDemo
  - MaskRevealDemo
  - LoadingSkeletonDemo
  - DarkLightToggle
  - AnimationStates
  - ButtonShowcase

INTERACTIVE
  - MouseFollower
  - ClickPulse
  - ScrollReveal
  - GlitchModeDemo

RECIPES
  - RecipesSection (4 cards)

SANDBOX
  - ControlPanel
```

**Step 4: Verify everything renders, commit**

```bash
git add apps/playground/src/App.tsx
git commit -m "refactor(playground): reorganize sections and trim redundant demos"
```

---

## Task 12: Final Build + Visual Verification

**Step 1: Run full test suite**

Run: `pnpm test`
Expected: all pass (playground has no tests, but core/react should still pass)

**Step 2: Run build**

Run: `pnpm build`
Expected: clean

**Step 3: Visual check**

Run: `pnpm --filter playground dev`

Walk through every section:
- Gallery: gradient types, algorithm grid, palette grid, pixel scale, advanced gradients all render
- UI Patterns: hero, mask reveal, loading skeleton, theme toggle, animation states, buttons
- Interactive: mouse follower tracks smoothly, click pulse fires and fades, scroll reveal works, glitch mode slider works
- Recipes: all 4 cards hover correctly
- Sandbox: control panel still fully functional
- Nav links scroll to correct sections

**Step 4: Commit any fixes**

```bash
git add apps/playground/src/App.tsx apps/playground/src/styles.css
git commit -m "chore(playground): final polish and fixes for showcase redesign"
```

---

## Summary

| Task | Section | What |
|------|---------|------|
| 1 | Structure | Section nav + reorganized layout |
| 2 | Gallery | Palette grid (12 presets) |
| 3 | Gallery | Pixel scale explorer |
| 4 | UI Patterns | Hero section |
| 5 | UI Patterns | Loading skeleton |
| 6 | Interactive | Mouse follower |
| 7 | Interactive | Click pulse (radial dither on click) |
| 8 | Interactive | Scroll-driven reveal |
| 9 | Recipes | 4 recipe cards (image reveal, animated BG, dithered border, text mask) |
| 10 | UI Patterns | Dark/light theme toggle |
| 11 | Cleanup | Trim redundancy, finalize order |
| 12 | Verification | Build, test, visual check |
