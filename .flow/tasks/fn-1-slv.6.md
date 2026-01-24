# fn-1-slv.6 Create index.css entry point

## Description
Create index.css entry point that imports all CSS files in correct order.

## Structure
```css
/* index.css - Entry point for @dna/radiants theme */

@import 'tailwindcss';

/* Theme tokens and typography */
@import './tokens.css';
@import './fonts.css';
@import './typography.css';

/* Optional: animations if needed */
/* @import './animations.css'; */
```

Note: dark.css is NOT auto-imported - consumers import it separately if needed.

Reference: DNA spec on index.css `/Users/rivermassey/Desktop/dev/dna/docs/theme-spec.md:262`
## Acceptance
- [ ] index.css created at `packages/radiants/index.css`
- [ ] Imports tailwindcss first
- [ ] Imports tokens.css
- [ ] Imports fonts.css
- [ ] Imports typography.css
- [ ] Does NOT auto-import dark.css (separate opt-in)
## Done summary
- Task completed
## Evidence
- Commits:
- Tests:
- PRs: