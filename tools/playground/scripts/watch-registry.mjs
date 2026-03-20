#!/usr/bin/env node
/**
 * Dev-time watcher: auto-regenerates canonical artifacts when *.meta.ts or *.tsx
 * files change under packages/radiants/components/core/.
 *
 * Usage:
 *   node tools/playground/scripts/watch-registry.mjs
 *
 * Run via: pnpm --filter @rdna/playground registry:watch
 */

import { watch } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const MONO_ROOT = resolve(__dirname, "../../..");
const WATCH_DIR = resolve(MONO_ROOT, "packages/radiants/components/core");

let debounceTimer = null;
let regenerating = false;

function regenerate(changedFile) {
  if (regenerating) return;
  regenerating = true;
  const rel = relative(MONO_ROOT, changedFile);
  console.log(`\n[registry:watch] change detected: ${rel}`);
  try {
    console.log("[registry:watch] regenerating schemas...");
    execSync("pnpm --filter @rdna/radiants generate:schemas", {
      stdio: "inherit",
      cwd: MONO_ROOT,
    });
    console.log("[registry:watch] regenerating playground manifest...");
    execSync("pnpm --filter @rdna/playground registry:generate", {
      stdio: "inherit",
      cwd: MONO_ROOT,
    });
    console.log("[registry:watch] done.");
  } catch (err) {
    console.error("[registry:watch] regeneration failed:", err.message);
  } finally {
    regenerating = false;
  }
}

function onFileChange(_eventType, filename) {
  if (!filename) return;
  if (!filename.endsWith(".meta.ts") && !filename.endsWith(".tsx")) return;

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    regenerate(resolve(WATCH_DIR, filename));
  }, 300);
}

watch(WATCH_DIR, { recursive: true }, onFileChange);

console.log(`[registry:watch] watching ${relative(MONO_ROOT, WATCH_DIR)} for *.meta.ts and *.tsx changes...`);
console.log("[registry:watch] press Ctrl+C to stop.\n");
