# fn-5.4 Project Detection + Dev Server Management

## Description

Detect Next.js projects and manage dev server lifecycle from RadFlow.

**Detection Algorithm:**
1. Read `package.json` from project root
2. Check for `next` in `dependencies` or `devDependencies`
3. Identify package manager from lockfile:
   - `pnpm-lock.yaml` → pnpm
   - `yarn.lock` → yarn
   - `package-lock.json` → npm
4. Extract dev command from `scripts.dev` (default: `next dev`)
5. Extract port from:
   - `scripts.dev` args (e.g., `next dev -p 3001`)
   - `next.config.js` if present
   - Default: 3000

**Tauri Commands:**
```rust
#[tauri::command]
async fn detect_project(path: String) -> Result<ProjectInfo, String>;

#[tauri::command]
async fn start_dev_server(path: String) -> Result<(), String>;

#[tauri::command]
async fn stop_dev_server() -> Result<(), String>;

#[tauri::command]
async fn get_dev_server_status() -> Result<ServerStatus, String>;
```

**Server Status:**
```typescript
type ServerStatus =
  | { state: 'stopped' }
  | { state: 'starting'; logs: string[] }
  | { state: 'running'; port: number; pid: number }
  | { state: 'error'; message: string; logs: string[] };
```

**Existing Server Detection:**
- Before starting, probe expected port with HTTP request
- If responsive, assume existing server and reuse
- Show warning in UI: "Using existing dev server on port 3000"

## Acceptance

- [ ] Detects Next.js from `package.json` dependencies
- [ ] Identifies package manager (pnpm/npm/yarn) from lockfile
- [ ] Extracts dev command and port from scripts/config
- [ ] Can start/stop dev server from RadFlow
- [ ] Captures stdout/stderr for error display
- [ ] Detects already-running server on expected port

## Files

- `src-tauri/src/commands/project.rs`
- `src-tauri/src/commands/dev_server.rs`
- `src/stores/slices/projectSlice.ts`
- `src/hooks/useDevServer.ts`

## Done summary
## Changes
- Added `src-tauri/src/commands/project.rs`: Project detection with Next.js, package manager detection (pnpm/yarn/npm), dev command + port extraction
- Added `src-tauri/src/commands/dev_server.rs`: Dev server lifecycle management with process spawning, stdout/stderr streaming, health checks
- Added `src/stores/slices/projectSlice.ts`: Zustand slice for project and server state
- Added `src/hooks/useDevServer.ts`: Hook for dev server events and status

## Why
- Enables RadFlow to open Next.js projects and manage their dev servers
- Detection algorithm identifies framework and package manager from lockfiles
- Server management supports detecting existing servers on expected port

## Verification
- Rust tests pass (17 tests)
- TypeScript type check passes
- All acceptance criteria met per fn-5.4 spec

## Follow-ups
- None
## Evidence
- Commits: 0fffda25bbbd7fe23457a78279ae5e480f77f6c4
- Tests: cargo test --lib
- PRs: