/**
 * Component Meta Generator for RadFlow
 *
 * Generates ComponentMeta by:
 * 1. Parsing TypeScript component files (via Rust/SWC)
 * 2. Looking for and merging .dna.json overrides
 * 3. Providing sensible defaults for missing data
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { ComponentInfo } from "../bindings";
import type {
  ComponentMeta,
  DnaConfig,
  AIInterface,
  SlotDefinition,
} from "../types/componentMeta";
import {
  createComponentMeta,
  mergeDnaConfig,
} from "../types/componentMeta";

// =============================================================================
// DNA Config Loading
// =============================================================================

/**
 * Resolve possible DNA config file paths for a component
 */
export function getDnaConfigPaths(componentFile: string): string[] {
  const baseName = componentFile.replace(/\.[jt]sx?$/, "");
  const dir = componentFile.substring(0, componentFile.lastIndexOf("/"));
  const fileName = componentFile.substring(componentFile.lastIndexOf("/") + 1);
  const nameWithoutExt = fileName.replace(/\.[jt]sx?$/, "");

  return [
    // Same directory, same name
    `${baseName}.dna.json`,
    // Same directory, in a dna subfolder
    `${dir}/dna/${nameWithoutExt}.dna.json`,
    // Component folder pattern
    `${dir}/${nameWithoutExt}/${nameWithoutExt}.dna.json`,
  ];
}

/**
 * Resolve possible schema file paths for a component
 */
export function getSchemaConfigPaths(componentFile: string): string[] {
  const baseName = componentFile.replace(/\.[jt]sx?$/, "");
  const dir = componentFile.substring(0, componentFile.lastIndexOf("/"));
  const fileName = componentFile.substring(componentFile.lastIndexOf("/") + 1);
  const nameWithoutExt = fileName.replace(/\.[jt]sx?$/, "");

  return [
    // Same directory, same name
    `${baseName}.schema.json`,
    // Same directory, in a schema subfolder
    `${dir}/schema/${nameWithoutExt}.schema.json`,
    // Component folder pattern
    `${dir}/${nameWithoutExt}/${nameWithoutExt}.schema.json`,
  ];
}

/**
 * Parse DNA config from JSON content
 * Returns sensible defaults if parsing fails
 */
export function parseDnaConfig(content: string): DnaConfig {
  try {
    const parsed = JSON.parse(content);
    return {
      tokenBindings: parsed.tokenBindings ?? parsed.tokens ?? undefined,
      presetStyles: parsed.presetStyles ?? parsed.styles ?? undefined,
      variants: parsed.variants ?? undefined,
      states: parsed.states ?? undefined,
    };
  } catch {
    console.warn("[generateComponentMeta] Failed to parse DNA config");
    return {};
  }
}

/**
 * Parse schema config from JSON content
 */
export function parseSchemaConfig(
  content: string
): { aiInterface?: AIInterface; slots?: SlotDefinition[] } {
  try {
    const parsed = JSON.parse(content);
    return {
      aiInterface: parsed.aiInterface ?? parsed.ai ?? undefined,
      slots: parsed.slots ?? undefined,
    };
  } catch {
    console.warn("[generateComponentMeta] Failed to parse schema config");
    return {};
  }
}

// =============================================================================
// Component Meta Generation
// =============================================================================

/**
 * Generate ComponentMeta from ComponentInfo
 *
 * This is the main entry point for the meta generation system.
 * It takes the raw component info from SWC parsing and enhances it
 * with sensible defaults.
 */
export function generateComponentMeta(info: ComponentInfo): ComponentMeta {
  // Start with basic meta from TypeScript parsing
  const baseMeta = createComponentMeta({
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
    })),
  });

  // Apply component-name-based defaults
  return applyNameBasedDefaults(baseMeta);
}

/**
 * Generate ComponentMeta with DNA config merged in
 */
export function generateComponentMetaWithDna(
  info: ComponentInfo,
  dnaConfig?: DnaConfig,
  dnaConfigPath?: string,
  schemaConfig?: { aiInterface?: AIInterface; slots?: SlotDefinition[] }
): ComponentMeta {
  let meta = generateComponentMeta(info);

  // Merge DNA config if provided
  if (dnaConfig) {
    meta = mergeDnaConfig(meta, dnaConfig, dnaConfigPath);
  }

  // Merge schema config if provided
  if (schemaConfig) {
    if (schemaConfig.aiInterface) {
      meta = { ...meta, aiInterface: schemaConfig.aiInterface };
    }
    if (schemaConfig.slots) {
      meta = { ...meta, slots: schemaConfig.slots };
    }
  }

  return meta;
}

/**
 * Apply name-based defaults for common component patterns
 */
