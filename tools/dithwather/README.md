# Dithwather

> Classic dithering effects for modern UI

A React-first library for applying dithering effects to UI elements with an embeddable visual editor.

## Packages

| Package | Description | License |
|---------|-------------|---------|
| `@rdna/dithwather-core` | Pure JS dithering engine | MIT |
| `@rdna/dithwather-react` | React components & hooks | MIT |

## Quick Start

```bash
pnpm add @rdna/dithwather-react
```

```tsx
import { DitherBox, DitherButton } from '@rdna/dithwather-react'

// Background dithering
<DitherBox
  algorithm="bayer8x8"
  colors={['#00110f', '#00ff88']}
  angle={135}
  threshold={0.5}
  style={{ width: '100%', height: 240 }}
>
  <div>Your content here</div>
</DitherBox>

// Button with dither effect
<DitherButton
  algorithm="bayer4x4"
  colors={['#0f172a', '#38bdf8']}
  angle={90}
>
  Click Me
</DitherButton>
```

## Algorithms

### Ordered (Bayer)
- `bayer2x2` - Coarse pattern
- `bayer4x4` - Medium pattern (default)
- `bayer8x8` - Fine pattern

### Error Diffusion
- `floyd-steinberg` - Classic high-quality dithering

## Color Modes

- **Mono** - Single color on transparent
- **Duotone** - Two colors (foreground/background)

## Application Modes

- `background` - Dithered background, content stays crisp
- `mask` - Dithered alpha mask for dissolve effects
- `full` - Dithered overlay on entire element

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Development mode
pnpm dev
```

## Runtime Notes

- `@rdna/dithwather-core` exposes pure pixel-rendering APIs such as `renderGradientDither` that work in browser and Node-like runtimes.
- Canvas, data URL, object URL, and React component rendering paths require browser-like DOM APIs.

## License

- `@rdna/dithwather-core` and `@rdna/dithwather-react` are MIT licensed
