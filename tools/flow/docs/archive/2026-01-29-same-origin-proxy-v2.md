# Same-Origin Proxy for Target App Iframe — Implementation Plan (v2)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Proxy target app dev servers through Vite so the preview iframe is same-origin, enabling `contentDocument` access for CommentMode element detection, fiber parsing, and direct DOM inspection. Also fix the prerequisite bug: `targetUrl` is never set from the dev server flow, so PreviewCanvas never renders.

**User story:** A designer using RadFlow selects an app in the workspace. The dev server starts, PreviewCanvas renders the target app in an iframe at `/target/`, and CommentMode can access `iframe.contentDocument.elementFromPoint()` because the iframe is same-origin with the Vite host (`localhost:1420`).

**Architecture:** Add a custom Vite `configureServer` middleware that proxies `/target/*` requests to the active target app's dev server. The target port is read dynamically from a temp file (written by the frontend via Tauri command when the dev server becomes ready). Fix `useDevServerReady` in `EditorLayout` to also call `setTargetUrl("/target/")`, which activates PreviewCanvas. Update `targetOrigin` derivation to recognize proxy paths as same-origin.

**Tech Stack:** Vite 7 (configureServer), React 19, TypeScript 5.8, Tauri 2, Zustand 5

**Prerequisite bug:** `targetUrl` (in `canvasSlice`) is never set from the dev server flow. `EditorLayout.useDevServerReady` sets `componentPreviewServerUrl` and `pagePreviewUrl` but not `targetUrl`. Since `hasLivePreview = !!targetUrl`, PreviewCanvas never renders. The `PageNavDropdown` in SettingsBar only appears when `targetUrl` is already truthy — a dead code path. This plan fixes this as Task 1.

---

## Scope Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Proxy mechanism | Custom Vite middleware | Static proxy can't handle app switching (port changes) |
| URL path prefix | `/target/` | Clear namespace, no collision with RadFlow routes |
| HMR WebSocket | Proxied via ws upgrade handler | Target app HMR must work through proxy |
| Port source | File-based (`{tmpdir}/radflow-proxy-target.json`) | Vite middleware (Node) can't access Zustand (browser) |
| Fallback | Bridge still works cross-origin via postMessage | Graceful degradation if proxy fails |

---

## Current State

```
selectApp() → detectProject → startDevServer → pollServerReady
  ↓
serverStatus becomes "running"
  ↓
EditorLayout.useDevServerReady fires:
  → setComponentPreviewServerUrl("http://localhost:3002")    ← ComponentCanvas iframes
  → setPagePreviewUrl("http://localhost:3002")               ← PagePreviewCard iframe
  → ❌ targetUrl is NEVER set
  ↓
EditorLayout: hasLivePreview = !!targetUrl = false
  → renders ComponentCanvas (default), NOT PreviewCanvas
  ↓
PreviewCanvas never mounts → no iframe → no bridge → no CommentMode on target
```

**After this plan:**

```
selectApp() → detectProject → startDevServer → pollServerReady
  ↓
serverStatus becomes "running"
  ↓
EditorLayout.useDevServerReady fires:
  → setComponentPreviewServerUrl("http://localhost:3002")
  → setPagePreviewUrl("http://localhost:3002")
  → writeProxyTarget(3002)                                   ← NEW
  → setTargetUrl("/target/")                                 ← NEW (activates PreviewCanvas)
  ↓
EditorLayout: hasLivePreview = !!targetUrl = true
  → renders PreviewCanvas
  ↓
PreviewCanvas: <iframe src="/target/" />
  → browser requests localhost:1420/target/ → Vite middleware → localhost:3002/
  → same-origin → contentDocument accessible ✓
  ↓
Bridge PING/PONG works (same origin: localhost:1420)
CommentMode: iframe.contentDocument.elementFromPoint() ✓
```

---

## Task 1: Fix targetUrl — Set It When Dev Server Starts

**Files:**
- Modify: `tools/flow/app/components/layout/EditorLayout.tsx` (lines 46-52)

**What:** `useDevServerReady` sets `componentPreviewServerUrl` and `pagePreviewUrl` but not `targetUrl`. Add `setTargetUrl` call so `hasLivePreview` becomes true and PreviewCanvas renders.

