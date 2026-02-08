/**
 * Mode System Types — re-exported from @flow/shared
 *
 * The canonical type definitions live in @flow/shared so both the panel
 * and the content script can import them. This file re-exports everything
 * so existing content-side imports remain unchanged.
 */
export {
  type TopLevelMode,
  type DesignSubMode,
  type ModeState,
  type ModeConfig,
  type DesignSubModeConfig,
  TOP_LEVEL_MODES,
  DESIGN_SUB_MODES,
  interceptsEvents,
  showsHoverOverlay,
  getModeByHotkey,
  getDesignSubModeByKey,
} from '@flow/shared';
