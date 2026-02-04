import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, readFileSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { generateMcpConfigs } from "../auto-config.js";

describe("generateMcpConfigs", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "flow-config-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("creates .mcp.json with correct structure", async () => {
    await generateMcpConfigs(dir, 3737);

    const content = JSON.parse(readFileSync(join(dir, ".mcp.json"), "utf-8"));
    expect(content.mcpServers.flow.type).toBe("streamable-http");
    expect(content.mcpServers.flow.url).toBe("http://localhost:3737/__mcp");
  });

  it("creates .cursor/mcp.json", async () => {
    await generateMcpConfigs(dir, 3737);

    expect(existsSync(join(dir, ".cursor", "mcp.json"))).toBe(true);
    const content = JSON.parse(readFileSync(join(dir, ".cursor", "mcp.json"), "utf-8"));
    expect(content.mcpServers.flow.url).toBe("http://localhost:3737/__mcp");
  });

  it("creates .vscode/mcp.json", async () => {
    await generateMcpConfigs(dir, 3737);

    expect(existsSync(join(dir, ".vscode", "mcp.json"))).toBe(true);
    const content = JSON.parse(readFileSync(join(dir, ".vscode", "mcp.json"), "utf-8"));
    expect(content.mcpServers.flow.url).toBe("http://localhost:3737/__mcp");
  });

  it("uses custom port in URLs", async () => {
    await generateMcpConfigs(dir, 4000);

    const content = JSON.parse(readFileSync(join(dir, ".mcp.json"), "utf-8"));
    expect(content.mcpServers.flow.url).toBe("http://localhost:4000/__mcp");
  });

  it("does not overwrite existing config files", async () => {
    writeFileSync(join(dir, ".mcp.json"), '{"existing": true}');

    const created = await generateMcpConfigs(dir, 3737);

    expect(created).not.toContain(".mcp.json");
    const content = JSON.parse(readFileSync(join(dir, ".mcp.json"), "utf-8"));
    expect(content.existing).toBe(true);
  });

  it("adds entries to .gitignore", async () => {
    await generateMcpConfigs(dir, 3737);

    const gitignore = readFileSync(join(dir, ".gitignore"), "utf-8");
    expect(gitignore).toContain(".mcp.json");
    expect(gitignore).toContain(".cursor/mcp.json");
    expect(gitignore).toContain(".vscode/mcp.json");
  });

  it("does not duplicate .gitignore entries", async () => {
    writeFileSync(join(dir, ".gitignore"), ".mcp.json\n");

    await generateMcpConfigs(dir, 3737);

    const gitignore = readFileSync(join(dir, ".gitignore"), "utf-8");
    const count = gitignore.split(".mcp.json").length - 1;
    expect(count).toBe(1); // Only the original one
  });

  it("returns list of created files", async () => {
    const created = await generateMcpConfigs(dir, 3737);

    expect(created).toContain(".mcp.json");
    expect(created).toContain(".cursor/mcp.json");
    expect(created).toContain(".vscode/mcp.json");
  });

  it("preserves existing .gitignore content", async () => {
    writeFileSync(join(dir, ".gitignore"), "node_modules/\ndist/\n");

    await generateMcpConfigs(dir, 3737);

    const gitignore = readFileSync(join(dir, ".gitignore"), "utf-8");
    expect(gitignore).toContain("node_modules/");
    expect(gitignore).toContain("dist/");
    expect(gitignore).toContain("# Flow MCP sidecar");
  });
});