**Step 1: Add setTargetUrl to useDevServerReady callback**

In `EditorLayout.tsx`, replace lines 41-52:

```typescript
  // Wire dev server → preview URLs
  const setPreviewServerUrl = useAppStore((s) => s.setComponentPreviewServerUrl);
  const setPagePreviewUrl = useAppStore((s) => s.setPagePreviewUrl);
  const setTargetUrl = useAppStore((s) => s.setTargetUrl);
  const project = useAppStore((s) => s.project);

  useDevServerReady(useCallback(() => {
    if (project) {
      const url = `http://localhost:${project.devPort}`;
      setPreviewServerUrl(url);
      setPagePreviewUrl(url);
      // Activate PreviewCanvas with direct URL (proxy path added in Task 5)
      setTargetUrl(url);
    }
  }, [project, setPreviewServerUrl, setPagePreviewUrl, setTargetUrl]));
```

**Step 2: Clear targetUrl on app switch**

In `tools/flow/app/stores/slices/workspaceSlice.ts`, add `setTargetUrl(null)` where preview URLs are cleared:

In `selectTheme` (~line 305-306), after the existing clears:

```typescript
      get().setComponentPreviewServerUrl(null);
      get().setPagePreviewUrl(null);
      get().setTargetUrl(null);  // ← ADD
```

In `selectApp` (~line 352-353), after the existing clears:

```typescript
      get().setComponentPreviewServerUrl(null);
      get().setPagePreviewUrl(null);
      get().setTargetUrl(null);  // ← ADD
```

**Step 3: Verify typecheck**

Run: `cd tools/flow && pnpm typecheck`
Expected: No errors.

**Step 4: Verify PreviewCanvas renders**

Run: `cd tools/flow && pnpm tauri dev`
Select an app → dev server starts → PreviewCanvas should now render with iframe.
(It will be cross-origin at this point — that's expected. Proxy comes in Task 3.)

**Step 5: Commit**

```bash
git add tools/flow/app/components/layout/EditorLayout.tsx tools/flow/app/stores/slices/workspaceSlice.ts
git commit -m "fix(flow): set targetUrl when dev server starts so PreviewCanvas renders"
```

**Acceptance criteria:**
- `targetUrl` is set to `http://localhost:{port}` when server becomes ready
- `hasLivePreview` is true → PreviewCanvas renders
- `targetUrl` is cleared to null when switching apps (before new server starts)
- `PageNavDropdown` in SettingsBar becomes visible (it gates on `targetUrl`)

---

## Task 2: Add Tauri Commands for Proxy Config File

**Files:**
- Create: `tools/flow/tauri/src/commands/proxy.rs`
- Modify: `tools/flow/tauri/src/commands/mod.rs`
- Modify: `tools/flow/tauri/src/lib.rs`

**What:** The Vite proxy middleware (Node) needs to know which port to forward to. The browser can't write files directly, so we add Tauri commands to write/clear a JSON config in the system temp directory.

**Step 1: Create proxy.rs**

Create `tools/flow/tauri/src/commands/proxy.rs`:

```rust
use std::fs;
use std::env;

/// Write proxy target config to temp file.
/// Called by frontend when dev server becomes ready.
#[tauri::command]
#[specta::specta]
pub fn write_proxy_target(config: String) -> Result<(), String> {
    let path = env::temp_dir().join("radflow-proxy-target.json");
    fs::write(&path, config).map_err(|e| format!("Failed to write proxy config: {e}"))?;
    Ok(())
}

/// Clear proxy target config.
/// Called when switching apps or stopping dev server.
#[tauri::command]
#[specta::specta]
pub fn clear_proxy_target() -> Result<(), String> {
    let path = env::temp_dir().join("radflow-proxy-target.json");
    if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("Failed to remove proxy config: {e}"))?;
    }
    Ok(())
}
```

**Step 2: Register in mod.rs**

In `tools/flow/tauri/src/commands/mod.rs`, add:

```rust
pub mod proxy;
```

**Step 3: Register commands in lib.rs**

In `tools/flow/tauri/src/lib.rs`, add `proxy::write_proxy_target` and `proxy::clear_proxy_target` to the `invoke_handler` list.

**Step 4: Verify Rust compiles**

