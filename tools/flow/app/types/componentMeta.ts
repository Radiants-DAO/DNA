/**
 * Hybrid Component Meta System for RadFlow
 *
 * Combines DNA's schema approach with Webstudio's WsComponentMeta patterns.
 * - DNA: .schema.json (AI parsing), .dna.json (token bindings, style presets)
 * - Webstudio: Auto-generated from TypeScript, builder hooks, content model
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * Portions derived from Webstudio (https://github.com/webstudio-is/webstudio)
 */

import type { StyleValue } from "./styleValue";

// =============================================================================
// Prop Meta Types
// =============================================================================

/**
 * Control type for prop editing in the style panel
 */
export type PropControlType =
  | "text"
  | "number"
  | "boolean"
  | "select"
  | "multiselect"
  | "color"
  | "file"
  | "code"
  | "json"
  | "expression"
  | "action";

/**
 * Enhanced prop metadata with control type inference
 */
export interface PropMeta {
  /** Prop name */
  name: string;
  /** TypeScript type string */
  type: string;
  /** Inferred control type for UI */
  control: PropControlType;
  /** Default value if specified in component */
  defaultValue?: string;
  /** JSDoc description if available */
  description?: string;
  /** Whether the prop is required */
  required: boolean;
  /** For select/multiselect: available options */
  options?: string[];
}

// =============================================================================
// AI Interface (from DNA .schema.json)
// =============================================================================

/**
 * AI interface for component understanding
 * Derived from DNA's .schema.json pattern
 */
export interface AIInterface {
  /** Human-readable description for AI context */
  description?: string;
  /** Example usages for AI reference */
  examples?: string[];
  /** Semantic tags for categorization */
  tags?: string[];
  /** Accessibility notes */
  a11y?: {
    role?: string;
    ariaProps?: string[];
    focusable?: boolean;
  };
}

// =============================================================================
// Slot Definitions
// =============================================================================

/**
 * Defines a named slot for component composition
 */
export interface SlotDefinition {
  /** Slot name (e.g., "header", "footer", "default") */
  name: string;
  /** Human-readable label */
  label?: string;
  /** Description of what goes in this slot */
  description?: string;
  /** Allowed child component types (empty = any) */
  allowedChildren?: string[];
}

// =============================================================================
// Token Bindings (from DNA .dna.json)
// =============================================================================

/**
 * Maps component props to design tokens
 * From DNA's .dna.json pattern
 */
export type TokenBindings = Record<string, string>;

// =============================================================================
// Content Model (from Webstudio)
// =============================================================================

/**
 * Content model category for component nesting validation
 * Inspired by Webstudio's component-meta.ts
 */
export type ContentCategory =
  | "none" // No children allowed
  | "text" // Only text content
  | "richText" // Rich text with inline formatting
  | "container" // Any children allowed
  | "specific"; // Only specific components allowed

/**
 * Content model defining valid parent-child relationships
 */
export interface ContentModel {
  /** What type of content this component accepts */
  category: ContentCategory;
  /** For "specific": list of allowed child component names */
  allowedChildren?: string[];
  /** Components that can contain this component */
  allowedParents?: string[];
  /** Whether this component can be a root element */
  canBeRoot?: boolean;
}

// =============================================================================
// Builder Hooks (from Webstudio)
// =============================================================================

/**
 * Builder interaction hooks for canvas editing
 * Inspired by Webstudio's WsComponentMeta
 */
export interface BuilderHooks {
  /**
   * Called when component is selected in navigator
   * Used to expand/highlight the component
   */
  onNavigatorSelect?: boolean;
  /**
   * Called when component is unselected
   * Used to collapse/cleanup state
   */
  onNavigatorUnselect?: boolean;
  /**
   * Custom resize behavior
   */
  resizable?: boolean | { horizontal: boolean; vertical: boolean };
  /**
   * Whether component supports drag-drop reordering
   */
  draggable?: boolean;
  /**
   * Whether component can be deleted
   */
  deletable?: boolean;
  /**
   * Whether component can be duplicated
   */
  duplicatable?: boolean;
}

// =============================================================================
// DNA Config (.dna.json structure)
// =============================================================================

/**
 * DNA configuration file structure
 * Loaded from .dna.json files next to components
 */
export interface DnaConfig {
  /** Token bindings: prop -> token path */
  tokenBindings?: TokenBindings;
  /** Preset style values */
  presetStyles?: Record<string, StyleValue>;
  /** Variant definitions */
  variants?: Record<
    string,
    {
      label?: string;
      tokens?: TokenBindings;
      styles?: Record<string, StyleValue>;
    }
  >;
  /** State-specific overrides */
  states?: Record<
    string,
    {
      tokens?: TokenBindings;
      styles?: Record<string, StyleValue>;
    }
  >;
}

// =============================================================================
// Component Instance (runtime data from fiber bridge)
// =============================================================================

/**
 * Runtime component instance data from the fiber bridge.
 * Represents a rendered instance of a component in the target app.
 */
export interface ComponentInstance {
  /** Unique radflow ID for this instance */
  radflowId: string;
  /** CSS selector for DOM element */
  selector: string;
  /** Fallback selectors for resilient selection */
  fallbackSelectors: string[];
  /** Fiber type: function, class, forward_ref, memo */
  fiberType: string;
  /** Current prop values from runtime */
  props: Record<string, unknown>;
  /** Parent component ID */
  parentId: string | null;
  /** Child component IDs */
  childIds: string[];
}

// =============================================================================
// Main ComponentMeta Type
// =============================================================================

/**
 * Comprehensive component metadata combining multiple sources
 *
 * Sources:
 * 1. TypeScript parsing (SWC) - name, props, file location
 * 2. Runtime fiber inspection - instances, actual prop values
 * 3. DNA .schema.json - AI interface, slots
 * 4. DNA .dna.json - token bindings, preset styles
 * 5. Webstudio patterns - content model, builder hooks
 *
 * Merge strategy uses file:line as primary key (not component name) to handle
 * cases where static and runtime names may differ (e.g., displayName vs export name).
 */
export interface ComponentMeta {
  // =========================================================================
  // Core Identity (from TypeScript parsing)
  // =========================================================================

  /** Component name (PascalCase) */
  name: string;

  /** Source file path */
  file: string;

  /** Line number in source file */
  line: number;

  /** Whether this is the default export */
  defaultExport: boolean;

  // =========================================================================
  // Props (from TypeScript + DNA overrides)
  // =========================================================================

  /** Component props with enhanced metadata */
  props: PropMeta[];

  /** Union types used by props */
  unionTypes: Array<{
    name: string;
    values: string[];
    line: number;
  }>;

  // =========================================================================
  // Runtime Instances (from fiber bridge)
  // =========================================================================

  /** Runtime instances of this component (empty if not rendered) */
  instances: ComponentInstance[];

  // =========================================================================
  // DNA Schema (.schema.json)
  // =========================================================================

  /** AI interface for component understanding */
  aiInterface?: AIInterface;

  /** Named slots for composition */
  slots?: SlotDefinition[];

  // =========================================================================
  // DNA Config (.dna.json)
  // =========================================================================

  /** Token bindings: prop -> token path */
  tokenBindings?: TokenBindings;

  /** Preset style values */
  presetStyles?: Record<string, StyleValue>;

  /** DNA config source (for debugging) */
  dnaConfigPath?: string;

  // =========================================================================
  // Webstudio Patterns
  // =========================================================================

  /** Content model for nesting validation */
  contentModel?: ContentModel;

  /** Builder interaction hooks */
  builderHooks?: BuilderHooks;

  // =========================================================================
  // Metadata
  // =========================================================================

  /** Package/library this component belongs to */
  package?: string;

  /** Component category for organization */
  category?: string;

  /** Icon name for UI display */
  icon?: string;

  /** Whether this component is deprecated */
  deprecated?: boolean;

