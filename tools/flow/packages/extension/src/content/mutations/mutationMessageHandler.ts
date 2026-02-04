import type {
  MutationMessage,
  MutationApplyCommand,
  MutationTextCommand,
  MutationRevertCommand,
  MutationClearCommand,
  MutationDiffEvent,
  MutationClearedEvent,
  MutationRevertedEvent,
} from '@flow/shared';
import {
  applyStyleMutation,
  applyTextMutation,
  clearDiffs,
  revertMutation,
} from './mutationEngine';

/** Port to service worker, established by the content script's main init */
let port: chrome.runtime.Port | null = null;

/** Text edit mode handlers - set via setTextEditHandlers */
let textEditActivate: ((onDiff: (diff: MutationDiffEvent['diff']) => void) => void) | null =
  null;
let textEditDeactivate: (() => void) | null = null;

/**
 * Set the text edit mode handlers. Called by textEditMode.ts to register itself.
 * This avoids circular dependencies.
 */
export function setTextEditHandlers(handlers: {
  activate: (onDiff: (diff: MutationDiffEvent['diff']) => void) => void;
  deactivate: () => void;
}): void {
  textEditActivate = handlers.activate;
  textEditDeactivate = handlers.deactivate;
}

/**
 * Initialize the mutation message handler.
 * @param swPort The port to the service worker
 */
export function initMutationMessageHandler(swPort: chrome.runtime.Port): void {
  port = swPort;

  port.onMessage.addListener((message: MutationMessage) => {
    switch (message.kind) {
      case 'mutation:apply':
        handleApply(message);
        break;
      case 'mutation:text':
        handleText(message);
        break;
      case 'textEdit:activate':
        if (textEditActivate) {
          textEditActivate((diff) => {
            if (port) {
              const event: MutationDiffEvent = { kind: 'mutation:diff', diff };
              port.postMessage(event);
            }
          });
        }
        break;
      case 'textEdit:deactivate':
        if (textEditDeactivate) {
          textEditDeactivate();
        }
        break;
      case 'mutation:revert':
        handleRevert(message);
        break;
      case 'mutation:clear':
        handleClear(message);
        break;
    }
  });
}

function handleApply(cmd: MutationApplyCommand): void {
  const diff = applyStyleMutation(cmd.elementRef, cmd.styleChanges);
  if (diff && port) {
    const event: MutationDiffEvent = { kind: 'mutation:diff', diff };
    port.postMessage(event);
  }
}

function handleText(cmd: MutationTextCommand): void {
  const diff = applyTextMutation(cmd.elementRef, cmd.newText);
  if (diff && port) {
    const event: MutationDiffEvent = { kind: 'mutation:diff', diff };
    port.postMessage(event);
  }
}

function handleRevert(cmd: MutationRevertCommand): void {
  const success = revertMutation(cmd.mutationId);
  if (success && port) {
    const event: MutationRevertedEvent = {
      kind: 'mutation:reverted',
      mutationId: cmd.mutationId,
    };
    port.postMessage(event);
  }
}

function handleClear(_cmd: MutationClearCommand): void {
  clearDiffs();
  if (port) {
    const event: MutationClearedEvent = {
      kind: 'mutation:cleared',
    };
    port.postMessage(event);
  }
}

/**
 * Send a diff event to the panel.
 */
export function sendDiffEvent(diff: MutationDiffEvent['diff']): void {
  if (port) {
    const event: MutationDiffEvent = { kind: 'mutation:diff', diff };
    port.postMessage(event);
  }
}
