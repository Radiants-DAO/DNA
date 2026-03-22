/**
 * Typed access to the auto-generated registry manifest.
 *
 * The manifest is produced by `scripts/generate-registry.mjs` and contains
 * cross-package component metadata extracted from schema.json and dna.json
 * files. This module provides typed helpers for consuming that data at
 * runtime without coupling to the raw JSON shape.
 */

import type { PropDef, SlotDef } from "@rdna/radiants/registry";
import manifestData from "./registry.manifest.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ManifestProp = PropDef;

export type ManifestSlot = SlotDef;

export interface ManifestExample {
  name: string;
  code: string;
}

export interface ManifestComponent {
  name: string;
  description: string;
  sourcePath: string | null;
  schemaPath: string;
  dnaPath: string | null;
  // Canonical fields from Radiants registry metadata
  category?: string;
  group?: string;
  renderMode?: "inline" | "custom" | "description-only";
  tags?: string[];
  exampleProps?: Record<string, unknown>;
  controlledProps?: string[];
  states?: string[];
  // Schema-level fields
  props: Record<string, ManifestProp>;
  slots: Record<string, ManifestSlot>;
  subcomponents: string[];
  examples: ManifestExample[];
  tokenBindings: Record<string, Record<string, string>> | null;
}

export interface ManifestPackage {
  packageDir: string;
  components: ManifestComponent[];
}

// ---------------------------------------------------------------------------
// Typed manifest
// ---------------------------------------------------------------------------

const manifest = manifestData as unknown as Record<string, ManifestPackage>;

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

/** All discovered package names (e.g. "@rdna/radiants"). */
export function getManifestPackages(): string[] {
  return Object.keys(manifest);
}

/** All components for a given package, or empty array if unknown. */
export function getManifestComponents(
  packageName: string,
): ManifestComponent[] {
  return manifest[packageName]?.components ?? [];
}

/** Look up a single component by package + name. */
export function getManifestEntry(
  packageName: string,
  componentName: string,
): ManifestComponent | undefined {
  return manifest[packageName]?.components.find(
    (c) => c.name === componentName,
  );
}

/** Look up a component by source path across all packages. */
export function getManifestEntryBySourcePath(
  sourcePath: string,
): { packageName: string; component: ManifestComponent } | undefined {
  for (const [pkgName, pkg] of Object.entries(manifest)) {
    const match = pkg.components.find((c) => c.sourcePath === sourcePath);
    if (match) return { packageName: pkgName, component: match };
  }
  return undefined;
}

/** Total component count across all packages. */
export function getManifestComponentCount(): number {
  return Object.values(manifest).reduce(
    (sum, pkg) => sum + pkg.components.length,
    0,
  );
}

/** The raw manifest object (for iteration). */
export { manifest as rawManifest };
