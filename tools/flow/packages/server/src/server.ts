import { createApp, createRouter, toNodeListener } from "h3";
import { listen } from "listhen";

export interface ServerOptions {
  port: number;
  root: string;
}

export async function createServer(options: ServerOptions) {
  const app = createApp();
  const router = createRouter();

  app.use(router);

  const listener = await listen(toNodeListener(app), {
    port: options.port,
    showURL: false,
  });

  return { app, router, listener, options };
}
