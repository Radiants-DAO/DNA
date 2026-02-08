/**
 * Mode Slice — Zustand store for mode state synced from content script
 *
 * Uses optimistic updates: the panel immediately reflects the requested
 * mode change, then reconciles when the content script confirms via
 * mode:changed. This ensures buttons respond instantly even if the
 * content script is slow or disconnected.
 */

import type { StateCreator } from 'zustand';
import type { TopLevelMode, DesignSubMode, ModeState } from '@flow/shared';
import type { AppState } from '../types';
import { requestModeChange as bridgeRequestMode, requestSubModeChange as bridgeRequestSubMode } from '../../api/contentBridge';

export interface ModeSlice {
  /** Current mode state (synced from content script) */
  mode: ModeState;

  /** Update mode state (called when receiving mode:changed from content script) */
  setMode: (state: ModeState) => void;

  /** Request mode change (sends message to content script) */
  requestModeChange: (topLevel: TopLevelMode) => void;

  /** Request design sub-mode change */
  requestSubModeChange: (subMode: DesignSubMode) => void;
}

export const createModeSlice: StateCreator<
  AppState,
  [],
  [],
  ModeSlice
> = (set, get) => ({
  mode: {
    topLevel: 'default',
    designSubMode: null,
    previousTopLevel: null,
  },

  setMode: (state) => set({ mode: state }),

  requestModeChange: (topLevel) => {
    // Optimistic update: immediately reflect the mode change in UI
    const current = get().mode;
    const optimistic: ModeState = {
      topLevel,
      designSubMode: topLevel === 'design'
        ? (current.designSubMode ?? 'position')
        : null,
      previousTopLevel: current.topLevel,
    };
    set({ mode: optimistic });

    // Send to content script — it will confirm via mode:changed
    bridgeRequestMode(topLevel);
  },

  requestSubModeChange: (subMode) => {
    // Optimistic update
    const current = get().mode;
    if (current.topLevel !== 'design') return;
    set({ mode: { ...current, designSubMode: subMode } });

    // Send to content script
    bridgeRequestSubMode(subMode);
  },
});
