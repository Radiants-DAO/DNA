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
