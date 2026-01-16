# fn-6.13 Tooltip.tsx: Mode-specific animation

## Description
Add mode-specific animation behavior to Tooltip.tsx. In light mode animations are instant (duration-scalar: 0), in dark mode use smooth fadeIn animation with the motion token system.

## Acceptance
- [x] Tooltip content uses motion token-based fadeIn animation
- [x] Animations respect --duration-scalar (instant in light, actual in dark)
- [x] Add mode-transition-interactive class for smooth theme switching
- [x] Document the mode-specific animation behavior in comments

## Done summary
Updated Tooltip.tsx to use mode-specific animations with motion token integration:

- Added comprehensive documentation block explaining mode-specific animation behavior
- Added animate-fadeIn class to tooltip content for mode-aware fade animation
- Added mode-transition-interactive class for smooth theme switching
- Animation classes already respect --duration-scalar from animations.css
- Light mode: instant appearance (scalar=0), dark mode: smooth animations (scalar=1)
- Reduced motion preference: always instant (scalar=0)
## Evidence
- Commits:
- Tests: N/A - CSS class additions only, visual verification required
- PRs: