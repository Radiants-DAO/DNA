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

export interface ComponentMeta {
  name: string;
  description: string;
  props: Record<string, PropDef>;
  slots?: Record<string, SlotDef>;
  tokenBindings?: Record<string, Record<string, string>>;
  examples?: Array<{ name: string; code: string }>;
}
