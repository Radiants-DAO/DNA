# fn-3-y8e.2 Add motion tokens (duration, easing)

## Description
Add motion tokens per DNA spec (docs/theme-spec.md Section 8.1).

Add to `@theme` block:
```css
--duration-instant: 0ms;
--duration-fast: 100ms;
--duration-base: 150ms;
--duration-moderate: 200ms;
--duration-slow: 300ms;

--easing-default: cubic-bezier(0, 0, 0.2, 1);
--easing-out: cubic-bezier(0, 0, 0.2, 1);
--easing-in: cubic-bezier(0.4, 0, 1, 1);
```

Add reduced motion support at end of file.

**Important**: Motion tokens are DEFINED in this task but NOT APPLIED to components. Components keep existing durations for v1. Tokens enable future theming.
## Acceptance
- [ ] All duration tokens defined (instant through slow)
- [ ] All easing tokens defined (default, out, in)
- [ ] Reduced motion support added
- [ ] Tokens resolve without errors
## Done summary
Added three missing semantic tokens to tokens.css per DNA spec: --color-surface-tertiary (maps to sunset-fuzz), --color-content-secondary (maps to black, to be used with Tailwind opacity modifiers), and --color-action-destructive (maps to sun-red).
## Evidence
- Commits: ed3fae99415b4c9d9fe6a6e25a14e91f57e06739
- Tests: grep verification of token presence
- PRs: