# fn-7.28 Theme Integration - Import theme-rad-os tokens into RadFlow UI

## Description
Import the theme-rad-os design tokens from `packages/theme-rad-os/` into the main
RadFlow app. Currently `src/index.css` has a minimal hardcoded theme - this should
use the full fn-6 token system.

**Current state:**
- `src/index.css` has inline `@theme {}` with hardcoded colors
- `packages/theme-rad-os/tokens.css` has full token system (unused)

**Target state:**
- RadFlow UI uses tokens from theme-rad-os
- All design panels show actual tokens from the loaded theme
- fn-7 spec requirement: "All UI uses fn-6 design tokens"

**Implementation:**
```css
/* src/index.css */
@import "tailwindcss";
@import "../packages/theme-rad-os/tokens.css";
@import "../packages/theme-rad-os/typography.css";
/* Remove inline @theme {} block */
```

## Acceptance
- [ ] theme-rad-os tokens imported into RadFlow app
- [ ] Inline @theme block in index.css removed
- [ ] UI renders with theme-rad-os colors/spacing/typography
- [ ] No visual regressions (colors should be similar or better)
- [ ] TypeScript/Vite build succeeds

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
