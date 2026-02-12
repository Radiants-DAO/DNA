import { createApp, createRouter, defineEventHandler, setResponseStatus, toNodeListener } from "h3";
import { listen } from "listhen";
import { createHealthHandler } from "./routes/health.js";
import { createMcpHandler } from "./routes/mcp.js";
import { createWebSocketHandler } from "./routes/websocket.js";
import { ProjectWatcher } from "./watcher.js";
import { SchemaResolver } from "./services/schema-resolver.js";
import { TokenParser } from "./services/token-parser.js";
import { SourceMapService } from "./services/source-maps.js";
import { ContextStore } from "./services/context-store.js";

export interface ServerOptions {
  port: number;
  root: string;
}

export async function createServer(options: ServerOptions) {
  // Initialize services
  const schemaResolver = new SchemaResolver(options.root);
  const tokenParser = new TokenParser(options.root);
  const sourceMapService = new SourceMapService(options.root);
  const contextStore = new ContextStore();
  const watcher = new ProjectWatcher(options.root);

  // Initial scan
  await schemaResolver.scan();
  await tokenParser.scan();

  // Start file watcher
  watcher.start();

  // Re-scan on relevant file changes
  watcher.on("change", async (event: { type: string; path: string }) => {
    if (event.path.endsWith(".schema.json") || event.path.endsWith(".dna.json")) {
      await schemaResolver.scan();
    }
    if (event.path.endsWith(".css")) {
      tokenParser.invalidateFile(event.path);
      await tokenParser.scan();
    }
    if (event.path.endsWith(".map")) {
      sourceMapService.invalidate(event.path);
    }
  });

  const app = createApp();

  // DNS rebinding protection: reject requests with non-local Origin headers
  app.use(
    defineEventHandler((event) => {
      const origin = event.headers.get("origin");
      if (origin) {
        const allowed =
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        if (!allowed) {
          setResponseStatus(event, 403);
          return { error: "Forbidden: invalid origin" };
        }
      }
    })
  );

  const router = createRouter();

  // Health
  router.get("/__flow/health", createHealthHandler(options.root));

  // MCP
  const mcpDeps = { schemaResolver, tokenParser, sourceMapService, contextStore };
  const mcpHandler = createMcpHandler(mcpDeps);
  router.post("/__mcp", mcpHandler);
  router.delete("/__mcp", mcpHandler);

  // WebSocket
  const wsHandler = createWebSocketHandler(watcher, contextStore);
  router.get(
    "/__flow/ws",
    defineEventHandler({
      handler: () => {},
      websocket: wsHandler,
    })
  );

  app.use(router);

  const listener = await listen(toNodeListener(app), {
    port: options.port,
    hostname: "127.0.0.1",
    showURL: false,
    ws: true,
  });

  return {
    app,
    router,
    listener,
    options,
    services: { schemaResolver, tokenParser, sourceMapService, contextStore, watcher },
    async close() {
      await watcher.stop();
      await listener.close();
    },
  };
}
