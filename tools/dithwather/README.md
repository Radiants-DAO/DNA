# Dithwather

> Classic dithering effects for modern UI

A React-first library for applying dithering effects to UI elements with an embeddable visual editor.

## Packages

| Package | Description | License |
|---------|-------------|---------|
| `@dithwather/core` | Pure JS dithering engine | MIT |
| `@dithwather/react` | React components & hooks | MIT |

## Quick Start

```bash
pnpm add @dithwather/react
```

```tsx
import { DitherBox, DitherButton } from '@dithwather/react'

// Background dithering
<DitherBox
  algorithm="bayer8x8"
  colors={{ fg: '#00ff00', bg: '#001100' }}
  animate={{
    idle: { intensity: 0.5 },
    hover: { intensity: 1 },
  }}
>
  <div>Your content here</div>
</DitherBox>

// Button with dither effect
<DitherButton
  algorithm="floyd-steinberg"
  colors={{ fg: '#ffffff', bg: '#000000' }}
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

## License

- `@dithwather/core` and `@dithwather/react` are MIT licensed
