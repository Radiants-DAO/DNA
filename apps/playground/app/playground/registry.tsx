"use client";

import {
  registry as sharedRegistry,
  CATEGORY_LABELS,
} from "@rdna/radiants/registry";
import type {
  RegistryEntry as SharedEntry,
  ComponentCategory,
} from "@rdna/radiants/registry";
import {
  getManifestEntryBySourcePath,
  rawManifest,
} from "../../generated/registry";
import type { ManifestComponent } from "../../generated/registry";
import { playgroundOverrides } from "./registry.overrides";
import type { RegistryEntry } from "./types";

/** Source paths already covered by the shared registry */
const sharedSourcePaths = new Set(
  sharedRegistry.map((e) => e.sourcePath),
);

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
      ? (entry.Demo as NonNullable<RegistryEntry["Component"]>)
      : entry.component
        ? (entry.component as NonNullable<RegistryEntry["Component"]>)
        : null;

  if (!Component) return null;

  // Look up manifest metadata for this component
  const manifestHit = entry.sourcePath
    ? getManifestEntryBySourcePath(entry.sourcePath)
    : undefined;

  // Look up playground-specific overrides
  const override = playgroundOverrides[entry.name];

  // Derive default props: override > exampleProps > first variant > empty
  const defaultProps =
    override?.defaultProps ??
    entry.exampleProps ??
    entry.variants?.[0]?.props ??
    {};

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

/**
 * Infer a category label from the component name for packages
 * that don't have shared display metadata.
 */
function inferCategory(component: ManifestComponent): string {
  const name = component.name.toLowerCase();
  if (/button|action|menu/i.test(name)) return "Actions";
  if (/card|layout|divider|accordion|window/i.test(name)) return "Layout";
  if (/input|select|checkbox|switch|slider|form/i.test(name)) return "Forms";
  if (/alert|badge|progress|toast|tooltip/i.test(name)) return "Feedback";
  if (/tab|nav|breadcrumb|stepper/i.test(name)) return "Navigation";
  if (/dialog|sheet|popover|overlay|modal/i.test(name)) return "Overlays";
  return "Components";
}

/**
 * Build metadata-only entries from the manifest for packages
 * that don't have a shared runtime registry (e.g. @rdna/monolith).
 */
function manifestOnlyEntries(): RegistryEntry[] {
  const entries: RegistryEntry[] = [];

  for (const [pkgName, pkg] of Object.entries(rawManifest)) {
    for (const component of pkg.components) {
      // Skip components already covered by a shared registry
      if (component.sourcePath && sharedSourcePaths.has(component.sourcePath)) {
        continue;
      }

      const override = playgroundOverrides[component.name];

      entries.push({
        id: `${pkg.packageDir}-${component.name}`.toLowerCase(),
        label: component.name,
        group: inferCategory(component),
        packageName: pkgName,
        Component: null, // Not renderable without a shared registry/demo
        defaultProps: override?.defaultProps ?? {},
        sourcePath: component.sourcePath ?? "",
        schemaPath: component.schemaPath,
        propsInterface: override?.propsInterface,
        tokenBindings: component.tokenBindings ?? null,
      });
    }
  }

  return entries;
}

/** Radiants entries from the shared registry */
const radiantsEntries: RegistryEntry[] = sharedRegistry
  .map(toPlaygroundEntry)
  .filter((e): e is RegistryEntry => e !== null);

/** Manifest-only entries from other packages */
const otherEntries = manifestOnlyEntries();

export const registry: RegistryEntry[] = [
  ...radiantsEntries,
  ...otherEntries,
];
