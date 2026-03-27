/**
 * Typed access to the auto-generated registry manifest.
 *
 * The manifest is produced by `scripts/generate-registry.ts` and contains
 * cross-package component metadata extracted from schema.json and *.meta.ts
 * files. This module provides typed helpers for consuming that data at
 * runtime without coupling to the raw JSON shape.
 */

import type {
  A11yContract,
  DensityContract,
  CompositionRules,
  ElementReplacement,
  PreviewState,
  PropDef,
  SlotDef,
  StructuralRule,
  StyleOwnership,
} from "@rdna/radiants/registry";
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
  // Canonical fields from Radiants registry metadata
  category?: string;
  group?: string;
  renderMode?: "inline" | "custom" | "description-only";
  tags?: string[];
  exampleProps?: Record<string, unknown>;
  controlledProps?: string[];
  states?: PreviewState[];
  // Schema-level fields
  props: Record<string, ManifestProp>;
  slots: Record<string, ManifestSlot>;
  subcomponents: string[];
  examples: ManifestExample[];
  tokenBindings: Record<string, Record<string, string>> | null;
  replaces?: ElementReplacement[];
  pixelCorners?: boolean;
  shadowSystem?: "standard" | "pixel";
  styleOwnership?: StyleOwnership[];
  structuralRules?: StructuralRule[];
  density?: DensityContract;
  composition?: CompositionRules;
  wraps?: string;
  a11y?: A11yContract;
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

/** Look up a single component by package + name. */
export function getManifestEntry(
  packageName: string,
  componentName: string,
): ManifestComponent | undefined {
  return manifest[packageName]?.components.find(
    (c) => c.name === componentName,
  );
}

/** The raw manifest object (for iteration). */
export { manifest as rawManifest };
