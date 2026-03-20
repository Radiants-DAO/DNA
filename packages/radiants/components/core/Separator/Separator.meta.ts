import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface SeparatorProps {
  orientation?: string;
  className?: string;
}

export const SeparatorMeta = defineComponentMeta<SeparatorProps>()({
  name: "Separator",
  description:
    "Semantic separator element for visually dividing content sections.",
  props: {
    orientation: {
      type: "string",
      default: "horizontal",
      description: "Separator direction: horizontal or vertical",
    },
    className: {
      type: "string",
      description: "Additional CSS classes",
    },
  },
  slots: {},
  examples: [
    {
      name: "Horizontal separator",
      code: "<Separator />",
    },
    {
      name: "Vertical separator",
      code: '<Separator orientation="vertical" className="h-8" />',
    },
  ],
  registry: {
    category: "layout",
    tags: ["divider", "line", "separator"],
    renderMode: "inline",
  },
});
