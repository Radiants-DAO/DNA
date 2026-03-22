import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface DrawerProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: string;
  direction?: "bottom" | "top" | "left" | "right";
}

export const DrawerMeta = defineComponentMeta<DrawerProps>()({
  name: "Drawer",
  description:
    "Slide-in panel anchored to a viewport edge. Dismissable by clicking the overlay or pressing Escape.",
  subcomponents: [
    "DrawerTrigger",
    "DrawerContent",
    "DrawerHeader",
    "DrawerTitle",
    "DrawerDescription",
    "DrawerBody",
    "DrawerFooter",
    "DrawerClose",
  ],
  props: {
    open: {
      type: "boolean",
    },
    defaultOpen: {
      type: "boolean",
    },
    onOpenChange: {
      type: "string",
      description: "Callback fired when drawer opens or closes",
    },
    direction: {
      type: "enum",
      options: ["bottom", "top", "left", "right"],
      default: "bottom",
      description: "Which edge the drawer slides from",
    },
  },
  slots: {},
  examples: [
    {
      name: "Bottom drawer",
      code: '<Drawer.Root>\n  <DrawerTrigger>Open Drawer</DrawerTrigger>\n  <DrawerContent direction="bottom">\n    <DrawerHeader><DrawerTitle>Drawer</DrawerTitle></DrawerHeader>\n    <DrawerBody>Content</DrawerBody>\n  </DrawerContent>\n</Drawer.Root>',
    },
  ],
  registry: {
    category: "overlay",
    tags: ["drawer", "bottom-sheet", "slide", "mobile"],
    renderMode: "custom",
    controlledProps: ["direction", "defaultOpen"],
  },
});
