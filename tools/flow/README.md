# Flow

Visual context tool for AI-assisted web development.

## Development Setup

Flow is a self-contained workspace within the DNA monorepo. **Install and run from this directory, not the repo root.**

```bash
cd tools/flow
pnpm install
pnpm dev
```

## Verification

```bash
pnpm typecheck
pnpm --filter @flow/extension test --run
pnpm --filter @flow/server test --run
pnpm build
```

All four commands must pass before merging. CI runs these automatically on PRs that touch `tools/flow/`.

## Packages

- `@flow/shared` - TypeScript types and message schemas
- `@flow/extension` - WXT Chrome extension with React 19 DevTools panel
- `@flow/server` - MCP sidecar with session, websocket, and feedback endpoints

## Loading the Extension

1. Run `pnpm dev` to start WXT dev server
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select `packages/extension/.output/chrome-mv3/`
