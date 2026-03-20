import type { DisplayMeta } from './types';

/**
 * Hand-authored display metadata for each component.
 *
 * This file is the source of truth for category, tags, and render mode.
 * It is NOT generated — schema.json files are the source for name,
 * description, and props. Category lives here because the schema generator
 * (packages/preview/src/generate-schemas.ts) would overwrite manual edits
 * to schema JSON on regeneration.
 */
export const displayMeta: Record<string, DisplayMeta> = {
  // ── Actions ──────────────────────────────────────────────────────────
  Button: {
    category: 'action',
    tags: ['cta', 'action', 'click'],
    exampleProps: { children: 'Button', icon: 'go-forward' },
  },
  ContextMenu: {
    category: 'action',
    renderMode: 'custom',
    tags: ['right-click', 'menu'],
  },
  DropdownMenu: {
    category: 'action',
    renderMode: 'custom',
    tags: ['menu', 'actions', 'overflow'],
  },
  Toggle: {
    category: 'action',
    tags: ['toggle', 'press', 'on-off'],
  },
  ToggleGroup: {
    category: 'action',
    renderMode: 'custom',
    tags: ['toggle-group', 'segmented', 'multi-select'],
  },
  Toolbar: {
    category: 'action',
    renderMode: 'custom',
    tags: ['toolbar', 'actions', 'controls'],
  },

  // ── Layout ───────────────────────────────────────────────────────────
  Pattern: {
    category: 'layout',
    tags: ['pattern', 'texture', 'pixel', 'fill'],
    exampleProps: { pat: 'checkerboard' },
  },
  Card: {
    category: 'layout',
    tags: ['container', 'panel', 'surface'],
  },
  Divider: {
    category: 'layout',
    tags: ['separator', 'line', 'hr'],
  },
  Collapsible: {
    category: 'layout',
    renderMode: 'custom',
    tags: ['collapse', 'expand', 'toggle'],
  },
  ScrollArea: {
    category: 'layout',
    renderMode: 'custom',
    tags: ['scroll', 'overflow', 'container'],
  },
  Separator: {
    category: 'layout',
    tags: ['divider', 'line', 'separator'],
  },

  // ── Forms ────────────────────────────────────────────────────────────
  Input: {
    category: 'form',
    exampleProps: { placeholder: 'Type something...' },
    tags: ['text', 'field', 'form'],
  },
  TextArea: {
    category: 'form',
    renderMode: 'custom',
    tags: ['text', 'multiline', 'textarea'],
  },
  Label: {
    category: 'form',
    renderMode: 'custom',
    tags: ['label', 'form', 'field'],
  },
  Checkbox: {
    category: 'form',
    tags: ['toggle', 'check', 'boolean'],
  },
  Radio: {
    category: 'form',
    renderMode: 'custom',
    tags: ['radio', 'option', 'choice'],
  },
  RadioGroup: {
    category: 'form',
    renderMode: 'custom',
    tags: ['radio-group', 'radio', 'group', 'selection'],
  },
  Select: {
    category: 'form',
    renderMode: 'custom',
    tags: ['dropdown', 'picker', 'choice'],
  },
  Slider: {
    category: 'form',
    tags: ['range', 'volume', 'adjust'],
  },
  Switch: {
    category: 'form',
    tags: ['toggle', 'on-off', 'boolean'],
  },
  Field: {
    category: 'form',
    renderMode: 'custom',
    tags: ['field', 'form', 'label', 'validation'],
  },
  Fieldset: {
    category: 'form',
    renderMode: 'custom',
    tags: ['fieldset', 'form', 'group', 'legend'],
  },
  NumberField: {
    category: 'form',
    renderMode: 'custom',
    tags: ['number', 'input', 'stepper', 'numeric'],
  },
  Combobox: {
    category: 'form',
    renderMode: 'custom',
    tags: ['combobox', 'autocomplete', 'search', 'select'],
  },

  // ── Feedback ─────────────────────────────────────────────────────────
  Alert: {
    category: 'feedback',
    tags: ['message', 'banner', 'notification'],
  },
  Badge: {
    category: 'feedback',
    tags: ['label', 'status', 'pill'],
  },
  Spinner: {
    category: 'feedback',
    renderMode: 'custom',
    tags: ['loading', 'spinner', 'animation'],
  },
  Meter: {
    category: 'feedback',
    renderMode: 'custom',
    tags: ['meter', 'gauge', 'measure', 'level'],
  },
  Toast: {
    category: 'feedback',
    renderMode: 'custom',
    tags: ['notification', 'snackbar', 'message'],
  },
  Tooltip: {
    category: 'feedback',
    tags: ['hint', 'info', 'hover'],
  },

  // ── Navigation ───────────────────────────────────────────────────────
  Breadcrumbs: {
    category: 'navigation',
    tags: ['path', 'navigation', 'trail'],
  },
  Tabs: {
    category: 'navigation',
    renderMode: 'custom',
    tags: ['sections', 'switch'],
  },
  Menubar: {
    category: 'navigation',
    renderMode: 'custom',
    tags: ['menubar', 'menu', 'desktop', 'file-menu'],
  },
  NavigationMenu: {
    category: 'navigation',
    renderMode: 'custom',
    tags: ['navigation', 'nav', 'flyout', 'site-nav'],
  },
  // ── Overlays ─────────────────────────────────────────────────────────
  AlertDialog: {
    category: 'overlay',
    renderMode: 'custom',
    tags: ['alert', 'confirm', 'modal', 'destructive'],
  },
  Dialog: {
    category: 'overlay',
    renderMode: 'custom',
    tags: ['modal', 'popup', 'confirm'],
  },
  Drawer: {
    category: 'overlay',
    renderMode: 'custom',
    tags: ['drawer', 'bottom-sheet', 'slide', 'mobile'],
  },
  Sheet: {
    category: 'overlay',
    renderMode: 'custom',
    tags: ['drawer', 'panel', 'slide'],
  },
  Popover: {
    category: 'overlay',
    renderMode: 'custom',
    tags: ['popup', 'tooltip', 'float'],
  },
  PreviewCard: {
    category: 'overlay',
    renderMode: 'custom',
    tags: ['preview', 'hover', 'card', 'popup'],
  },
  HelpPanel: {
    category: 'overlay',
    renderMode: 'custom',
    tags: ['help', 'docs', 'guide'],
  },

  // ── Data Display ─────────────────────────────────────────────────────
  CountdownTimer: {
    category: 'data-display',
    renderMode: 'custom',
    tags: ['timer', 'clock', 'deadline'],
  },
  Web3ActionBar: {
    category: 'data-display',
    renderMode: 'custom',
    tags: ['wallet', 'web3', 'solana'],
  },
  Avatar: {
    category: 'data-display',
    renderMode: 'custom',
    tags: ['avatar', 'user', 'image', 'profile'],
  },

  // ── Dev ──────────────────────────────────────────────────────────────
  MockStatesPopover: {
    category: 'dev',
    exclude: true,
  },
};
