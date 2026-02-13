/**
 * Mode Hotkeys — Keyboard shortcut registration for mode switching
 *
 * Top-level mode hotkeys: D (design), C (comment), Q (question),
 * S (search), I (inspector), T (edit text), Escape (default)
 *
 * Design sub-mode number keys: 1-9 (only active when topLevel === 'design')
 */

import { registerHotkeys } from '../features/hotkeys'
import type { TopLevelMode, DesignSubMode } from './types'
import { TOP_LEVEL_MODES, DESIGN_SUB_MODES } from './types'

export interface ModeHotkeyCallbacks {
  setTopLevel: (mode: TopLevelMode) => void
  setDesignSubMode: (subMode: DesignSubMode) => void
  getTopLevel: () => TopLevelMode
}

/**
 * Register all mode-switching hotkeys.
 * Returns a cleanup function that unbinds all hotkeys.
 */
export function registerModeHotkeys(callbacks: ModeHotkeyCallbacks): () => void {
  const bindings: Array<{ keys: string; handler: (e: KeyboardEvent) => void }> = []

  // Top-level mode hotkeys
  for (const mode of TOP_LEVEL_MODES) {
    if (!mode.hotkey) continue
    bindings.push({
      keys: mode.hotkey,
      handler: (e) => {
        e.preventDefault()
        callbacks.setTopLevel(mode.id)
      },
    })
  }

  // Design sub-mode number keys (only active when in design mode)
  for (const sub of DESIGN_SUB_MODES) {
    bindings.push({
      keys: sub.key,
      handler: (e) => {
        if (callbacks.getTopLevel() !== 'design') return
        e.preventDefault()
        callbacks.setDesignSubMode(sub.id)
      },
    })
  }

  return registerHotkeys(bindings)
}
