/**
 * Mode System Types for Flow Extension
 *
 * Defines the complete type system for Flow's tool-based UI paradigm.
 * Top-level modes control the overall interaction model, while design sub-modes
 * provide specialized editing capabilities within the design mode.
 *
 * Shared between content script and panel — lives in @flow/shared.
 */

// ============================================================================
// Core Mode Types
// ============================================================================

/**
 * Top-level interaction modes
 */
export type TopLevelMode =
  | 'default'     // No mode, page fully interactive, no overlays
  | 'select'      // Hover highlights, click selects, event interception
  | 'design'      // Parent mode with sub-modes
  | 'comment'     // Comment feedback mode (todo-style guidance)
  | 'question'    // Question feedback mode (expects direct AI response)
  | 'search'      // CSS selector / text / fuzzy search
  | 'inspect'     // Hover tooltip + click panel (assets, styles, a11y, ruler)
  | 'editText'    // Click to edit text content in-place
  | 'move'        // M - DOM reorder + drag-and-drop
  | 'vmodeSelect' // V - Click elements to add context chips to Side Panel prompt builder

/**
 * Design sub-modes (activated with D → number key)
 */
export type DesignSubMode =
  | 'layout'        // 1 - Display, flex/grid, spacing, alignment
  | 'color'         // 2 - Semantic color picker
  | 'typography'    // 3 - Arrow keys for font properties
  | 'effects'       // 4 - Visual effects (blend, shadow, filters)
  | 'position'      // 5 - Position, offsets, z-index
  | 'guides'        // 6 - Click-to-anchor measurements
  | 'accessibility' // 7 - WCAG audit

// ============================================================================
// State Management
// ============================================================================

/**
 * Current mode state
 */
export interface ModeState {
  /** Current top-level mode */
  topLevel: TopLevelMode
  /** Active design sub-mode (only when topLevel === 'design') */
  designSubMode: DesignSubMode | null
  /** Previous top-level mode (for Escape key behavior) */
  previousTopLevel: TopLevelMode | null
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for a top-level mode
 */
export interface ModeConfig {
  id: TopLevelMode
  /** Keyboard hotkey (null for modes activated via toolbar only) */
  hotkey: string | null
  label: string
  /** Whether this mode intercepts page events */
  interceptsEvents: boolean
  /** Whether this mode shows hover overlay */
  showsHoverOverlay: boolean
}

/**
 * Configuration for a design sub-mode
 */
export interface DesignSubModeConfig {
  id: DesignSubMode
  /** Number key (1-9) to activate */
  key: string
  label: string
  /** Icon name (Lucide convention) */
  icon: string
  tooltip: string
  /** Associated panel section component name */
  panelSection: string | null
}

// ============================================================================
// Mode Configurations
// ============================================================================

export const TOP_LEVEL_MODES: readonly ModeConfig[] = [
  {
    id: 'default',
    hotkey: 'Escape',
    label: 'Default',
    interceptsEvents: false,
    showsHoverOverlay: false,
  },
  {
    id: 'select',
    hotkey: null,
    label: 'Select',
    interceptsEvents: true,
    showsHoverOverlay: true,
  },
  {
    id: 'design',
    hotkey: 'd',
    label: 'Design',
    interceptsEvents: true,
    showsHoverOverlay: true,
  },
  {
    id: 'comment',
    hotkey: 'c',
    label: 'Comment',
    interceptsEvents: true,
    showsHoverOverlay: true,
  },
  {
    id: 'question',
    hotkey: 'q',
    label: 'Question',
    interceptsEvents: true,
    showsHoverOverlay: true,
  },
  {
    id: 'search',
    hotkey: 's',
    label: 'Search',
    interceptsEvents: true,
    showsHoverOverlay: false,
  },
  {
    id: 'inspect',
    hotkey: 'i',
    label: 'Inspect',
    interceptsEvents: true,
    showsHoverOverlay: true,
  },
  {
    id: 'editText',
    hotkey: 't',
    label: 'Edit Text',
    // Keep page clicks direct so text-edit click handlers can target real elements.
    interceptsEvents: false,
    showsHoverOverlay: true,
  },
  {
    id: 'move',
    hotkey: 'm',
    label: 'Move',
    interceptsEvents: true,
    showsHoverOverlay: true,
  },
  {
    id: 'vmodeSelect',
    hotkey: 'v',
    label: 'V Mode',
    interceptsEvents: true,
    showsHoverOverlay: true,
  },
] as const

export const DESIGN_SUB_MODES: readonly DesignSubModeConfig[] = [
  {
    id: 'layout',
    key: '1',
    label: 'Layout',
    icon: 'layout-grid',
    tooltip: 'Display, flex/grid, spacing, alignment',
    panelSection: 'LayoutSection',
  },
  {
    id: 'color',
    key: '2',
    label: 'Color',
    icon: 'palette',
    tooltip: 'Semantic color picker',
    panelSection: 'ColorsSection',
  },
  {
    id: 'typography',
    key: '3',
    label: 'Typography',
    icon: 'type',
    tooltip: 'Arrow keys for font properties',
    panelSection: 'TypographySection',
  },
  {
    id: 'effects',
    key: '4',
    label: 'Effects',
    icon: 'sparkles',
    tooltip: 'Blend, shadow, filters',
    panelSection: 'BoxShadowsSection',
  },
  {
    id: 'position',
    key: '5',
    label: 'Position',
    icon: 'move',
    tooltip: 'Position, offsets, z-index',
    panelSection: 'PositionSection',
  },
  {
    id: 'guides',
    key: '6',
    label: 'Guides',
    icon: 'ruler',
    tooltip: 'Click-to-anchor measurements',
    panelSection: null,
  },
  {
    id: 'accessibility',
    key: '7',
    label: 'Accessibility',
    icon: 'accessibility',
    tooltip: 'WCAG audit',
    panelSection: 'AccessibilityPanel',
  },
] as const

// ============================================================================
// Utility Functions
// ============================================================================

export function interceptsEvents(mode: TopLevelMode): boolean {
  const config = (TOP_LEVEL_MODES as readonly ModeConfig[]).find(m => m.id === mode)
  return config?.interceptsEvents ?? false
}

export function showsHoverOverlay(mode: TopLevelMode): boolean {
  const config = (TOP_LEVEL_MODES as readonly ModeConfig[]).find(m => m.id === mode)
  return config?.showsHoverOverlay ?? false
}

export function getModeByHotkey(hotkey: string): TopLevelMode | null {
  const config = (TOP_LEVEL_MODES as readonly ModeConfig[]).find(m => m.hotkey === hotkey)
  return config?.id ?? null
}

export function getDesignSubModeByKey(key: string): DesignSubMode | null {
  const config = (DESIGN_SUB_MODES as readonly DesignSubModeConfig[]).find(m => m.key === key)
  return config?.id ?? null
}
