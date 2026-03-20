#!/usr/bin/env node

/**
 * generate-registry.ts
 *
 * Builds the playground manifest from the canonical Radiants registry metadata.
 *
 * For @rdna/radiants: canonical metadata (category, renderMode, tags, etc.)
 * comes from the Radiants display metadata and component paths files.
 * Schema-level data (props, slots, examples, tokenBindings) still comes
 * from scanning schema.json and dna.json files.
 *
 * Usage:
 *   node --experimental-strip-types scripts/generate-registry.ts
 *
 * Output:
 *   generated/registry.manifest.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Import canonical metadata sources from Radiants.
// These files use only `import type` (erased at strip-types) and constants — safe for Node 22 ESM.
import { displayMeta } from "../../../packages/radiants/registry/component-display-meta.ts";
import { componentPaths } from "../../../packages/radiants/registry/component-paths.ts";
import { CATEGORY_LABELS } from "../../../packages/radiants/registry/types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(__dirname, "..");
const MONO_ROOT = resolve(APP_ROOT, "../..");
const OUTPUT_DIR = resolve(APP_ROOT, "generated");
const OUTPUT_FILE = resolve(OUTPUT_DIR, "registry.manifest.json");

// ---------------------------------------------------------------------------
// Schema scanning helpers (unchanged from previous generator)
// ---------------------------------------------------------------------------

function normalizeSlots(raw: unknown): Record<string, { description: string }> {
  if (!raw) return {};
  if (Array.isArray(raw)) {
    const out: Record<string, { description: string }> = {};
    for (const name of raw) out[name] = { description: "" };
    return out;
  }
  return raw as Record<string, { description: string }>;
}

interface SchemaFile {
  name?: string;
  description?: string;
  props?: Record<string, unknown>;
  slots?: unknown;
  subcomponents?: string[];
  examples?: Array<{ name: string; code: string }>;
}

interface DnaFile {
  tokenBindings?: Record<string, Record<string, string>>;
}

/** Read schema + dna data for a single component directory. */
function scanComponentDir(
  componentDir: string,
  dirName: string,
  packageDir: string,
): Array<{
  baseName: string;
  schemaFile: string;
  schema: SchemaFile;
  dna: DnaFile | null;
  hasSource: boolean;
}> {
  if (!existsSync(componentDir)) return [];
  const files = readdirSync(componentDir);
  const schemaFiles = files.filter((f) => f.endsWith(".schema.json"));
  if (schemaFiles.length === 0) return [];

  return schemaFiles.map((schemaFile) => {
    const schemaPath = resolve(componentDir, schemaFile);
    const schema = JSON.parse(readFileSync(schemaPath, "utf-8")) as SchemaFile;
    const baseName = schemaFile.replace(".schema.json", "");
    const dnaFile = `${baseName}.dna.json`;
    const sourceFile = `${baseName}.tsx`;
    let dna: DnaFile | null = null;
    const dnaPath = resolve(componentDir, dnaFile);
    if (existsSync(dnaPath)) {
      dna = JSON.parse(readFileSync(dnaPath, "utf-8")) as DnaFile;
    }
    const hasSource = existsSync(resolve(componentDir, sourceFile));
    return { baseName, schemaFile, schema, dna, hasSource };
  });
}

// ---------------------------------------------------------------------------
// Manifest entry types (extended with canonical fields)
// ---------------------------------------------------------------------------

interface ManifestComponent {
  name: string;
  description: string;
  sourcePath: string | null;
  schemaPath: string;
  dnaPath: string | null;
  // Canonical fields from Radiants metadata
  category?: string;
  group?: string;
  renderMode?: string;
  tags?: string[];
  exampleProps?: Record<string, unknown>;
  controlledProps?: string[];
  states?: string[];
  // Schema-level fields
  props: Record<string, unknown>;
  slots: Record<string, { description: string }>;
  subcomponents: string[];
  examples: Array<{ name: string; code: string }>;
  tokenBindings: Record<string, Record<string, string>> | null;
}

interface ManifestPackage {
  packageDir: string;
  components: ManifestComponent[];
}

// ---------------------------------------------------------------------------
// Build Radiants manifest using canonical metadata + schema scanning
// ---------------------------------------------------------------------------

function buildRadiantsManifest(): ManifestComponent[] {
  const components: ManifestComponent[] = [];
  const radiantsDir = resolve(MONO_ROOT, "packages/radiants/components/core");

  for (const [componentName, paths] of Object.entries(componentPaths)) {
    const meta = displayMeta[componentName];
    if (meta?.exclude) continue;

    // Derive canonical fields
    const category = meta?.category ?? "layout";
    const group = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category;
    const renderMode = meta?.renderMode ?? "inline";

    // Find which directory this component lives in
    const dirName = paths.sourcePath.split("/").slice(-2)[0];
    const componentDir = resolve(radiantsDir, dirName);

    const scanned = scanComponentDir(componentDir, dirName, "radiants");

    // Find the schema entry for this component (by name match)
    const schemaEntry = scanned.find((s) => s.schema.name === componentName || s.baseName === componentName);

    if (!schemaEntry) {
      // Component has no schema file — emit a minimal entry from paths metadata
      components.push({
        name: componentName,
        description: "",
        sourcePath: paths.sourcePath,
        schemaPath: paths.schemaPath,
        dnaPath: null,
        category,
        group,
        renderMode,
        tags: meta?.tags,
        exampleProps: meta?.exampleProps as Record<string, unknown> | undefined,
        controlledProps: meta?.controlledProps,
        props: {},
        slots: {},
        subcomponents: [],
        examples: [],
        tokenBindings: null,
      });
      continue;
    }

    const { schema, dna, hasSource } = schemaEntry;

    components.push({
      name: schema.name ?? componentName,
      description: schema.description ?? "",
      sourcePath: paths.sourcePath,
      schemaPath: paths.schemaPath,
      dnaPath: dna ? paths.schemaPath.replace(".schema.json", ".dna.json") : null,
      category,
      group,
      renderMode,
      tags: meta?.tags,
      exampleProps: meta?.exampleProps as Record<string, unknown> | undefined,
      controlledProps: meta?.controlledProps,
      props: (schema.props ?? {}) as Record<string, unknown>,
      slots: normalizeSlots(schema.slots),
      subcomponents: schema.subcomponents ?? [],
      examples: schema.examples ?? [],
      tokenBindings: dna?.tokenBindings ?? null,
    });
  }

  return components.sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// Generic package scanning for non-Radiants packages
// ---------------------------------------------------------------------------

interface PackageInfo {
  dir: string;
  packageName: string;
  packageDir: string;
}

function discoverNonRadiantsPackages(): PackageInfo[] {
  const packagesDir = resolve(MONO_ROOT, "packages");
  const packages: PackageInfo[] = [];

  for (const name of readdirSync(packagesDir)) {
    if (name === "radiants") continue; // handled separately
    const pkgDir = resolve(packagesDir, name);
    if (!statSync(pkgDir).isDirectory()) continue;
    const pkgJsonPath = resolve(pkgDir, "package.json");
    if (!existsSync(pkgJsonPath)) continue;
    const componentsDir = resolve(pkgDir, "components/core");
    if (!existsSync(componentsDir)) continue;
    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
    packages.push({ dir: componentsDir, packageName: pkgJson.name, packageDir: name });
  }

  return packages;
}

function buildGenericPackageManifest(pkg: PackageInfo): ManifestComponent[] {
  const components: ManifestComponent[] = [];

  for (const dirName of readdirSync(pkg.dir)) {
    const componentDir = resolve(pkg.dir, dirName);
    if (!statSync(componentDir).isDirectory()) continue;

    const scanned = scanComponentDir(componentDir, dirName, pkg.packageDir);
    for (const { schema, dna, hasSource, schemaFile, baseName } of scanned) {
      const sourceFile = `${baseName}.tsx`;
      components.push({
        name: schema.name ?? baseName,
        description: schema.description ?? "",
        sourcePath: hasSource
          ? `packages/${pkg.packageDir}/components/core/${dirName}/${sourceFile}`
          : null,
        schemaPath: `packages/${pkg.packageDir}/components/core/${dirName}/${schemaFile}`,
        dnaPath: dna
          ? `packages/${pkg.packageDir}/components/core/${dirName}/${baseName}.dna.json`
          : null,
        props: (schema.props ?? {}) as Record<string, unknown>,
        slots: normalizeSlots(schema.slots),
        subcomponents: schema.subcomponents ?? [],
        examples: schema.examples ?? [],
        tokenBindings: dna?.tokenBindings ?? null,
      });
    }
  }

  return components.sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const manifest: Record<string, ManifestPackage> = {};

// @rdna/radiants: use canonical metadata
const radiantsComponents = buildRadiantsManifest();
if (radiantsComponents.length > 0) {
  manifest["@rdna/radiants"] = {
    packageDir: "radiants",
    components: radiantsComponents,
  };
}

// Other packages: generic schema scanning
for (const pkg of discoverNonRadiantsPackages()) {
  const components = buildGenericPackageManifest(pkg);
  if (components.length > 0) {
    manifest[pkg.packageName] = { packageDir: pkg.packageDir, components };
  }
}

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2) + "\n");

const totalComponents = Object.values(manifest).reduce(
  (sum, pkg) => sum + pkg.components.length,
  0,
);

console.log(`Wrote ${OUTPUT_FILE}`);
console.log(`${Object.keys(manifest).length} package(s), ${totalComponents} component(s).`);
for (const [pkgName, pkgData] of Object.entries(manifest)) {
  console.log(`  ${pkgName}: ${pkgData.components.length} components`);
}
