"use client";

import {
  registry as sharedRegistry,
  CATEGORY_LABELS,
} from "@rdna/radiants/registry";
import type {
  RegistryEntry as SharedEntry,
} from "@rdna/radiants/registry";
import type { RegistryEntry } from "./types";

/**
 * Playground-specific propsInterface overrides for prompt context.
 * Only needed for components that will be used with the iteration/generation flow.
 * Keyed by PascalCase component name from the shared registry.
 */
const PROPS_INTERFACE: Record<string, string> = {
  Button: `variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
size?: 'sm' | 'md' | 'lg'
fullWidth?: boolean
active?: boolean
icon?: React.ReactNode
children?: React.ReactNode`,

  Card: `variant?: 'default' | 'dark' | 'raised'
noPadding?: boolean
children: React.ReactNode
Subcomponents: CardHeader, CardBody, CardFooter`,

  Input: `size?: 'sm' | 'md' | 'lg'
error?: boolean
fullWidth?: boolean
icon?: React.ReactNode
placeholder?: string
Related: TextArea, Label`,

  Badge: `variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
children: React.ReactNode`,

  Alert: `Namespace API: Alert.Root, Alert.Content, Alert.Title, Alert.Description
variant implied by content`,

  Progress: `value: number (0-100)`,

  Checkbox: `checked: boolean
onChange: (e) => void
label?: string`,

  Switch: `checked: boolean
onChange: (checked: boolean) => void
label?: string`,

  Slider: `value: number
onChange: (value: number) => void
min?: number
max?: number`,

  Accordion: `Namespace API: Accordion.Provider, Accordion.Frame, Accordion.Item, Accordion.Trigger, Accordion.Content
Requires useAccordionState hook`,

  Tooltip: `content: string
children: React.ReactNode (trigger element)`,

  Breadcrumbs: `items: Array<{ label: string, href?: string }>`,

  Divider: `variant?: 'solid' | 'dashed' | 'decorated'`,
};

/**
 * Map a shared registry entry to a playground registry entry.
 * Returns null for description-only entries (no renderable component).
 */
function toPlaygroundEntry(entry: SharedEntry): RegistryEntry | null {
  if (entry.renderMode === "description-only") return null;

  // For custom entries, use the Demo wrapper. For inline, use the component directly.
  const Component =
    entry.renderMode === "custom" && entry.Demo
      ? (entry.Demo as RegistryEntry["Component"])
      : entry.component
        ? (entry.component as RegistryEntry["Component"])
        : null;

  if (!Component) return null;

  // Derive default props: prefer exampleProps, then first variant's props, then empty
  const defaultProps =
    entry.exampleProps ??
    entry.variants?.[0]?.props ??
    {};

  return {
    id: entry.name.toLowerCase(),
    label: entry.name,
    group: CATEGORY_LABELS[entry.category] ?? entry.category,
    Component,
    defaultProps,
    sourcePath: entry.sourcePath,
    schemaPath: entry.schemaPath,
    propsInterface: PROPS_INTERFACE[entry.name],
  };
}

export const registry: RegistryEntry[] = sharedRegistry
  .map(toPlaygroundEntry)
  .filter((e): e is RegistryEntry => e !== null);
