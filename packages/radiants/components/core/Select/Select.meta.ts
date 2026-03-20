import { defineComponentMeta } from "@rdna/preview/define-component-meta";

interface SelectProps {
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  fullWidth?: boolean;
}

export const SelectMeta = defineComponentMeta<SelectProps>()({
  name: "Select",
  description:
    "Custom dropdown select with retro styling. Provides a fully accessible select experience with keyboard navigation and customizable states.",
  subcomponents: ["Select.Provider", "Select.Trigger", "Select.Content", "Select.Option"],
  props: {
    options: {
      type: "string",
      required: true,
      description: "Array of option objects with value, label, and optional disabled properties",
    },
    value: { type: "string", description: "Currently selected value" },
    placeholder: { type: "string", default: "Select...", description: "Placeholder text when no value is selected" },
    disabled: { type: "boolean", default: false, description: "Disable select interactions" },
    error: { type: "boolean", default: false, description: "Show error state with red border" },
    fullWidth: { type: "boolean", default: false, description: "Expand select to fill container width" },
  },
  slots: {},
  tokenBindings: {
    trigger: {
      background: "page",
      text: "main",
      textPlaceholder: "main/40",
      border: "line",
      borderError: "danger",
      shadow: "line",
      focusRing: "focus",
    },
    dropdown: { background: "page", border: "line", shadow: "line" },
    option: { text: "main", backgroundSelected: "accent", backgroundHover: "accent" },
  },
  examples: [
    {
      name: "Basic select",
      code: '<Select options={[{value: "a", label: "Option A"}, {value: "b", label: "Option B"}]} value={selected} onChange={setSelected} />',
    },
    {
      name: "With placeholder",
      code: '<Select options={options} placeholder="Choose an option..." onChange={handleChange} />',
    },
    { name: "Full width", code: "<Select options={options} value={selected} onChange={setSelected} fullWidth />" },
    { name: "Error state", code: "<Select options={options} value={selected} onChange={setSelected} error />" },
  ],
  registry: {
    category: "form",
    tags: ["dropdown", "picker", "choice"],
    renderMode: "custom",
    states: ["focus", "error", "disabled"],
  },
});
