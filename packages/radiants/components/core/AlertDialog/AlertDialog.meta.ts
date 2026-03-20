import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface AlertDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: string;
}

export const AlertDialogMeta = defineComponentMeta<AlertDialogProps>()({
  name: "AlertDialog",
  description:
    "Destructive action confirmation dialog. Requires explicit confirm/cancel response before dismissal.",
  subcomponents: [
    "AlertDialogTrigger",
    "AlertDialogContent",
    "AlertDialogHeader",
    "AlertDialogTitle",
    "AlertDialogDescription",
    "AlertDialogBody",
    "AlertDialogFooter",
    "AlertDialogClose",
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
      description: "Callback fired when dialog opens or closes",
    },
  },
  slots: {},
  examples: [
    {
      name: "Destructive confirm",
      code: '<AlertDialog.Root>\n  <AlertDialogTrigger>Delete</AlertDialogTrigger>\n  <AlertDialogContent>\n    <AlertDialogTitle>Are you sure?</AlertDialogTitle>\n    <AlertDialogFooter>\n      <AlertDialogClose>Cancel</AlertDialogClose>\n      <Button tone="danger">Delete</Button>\n    </AlertDialogFooter>\n  </AlertDialogContent>\n</AlertDialog.Root>',
    },
  ],
  registry: {
    category: "overlay",
    tags: ["alert", "confirm", "modal", "destructive"],
    renderMode: "custom",
  },
});
