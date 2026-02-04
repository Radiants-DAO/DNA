import { describe, it, expect, afterEach } from "vitest";
import { createApp, createRouter, toNodeListener } from "h3";
import { listen, type Listener } from "listhen";
import { createHealthHandler } from "../health.js";

describe("GET /__flow/health", () => {
  let listener: Listener | null = null;

  afterEach(async () => {
    if (listener) {
      await listener.close();
      listener = null;
    }
  });

  it("returns status ok with version and capabilities", async () => {
    const app = createApp();
    const router = createRouter();
    router.get("/__flow/health", createHealthHandler("/tmp/test-project"));
    app.use(router);

    listener = await listen(toNodeListener(app), { port: 0, showURL: false });
    const res = await fetch(`${listener.url}__flow/health`);
    const body = await res.json();

    expect(body.status).toBe("ok");
    expect(body.version).toBeDefined();
    expect(body.root).toBe("/tmp/test-project");
    expect(body.capabilities).toContain("mcp-tools");
    expect(body.capabilities).toContain("source-maps");
    expect(body.capabilities).toContain("file-watching");
  });

  it("includes all expected capabilities", async () => {
    const app = createApp();
    const router = createRouter();
    router.get("/__flow/health", createHealthHandler("/tmp"));
    app.use(router);

    listener = await listen(toNodeListener(app), { port: 0, showURL: false });
    const res = await fetch(`${listener.url}__flow/health`);
    const body = await res.json();

    expect(body.capabilities).toEqual([
      "source-maps",
      "schema-resolution",
      "dna-resolution",
      "token-parsing",
      "file-watching",
      "mcp-tools",
      "websocket",
    ]);
  });
});
