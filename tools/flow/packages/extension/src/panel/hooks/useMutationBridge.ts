/**
 * Hook that bridges the panel's designer controls to the content script's mutation engine.
 *
 * Sends mutation:apply commands when designer inputs change.
 * Listens for mutation:diff events and feeds them to the Zustand store.
 */

import { useEffect, useCallback, useRef } from 'react';
import {
  FLOW_MUTATION_PORT_NAME,
  type MutationApplyCommand,
  type MutationClearCommand,
  type MutationRevertCommand,
  type MutationDiffEvent,
  type MutationRevertedEvent,
  type MutationMessage,
} from '@flow/shared';

interface UseMutationBridgeOptions {
  /** The currently selected element's ref ID in the content script */
  elementRef: string | null;
  /** The tab ID to communicate with */
  tabId: number;
  /** Callback when a diff is received from the content script */
  onDiff: (diff: MutationDiffEvent['diff']) => void;
  /** Callback when a revert is confirmed */
  onReverted: (mutationId: string | 'all') => void;
}

export function useMutationBridge({
  elementRef,
  tabId,
  onDiff,
  onReverted,
}: UseMutationBridgeOptions) {
  const portRef = useRef<chrome.runtime.Port | null>(null);

  useEffect(() => {
    const port = chrome.runtime.connect({ name: FLOW_MUTATION_PORT_NAME });
    portRef.current = port;

    // Initialize with tab ID
    port.postMessage({
      type: 'panel:init',
      payload: { tabId },
    });

    const handleMessage = (message: unknown) => {
      if (!message || typeof message !== 'object' || !('kind' in message)) return;
      const msg = message as MutationMessage;
      if (msg.kind === 'mutation:diff') {
        onDiff(msg.diff);
      } else if (msg.kind === 'mutation:reverted') {
        onReverted(msg.mutationId);
      } else if (msg.kind === 'mutation:cleared') {
        onReverted('all');
      }
    };

    port.onMessage.addListener(handleMessage);

    return () => {
      port.disconnect();
      portRef.current = null;
    };
  }, [tabId, onDiff, onReverted]);

  const applyStyle = useCallback(
    (styleChanges: Record<string, string>) => {
      if (!elementRef || !portRef.current) return;
      const cmd: MutationApplyCommand = {
        kind: 'mutation:apply',
        elementRef,
        styleChanges,
      };
      portRef.current.postMessage(cmd);
    },
    [elementRef]
  );

  const revert = useCallback((mutationId: string | 'all') => {
    if (!portRef.current) return;
    const cmd: MutationRevertCommand = {
      kind: 'mutation:revert',
      mutationId,
    };
    portRef.current.postMessage(cmd);
  }, []);

  const clear = useCallback(() => {
    if (!portRef.current) return;
    const cmd: MutationClearCommand = {
      kind: 'mutation:clear',
    };
    portRef.current.postMessage(cmd);
  }, []);

  return { applyStyle, revert, clear };
}