Run: `cd tools/flow/tauri && cargo check`
Expected: No errors.

**Step 5: Commit**

```bash
git add tools/flow/tauri/src/commands/proxy.rs tools/flow/tauri/src/commands/mod.rs tools/flow/tauri/src/lib.rs
git commit -m "feat(flow): add Tauri commands for proxy target config"
```

**Acceptance criteria:**
- `write_proxy_target` writes JSON to `{tmpdir}/radflow-proxy-target.json`
- `clear_proxy_target` removes the file
- `cargo check` passes

---

## Task 3: Add Dynamic Proxy Middleware to Vite

**Files:**
- Create: `tools/flow/vite-proxy-middleware.ts`
- Modify: `tools/flow/vite.config.ts`
- Modify: `tools/flow/package.json` (add `http-proxy` devDep)

**What:** Install a custom Vite middleware that proxies `/target/*` requests to the active target app's dev server. Reads the target port from the temp file written by Task 2's Tauri commands. Also handles WebSocket upgrades for HMR proxying.

**Step 1: Install http-proxy**

Run: `cd tools/flow && pnpm add -D http-proxy @types/http-proxy`

**Step 2: Create vite-proxy-middleware.ts**

Create `tools/flow/vite-proxy-middleware.ts`:

```typescript
/**
 * Dynamic proxy middleware for Vite dev server.
 *
 * Proxies /target/* requests to the active target app's dev server.
 * Reads the target port from a temp file written by the frontend
 * when a dev server becomes ready.
 *
 * Why a file? Vite middleware runs in Node, Zustand state lives in the
 * browser — there's no direct IPC. A temp file is the simplest bridge.
 */

import { readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import type { Connect } from "vite";
import httpProxy from "http-proxy";

const CONFIG_PATH = join(tmpdir(), "radflow-proxy-target.json");
const PREFIX = "/target";

interface ProxyConfig {
  port: number;
  timestamp: number;
}

function readProxyConfig(): ProxyConfig | null {
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(raw) as ProxyConfig;
  } catch {
    return null;
  }
}

export function createTargetProxyMiddleware(): Connect.NextHandleFunction {
  const proxy = httpProxy.createProxyServer({
    ws: true,
    changeOrigin: true,
    selfHandleResponse: false,
  });

  proxy.on("error", (err, _req, res) => {
    console.error("[RadFlow proxy] Error:", err.message);
    if (res && "writeHead" in res) {
      (res as any).writeHead(502, { "Content-Type": "text/plain" });
      (res as any).end(`RadFlow proxy error: target app not reachable\n${err.message}`);
    }
  });

  return (req, res, next) => {
    if (!req.url?.startsWith(PREFIX)) {
      return next();
    }

    const config = readProxyConfig();
    if (!config) {
      (res as any).writeHead(503, { "Content-Type": "text/plain" });
      (res as any).end("RadFlow proxy: no target app configured. Start a dev server first.");
      return;
    }

    // Strip /target prefix
    req.url = req.url.slice(PREFIX.length) || "/";

    proxy.web(req, res, {
      target: `http://localhost:${config.port}`,
    });
  };
}

