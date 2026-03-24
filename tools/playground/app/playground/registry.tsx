"use client";

import {
  registry as sharedRegistry,
} from "@rdna/radiants/registry";
import type {
  RegistryEntry as SharedEntry,
} from "@rdna/radiants/registry";
import {
  rawManifest,
} from "../../generated/registry";
import { appRegistry } from "./app-registry";
import type { RegistryEntry } from "./types";

/** Packages whose components are fully managed by a shared runtime registry */
const SHARED_REGISTRY_PACKAGES = new Set(["@rdna/radiants"]);

/**
 * Map a shared registry entry to a playground registry entry.
 *
 * Returns null for description-only entries (no renderable component).
 */
function toPlaygroundEntry(entry: SharedEntry): RegistryEntry | null {
  if (entry.renderMode === "description-only") return null;

  const Component =
    entry.renderMode === "custom" && entry.Demo
      ? (entry.Demo as NonNullable<RegistryEntry["Component"]>)
      : entry.component
        ? (entry.component as NonNullable<RegistryEntry["Component"]>)
        : null;

  if (!Component) return null;

  return {
    id: entry.id,
    componentName: entry.name,
    label: entry.label,
    group: entry.group,
    packageName: entry.packageName,
    Component,
    rawComponent: entry.component
      ? (entry.component as NonNullable<RegistryEntry["rawComponent"]>)
      : null,
    renderMode: entry.renderMode === "custom" ? ("custom" as const) : ("inline" as const),
    variants: entry.variants,
    defaultProps: entry.defaultProps,
    props: entry.props,
    sourcePath: entry.sourcePath,
    schemaPath: entry.schemaPath,
    tokenBindings: entry.tokenBindings,
    controlledProps: entry.controlledProps,
    states: entry.states,
  };
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
        group: component.group ?? "Components",
        packageName: pkgName,
        Component: null, // Not renderable without a shared registry/demo
        rawComponent: null,
        renderMode: "inline" as const,
        defaultProps: {},
        props: component.props ?? {},
        sourcePath: component.sourcePath ?? "",
        schemaPath: component.schemaPath,
        tokenBindings: component.tokenBindings ?? null,
        states: component.states,
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
