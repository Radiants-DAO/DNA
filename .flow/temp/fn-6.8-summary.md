## Summary

Implemented motion tokens for Card.tsx hover effects, following the same pattern established in Button.tsx:

### Changes
- Added `interactive` prop to enable hover effects with motion tokens
- Added `onClick` prop that automatically implies interactive behavior
- Uses `--transition-base` for transitions (respects `--duration-scalar`)
- Uses `--lift-distance` for hover transform
- Uses `--shadow-card-hover` for hover shadow effect
- Added `cursor-pointer` for interactive cards
- Non-interactive cards render without motion handlers for performance

### Motion Token Integration
- Transitions: `transform var(--transition-base), box-shadow var(--transition-base)`
- Hover state: `translateY(calc(-1 * var(--lift-distance)))` with `--shadow-card-hover`
- Respects `--duration-scalar` (instant in light mode, animated in dark mode)
