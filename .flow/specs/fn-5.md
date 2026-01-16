# fn-5 Target Project Integration

## Overview
Integrate a Next.js target project into RadFlow for local development by bundling
and injecting a RadFlow dev bridge package during the theme-building process.
The bridge is installed on first open/import, is dev-only, and can be ignored
for commits.

## Scope
- Next.js-only target projects
- Dev-time integration only (no production builds)
- Component-isolated rendering and inspection
- Local server orchestration (RadFlow can abstract startup and ports)
- Bundled bridge package installed on first open/import

## Approach
1. Bundle a RadFlow dev bridge package into the theme-building workflow so
   RadFlow can install it when a new client project is opened.
2. Use a Next.js dev-time hook (config wrapper or local proxy) to inject the
   bridge script and expose a local metadata endpoint.
3. Provide a component registry mechanism for isolated rendering in RadFlow.
4. Mark the bridge package as dev-only and optionally add to .gitignore.

## Quick commands
<!-- Required: at least one smoke command for the repo -->
- `pnpm test`

## Acceptance
- [ ] Opening a new Next.js client project installs the RadFlow bridge locally
- [ ] RadFlow loads isolated components via the bridge in dev mode
- [ ] Bridge installation can be excluded from commits via .gitignore
- [ ] No production build requirements

## References
- docs/reference/component-editor-patterns.md
