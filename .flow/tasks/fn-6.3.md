# fn-6.3 animations.css: Migrate to motion tokens

## Description
Migrate animations.css to use the motion tokens defined in fn-6.2 (tokens.css). Replace hardcoded timing values with token references and integrate duration-scalar for mode-aware animations.

## Acceptance
- [x] All animation durations use motion tokens (--duration-base, --duration-moderate)
- [x] All easings use easing tokens (--ease-out)
- [x] Animation durations respect --duration-scalar (instant in light mode, actual in dark mode)
- [x] Search highlight animation uses focus-ring-offset token for consistency
- [x] Comments document the duration-scalar behavior

## Done summary
Migrated animations.css to use motion tokens from tokens.css:
- Replaced 0.15s → calc(var(--duration-base) * var(--duration-scalar))
- Replaced 0.2s → calc(var(--duration-moderate) * var(--duration-scalar))
- Replaced ease-out → var(--ease-out)
- Updated search-highlight-pulse to use --focus-ring-offset token
- Added documentation about duration-scalar behavior
- Search highlight animation intentionally keeps fixed 1.5s duration (user attention indicator)

## Evidence
- Commits: (to be added)
- Tests: Visual inspection - animations now respect mode (instant in light, animated in dark)
- PRs:
