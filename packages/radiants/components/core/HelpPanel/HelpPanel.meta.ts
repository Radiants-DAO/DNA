import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface HelpPanelProps {
  isOpen: boolean;
  onClose: string;
  title?: string;
  className?: string;
  children?: unknown;
}

export const HelpPanelMeta = defineComponentMeta<HelpPanelProps>()({
  name: "HelpPanel",
  description:
    "Slide-in panel for contextual help content and documentation.",
  props: {
    isOpen: {
      type: "boolean",
      required: true,
      description: "Whether the panel is visible",
    },
    onClose: {
      type: "string",
      required: true,
      description: "Callback to close the panel",
    },
    title: {
      type: "string",
      description: "Panel header title",
    },
    className: {
      type: "string",
      description: "Additional CSS classes",
    },
  },
  slots: {
    children: {
      description: "Help content including text, links, and examples",
    },
  },
  examples: [
    {
      name: "Basic help panel",
      code: '<HelpPanel isOpen={showHelp} onClose={() => setShowHelp(false)} title="Getting Started">Help content here</HelpPanel>',
    },
  ],
  registry: {
    category: "overlay",
    tags: ["help", "docs", "guide"],
    renderMode: "custom",
  },
});
