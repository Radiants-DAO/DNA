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

import { execSync } from "node:child_process";

const CHECKED_PATHS = [
  "packages/radiants/components/core",
  "packages/radiants/meta/index.ts",
  "tools/playground/generated/registry.manifest.json",
];

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

console.log("=== Registry freshness check ===");
console.log("Regenerating schemas...");
run("pnpm --filter @rdna/radiants generate:schemas");

console.log("\nRegenerating playground manifest...");
run("pnpm --filter @rdna/playground registry:generate");

console.log("\nChecking for drift in generated artifacts...");
run(
  `git diff --exit-code -- ${CHECKED_PATHS.join(" ")}`
);

console.log("\n✓ All generated artifacts are up to date.");
