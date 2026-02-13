import { safePortPostMessage } from '../../utils/runtimeSafety';
import type { PromptDraftNode } from '@flow/shared';

export interface PromptSourceComponent {
  name: string;
  file: string;
  line: number;
  column: number;
}

export interface PromptSourceToken {
  name: string;
  value: string;
  tier: 'inline' | 'public';
}

export interface PromptSourceAsset {
  id: string;
  name: string;
  path: string;
  type: 'icon' | 'logo' | 'image';
}

export interface PromptSources {
  components: PromptSourceComponent[];
  tokens: PromptSourceToken[];
  assets: PromptSourceAsset[];
}

/**
 * State bridge between on-page UI (content script) and panel (DevTools).
 *
 * On-page UI dispatches actions via port messages.
 * Panel sends state snapshots to keep on-page UI in sync.
 */

export interface OnPageState {
  editorMode: string;
  activeFeedbackType: string | null;
  dogfoodMode: boolean;
  promptSteps: unknown[];
  promptDraft: PromptDraftNode[];
  promptSources: PromptSources;
  pendingSlot: { stepId: string; slot: 'target' | 'reference' } | null;
  activeLanguage: string;
}

type StateListener = (state: OnPageState) => void;

let currentState: OnPageState = {
  editorMode: 'cursor',
  activeFeedbackType: null,
  dogfoodMode: false,
  promptSteps: [],
  promptDraft: [],
  promptSources: {
    components: [],
    tokens: [],
    assets: [],
  },
  pendingSlot: null,
  activeLanguage: 'css',
};

const listeners = new Set<StateListener>();

let port: chrome.runtime.Port | null = null;

export function initStateBridge(existingPort: chrome.runtime.Port): void {
  port = existingPort;

  port.onMessage.addListener((msg: unknown) => {
    if (typeof msg !== 'object' || msg === null) return;
    const m = msg as Record<string, unknown>;

    if (m.type === 'flow:state-sync') {
      currentState = m.state as OnPageState;
      for (const listener of listeners) {
        listener(currentState);
      }
    }
  });
}

export function getOnPageState(): OnPageState {
  return currentState;
}

export function subscribeOnPageState(listener: StateListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Dispatch an action to the panel's Zustand store */
export function dispatchToPanel(action: { type: string; payload?: unknown }): void {
  safePortPostMessage(port, action);
}
