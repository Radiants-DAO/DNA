export interface PropDef {
  type: "string" | "number" | "boolean" | "enum";
  values?: string[];
  default?: unknown;
  required?: boolean;
  description?: string;
}

export interface SlotDef {
  description: string;
}

export type ForcedState = "hover" | "pressed" | "focus" | "disabled" | "error";

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
  | "dev";

export interface RegistryMeta<TProps> {
  category: ComponentCategory;
  tags?: string[];
  renderMode?: "inline" | "custom" | "description-only";
  exclude?: boolean;
  exampleProps?: Partial<TProps>;
  variants?: RegistryVariant<TProps>[];
  controlledProps?: Array<keyof TProps & string>;
  states?: ForcedState[];
}

export interface ComponentMeta<TProps = Record<string, unknown>> {
  name: string;
  description: string;
  props: Record<string, PropDef>;
  slots?: Record<string, SlotDef>;
  tokenBindings?: Record<string, Record<string, string>>;
  examples?: Array<{ name: string; code: string }>;
  registry?: RegistryMeta<TProps>;
}
