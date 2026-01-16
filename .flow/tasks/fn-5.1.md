# fn-5.1 Bridge Package + Next.js Wrapper

## Description

Build the `@radflow/bridge` package with `withRadflow()` config wrapper for Next.js integration.

**Package Structure:**
```
@radflow/bridge/
├── package.json
├── src/
│   ├── index.ts           # Entry point, installs hook
│   ├── fiber-hook.ts      # __REACT_DEVTOOLS_GLOBAL_HOOK__ integration
│   ├── component-map.ts   # Map management + source resolution
│   ├── dom-annotator.ts   # data-radflow-id injection
│   ├── message-bridge.ts  # postMessage handler
│   └── types.ts           # Shared types
├── next.config.wrapper.ts # withRadflow() export
└── tsconfig.json
```

**withRadflow() Pattern:**
```javascript
// next.config.js
const { withRadflow } = require('@radflow/bridge');

module.exports = withRadflow({
  // existing config
});
```

**Injection Mechanism:**
- Use Next.js webpack config hook to inject bridge script
- Dev mode only (check `process.env.NODE_ENV`)
- Try known client entries (`main-app`, `main`, `webpack`) in order
- Log warning and fail visibly if no known entry found (don't inject blindly)

**Health Endpoint (created by bridge installer, NOT withRadflow):**
- Bridge installer creates `app/api/__radflow/health/route.ts` (App Router)
- Or `pages/api/__radflow/health.ts` (Pages Router, if detected)
- API route avoids middleware.ts conflicts
- Returns `{ ok: true, version: string, timestamp: number }`

## Acceptance

- [ ] Package builds and can be installed via `file:` protocol
- [ ] `withRadflow()` injects bridge script in dev mode only
- [ ] Injection logs entry name on success (`[RadFlow] Injected into: main-app`)
- [ ] Injection logs warning on failure (no silent failures)
- [ ] Bridge installer creates `app/api/__radflow/health/route.ts`
- [ ] `/__radflow/health` endpoint returns `{ ok: true, version: string }`
- [ ] No injection in production builds
- [ ] Works with Next.js 14+ App Router

## Files

- `packages/bridge/` (new directory)
- `packages/bridge/package.json`
- `packages/bridge/src/index.ts`
- `packages/bridge/src/types.ts`
- `packages/bridge/next.config.wrapper.ts`
- `packages/bridge/templates/health-route-app.ts` (template for App Router)
- `packages/bridge/templates/health-route-pages.ts` (template for Pages Router)
- Build script to copy bridge into Tauri bundle

## Done summary

TBD

## Evidence

- Commits:
- Tests:
- PRs:
