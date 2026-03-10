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

function runEslint(targets) {
  if (targets.length === 0) return [];

  const targetArgs = targets.map((t) => `'${t}'`).join(" ");
  const cmd = `pnpm exec eslint --config eslint.rdna.config.mjs --format json ${targetArgs}`;

  try {
    const stdout = execSync(cmd, {
      cwd: MONO_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    }).toString();
    return JSON.parse(stdout);
  } catch (error) {
    // ESLint exits 1 when violations are found — stdout still has JSON
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout.toString());
      } catch {
        // Fallback: not JSON
      }
    }
    console.error("ESLint run failed:", error.message);
    return [];
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

const results = runEslint(allTargets);
const manifest = buildManifest(results);

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
