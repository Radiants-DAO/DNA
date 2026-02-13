import type {
  MutationMessage,
  MutationApplyCommand,
  MutationTextCommand,
  MutationStateEvent,
} from '@flow/shared';
import type { UnifiedMutationEngine } from './unifiedMutationEngine';
import { safePortPostMessage } from '../../utils/runtimeSafety';

let port: chrome.runtime.Port | null = null;
let engine: UnifiedMutationEngine | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribeEngine: (() => void) | null = null;
const DEBOUNCE_MS = 200;

/** Text edit mode handlers — set via setTextEditHandlers */
let textEditActivate: ((onDiff: (diff: MutationStateEvent['netDiffs'][0]) => void) => void) | null = null;
let textEditDeactivate: (() => void) | null = null;

export function setTextEditHandlers(handlers: {
  activate: (onDiff: (diff: MutationStateEvent['netDiffs'][0]) => void) => void;
  deactivate: () => void;
}): void {
  textEditActivate = handlers.activate;
  textEditDeactivate = handlers.deactivate;
}

/**
 * Initialize the mutation message handler with the unified engine.
 */
export function initMutationMessageHandler(
  swPort: chrome.runtime.Port,
  unifiedEngine: UnifiedMutationEngine,
): void {
  // Re-init happens after service worker reconnects. Drop prior subscription
  // so engine state listeners do not accumulate.
  if (unsubscribeEngine) {
    unsubscribeEngine();
    unsubscribeEngine = null;
  }

  port = swPort;
  engine = unifiedEngine;

  // Subscribe to engine state changes → debounced broadcast
  unsubscribeEngine = engine.subscribe(() => {
    scheduleBroadcast();
  });

  swPort.onDisconnect?.addListener(() => {
    if (port !== swPort) return;
    port = null;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = null;
    if (unsubscribeEngine) {
      unsubscribeEngine();
      unsubscribeEngine = null;
    }
  });

  swPort.onMessage.addListener((message: MutationMessage) => {
    switch (message.kind) {
      case 'mutation:apply':
        handleApply(message);
        break;
      case 'mutation:text':
        handleText(message);
        break;
      case 'mutation:undo':
        engine!.undo();
        broadcastStateNow(); // Immediate feedback for undo
        break;
      case 'mutation:redo':
        engine!.redo();
        broadcastStateNow();
        break;
      case 'mutation:clear':
        engine!.clearAll();
        broadcastStateNow();
        break;
      case 'textEdit:activate':
        if (textEditActivate) {
          textEditActivate(() => {
            scheduleBroadcast();
          });
        }
        break;
      case 'textEdit:deactivate':
        if (textEditDeactivate) {
          textEditDeactivate();
        }
        break;
      // Legacy revert — map to undo
      case 'mutation:revert':
        if (message.mutationId === 'all') {
          engine!.clearAll();
        } else {
          engine!.undo();
        }
        broadcastStateNow();
        break;
    }
  });
}

function handleApply(cmd: MutationApplyCommand): void {
  if (!engine) return;
  const el = document.querySelector(cmd.selector) as HTMLElement | null;
  if (!el) return;
  engine.applyStyle(el, cmd.styleChanges);
  // State broadcast handled by engine.subscribe → scheduleBroadcast
}

function handleText(cmd: MutationTextCommand): void {
  if (!engine) return;
  const el = document.querySelector(cmd.selector) as HTMLElement | null;
  if (!el) return;
  engine.applyText(el, cmd.newText);
}

function scheduleBroadcast(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(broadcastStateNow, DEBOUNCE_MS);
}

function broadcastStateNow(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = null;
  if (!port || !engine) return;

  const event: MutationStateEvent = {
    kind: 'mutation:state',
    canUndo: engine.canUndo,
    canRedo: engine.canRedo,
    undoCount: engine.undoCount,
    redoCount: engine.redoCount,
    netDiffs: engine.getNetDiffs(),
  };
  safePortPostMessage(port, event);
}

/**
 * Broadcast state immediately (called by design tool onUpdate callbacks).
 */
export function broadcastMutationState(): void {
  broadcastStateNow();
}
