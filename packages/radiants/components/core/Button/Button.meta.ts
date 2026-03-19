import type { ComponentMeta } from "@rdna/preview";

export const ButtonMeta: ComponentMeta = {
  name: "Button",
  description:
    "Primary action trigger with retro pixel-corner lift effect. Built on Base UI Button primitive. Supports button and link behaviors.",
  props: {
    variant: {
      type: "enum",
      values: ["primary", "secondary", "outline", "ghost", "destructive", "text"],
      default: "primary",
      description: "Visual variant determining colors and hover states",
    },
    size: {
      type: "enum",
      values: ["sm", "md", "lg"],
      default: "md",
      description: "Size preset controlling height, padding, and text size",
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
      description: "Icon component rendered after text with a leader line separator",
    },
  },
  examples: [
    { name: "Primary button", code: "<Button>Click me</Button>" },
    {
      name: "Secondary with icon",
      code: '<Button variant="secondary" icon={<ArrowIcon />}>Next</Button>',
    },
    {
      name: "Link button",
      code: '<Button href="/dashboard">Go to Dashboard</Button>',
    },
    {
      name: "Icon Button",
      code: '<IconButton icon={<SearchIcon />} aria-label="Search" />',
    },
  ],
  tokenBindings: {
    base: {
      border: "line",
      shadow: "btn",
    },
    primary: {
      background: "accent",
      text: "main",
    },
    secondary: {
      background: "inv",
      text: "flip",
    },
  },
};
