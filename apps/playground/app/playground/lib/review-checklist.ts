export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  checked: boolean;
}

export const RDNA_REVIEW_CHECKLIST: ChecklistItem[] = [
  {
    id: "radius",
    label: "Radius consistency",
    description: "Uses rounded-sm or rounded-md (RDNA tokens), not arbitrary radius values",
    checked: false,
  },
  {
    id: "elevation",
    label: "Elevation / shadow",
    description: "Uses shadow-resting, shadow-raised, shadow-floating (RDNA scale), not arbitrary shadows",
    checked: false,
  },
  {
    id: "motion",
    label: "Motion feel",
    description: "ease-out only, max 300ms, respects prefers-reduced-motion",
    checked: false,
  },
  {
    id: "spacing",
    label: "Spacing & typography",
    description: "Uses Tailwind scale classes, RDNA font-size tokens, no arbitrary bracket values",
    checked: false,
  },
  {
    id: "chrome-balance",
    label: "Chrome vs environment",
    description: "Visual weight is appropriate — not too heavy or too minimal for the component role",
    checked: false,
  },
  {
    id: "container",
    label: "Container behavior",
    description: "Sizes correctly in compact, desktop, and mobile viewport presets",
    checked: false,
  },
];
