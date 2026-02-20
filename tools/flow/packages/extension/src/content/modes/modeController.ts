/**
 * Mode Controller — Content Script State Machine
 *
 * Pure state machine managing mode transitions. Runs in the content script
 * where DOM access lives. No DOM manipulation — overlays and event
 * interception are handled by separate modules that subscribe to state.
 *
 * State transitions:
 * - setTopLevel: switch top-level mode, clears designSubMode unless staying in design
 * - setDesignSubMode: switch sub-mode (only when topLevel === 'design')
 * - Escape always returns to 'default'
 * - Entering 'design' without a sub-mode defaults to 'position' (sub-mode 1)
 */

import type { TopLevelMode, DesignSubMode, ModeState } from './types'
import { DESIGN_SUB_MODES } from './types'

export interface ModeControllerOptions {
  onModeChange: (state: ModeState) => void
}

export interface ModeController {
  setTopLevel: (mode: TopLevelMode) => void
  setDesignSubMode: (subMode: DesignSubMode) => void
  cycleDesignSubMode: (direction: 1 | -1) => void
  getState: () => ModeState
  subscribe: (listener: (state: ModeState) => void) => () => void
}

export function createModeController(
  options: ModeControllerOptions
): ModeController {
  let state: ModeState = {
    topLevel: 'default',
    designSubMode: null,
    previousTopLevel: null,
  }

  const listeners = new Set<(state: ModeState) => void>()

  function notify(): void {
    const snapshot = { ...state }
    options.onModeChange(snapshot)
    for (const listener of listeners) {
      listener(snapshot)
    }
  }

  function setTopLevel(mode: TopLevelMode): void {
    if (state.topLevel === mode) return

    const previousTopLevel = state.topLevel

    if (mode === 'design') {
      // Entering design: default to 'spacing' (sub-mode is cleared on exit)
      state = {
        topLevel: 'design',
        designSubMode: state.designSubMode ?? 'spacing',
        previousTopLevel,
      }
    } else {
      // Leaving design or switching between non-design modes: clear sub-mode
      state = {
        topLevel: mode,
        designSubMode: null,
        previousTopLevel,
      }
    }

    notify()
  }

  function setDesignSubMode(subMode: DesignSubMode): void {
    if (state.topLevel !== 'design') return
    if (state.designSubMode === subMode) return

    state = { ...state, designSubMode: subMode }
    notify()
  }

  function cycleDesignSubMode(direction: 1 | -1): void {
    if (state.topLevel !== 'design') return
    const currentIdx = DESIGN_SUB_MODES.findIndex(s => s.id === state.designSubMode)
    if (currentIdx === -1) return
    const nextIdx = (currentIdx + direction + DESIGN_SUB_MODES.length) % DESIGN_SUB_MODES.length
    setDesignSubMode(DESIGN_SUB_MODES[nextIdx].id)
  }

  function getState(): ModeState {
    return { ...state }
  }

  function subscribe(listener: (state: ModeState) => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  return { setTopLevel, setDesignSubMode, cycleDesignSubMode, getState, subscribe }
}
