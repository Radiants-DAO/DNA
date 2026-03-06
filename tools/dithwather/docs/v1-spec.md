# Dithwather v1 Specification

> A React-first library for applying classic dithering effects to UI elements.

## v1 Scope (Tight)

### Algorithms (v1 subset)

| Type | Algorithms | Notes |
|------|------------|-------|
| **Ordered** | Bayer 2x2, 4x4, 8x8 | Fast, predictable patterns |
| **Error Diffusion** | Floyd-Steinberg | Classic, high quality |

Future: Jarvis-Judice-Ninke, Stucki, Burkes, Sierra variants, Atkinson, blue noise

### Color Modes (v1 subset)

| Mode | Description |
|------|-------------|
| **Mono** | Single foreground color on transparent |
| **Duotone** | Two colors (fg/bg) |

Future: Limited palette (n-color), full color quantization

### Adjustments (v1 subset)

- `intensity` (0-1) — blend between original and dithered
- `threshold` (0-1) — brightness cutoff for mono/duotone
- `brightness` (-1 to 1)
- `contrast` (-1 to 1)

Future: Gamma, sharpen, color channel adjustments

---

## Application Modes

### DOM/CSS Mapping Strategy

| Mode | Implementation | Trade-offs |
|------|----------------|------------|
| **`background`** | Canvas renders to `background-image: url(data:...)` or live canvas behind content | Simple, content stays crisp |
| **`border`** | Canvas renders border region only, positioned as pseudo-element or sibling | Needs careful sizing, re-render on resize |
| **`mask`** | Canvas generates alpha mask, applied via `mask-image` or `-webkit-mask` | Great dissolve effects, browser support varies |
| **`full`** | Canvas overlays entire element, `pointer-events: none` on canvas | Use sparingly, covers content |

**v1 Focus:** `background` and `mask` modes. Border mode is v1.1.

### Resize Handling

- `ResizeObserver` watches element dimensions
- Debounced re-render (16ms default, configurable)
- Optional `pixelRatio` control for performance vs. quality

---

## Animation System

### Animation Strategy: **Config-level tweening**

Animations interpolate configuration values (intensity, threshold, colors), not individual pixels. This provides:

- Predictable performance (re-dither on each frame, but config is simple)
- Declarative API (CSS-like transitions)
- Works with any renderer (Canvas, future WebGL)

Per-pixel shader animations are a future optimization for WebGL renderer.

### Animation Types (v1)

```tsx
interface DitherAnimationConfig {
  // State-based transitions
  idle?: DitherConfig
  hover?: DitherConfig
  focus?: DitherConfig
  active?: DitherConfig

  // Transition timing
  transition?: number | { duration: number; easing: string }

  // Mount/unmount dissolve
  dissolve?: {
    in?: number   // ms
    out?: number  // ms
  }
}
```

**v1 Focus:** State transitions (hover/focus/active) + dissolve in/out.

Future: Continuous animations (shimmer, noise drift, scanlines)

---

## Output Formats

| Format | Status | Use Case |
|--------|--------|----------|
| **Live Canvas** | v1 | Real-time rendering, animations |
| **Data URL** | v1 | Static export, CSS backgrounds |
| **JSON Config** | v1 | Save/load presets, editor export |
| SVG Filter | Future | Subset of algorithms only, fallback |
| CSS Custom Properties | Future | Design token integration |

---

## React API

### Components

```tsx
// Main primitive - v1
<DitherBox
  algorithm="bayer8x8"
  mode="background"  // 'background' | 'mask' | 'full'
  colors={{ fg: '#00ff00', bg: '#000000' }}
  intensity={0.8}
  animate={{
    idle: { intensity: 0.5 },
    hover: { intensity: 1 },
    transition: 200
  }}
  dissolve={{ in: 300, out: 200 }}
>
  <button>Click me</button>
</DitherBox>

// Convenience wrapper - v1
<DitherButton
  algorithm="floyd-steinberg"
  colors={{ fg: '#fff', bg: 'transparent' }}
>
  Submit
</DitherButton>
```

