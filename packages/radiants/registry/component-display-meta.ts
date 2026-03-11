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

  // ── Layout ───────────────────────────────────────────────────────────
  Card: {
    category: 'layout',
    tags: ['container', 'panel', 'surface'],
  },
  Divider: {
    category: 'layout',
    tags: ['separator', 'line', 'hr'],
  },
  Accordion: {
    category: 'layout',
    tags: ['collapse', 'expand', 'faq'],
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

  // ── Feedback ─────────────────────────────────────────────────────────
  Alert: {
    category: 'feedback',
    tags: ['message', 'banner', 'notification'],
  },
  Badge: {
    category: 'feedback',
    tags: ['label', 'status', 'pill'],
  },
  Progress: {
    category: 'feedback',
    tags: ['loading', 'bar', 'status'],
  },
  Spinner: {
    category: 'feedback',
    renderMode: 'custom',
    tags: ['loading', 'spinner', 'animation'],
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

  // ── Dev ──────────────────────────────────────────────────────────────
  MockStatesPopover: {
    category: 'dev',
    exclude: true,
  },
};
