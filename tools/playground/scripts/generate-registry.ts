#!/usr/bin/env node

/**
 * generate-registry.ts
 *
 * Builds the playground manifest from the canonical Radiants registry metadata.
 *
 * For @rdna/radiants: all metadata (category, renderMode, tags, props, slots,
 * examples, tokenBindings, etc.) is read directly from the co-located
 * *.meta.ts files in packages/radiants/components/core.
 *
 * Usage:
 *   node --experimental-strip-types scripts/generate-registry.ts
 *
 * Output:
 *   generated/registry.manifest.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// CATEGORY_LABELS is the only import needed from radiants — pure constants, safe for Node 22.
import { CATEGORY_LABELS } from "../../../packages/radiants/registry/types.ts";
import { writeRadiantsContractArtifacts } from "./build-radiants-contract.ts";

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

/** Read schema data for a single component directory. */
function scanComponentDir(
  componentDir: string,
  dirName: string,
  packageDir: string,
): Array<{
  baseName: string;
  schemaFile: string;
  schema: SchemaFile;
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
    const sourceFile = `${baseName}.tsx`;
    const hasSource = existsSync(resolve(componentDir, sourceFile));
    return { baseName, schemaFile, schema, hasSource };
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

/**
 * Build the Radiants component manifest by scanning co-located *.meta.ts files.
 *
 * This is the single authoritative assembler for Radiants metadata in the
 * playground. It reads each component's *.meta.ts as the canonical source for:
 *   - registry facts (category, renderMode, tags, exampleProps, states, …)
 *   - schema facts (props, slots, subcomponents, examples, description)
 *   - tokenBindings
 *
 * No central metadata files (component-display-meta.ts, component-paths.ts)
 * are consulted. The *.meta.ts files are the single source of truth.
 */
async function buildRadiantsManifest(): Promise<ManifestComponent[]> {
  const components: ManifestComponent[] = [];
  const radiantsDir = resolve(MONO_ROOT, "packages/radiants/components/core");

  for (const dirName of readdirSync(radiantsDir)) {
    const componentDir = resolve(radiantsDir, dirName);
    if (!statSync(componentDir).isDirectory()) continue;

    const metaFiles = readdirSync(componentDir).filter((f) => f.endsWith(".meta.ts"));

    for (const metaFileName of metaFiles) {
      const metaFilePath = resolve(componentDir, metaFileName);
      let meta: Record<string, unknown> | undefined;

      try {
        const mod = await import(pathToFileURL(metaFilePath).href);
        meta = Object.values(mod).find(
          (v): v is Record<string, unknown> =>
            typeof v === "object" && v !== null && "name" in v && "props" in v,
        ) as Record<string, unknown> | undefined;
      } catch {
        continue;
      }

      if (!meta) continue;

      const reg = meta.registry as Record<string, unknown> | undefined;
      if (reg?.exclude) continue;

      const componentName = meta.name as string;
      const category = (reg?.category ?? "layout") as string;
      const group = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category;
      const renderMode = (reg?.renderMode ?? "inline") as string;
      const baseName = metaFileName.replace(".meta.ts", "");

      // Honor explicit sourcePath overrides for co-authored components like
      // Radio/Label/TextArea before falling back to same-named source files.
      const sourcePathOverride =
        typeof meta.sourcePath === "string" ? meta.sourcePath : null;
      const sourceFile = resolve(componentDir, `${baseName}.tsx`);
      const sourcePath = sourcePathOverride
        ?? (existsSync(sourceFile)
          ? `packages/radiants/components/core/${dirName}/${baseName}.tsx`
          : null);
      const schemaPath = `packages/radiants/components/core/${dirName}/${baseName}.schema.json`;
      const tokenBindings =
        typeof meta.tokenBindings === "object" && meta.tokenBindings !== null
          ? (meta.tokenBindings as Record<string, Record<string, string>>)
          : null;

      components.push({
        name: componentName,
        description: (meta.description ?? "") as string,
        sourcePath,
        schemaPath,
        category,
        group,
        renderMode,
        tags: reg?.tags as string[] | undefined,
        exampleProps: reg?.exampleProps as Record<string, unknown> | undefined,
        controlledProps: reg?.controlledProps as string[] | undefined,
        states: reg?.states as string[] | undefined,
        props: (meta.props ?? {}) as Record<string, unknown>,
        slots: normalizeSlots(meta.slots),
        subcomponents: (meta.subcomponents ?? []) as string[],
        examples: (meta.examples ?? []) as Array<{ name: string; code: string }>,
        tokenBindings,
      });
    }
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
    for (const { schema, hasSource, schemaFile, baseName } of scanned) {
      const sourceFile = `${baseName}.tsx`;
      components.push({
        name: schema.name ?? baseName,
        description: schema.description ?? "",
        sourcePath: hasSource
          ? `packages/${pkg.packageDir}/components/core/${dirName}/${sourceFile}`
          : null,
        schemaPath: `packages/${pkg.packageDir}/components/core/${dirName}/${schemaFile}`,
        props: (schema.props ?? {}) as Record<string, unknown>,
        slots: normalizeSlots(schema.slots),
        subcomponents: schema.subcomponents ?? [],
        examples: schema.examples ?? [],
        tokenBindings: null,
      });
    }
  }

  return components.sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const manifest: Record<string, ManifestPackage> = {};

// @rdna/radiants: use canonical metadata (async — loads meta.ts files for canonical registry facts)
const radiantsComponents = await buildRadiantsManifest();
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

// Emit design-system contract artifacts alongside the registry manifest
const CONTRACT_OUTPUT_DIR = resolve(MONO_ROOT, "packages/radiants/generated");
await writeRadiantsContractArtifacts(CONTRACT_OUTPUT_DIR);
console.log(`Wrote contract artifacts to ${CONTRACT_OUTPUT_DIR}`);

const totalComponents = Object.values(manifest).reduce(
  (sum, pkg) => sum + pkg.components.length,
  0,
);

console.log(`Wrote ${OUTPUT_FILE}`);
console.log(`${Object.keys(manifest).length} package(s), ${totalComponents} component(s).`);
for (const [pkgName, pkgData] of Object.entries(manifest)) {
  console.log(`  ${pkgName}: ${pkgData.components.length} components`);
}