export function createTargetProxyWsHandler() {
  const proxy = httpProxy.createProxyServer({ ws: true, changeOrigin: true });

  proxy.on("error", (err) => {
    console.error("[RadFlow proxy] WS error:", err.message);
  });

  return (req: any, socket: any, head: any) => {
    if (!req.url?.startsWith(PREFIX)) return;

    const config = readProxyConfig();
    if (!config) return;

    req.url = req.url.slice(PREFIX.length) || "/";

    proxy.ws(req, socket, head, {
      target: `http://localhost:${config.port}`,
    });
  };
}
```

**Step 3: Install middleware in vite.config.ts**

Replace `tools/flow/vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createTargetProxyMiddleware, createTargetProxyWsHandler } from "./vite-proxy-middleware";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "radflow-target-proxy",
      configureServer(server) {
        server.middlewares.use(createTargetProxyMiddleware());

        const wsHandler = createTargetProxyWsHandler();
        server.httpServer?.on("upgrade", (req, socket, head) => {
          if (req.url?.startsWith("/target")) {
            wsHandler(req, socket, head);
          }
        });
      },
    },
  ],

  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/tauri/**"],
    },
  },
}));
```

**Step 4: Verify Vite starts**

Run: `cd tools/flow && pnpm dev` (Ctrl+C after startup)
Expected: No errors. Requests to `http://localhost:1420/target/` return 503 (no target configured yet).

**Step 5: Commit**

```bash
git add tools/flow/vite-proxy-middleware.ts tools/flow/vite.config.ts tools/flow/package.json pnpm-lock.yaml
git commit -m "feat(flow): add dynamic Vite proxy middleware for target app"
```

**Acceptance criteria:**
- Vite starts without errors
- `/target/` returns 503 when no config file exists
- No interference with normal Vite routes (`/`, HMR, etc.)

---

## Task 4: Write Proxy Config and Set Proxy URL from Frontend

**Files:**
- Create: `tools/flow/app/utils/proxyTarget.ts`
- Modify: `tools/flow/app/components/layout/EditorLayout.tsx`
- Modify: `tools/flow/app/stores/slices/workspaceSlice.ts`

**What:** When the dev server becomes ready, write the port to the proxy config file (via Tauri command) and set `targetUrl` to the proxy path `/target/` instead of the direct URL. Clear on app switch.

**Step 1: Create proxyTarget utility**

Create `tools/flow/app/utils/proxyTarget.ts`:

```typescript
import { invoke } from "@tauri-apps/api/core";

export async function writeProxyTarget(port: number): Promise<void> {
  const config = JSON.stringify({ port, timestamp: Date.now() });
  try {
    await invoke("write_proxy_target", { config });
    console.log(`[proxyTarget] Set proxy target to port ${port}`);
  } catch (err) {
    console.error("[proxyTarget] Failed to write proxy config:", err);
  }
}

export async function clearProxyTarget(): Promise<void> {
  try {
    await invoke("clear_proxy_target");
    console.log("[proxyTarget] Cleared proxy target");
  } catch (err) {
    console.error("[proxyTarget] Failed to clear proxy config:", err);
  }
}
```

**Step 2: Update EditorLayout to write proxy config and use proxy path**

Replace the `useDevServerReady` block in `EditorLayout.tsx` (the version from Task 1):

```typescript
  // Wire dev server → preview URLs + proxy
  const setPreviewServerUrl = useAppStore((s) => s.setComponentPreviewServerUrl);
  const setPagePreviewUrl = useAppStore((s) => s.setPagePreviewUrl);
  const setTargetUrl = useAppStore((s) => s.setTargetUrl);
  const project = useAppStore((s) => s.project);

  useDevServerReady(useCallback(() => {
    if (project) {
      const url = `http://localhost:${project.devPort}`;
      setPreviewServerUrl(url);
      setPagePreviewUrl(url);

      // Write proxy config so Vite middleware knows which port to forward to
      writeProxyTarget(project.devPort);

      // Set targetUrl to proxy path (same-origin with Vite at localhost:1420)
      setTargetUrl("/target/");
    }
  }, [project, setPreviewServerUrl, setPagePreviewUrl, setTargetUrl]));
```

Add import at top:

```typescript
import { writeProxyTarget } from "../../utils/proxyTarget";
```

**Step 3: Clear proxy on app switch**

In `workspaceSlice.ts`, update the clear blocks.

In `selectTheme` (~line 305-306):

```typescript
      get().setComponentPreviewServerUrl(null);
      get().setPagePreviewUrl(null);
      get().setTargetUrl(null);
      clearProxyTarget();
```

In `selectApp` (~line 352-353):

```typescript
      get().setComponentPreviewServerUrl(null);
      get().setPagePreviewUrl(null);
      get().setTargetUrl(null);
      clearProxyTarget();
```

Add import at top of workspaceSlice.ts:

```typescript
import { clearProxyTarget } from "../../utils/proxyTarget";
```

**Step 4: Verify typecheck**

Run: `cd tools/flow && pnpm typecheck`

**Step 5: Commit**

```bash
git add tools/flow/app/utils/proxyTarget.ts tools/flow/app/components/layout/EditorLayout.tsx tools/flow/app/stores/slices/workspaceSlice.ts
git commit -m "feat(flow): write proxy config and use proxy path for targetUrl"
```

**Acceptance criteria:**
- When dev server starts, proxy config is written with correct port
- `targetUrl` is set to `/target/` (not `http://localhost:{port}`)
- Config is cleared when switching apps
- `pnpm typecheck` passes

---

## Task 5: Update PreviewCanvas Origin for Same-Origin Proxy

**Files:**
- Modify: `tools/flow/app/components/layout/PreviewCanvas.tsx`

**What:** `targetOrigin` is derived from `targetUrl` via `new URL(targetUrl).origin`. With proxy path `/target/`, `new URL("/target/")` throws. Update to recognize proxy paths as same-origin.

**Step 1: Update targetOrigin derivation**

In `PreviewCanvas.tsx`, replace the `targetOrigin` memo (~lines 80-87):

```typescript
  const targetOrigin = useMemo(() => {
    if (!targetUrl) return "";
    // Proxy path (/target/...) → same origin as host
    if (targetUrl.startsWith("/")) {
      return window.location.origin;
    }
    // Direct URL fallback (http://localhost:3002)
    try {
      return new URL(targetUrl).origin;
    } catch {
      return "";
    }
  }, [targetUrl]);
```

**Step 2: Verify typecheck**

Run: `cd tools/flow && pnpm typecheck`

**Step 3: Commit**

```bash
git add tools/flow/app/components/layout/PreviewCanvas.tsx
git commit -m "feat(flow): handle proxy path in targetOrigin derivation"
```

**Acceptance criteria:**
- `/target/` → `window.location.origin` (e.g., `http://localhost:1420`)
- Direct URL fallback still works
- Bridge `postMessage` origin validation works with same-origin

---

## Task 6: Update SettingsBar PageNavDropdown for Proxy Paths

**Files:**
- Modify: `tools/flow/app/components/layout/SettingsBar.tsx`

**What:** `PageNavDropdown` (inside SettingsBar) reads `targetUrl` and builds URLs with `new URL(targetUrl).origin`. With proxy paths, this breaks. Update the `navigateTo` helper.

**Step 1: Update navigateTo in PageNavDropdown**

In `SettingsBar.tsx`, find the `navigateTo` function inside `PageNavDropdown` (~line 426-437). The `baseUrl` derivation currently does `new URL(targetUrl).origin` which throws on `/target/`. Replace:

```typescript
    const navigateTo = (path: string) => {
      // Proxy path: targetUrl is "/target/" or "/target/about"
      // Direct URL: targetUrl is "http://localhost:3002"
      let baseUrl: string;
      if (targetUrl.startsWith("/")) {
        baseUrl = "/target";
      } else {
        try {
          baseUrl = new URL(targetUrl).origin;
        } catch {
          return;
        }
      }
      setTargetUrl(`${baseUrl}${path}`);
    };
```

**Step 2: Verify typecheck**

Run: `cd tools/flow && pnpm typecheck`

**Step 3: Commit**

```bash
git add tools/flow/app/components/layout/SettingsBar.tsx
git commit -m "feat(flow): update PageNavDropdown for proxy path URLs"
```

**Acceptance criteria:**
- Navigating to `/about` with proxy sets `targetUrl` to `/target/about`
- Direct URL fallback still works
- No crash on `new URL()` with relative paths

---

## Task 7: Clean Up on App Exit

**Files:**
- Modify: `tools/flow/tauri/src/lib.rs`

**What:** Remove the proxy config temp file when the app closes, so stale configs don't confuse future sessions.

**Step 1: Add window event handler**

In `tools/flow/tauri/src/lib.rs`, add to the builder chain:

```rust
.on_window_event(|window, event| {
    if let tauri::WindowEvent::Destroyed = event {
        let path = std::env::temp_dir().join("radflow-proxy-target.json");
        let _ = std::fs::remove_file(path);
    }
})
```

**Step 2: Verify Rust compiles**

Run: `cd tools/flow/tauri && cargo check`

**Step 3: Commit**

```bash
git add tools/flow/tauri/src/lib.rs
git commit -m "feat(flow): clean up proxy config on app exit"
```

**Acceptance criteria:**
- Temp file is removed when window closes
- No error if file doesn't exist (silent fail via `let _`)

---

## Task 8: End-to-End Verification

**Step 1: Build and start**

```bash
# Terminal 1: Target app (must have withRadflow() configured)
cd apps/rad-os && pnpm dev

# Terminal 2: RadFlow
cd tools/flow && pnpm tauri dev
```

**Step 2: Test checklist**

- [ ] RadFlow starts, Vite shows no proxy errors
- [ ] Select rad-os app → dev server starts
- [ ] `targetUrl` is set (verify: PageNavDropdown appears in SettingsBar)
- [ ] PreviewCanvas renders (not ComponentCanvas)
- [ ] iframe loads via proxy (network tab: request to `localhost:1420/target/`)
- [ ] Bridge status shows "connected" (PING/PONG through same-origin)
- [ ] Enter comment mode (C key)
- [ ] Hover elements in iframe → can identify them (proves `contentDocument` access)
- [ ] Click element → comment popover opens with component name
- [ ] HMR: Edit file in rad-os → iframe updates without full reload
- [ ] Navigate to different route via PageNavDropdown → iframe URL updates to `/target/{route}`
- [ ] Switch apps → preview clears → new server starts → new preview loads
- [ ] Quit RadFlow → temp file cleaned up

**Step 3: Verify cross-origin fallback**

Temporarily set `targetUrl` to `http://localhost:3002` directly:
- Bridge should still connect (postMessage works cross-origin)
- Comment mode click detection should fail gracefully (no crash)

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Fix targetUrl (prerequisite bug) | `EditorLayout.tsx`, `workspaceSlice.ts` |
| 2 | Tauri commands for proxy config | `proxy.rs` (new), `mod.rs`, `lib.rs` |
| 3 | Vite proxy middleware | `vite-proxy-middleware.ts` (new), `vite.config.ts`, `package.json` |
| 4 | Write proxy config + proxy URL | `proxyTarget.ts` (new), `EditorLayout.tsx`, `workspaceSlice.ts` |
| 5 | PreviewCanvas origin for proxy | `PreviewCanvas.tsx` |
| 6 | SettingsBar PageNavDropdown for proxy | `SettingsBar.tsx` |
| 7 | Cleanup on exit | `lib.rs` |
| 8 | E2E verification | Build + test |

## Architecture After

```
User selects app (rad-os, port 3002)
  ↓
workspaceSlice.selectApp() → detectProject → startDevServer → pollServerReady
  ↓
serverStatus → "running" → useDevServerReady fires in EditorLayout:
  → setComponentPreviewServerUrl("http://localhost:3002")   ← ComponentCanvas
  → setPagePreviewUrl("http://localhost:3002")              ← PagePreviewCard
  → writeProxyTarget(3002)                                  ← temp file for Vite
  → setTargetUrl("/target/")                                ← activates PreviewCanvas
  ↓
EditorLayout: hasLivePreview = !!"/target/" = true → renders PreviewCanvas
  ↓
PreviewCanvas: <iframe src="/target/" />
  → browser requests localhost:1420/target/
  → Vite middleware reads port from temp file
  → forwards to localhost:3002/
  ↓
iframe loads same-origin content (localhost:1420)
  → contentDocument accessible ✓
  → bridge handshake works (same origin) ✓
  → CommentMode can elementFromPoint() ✓
```

## Key Differences from v1

| v1 (original) | v2 (this plan) |
|---|---|
| Assumes `targetUrl` is already set by SettingsBar | Fixes the bug: `targetUrl` is never set from dev server flow |
| Says "SettingsBar → setTargetUrl" | SettingsBar has no URL input; PageNavDropdown only modifies path |
| Doesn't identify prerequisite bug | Task 1 explicitly fixes the dead `targetUrl` code path |
| 6 tasks | 8 tasks (added prerequisite fix + SettingsBar update) |
| Incorrect "Current State" diagram | Verified against actual codebase with line numbers |

## Follow-Up Plans (Not in Scope)

1. **Port `withRadflow()` to Turbopack** — Remove `--webpack` flag dependency
2. **Multi-app proxy** — Support multiple target apps simultaneously
3. **ComponentCanvas same-origin** — Proxy component preview iframes too
4. **Bridge comments plan** — Depends on this plan for same-origin `contentDocument` access
