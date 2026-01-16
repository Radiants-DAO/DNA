# fn-5.4 Script injection setup (RadFlow Bridge Package)

## Description
Set up the RadFlow dev bridge for Next.js by installing a local dev-only package
and configuring injection via a Next.js config wrapper.

**Bridge Installation Mechanism:**
- RadFlow ships `@radflow/bridge` inside the app bundle (DMG)
- On first project open, RadFlow runs `pnpm add -D "file:.radflow/bridge"`
- Bridge is copied to `.radflow/bridge/` in the target project
- Add `.radflow/` to `.gitignore` to exclude from commits

**Next.js Integration:**
- `withRadflow()` wrapper pattern (like `@next/bundle-analyzer`)
- Injects dev-only middleware for script injection
- Adds `/__radflow` metadata endpoint
- Works with stock Next.js dev server

## Acceptance
- [ ] Bridge package bundled in RadFlow app
- [ ] First open copies bridge to `.radflow/bridge/`
- [ ] `pnpm add -D "file:.radflow/bridge"` executes successfully
- [ ] `.gitignore` updated with `.radflow/` entry
- [ ] `withRadflow()` wrapper documented
- [ ] Bridge script injected in dev HTML reliably
- [ ] `/__radflow` endpoint returns component metadata

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
