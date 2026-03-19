import type { ComponentMeta } from "@rdna/preview";

export const ButtonMeta: ComponentMeta = {
  name: "Button",
  description:
    "Action trigger with retro pixel-corner lift effect. Built on Base UI Button primitive. Supports button and link behaviors.",
  props: {
    variant: {
      type: "enum",
      values: ["solid", "outline", "ghost", "text"],
      default: "solid",
      description:
        "Structural variant. For destructive actions, use variant=\"solid\" tone=\"danger\".",
    },
    tone: {
      type: "enum",
      values: ["accent", "danger", "success", "neutral"],
      default: "accent",
      description:
        "Color tone — controls bg, border, and text color via data-color attribute",
    },
    size: {
      type: "enum",
      values: ["sm", "md", "lg"],
      default: "md",
      description: "Size preset controlling height, padding, and text size",
    },
    rounded: {
      type: "enum",
      values: ["none", "xs", "sm", "md", "lg", "xl"],
      default: "xs",
      description: "Pixel-corner roundness",
    },
    fullWidth: {
      type: "boolean",
      default: false,
      description: "Expand button to fill container width",
    },
    active: {
      type: "boolean",
      default: false,
      description: "Toggled active state (e.g. app is open in taskbar)",
    },
    iconOnly: {
      type: "boolean",
      default: false,
      description: "Square button showing only the icon",
    },
    textOnly: {
      type: "boolean",
      default: false,
      description: "Text-only button — suppresses icon slot and leader line",
    },
    disabled: {
      type: "boolean",
      default: false,
      description: "Disable button interactions",
    },
    focusableWhenDisabled: {
      type: "boolean",
      default: false,
      description:
        "Keep tab focus when disabled (uses aria-disabled instead of native disabled)",
    },
    href: {
      type: "string",
      description:
        "URL for link navigation. Renders as anchor element when provided.",
    },
    target: {
      type: "string",
      description: "Link target (e.g., '_blank' for new tab)",
    },
  },
  slots: {
    children: { description: "Button label text" },
    icon: {
      description:
        "Icon — RDNA icon name (string) or custom ReactNode. Renders right of text with a leader line separator.",
    },
  },
  examples: [
    {
      name: "Solid button with icon",
      code: "<Button icon={<ArrowIcon />}>Next</Button>",
    },
    {
      name: "Outline danger",
      code: '<Button variant="outline" tone="danger" icon={<TrashIcon />}>Delete</Button>',
    },
    {
      name: "Text-only button",
      code: "<Button textOnly>Click me</Button>",
    },
    {
      name: "Icon Button",
      code: '<IconButton icon={<SearchIcon />} aria-label="Search" />',
    },
    {
      name: "Danger button",
      code: '<Button variant="solid" tone="danger" icon={<TrashIcon />}>Remove</Button>',
    },
  ],
  tokenBindings: {
    base: {
      border: "line",
      shadow: "btn",
    },
    solid: {
      background: "accent",
      text: "main",
    },
  },
};
