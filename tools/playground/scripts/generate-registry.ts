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
import { fileURLToPath } from "node:url";

// CATEGORY_LABELS is the only import needed from radiants — pure constants, safe for Node 22.
import { componentMetaIndex } from "../../../packages/radiants/meta/index.ts";
import { pickContractFields } from "../../../packages/radiants/registry/contract-fields.ts";
import { CATEGORY_LABELS } from "../../../packages/radiants/registry/types.ts";
import type { ComponentMeta, PreviewState } from "../../../packages/preview/src/index.ts";
import { writeRadiantsContractArtifacts } from "./build-radiants-contract.ts";
import { loadRadiantsComponentContracts } from "./load-radiants-component-contracts.ts";

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
  states?: PreviewState[];
  // Schema-level fields
  props: Record<string, unknown>;
  slots: Record<string, { description: string }>;
  subcomponents: string[];
  examples: Array<{ name: string; code: string }>;
  tokenBindings: Record<string, Record<string, string>> | null;
  replaces?: ComponentMeta["replaces"];
  pixelCorners?: boolean;
  shadowSystem?: ComponentMeta["shadowSystem"];
  styleOwnership?: ComponentMeta["styleOwnership"];
  structuralRules?: ComponentMeta["structuralRules"];
  wraps?: string;
  a11y?: ComponentMeta["a11y"];
}

interface ManifestPackage {
  packageDir: string;
  components: ManifestComponent[];
}

type MetaIndexEntry = {
  meta: ComponentMeta<Record<string, unknown>>;
  sourcePath: string | null;
  schemaPath: string;
};

// ---------------------------------------------------------------------------
// Build Radiants manifest using canonical metadata + schema scanning
// ---------------------------------------------------------------------------

async function buildRadiantsManifest(): Promise<ManifestComponent[]> {
  const contractFieldsByName = new Map(
    (await loadRadiantsComponentContracts()).map((component) => [component.name, component]),
  );

  return (Object.entries(componentMetaIndex) as [string, MetaIndexEntry][])
    .flatMap(([name, entry]) => {
      const meta = entry.meta;
      const reg = meta.registry;
      if (reg?.exclude) return [];

      const componentName = meta.name ?? name;
      const category = reg?.category ?? "layout";
      const group = CATEGORY_LABELS[category] ?? category;
      const contractFields = contractFieldsByName.get(componentName) ?? {};

      return [
        {
          name: componentName,
          description: meta.description ?? "",
          sourcePath: entry.sourcePath ?? null,
          schemaPath: entry.schemaPath,
          category,
          group,
          renderMode: reg?.renderMode ?? "inline",
          tags: reg?.tags,
          exampleProps: reg?.exampleProps,
          controlledProps: reg?.controlledProps,
          states: reg?.states,
          props: meta.props ?? {},
          slots: normalizeSlots(meta.slots),
          subcomponents: meta.subcomponents ?? [],
          examples: meta.examples ?? [],
          tokenBindings: meta.tokenBindings ?? null,
          ...buildManifestContractFields(contractFields),
        },
      ];
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function buildManifestContractFields(
  meta: Partial<Pick<ComponentMeta<unknown>, "replaces" | "pixelCorners" | "shadowSystem" | "styleOwnership" | "structuralRules" | "wraps" | "a11y">>,
) {
  return pickContractFields(meta as ComponentMeta<unknown>);
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

async function main() {
  const manifest: Record<string, ManifestPackage> = {};

  // @rdna/radiants: use canonical metadata + shared contract loader
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
}

if (!process.env.VITEST) {
  await main();
}
