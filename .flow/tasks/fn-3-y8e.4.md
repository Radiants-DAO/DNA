# fn-3-y8e.4 Update dark.css with new token overrides

## Description
Update dark mode with explicit overrides for new semantic tokens.

Add to `packages/radiants/dark.css`:
```css
.dark {
  /* New tokens from Task 1 */
  --color-surface-tertiary: var(--color-sunset-fuzz);  /* May adjust for dark */
  --color-content-secondary: var(--color-cream);  /* Base for opacity modifiers in dark */
  --color-action-destructive: var(--color-sun-red);  /* Usually same in dark */
}
```

Verify WCAG contrast for new tokens in dark mode.
## Acceptance
- [ ] --color-surface-tertiary has dark override
- [ ] --color-content-secondary has dark override
- [ ] --color-action-destructive has dark override (if needed)
- [ ] Dark mode contrast meets WCAG AA
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
