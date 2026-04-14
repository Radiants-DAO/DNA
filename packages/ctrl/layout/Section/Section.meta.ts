import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const SectionMeta = defineComponentMeta<SectionProps>()({
  name: "Section",
  description: "Collapsible panel section with rule-line header divider.",
  props: {
    title: { type: "string", required: true, description: "Section heading text" },
    defaultOpen: { type: "boolean", default: true, description: "Initial open state" },
    children: { type: "slot", description: "Section content" },
  },
  slots: { default: { description: "Control rows or nested content" } },
  tokenBindings: {
    header: { text: "ctrl-label" },
    rule: { background: "ctrl-track" },
  },
  examples: [
    { name: "Basic section", code: '<Section title="Settings">...</Section>' },
  ],
  registry: {
    category: "layout",
    tags: ["section", "collapsible", "panel"],
    renderMode: "custom",
    controlledProps: [],
    states: [],
  },
});