function applyNameBasedDefaults(meta: ComponentMeta): ComponentMeta {
  const lowerName = meta.name.toLowerCase();
  const updated = { ...meta };

  // Category inference
  if (
    lowerName.includes("button") ||
    lowerName.includes("link") ||
    lowerName.includes("anchor")
  ) {
    updated.category = "action";
    updated.icon = "cursor-click";
  } else if (
    lowerName.includes("input") ||
    lowerName.includes("select") ||
    lowerName.includes("textarea") ||
    lowerName.includes("checkbox") ||
    lowerName.includes("radio")
  ) {
    updated.category = "form";
    updated.icon = "form-input";
  } else if (
    lowerName.includes("card") ||
    lowerName.includes("container") ||
    lowerName.includes("box") ||
    lowerName.includes("wrapper")
  ) {
    updated.category = "layout";
    updated.icon = "layout";
  } else if (
    lowerName.includes("heading") ||
    lowerName.includes("text") ||
    lowerName.includes("paragraph") ||
    lowerName.includes("title")
  ) {
    updated.category = "typography";
    updated.icon = "type";
  } else if (
    lowerName.includes("image") ||
    lowerName.includes("avatar") ||
    lowerName.includes("icon")
  ) {
    updated.category = "media";
    updated.icon = "image";
  } else if (
    lowerName.includes("nav") ||
    lowerName.includes("menu") ||
    lowerName.includes("tabs") ||
    lowerName.includes("breadcrumb")
  ) {
    updated.category = "navigation";
    updated.icon = "menu";
  } else if (
    lowerName.includes("modal") ||
    lowerName.includes("dialog") ||
    lowerName.includes("drawer") ||
    lowerName.includes("popover") ||
    lowerName.includes("tooltip")
  ) {
    updated.category = "overlay";
    updated.icon = "layers";
  } else if (
    lowerName.includes("list") ||
    lowerName.includes("table") ||
    lowerName.includes("grid")
  ) {
    updated.category = "data";
    updated.icon = "table";
  }

  // Builder hooks based on component type
  if (lowerName.includes("modal") || lowerName.includes("dialog")) {
    updated.builderHooks = {
      ...updated.builderHooks,
      resizable: { horizontal: true, vertical: true },
    };
  }

  return updated;
}

// =============================================================================
// Batch Processing
// =============================================================================

/**
 * Generate ComponentMeta for multiple components
 */
export function generateComponentMetaBatch(
  components: ComponentInfo[]
): ComponentMeta[] {
  return components.map(generateComponentMeta);
}

/**
 * Create a lookup map from file:line key to ComponentMeta
 * This matches the hybrid discovery pattern (ADR-4)
 */
export function createComponentMetaMap(
  components: ComponentInfo[]
): Map<string, ComponentMeta> {
  const map = new Map<string, ComponentMeta>();

  for (const comp of components) {
    const key = `${comp.file}:${comp.line}`;
    map.set(key, generateComponentMeta(comp));
  }

  return map;
}

// =============================================================================
// Async Loading (for file-based DNA configs)
// =============================================================================

/**
 * Options for async component meta generation
 */
export interface GenerateMetaOptions {
  /** Function to read file content (for DNA config loading) */
  readFile?: (path: string) => Promise<string | null>;
  /** Whether to load DNA configs */
  loadDnaConfigs?: boolean;
  /** Whether to load schema configs */
  loadSchemaConfigs?: boolean;
}

/**
 * Generate ComponentMeta with async DNA config loading
 */
export async function generateComponentMetaAsync(
  info: ComponentInfo,
  options: GenerateMetaOptions = {}
): Promise<ComponentMeta> {
  let meta = generateComponentMeta(info);

  if (!options.readFile) {
    return meta;
  }

  // Try to load DNA config
  if (options.loadDnaConfigs !== false) {
    const dnaPaths = getDnaConfigPaths(info.file);
    for (const path of dnaPaths) {
      const content = await options.readFile(path);
      if (content) {
        const dnaConfig = parseDnaConfig(content);
        meta = mergeDnaConfig(meta, dnaConfig, path);
        break; // Use first found config
      }
    }
  }

  // Try to load schema config
  if (options.loadSchemaConfigs !== false) {
    const schemaPaths = getSchemaConfigPaths(info.file);
    for (const path of schemaPaths) {
      const content = await options.readFile(path);
      if (content) {
        const schemaConfig = parseSchemaConfig(content);
        if (schemaConfig.aiInterface) {
          meta = { ...meta, aiInterface: schemaConfig.aiInterface };
        }
        if (schemaConfig.slots) {
          meta = { ...meta, slots: schemaConfig.slots };
        }
        break; // Use first found config
      }
    }
  }

  return meta;
}

/**
 * Generate ComponentMeta batch with async DNA config loading
 */
export async function generateComponentMetaBatchAsync(
  components: ComponentInfo[],
  options: GenerateMetaOptions = {}
): Promise<ComponentMeta[]> {
  return Promise.all(
    components.map((comp) => generateComponentMetaAsync(comp, options))
  );
}
