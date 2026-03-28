import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);

export const CONTRACT_FRESHNESS_BASENAME = "contract.freshness.json";
export const REGISTRY_FRESHNESS_BASENAME = "registry.freshness.json";
export const CONTRACT_FRESHNESS_PATH = `packages/radiants/generated/${CONTRACT_FRESHNESS_BASENAME}`;
export const REGISTRY_FRESHNESS_PATH = `tools/playground/generated/${REGISTRY_FRESHNESS_BASENAME}`;

const CONTRACT_STATIC_INPUTS = [
  "packages/radiants/contract/system.ts",
  "packages/radiants/meta/index.ts",
  "packages/radiants/registry/contract-fields.ts",
  "tools/playground/scripts/build-radiants-contract.ts",
  "tools/playground/scripts/load-radiants-component-contracts.ts",
];

const MANIFEST_STATIC_INPUTS = [
  "packages/radiants/meta/index.ts",
  "packages/radiants/registry/contract-fields.ts",
  "packages/radiants/registry/types.ts",
  "tools/playground/scripts/generate-registry.ts",
  "tools/playground/scripts/load-radiants-component-contracts.ts",
];

export function getRepoRoot(scriptPath = SCRIPT_PATH) {
  return resolve(dirname(scriptPath), "../../..");
}

function toRepoPath(repoRoot, filePath) {
  return relative(repoRoot, filePath).replace(/\\/g, "/");
}

function walkFiles(repoRoot, dirPath, predicate, results = []) {
  if (!existsSync(dirPath)) return results;

  for (const entry of readdirSync(dirPath)) {
    const fullPath = resolve(dirPath, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walkFiles(repoRoot, fullPath, predicate, results);
      continue;
    }

    if (predicate(fullPath)) {
      results.push(toRepoPath(repoRoot, fullPath));
    }
  }

  return results;
}

function sortUnique(paths) {
  return [...new Set(paths)].sort();
}

function hashFiles(repoRoot, relPaths) {
  const hash = createHash("sha256");

  for (const relPath of sortUnique(relPaths)) {
    const absPath = resolve(repoRoot, relPath);
    hash.update(relPath);
    hash.update("\0");

    if (existsSync(absPath)) {
      hash.update(readFileSync(absPath));
    } else {
      hash.update("missing");
    }

    hash.update("\0");
  }

  return hash.digest("hex");
}

function collectComponentMetaInputs(repoRoot) {
  return walkFiles(
    repoRoot,
    resolve(repoRoot, "packages/radiants/components/core"),
    (fullPath) => fullPath.endsWith(".meta.ts"),
  );
}

function collectSchemaInputs(repoRoot) {
  return walkFiles(
    repoRoot,
    resolve(repoRoot, "packages"),
    (fullPath) => fullPath.endsWith(".schema.json"),
  );
}

function collectPackageJsonInputs(repoRoot) {
  return walkFiles(
    repoRoot,
    resolve(repoRoot, "packages"),
    (fullPath) => /\/packages\/[^/]+\/package\.json$/.test(fullPath.replace(/\\/g, "/")),
  );
}

export function computeGeneratedArtifactFreshness(repoRoot = getRepoRoot()) {
  const componentMetaInputs = collectComponentMetaInputs(repoRoot);
  const schemaInputs = collectSchemaInputs(repoRoot);
  const packageJsonInputs = collectPackageJsonInputs(repoRoot);

  const radiantsContracts = sortUnique([
    ...CONTRACT_STATIC_INPUTS,
    ...componentMetaInputs,
  ]);

  const registryManifest = sortUnique([
    ...MANIFEST_STATIC_INPUTS,
    ...componentMetaInputs,
    ...schemaInputs,
    ...packageJsonInputs,
  ]);

  return {
    radiantsContracts: {
      sourceHash: hashFiles(repoRoot, radiantsContracts),
      inputs: radiantsContracts,
    },
    registryManifest: {
      sourceHash: hashFiles(repoRoot, registryManifest),
      inputs: registryManifest,
    },
  };
}
