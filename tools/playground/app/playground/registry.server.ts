/**
 * Server-safe registry data for API routes.
 *
 * The main registry.tsx is marked "use client" because it imports React
 * components. API routes (server-only) need only the metadata (id, sourcePath).
 * This module reads from the generated manifest JSON — no React imports.
 */

import manifestData from "../../generated/registry.manifest.json";

export interface ServerRegistryEntry {
  id: string;
  label: string;
  sourcePath: string;
  schemaPath?: string;
}

type ManifestPackage = {
  packageDir: string;
  components: Array<{
    name: string;
    sourcePath?: string;
    schemaPath?: string;
  }>;
};

const manifest = manifestData as Record<string, ManifestPackage>;

export const serverRegistry: ServerRegistryEntry[] = Object.values(manifest)
  .flatMap((pkg) =>
    pkg.components.map((c) => ({
      id: c.name.toLowerCase(),
      label: c.name,
      sourcePath: c.sourcePath ?? "",
      schemaPath: c.schemaPath,
    })),
  );
