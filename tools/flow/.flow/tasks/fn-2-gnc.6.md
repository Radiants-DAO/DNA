# fn-2-gnc.6 Build Shadow and Gradient Editors

## Description
Build shadow and gradient editors with layered value support.

## Context
Complex CSS values have multiple layers:
```css
box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
background: linear-gradient(to right, #fff 0%, #000 100%), url(bg.png);
```

These need specialized editors that can add/remove/reorder layers.

## Implementation

1. Create `/src/components/designer/ShadowEditor.tsx`:
   - List of shadow layers
   - Each layer: X, Y, Blur, Spread, Color, Inset toggle
   - Add/Remove/Reorder controls
   - Preview composite shadow

2. Create `/src/components/designer/GradientEditor.tsx`:
   - Gradient type: linear, radial, conic
   - Direction/angle control
   - Color stops with position
   - Add/Remove stops
   - Visual gradient preview bar

3. Create LayersValue utilities:
```typescript
// src/utils/layersValue.ts
export function addLayer(layers: LayersValue, layer: StyleValue): LayersValue;
export function removeLayer(layers: LayersValue, index: number): LayersValue;
export function reorderLayers(layers: LayersValue, from: number, to: number): LayersValue;
```

4. Integrate with sections:
   - BoxShadowsSection uses ShadowEditor
   - BackgroundsSection uses GradientEditor

## Key Files
- **Create**: `src/components/designer/ShadowEditor.tsx`
- **Create**: `src/components/designer/GradientEditor.tsx`
- **Create**: `src/utils/layersValue.ts`
- **Modify**: `src/components/designer/sections/BoxShadowsSection.tsx`
- **Modify**: `src/components/designer/sections/BackgroundsSection.tsx`
## Acceptance
- [ ] ShadowEditor displays all shadow layers with controls
- [ ] Can add new shadow layer with defaults
- [ ] Can remove shadow layer by index
- [ ] Can reorder shadow layers via drag or buttons
- [ ] GradientEditor supports linear, radial, conic types
- [ ] Color stops are editable and addable
- [ ] Gradient preview shows live result
- [ ] Both editors output valid LayersValue
- [ ] Clipboard output produces valid CSS
## Done summary
Implemented ShadowEditor and GradientEditor with layered value utilities. ShadowEditor provides per-layer controls for X/Y offset, blur, spread, color, and inset toggle with live preview and CSS output. GradientEditor supports linear, radial, and conic gradients with color stops and visual preview. Both editors integrate with the StyleValue type system via FunctionValue and use centralized styleValueToCss for consistent CSS serialization.
## Evidence
- Commits: df1696a42cf94efda99e31b8f2116611f2df8fac, 95d4e38602ce79bf608c9edd19902d45cd277fd1
- Tests: pnpm typecheck, pnpm build
- PRs: