import { readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import type { Connect } from "vite";
import httpProxy from "http-proxy";

const CONFIG_PATH = join(tmpdir(), "radflow-proxy-target.json");
const PREFIX = "/target";
const CACHE_TTL = 2000;

// Vite-internal paths that should never be proxied
const VITE_PATHS = ["/@vite/", "/@fs/", "/@id/", "/__vite_", "/node_modules/.vite/"];

interface ProxyConfig {
  port: number;
  timestamp: number;
}

let cachedConfig: ProxyConfig | null = null;
let cacheTime = 0;

function readProxyConfig(): ProxyConfig | null {
  const now = Date.now();
  if (cachedConfig && now - cacheTime < CACHE_TTL) return cachedConfig;
  try {
    cachedConfig = JSON.parse(readFileSync(CONFIG_PATH, "utf-8")) as ProxyConfig;
    cacheTime = now;
    return cachedConfig;
  } catch {
    cachedConfig = null;
    return null;
  }
}

/**
 * Check if a request is a subrequest from the proxied target page.
 * When the iframe loads /target/, its HTML contains absolute asset paths
 * like /_next/static/... which the browser resolves against the host origin.
 * We detect these via the Referer header and proxy them too.
 */
function isTargetSubrequest(req: Connect.IncomingMessage): boolean {
  const referer = req.headers.referer ?? "";
  if (!referer.includes(PREFIX)) return false;

  const url = req.url ?? "";
  // Don't intercept Vite internal paths
  if (VITE_PATHS.some((p) => url.startsWith(p))) return false;
  // Don't intercept requests that already have the /target prefix
  if (url.startsWith(PREFIX)) return false;

  return true;
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
    const url = req.url ?? "";

    // Direct /target/* requests: strip prefix and proxy
    if (url.startsWith(PREFIX)) {
      const config = readProxyConfig();
      if (!config) {
        (res as any).writeHead(503, { "Content-Type": "text/plain" });
        (res as any).end("RadFlow proxy: no target app configured.");
        return;
      }

      req.url = url.slice(PREFIX.length) || "/";
      proxy.web(req, res, { target: `http://localhost:${config.port}` });
      return;
    }

    // Subrequests from proxied page (assets like /_next/*, /api/*, etc.)
    if (isTargetSubrequest(req)) {
      const config = readProxyConfig();
      if (!config) return next();
      proxy.web(req, res, { target: `http://localhost:${config.port}` });
      return;
    }

    return next();
  };
}

export function createTargetProxyWsHandler() {
  const proxy = httpProxy.createProxyServer({ ws: true, changeOrigin: true });
  proxy.on("error", (err) => console.error("[RadFlow proxy] WS error:", err.message));

  return (req: any, socket: any, head: any) => {
    const url = req.url ?? "";

    // Direct /target/* WebSocket upgrades
    if (url.startsWith(PREFIX)) {
      const config = readProxyConfig();
      if (!config) return;
      req.url = url.slice(PREFIX.length) || "/";
      proxy.ws(req, socket, head, { target: `http://localhost:${config.port}` });
      return;
    }

    // Subrequest WS upgrades (e.g. target app HMR)
    const referer = req.headers.referer ?? "";
    if (referer.includes(PREFIX) && !VITE_PATHS.some((p) => url.startsWith(p))) {
      const config = readProxyConfig();
      if (!config) return;
      proxy.ws(req, socket, head, { target: `http://localhost:${config.port}` });
    }
  };
}
