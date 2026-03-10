"use client";

import {
  registry as sharedRegistry,
  CATEGORY_LABELS,
} from "@rdna/radiants/registry";
import type {
  RegistryEntry as SharedEntry,
} from "@rdna/radiants/registry";
import {
  getManifestEntryBySourcePath,
} from "../../generated/registry";
import { playgroundOverrides } from "./registry.overrides";
import type { RegistryEntry } from "./types";

/**
 * Map a shared registry entry to a playground registry entry,
 * enriched with manifest metadata (token bindings, etc.)
 * and playground-specific overrides.
 *
 * Returns null for description-only entries (no renderable component).
 */
function toPlaygroundEntry(entry: SharedEntry): RegistryEntry | null {
  if (entry.renderMode === "description-only") return null;

  // For custom entries, use the Demo wrapper. For inline, use the component directly.
  const Component =
    entry.renderMode === "custom" && entry.Demo
      ? (entry.Demo as RegistryEntry["Component"])
      : entry.component
        ? (entry.component as RegistryEntry["Component"])
        : null;

  if (!Component) return null;

  // Derive default props: prefer exampleProps, then first variant's props, then empty
  const defaultProps =
    entry.exampleProps ??
    entry.variants?.[0]?.props ??
    {};

  // Look up manifest metadata for this component
  const manifestHit = entry.sourcePath
    ? getManifestEntryBySourcePath(entry.sourcePath)
    : undefined;

  // Look up playground-specific overrides
  const override = playgroundOverrides[entry.name];

  return {
    id: entry.name.toLowerCase(),
    label: entry.name,
    group: CATEGORY_LABELS[entry.category] ?? entry.category,
    packageName: manifestHit?.packageName ?? "@rdna/radiants",
    Component,
    defaultProps,
    sourcePath: entry.sourcePath,
    schemaPath: entry.schemaPath,
    propsInterface: override?.propsInterface,
    tokenBindings: manifestHit?.component.tokenBindings ?? null,
  };
}

export const registry: RegistryEntry[] = sharedRegistry
  .map(toPlaygroundEntry)
  .filter((e): e is RegistryEntry => e !== null);
