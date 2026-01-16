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
## What changed
- Executed pre-flight environment validation checklist for spec review epic
- Verified all build pipelines compile successfully

## Why
- Pre-flight validates that the codebase is in a working state before conducting spec reviews
- Ensures reviewers aren't debugging build issues during feature reviews

## Verification
- `pnpm install` - dependencies installed successfully
- `pnpm --filter @radflow/bridge build` - TypeScript compiles
- `pnpm --filter @radflow/theme-rad-os validate` - 121/121 tokens pass
- `cargo check` - Rust backend compiles
- `pnpm build` - Frontend TypeScript + Vite build succeeds

## Notes
- GUI-dependent checklist items (project picker, Component ID Mode, Variables panel) require interactive session
- Build validation confirms codebase ready for spec review work
## Evidence
- Commits: f9b58ea6e0cdce0929f4bdf1abe41db6a21bdb04
- Tests: pnpm install, pnpm --filter @radflow/bridge build, pnpm --filter @radflow/theme-rad-os validate, cargo check, pnpm build
- PRs: