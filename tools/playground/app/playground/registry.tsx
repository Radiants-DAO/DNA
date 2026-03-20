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
  rawManifest,
} from "../../generated/registry";
import type { ManifestComponent } from "../../generated/registry";
import { appRegistry } from "./app-registry";
import type { RegistryEntry } from "./types";

/** Packages whose components are fully managed by a shared runtime registry */
const SHARED_REGISTRY_PACKAGES = new Set(["@rdna/radiants"]);

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

  // Derive default props: exampleProps > first variant > empty
  const defaultProps =
    entry.exampleProps ??
    entry.variants?.[0]?.props ??
    {};

  return {
    id: entry.name.toLowerCase(),
    componentName: entry.name,
    label: entry.name + '.tsx',
    group: CATEGORY_LABELS[entry.category] ?? entry.category,
    packageName: manifestHit?.packageName ?? "@rdna/radiants",
    Component,
    rawComponent: entry.component
      ? (entry.component as NonNullable<RegistryEntry["rawComponent"]>)
      : null,
    renderMode: entry.renderMode === "custom" ? ("custom" as const) : ("inline" as const),
    variants: entry.variants,
    defaultProps,
    sourcePath: entry.sourcePath,
    schemaPath: entry.schemaPath,
    tokenBindings: manifestHit?.component.tokenBindings ?? null,
    manifestProps: manifestHit?.component.props ?? undefined,
    controlledProps: entry.controlledProps,
  };
}

/**
 * Infer a category label from the component name for packages
 * that don't have shared display metadata.
 */
function inferCategory(component: ManifestComponent): string {
  const name = component.name.toLowerCase();
  if (/button|action|menu/.test(name)) return "Actions";
  if (/card|layout|divider|accordion|window/.test(name)) return "Layout";
  if (/input|select|checkbox|switch|slider|form/.test(name)) return "Forms";
  if (/alert|badge|progress|toast|tooltip/.test(name)) return "Feedback";
  if (/tab|nav|breadcrumb|stepper/.test(name)) return "Navigation";
  if (/dialog|sheet|popover|overlay|modal/.test(name)) return "Overlays";
  return "Components";
}

/**
 * Build metadata-only entries from the manifest for packages
 * that don't have a shared runtime registry.
 */
function manifestOnlyEntries(): RegistryEntry[] {
  const entries: RegistryEntry[] = [];

  for (const [pkgName, pkg] of Object.entries(rawManifest)) {
    // Skip packages that have a shared runtime registry
    if (SHARED_REGISTRY_PACKAGES.has(pkgName)) continue;

    for (const component of pkg.components) {
      entries.push({
        id: `${pkg.packageDir}-${component.name}`.toLowerCase(),
        componentName: component.name,
        label: component.sourcePath ? component.sourcePath.split('/').pop()! : component.name,
        group: inferCategory(component),
        packageName: pkgName,
        Component: null, // Not renderable without a shared registry/demo
        rawComponent: null,
        renderMode: "inline" as const,
        defaultProps: {},
        sourcePath: component.sourcePath ?? "",
        schemaPath: component.schemaPath,
        tokenBindings: component.tokenBindings ?? null,
        manifestProps: component.props ?? undefined,
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
  ...appRegistry,
];

/** O(1) lookup by entry id */
export const registryById = new Map(registry.map((e) => [e.id, e]));
