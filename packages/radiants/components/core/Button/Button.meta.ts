import type { ComponentMeta } from "@rdna/preview";

export const ButtonMeta: ComponentMeta = {
  name: "Button",
  description:
    "Primary action trigger with retro lift effect. Supports button and link behaviors with customizable variants and sizes.",
  props: {
    variant: {
      type: "enum",
      values: ["primary", "secondary", "outline", "ghost"],
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
    iconOnly: {
      type: "boolean",
      default: false,
      description: "Square button with icon only (no text)",
    },
    loading: {
      type: "boolean",
      default: false,
      description: "Show loading state (replaces icon with loadingIndicator slot)",
    },
    disabled: {
      type: "boolean",
      default: false,
      description: "Disable button interactions",
    },
    href: {
      type: "string",
      description:
        "URL for link navigation. When provided, button renders as anchor or opens via window.open",
    },
    asLink: {
      type: "boolean",
      default: true,
      description: "When href is provided: true renders as <a>, false uses window.open",
    },
    target: {
      type: "string",
      description: "Link target (e.g., '_blank' for new tab)",
    },
  },
  slots: {
    children: { description: "Button label text" },
    icon: { description: "Icon component rendered on the right side of the button" },
    loadingIndicator: {
      description: "Spinner component shown when loading is true (replaces icon)",
    },
  },
  examples: [
    { name: "Primary button", code: "<Button>Click me</Button>" },
    {
      name: "Secondary with icon",
      code: '<Button variant="secondary" icon={<ArrowIcon />}>Next</Button>',
    },
    {
      name: "Icon-only button",
      code: '<Button iconOnly icon={<MenuIcon />} aria-label="Open menu" />',
    },
    {
      name: "Link button",
      code: '<Button href="/dashboard">Go to Dashboard</Button>',
    },
    {
      name: "Loading state",
      code: "<Button loading loadingIndicator={<Spinner />} icon={<SendIcon />}>Submit</Button>",
    },
  ],
  tokenBindings: {
    base: {
      border: "edge-primary",
      shadow: "btn",
    },
    primary: {
      background: "action-primary",
      text: "content-primary",
    },
    secondary: {
      background: "surface-secondary",
      text: "content-inverted",
    },
  },
};