  /** Deprecation message if deprecated */
  deprecationMessage?: string;
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create default ComponentMeta from basic component info
 */
export function createComponentMeta(
  info: Pick<
    ComponentMeta,
    "name" | "file" | "line" | "defaultExport" | "unionTypes"
  > & {
    props: Array<{
      name: string;
      type: string;
      default?: string | null;
      doc?: string | null;
      required?: boolean;
      controlType?: string | null;
      options?: string[] | null;
    }>;
  }
): ComponentMeta {
  return {
    name: info.name,
    file: info.file,
    line: info.line,
    defaultExport: info.defaultExport,
    unionTypes: info.unionTypes,
    props: info.props.map((p) => ({
      name: p.name,
      type: p.type,
      control: (p.controlType as PropControlType) ?? inferControlType(p.type, p.name),
      defaultValue: p.default ?? undefined,
      description: p.doc ?? undefined,
      required: p.required ?? (!p.type.includes("undefined") && !p.type.includes("?")),
      options: p.options ?? extractUnionOptions(p.type, info.unionTypes),
    })),
    instances: [], // No runtime instances yet
    contentModel: {
      category: inferContentCategory(info.name),
      canBeRoot: false,
    },
    builderHooks: {
      draggable: true,
      deletable: true,
      duplicatable: true,
    },
  };
}

/**
 * Infer control type from TypeScript type
 */
export function inferControlType(type: string, propName: string): PropControlType {
  const lowerType = type.toLowerCase();
  const lowerName = propName.toLowerCase();

  // Check name hints first
  if (lowerName.includes("color") || lowerName.includes("colour")) {
    return "color";
  }
  if (lowerName.includes("src") || lowerName.includes("href") || lowerName.includes("url")) {
    return "text";
  }
  if (lowerName === "onclick" || lowerName.startsWith("on")) {
    return "action";
  }

  // Check type patterns
  if (lowerType === "boolean" || lowerType === "bool") {
    return "boolean";
  }
  if (lowerType === "number") {
    return "number";
  }
  if (lowerType === "string") {
    return "text";
  }
  if (type.includes("|") && type.includes("'")) {
    // Union of string literals
    return "select";
  }
  if (lowerType.includes("[]") || lowerType.includes("array")) {
    return "multiselect";
  }
  if (lowerType.includes("reactnode") || lowerType.includes("children")) {
    return "expression";
  }
  if (lowerType.includes("object") || type.startsWith("{")) {
    return "json";
  }

  return "text";
}

/**
 * Extract options from union type
 */
export function extractUnionOptions(
  type: string,
  unionTypes: Array<{ name: string; values: string[] }>
): string[] | undefined {
  // Direct union: 'a' | 'b' | 'c'
  if (type.includes("|") && type.includes("'")) {
    const matches = type.match(/'([^']+)'/g);
    if (matches) {
      return matches.map((m) => m.replace(/'/g, ""));
    }
  }

  // Reference to union type
  const referencedType = unionTypes.find((u) => type.includes(u.name));
  if (referencedType) {
    return referencedType.values;
  }

  return undefined;
}

/**
 * Infer content category from component name
 */
function inferContentCategory(name: string): ContentCategory {
  const lowerName = name.toLowerCase();

  // Common patterns
  if (
    lowerName.includes("text") ||
    lowerName.includes("heading") ||
    lowerName.includes("paragraph") ||
    lowerName.includes("label") ||
    lowerName.includes("span")
  ) {
    return "text";
  }

  if (
    lowerName.includes("input") ||
    lowerName.includes("button") ||
    lowerName.includes("icon") ||
    lowerName.includes("image") ||
    lowerName.includes("img")
  ) {
    return "none";
  }

  if (
    lowerName.includes("richtext") ||
    lowerName.includes("editor") ||
    lowerName.includes("markdown")
  ) {
    return "richText";
  }

  // Default to container
  return "container";
}

// =============================================================================
// Merge Functions
// =============================================================================

/**
 * Merge DNA config into ComponentMeta
 * DNA values override but don't replace existing values
 */
export function mergeDnaConfig(
  meta: ComponentMeta,
  dnaConfig: DnaConfig,
  configPath?: string
): ComponentMeta {
  return {
    ...meta,
    tokenBindings: {
      ...meta.tokenBindings,
      ...dnaConfig.tokenBindings,
    },
    presetStyles: {
      ...meta.presetStyles,
      ...dnaConfig.presetStyles,
    },
    dnaConfigPath: configPath,
  };
}

/**
 * Validate content model relationship
 * Returns true if child can be placed inside parent
 */
export function validateContentModel(
  parent: ComponentMeta,
  child: ComponentMeta
): { valid: boolean; reason?: string } {
  const parentModel = parent.contentModel;

  if (!parentModel) {
    // No content model = allow anything
    return { valid: true };
  }

  switch (parentModel.category) {
    case "none":
      return {
        valid: false,
        reason: `${parent.name} does not accept children`,
      };

    case "text":
      // Only allow text-like components
      if (child.contentModel?.category === "text") {
        return { valid: true };
      }
      return {
        valid: false,
        reason: `${parent.name} only accepts text content`,
      };

    case "specific":
      if (parentModel.allowedChildren?.includes(child.name)) {
        return { valid: true };
      }
      return {
        valid: false,
        reason: `${parent.name} only accepts: ${parentModel.allowedChildren?.join(", ")}`,
      };

    case "container":
    case "richText":
      // Check if child has parent restrictions
      if (
        child.contentModel?.allowedParents &&
        !child.contentModel.allowedParents.includes(parent.name)
      ) {
        return {
          valid: false,
          reason: `${child.name} can only be placed in: ${child.contentModel.allowedParents.join(", ")}`,
        };
      }
      return { valid: true };

    default:
      return { valid: true };
  }
}
