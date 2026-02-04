import { createApp, createRouter, toNodeListener } from "h3";
import { listen } from "listhen";
import { createHealthHandler } from "./routes/health.js";

export interface ServerOptions {
  port: number;
  root: string;
}

export async function createServer(options: ServerOptions) {
  const app = createApp();
  const router = createRouter();

  // Health endpoint
  router.get("/__flow/health", createHealthHandler(options.root));

  app.use(router);

  const listener = await listen(toNodeListener(app), {
    port: options.port,
    showURL: false,
  });

  return { app, router, listener, options };
}
