import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface ControlPanelProps {
  children: React.ReactNode;
  density?: 'compact' | 'normal' | 'spacious';
  size?: 'sm' | 'md' | 'lg';
}

export const ControlPanelMeta = defineComponentMeta<ControlPanelProps>()({
  name: "ControlPanel",
  description: "Vertical stack of Sections providing density context via React context.",
  props: {
    children: { type: "slot", description: "Section components" },
    density: { type: "enum", values: ["compact", "normal", "spacious"], default: "normal", description: "Spacing density" },
    size: { type: "enum", values: ["sm", "md", "lg"], default: "md", description: "Default control size" },
  },
  slots: { default: { description: "Section and PropertyRow components" } },
  tokenBindings: {},
  examples: [
    { name: "Basic panel", code: '<ControlPanel><Section title="FX">...</Section></ControlPanel>' },
  ],
  registry: {
    category: "layout",
    tags: ["panel", "container", "density"],
    renderMode: "custom",
    controlledProps: [],
    states: [],
  },
});
