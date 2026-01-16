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

### Bridge Package Installation
1. RadFlow ships `@radflow/bridge` inside the app bundle (DMG)
2. On first project open, copy bridge to `.radflow/bridge/` in target project
3. Run `pnpm add -D "file:.radflow/bridge"` to install locally
4. Add `.radflow/` to `.gitignore` (avoids registry/version issues, works offline)

### Next.js Integration
1. `withRadflow()` config wrapper (like `@next/bundle-analyzer` pattern)
2. Injects dev-only middleware for script injection + `/__radflow` metadata endpoint
3. Works with stock Next.js dev server (no custom server required)

### React DevTools Hook
1. Hook into `window.__REACT_DEVTOOLS_GLOBAL_HOOK__` for fiber inspection
2. Chain existing hooks if browser DevTools present (don't replace)
3. Walk fiber tree on commit, add `data-radflow-id` to DOM elements
4. Build `componentMap` for element → component lookup

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
