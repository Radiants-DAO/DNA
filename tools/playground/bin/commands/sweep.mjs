import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { post, get } from "../lib/api.mjs";
import { buildTestMatrix } from "../lib/prop-matrix.mjs";
import { readFileSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLAYGROUND_ROOT = resolve(__dirname, "../..");

const POLL_INTERVAL_MS = 200;
const POLL_TIMEOUT_MS = 15_000;

/**
 * Sweep all visual states of a component, saving a directory of PNGs.
 *
 * Usage: rdna-playground sweep <component> [--out-dir path] [--max N] [--props key=val...]
 */
export async function run(args) {
  const componentId = args[0];
  if (!componentId) {
    console.error(
      "Usage: rdna-playground sweep <component> [--out-dir path] [--max N] [--props key=val...]",
    );
    process.exit(1);
  }

  // Parse flags
  let outDir = `screenshots/${componentId.toLowerCase()}`;
  let maxCaptures = Infinity;
  const pinProps = {};
  let i = 1;

  while (i < args.length) {
    if (args[i] === "--out-dir" && args[i + 1]) {
      outDir = args[i + 1];
      i += 2;
      continue;
    }
    if (args[i] === "--max" && args[i + 1]) {
      maxCaptures = parseInt(args[i + 1], 10);
      i += 2;
      continue;
    }
    if (args[i] === "--props") {
      i++;
      while (i < args.length && !args[i].startsWith("--")) {
        const eq = args[i].indexOf("=");
        if (eq > 0) pinProps[args[i].slice(0, eq)] = args[i].slice(eq + 1);
        i++;
      }
      continue;
    }
    i++;
  }

  // Read component from manifest
  const component = readFullComponent(componentId);
  if (!component) {
    console.error(`Unknown component: ${componentId}`);
    process.exit(1);
  }

  // Build test matrix
  let matrix = buildTestMatrix(component);

  // Pin specified props
  if (Object.keys(pinProps).length > 0) {
    matrix = matrix.filter((entry) => {
      for (const [key, val] of Object.entries(pinProps)) {
        if (String(entry.props[key]) !== val) return false;
      }
      return true;
    });
  }

  // Cap at max
  if (matrix.length > maxCaptures) {
    matrix = matrix.slice(0, maxCaptures);
  }

  mkdirSync(outDir, { recursive: true });

  console.log(
    `\nSweeping ${component.name}: ${matrix.length} state(s) → ${outDir}/\n`,
  );

  if (matrix[0]?.qaFlags.length > 0) {
    console.log(`QA flags: ${matrix[0].qaFlags.join(", ")}\n`);
  }

  let captured = 0;
  let failed = 0;

  for (let idx = 0; idx < matrix.length; idx++) {
    const entry = matrix[idx];
    const filename = `${sanitize(entry.label)}.png`;
    const filePath = resolve(outDir, filename);

    // Build preview URL
    const params = new URLSearchParams();
    params.set("colorMode", entry.colorMode);
    if (entry.state !== "default") params.set("state", entry.state);
    for (const [key, val] of Object.entries(entry.props)) {
      if (val !== undefined && val !== false) {
        params.set(key, String(val));
      }
    }
    for (const [attr, val] of Object.entries(entry.dataAttributes)) {
      params.set(attr, val);
    }

    const previewPath = `/playground/preview/${componentId.toLowerCase()}?${params.toString()}`;

    try {
      const { requestId } = await post("/agent/capture", {
        action: "create",
        previewUrl: previewPath,
      });

      const result = await pollCapture(requestId);

      if (result.status === "complete") {
        const buffer = dataUrlToBuffer(result.dataUrl);
        writeFileSync(filePath, buffer);
        captured++;
        console.log(
          `  [${idx + 1}/${matrix.length}] ${filename}`,
        );
      } else {
        failed++;
        console.error(
          `  [${idx + 1}/${matrix.length}] FAILED: ${result.error ?? "timeout"}`,
        );
      }
    } catch (err) {
      failed++;
      console.error(
        `  [${idx + 1}/${matrix.length}] ERROR: ${err.message}`,
      );
    }
  }

  console.log(
    `\n${captured} screenshots saved to ${outDir}/${failed > 0 ? ` (${failed} failed)` : ""}`,
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

async function pollCapture(requestId) {
  const start = Date.now();
  while (Date.now() - start < POLL_TIMEOUT_MS) {
    const result = await get(`/agent/capture?id=${requestId}`);
    if (result.status !== "pending") return result;
    await sleep(POLL_INTERVAL_MS);
  }
  return { status: "error", error: "timeout" };
}

function dataUrlToBuffer(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  return Buffer.from(base64, "base64");
}

function sanitize(label) {
  return label.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
