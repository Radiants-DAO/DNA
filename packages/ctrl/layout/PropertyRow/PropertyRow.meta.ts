import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface PropertyRowProps {
  label: string;
  children: React.ReactNode;
}

export const PropertyRowMeta = defineComponentMeta<PropertyRowProps>()({
  name: "PropertyRow",
  description: "Flex row with label on the left and control on the right.",
  props: {
    label: { type: "string", required: true, description: "Row label text" },
    children: { type: "slot", description: "Control element(s)" },
  },
  slots: { default: { description: "Control to display on the right side" } },
  tokenBindings: {
    label: { text: "ctrl-label" },
  },
  examples: [
    { name: "Basic row", code: '<PropertyRow label="Volume"><Knob value={50} onChange={setVal} /></PropertyRow>' },
  ],
  registry: {
    category: "layout",
    tags: ["property", "row", "label"],
    renderMode: "custom",
    controlledProps: [],
    states: [],
  },
});
