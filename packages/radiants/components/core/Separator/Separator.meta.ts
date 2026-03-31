import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  variant?: "solid" | "dashed" | "decorated";
  className?: string;
}

export const SeparatorMeta = defineComponentMeta<SeparatorProps>()({
  name: "Separator",
  description:
    "Accessible separator element for visually dividing content sections. Supports solid, dashed, and decorated (diamond ornament) variants.",
  props: {
    orientation: {
      type: "enum",
      values: ["horizontal", "vertical"],
      default: "horizontal",
      description: "Separator direction: horizontal or vertical",
    },
    variant: {
      type: "enum",
      values: ["solid", "dashed", "decorated"],
      default: "solid",
      description: "Visual style of the separator line",
    },
    className: {
      type: "string",
      description: "Additional CSS classes",
    },
  },
  slots: {},
  examples: [
    {
      name: "Horizontal solid",
      code: "<Separator />",
    },
    {
      name: "Horizontal dashed",
      code: '<Separator variant="dashed" />',
    },
    {
      name: "Decorated with diamond",
      code: '<Separator variant="decorated" />',
    },
    {
      name: "Vertical separator",
      code: '<Separator orientation="vertical" className="h-8" />',
    },
  ],
  tokenBindings: {
    base: {
      background: "line",
      border: "rule",
    },
    decorated: {
      lineColor: "rule",
      ornamentBackground: "accent",
    },
  },
  replaces: [{ element: "hr", import: "@rdna/radiants/components/core" }],
  wraps: "@base-ui/react/separator",
  a11y: {
    role: "separator",
    requiredAttributes: ["aria-orientation"],
  },
  registry: {
    category: "layout",
    tags: ["divider", "line", "separator", "hr"],
    renderMode: "inline",
    variants: [
      { label: "Solid", props: { variant: "solid" } },
      { label: "Dashed", props: { variant: "dashed" } },
      { label: "Decorated", props: { variant: "decorated" } },
    ],
  },
  blockNote: {
    enabled: true,
    content: "none",
    propSchema: { orientation: { prop: "orientation" }, variant: { prop: "variant" } },
    slashMenu: {
      title: "Separator",
      subtext: "Accessible separator element for visually dividing...",
      aliases: ["separator","divider","line","separator"],
      icon: "minus",
    },
  },

});
