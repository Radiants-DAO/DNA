# fn-6.7 Button.tsx: Touch targets, motion tokens

## Description
TBD

## Acceptance
- [ ] TBD

## Done summary
- Added min-height: var(--touch-target-default) for WCAG-compliant 44px touch targets
- Migrated lift/press animation from Tailwind translate classes to CSS custom properties
- Used --transition-fast (respects duration-scalar: instant in light mode, animated in dark mode)
- Used --lift-distance and --press-distance for hover/active states (scales with density)

Why:
- Touch targets ensure accessibility compliance (WCAG 2.1 AA requires 44px)
- Motion tokens enable mode-aware animations (crisp in light, smooth in dark)

Verification:
- TypeScript compiled without errors (npx tsc --noEmit)
- Reviewed implementation follows epic spec patterns

Follow-ups:
- None required for this task
## Evidence
- Commits: 5ef9fd68ab4b802a843c0bf82bcf688608d9ab83
- Tests: npx tsc --noEmit
- PRs: