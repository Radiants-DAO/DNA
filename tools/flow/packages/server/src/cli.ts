import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { createServer } from "./server.js";
import { generateMcpConfigs } from "./auto-config.js";

const { values } = parseArgs({
  options: {
    port: { type: "string", default: "3737" },
    root: { type: "string", default: "." },
  },
});

const port = parseInt(values.port ?? "3737", 10);
const root = resolve(values.root ?? ".");

async function main() {
  const server = await createServer({ port, root });

  // Auto-generate MCP config files if they don't exist
  const created = await generateMcpConfigs(root, port);
  if (created.length > 0) {
    console.log(`[flow] Generated MCP configs: ${created.join(", ")}`);
  }

  console.log(`[flow] MCP sidecar running at http://localhost:${port}`);
  console.log(`[flow] Project root: ${root}`);
  console.log(`[flow] Health: http://localhost:${port}/__flow/health`);
  console.log(`[flow] MCP:    http://localhost:${port}/__mcp`);
  console.log(`[flow] WS:     ws://localhost:${port}/__flow/ws`);
  return server;
}

main().catch((err) => {
  console.error("[flow] Failed to start:", err);
  process.exit(1);
});
