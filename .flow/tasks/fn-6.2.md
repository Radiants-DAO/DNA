# fn-6.2 tokens.css: Add motion, icon, a11y, density, fluid tokens

## Description
Add all new token systems to tokens.css as defined in the fn-6 epic spec:
- Motion tokens (durations, easings, transitions, stagger)
- Icon size tokens (xs through 2xl)
- Accessibility tokens (focus ring, touch targets)
- Density tokens (with scale-based padding)
- Fluid typography (Utopia-style clamp)
- Fluid spacing (with dramatic pairs)
- Breakpoint updates (add xs) and container query sizes
- Sound tokens (structure only)

Also add mode-specific overrides:
- dark.css: duration-scalar: 1 (enables motion in dark mode)
- Density classes: .density-compact, .density-comfortable
- Reduced motion: @media (prefers-reduced-motion) sets duration-scalar: 0

## Acceptance
- [x] Motion tokens defined (durations, easings, transitions, stagger)
- [x] Duration scalar pattern (0 light, 1 dark, 0 reduced-motion)
- [x] Icon size tokens (--icon-xs through --icon-2xl)
- [x] Focus ring tokens (width, offset, color)
- [x] Touch target tokens (min, default, comfortable)
- [x] Density tokens with scale-based padding
- [x] Lift/press distances for button animations
- [x] Fluid typography scale with clamp()
- [x] Fluid spacing scale with Utopia pairs
- [x] xs breakpoint added (360px)
- [x] Container query tokens defined
- [x] Sound token structure (placeholders)
- [x] Density classes activate via CSS
- [x] Reduced motion media query works

## Done summary
Added all new token systems to tokens.css and dark.css:

**tokens.css additions:**
- Motion: 5 durations, 5 easings, 3 transition shorthands, 4 stagger delays
- Duration scalar pattern (0 in light mode = instant transitions)
- Icon sizes: 6 sizes (12px-48px)
- Accessibility: focus ring tokens, 3 touch target sizes
- Density: scale + 5 padding sizes + lift/press distances
- Fluid typography: 8 clamp()-based sizes
- Fluid spacing: 9 base + 3 dramatic pairs
- Breakpoints: added xs (360px), updated to rem units
- Container queries: sm, md, lg sizes
- Sound: 7 volume levels + 4 category tokens (placeholders)

**dark.css additions:**
- duration-scalar: 1 in .dark (enables smooth transitions)
- .density-compact class (0.5x scale)
- .density-comfortable class (1.5x scale)
- @media (prefers-reduced-motion) sets duration-scalar: 0
## Evidence
- Commits:
- Tests:
- PRs: