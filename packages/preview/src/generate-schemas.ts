import { readdirSync, writeFileSync, existsSync, mkdirSync, rmSync } from "fs";
import { join, relative, resolve, dirname } from "path";
import { pathToFileURL } from "url";
import type { ComponentMeta } from "./types";

interface MetaEntry {
  name: string;
  dirName: string;
  metaFileName: string;
  /** Absolute path to the detected .tsx source file, or null if not found. */
  sourcePath: string | null;
  /** Repo-root-relative source path override from meta.sourcePath (for co-authored components). */
  sourcePathOverride: string | null;
  schemaPath: string;
}

async function processDir(
  componentsDir: string,
  dirName: string
): Promise<MetaEntry[]> {
  const dirPath = join(componentsDir, dirName);
  const files = readdirSync(dirPath);
  const metaFiles = files.filter((f) => f.endsWith(".meta.ts"));
  const activeBaseNames = new Set<string>();

  const entries: MetaEntry[] = [];

  for (const metaFile of metaFiles) {
    const metaPath = join(dirPath, metaFile);
    const mod = await import(pathToFileURL(metaPath).href);
    const meta = Object.values(mod).find(
      (v: unknown): v is ComponentMeta =>
        typeof v === "object" &&
        v !== null &&
        "name" in v &&
        "props" in v
    );
    if (!meta) continue;

    const baseName = metaFile.replace(/\.meta\.ts$/, "");
    activeBaseNames.add(baseName);
    const schemaPath = join(dirPath, `${baseName}.schema.json`);
    const {
      tokenBindings: _tokenBindings,
      registry: _registry,
      sourcePath: _sourcePath,
      replaces: _replaces,
      pixelCorners: _pixelCorners,
      shadowSystem: _shadowSystem,
      styleOwnership: _styleOwnership,
      structuralRules: _structuralRules,
      density: _density,
      wraps: _wraps,
      a11y: _a11y,
      ...schema
    } = meta as ComponentMeta & {
      registry?: unknown;
      sourcePath?: string;
    };

    writeFileSync(schemaPath, JSON.stringify(schema, null, 2) + "\n");

    // Detect same-named .tsx, or use repo-root-relative override from meta.sourcePath
    const sourcePathOverride = (meta as ComponentMeta & { sourcePath?: string }).sourcePath ?? null;
    const detectedSourceFile = join(dirPath, `${baseName}.tsx`);
    entries.push({
      name: meta.name,
      dirName,
      metaFileName: metaFile,
      sourcePath: sourcePathOverride ? null : (existsSync(detectedSourceFile) ? detectedSourceFile : null),
      sourcePathOverride,
      schemaPath,
    });
  }

  for (const file of files) {
    if (!file.endsWith(".schema.json")) continue;
    const baseName = file.replace(/\.schema\.json$/, "");
    if (activeBaseNames.has(baseName)) continue;
    rmSync(join(dirPath, file), { force: true });
  }

  return entries;
}

export async function generateSchemas(
  componentsDir: string,
  metaBarrelOutputPath?: string,
  schemaBarrelOutputPath?: string
): Promise<void> {
  const dirs = readdirSync(componentsDir, { withFileTypes: true }).filter(
    (d) => d.isDirectory()
  );

  const allEntries: MetaEntry[] = [];
  let generated = 0;

  for (const dir of dirs) {
    const entries = await processDir(componentsDir, dir.name);
    allEntries.push(...entries);
    generated += entries.length;
  }

  console.log(`Generated schemas for ${generated} meta files`);

  if (metaBarrelOutputPath) {
    writeMetaBarrel(componentsDir, allEntries, metaBarrelOutputPath);
  }

  if (schemaBarrelOutputPath) {
    writeSchemaBarrel(allEntries, schemaBarrelOutputPath);
  }
}

function writeMetaBarrel(
  componentsDir: string,
  entries: MetaEntry[],
  barrelPath: string
): void {
  const barrelDir = dirname(barrelPath);
  // Repo root is 3 levels above barrelDir (.../packages/radiants/meta -> repo root)
  const REPO_ROOT = resolve(barrelDir, "../../..");
  const lines: string[] = [
    "// AUTO-GENERATED — do not edit by hand",
    "// Run: pnpm --filter @rdna/radiants generate:schemas",
    "",
  ];

  // Import lines (barrelDir-relative, keep .ts extension so Node ESM can resolve generated barrels)
  for (const entry of entries) {
    const metaPath = join(componentsDir, entry.dirName, entry.metaFileName);
    const relPath = relative(barrelDir, metaPath);
    const importPath = relPath.startsWith(".") ? relPath : `./${relPath}`;
    const exportName = `${entry.name}Meta`;
    lines.push(`import { ${exportName} } from "${importPath}";`);
  }

  lines.push("");
  lines.push("export const componentMetaIndex = {");

  for (const entry of entries) {
    const exportName = `${entry.name}Meta`;
    // Paths are repo-root-relative so buildRegistryMetadata + Node scripts can use them directly.
    // sourcePathOverride is already repo-root-relative; detected sourcePath needs conversion.
    const repoSourcePath = entry.sourcePathOverride
      ?? (entry.sourcePath ? relative(REPO_ROOT, entry.sourcePath) : null);
    const repoSchemaPath = relative(REPO_ROOT, entry.schemaPath);
    lines.push(`  ${entry.name}: {`);
    lines.push(`    meta: ${exportName},`);
    if (repoSourcePath !== null) {
      lines.push(`    sourcePath: ${JSON.stringify(repoSourcePath)},`);
    } else {
      lines.push(`    sourcePath: null,`);
    }
    lines.push(`    schemaPath: ${JSON.stringify(repoSchemaPath)},`);
    lines.push(`  },`);
  }

  lines.push("} as const;");
  lines.push("");

  mkdirSync(barrelDir, { recursive: true });
  writeFileSync(barrelPath, lines.join("\n"));
  console.log(`Wrote barrel to ${barrelPath} (${entries.length} entries)`);
}

function writeSchemaBarrel(entries: MetaEntry[], barrelPath: string): void {
  const barrelDir = dirname(barrelPath);
  const lines: string[] = [
    "// AUTO-GENERATED — do not edit by hand",
    "// Run: pnpm --filter @rdna/radiants generate:schemas",
    "",
  ];

  for (const entry of entries) {
    const schemaImportPath = relative(barrelDir, entry.schemaPath);
    const schemaImport = schemaImportPath.startsWith(".")
      ? schemaImportPath
      : `./${schemaImportPath}`;
    lines.push(`import ${entry.name}Schema from ${JSON.stringify(schemaImport)};`);
  }

  lines.push("");
  lines.push("export const componentData = {");

  for (const entry of entries) {
    lines.push(`  ${entry.name}: { schema: ${entry.name}Schema },`);
  }

  lines.push("} as const;");
  lines.push("");
  lines.push("export type ComponentName = keyof typeof componentData;");
  lines.push("export type ComponentData = (typeof componentData)[ComponentName];");
  lines.push("");

  mkdirSync(barrelDir, { recursive: true });
  writeFileSync(barrelPath, lines.join("\n"));
  console.log(`Wrote barrel to ${barrelPath} (${entries.length} entries)`);
}

// CLI entrypoint
if (!process.env.VITEST) {
  const componentsDir = process.argv[2];
  const metaBarrelOutputPath = process.argv[3];
  const schemaBarrelOutputPath = process.argv[4];
  if (!componentsDir) {
    console.error("Usage: tsx generate-schemas.ts <components-dir> [meta-barrel-output-path] [schema-barrel-output-path]");
    process.exit(1);
  }
  generateSchemas(
    resolve(componentsDir),
    metaBarrelOutputPath ? resolve(metaBarrelOutputPath) : undefined,
    schemaBarrelOutputPath ? resolve(schemaBarrelOutputPath) : undefined,
  );
}
