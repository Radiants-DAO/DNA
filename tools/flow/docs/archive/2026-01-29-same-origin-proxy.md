# Same-Origin Proxy for Target App Iframe — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Proxy target app dev servers through Vite's dev server so the preview iframe is same-origin, enabling `contentDocument` access for comment mode element detection, fiber parsing, and direct DOM inspection.

**User story:** A designer using RadFlow enters comment mode, clicks an element inside the preview iframe, and CommentMode can access `iframe.contentDocument.elementFromPoint()` to identify the exact element — because the iframe loads from the same origin as the RadFlow host via a Vite proxy.

**Architecture:** Add a Vite `server.proxy` rule that forwards `/target/*` to the active target app's dev server (e.g., `localhost:3002`). Change all iframe URL construction to use the proxy path (`/target/...`) instead of the direct URL (`http://localhost:3002/...`). The proxy target port is determined at Vite startup from environment or config. For app switching (different ports), the proxy target must be updateable — we use Vite's `configureServer` hook to install a custom middleware that reads the current port from a shared config.

**Tech Stack:** Vite 7 (server.proxy + configureServer), React 19, TypeScript 5.8, Tauri 2, Zustand 5

**Constraint:** Vite's built-in `server.proxy` uses a static target — it can't change at runtime when the user switches apps. We solve this with a custom middleware that reads the target port dynamically.

---

## Scope Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Proxy mechanism | Custom Vite middleware | Static proxy can't handle app switching |
| URL path prefix | `/target/` | Clear namespace, no collision with RadFlow routes |
| HMR WebSocket | Proxied via `ws: true` | Target app HMR must work through proxy |
| Port source | File-based (`/tmp/radflow-proxy-target.json`) | Vite middleware can't access Zustand; file is simplest IPC |
| Fallback | Direct URL if proxy fails | Graceful degradation to cross-origin (existing behavior) |

---

## Current State

```
EditorLayout → useDevServerReady → setPreviewServerUrl("http://localhost:3002")
SettingsBar → setTargetUrl("http://localhost:3002/about")
PreviewCanvas → <iframe src={targetUrl} /> → cross-origin → contentDocument = null
CommentMode → getIframeElementAtPoint() → iframe.contentDocument → null → click swallowed
```

**After this plan:**

```
EditorLayout → useDevServerReady → setPreviewServerUrl("http://localhost:3002")
                                 → writeProxyTarget(3002)
                                 → setTargetUrl("/target/")
SettingsBar → setTargetUrl("/target/about")
PreviewCanvas → <iframe src="/target/" /> → same-origin (localhost:1420) → contentDocument ✓
Vite middleware → /target/* → http://localhost:3002/*
CommentMode → getIframeElementAtPoint() → iframe.contentDocument.elementFromPoint() ✓
```

---

## Task 1: Add Dynamic Proxy Middleware to Vite

**Files:**
- Create: `tools/flow/vite-proxy-middleware.ts`
- Modify: `tools/flow/vite.config.ts`

**What:** Install a Vite server middleware that proxies `/target/*` requests to the active target app's dev server. The target port is read from a JSON file that the frontend writes when the dev server becomes ready.

**Step 1: Create the proxy middleware module**

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
    // Don't buffer — stream responses for HMR
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

/**
 * WebSocket upgrade handler for HMR.
 * Must be registered separately via server.ws or httpServer.on('upgrade').
 */
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

**Step 2: Install the middleware in vite.config.ts**

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
        // Install proxy middleware (runs before Vite's own middleware)
        server.middlewares.use(createTargetProxyMiddleware());

        // Handle WebSocket upgrades for HMR proxying
        const wsHandler = createTargetProxyWsHandler();
        server.httpServer?.on("upgrade", (req, socket, head) => {
          if (req.url?.startsWith("/target")) {
            wsHandler(req, socket, head);
          }
        });
      },
    },
  ],

  // Vite options tailored for Tauri development
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

**Step 3: Install http-proxy dependency**

Run: `cd tools/flow && pnpm add -D http-proxy @types/http-proxy`

**Step 4: Verify Vite starts**

Run: `cd tools/flow && pnpm dev` (Ctrl+C after startup)
Expected: No errors. Console shows Vite starting on port 1420.

