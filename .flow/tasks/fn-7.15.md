# fn-7.15 Colors Section - Hybrid color picker with token integration

## Description
Implement a reusable color picker component used throughout the Designer Panel. Supports both raw color values and design token references with a "hybrid" approach.

**Modes:**
1. **Token Mode** (default): Shows token name, clicking opens token browser
2. **Custom Mode**: Shows color swatch, clicking opens full color picker

**Color Picker Features:**
- HSL/RGB/HEX input modes
- Color gradient selector (saturation/lightness plane)
- Hue slider
- Alpha/opacity slider
- Eyedropper tool (if browser supports)
- Recent colors (last 8 used)
- Token suggestions based on current color similarity

**Layout:**
```
┌─────────────────────────────────────┐
│ Background                      [▼] │
├─────────────────────────────────────┤
│ Color: [■] bg-primary         [⟲]  │
│        ↑    ↑                  ↑    │
│      swatch token-name     detach   │
│                                     │
│ [Expanded Color Picker]             │
│ ┌─────────────────────────────────┐ │
│ │ ████████████████████████████████│ │
│ │ ██                            ██│ │
│ │ ██    Saturation/Lightness   ██│ │
│ │ ██           Plane           ██│ │
│ │ ██                            ██│ │
│ │ ████████████████████████████████│ │
│ │ [═══════════●══════════] Hue    │ │
│ │ [═══════════●══════════] Alpha  │ │
│ │                                 │ │
│ │ HEX: [#3B82F6]  RGB HSL [tabs]  │ │
│ │                                 │ │
│ │ Tokens:                         │ │
│ │ [■ primary] [■ accent] [■ ...]  │ │
│ │                                 │ │
│ │ Recent:                         │ │
│ │ [■] [■] [■] [■] [■] [■] [■] [■] │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Token Detection:**
- Warn if using raw hex that closely matches a token (within ΔE < 3)
- Show suggestion: "This looks like `primary-500`. Use token?"

**Reference:** Browser-native color pickers + Figma/Webflow patterns

## Acceptance
- [ ] Color swatch displays current color
- [ ] Token name displayed when bound to token
- [ ] Detach button converts token to raw value
- [ ] Saturation/lightness gradient plane
- [ ] Hue slider (0-360)
- [ ] Alpha/opacity slider (0-100%)
- [ ] HEX input with validation
- [ ] RGB input tabs (R/G/B individual inputs)
- [ ] HSL input tabs (H/S/L individual inputs)
- [ ] Eyedropper tool (navigator.clipboard.read or EyeDropper API)
- [ ] Recent colors history (persisted in localStorage)
- [ ] Token suggestions when raw color matches existing token
- [ ] Exports as reusable `<ColorPicker />` component for other sections

## Files
- `src/components/designer/ColorPicker.tsx` (standalone component)
- Used by: Typography (text color), Backgrounds, Borders, Effects (shadow color)

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
