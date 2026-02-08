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
  | 'annotate'    // Agentation-style annotation (merged comment+question)
  | 'search'      // CSS selector / text / fuzzy search
  | 'inspector'   // Hover for computed CSS tooltip
  | 'editText'    // Double-click for contenteditable

/**
 * Design sub-modes (activated with D → number key)
 */
export type DesignSubMode =
  | 'position'      // 1 - Drag + arrow nudge
  | 'spacing'       // 2 - Margin+padding with visual indicators
  | 'flex'          // 3 - Flex alignment controls
  | 'move'          // 4 - Arrow key reorder + drag grip
  | 'color'         // 5 - Semantic color picker
  | 'effects'       // 6 - Visual effects (blend, shadow, filters)
  | 'typography'    // 7 - Arrow keys for font properties
  | 'guides'        // 8 - Click-to-anchor measurements
  | 'accessibility' // 9 - WCAG audit

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
    id: 'annotate',
    hotkey: 'a',
    label: 'Annotate',
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
    id: 'inspector',
    hotkey: 'i',
    label: 'Inspector',
    interceptsEvents: true,
    showsHoverOverlay: true,
  },
  {
    id: 'editText',
    hotkey: 'e',
    label: 'Edit Text',
    interceptsEvents: true,
    showsHoverOverlay: true,
  },
] as const

export const DESIGN_SUB_MODES: readonly DesignSubModeConfig[] = [
  {
    id: 'position',
    key: '1',
    label: 'Position',
    icon: 'move',
    tooltip: 'Drag + arrow nudge',
    panelSection: 'PositionSection',
  },
  {
    id: 'spacing',
    key: '2',
    label: 'Spacing',
    icon: 'square-dashed',
    tooltip: 'Merged margin+padding, Shift=all sides, Alt=opposing',
    panelSection: 'SpacingSection',
  },
  {
    id: 'flex',
    key: '3',
    label: 'Flex',
    icon: 'layout-grid',
    tooltip: 'Flex alignment controls',
    panelSection: 'LayoutSection',
  },
  {
    id: 'move',
    key: '4',
    label: 'Move',
    icon: 'grip-vertical',
    tooltip: 'Arrow key reorder + drag grip',
    panelSection: null,
  },
  {
    id: 'color',
    key: '5',
    label: 'Color',
    icon: 'palette',
    tooltip: 'Semantic color picker',
    panelSection: 'ColorsSection',
  },
  {
    id: 'effects',
    key: '6',
    label: 'Effects',
    icon: 'sparkles',
    tooltip: 'Blend, shadow, filters',
    panelSection: 'BoxShadowsSection',
  },
  {
    id: 'typography',
    key: '7',
    label: 'Typography',
    icon: 'type',
    tooltip: 'Arrow keys for font properties',
    panelSection: 'TypographySection',
  },
  {
    id: 'guides',
    key: '8',
    label: 'Guides',
    icon: 'ruler',
    tooltip: 'Click-to-anchor measurements',
    panelSection: null,
  },
  {
    id: 'accessibility',
    key: '9',
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
