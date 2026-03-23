import { defineComponentMeta } from "@rdna/preview/define-component-meta";
import type { ReactNode } from "react";

interface TooltipProps {
  content: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const TooltipMeta = defineComponentMeta<TooltipProps>()({
  name: "Tooltip",
  description:
    "A floating label that appears on hover or focus of a trigger element. Supports four placement directions, configurable show delay, and three size variants.",
  props: {
    content: {
      type: "node",
      required: true,
      description: "Text or element displayed inside the tooltip bubble",
    },
    position: {
      type: "enum",
      values: ["top", "bottom", "left", "right"],
      default: "top",
      description: "Which side of the trigger the tooltip appears on",
    },
    delay: {
      type: "number",
      default: 0,
      description: "Milliseconds to wait before showing the tooltip",
    },
    size: {
      type: "enum",
      values: ["sm", "md", "lg"],
      default: "md",
      description: "Controls padding and font size of the tooltip bubble",
    },
    className: {
      type: "string",
      description: "Additional CSS classes applied to the trigger wrapper",
    },
  },
  slots: {
    children: {
      description: "Trigger element — the tooltip appears relative to this node",
    },
    content: {
      description: "Tooltip bubble content, passed via the content prop",
    },
  },
  examples: [
    {
      name: "Basic tooltip",
      code: '<Tooltip content="Tooltip text"><button>Hover me</button></Tooltip>',
    },
    {
      name: "Bottom position",
      code: '<Tooltip content="Below" position="bottom"><button>Hover me</button></Tooltip>',
    },
    {
      name: "With delay",
      code: '<Tooltip content="Delayed" delay={500}><button>Hover me</button></Tooltip>',
    },
    {
      name: "Large size",
      code: '<Tooltip content="Large tooltip" size="lg"><button>Hover me</button></Tooltip>',
    },
  ],
  exampleProps: {
    content: "Tooltip text",
  },
  tokenBindings: {
    base: {
      background: "inv",
      text: "flip",
      font: "heading",
      borderRadius: "sm",
      paddingX: "spacing-sm",
      paddingY: "spacing-xs",
    },
    arrow: {
      border: "inv",
    },
  },
  registry: {
    category: "feedback",
    tags: ["hint", "info", "hover"],
    renderMode: "custom",
  },
});
