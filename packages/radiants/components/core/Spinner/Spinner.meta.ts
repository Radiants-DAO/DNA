import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface SpinnerProps {
  variant?: "default" | "dots";
  size?: number;
  completed?: boolean;
}

export const SpinnerMeta = defineComponentMeta<SpinnerProps>()({
  name: "Spinner",
  description:
    "Animated loading indicator with two display modes: a classic rotating spinner and a dot-pulse animation. Accepts a completed state to signal task completion.",
  props: {
    variant: {
      type: "enum",
      values: ["default", "dots"],
      default: "default",
      description: "Animation style — rotating ring or pulsing dots",
    },
    size: {
      type: "number",
      default: 24,
      description: "Diameter of the spinner in pixels",
    },
    completed: {
      type: "boolean",
      default: false,
      description: "When true, renders a completion state instead of animating",
    },
  },
  slots: {},
  examples: [
    {
      name: "Default spinner",
      code: "<Spinner />",
    },
    {
      name: "Loading dots",
      code: '<Spinner variant="dots" />',
    },
    {
      name: "Completed state",
      code: "<Spinner completed />",
    },
    {
      name: "Large spinner",
      code: "<Spinner size={48} />",
    },
  ],
  tokenBindings: {
    base: {
      text: "main",
      font: "monospace",
    },
  },
  registry: {
    category: "feedback",
    tags: ["loading", "spinner", "animation"],
    renderMode: "custom",
  },
  blockNote: {
    enabled: true,
    content: "none",
    propSchema: { variant: { prop: "variant" } },
    slashMenu: {
      title: "Spinner",
      subtext: "Animated loading indicator with two display modes:...",
      aliases: ["spinner","loading","spinner","animation"],
      icon: "hourglass",
    },
  },

});
