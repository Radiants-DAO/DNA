import { defineEventHandler } from "h3";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const pkgPath = fileURLToPath(new URL("../../package.json", import.meta.url));
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

export interface HealthResponse {
  status: "ok";
  version: string;
  root: string;
  capabilities: string[];
}

export function createHealthHandler(root: string) {
  return defineEventHandler((): HealthResponse => ({
    status: "ok",
    version: pkg.version,
    root,
    capabilities: [
      "source-maps",
      "schema-resolution",
      "dna-resolution",
      "token-parsing",
      "file-watching",
      "mcp-tools",
      "websocket",
    ],
  }));
}
