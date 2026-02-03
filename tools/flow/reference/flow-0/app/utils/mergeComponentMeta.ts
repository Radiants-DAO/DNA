/**
 * Hybrid Component Discovery - Merge Function
 *
 * Combines static TypeScript analysis (from Rust SWC parser) with runtime fiber
 * inspection (from bridge package) using file:line as the primary key.
 *
 * This enables:
 * - Rich type information from static analysis
 * - Actual prop values from runtime inspection
 * - Discovery of both rendered and unrendered components
 *
 * Task: fn-2-gnc.11 Hybrid Component Discovery
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { ComponentInfo } from "../bindings";
import type { SerializedComponentEntry, SourceLocation } from "../stores/types";
import type {
  ComponentMeta,
  ComponentInstance,
  DnaConfig,
} from "../types/componentMeta";
import {
  createComponentMeta,
  mergeDnaConfig,
} from "../types/componentMeta";

// =============================================================================
// Key Generation
// =============================================================================

/**
 * Generate a unique key for component lookup.
 * Uses file:line as the primary key, NOT component name.
 *
 * Rationale: Component names may differ between static (export name)
 * and runtime (displayName). File:line is always unique.
 */
export function getComponentKey(filePath: string, line: number): string {
  return `${filePath}:${line}`;
}

/**
 * Get component key from a SourceLocation.
 */
export function getKeyFromSource(source: SourceLocation): string {
  return getComponentKey(source.filePath, source.line);
}

/**
 * Get component key from a ComponentInfo (static analysis).
 */
export function getKeyFromComponentInfo(info: ComponentInfo): string {
  return getComponentKey(info.file, info.line);
}

// =============================================================================
// Conversion Utilities
// =============================================================================

/**
 * Convert a SerializedComponentEntry to a ComponentInstance.
 */
export function toComponentInstance(
  entry: SerializedComponentEntry
): ComponentInstance {
  return {
    radflowId: entry.radflowId,
    selector: entry.selector,
    fallbackSelectors: entry.fallbackSelectors,
    fiberType: entry.fiberType,
    props: entry.props,
    parentId: entry.parentId,
    childIds: entry.childIds,
  };
}

/**
 * Convert ComponentInfo (from Rust bindings) to ComponentMeta.
 * Uses createComponentMeta for consistent defaults.
 */
export function fromComponentInfo(info: ComponentInfo): ComponentMeta {
  return createComponentMeta({
    name: info.name,
    file: info.file,
    line: info.line,
    defaultExport: info.defaultExport,
    unionTypes: info.unionTypes,
    props: info.props.map((p) => ({
      name: p.name,
      type: p.type,
      default: p.default,
      doc: p.doc,
      required: p.required,
      controlType: p.controlType,
      options: p.options,
    })),
  });
}

/**
 * Create a ComponentMeta from a runtime entry only (no static analysis).
 * Used for dynamic components not found in static scan.
 */
export function fromRuntimeEntry(
  entry: SerializedComponentEntry
): ComponentMeta | null {
  // Skip entries without source info (e.g., node_modules components)
  if (!entry.source) {
    return null;
  }

  // Create minimal meta with just runtime data
  const meta = createComponentMeta({
    name: entry.displayName || entry.name,
    file: entry.source.filePath,
    line: entry.source.line,
    defaultExport: false, // Unknown from runtime
    unionTypes: [],
    props: [], // No static prop info available
  });

  // Add the runtime instance
  meta.instances = [toComponentInstance(entry)];

  return meta;
}

// =============================================================================
// Merge Function (ADR-4: Hybrid Component Discovery)
// =============================================================================

/**
 * Merge static component analysis with runtime fiber inspection.
 *
 * Algorithm:
 * 1. Index static components by file:line (unique key)
 * 2. For each runtime entry, find matching static component
 * 3. Merge matched pairs (static types + runtime instances)
 * 4. Include unrendered static components (instances: [])
 * 5. Include runtime-only components (no static info)
 *
 * Edge Cases Handled:
 * - Component name differs between static (export name) and runtime (displayName):
 *   Uses file:line as primary key
 * - Multiple components with same name in different files:
 *   File path disambiguates
 * - Static analysis finds component but it's never rendered:
 *   Included with empty instances array
 * - Runtime finds component not in static scan (dynamic component):
 *   Included with minimal static info
 *
 * @param staticMeta - Components from static TypeScript analysis
 * @param runtimeEntries - Components from fiber bridge inspection
 * @returns Merged ComponentMeta array with both static and runtime data
 */
export function mergeComponentMeta(
  staticMeta: ComponentInfo[],
  runtimeEntries: SerializedComponentEntry[]
): ComponentMeta[] {
  // 1. Index static components by file:line (unique key)
  const staticIndex = new Map<string, ComponentMeta>();
  for (const info of staticMeta) {
    const key = getKeyFromComponentInfo(info);
    staticIndex.set(key, fromComponentInfo(info));
  }

  // 2. For each runtime entry, find matching static component
  const merged: ComponentMeta[] = [];
  const processedKeys = new Set<string>();

  for (const entry of runtimeEntries) {
    // Skip node_modules components (no source info)
    if (!entry.source) {
      continue;
    }

    const key = getKeyFromSource(entry.source);
    const staticComponent = staticIndex.get(key);

    if (staticComponent) {
      // 3a. Merge matched pair: static types + runtime instance
      // Check if we've already processed this key (multiple instances)
      const existingMerged = merged.find(
        (m) => getComponentKey(m.file, m.line) === key
      );

      if (existingMerged) {
        // Add another instance to existing merged component
        existingMerged.instances.push(toComponentInstance(entry));
      } else {
        // First instance of this component
        merged.push({
          ...staticComponent,
          instances: [toComponentInstance(entry)],
        });
        processedKeys.add(key);
      }
    } else {
      // 3b. Runtime-only component (dynamic or not in static scan)
      const existingRuntime = merged.find(
        (m) => getComponentKey(m.file, m.line) === key
      );

      if (existingRuntime) {
        // Add another instance
        existingRuntime.instances.push(toComponentInstance(entry));
      } else {
        // Create new runtime-only meta
        const runtimeMeta = fromRuntimeEntry(entry);
        if (runtimeMeta) {
          merged.push(runtimeMeta);
          processedKeys.add(key);
        }
      }
    }
  }

  // 4. Add unrendered static components
  for (const [key, meta] of staticIndex) {
    if (!processedKeys.has(key)) {
      // Component found in static analysis but never rendered
      merged.push({
        ...meta,
        instances: [], // Empty - not rendered
      });
    }
  }

  return merged;
}

// =============================================================================
// DNA Config Merge (Layered Override)
// =============================================================================

/**
 * Apply DNA configurations to merged component metadata.
 * DNA values override existing values where specified.
 *
 * @param mergedMeta - Array of merged ComponentMeta
 * @param dnaConfigs - Map of file path to DnaConfig
 * @returns ComponentMeta array with DNA overrides applied
 */
export function applyDnaConfigs(
  mergedMeta: ComponentMeta[],
  dnaConfigs: Map<string, DnaConfig>
): ComponentMeta[] {
  return mergedMeta.map((meta) => {
    const dnaConfig = dnaConfigs.get(meta.file);
    if (dnaConfig) {
      return mergeDnaConfig(meta, dnaConfig, meta.file + ".dna.json");
    }
    return meta;
  });
}

// =============================================================================
// Lookup Utilities
// =============================================================================

/**
 * Create a lookup map from file:line key to ComponentMeta.
 */
export function createMergedComponentMap(
  mergedMeta: ComponentMeta[]
): Map<string, ComponentMeta> {
  const map = new Map<string, ComponentMeta>();
  for (const meta of mergedMeta) {
    const key = getComponentKey(meta.file, meta.line);
    map.set(key, meta);
  }
  return map;
}

/**
 * Create a lookup map from radflowId to ComponentMeta.
 * Includes all instances, so one ComponentMeta may appear multiple times.
 */
export function createRadflowIdMap(
  mergedMeta: ComponentMeta[]
): Map<string, ComponentMeta> {
  const map = new Map<string, ComponentMeta>();
  for (const meta of mergedMeta) {
    for (const instance of meta.instances) {
      map.set(instance.radflowId, meta);
    }
  }
  return map;
}

/**
 * Find ComponentMeta by radflowId.
 */
export function findByRadflowId(
  mergedMeta: ComponentMeta[],
  radflowId: string
): ComponentMeta | undefined {
  for (const meta of mergedMeta) {
    if (meta.instances.some((i) => i.radflowId === radflowId)) {
      return meta;
    }
  }
  return undefined;
}

/**
 * Find ComponentMeta by file:line key.
 */
export function findByFileAndLine(
  mergedMeta: ComponentMeta[],
  filePath: string,
  line: number
): ComponentMeta | undefined {
  const key = getComponentKey(filePath, line);
  return mergedMeta.find((m) => getComponentKey(m.file, m.line) === key);
}

/**
 * Get all rendered components (has at least one instance).
 */
export function getRenderedComponents(
  mergedMeta: ComponentMeta[]
): ComponentMeta[] {
  return mergedMeta.filter((m) => m.instances.length > 0);
}

/**
 * Get all unrendered components (no instances).
 */
export function getUnrenderedComponents(
  mergedMeta: ComponentMeta[]
): ComponentMeta[] {
  return mergedMeta.filter((m) => m.instances.length === 0);
}

// =============================================================================
// Statistics
// =============================================================================

/**
 * Get merge statistics for debugging/display.
 */
export interface MergeStats {
  /** Total components after merge */
  total: number;
  /** Components with both static and runtime data */
  merged: number;
  /** Components found only in static analysis (not rendered) */
  staticOnly: number;
  /** Components found only at runtime (dynamic) */
  runtimeOnly: number;
  /** Total runtime instances */
  totalInstances: number;
}

/**
 * Calculate merge statistics.
 */
export function getMergeStats(
  staticCount: number,
  runtimeCount: number,
  mergedMeta: ComponentMeta[]
): MergeStats {
  const rendered = mergedMeta.filter((m) => m.instances.length > 0);
  const unrendered = mergedMeta.filter((m) => m.instances.length === 0);

  // A component is "runtime-only" if it has instances but no props
  // (since we can't get static prop info from runtime)
  const runtimeOnly = rendered.filter((m) => m.props.length === 0);
  const staticOnly = unrendered.length;
  const merged = rendered.length - runtimeOnly.length;

  const totalInstances = mergedMeta.reduce(
    (sum, m) => sum + m.instances.length,
    0
  );

  return {
    total: mergedMeta.length,
    merged,
    staticOnly,
    runtimeOnly: runtimeOnly.length,
    totalInstances,
  };
}
