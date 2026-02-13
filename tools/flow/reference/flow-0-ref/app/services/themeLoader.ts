/**
 * Theme Loader Service
 *
 * Wraps ESM imports from @rdna/radiants for component discovery and loading.
 * No filesystem operations needed - pure ESM imports.
 */

import {
  schemas,
  dna,
  componentNames,
  getComponentData,
} from "@rdna/radiants/schemas";
import type React from "react";

// ============================================================================
// Types
// ============================================================================

export interface ComponentSchema {
  name: string;
  description: string;
  props: Record<
    string,
    {
      type: string;
      values?: string[];
      default?: unknown;
      description: string;
    }
  >;
  slots?: Record<string, { description: string }>;
  examples?: Array<{ name: string; code: string }>;
  subcomponents?: string[];
}

export interface ComponentDNA {
  component: string;
  description: string;
  tokenBindings: Record<string, Record<string, string>>;
  states?: Record<string, Record<string, string>>;
}

export interface ThemeComponent {
  name: string;
  schema: ComponentSchema | null;
  dna: ComponentDNA | null;
}

export interface LoadedTheme {
  name: string;
  displayName: string;
  version: string;
  components: ThemeComponent[];
}

// ============================================================================
// Theme Loading
// ============================================================================

/**
 * Load theme metadata and component list.
 * Returns synchronously since all data comes from ESM imports.
 */
export function loadTheme(): LoadedTheme {
  const components: ThemeComponent[] = componentNames.map((name) => {
    const data = getComponentData(name);
    return {
      name,
      schema: (data?.schema as ComponentSchema) ?? null,
      dna: (data?.dna as ComponentDNA) ?? null,
    };
  });

  return {
    name: "radiants",
    displayName: "Radiants",
    version: "0.1.2",
    components: components.sort((a, b) => a.name.localeCompare(b.name)),
  };
}

/**
 * Get schema for a specific component.
 */
export function getSchema(name: string): ComponentSchema | null {
  return (schemas[name as keyof typeof schemas] as ComponentSchema) ?? null;
}

/**
 * Get DNA token bindings for a specific component.
 */
export function getDNA(name: string): ComponentDNA | null {
  return (dna[name as keyof typeof dna] as ComponentDNA) ?? null;
}

// ============================================================================
// Component Loading
// ============================================================================

// Cache for loaded components
const componentCache = new Map<string, React.ComponentType>();

/**
 * Get the actual React component by name.
 * Uses dynamic import from the pre-compiled ESM bundle.
 */
export async function getComponent(
  name: string
): Promise<React.ComponentType | null> {
  // Check cache first
  if (componentCache.has(name)) {
    return componentCache.get(name)!;
  }

  try {
    const module = await import("@rdna/radiants/components/core");
    const Component = (module as Record<string, unknown>)[name];

    if (typeof Component === "function") {
      const comp = Component as React.ComponentType;
      componentCache.set(name, comp);
      return comp;
    }

    console.warn(`[themeLoader] Component "${name}" not found in radiants`);
    return null;
  } catch (err) {
    console.error(`[themeLoader] Failed to import component "${name}":`, err);
    return null;
  }
}

/**
 * Preload all components into cache.
 * Useful for faster subsequent renders.
 */
export async function preloadComponents(): Promise<void> {
  try {
    const module = await import("@rdna/radiants/components/core");

    for (const name of componentNames) {
      const Component = (module as Record<string, unknown>)[name];
      if (typeof Component === "function") {
        componentCache.set(name, Component as React.ComponentType);
      }
    }
  } catch (err) {
    console.error("[themeLoader] Failed to preload components:", err);
  }
}

// ============================================================================
// Exports
// ============================================================================

export { componentNames };
