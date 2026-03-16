import { spawn } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { get, post } from "../lib/api.mjs";
import { lookupComponent, buildFixPrompt, extractCodeBlocks } from "../lib/prompt.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MONO_ROOT = resolve(__dirname, "../../../..");

function extractFlag(args, flag) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

export async function run(args) {
  const componentId = args[0];
  const annotationId = extractFlag(args, "--annotation");

  if (!componentId || !annotationId) {
    console.log(`
Usage: rdna-playground fix <component> --annotation <id>

Spawns Claude to fix a specific annotation. On success:
  1. Writes fix as a lint-gated iteration
  2. Auto-adopts into source
  3. Resolves the annotation

The fix agent gets full context: source, schema, DESIGN.md, RDNA rules,
and the annotation's message/intent/priority.
`);
    return;
  }

  const entry = lookupComponent(componentId);

  // Fetch the annotation
  const annotationData = await get(`/agent/annotation?componentId=${entry.id}`);
  const annotation = annotationData.annotations?.find((a) => a.id === annotationId);

  if (!annotation) {
    throw new Error(`Annotation ${annotationId} not found for component ${entry.id}`);
  }

  if (annotation.status !== "pending" && annotation.status !== "acknowledged") {
    throw new Error(`Annotation ${annotationId} is already ${annotation.status}`);
  }

  console.log(`Fixing: "${annotation.message}"`);
  console.log(`  Intent: ${annotation.intent} | Priority: ${annotation.priority ?? "-"}`);
  console.log(`  Component: ${entry.label} (${entry.sourcePath})\n`);

  // Signal work start
  try {
    await post("/agent/signal", { action: "work-start", componentId: entry.id });
  } catch {
    // Playground might not be running
  }

  try {
    const prompt = buildFixPrompt({
      componentId: entry.id,
      sourcePath: entry.sourcePath,
      schemaPath: entry.schemaPath,
      annotation: {
        intent: annotation.intent,
        priority: annotation.priority,
        message: annotation.message,
      },
    });

    console.log("Spawning claude --print...");

    const result = await new Promise((resolvePromise) => {
      const child = spawn("claude", ["--print"], {
        cwd: MONO_ROOT,
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env },
      });

      child.stdin.write(prompt);
      child.stdin.end();

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
        process.stdout.write(".");
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("error", (err) => {
        resolvePromise({ exitCode: 1, stdout: "", stderr: err.message });
      });

      child.on("close", (code) => {
        console.log("");
        resolvePromise({ exitCode: code ?? 1, stdout, stderr });
      });
    });

    if (result.exitCode !== 0) {
      throw new Error(`Claude exited with code ${result.exitCode}${result.stderr ? `: ${result.stderr.slice(0, 200)}` : ""}`);
    }

    const codeBlocks = extractCodeBlocks(result.stdout);

    if (codeBlocks.length === 0) {
      throw new Error("Claude responded but output contained no extractable TSX code blocks");
    }

    if (codeBlocks.length > 1) {
      console.warn(`Warning: Claude returned ${codeBlocks.length} code blocks, using the first one`);
    }

    // Step 1: Write as lint-gated iteration
    console.log("Writing fix as iteration (RDNA lint gate)...");
    const writeResult = await post("/generate/write", {
      componentId: entry.id,
      contents: codeBlocks[0],
    });
    console.log(`  Written: ${writeResult.fileName}`);

    // Step 2: Auto-adopt into source
    console.log("Adopting into source...");
    try {
      const adoptResult = await post("/adopt", {
        componentId: entry.id,
        iterationFile: writeResult.fileName,
      });
      console.log(`  Adopted: ${adoptResult.targetPath}`);
    } catch (adoptError) {
      console.error(`  Adopt failed: ${adoptError.message}`);
      console.log("  The iteration file is still available for manual review.");
      throw new Error("Adopt failed — fix iteration preserved for manual review");
    }

    // Step 3: Resolve the annotation
    console.log("Resolving annotation...");
    await post("/agent/annotation", {
      action: "resolve",
      id: annotationId,
      summary: `Fixed by agent: ${annotation.message.slice(0, 80)}`,
    });

    console.log(`\nDone. Annotation resolved, source updated.`);
  } finally {
    try {
      await post("/agent/signal", { action: "work-end", componentId: entry.id });
    } catch {
      // Playground might not be running
    }
  }
}
