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
TBD

## Evidence
- Commits:
- Tests:
- PRs:
