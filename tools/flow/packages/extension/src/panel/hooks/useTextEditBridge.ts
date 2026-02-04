/**
 * Hook that activates/deactivates text edit mode on the content script.
 *
 * Sends textEdit:activate/deactivate commands and receives text diffs.
 */

import { useEffect, useRef } from 'react';
import {
  FLOW_TEXT_EDIT_PORT_NAME,
  type MutationDiffEvent,
  type MutationMessage,
  type TextEditActivateCommand,
  type TextEditDeactivateCommand,
} from '@flow/shared';

interface UseTextEditBridgeOptions {
  /** Whether text edit mode is active */
  active: boolean;
  /** The tab ID to communicate with */
  tabId: number;
  /** Callback when a text diff is received */
  onDiff: (diff: MutationDiffEvent['diff']) => void;
}

export function useTextEditBridge({
  active,
  tabId,
  onDiff,
}: UseTextEditBridgeOptions) {
  const portRef = useRef<chrome.runtime.Port | null>(null);

  useEffect(() => {
    const port = chrome.runtime.connect({ name: FLOW_TEXT_EDIT_PORT_NAME });
    portRef.current = port;

    // Initialize with tab ID
    port.postMessage({
      type: 'panel:init',
      payload: { tabId },
    });

    const handleMessage = (message: unknown) => {
      if (!message || typeof message !== 'object' || !('kind' in message))
        return;
      const msg = message as MutationMessage;
      // Only forward text mutations to avoid style/spacing diffs leaking in
      if (msg.kind === 'mutation:diff' && msg.diff.type === 'text') {
        onDiff(msg.diff);
      }
    };

    port.onMessage.addListener(handleMessage);

    return () => {
      // Deactivate text edit mode when unmounting
      const deactivateCmd: TextEditDeactivateCommand = {
        kind: 'textEdit:deactivate',
      };
      port.postMessage(deactivateCmd);
      port.disconnect();
      portRef.current = null;
    };
  }, [tabId, onDiff]);

  // Send activate/deactivate when active state changes
  useEffect(() => {
    if (!portRef.current) return;

    if (active) {
      const activateCmd: TextEditActivateCommand = {
        kind: 'textEdit:activate',
      };
      portRef.current.postMessage(activateCmd);
    } else {
      const deactivateCmd: TextEditDeactivateCommand = {
        kind: 'textEdit:deactivate',
      };
      portRef.current.postMessage(deactivateCmd);
    }
  }, [active]);
}
