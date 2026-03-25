export type PropEnumValue = string | number;

export type PropDefType =
  | "string"
  | "number"
  | "boolean"
  | "enum"
  | "array"
  | "function"
  | "node"
  | (string & {});

export interface PropDef {
  type: PropDefType;
  values?: PropEnumValue[];
  options?: PropEnumValue[];
  default?: unknown;
  required?: boolean;
  description?: string;
  items?: { type?: PropDefType };
}

export interface SlotDef {
  description?: string;
}

export interface ElementReplacement {
  element: string;
  import?: string;
  note?: string;
  qualifier?: string;
}

export interface StyleOwnership {
  attribute: `data-${string}`;
  themeOwned: string[];
  consumerExtensible?: string[];
}

export interface StructuralRule {
  ruleId: string;
  reason: string;
  mechanism?: string;
}

export interface A11yContract {
  role?: string;
  requiredAttributes?: string[];
  keyboardInteractions?: string[];
  contrastRequirement?: "AA" | "AAA";
}

/**
 * Preview states are inspectable UI states that the preview runtime can execute.
 *
 * Authoring rules:
 * - Use wrapper-driven states for interaction overlays like hover/focus/pressed.
 * - Use prop-driven states for real API states like disabled and error/invalid.
 * - Keep authored scenarios such as placeholder-visible, long-text, no-results,
 *   or prefilled-value in `exampleProps` or curated variants instead of `states`.
 * - Keep environment axes such as light/dark, RTL, or reduced motion outside of
 *   component state metadata.
 *
 * The current runtime only supports these executable states. Composite states
 * such as "open" or "current-tab" need a future demo/harness driver instead of
 * being squeezed into the wrapper/prop split.
 */
export type ForcedState = "hover" | "pressed" | "focus" | "disabled" | "error";

export type PreviewStateDriver = "wrapper" | "prop";

export interface PreviewState<TProps = Record<string, unknown>> {
  name: ForcedState;
  driver: PreviewStateDriver;
  prop?: keyof TProps & string;
  value?: unknown;
}

export interface RegistryVariant<TProps> {
  label: string;
  props: Partial<TProps>;
}

export type ComponentCategory =
  | "action"
  | "layout"
  | "form"
  | "feedback"
  | "navigation"
  | "overlay"
  | "data-display"
  | "media"
  | "dev";

export interface RegistryMeta<TProps> {
  category: ComponentCategory;
  tags?: string[];
  renderMode?: "inline" | "custom" | "description-only";
  exclude?: boolean;
  exampleProps?: Partial<TProps>;
  variants?: RegistryVariant<TProps>[];
  controlledProps?: Array<keyof TProps & string>;
  /** Executable preview states only. Use variants/exampleProps for scenarios. */
  states?: PreviewState<TProps>[];
}

export interface ComponentMeta<TProps = Record<string, unknown>> {
  name: string;
  description: string;
  props: Record<string, PropDef>;
  slots?: Record<string, SlotDef>;
  subcomponents?: string[];
  tokenBindings?: Record<string, Record<string, string>>;
  replaces?: ElementReplacement[];
  pixelCorners?: boolean;
  shadowSystem?: "standard" | "pixel";
  styleOwnership?: StyleOwnership[];
  structuralRules?: StructuralRule[];
  wraps?: string;
  a11y?: A11yContract;
  examples?: Array<{ name: string; code: string }>;
  registry?: RegistryMeta<TProps>;
  /**
   * Override the repo-root-relative source file path when the component does not
   * have a same-named .tsx file (e.g. Label and TextArea live in Input.tsx).
   * Stripped from generated schema.json — registry only.
   */
  sourcePath?: string;
}
