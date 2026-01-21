# fn-2-gnc.2 Add Color Space Support (oklch, lab, lch)

## Description
Add oklch, lab, lch color space support with bidirectional converters using the Culori library.

## Context
Webstudio supports 14 color spaces via `ColorValue`:
- srgb, srgb-linear, display-p3
- oklch, oklab, lab, lch
- prophoto-rgb, a98-rgb, rec2020
- xyz, xyz-d50, xyz-d65
- hsl (via rgb conversion)

RadFlow's ColorPicker (`src/components/designer/ColorPicker.tsx`) currently supports hex, rgb, hsl only.

## Implementation

1. **Add Culori Library** (well-tested, 2.5k stars):
```bash
pnpm add culori
pnpm add -D @types/culori
```

2. Create `/src/utils/colorConversions.ts` wrapping Culori:
```typescript
import { converter, formatHex, formatRgb } from 'culori';

const rgbToOklch = converter('oklch');
const oklchToRgb = converter('rgb');

export function convertToOklch(hex: string): ColorValue {
  const oklch = rgbToOklch(hex);
  return {
    type: 'color',
    colorSpace: 'oklch',
    components: [oklch.l, oklch.c, oklch.h ?? 0],
    alpha: oklch.alpha ?? 1,
  };
}
```

3. Enhance ColorPicker:
   - Add oklch tab/mode
   - Lightness (L), Chroma (C), Hue (H) sliders
   - Show CSS output: `oklch(0.7 0.15 195)`

4. Update ColorValue type to use color spaces:
```typescript
export type ColorValue = {
  type: 'color';
  colorSpace: 'srgb' | 'oklch' | 'lab' | 'lch' | ...;
  components: [number, number, number];
  alpha: number;
};
```

5. Add color space detection from CSS string:
   - Parse `oklch(...)`, `lab(...)`, `lch(...)`
   - Fallback to srgb for hex/rgb

## Key Files
- **Add dep**: `pnpm add culori @types/culori`
- **Create**: `src/utils/colorConversions.ts`
- **Modify**: `src/components/designer/ColorPicker.tsx`
- **Modify**: `src/types/styleValue.ts` (enhance ColorValue)
## Context
Webstudio supports 14 color spaces via `ColorValue`:
- srgb, srgb-linear, display-p3
- oklch, oklab, lab, lch
- prophoto-rgb, a98-rgb, rec2020
- xyz, xyz-d50, xyz-d65
- hsl (via rgb conversion)

RadFlow's ColorPicker (`src/components/designer/ColorPicker.tsx`) currently supports hex, rgb, hsl only.

## Implementation

1. Create `/src/utils/colorConversions.ts`:
   - `rgbToOklch()`, `oklchToRgb()`
   - `rgbToLab()`, `labToRgb()`
   - `rgbToLch()`, `lchToRgb()`
   - Reference: Webstudio uses Culori library patterns

2. Enhance ColorPicker:
   - Add oklch tab/mode
   - Lightness (L), Chroma (C), Hue (H) sliders
   - Show CSS output: `oklch(0.7 0.15 195)`

3. Update ColorValue type to use color spaces:
```typescript
export type ColorValue = {
  type: 'color';
  colorSpace: 'srgb' | 'oklch' | 'lab' | 'lch' | ...;
  components: [number, number, number];
  alpha: number;
};
```

4. Add color space detection from CSS string:
   - Parse `oklch(...)`, `lab(...)`, `lch(...)`
   - Fallback to srgb for hex/rgb

## Key Files
- **Create**: `src/utils/colorConversions.ts`
- **Modify**: `src/components/designer/ColorPicker.tsx`
- **Modify**: `src/types/styleValue.ts` (enhance ColorValue)
## Acceptance
- [ ] Culori library added as dependency
- [ ] ColorPicker has oklch mode with L/C/H sliders
- [ ] Color conversions use Culori (not custom implementation)
- [ ] Color conversions are accurate (test against known values from Culori docs)
- [ ] `oklch(0.7 0.15 195)` parses to ColorValue and back
- [ ] Hex input auto-converts to selected color space for display
- [ ] Alpha channel works in all color spaces
- [ ] Gamut mapping for out-of-srgb colors (clamp or show warning)
## Done summary
Added oklch, oklab, lab, and lch color space support using the Culori library. Implemented bidirectional color space conversions, enhanced ColorPicker with OKLCH mode (L/C/H sliders), added gamut warning indicator for out-of-sRGB colors, and created 30 comprehensive tests for color conversions.
## Evidence
- Commits: 43ba7687cc292a1c7128bb022d9b4cd834a9f862
- Tests: pnpm test -- --run (30 color conversion tests pass)
- PRs: