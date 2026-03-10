#!/usr/bin/env node

/**
 * generate-violations-manifest.mjs
 *
 * Runs the RDNA ESLint scan against all playground-registered component
 * source paths and iteration files, then writes a normalized JSON manifest
 * that the playground UI can consume.
 *
 * Usage:
 *   node scripts/generate-violations-manifest.mjs
 *
 * Output:
 *   generated/violations.manifest.json
 *
 * Exit codes:
 *   0 — manifest written (may contain violations)
 *   1 — ESLint failed to run (config error, missing binary, etc.)
 */

import { execSync } from "child_process";
import { existsSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { resolve, dirname, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(__dirname, "..");
const MONO_ROOT = resolve(APP_ROOT, "../..");
const OUTPUT_DIR = resolve(APP_ROOT, "generated");
const OUTPUT_FILE = resolve(OUTPUT_DIR, "violations.manifest.json");
const ITERATIONS_DIR = resolve(APP_ROOT, "app/playground/iterations");

// Source paths of registered components (from shared registry).
// These are the files the RDNA config already covers.
const COMPONENT_SOURCE_GLOBS = [
  "packages/radiants/components/core/**/*.{ts,tsx}",
];

function collectIterationFiles() {
  if (!existsSync(ITERATIONS_DIR)) return [];
  return readdirSync(ITERATIONS_DIR)
    .filter((f) => f.endsWith(".tsx") && f.includes(".iteration-"))
    .map((f) => resolve(ITERATIONS_DIR, f));
}

/**
 * Run ESLint and return parsed JSON results.
 * Returns { ok: true, results } on success (including when violations are found).
 * Returns { ok: false, error } when ESLint itself fails (config error, crash, etc.).
 */
function runEslint(targets) {
  if (targets.length === 0) return { ok: true, results: [] };

  const targetArgs = targets.map((t) => `'${t}'`).join(" ");
  const cmd = `pnpm exec eslint --config eslint.rdna.config.mjs --format json ${targetArgs}`;

  try {
    const stdout = execSync(cmd, {
      cwd: MONO_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    }).toString();
    return { ok: true, results: JSON.parse(stdout) };
  } catch (error) {
    // ESLint exits 1 when violations are found — stdout still has valid JSON
    if (error.stdout) {
      try {
        const parsed = JSON.parse(error.stdout.toString());
        if (Array.isArray(parsed)) {
          return { ok: true, results: parsed };
        }
      } catch {
        // stdout wasn't valid JSON — real failure
      }
    }
    return {
      ok: false,
      error: error.stderr?.toString() || error.message,
    };
  }
}

function buildManifest(eslintResults) {
  const manifest = {};

  for (const result of eslintResults) {
    if (result.messages.length === 0) continue;

    const relPath = relative(MONO_ROOT, result.filePath);

    const violations = result.messages
      .filter((m) => m.ruleId && m.ruleId.startsWith("rdna/"))
      .map((m) => ({
        ruleId: m.ruleId,
        severity: m.severity === 2 ? "error" : "warn",
        message: m.message,
        line: m.line,
        column: m.column,
      }));

    if (violations.length > 0) {
      manifest[relPath] = violations;
    }
  }

  return manifest;
}

// Main
const iterationFiles = collectIterationFiles();
const allTargets = [
  ...COMPONENT_SOURCE_GLOBS,
  ...iterationFiles,
];

console.log(`Scanning ${COMPONENT_SOURCE_GLOBS.length} glob(s) + ${iterationFiles.length} iteration file(s)...`);

const run = runEslint(allTargets);

if (!run.ok) {
  console.error(`\n✗ ESLint failed to run. Manifest NOT written.\n`);
  console.error(run.error);
  process.exit(1);
}

const manifest = buildManifest(run.results);

const totalViolations = Object.values(manifest).reduce(
  (sum, vs) => sum + vs.length,
  0,
);

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2) + "\n");

console.log(`\nWrote ${OUTPUT_FILE}`);
console.log(
  `${Object.keys(manifest).length} file(s) with ${totalViolations} RDNA violation(s).`,
);