**Acceptance criteria:**
- Vite starts without errors
- Requests to `/target/` return 503 (no target configured yet)
- No interference with normal Vite routes

---

## Task 2: Write Proxy Target Config from Frontend

**Files:**
- Create: `tools/flow/app/utils/proxyTarget.ts`
- Modify: `tools/flow/app/components/layout/EditorLayout.tsx`

**What:** When the dev server becomes ready, write the target port to the temp file so the proxy middleware can read it. Uses Tauri's `invoke` to write a file from the webview (browser can't write to filesystem directly).

**Step 1: Create proxyTarget utility**

Create `tools/flow/app/utils/proxyTarget.ts`:

```typescript
/**
 * Writes the proxy target config for the Vite middleware.
 *
 * Since the browser can't write files directly, we use Tauri's
 * fs plugin or a custom command. For simplicity, we use fetch()
 * to hit a local endpoint — but since we're in Tauri, we use
 * the shell command via invoke.
 *
 * Alternative: Use Tauri's fs plugin (requires allowlist config).
 * We use a simpler approach: write via a Tauri command.
 */

import { invoke } from "@tauri-apps/api/core";

const CONFIG_FILENAME = "radflow-proxy-target.json";

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

**Step 2: Add Tauri commands for proxy config**

Create or add to `tools/flow/tauri/src/commands/proxy.rs`:

```rust
use std::fs;
use std::env;

/// Write proxy target config to temp file
#[tauri::command]
#[specta::specta]
pub fn write_proxy_target(config: String) -> Result<(), String> {
    let path = env::temp_dir().join("radflow-proxy-target.json");
    fs::write(&path, config).map_err(|e| format!("Failed to write proxy config: {e}"))?;
    Ok(())
}

/// Clear proxy target config
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

**Step 3: Register commands in lib.rs**

In `tools/flow/tauri/src/lib.rs`, add `proxy::write_proxy_target` and `proxy::clear_proxy_target` to the command list and `mod proxy` to `commands/mod.rs`.

**Step 4: Wire into EditorLayout**

In `tools/flow/app/components/layout/EditorLayout.tsx`, modify the `useDevServerReady` callback:

```typescript
import { writeProxyTarget } from "../../utils/proxyTarget";

// Replace existing useDevServerReady callback:
useDevServerReady(useCallback(() => {
  if (project) {
    const url = `http://localhost:${project.devPort}`;
    setPreviewServerUrl(url);
    setPagePreviewUrl(url);

    // Set proxy target for same-origin iframe access
    writeProxyTarget(project.devPort);

    // Set targetUrl to proxy path (same-origin)
    const setTargetUrl = useAppStore.getState().setTargetUrl;
    setTargetUrl("/target/");
  }
}, [project, setPreviewServerUrl, setPagePreviewUrl]));
```

**Step 5: Verify typecheck**

Run: `cd tools/flow && cargo check && pnpm typecheck`

**Acceptance criteria:**
- When dev server starts, proxy config file is written
- `targetUrl` is set to `/target/` instead of `http://localhost:3002`
- Rust commands compile

---

## Task 3: Update URL Construction to Use Proxy Path

**Files:**
- Modify: `tools/flow/app/components/layout/SettingsBar.tsx`
- Modify: `tools/flow/app/components/layout/PreviewCanvas.tsx`
- Modify: `tools/flow/app/hooks/useBridgeConnection.ts`

**What:** Update all places that construct or parse the target URL to work with the `/target/` proxy path. The key change is that `targetOrigin` for bridge postMessage validation is now `window.location.origin` (same-origin).

**Step 1: Update SettingsBar navigation**

In `SettingsBar.tsx`, the `navigateTo` function currently builds `${baseUrl}${path}`. Change `baseUrl` derivation:

Find ~line 426:
```typescript
const url = new URL(targetUrl);
const baseUrl = url.origin;
```

Replace with:
```typescript
// targetUrl is now a proxy path like "/target/" or "/target/about"
// baseUrl is "/target" (strip trailing slash)
const baseUrl = "/target";
```

**Step 2: Update PreviewCanvas targetOrigin**

In `PreviewCanvas.tsx`, `targetOrigin` is derived from `targetUrl` and used for bridge postMessage. With the proxy, the origin is the same as the host.

