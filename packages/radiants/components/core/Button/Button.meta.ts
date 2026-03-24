import { defineComponentMeta } from "@rdna/preview/define-component-meta";

type ButtonMode = "solid" | "flat" | "text" | "pattern";
type ButtonTone = "accent" | "danger" | "success" | "neutral" | "cream" | "white" | "info" | "tinted";
type ButtonSize = "sm" | "md" | "lg" | "xl";
type ButtonRounded = "xs" | "sm" | "md" | "lg" | "xl" | "none";

interface ButtonProps {
  mode?: ButtonMode;
  tone?: ButtonTone;
  size?: ButtonSize;
  rounded?: ButtonRounded;
  fullWidth?: boolean;
  active?: boolean;
  iconOnly?: boolean;
  textOnly?: boolean;
  quiet?: boolean;
  flush?: boolean;
  compact?: boolean;
  disabled?: boolean;
  focusableWhenDisabled?: boolean;
  href?: string;
  target?: string;
}

export const ButtonMeta = defineComponentMeta<ButtonProps>()({
  name: "Button",
  description:
    "Action trigger with retro pixel-corner lift effect. Built on Base UI Button primitive. Supports button and link behaviors.",
  props: {
    mode: {
      type: "enum",
      values: ["solid", "flat", "text", "pattern"],
      default: "solid",
      description:
        'Visual mode. For destructive actions, use mode="solid" tone="danger".',
    },
    tone: {
      type: "enum",
      values: ["accent", "danger", "success", "neutral", "cream", "white", "info", "tinted"],
      default: "accent",
      description:
        "Color tone — controls bg, border, and text color via data-color attribute",
    },
    size: {
      type: "enum",
      values: ["sm", "md", "lg", "xl"],
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
    flush: {
      type: "boolean",
      default: false,
      description: "Negative margins cancel padding for flush alignment with surroundings",
    },
    quiet: {
      type: "boolean",
      default: false,
      description:
        "Transparent at rest — strips fill and border, re-applies on hover/active/selected",
    },
    compact: {
      type: "boolean",
      default: false,
      description: "Compact badge-like styling using mono font (PixelCode)",
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
      name: "Flat danger",
      code: '<Button mode="flat" tone="danger" icon={<TrashIcon />}>Delete</Button>',
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
      code: '<Button mode="solid" tone="danger" icon={<TrashIcon />}>Remove</Button>',
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
  registry: {
    category: "action",
    tags: ["cta", "action", "click"],
    renderMode: "inline",
    exampleProps: { children: "Button", icon: "go-forward" },
    states: ["hover", "pressed", "focus", "disabled"],
  },
});
