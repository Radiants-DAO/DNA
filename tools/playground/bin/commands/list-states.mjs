import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { buildTestMatrix } from "../lib/prop-matrix.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLAYGROUND_ROOT = resolve(__dirname, "../..");

function readFullComponent(componentId) {
  const raw = readFileSync(
    resolve(PLAYGROUND_ROOT, "generated/registry.manifest.json"),
    "utf-8",
  );
  const manifest = JSON.parse(raw);
  for (const pkg of Object.values(manifest)) {
    for (const c of pkg.components) {
      if (c.name.toLowerCase() === componentId.toLowerCase()) {
        return c;
      }
    }
  }
  return null;
}

export async function run(args) {
  const componentId = args[0];
  if (!componentId) {
    console.error("Usage: rdna-playground list-states <component> [--json]");
    process.exit(1);
  }

  const isJson = args.includes("--json");
  const component = readFullComponent(componentId);

  if (!component) {
    console.error(`Unknown component: ${componentId}`);
    process.exit(1);
  }

  const matrix = buildTestMatrix(component);

  if (isJson) {
    console.log(JSON.stringify(matrix, null, 2));
    return;
  }

  // Human-readable table output
  console.log(`\n${component.name} — ${matrix.length} test state(s)\n`);

  if (matrix[0]?.qaFlags.length > 0) {
    console.log(`QA flags: ${matrix[0].qaFlags.join(", ")}\n`);
  }

  console.log(
    "  #  " +
    "Label".padEnd(50) +
    "Color    " +
    "State",
  );
  console.log("  " + "─".repeat(74));

  for (let i = 0; i < matrix.length; i++) {
    const m = matrix[i];
    const num = String(i + 1).padStart(3);
    console.log(
      `${num}  ${m.label.padEnd(50)}${m.colorMode.padEnd(9)}${m.state}`,
    );
  }

  console.log();
}