### Hooks

```tsx
// Low-level access - v1
const { canvasRef, render, config, setConfig } = useDither({
  algorithm: 'bayer4x4',
  width: 200,
  height: 50,
})

// Animation control - v1
const { isAnimating, progress } = useDitherAnimation(config, {
  duration: 300,
  easing: 'ease-out'
})
```

### Provider

```tsx
// Global defaults - v1
<DitherProvider
  defaults={{
    algorithm: 'bayer8x8',
    colors: { fg: '#00ff00', bg: '#001100' }
  }}
>
  <App />
</DitherProvider>
```

---

## Editor (Lite v1)

Embeddable React component for visual configuration.

### v1 Features

- Algorithm picker (dropdown)
- Intensity slider
- Threshold slider
- Color mode toggle (mono/duotone)
- Foreground/background color pickers
- Brightness/contrast sliders
- Live preview panel
- Export as JSON config
- Copy as code snippet

### Editor API

```tsx
<DitherEditor
  value={config}
  onChange={setConfig}
  preview={<MyComponent />}  // Optional custom preview

  // Panel visibility
  showAlgorithm={true}
  showColors={true}
  showAdjustments={true}

  // Export options
  onExport={(format: 'json' | 'code') => void}
/>
```

Future: Preset library, chromatic effects panel, animation timeline

---

## Package Structure

```
dithwather/
├── packages/
│   ├── core/                 # MIT - Pure JS dithering engine
│   │   ├── src/
│   │   │   ├── algorithms/
│   │   │   │   ├── bayer.ts
│   │   │   │   ├── floyd-steinberg.ts
│   │   │   │   └── index.ts
│   │   │   ├── renderer/
│   │   │   │   ├── canvas.ts
│   │   │   │   └── index.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── react/                # MIT - React components & hooks
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── DitherBox.tsx
│   │   │   │   ├── DitherButton.tsx
│   │   │   │   └── DitherProvider.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useDither.ts
│   │   │   │   └── useDitherAnimation.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── editor/               # PROPRIETARY - Visual editor
│       ├── src/
│       │   ├── DitherEditor.tsx
│       │   ├── panels/
│       │   └── index.ts
│       ├── package.json
│       └── LICENSE           # Proprietary license
│
├── apps/
│   └── playground/           # Demo/docs site
│
├── docs/
│   └── v1-spec.md
│
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Milestones

### Phase 1: Core Engine (Week 1-2)

- [ ] Bayer matrix generation (2x2, 4x4, 8x8)
- [ ] Floyd-Steinberg error diffusion
- [ ] Canvas renderer with mono/duotone output
- [ ] Intensity, threshold, brightness, contrast adjustments
- [ ] Data URL export
- [ ] Unit tests for algorithms

### Phase 2: React Components (Week 3-4)

- [ ] `useDither` hook
- [ ] `DitherBox` component with background mode
- [ ] Mask mode implementation
- [ ] `useDitherAnimation` for state transitions
- [ ] Dissolve in/out animations
- [ ] `DitherProvider` for defaults
- [ ] `DitherButton` convenience component
- [ ] ResizeObserver integration

### Phase 3: Editor (Week 5-6)

- [ ] Basic editor layout
- [ ] Algorithm picker panel
- [ ] Color controls panel
- [ ] Adjustment sliders panel
- [ ] Live preview integration
- [ ] JSON export
- [ ] Code snippet export

### Phase 4: Polish (Week 7-8)

- [ ] Playground/demo site
- [ ] Documentation
- [ ] Performance profiling & optimization
- [ ] Edge cases & browser testing
- [ ] npm publish setup (scoped packages)

---

## Open Decisions

1. **Canvas resolution strategy:** Match device pixel ratio, or allow lower for perf?
2. **Animation easing:** Ship custom easings or use `bezier-easing` package?
3. **SSR handling:** Static placeholder or skip rendering on server?
4. **Bundle format:** ESM only, or also CJS for legacy?
