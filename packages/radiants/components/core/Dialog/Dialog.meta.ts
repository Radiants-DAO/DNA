import { defineComponentMeta } from "@rdna/preview/define-component-meta";

export interface DialogProps {
  /** Controlled open state */
  open?: boolean;
  /** Default open state for uncontrolled usage */
  defaultOpen?: boolean;
  /** Callback fired when dialog opens or closes — receives Base UI eventDetails as second arg */
  onOpenChange?: (open: boolean, eventDetails?: unknown) => void;
}

export const DialogMeta = defineComponentMeta<DialogProps>()({
  name: "Dialog",
  description:
    "Modal dialog with focus trap and overlay. Provides accessible dialog interactions through compound components.",
  subcomponents: [
    "DialogTrigger",
    "DialogContent",
    "DialogHeader",
    "DialogTitle",
    "DialogDescription",
    "DialogBody",
    "DialogFooter",
    "DialogClose",
  ],
  props: {
    open: {
      type: "boolean",
      description: "Controlled open state",
    },
    defaultOpen: {
      type: "boolean",
    },
    onOpenChange: {
      type: "string",
      description: "Callback fired when dialog opens or closes",
    },
  },
  slots: {},
  examples: [
    {
      name: "Basic dialog",
      code: '<Dialog.Root>\n  <DialogTrigger>Open</DialogTrigger>\n  <DialogContent>\n    <DialogHeader><DialogTitle>Title</DialogTitle></DialogHeader>\n    <DialogBody>Content</DialogBody>\n    <DialogFooter><DialogClose>Close</DialogClose></DialogFooter>\n  </DialogContent>\n</Dialog.Root>',
    },
  ],
  replaces: [{ element: "dialog", import: "@rdna/radiants/components/core" }],
  registry: {
    category: "overlay",
    tags: ["modal", "popup", "confirm"],
    renderMode: "custom",
  },
  blockNote: {
    enabled: true,
    content: "none",
    render: "./blocknote/renders/Dialog",
    propSchema: {},
    slashMenu: {
      title: "Dialog",
      subtext: "Modal dialog with focus trap and overlay. Provides...",
      aliases: ["dialog","modal","popup","confirm"],
      icon: "full-screen",
    },
  },

});
