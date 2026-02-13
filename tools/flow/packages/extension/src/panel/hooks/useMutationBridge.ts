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
import {
  isRuntimeMessagingError,
  safePortPostMessage,
  safeRuntimeConnect,
} from '../../utils/runtimeSafety';

interface UseMutationBridgeOptions {
  /** CSS selector for the currently selected element */
  selector: string | null;
  /** The tab ID to communicate with */
  tabId: number;
}

export function useMutationBridge({ selector, tabId }: UseMutationBridgeOptions) {
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isUnmountedRef = useRef(false);
  const setMutationState = useAppStore((s) => s.setMutationState);

  useEffect(() => {
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

    const connect = () => {
      if (isUnmountedRef.current) return;
      const port = safeRuntimeConnect(FLOW_MUTATION_PORT_NAME, (error) => {
        if (isRuntimeMessagingError(error)) {
          console.warn('[useMutationBridge] Runtime unavailable while connecting mutation port.');
        } else {
          console.error('[useMutationBridge] Failed to connect mutation port:', error);
        }
      });
      if (!port) {
        const delay = Math.min(500 * 2 ** reconnectAttemptsRef.current, 5000);
        reconnectAttemptsRef.current += 1;
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(connect, delay);
        return;
      }
      portRef.current = port;
      reconnectAttemptsRef.current = 0;

      safePortPostMessage(port, { type: 'panel:init', payload: { tabId } }, (error) => {
        if (isRuntimeMessagingError(error)) {
          console.warn('[useMutationBridge] Runtime unavailable during mutation init.');
          return;
        }
        console.error('[useMutationBridge] Failed to initialize mutation bridge:', error);
      });
      port.onMessage.addListener(handleMessage);

      port.onDisconnect.addListener(() => {
        if (isUnmountedRef.current) return;
        portRef.current = null;
        const delay = Math.min(500 * 2 ** reconnectAttemptsRef.current, 5000);
        reconnectAttemptsRef.current += 1;
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(connect, delay);
      });
    };

    isUnmountedRef.current = false;
    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      const port = portRef.current;
      if (port) {
        port.disconnect();
      }
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
      safePortPostMessage(portRef.current, cmd);
    },
    [selector],
  );

  const undo = useCallback(() => {
    safePortPostMessage(portRef.current, { kind: 'mutation:undo' });
  }, []);

  const redo = useCallback(() => {
    safePortPostMessage(portRef.current, { kind: 'mutation:redo' });
  }, []);

  const clearAll = useCallback(() => {
    safePortPostMessage(portRef.current, { kind: 'mutation:clear' });
  }, []);

  return { applyStyle, undo, redo, clearAll };
}
