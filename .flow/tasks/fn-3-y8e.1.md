# fn-3-y8e.1 Add missing semantic tokens to tokens.css

## Description
Add missing semantic tokens per DNA spec (docs/theme-spec.md Section 3.3).

Add to `@theme` block:
```css
--color-surface-tertiary: var(--color-sunset-fuzz);
--color-content-secondary: var(--color-black);  /* Use with opacity modifier: text-content-secondary/70 */
--color-action-destructive: var(--color-sun-red);
```

**Opacity Strategy**: Use Tailwind opacity modifiers on semantic tokens:
- `text-content-primary/70` instead of baked-in opacity
- `bg-surface-primary/50` for semi-transparent backgrounds

Components should use patterns like `text-content-secondary/70` instead of creating new tokens like `--color-black-60`.
## Acceptance
- [ ] `--color-surface-tertiary` defined
- [ ] `--color-content-secondary` defined (base color, use with /opacity)
- [ ] `--color-action-destructive` defined
- [ ] All tokens resolve without errors
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
