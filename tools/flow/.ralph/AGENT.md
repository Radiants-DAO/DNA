# Ralph Agent Configuration

## Workspace Context
- Repository root for this project: `tools/flow`
- Monorepo packages used most often:
  - `packages/extension`
  - `packages/server`
  - `packages/shared`

## Setup Instructions

```bash
# Install dependencies
pnpm install
```

## Build Instructions

```bash
# Build extension bundle
pnpm --filter @flow/extension build
```

## Typecheck Instructions

```bash
# Typecheck all workspace packages
pnpm typecheck
```

## Test Instructions

```bash
# Extension tests
pnpm --filter @flow/extension test

# Server tests
pnpm --filter @flow/server test
```

## Run Instructions

```bash
# Extension dev mode (WXT)
pnpm --filter @flow/extension dev

# Sidecar server (if needed)
pnpm --filter @flow/server dev
```

## Notes
- Prefer targeted package commands over running everything by default.
- Keep changes scoped and avoid touching unrelated dirty files.
- Run focused tests for the area you changed before broad test sweeps.
