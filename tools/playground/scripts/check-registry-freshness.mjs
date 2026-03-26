#!/usr/bin/env node
/**
 * CI freshness guard: regenerates all canonical artifacts and fails if any drift
 * is detected against the committed tree.
 *
 * Usage:
 *   node tools/playground/scripts/check-registry-freshness.mjs
 *
 * Run via: pnpm --filter @rdna/playground check:registry-freshness
 */

import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);

export const CHECKED_PATHS = [
  "packages/radiants/components/core",
  "packages/radiants/meta/index.ts",
  "packages/radiants/schemas/index.ts",
  "packages/radiants/generated/eslint-contract.json",
  "packages/radiants/generated/ai-contract.json",
  "packages/radiants/generated/figma",
  ".component-contracts.example",
  "tools/playground/generated/registry.manifest.json",
];

export function getRepoRoot(scriptPath = SCRIPT_PATH) {
  return resolve(dirname(scriptPath), "../../..");
}

export const REPO_ROOT = getRepoRoot();

export function run(command, args = []) {
  console.log(`\n> ${[command, ...args].join(" ")}`);
  execFileSync(command, args, { stdio: "inherit", cwd: REPO_ROOT });
}

export function main() {
  console.log("=== Registry freshness check ===");
  console.log("Regenerating schemas...");
  run("pnpm", ["--filter", "@rdna/radiants", "generate:schemas"]);

  console.log("\nRegenerating Figma contracts and playground manifest...");
  run("pnpm", ["--filter", "@rdna/playground", "registry:generate"]);

  console.log("\nChecking for drift in generated artifacts...");
  run("git", ["diff", "--exit-code", "--", ...CHECKED_PATHS]);

  console.log("\n✓ All generated artifacts are up to date.");
}

if (process.argv[1] && resolve(process.argv[1]) === SCRIPT_PATH) {
  main();
}