Find ~line 80-87:
```typescript
const targetOrigin = useMemo(() => {
  if (!targetUrl) return "";
  try {
    return new URL(targetUrl).origin;
  } catch {
    return "";
  }
}, [targetUrl]);
```

Replace with:
```typescript
const targetOrigin = useMemo(() => {
  if (!targetUrl) return "";
  // Proxy path (/target/...) → same origin
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

**Step 3: Update useBridgeConnection origin validation**

In `useBridgeConnection.ts`, the `handleMessage` callback validates `event.origin !== targetOrigin`. With same-origin proxy, both are `http://localhost:1420`. No code change needed — the origin comparison already works correctly since `targetOrigin` will now be `http://localhost:1420`.

Verify: No changes needed in `useBridgeConnection.ts` for origin handling.

**Step 4: Verify typecheck**

Run: `cd tools/flow && pnpm typecheck`

**Acceptance criteria:**
- SettingsBar navigation uses `/target/` prefix
- PreviewCanvas computes correct origin for proxy paths
- Bridge postMessage origin validation works with same-origin

---

## Task 4: Update Workspace App Switching to Update Proxy

**Files:**
- Modify: `tools/flow/app/stores/slices/workspaceSlice.ts`

**What:** When the user switches apps (different port), update the proxy target and reset `targetUrl`.

**Step 1: Update selectApp to write proxy target**

In `workspaceSlice.ts`, find `selectApp` (~line 320). After the `pollServerReady` call, add proxy target update. Also need to handle the case where the dev server starts from `selectTheme`.

The cleanest approach: hook into the `useDevServerReady` callback already in EditorLayout (Task 2 Step 4), which fires whenever `serverStatus.state === "running"`. This already handles both `selectApp` and `selectTheme` flows.

Verify: No additional changes needed in `workspaceSlice.ts` — the `useDevServerReady` hook in `EditorLayout` already covers all server-ready transitions including app switching.

**Step 2: Clear proxy on server stop**

In `workspaceSlice.ts`, find where `stopDevServer` is called. Add `clearProxyTarget()` call in the workspace methods that stop servers.

After the `stopDevServer()` calls in both `selectTheme` (~line 308) and `selectApp` (~line 357), add:

```typescript
import { clearProxyTarget } from "../../utils/proxyTarget";

// In selectTheme, after stopDevServer():
clearProxyTarget();

// In selectApp, after stopDevServer():
clearProxyTarget();
```

Also clear `targetUrl`:
```typescript
get().setTargetUrl(null);
```

**Step 3: Verify typecheck**

Run: `cd tools/flow && pnpm typecheck`

**Acceptance criteria:**
- Switching apps updates proxy target to new port
- Stopping dev server clears proxy config
- `targetUrl` is cleared between app switches

---

## Task 5: Verify Same-Origin `contentDocument` Access

**Files:**
- No file changes — verification only

**What:** Start the full stack and verify that CommentMode can access iframe content.

**Step 1: Build and start**

```bash
# Terminal 1: Target app
cd apps/rad-os && pnpm dev

# Terminal 2: RadFlow
cd tools/flow && pnpm tauri dev
```

**Step 2: Test checklist**

- [ ] RadFlow starts, Vite shows no proxy errors
- [ ] Select rad-os app → dev server starts
- [ ] Preview iframe loads at `/target/` (check network tab — request goes to `localhost:1420/target/`)
- [ ] Bridge status shows "connected" (PING/PONG works through proxy)
- [ ] Enter comment mode (C key)
- [ ] Hover over elements in iframe → highlight appears (proves `contentDocument` access works)
- [ ] Click element → comment popover opens with component name
- [ ] Submit comment → badge appears in iframe (bridge comment protocol)
- [ ] HMR: Edit a file in rad-os → iframe updates (WebSocket proxy works)
- [ ] Navigate to different route via SettingsBar → iframe URL updates

**Step 3: Verify cross-origin fallback**

Temporarily change `targetUrl` to direct URL (`http://localhost:3002`) and verify:
- Bridge still connects (postMessage works cross-origin)
- Comment mode click detection fails gracefully (no crash, just no element found)

**Acceptance criteria:**
- `iframe.contentDocument` is accessible (same-origin confirmed)
- Comment mode element detection works on target app elements
- HMR works through proxy
- Bridge comment badges render inside iframe
- No regressions in non-comment features

