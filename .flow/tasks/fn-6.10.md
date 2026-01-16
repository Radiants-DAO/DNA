# fn-6.10 Dialog.tsx: Mode-specific animation

## Description
Add mode-specific animation behavior to Dialog.tsx. In light mode animations are instant (duration-scalar: 0), in dark mode use smooth transform animations with the motion token system.

## Acceptance
- [x] Dialog overlay uses motion token-based fadeIn animation
- [x] Dialog content uses motion token-based scaleIn animation
- [x] Animations respect --duration-scalar (instant in light, actual in dark)
- [x] Add mode-transition classes for smooth theme switching
- [x] Document the mode-specific animation behavior in comments

## Done summary
Updated Dialog.tsx to use mode-specific animations with motion token integration:

- Added comprehensive documentation block explaining mode-specific animation behavior
- Added mode-transition-surface class to overlay for smooth theme switching
- Added mode-transition-interactive class to content for interactive element transitions
- Animation classes (animate-fadeIn, animate-scaleIn) already respect --duration-scalar
- Light mode: instant appearance (scalar=0), dark mode: smooth animations (scalar=1)
- Reduced motion preference: always instant (scalar=0)
## Evidence
- Commits:
- Tests: N/A - CSS class additions only, visual verification required
- PRs: