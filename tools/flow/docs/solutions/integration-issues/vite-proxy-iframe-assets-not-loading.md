---
title: Vite Proxy Iframe — Assets Not Loading (CSS/JS/Images Missing)
category: integration-issues
date: 2026-01-30
tags: [vite, proxy, iframe, same-origin, assets, next.js, http-proxy, referer, subrequest]
---

# Vite Proxy Iframe — Assets Not Loading (CSS/JS/Images Missing)

## Symptom

When proxying a target app (e.g. Next.js) through a Vite middleware at `/target/*`, the iframe renders only raw HTML — no CSS, JS, or images load. The page appears as unstyled text with blue links.

## Investigation

1. Confirmed the proxy correctly forwards `/target/` → `http://localhost:3000/` and returns the HTML.
2. Inspected the returned HTML — asset paths are absolute: `/_next/static/chunks/...`, `/_next/static/css/...`.
3. The browser resolves these against the iframe's origin (`http://localhost:1420`), not the proxy prefix.
4. Requests like `http://localhost:1420/_next/static/main.js` hit the Vite dev server, which returns 404 — Vite doesn't have those files.
5. Considered `<base href="/target/">` injection but `<base>` only affects relative URLs; Next.js uses absolute paths starting with `/`.
6. Considered framework-specific path matching (`/_next/*`) but that's fragile and non-portable.

## Root Cause

Path-prefix proxying strips the prefix (`/target/page` → `/page`) when forwarding to the target. The target app returns HTML containing **absolute** asset paths (e.g. `/_next/static/...`). These paths don't include the proxy prefix, so the browser requests them directly from the host origin, bypassing the proxy entirely.

This affects any framework that uses absolute paths for assets (Next.js, Vite apps, Create React App, etc.).

## Solution

Detect subrequests from the proxied page using the `Referer` header. When the iframe loads `/target/`, all subsequent resource requests (CSS, JS, images, fonts, API calls) include `Referer: http://localhost:1420/target/...`. Proxy any request whose Referer contains the proxy prefix, while excluding Vite-internal paths.

```typescript
const VITE_PATHS = ["/@vite/", "/@fs/", "/@id/", "/__vite_", "/node_modules/.vite/"];

function isTargetSubrequest(req: Connect.IncomingMessage): boolean {
  const referer = req.headers.referer ?? "";
  if (!referer.includes("/target")) return false;

  const url = req.url ?? "";
  // Don't intercept Vite internal paths
  if (VITE_PATHS.some((p) => url.startsWith(p))) return false;
  // Don't intercept requests that already have the /target prefix
  if (url.startsWith("/target")) return false;

  return true;
}

// In the middleware handler:
return (req, res, next) => {
  // 1. Direct /target/* requests: strip prefix and proxy
  if (url.startsWith("/target")) {
    req.url = url.slice("/target".length) || "/";
    proxy.web(req, res, { target: `http://localhost:${config.port}` });
    return;
  }

  // 2. Subrequests from proxied page (assets)
  if (isTargetSubrequest(req)) {
    proxy.web(req, res, { target: `http://localhost:${config.port}` });
    return;
  }

  return next();
};
```

Two additional fixes were required in the same change:

**Race condition:** `writeProxyTarget()` (async Tauri IPC) was not awaited before setting the iframe `src`, causing intermittent 503 on first load when the config file didn't exist yet.

```typescript
// Before (race):
writeProxyTarget(project.devPort);
setTargetUrl("/target/");

// After:
await writeProxyTarget(project.devPort);
setTargetUrl("/target/");
```

**Per-request disk I/O:** `readProxyConfig()` did a synchronous `readFileSync` on every HTTP request. Added a 2-second TTL cache.

```typescript
let cachedConfig: ProxyConfig | null = null;
let cacheTime = 0;
const CACHE_TTL = 2000;

function readProxyConfig(): ProxyConfig | null {
  const now = Date.now();
  if (cachedConfig && now - cacheTime < CACHE_TTL) return cachedConfig;
  try {
    cachedConfig = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
    cacheTime = now;
    return cachedConfig;
  } catch {
    cachedConfig = null;
    return null;
  }
}
```

## Prevention

- When building a path-prefix proxy, always account for the target app's absolute asset paths — the prefix only covers the initial navigation, not subrequests.
- The Referer-based approach is framework-agnostic; it works for Next.js, Vite, CRA, or any app with absolute asset paths.
- Always await async IPC calls that produce side effects consumed by other systems (file writes read by middleware).
- Cache filesystem reads in hot middleware paths — sync I/O on every request is a bottleneck.

## Related

- `tools/flow/vite-proxy-middleware.ts` — the proxy implementation
- `tools/flow/app/utils/proxyTarget.ts` — Tauri IPC wrapper for config file
- `docs/plans/2026-01-30-same-origin-proxy.md` — original implementation plan
