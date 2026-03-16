import { spawn } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { post } from "../lib/api.mjs";
import { lookupComponent, buildCreativityLadderPrompt, extractCodeBlocks } from "../lib/prompt.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MONO_ROOT = resolve(__dirname, "../../../..");

export async function run(args) {
  const componentId = args[0];
  const count = Number.parseInt(args[1] ?? "4", 10);

  if (!componentId) {
    console.log(`
Usage: rdna-playground create-variants <component> [count]

Generates design variants with escalating creativity:
  1 — Safe Iteration (polish, refine)
  2 — Confident Improvement (meaningful enhancement)
  3 — Bold Departure (break conventions)
  4 — Wild Card (swing for the fences)
  5+ — Beyond (increasingly experimental)

Default count: 4
`);
    return;
  }

  const entry = lookupComponent(componentId);

  console.log(`Creating ${count} variant(s) for ${entry.label}...`);
  console.log(`Energy levels: ${Array.from({ length: count }, (_, i) => {
    const names = ["Safe", "Improvement", "Bold", "Wild"];
    return i < names.length ? names[i] : `Beyond(${i + 1})`;
  }).join(" → ")}`);

  // Signal work start
  try {
    await post("/agent/signal", { action: "work-start", componentId: entry.id });
  } catch {
    // Playground might not be running — continue anyway
  }

  try {
    const prompt = buildCreativityLadderPrompt({
      componentId: entry.id,
      sourcePath: entry.sourcePath,
      schemaPath: entry.schemaPath,
      count,
    });

    console.log(`\nSpawning claude --print (this may take a moment)...`);

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
        console.log(""); // newline after dots
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

    console.log(`Extracted ${codeBlocks.length} variant(s), writing...`);

    const writtenFiles = [];
    for (let i = 0; i < codeBlocks.length; i++) {
      const names = ["Safe", "Improvement", "Bold", "Wild"];
      const levelName = i < names.length ? names[i] : `Beyond(${i + 1})`;

      try {
        const writeResult = await post("/generate/write", {
          componentId: entry.id,
          contents: codeBlocks[i],
        });
        writtenFiles.push(writeResult.fileName);
        console.log(`  ✓ Variant ${i + 1} (${levelName}): ${writeResult.fileName}`);
      } catch (error) {
        console.error(`  ✗ Variant ${i + 1} (${levelName}): RDNA lint failed — ${error.message}`);
      }
    }

    console.log(`\n${writtenFiles.length}/${codeBlocks.length} variant(s) written successfully.`);
  } finally {
    // Signal work end
    try {
      await post("/agent/signal", { action: "work-end", componentId: entry.id });
    } catch {
      // Playground might not be running
    }
  }
}
