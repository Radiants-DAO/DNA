import { writeFile, readFile, mkdir, access } from "node:fs/promises";
import { join } from "node:path";

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function generateMcpConfigs(root: string, port: number): Promise<string[]> {
  const created: string[] = [];
  const url = `http://localhost:${port}/__mcp`;

  // .mcp.json (Claude Code)
  const mcpJsonPath = join(root, ".mcp.json");
  if (!(await fileExists(mcpJsonPath))) {
    await writeFile(
      mcpJsonPath,
      JSON.stringify(
        {
          mcpServers: {
            flow: {
              type: "streamable-http",
              url,
            },
          },
        },
        null,
        2
      ) + "\n"
    );
    created.push(".mcp.json");
  }

  // .cursor/mcp.json
  const cursorDir = join(root, ".cursor");
  const cursorPath = join(cursorDir, "mcp.json");
  if (!(await fileExists(cursorPath))) {
    await mkdir(cursorDir, { recursive: true });
    await writeFile(
      cursorPath,
      JSON.stringify(
        {
          mcpServers: {
            flow: { url },
          },
        },
        null,
        2
      ) + "\n"
    );
    created.push(".cursor/mcp.json");
  }

  // .vscode/mcp.json
  const vscodeDir = join(root, ".vscode");
  const vscodePath = join(vscodeDir, "mcp.json");
  if (!(await fileExists(vscodePath))) {
    await mkdir(vscodeDir, { recursive: true });
    await writeFile(
      vscodePath,
      JSON.stringify(
        {
          mcpServers: {
            flow: { url },
          },
        },
        null,
        2
      ) + "\n"
    );
    created.push(".vscode/mcp.json");
  }

  // Update .gitignore
  await ensureGitignoreEntries(root, [".mcp.json", ".cursor/mcp.json", ".vscode/mcp.json"]);

  return created;
}

async function ensureGitignoreEntries(root: string, entries: string[]): Promise<void> {
  const gitignorePath = join(root, ".gitignore");
  let content = "";

  try {
    content = await readFile(gitignorePath, "utf-8");
  } catch {
    // No .gitignore yet
  }

  const lines = content.split("\n");
  const missing = entries.filter((entry) => !lines.some((line) => line.trim() === entry));

  if (missing.length === 0) return;

  const addition = (content.endsWith("\n") || content === "" ? "" : "\n") +
    "\n# Flow MCP sidecar\n" +
    missing.join("\n") +
    "\n";

  await writeFile(gitignorePath, content + addition);
}
