export type {
  ComponentCategory,
  ForcedState,
  PropDef,
  SlotDef,
} from '@rdna/preview';

import type { ComponentType } from 'react';
import type {
  ComponentCategory,
  ForcedState,
  PropDef,
  SlotDef,
} from '@rdna/preview';

// Registry is display-first, not component-first.
//
// Several Radiants exports are namespace-style compound APIs (Tabs, Dialog,
// Select, Alert, StepperTabs) that cannot be rendered via simple
// prop spreading. Others are controlled (Switch, Slider) and need stateful
// wrappers. The registry contract centers on display/preview metadata and
// provides an optional raw component reference for plain components only.

export const CATEGORIES: ComponentCategory[] = [
  'action',
  'layout',
  'form',
  'feedback',
  'navigation',
  'overlay',
  'data-display',
  'dev',
];

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  action: 'Actions',
  layout: 'Layout',
  form: 'Forms',
  feedback: 'Feedback',
  navigation: 'Navigation',
  overlay: 'Overlays',
  'data-display': 'Data Display',
  dev: 'Dev Tools',
};

export interface VariantDemo {
  label: string;
  props: Record<string, unknown>;
}

/**
 * How to render this component in a showcase:
 * - `inline`: auto-render via Component + props (default for plain components)
 * - `custom`: use the `Demo` component (compound or controlled components)
 * - `description-only`: show metadata only, no live preview
 */
export type RenderMode = 'inline' | 'custom' | 'description-only';

/** Server-safe metadata — no React component refs. */
export interface RegistryMetadataEntry {
  packageName: '@rdna/radiants';
  /** Component name matching schema.json `name` field */
  name: string;
  /** Display category for filtering */
  category: ComponentCategory;
  /** One-line description from schema.json */
  description: string;
  /** Path to source file relative to repo root */
  sourcePath: string;
  /** Path to schema.json relative to repo root */
  schemaPath: string;
  /** How to render in showcase */
  renderMode: RenderMode;
  /** Default props for a simple inline render */
  exampleProps?: Record<string, unknown>;
  /** Named variant demos */
  variants?: VariantDemo[];
  /** Which props a custom Demo forwards */
  controlledProps?: string[];
  /** Search tags */
  tags?: string[];
  /** Forced pseudo-states available for design inspection */
  states?: ForcedState[];
  /** Stable client id */
  id: string;
  /** Display label */
  label: string;
  /** Human-readable category label */
  group: string;
  /** Canonical authored prop metadata */
  props: Record<string, PropDef>;
  /** Canonical authored slot metadata */
  slots: Record<string, SlotDef>;
  /** Default prop values for showcases */
  defaultProps: Record<string, unknown>;
  /** Token slot-to-token mapping */
  tokenBindings: Record<string, Record<string, string>> | null;
  /** Named subcomponents exported by the component */
  subcomponents: string[];
  /** Hand-authored usage examples */
  examples: Array<{ name: string; code: string }>;
}

/** React runtime wiring — added on top of metadata at the client layer. */
export interface RuntimeAttachment {
  /** The primary component export */
  component?: ComponentType<any>;
  /** React component for compound/controlled demos */
  Demo?: ComponentType;
}

export interface RegistryEntry extends RegistryMetadataEntry, RuntimeAttachment {}
