# fn-8.19 Pre-flight Check - Environment Validation

## Description
Validate environment before starting reviews.

### Checklist
- [ ] RadFlow builds: `pnpm install && pnpm tauri dev`
- [ ] Bridge package compiles: `pnpm --filter @radflow/bridge build`
- [ ] Theme package compiles: `pnpm --filter @radflow/theme-rad-os build`
- [ ] Can open project picker and select theme-rad-os
- [ ] Dev server starts on localhost
- [ ] No console errors on startup
- [ ] Press V → Component ID Mode activates
- [ ] Open Variables panel → tokens load

**If any fail, STOP and fix before proceeding.**

### Time Estimate
30 minutes
## Acceptance
- [ ] TBD

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
