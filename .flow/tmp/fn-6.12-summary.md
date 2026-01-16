# fn-6.12: Tabs.tsx - Motion tokens for indicator

## Summary

Added motion token integration to the Tabs component for mode-aware indicator animations. The component now uses CSS custom properties that respect the `--duration-scalar` system (instant in light mode, smooth transitions in dark mode, respects reduced motion preferences).

## Changes Made

1. **Added mode-specific animation documentation header** - Documents the motion token behavior for the component

2. **Added motion style constants**:
   - `manilaTabMotionStyles`: Transitions for tab indicator background-color and transform
   - `contentMotionStyles`: Opacity transitions for tab content panels

3. **Updated Manila tab triggers**:
   - Added `manilaTabMotionStyles` for smooth indicator transitions
   - Added touch target compliance with `minHeight: var(--touch-target-default)`

4. **Updated TabContent component**:
   - Added `contentMotionStyles` to both manila and regular content panels
   - Documented the motion token behavior in JSDoc

## Motion Token Usage

- `--transition-fast`: Used for tab indicator background-color changes
- `--transition-base`: Used for content panel opacity transitions
- `--touch-target-default`: Ensures WCAG touch target compliance for manila tabs

## Behavior

- **Light mode**: Instant indicator changes (--duration-scalar: 0)
- **Dark mode**: Smooth 100-150ms transitions
- **Reduced motion**: Always instant
