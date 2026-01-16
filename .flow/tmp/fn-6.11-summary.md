# fn-6.11 Summary: Select.tsx - Touch targets, focus ring tokens

## Changes Made

Updated `packages/theme-rad-os/components/core/Select.tsx` to implement:

### Touch Targets
- Added `min-height: var(--touch-target-default)` via `triggerMotionStyles` for the trigger button
- Added `min-height: var(--touch-target-default)` via `itemMotionStyles` for dropdown items
- Ensures WCAG-compliant 44px minimum touch target for all interactive elements

### Focus Ring Tokens
- Replaced Tailwind's hardcoded `focus:ring-2 focus:ring-edge-focus focus:ring-offset-0` with token-based focus ring
- Uses `--focus-ring-width`, `--focus-ring-offset`, and `--focus-ring-color` CSS custom properties
- Error state uses `--color-destructive` for focus ring color
- Implemented via `isFocused` state with `onFocus`/`onBlur` handlers

### Motion Tokens
- Added transitions using `var(--transition-fast)` for background-color, box-shadow, border-color, and transform
- Applied to both trigger button and dropdown items
- Respects `--duration-scalar` (instant in light mode, animated in dark mode)

### Icon Integration
- Updated icon size references to use `ICON_SIZES.md` constants from Icon component
- Consistent with other updated components (Button, Card, Input)

## Tokens Used
- `--touch-target-default` (44px)
- `--focus-ring-width` (2px)
- `--focus-ring-offset` (2px)
- `--focus-ring-color` (via `--color-edge-focus`)
- `--color-destructive` (for error state)
- `--transition-fast` (100ms * duration-scalar)
