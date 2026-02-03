# Flow

Visual context tool for AI-assisted web development.

## Development Setup

Flow is a self-contained workspace within the DNA monorepo. **Install and run from this directory, not the repo root.**

```bash
cd tools/flow
pnpm install
pnpm dev
```

## Packages

- `@flow/shared` - TypeScript types and message schemas
- `@flow/extension` - WXT Chrome extension with React 19 DevTools panel

## Loading the Extension

1. Run `pnpm dev` to start WXT dev server
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select `packages/extension/.output/chrome-mv3/`
