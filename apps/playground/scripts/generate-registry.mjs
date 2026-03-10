#!/usr/bin/env node

/**
 * generate-registry.mjs
 *
 * Scans packages/{name}/components/core/ for schema.json and dna.json,
 * then writes a normalized manifest the playground can consume.
 *
 * Usage:
 *   node scripts/generate-registry.mjs
 *
 * Output:
 *   generated/registry.manifest.json
 *
 * Primary metadata sources (per plan):
 *   - schema.json files in package component directories
 *   - dna.json files in package component directories
 *   - exported component barrels (not parsed — prefer schema/dna first)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(__dirname, "..");
const MONO_ROOT = resolve(APP_ROOT, "../..");
const OUTPUT_DIR = resolve(APP_ROOT, "generated");
const OUTPUT_FILE = resolve(OUTPUT_DIR, "registry.manifest.json");

/**
 * Find packages that have a components/core/ directory.
 * Returns { dir, packageName, packageDir } for each.
 */
function discoverPackages() {
  const packagesDir = resolve(MONO_ROOT, "packages");
  const packages = [];

  for (const name of readdirSync(packagesDir)) {
    const pkgDir = resolve(packagesDir, name);
    if (!statSync(pkgDir).isDirectory()) continue;

    const pkgJsonPath = resolve(pkgDir, "package.json");
    if (!existsSync(pkgJsonPath)) continue;

    const componentsDir = resolve(pkgDir, "components/core");
    if (!existsSync(componentsDir)) continue;

    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));

    packages.push({
      dir: componentsDir,
      packageName: pkgJson.name,
      packageDir: name,
    });
  }

  return packages;
}

/**
 * Scan a single component directory for schema/dna metadata.
 * Handles multi-schema directories (e.g. Tabs/ has Tabs + StepperTabs).
 */
function scanComponentDir(componentDir, dirName, packageDir) {
  const files = readdirSync(componentDir);
  const schemaFiles = files.filter((f) => f.endsWith(".schema.json"));

  if (schemaFiles.length === 0) return [];

  return schemaFiles.map((schemaFile) => {
    const schemaPath = resolve(componentDir, schemaFile);
    const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));

    const baseName = schemaFile.replace(".schema.json", "");
    const dnaFile = `${baseName}.dna.json`;
    const sourceFile = `${baseName}.tsx`;

    let dna = null;
    const dnaPath = resolve(componentDir, dnaFile);
    if (existsSync(dnaPath)) {
      dna = JSON.parse(readFileSync(dnaPath, "utf-8"));
    }

    const hasSource = existsSync(resolve(componentDir, sourceFile));

    return {
      name: schema.name || baseName,
      description: schema.description || "",
      sourcePath: hasSource
        ? `packages/${packageDir}/components/core/${dirName}/${sourceFile}`
        : null,
      schemaPath: `packages/${packageDir}/components/core/${dirName}/${schemaFile}`,
      dnaPath: dna
        ? `packages/${packageDir}/components/core/${dirName}/${dnaFile}`
        : null,
      props: schema.props || {},
      slots: schema.slots || {},
      subcomponents: schema.subcomponents || [],
      examples: schema.examples || [],
      tokenBindings: dna?.tokenBindings || null,
    };
  });
}

/**
 * Build the full manifest across all packages.
 */
function buildManifest() {
  const packages = discoverPackages();
  const manifest = {};

  for (const pkg of packages) {
    const components = [];

    for (const dirName of readdirSync(pkg.dir)) {
      const componentDir = resolve(pkg.dir, dirName);
      if (!statSync(componentDir).isDirectory()) continue;

      const entries = scanComponentDir(componentDir, dirName, pkg.packageDir);
      components.push(...entries);
    }

    if (components.length > 0) {
      manifest[pkg.packageName] = {
        packageDir: pkg.packageDir,
        components: components.sort((a, b) => a.name.localeCompare(b.name)),
      };
    }
  }

  return manifest;
}

// Main
const manifest = buildManifest();

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2) + "\n");

const totalComponents = Object.values(manifest).reduce(
  (sum, pkg) => sum + pkg.components.length,
  0,
);

console.log(`Wrote ${OUTPUT_FILE}`);
console.log(
  `${Object.keys(manifest).length} package(s), ${totalComponents} component(s).`,
);

for (const [pkgName, pkgData] of Object.entries(manifest)) {
  console.log(`  ${pkgName}: ${pkgData.components.length} components`);
}
