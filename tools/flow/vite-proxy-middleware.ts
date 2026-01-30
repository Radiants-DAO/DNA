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
