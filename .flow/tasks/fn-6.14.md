# fn-6.14 Badge.tsx: Icon size token integration

## Description
TBD

## Acceptance
- [ ] TBD

## Done summary
## Summary

Added icon size token integration to Badge.tsx:

1. **New `iconName` prop**: String prop that renders icons using the Icon component with token-based sizing
2. **New `iconSize` prop**: Optional override for icon size using IconSize type ('xs', 'sm', 'md', 'lg', 'xl', '2xl')
3. **BADGE_ICON_SIZES mapping**: Default icon sizes per badge size:
   - `sm` badge → `xs` icon (12px)
   - `md` badge → `sm` icon (16px)
4. **Backward compatible**: Existing `icon` prop still works for custom React nodes (emojis, custom components)

The implementation ensures icons in badges use consistent token-based sizing aligned with the design system.
## Evidence
- Commits:
- Tests:
- PRs: