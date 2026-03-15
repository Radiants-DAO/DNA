import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { existsSync, writeFileSync, readFileSync, readdirSync, unlinkSync, mkdirSync } from "fs";
import { resolve } from "path";
import { buildIterationPrompt } from "../../prompts/iteration.prompt";
import { serverRegistry } from "../../registry.server";
import {
  parseIterationName,
  filterByComponent,
  sortIterationFiles,
} from "../../lib/iteration-naming";
import { extractCodeBlocks } from "../../lib/code-blocks";

const LOCK_FILE = resolve(process.cwd(), ".playground-generate.lock");
/**
 * All iterations live in a single app-local directory regardless of which
 * package the source component belongs to. This keeps iteration management
 * simple — package-level colocated iterations can be added later if a
 * concrete need emerges.
 */
const ITERATIONS_DIR = resolve(
  process.cwd(),
  "app/playground/iterations",
);

/** List iteration files for a component, sorted by iteration number ascending */
function listIterationsForComponent(componentId: string): string[] {
  if (!existsSync(ITERATIONS_DIR)) return [];
  return filterByComponent(readdirSync(ITERATIONS_DIR), componentId);
}

/** Get the next iteration number for a component */
function nextIterationNumber(componentId: string): number {
  const existing = listIterationsForComponent(componentId);
  let max = 0;
  for (const f of existing) {
    const parsed = parseIterationName(f);
    if (parsed && parsed.n > max) max = parsed.n;
  }
  return max + 1;
}

/** List ALL iteration .tsx files in the directory, sorted by component then number */
function listAllIterations(): string[] {
  if (!existsSync(ITERATIONS_DIR)) return [];
  return sortIterationFiles(readdirSync(ITERATIONS_DIR));
}

// Single-run protection
function isLocked(): boolean {
  if (!existsSync(LOCK_FILE)) return false;
  try {
    const pid = parseInt(readFileSync(LOCK_FILE, "utf-8").trim(), 10);
    process.kill(pid, 0); // Check if process exists
    return true;
  } catch {
    // Stale lock — process is gone
    return false;
  }
}

function acquireLock(): void {
  writeFileSync(LOCK_FILE, String(process.pid));
}

function releaseLock(): void {
  try {
    unlinkSync(LOCK_FILE);
  } catch {
    // Already cleaned up
  }
}

export async function POST(request: Request) {
  if (isLocked()) {
    return NextResponse.json(
      { error: "Generation already in progress" },
      { status: 409 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body?.componentId) {
    return NextResponse.json(
      { error: "Missing componentId" },
      { status: 400 },
    );
  }

  const entry = serverRegistry.find((e) => e.id === body.componentId);
  if (!entry) {
    return NextResponse.json(
      { error: `Unknown component: ${body.componentId}` },
      { status: 404 },
    );
  }

  const variationCount = body.variationCount ?? 2;
  const prompt = buildIterationPrompt({
    componentId: entry.id,
    sourcePath: entry.sourcePath,
    schemaPath: entry.schemaPath,
    propsInterface: entry.propsInterface,
    variationCount,
    customInstructions: body.customInstructions,
  });

  acquireLock();

  try {
    const result = await new Promise<{ exitCode: number; stdout: string; stderr: string }>((resolvePromise) => {
      const child = spawn("claude", ["--print"], {
        cwd: resolve(process.cwd(), "../.."), // monorepo root
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env },
      });

      child.stdin.write(prompt);
      child.stdin.end();

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (stderr) console.error("[playground:generate] stderr:", stderr);
        resolvePromise({ exitCode: code ?? 1, stdout, stderr });
      });
    });

    if (result.exitCode !== 0) {
      return NextResponse.json(
        { error: "Claude generation failed", exitCode: result.exitCode },
        { status: 500 },
      );
    }

    // Extract code blocks from Claude's response and write to disk
    const codeBlocks = extractCodeBlocks(result.stdout);

    if (codeBlocks.length === 0) {
      return NextResponse.json(
        {
          error: "Claude responded but output contained no extractable TSX code blocks",
          componentId: body.componentId,
          stdoutPreview: result.stdout.slice(0, 500),
        },
        { status: 500 },
      );
    }

    // Write each code block as a numbered iteration file
    if (!existsSync(ITERATIONS_DIR)) mkdirSync(ITERATIONS_DIR, { recursive: true });
    let nextN = nextIterationNumber(entry.id);
    const writtenFiles: string[] = [];

    for (const code of codeBlocks) {
      const filename = `${entry.id}.iteration-${nextN}.tsx`;
      writeFileSync(resolve(ITERATIONS_DIR, filename), code, "utf-8");
      writtenFiles.push(filename);
      nextN++;
    }

    return NextResponse.json({
      success: true,
      componentId: body.componentId,
      writtenFiles,
      totalIterations: listIterationsForComponent(entry.id).length,
    });
  } finally {
    releaseLock();
  }
}

export async function GET() {
  const allFiles = listAllIterations();

  // Group by componentId using the parsed pattern (not prefix splitting)
  const byComponent: Record<string, string[]> = {};
  for (const f of allFiles) {
    const parsed = parseIterationName(f);
    if (!parsed) continue;
    if (!byComponent[parsed.componentId]) byComponent[parsed.componentId] = [];
    byComponent[parsed.componentId].push(f);
  }

  return NextResponse.json({
    locked: isLocked(),
    files: allFiles,
    byComponent,
  });
}

export async function DELETE() {
  releaseLock();
  return NextResponse.json({ released: true });
}
