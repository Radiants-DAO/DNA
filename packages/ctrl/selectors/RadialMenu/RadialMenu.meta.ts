import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface RadialMenuProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RadialMenuMeta = defineComponentMeta<RadialMenuProps>()({
  name: "RadialMenu",
  description: "SVG pie-segment radial selector. Click a segment to select.",
  props: {
    value: { type: "string", required: true, description: "Currently selected option value" },
    onChange: { type: "function", required: true, description: "Selection change callback" },
    options: { type: "array", required: true, description: "Array of {value, label}" },
    label: { type: "string", description: "Label text above the menu" },
    disabled: { type: "boolean", default: false, description: "Disable interactions" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Diameter preset" },
  },
  slots: {},
  tokenBindings: {
    sector: { active: "ctrl-fill", inactive: "ctrl-track" },
    divider: { stroke: "ctrl-grid-line" },
    label: { active: "ctrl-active", inactive: "ctrl-label" },
  },
  examples: [
    { name: "Basic radial", code: '<RadialMenu value="a" onChange={setVal} options={[{value:"a",label:"N"},{value:"b",label:"E"},{value:"c",label:"S"},{value:"d",label:"W"}]} />' },
  ],
  registry: {
    category: "form",
    tags: ["radial", "pie", "menu", "selector"],
    renderMode: "custom",
    controlledProps: ["value", "onChange"],
    states: [
      { name: "disabled", driver: "prop", prop: "disabled", value: true },
    ],
  },
});
