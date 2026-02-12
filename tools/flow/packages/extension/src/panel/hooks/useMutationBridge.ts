/**
 * Hook that bridges the panel's designer controls to the content script's unified mutation engine.
 *
 * Sends mutation:apply commands (selector-based) when designer inputs change.
 * Listens for mutation:state events and feeds net diffs + undo/redo state to the Zustand store.
 */

import { useEffect, useCallback, useRef } from 'react';
import {
  FLOW_MUTATION_PORT_NAME,
  type MutationApplyCommand,
  type MutationMessage,
  type MutationStateEvent,
} from '@flow/shared';
import { useAppStore } from '../stores/appStore';

interface UseMutationBridgeOptions {
  /** CSS selector for the currently selected element */
  selector: string | null;
  /** The tab ID to communicate with */
  tabId: number;
}

export function useMutationBridge({ selector, tabId }: UseMutationBridgeOptions) {
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const setMutationState = useAppStore((s) => s.setMutationState);

  useEffect(() => {
    const port = chrome.runtime.connect({ name: FLOW_MUTATION_PORT_NAME });
    portRef.current = port;

    port.postMessage({ type: 'panel:init', payload: { tabId } });

    const handleMessage = (message: unknown) => {
      if (!message || typeof message !== 'object' || !('kind' in message)) return;
      const msg = message as MutationMessage;
      if (msg.kind === 'mutation:state') {
        const stateEvt = msg as MutationStateEvent;
        setMutationState({
          netDiffs: stateEvt.netDiffs,
          canUndo: stateEvt.canUndo,
          canRedo: stateEvt.canRedo,
          undoCount: stateEvt.undoCount,
          redoCount: stateEvt.redoCount,
        });
      }
    };

    port.onMessage.addListener(handleMessage);
    return () => {
      port.disconnect();
      portRef.current = null;
    };
  }, [tabId, setMutationState]);

  const applyStyle = useCallback(
    (styleChanges: Record<string, string>) => {
      if (!selector || !portRef.current) return;
      const cmd: MutationApplyCommand = {
        kind: 'mutation:apply',
        selector,
        styleChanges,
      };
      portRef.current.postMessage(cmd);
    },
    [selector],
  );

  const undo = useCallback(() => {
    portRef.current?.postMessage({ kind: 'mutation:undo' });
  }, []);

  const redo = useCallback(() => {
    portRef.current?.postMessage({ kind: 'mutation:redo' });
  }, []);

  const clearAll = useCallback(() => {
    portRef.current?.postMessage({ kind: 'mutation:clear' });
  }, []);

  return { applyStyle, undo, redo, clearAll };
}
