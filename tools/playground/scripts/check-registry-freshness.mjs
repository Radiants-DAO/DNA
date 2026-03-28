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
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CONTRACT_FRESHNESS_PATH,
  REGISTRY_FRESHNESS_PATH,
  computeGeneratedArtifactFreshness,
} from "./generated-artifact-hashes.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);

export const GENERATED_ARTIFACT_PATHS = [
  "packages/radiants/meta/index.ts",
  "packages/radiants/schemas/index.ts",
  "packages/radiants/generated/eslint-contract.json",
  "packages/radiants/generated/ai-contract.json",
  CONTRACT_FRESHNESS_PATH,
  "packages/radiants/generated/figma",
  ".component-contracts.example",
  "tools/playground/generated/registry.manifest.json",
  REGISTRY_FRESHNESS_PATH,
];

export const CHECKED_PATHS = GENERATED_ARTIFACT_PATHS;

export function getRepoRoot(scriptPath = SCRIPT_PATH) {
  return resolve(dirname(scriptPath), "../../..");
}

export const REPO_ROOT = getRepoRoot();

function readJsonIfPresent(filePath) {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf8"));
}

export function getFreshnessStatus(repoRoot = REPO_ROOT) {
  const expected = computeGeneratedArtifactFreshness(repoRoot);
  const recorded = {
    radiantsContracts: readJsonIfPresent(resolve(repoRoot, CONTRACT_FRESHNESS_PATH)),
    registryManifest: readJsonIfPresent(resolve(repoRoot, REGISTRY_FRESHNESS_PATH)),
  };

  return {
    expected,
    recorded,
    radiantsContracts:
      recorded.radiantsContracts?.sourceHash === expected.radiantsContracts.sourceHash,
    registryManifest:
      recorded.registryManifest?.sourceHash === expected.registryManifest.sourceHash,
  };
}

export function run(command, args = []) {
  console.log(`\n> ${[command, ...args].join(" ")}`);
  execFileSync(command, args, { stdio: "inherit", cwd: REPO_ROOT });
}

export function main() {
  console.log("=== Registry freshness check ===");
  const freshness = getFreshnessStatus();
  if (freshness.radiantsContracts && freshness.registryManifest) {
    console.log("Recorded source hashes match authored inputs; skipping regeneration.");
    run("git", ["diff", "--exit-code", "--", ...GENERATED_ARTIFACT_PATHS]);
    console.log("\n✓ All generated artifacts are up to date.");
    return;
  }

  const staleTargets = [];
  if (!freshness.radiantsContracts) staleTargets.push("radiants-contracts");
  if (!freshness.registryManifest) staleTargets.push("registry-manifest");
  console.log(`Stale or missing freshness metadata: ${staleTargets.join(", ")}`);

  console.log("Regenerating schemas...");
  run("pnpm", ["--filter", "@rdna/radiants", "generate:schemas"]);

  console.log("\nRegenerating Figma contracts and playground manifest...");
  run("pnpm", ["--filter", "@rdna/playground", "registry:generate"]);

  console.log("\nChecking for drift in generated artifacts...");
  run("git", ["diff", "--exit-code", "--", ...GENERATED_ARTIFACT_PATHS]);

  console.log("\n✓ All generated artifacts are up to date.");
}

if (process.argv[1] && resolve(process.argv[1]) === SCRIPT_PATH) {
  main();
}
