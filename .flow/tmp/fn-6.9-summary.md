# fn-6.9 Summary: Input.tsx - Touch targets, focus ring tokens

## Changes Made

Updated `packages/theme-rad-os/components/core/Input.tsx` to implement:

### Touch Targets
- Added `min-height: var(--touch-target-default)` via `motionStyles` for Input component
- Ensures WCAG-compliant 44px minimum touch target for interactive elements

### Focus Ring Tokens
- Replaced Tailwind's hardcoded `focus:ring-2 focus:ring-edge-focus focus:ring-offset-0` with token-based focus ring
- Uses `--focus-ring-width`, `--focus-ring-offset`, and `--focus-ring-color` CSS custom properties
- Error state uses `--color-destructive` for focus ring color
- Applied to both Input and TextArea components

### Motion Tokens
- Added transitions using `var(--transition-fast)` for background-color, box-shadow, and border-color
- Respects `--duration-scalar` (instant in light mode, animated in dark mode)

### Icon Integration
- Updated icon size references to use `ICON_SIZES` constants from Icon component
- Consistent with other updated components (Button, Card)

## Tokens Used
- `--touch-target-default` (44px)
- `--focus-ring-width` (2px)
- `--focus-ring-offset` (2px)
- `--focus-ring-color` (via `--color-edge-focus`)
- `--color-destructive` (for error state)
- `--transition-fast` (100ms * duration-scalar)
