import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { existsSync, writeFileSync, readFileSync, unlinkSync } from "fs";
import { resolve } from "path";
import { buildIterationPrompt } from "../../prompts/iteration.prompt";
import { serverRegistry } from "../../registry.server";
import { listAllIterations, groupIterationsByComponent, writeVerifiedIteration } from "../../lib/iterations.server";
import { signalStore } from "../agent/signal-store";
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

    // Write each code block as a verified iteration file
    const writtenFiles: string[] = [];

    for (const code of codeBlocks) {
      try {
        const result = writeVerifiedIteration({
          monoRoot: resolve(process.cwd(), "../.."),
          iterationsDir: ITERATIONS_DIR,
          componentId: entry.id,
          contents: code,
        });

        writtenFiles.push(result.fileName);
      } catch (error) {
        for (const fileName of writtenFiles) {
          unlinkSync(resolve(ITERATIONS_DIR, fileName));
        }

        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Generation verification failed",
          },
          { status: 422 },
        );
      }
    }

    signalStore.iterationsChanged(entry.id);

    return NextResponse.json({
      success: true,
      componentId: body.componentId,
      writtenFiles,
      totalIterations: listAllIterations(ITERATIONS_DIR).filter((file) =>
        file.startsWith(`${entry.id}.iteration-`),
      ).length,
    });
  } finally {
    releaseLock();
  }
}

export async function GET() {
  const allFiles = listAllIterations(ITERATIONS_DIR);
  const byComponent = groupIterationsByComponent(allFiles);

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
