#!/usr/bin/env node

/**
 * verify-generated-variation.mjs
 *
 * Runs RDNA design-system lint rules against playground iteration files
 * and/or adopted destination files.
 *
 * Usage:
 *   node scripts/verify-generated-variation.mjs                    # lint all iterations
 *   node scripts/verify-generated-variation.mjs path/to/file.tsx   # lint specific file
 *
 * Exit code 0 = pass, 1 = violations found or error
 */

import { execSync } from "child_process";
import { existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(__dirname, "..");
const MONO_ROOT = resolve(APP_ROOT, "../..");
const ITERATIONS_DIR = resolve(
  APP_ROOT,
  "app/playground/iterations",
);

function getTargetFiles() {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    // Explicit file paths
    return args.map((f) => resolve(f));
  }

  // Default: all .tsx iteration files
  if (!existsSync(ITERATIONS_DIR)) {
    console.log("No iterations directory found. Nothing to verify.");
    process.exit(0);
  }

  const files = readdirSync(ITERATIONS_DIR)
    .filter((f) => f.endsWith(".tsx") && f.includes(".iteration-"))
    .map((f) => resolve(ITERATIONS_DIR, f));

  if (files.length === 0) {
    console.log("No iteration files found. Nothing to verify.");
    process.exit(0);
  }

  return files;
}

const files = getTargetFiles();

console.log(`\nVerifying ${files.length} file(s) against RDNA rules...\n`);

try {
  const fileArgs = files.map((f) => `'${f}'`).join(" ");
  const cmd = `pnpm exec eslint --config eslint.rdna.config.mjs ${fileArgs}`;

  execSync(cmd, {
    cwd: MONO_ROOT,
    stdio: "inherit",
    env: { ...process.env },
  });

  console.log("\n✓ All files pass RDNA design-system checks.\n");
  process.exit(0);
} catch (error) {
  console.error("\n✗ RDNA violations found in generated files.\n");
  process.exit(1);
}