---

## Task 6: Cleanup

**Files:**
- Modify: `apps/rad-os/package.json` — revert `--webpack` flag (no longer needed since bridge injection now works via same-origin; the bridge runs inside the iframe's own JS, not via webpack entry injection)
- Modify: `apps/rad-os/next.config.ts` — evaluate whether `withRadflow()` is still needed

**What:** Review and clean up artifacts from earlier attempts.

**Step 1: Evaluate withRadflow() necessity**

`withRadflow()` injects `@rdna/bridge` into the target app's webpack entry. This is still needed — the bridge must run inside the target app to:
- Install the fiber hook before React boots
- Annotate DOM elements with `data-radflow-id`
- Handle postMessage protocol (PING/PONG, SELECTION, comments)
- Respond to HIGHLIGHT/INJECT_STYLE commands

The proxy only changes the *origin* — it doesn't change what runs inside the iframe. **Keep `withRadflow()` and `@rdna/bridge` dependency.**

**Step 2: Evaluate --webpack flag**

The `--webpack` flag was added because Next.js 16 defaults to Turbopack, which doesn't support the `webpack()` config hook used by `withRadflow()`. Two options:

a. **Keep `--webpack`** — simplest, guaranteed to work
b. **Port `withRadflow()` to Turbopack** — use `turbopack.rules` or `experimental.turbo` to inject the bridge entry

For now, keep `--webpack`. Porting to Turbopack is a separate follow-up.

**Step 3: Clean up temp file on app quit**

In `tools/flow/tauri/src/lib.rs`, register a cleanup handler that removes the proxy config file on exit:

```rust
// In the builder chain, add:
.on_window_event(|window, event| {
    if let tauri::WindowEvent::Destroyed = event {
        let path = std::env::temp_dir().join("radflow-proxy-target.json");
        let _ = std::fs::remove_file(path);
    }
})
```

**Step 4: Add .gitignore entry**

The temp file is in `/tmp/`, so it's not in the repo. No `.gitignore` change needed.

**Step 5: Final typecheck + build**

```bash
cd packages/bridge && pnpm build
cd tools/flow && pnpm typecheck
cd tools/flow && cargo check
```

**Acceptance criteria:**
- No unnecessary files or flags removed
- Temp file cleaned up on app exit
- All builds pass
- `withRadflow()` retained with `--webpack` flag documented

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Dynamic proxy middleware | `vite-proxy-middleware.ts` (new), `vite.config.ts` |
| 2 | Write proxy config from frontend | `proxyTarget.ts` (new), `proxy.rs` (new), `EditorLayout.tsx`, `lib.rs` |
| 3 | Update URL construction | `SettingsBar.tsx`, `PreviewCanvas.tsx` |
| 4 | App switching updates proxy | `workspaceSlice.ts` |
| 5 | End-to-end verification | Build + test |
| 6 | Cleanup | `tauri/src/lib.rs`, review flags |

## Architecture After

```
User selects app (rad-os, port 3002)
  ↓
workspaceSlice.selectApp() → detectProject → startDevServer → pollServerReady
  ↓
EditorLayout.useDevServerReady() fires:
  → writeProxyTarget(3002) → /tmp/radflow-proxy-target.json
  → setTargetUrl("/target/")
  ↓
PreviewCanvas renders <iframe src="/target/" />
  ↓
Browser requests localhost:1420/target/ → Vite middleware → localhost:3002/
  ↓
iframe loads same-origin content → contentDocument accessible ✓
  ↓
Bridge handshake: PING (origin: localhost:1420) → PONG ✓
CommentMode: iframe.contentDocument.elementFromPoint() ✓
Fiber parsing: element.ownerDocument accessible ✓
Comment badges: postMessage ADD_COMMENT → bridge → overlay ✓
```

## Follow-Up Plans (Not in Scope)

1. **Port `withRadflow()` to Turbopack** — Remove `--webpack` flag dependency
2. **Multi-app proxy** — Support multiple target apps simultaneously (different path prefixes)
3. **ComponentCanvas comments** — Per-iframe proxy connections for component preview cards
4. **Production proxy** — If RadFlow ships as a hosted tool (not just local Tauri)
