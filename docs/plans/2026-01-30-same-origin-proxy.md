# Same-Origin Proxy — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Proxy target app dev servers through Vite so the preview iframe is same-origin with the host, enabling `contentDocument` access for element picking and event interception — the two capabilities the bridge protocol cannot replace.

**Architecture:** Fix the bridge's DevTools hook installation so it doesn't crash react-refresh (missing `renderers` Map). Add a custom Vite `configureServer` middleware that proxies `/target/*` to the active target app's dev server. The target port is read dynamically from a temp file written by the frontend via Tauri command. Fix the prerequisite bug where `targetUrl` is never set (PreviewCanvas never renders). Disable `credentialless` iframe attribute when using proxy paths. Gate the redundant direct-DOM hooks (useInstanceHover, useInstanceSelection) so they don't fire when bridge is connected — bridge owns event routing.

**Tech Stack:** Vite 7, React 19, TypeScript 5.8, Tauri 2, Zustand 5

---

## Context for the Implementing Engineer

### Why this exists

Flow is a context collector for AI agents. The bridge (`@rdna/bridge`) runs inside target app iframes and provides rich React component data via postMessage. Same-origin proxy enables TWO specific things the bridge can't do:

1. **`elementFromPoint()`** — maps click coordinates to a DOM element. Bridge can't do this because it doesn't know where the user clicked from the host side. CommentMode needs this.
2. **Event interception** — prevents link navigation and form submission in design mode. Bridge's click handler does `preventDefault` on ALL clicks (too aggressive). The interceptor (`interceptor.ts`) is selective.

Everything else (hover, selection, highlighting, style injection) is handled by the bridge via postMessage and works cross-origin. The direct-DOM hooks (`useInstanceHover`, `useInstanceSelection`) are redundant fallbacks that cause duplicate events when same-origin — they must be gated.

### Bridge crash bug

`@rdna/bridge` clobbers `window.__REACT_DEVTOOLS_GLOBAL_HOOK__` during initialization. The `getOrCreateHook()` function (`fiber-hook.ts:392-405`) creates a minimal hook object missing `renderers` (must be a `Map`). When react-refresh later calls `hook.renderers.forEach(...)`, it crashes because `renderers` is `undefined`. Additionally, the `inject` stub in `index.ts:109-112` returns a renderer ID but never stores the renderer. This prevents React from rendering dynamic components in the target app.

### Current bug

`targetUrl` in `canvasSlice` is never set. `EditorLayout.useDevServerReady` (line 46-52) sets `componentPreviewServerUrl` and `pagePreviewUrl` but not `targetUrl`. Since `hasLivePreview = !!targetUrl` (line 80), PreviewCanvas never renders. This plan fixes that first.

### Key files

| File | Role |
|------|------|
| `tools/flow/app/components/layout/EditorLayout.tsx` | Decides which canvas to show; wires dev server → URLs |
| `tools/flow/app/components/layout/PreviewCanvas.tsx` | Renders iframe, connects bridge, hosts CanvasTools |
| `tools/flow/app/components/canvas/CanvasTools.tsx` | Orchestrates outlines, hover, selection, interceptor |
| `tools/flow/app/hooks/useInstanceHover.ts` | Direct contentDocument hover listeners (redundant with bridge) |
| `tools/flow/app/hooks/useInstanceSelection.ts` | Direct contentDocument click listeners (redundant with bridge) |
| `tools/flow/app/components/CommentMode.tsx` | `getIframeElementAtPoint()` — needs same-origin |
| `tools/flow/app/utils/canvas/interceptor.ts` | Prevents navigation/forms in design mode — needs same-origin |
| `tools/flow/app/stores/slices/canvasSlice.ts` | Owns `targetUrl` |
| `tools/flow/app/stores/slices/workspaceSlice.ts` | App/theme selection, dev server lifecycle |
| `tools/flow/vite.config.ts` | Vite dev server config |
| `packages/bridge/src/fiber-hook.ts` | `getOrCreateHook()` — creates DevTools hook (missing `renderers`) |
| `packages/bridge/src/types.ts` | `ReactDevToolsHook` interface (missing `renderers`) |
| `packages/bridge/src/index.ts` | `installDevToolsHookEarly()` — stub `inject` that discards renderers |

---

## Task 1: Fix Bridge DevTools Hook — Add Missing `renderers` Map

**Files:**
- Modify: `packages/bridge/src/types.ts` (lines 174-183)
- Modify: `packages/bridge/src/fiber-hook.ts` (lines 392-405)
- Modify: `packages/bridge/src/index.ts` (lines 107-113)

**What:** The bridge creates `window.__REACT_DEVTOOLS_GLOBAL_HOOK__` without a `renderers` property. React and react-refresh expect `hook.renderers` to be a `Map`. When react-refresh calls `hook.renderers.forEach(...)`, it crashes, preventing dynamic components from rendering in the target app. The `inject()` stub also discards the renderer argument instead of storing it.

**Step 1: Add `renderers` to ReactDevToolsHook type**

In `packages/bridge/src/types.ts`, replace lines 174-183:

```typescript
/** Minimal typing for React DevTools global hook */
export interface ReactDevToolsHook {
  renderers?: Map<number, unknown>;
  rendererInterfaces?: Map<number, RendererInterface>;
  inject?: (renderer: unknown) => number;
  onCommitFiberRoot?: (
    rendererID: number,
    root: FiberRoot,
    priorityLevel?: number
  ) => void;
  supportsFiber?: boolean;
}
```

**Step 2: Add `renderers` to getOrCreateHook**

In `packages/bridge/src/fiber-hook.ts`, replace lines 397-404:

```typescript
  if (!window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    const renderers = new Map<number, unknown>();
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      renderers,
      rendererInterfaces: new Map(),
      inject(renderer: unknown) {
        const id = renderers.size + 1;
        renderers.set(id, renderer);
        return id;
      },
    };
  }
```

**Step 3: Remove the redundant inject stub from index.ts**

In `packages/bridge/src/index.ts`, delete lines 107-113:

```typescript
  // DELETE this block — inject is now handled by getOrCreateHook
  if (!hook.inject) {
    hook.inject = () => {
      console.log('[RadFlow] React renderer registered');
      return 0;
    };
  }
```

Replace with:

```typescript
  // inject is set up by getOrCreateHook — just log status
```

**Step 4: Build**

Run: `cd packages/bridge && pnpm build`
Expected: No errors.

**Step 5: Smoke test**

```bash
cd apps/monolith-hackathon && pnpm dev
```

Expected: App renders without crash. Console should NOT show errors about `hook.renderers.forEach` or similar. Look for `[RadFlow] Fiber hook installed` in console.

**Step 6: Commit**

```bash
git add packages/bridge/src/types.ts packages/bridge/src/fiber-hook.ts packages/bridge/src/index.ts
git commit -m "fix(bridge): preserve renderers Map in DevTools hook so react-refresh works"
```

**Acceptance criteria:**
- `ReactDevToolsHook` type includes `renderers`
- `getOrCreateHook()` creates hook with `renderers` Map and working `inject`
- Target app renders dynamic components without crash
- `pnpm build` passes

---

## Task 2: Fix targetUrl — Set It When Dev Server Starts

**Files:**
- Modify: `tools/flow/app/components/layout/EditorLayout.tsx` (lines 41-52)
- Modify: `tools/flow/app/stores/slices/workspaceSlice.ts` (lines 305-306, 352-353)

**What:** `useDevServerReady` sets `componentPreviewServerUrl` + `pagePreviewUrl` but not `targetUrl`. PreviewCanvas never renders. Fix by also calling `setTargetUrl`.

**Step 1: Add setTargetUrl to useDevServerReady**

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
      // Activate PreviewCanvas — direct URL for now, proxy path in Task 5
      setTargetUrl(url);
    }
  }, [project, setPreviewServerUrl, setPagePreviewUrl, setTargetUrl]));
```

**Step 2: Clear targetUrl on app/theme switch**

In `workspaceSlice.ts`, in `selectTheme` after line 306:

```typescript
      get().setTargetUrl(null);
```

In `selectApp` after line 353:

```typescript
      get().setTargetUrl(null);
```

**Step 3: Verify**

Run: `cd tools/flow && pnpm typecheck`

**Step 4: Smoke test**

Run: `cd tools/flow && pnpm tauri dev`
Select an app → verify PreviewCanvas renders (iframe visible, even if cross-origin).

**Step 5: Commit**

```bash
git add tools/flow/app/components/layout/EditorLayout.tsx tools/flow/app/stores/slices/workspaceSlice.ts
git commit -m "fix(flow): set targetUrl when dev server starts so PreviewCanvas renders"
```

**Acceptance criteria:**
- PreviewCanvas renders when dev server is running
- `targetUrl` is cleared between app switches
- PageNavDropdown in SettingsBar becomes visible

---

## Task 3: Verify Bridge Works on Live Iframe (First Time)

**Files:**
- No changes — observation and verification only

**What:** The bridge has never been tested on a live iframe. Before adding the proxy, verify the existing cross-origin bridge handshake works (or doesn't). This establishes the baseline.

**Step 1: Start both servers**

```bash
# Terminal 1: Target (must have withRadflow() in next.config)
cd apps/monolith-hackathon && pnpm dev

# Terminal 2: RadFlow
cd tools/flow && pnpm tauri dev
```

**Step 2: Observe and record**

Open the RadFlow DevTools console. Check for:

- [ ] `[useBridgeConnection] Iframe loaded, starting handshake` — iframe load event fires
- [ ] `[useBridgeConnection] Connected to bridge v0.1.0` — PONG received
- [ ] OR: `Handshake timed out` — bridge not responding

If handshake succeeds:
- [ ] Bridge status in SettingsBar shows "connected"
- [ ] Component names appear (check bridgeComponentMap in store)

If handshake fails, record the error. Common causes:
- `withRadflow()` not configured in target's `next.config.ts`
- Bridge not built (`cd packages/bridge && pnpm build`)
- Origin mismatch in message validation

**Step 3: Check CommentMode (expect failure)**

- Enter comment mode (C key)
- Click element in iframe
- Expected: `getIframeElementAtPoint` returns null (cross-origin, `contentDocument` is null)
- Expected: No element info, no popover

**Step 4: Check CanvasTools (expect partial)**

- Hover over iframe in design mode (not preview mode)
- Expected: `useInstanceHover` logs "Cross-origin iframe, relying on bridge for hover events"
- Expected: `useInstanceSelection` logs "Cross-origin iframe, relying on bridge for selection events"
- If bridge connected: hover outlines may appear via bridge HOVER messages
- If bridge not connected: no outlines

**Step 5: Document findings**

Record what works and what doesn't. This is the baseline for Task 9 (e2e verification).

**Step 6: Commit (if any config fixes needed)**

Only if you needed to fix bridge build, withRadflow config, etc:

```bash
git commit -m "fix(bridge): ensure bridge builds and withRadflow is configured"
```

**Acceptance criteria:**
- You understand the current baseline: what works, what fails, what errors
- Bridge handshake either succeeds or you know why it fails
- CommentMode element picking fails (expected — no same-origin yet)

---

## Task 4: Add Tauri Commands for Proxy Config

**Files:**
- Create: `tools/flow/tauri/src/commands/proxy.rs`
- Modify: `tools/flow/tauri/src/commands/mod.rs`
- Modify: `tools/flow/tauri/src/lib.rs`

**Step 1: Create proxy.rs**

```rust
use std::fs;
use std::env;

#[tauri::command]
#[specta::specta]
pub fn write_proxy_target(config: String) -> Result<(), String> {
    let path = env::temp_dir().join("radflow-proxy-target.json");
    fs::write(&path, config).map_err(|e| format!("Failed to write proxy config: {e}"))?;
    Ok(())
}

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

Add `pub mod proxy;` to `tools/flow/tauri/src/commands/mod.rs`.

**Step 3: Register in lib.rs**

Add `proxy::write_proxy_target` and `proxy::clear_proxy_target` to the `invoke_handler` list in `tools/flow/tauri/src/lib.rs`.

**Step 4: Add cleanup on window close**

In `lib.rs`, add to the builder chain:

```rust
.on_window_event(|_window, event| {
    if let tauri::WindowEvent::Destroyed = event {
        let path = std::env::temp_dir().join("radflow-proxy-target.json");
        let _ = std::fs::remove_file(path);
    }
})
```

**Step 5: Verify**

Run: `cd tools/flow/tauri && cargo check`

**Step 6: Commit**

```bash
git add tools/flow/tauri/src/commands/proxy.rs tools/flow/tauri/src/commands/mod.rs tools/flow/tauri/src/lib.rs
git commit -m "feat(flow): add Tauri commands for proxy target config"
```

**Acceptance criteria:**
- `cargo check` passes
- Commands write/remove `{tmpdir}/radflow-proxy-target.json`

---

## Task 5: Add Vite Proxy Middleware

**Files:**
- Create: `tools/flow/vite-proxy-middleware.ts`
- Modify: `tools/flow/vite.config.ts`
- Modify: `tools/flow/package.json` (devDep)

**Step 1: Install http-proxy**

Run: `cd tools/flow && pnpm add -D http-proxy @types/http-proxy`

**Step 2: Create vite-proxy-middleware.ts**

```typescript
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
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8")) as ProxyConfig;
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
      (res as any).end(`RadFlow proxy error: ${err.message}`);
    }
  });

  return (req, res, next) => {
    if (!req.url?.startsWith(PREFIX)) return next();

    const config = readProxyConfig();
    if (!config) {
      (res as any).writeHead(503, { "Content-Type": "text/plain" });
      (res as any).end("RadFlow proxy: no target app configured.");
      return;
    }

    req.url = req.url.slice(PREFIX.length) || "/";
    proxy.web(req, res, { target: `http://localhost:${config.port}` });
  };
}

export function createTargetProxyWsHandler() {
  const proxy = httpProxy.createProxyServer({ ws: true, changeOrigin: true });
  proxy.on("error", (err) => console.error("[RadFlow proxy] WS error:", err.message));

  return (req: any, socket: any, head: any) => {
    if (!req.url?.startsWith(PREFIX)) return;
    const config = readProxyConfig();
    if (!config) return;
    req.url = req.url.slice(PREFIX.length) || "/";
    proxy.ws(req, socket, head, { target: `http://localhost:${config.port}` });
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
      ? { protocol: "ws", host, port: 1421 }
      : undefined,
    watch: { ignored: ["**/tauri/**"] },
  },
}));
```

**Step 4: Verify Vite starts**

Run: `cd tools/flow && pnpm dev` (Ctrl+C after startup)
Then: `curl http://localhost:1420/target/`
Expected: 503 "no target app configured"

**Step 5: Commit**

```bash
git add tools/flow/vite-proxy-middleware.ts tools/flow/vite.config.ts tools/flow/package.json pnpm-lock.yaml
git commit -m "feat(flow): add dynamic Vite proxy middleware for target app"
```

**Acceptance criteria:**
- Vite starts without errors
- `/target/` returns 503 when no config file
- No interference with normal routes

---

## Task 6: Wire Proxy — Write Config, Set Proxy URL, Disable credentialless

**Files:**
- Create: `tools/flow/app/utils/proxyTarget.ts`
- Modify: `tools/flow/app/components/layout/EditorLayout.tsx`
- Modify: `tools/flow/app/stores/slices/workspaceSlice.ts`
- Modify: `tools/flow/app/components/layout/PreviewCanvas.tsx` (lines 21-22, 80-87, 227)

**What:** Three things in one task because they form a single atomic behavior change: (a) write proxy config on server ready, (b) set targetUrl to proxy path, (c) disable `credentialless` for proxy paths so contentDocument is accessible.

**Step 1: Create proxyTarget.ts**

```typescript
import { invoke } from "@tauri-apps/api/core";

export async function writeProxyTarget(port: number): Promise<void> {
  try {
    await invoke("write_proxy_target", {
      config: JSON.stringify({ port, timestamp: Date.now() }),
    });
    console.log(`[proxyTarget] Set proxy target to port ${port}`);
  } catch (err) {
    console.error("[proxyTarget] Failed to write proxy config:", err);
  }
}

export async function clearProxyTarget(): Promise<void> {
  try {
    await invoke("clear_proxy_target");
  } catch (err) {
    console.error("[proxyTarget] Failed to clear proxy config:", err);
  }
}
```

**Step 2: Update EditorLayout useDevServerReady**

Replace the block from Task 2 in `EditorLayout.tsx`:

```typescript
  import { writeProxyTarget } from "../../utils/proxyTarget";

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
      writeProxyTarget(project.devPort);
      setTargetUrl("/target/");
    }
  }, [project, setPreviewServerUrl, setPagePreviewUrl, setTargetUrl]));
```

**Step 3: Clear proxy on app switch**

In `workspaceSlice.ts`, update the existing `setTargetUrl(null)` lines (from Task 2) to also clear proxy:

```typescript
import { clearProxyTarget } from "../../utils/proxyTarget";

// In selectTheme (after line ~306):
      get().setTargetUrl(null);
      clearProxyTarget();

// In selectApp (after line ~353):
      get().setTargetUrl(null);
      clearProxyTarget();
```

**Step 4: Handle proxy path in targetOrigin**

In `PreviewCanvas.tsx`, replace lines 80-87:

```typescript
  const targetOrigin = useMemo(() => {
    if (!targetUrl) return "";
    if (targetUrl.startsWith("/")) return window.location.origin;
    try {
      return new URL(targetUrl).origin;
    } catch {
      return "";
    }
  }, [targetUrl]);
```

**Step 5: Disable credentialless for proxy paths**

In `PreviewCanvas.tsx`, the `credentialless` attribute (line 227) makes the iframe cross-origin-isolated even for same-origin URLs, which would negate the proxy. Replace line 227:

```typescript
                // credentialless only for cross-origin (non-proxy) URLs
                // Proxy paths are same-origin — credentialless would block contentDocument access
                {...(supportsCredentialless && targetUrl && !targetUrl.startsWith("/") && { credentialless: "true" })}
```

**Step 6: Update SettingsBar PageNavDropdown**

In `SettingsBar.tsx`, find the `navigateTo` function (~line 426-437). Replace the `baseUrl` derivation:

```typescript
    const navigateTo = (path: string) => {
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

**Step 7: Verify**

Run: `cd tools/flow && pnpm typecheck`

**Step 8: Commit**

```bash
git add tools/flow/app/utils/proxyTarget.ts tools/flow/app/components/layout/EditorLayout.tsx tools/flow/app/stores/slices/workspaceSlice.ts tools/flow/app/components/layout/PreviewCanvas.tsx tools/flow/app/components/layout/SettingsBar.tsx
git commit -m "feat(flow): wire proxy config, proxy URL, and disable credentialless for same-origin"
```

**Acceptance criteria:**
- `targetUrl` is `/target/` (proxy path)
- `targetOrigin` resolves to `window.location.origin` (e.g., `http://localhost:1420`)
- `credentialless` attribute NOT applied for proxy paths
- Proxy config file written with correct port
- PageNavDropdown navigation works with proxy paths
- `pnpm typecheck` passes

---

## Task 7: Gate Redundant Direct-DOM Hooks

**Files:**
- Modify: `tools/flow/app/hooks/useInstanceHover.ts` (lines 138-164)
- Modify: `tools/flow/app/hooks/useInstanceSelection.ts` (lines 188-224)

**What:** With same-origin, `useInstanceHover` and `useInstanceSelection` attach event listeners on `contentDocument` that duplicate the bridge's `HOVER` and `SELECTION` postMessage events. Both write to the same store fields. This causes double-fires.

The bridge is the better path (richer data — includes source location, fallback selectors, radflowId). Gate the direct-DOM listeners: skip when bridge is connected.

**Step 1: Gate useInstanceHover**

In `useInstanceHover.ts`, inside the `useEffect` that sets up listeners (~line 138), add a bridge check at the top:

```typescript
  const bridgeStatus = useAppStore((s) => s.bridgeStatus);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !enabled) return;

    // Bridge handles hover events — don't attach duplicate contentDocument listeners
    if (bridgeStatus === "connected") {
      console.debug("[useInstanceHover] Bridge connected, skipping direct listeners");
      return;
    }

    const setupListeners = () => {
      // ... existing try/catch code unchanged
    };
    // ... rest unchanged
  }, [iframeRef, enabled, bridgeStatus, /* existing deps */]);
```

**Step 2: Gate useInstanceSelection**

In `useInstanceSelection.ts`, same pattern (~line 188):

```typescript
  const bridgeStatus = useAppStore((s) => s.bridgeStatus);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !enabled) return;

    // Bridge handles selection events — don't attach duplicate contentDocument listeners
    if (bridgeStatus === "connected") {
      console.debug("[useInstanceSelection] Bridge connected, skipping direct listeners");
      return;
    }

    const setupListeners = () => {
      // ... existing try/catch code unchanged
    };
    // ... rest unchanged
  }, [iframeRef, enabled, bridgeStatus, /* existing deps */]);
```

**Step 3: Verify**

Run: `cd tools/flow && pnpm typecheck`

**Step 4: Commit**

```bash
git add tools/flow/app/hooks/useInstanceHover.ts tools/flow/app/hooks/useInstanceSelection.ts
git commit -m "fix(flow): gate direct-DOM hover/selection hooks when bridge is connected"
```

**Acceptance criteria:**
- When bridge is connected: direct contentDocument listeners are NOT attached
- When bridge is disconnected: falls back to direct listeners (existing behavior)
- No duplicate events for hover/selection
- `pnpm typecheck` passes

---

## Task 8: Guard useBridgeConnection readyState Check

**Files:**
- Modify: `tools/flow/app/hooks/useBridgeConnection.ts` (line 238)

**What:** Line 238 accesses `iframe.contentDocument?.readyState` to check if iframe is already loaded. This can throw cross-origin. With the proxy, it works — but if the proxy is temporarily down and the iframe falls back to cross-origin, it would throw without a guard.

**Step 1: Wrap readyState check in try/catch**

In `useBridgeConnection.ts`, replace line 238:

```typescript
    // Check if iframe is already loaded
    let alreadyLoaded = false;
    try {
      alreadyLoaded = iframe.contentDocument?.readyState === "complete";
    } catch {
      // Cross-origin — can't check readyState, wait for load event
    }
    if (alreadyLoaded) {
      handleIframeLoad();
    }
```

**Step 2: Verify**

Run: `cd tools/flow && pnpm typecheck`

**Step 3: Commit**

```bash
git add tools/flow/app/hooks/useBridgeConnection.ts
git commit -m "fix(flow): guard contentDocument.readyState check for cross-origin fallback"
```

**Acceptance criteria:**
- No throw when iframe is cross-origin
- Still starts handshake when iframe is same-origin and already loaded

---

## Task 9: End-to-End Verification

**Step 1: Build and start**

```bash
cd packages/bridge && pnpm build
cd apps/monolith-hackathon && pnpm dev  # Terminal 1
cd tools/flow && pnpm tauri dev         # Terminal 2
```

**Step 2: Core flow**

- [ ] Select monolith-hackathon → dev server starts
- [ ] PreviewCanvas renders (not ComponentCanvas)
- [ ] Iframe loads via proxy (network tab: `localhost:1420/target/`)
- [ ] Console: `[proxyTarget] Set proxy target to port {port}`

**Step 3: Bridge (postMessage — should work same as before)**

- [ ] Bridge status shows "connected"
- [ ] Component names appear from bridgeComponentMap
- [ ] Hover in iframe → bridge HOVER events → `bridgeHoveredId` updates
- [ ] Click in iframe → bridge SELECTION events → `bridgeSelection` updates
- [ ] No duplicate events (check that useInstanceHover/Selection log "Bridge connected, skipping")

**Step 4: Same-origin features (NEW — first time these work)**

- [ ] Enter comment mode (C key)
- [ ] Click element in iframe → `getIframeElementAtPoint` returns an element (not null!)
- [ ] Comment popover opens with component name + source file
- [ ] Fiber parsing works: check for `provenance: "bridge"` or `"fiber"` in comment richContext

**Step 5: Event interception**

- [ ] In design mode (not preview): click a link in iframe → navigation prevented
- [ ] In design mode: click a form submit → submission prevented
- [ ] Switch to preview mode (P key): click a link → navigation works

**Step 6: Outlines (contentDocument-based)**

- [ ] Selection outline (blue border) appears around selected element
- [ ] Hover outline (orange border) appears on mouseover
- [ ] Outlines reposition on scroll

Note: Outlines use `contentDocument.querySelector` — they'll start working automatically with same-origin. No code changes needed.

**Step 7: HMR through proxy**

- [ ] Edit a file in monolith-hackathon → iframe updates without full reload
- [ ] Bridge reconnects after HMR (check for PONG in console)

**Step 8: App switching**

- [ ] Switch to different app → preview clears → new server starts → new preview loads
- [ ] Proxy config updated to new port
- [ ] Old proxy config cleared

**Step 9: Graceful degradation**

Temporarily break the proxy (delete the temp file):
- [ ] Bridge should still connect via postMessage (works cross-origin)
- [ ] CommentMode element picking fails gracefully (returns null, no crash)
- [ ] useInstanceHover/Selection stay gated (bridge connected)

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Fix bridge DevTools hook (`renderers` Map) | `bridge/types.ts`, `fiber-hook.ts`, `index.ts` |
| 2 | Fix targetUrl bug | `EditorLayout.tsx`, `workspaceSlice.ts` |
| 3 | Verify bridge baseline (first live test) | Observation only |
| 4 | Tauri proxy config commands | `proxy.rs`, `mod.rs`, `lib.rs` |
| 5 | Vite proxy middleware | `vite-proxy-middleware.ts`, `vite.config.ts` |
| 6 | Wire proxy + disable credentialless | `proxyTarget.ts`, `EditorLayout.tsx`, `workspaceSlice.ts`, `PreviewCanvas.tsx`, `SettingsBar.tsx` |
| 7 | Gate redundant direct-DOM hooks | `useInstanceHover.ts`, `useInstanceSelection.ts` |
| 8 | Guard readyState check | `useBridgeConnection.ts` |
| 9 | E2E verification | Build + test |

## Architecture After

```
User selects app → dev server starts → serverStatus "running"
  ↓
useDevServerReady fires:
  → writeProxyTarget(port) → temp file
  → setTargetUrl("/target/")
  ↓
PreviewCanvas renders:
  → <iframe src="/target/" /> (NO credentialless for proxy paths)
  → Vite middleware → localhost:{port}
  → same-origin ✓
  ↓
Bridge (postMessage — THE context engine):
  → PING/PONG handshake ✓
  → COMPONENT_MAP with full React tree ✓
  → SELECTION on click → store ✓
  → HOVER on mouseover → store ✓
  → HIGHLIGHT / INJECT_STYLE ✓
  ↓
Same-origin (TWO specific capabilities):
  → elementFromPoint() for CommentMode element picking ✓
  → Event interceptor for design-mode navigation prevention ✓
  ↓
Gated (bridge owns these, direct-DOM skipped):
  → useInstanceHover: "Bridge connected, skipping"
  → useInstanceSelection: "Bridge connected, skipping"
  ↓
Silently activated (no code changes needed):
  → Outline.useElementRect: contentDocument now accessible ✓
  → shouldTryFiberParsing: returns true ✓
```
