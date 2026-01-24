# fn-2-zcd.16 Migrate Toast component to theme

## Description
TBD

## Acceptance
- [ ] TBD

## Done summary
Migrated Toast component to theme core package. Refactored to use flexible renderIcon/renderCloseIcon props instead of hard-coded Icon dependency, with a default SVG close icon fallback.
## Evidence
- Commits: ba96e58d
- Tests: pnpm exec tsc --noEmit
- PRs: