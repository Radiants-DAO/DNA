import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface ToolbarProps {
  orientation?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const ToolbarMeta = defineComponentMeta<ToolbarProps>()({
  name: "Toolbar",
  description:
    "Accessible toolbar container with keyboard navigation between interactive elements.",
  subcomponents: [
    "Toolbar.Root",
    "Toolbar.Button",
    "Toolbar.Separator",
    "Toolbar.Link",
    "Toolbar.Group",
  ],
  props: {
    orientation: {
      type: "string",
      default: "horizontal",
      description: "Layout direction of toolbar",
    },
    disabled: {
      type: "boolean",
      default: false,
      description: "Disable all toolbar interactions",
    },
  },
  slots: {
    children: {
      description:
        "Toolbar.Button, Toolbar.Separator, and Toolbar.Link elements",
    },
  },
  examples: [
    {
      name: "Basic toolbar",
      code: "<Toolbar.Root>\n  <Toolbar.Button>Cut</Toolbar.Button>\n  <Toolbar.Button>Copy</Toolbar.Button>\n  <Toolbar.Button>Paste</Toolbar.Button>\n  <Toolbar.Separator />\n  <Toolbar.Button>Format</Toolbar.Button>\n</Toolbar.Root>",
    },
  ],
  registry: {
    category: "action",
    tags: ["toolbar", "actions", "controls"],
    renderMode: "custom",
  },
});
