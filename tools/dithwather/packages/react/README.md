# @rdna/dithwather-react

React components and hooks for dithered gradient effects -- backgrounds, masks, and interactive animations.

## Install

```bash
npm install @rdna/dithwather-react
```

Peer dependencies: `react` >= 18 and `react-dom` >= 18. `@rdna/dithwather-core` is installed automatically.

## Quick Start

### DitherBox with colors and angle shorthand

```tsx
import { DitherBox } from '@rdna/dithwather-react'

function Hero() {
  return (
    <DitherBox
      colors={['#000000', '#3b82f6']}
      angle={135}
      algorithm="bayer8x8"
      style={{ width: '100%', height: 300 }}
    >
      <h1>Hello, dithered world</h1>
    </DitherBox>
  )
}
```

### DitherButton with hover animation

```tsx
import { DitherButton } from '@rdna/dithwather-react'

function Nav() {
  return (
    <DitherButton
      colors={['#1e1b4b', '#7c3aed']}
      angle={90}
      algorithm="bayer4x4"
      animate={{
        idle: { threshold: 0.425 },
        hover: { threshold: 0.525 },
        active: { threshold: 0.475 },
        transition: 150,
      }}
      onClick={() => console.log('clicked')}
    >
      Get Started
    </DitherButton>
  )
}
```

### Mask mode (content revealed through dither pattern)

```tsx
import { DitherBox } from '@rdna/dithwather-react'

function MaskedImage() {
  return (
    <DitherBox
      colors={['#000000', '#ffffff']}
      angle={90}
      mode="mask"
      threshold={0.5}
      algorithm="bayer8x8"
      style={{ width: 400, height: 300 }}
    >
      <img src="/photo.jpg" alt="Masked" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </DitherBox>
  )
}
```

## DitherBox Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `gradient` | `DitherGradient \| DitherGradientType` | -- | Full gradient config or type string (`'linear'`, `'radial'`, `'conic'`, `'diamond'`, `'reflected'`) |
| `colors` | `string[]` | -- | Shorthand: gradient colors as hex strings (evenly-spaced stops) |
| `angle` | `number` | `90` | Shorthand: gradient angle in degrees |
| `algorithm` | `OrderedAlgorithm` | `'bayer4x4'` | Bayer matrix size: `'bayer2x2'`, `'bayer4x4'`, `'bayer8x8'` |
| `threshold` | `number` | `0.5` | Dither threshold bias (0-1). Controls the balance between the two colors at each stop boundary. |
| `mode` | `'background' \| 'mask' \| 'full'` | `'background'` | How to apply the dither pattern |
| `animate` | `DitherAnimateConfig` | -- | State-based animation: `{ idle, hover, focus, active, transition }` |
| `pixelScale` | `number` | `1` | Pixel scale for visible patterns (try 2-4) |
| `glitch` | `number` | `0` | Stride offset for scanline glitch effect |
| `children` | `ReactNode` | -- | Content rendered inside the container |
| `className` | `string` | -- | CSS class for the outer `div` |
| `style` | `CSSProperties` | -- | Inline styles for the outer `div` |

## DitherButton

Wraps `DitherBox` around a `<button>`. Accepts all `DitherBoxProps` plus standard button HTML attributes. Ships with a sensible default `animate` config for idle/hover/active transitions. Pass `buttonStyle` to style the inner button element.

## DitherProvider

Set shared defaults for all `DitherBox` and `DitherButton` components in a subtree.

```tsx
import { DitherProvider } from '@rdna/dithwather-react'

function App() {
  return (
    <DitherProvider defaults={{ algorithm: 'bayer8x8', threshold: 0.5 }}>
      {/* All DitherBox/DitherButton children inherit these defaults */}
    </DitherProvider>
  )
}
```

## Accessibility

The `useReducedMotion` hook detects `prefers-reduced-motion: reduce` and returns a boolean. Use it to conditionally disable animations.

```tsx
import { useReducedMotion } from '@rdna/dithwather-react'

function MyComponent() {
  const prefersReduced = useReducedMotion()
  return (
    <DitherBox
      colors={['#000', '#fff']}
      animate={prefersReduced ? undefined : { idle: { threshold: 0.4 }, hover: { threshold: 0.6 } }}
    />
  )
}
```

## License

MIT
