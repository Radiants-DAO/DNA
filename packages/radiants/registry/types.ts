import type { ComponentType } from 'react';

// Registry is display-first, not component-first.
//
// Several Radiants exports are namespace-style compound APIs (Tabs, Dialog,
// Select, Alert, StepperTabs) that cannot be rendered via simple
// prop spreading. Others are controlled (Switch, Slider) and need stateful
// wrappers. The registry contract centers on display/preview metadata and
// provides an optional raw component reference for plain components only.

export type ComponentCategory =
  | 'action'
  | 'layout'
  | 'form'
  | 'feedback'
  | 'navigation'
  | 'overlay'
  | 'data-display'
  | 'dev';

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

export type ForcedState = 'hover' | 'pressed' | 'focus' | 'disabled' | 'error';

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
  /** Path to dna.json relative to repo root, if present */
  dnaPath?: string | null;
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
}

/** React runtime wiring — added on top of metadata at the client layer. */
export interface RuntimeAttachment {
  /** The primary component export */
  component?: ComponentType<any>;
  /** React component for compound/controlled demos */
  Demo?: ComponentType;
}

export interface RegistryEntry extends RegistryMetadataEntry, RuntimeAttachment {}

export interface DisplayMeta {
  /** Override category (if schema doesn't have it) */
  category: ComponentCategory;
  /** Extra search tags beyond auto-generated ones */
  tags?: string[];
  /** Override render mode (defaults based on component analysis) */
  renderMode?: RenderMode;
  /** Override default example props */
  exampleProps?: Record<string, unknown>;
  /** Replace auto-generated variants with hand-authored ones */
  variants?: VariantDemo[];
  /** React component for compound/controlled demos — safe for hooks */
  Demo?: ComponentType;
  /** Which props the Demo actually forwards (custom renderMode only) */
  controlledProps?: string[];
  /** Set to true to exclude from registry */
  exclude?: boolean;
}
