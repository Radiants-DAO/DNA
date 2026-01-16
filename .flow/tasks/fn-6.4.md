# fn-6.4 dark.css: Add mode-specific transitions

## Description
Add CSS transition utilities to dark.css that enable smooth color transitions when switching between light and dark mode. These transitions use the motion tokens from tokens.css and respect the `--duration-scalar` pattern (instant in light mode, animated in dark mode).

## Acceptance
- [x] Define mode transition CSS custom properties on :root and .dark
- [x] Create `.mode-transition` utility class for general color transitions
- [x] Create `.mode-transition-surface` for background/shadow transitions
- [x] Create `.mode-transition-content` for text/icon transitions
- [x] Create `.mode-transition-edge` for border transitions
- [x] Create `.mode-transition-interactive` for combined interactive element transitions
- [x] All transitions respect `--duration-scalar` (instant in light, animated in dark)
- [x] All transitions use motion tokens from tokens.css

## Done summary
Added mode-specific transition utilities to dark.css that enable smooth color transitions when toggling between light and dark mode. Created CSS custom properties (`--mode-transition-duration`, `--mode-transition-timing`, `--mode-transition-colors`) and five utility classes for different use cases: surface, content, edge, interactive, and general-purpose transitions.
## Evidence
- Commits:
- Tests:
- PRs: