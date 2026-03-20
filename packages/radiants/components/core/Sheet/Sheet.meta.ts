import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface SheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: string;
  side?: "left" | "right" | "top" | "bottom";
}

export const SheetMeta = defineComponentMeta<SheetProps>()({
  name: "Sheet",
  description:
    "Side panel that slides in from a viewport edge. Similar to Drawer but typically full-height.",
  subcomponents: [
    "SheetTrigger",
    "SheetContent",
    "SheetHeader",
    "SheetTitle",
    "SheetDescription",
    "SheetBody",
    "SheetFooter",
    "SheetClose",
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
      description: "Callback fired when sheet opens or closes",
    },
    side: {
      type: "enum",
      options: ["left", "right", "top", "bottom"],
      default: "right",
      description: "Which edge the sheet slides from",
    },
  },
  slots: {},
  examples: [
    {
      name: "Right sheet",
      code: '<Sheet.Root>\n  <SheetTrigger>Open Sheet</SheetTrigger>\n  <SheetContent side="right">\n    <SheetHeader><SheetTitle>Sheet</SheetTitle></SheetHeader>\n    <SheetBody>Content</SheetBody>\n  </SheetContent>\n</Sheet.Root>',
    },
  ],
  registry: {
    category: "overlay",
    tags: ["drawer", "panel", "slide"],
    renderMode: "custom",
  },
});
