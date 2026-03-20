import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface LabelProps {
  children?: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}

export const LabelMeta = defineComponentMeta<LabelProps>()({
  name: "Label",
  description: "Form label with optional required indicator asterisk.",
  props: {
    children: {
      type: "string",
      required: true,
      description: "Label text content",
    },
    required: {
      type: "boolean",
      default: false,
      description: "Shows a red asterisk after the label",
    },
    htmlFor: {
      type: "string",
      description: "Associates the label with a form control by id",
    },
  },
  slots: {},
  tokenBindings: {
    default: {
      text: "main",
      requiredIndicator: "danger",
    },
  },
  examples: [
    { name: "Basic label", code: '<Label htmlFor="email">Email</Label>' },
    { name: "Required label", code: '<Label htmlFor="name" required>Full Name</Label>' },
  ],
  registry: {
    category: "form",
    tags: ["label", "form", "field"],
    renderMode: "custom",
  },
});
