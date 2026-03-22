import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface PopoverProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: string;
  position?: string;
}

export const PopoverMeta = defineComponentMeta<PopoverProps>()({
  name: "Popover",
  description:
    "Floating panel anchored to a trigger element. Supports keyboard navigation and focus management.",
  subcomponents: ["PopoverTrigger", "PopoverContent"],
  props: {
    open: {
      type: "boolean",
    },
    defaultOpen: {
      type: "boolean",
    },
    onOpenChange: {
      type: "string",
      description: "Callback fired when popover opens or closes",
    },
    position: {
      type: "string",
      description: "Preferred popover placement relative to trigger",
    },
  },
  slots: {},
  examples: [
    {
      name: "Basic popover",
      code: "<Popover.Root>\n  <PopoverTrigger>Open</PopoverTrigger>\n  <PopoverContent>Popover content here</PopoverContent>\n</Popover.Root>",
    },
  ],
  registry: {
    category: "overlay",
    tags: ["popup", "tooltip", "float"],
    renderMode: "custom",
    controlledProps: ["position"],
  },
});
