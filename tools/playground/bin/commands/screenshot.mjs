import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { post, get } from "../lib/api.mjs";

const POLL_INTERVAL_MS = 200;
const POLL_TIMEOUT_MS = 15_000;

/**
 * Take a screenshot of a component in a specific state.
 *
 * Usage: rdna-playground screenshot <component> [--out path]
 *   [--props key=val...] [--color-mode light|dark] [--state hover]
 */
export async function run(args) {
  const componentId = args[0];
  if (!componentId) {
    console.error(
      "Usage: rdna-playground screenshot <component> [--out path] [--props key=val...] [--color-mode light|dark] [--state hover]",
    );
    process.exit(1);
  }

  // Parse flags
  let outPath = null;
  let colorMode = "light";
  let state = null;
  const propPairs = [];
  let i = 1;

  while (i < args.length) {
    if (args[i] === "--out" && args[i + 1]) {
      outPath = args[i + 1];
      i += 2;
      continue;
    }
    if (args[i] === "--color-mode" && args[i + 1]) {
      colorMode = args[i + 1];
      i += 2;
      continue;
    }
    if (args[i] === "--state" && args[i + 1]) {
      state = args[i + 1];
      i += 2;
      continue;
    }
    if (args[i] === "--props") {
      i++;
      // Collect all following key=val until next flag
      while (i < args.length && !args[i].startsWith("--")) {
        propPairs.push(args[i]);
        i++;
      }
      continue;
    }
    i++;
  }

  // Build preview URL
  const params = new URLSearchParams();
  params.set("colorMode", colorMode);
  if (state) params.set("state", state);
  for (const pair of propPairs) {
    const eq = pair.indexOf("=");
    if (eq > 0) params.set(pair.slice(0, eq), pair.slice(eq + 1));
  }

  const previewPath = `/playground/preview/${componentId.toLowerCase()}?${params.toString()}`;

  // Request capture
  const { requestId } = await post("/agent/capture", {
    action: "create",
    previewUrl: previewPath,
  });

  // Poll for result
  const start = Date.now();
  while (Date.now() - start < POLL_TIMEOUT_MS) {
    const result = await get(`/agent/capture?id=${requestId}`);

    if (result.status === "complete") {
      const buffer = dataUrlToBuffer(result.dataUrl);
      const finalPath =
        outPath || `screenshots/${componentId.toLowerCase()}-${buildFilename(propPairs, colorMode, state)}.png`;

      mkdirSync(dirname(finalPath), { recursive: true });
      writeFileSync(finalPath, buffer);
      console.log(finalPath);
      return;
    }

    if (result.status === "error") {
      console.error(`Capture failed: ${result.error}`);
      process.exit(1);
    }

    await sleep(POLL_INTERVAL_MS);
  }

  console.error("Capture timed out after 15s");
  process.exit(1);
}

/** Convert data URL to Buffer */
function dataUrlToBuffer(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  return Buffer.from(base64, "base64");
}

function buildFilename(propPairs, colorMode, state) {
  const parts = propPairs.map((p) => p.replace("=", "-"));
  parts.push(colorMode);
  if (state) parts.push(state);
  return parts.join("-") || "default";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
