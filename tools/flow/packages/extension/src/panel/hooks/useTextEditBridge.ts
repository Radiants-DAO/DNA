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
import {
  isRuntimeMessagingError,
  safePortPostMessage,
  safeRuntimeConnect,
} from '../../utils/runtimeSafety';

interface UseTextEditBridgeOptions {
  /** Whether text edit mode is active */
  active: boolean;
  /** The tab ID to communicate with (null while resolving in Side Panel) */
  tabId: number | null;
  /** Callback when a text diff is received */
  onDiff: (diff: MutationDiffEvent['diff']) => void;
}

export function useTextEditBridge({
  active,
  tabId,
  onDiff,
}: UseTextEditBridgeOptions) {
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isUnmountedRef = useRef(false);
  const activeRef = useRef(active);
  const onDiffRef = useRef(onDiff);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    onDiffRef.current = onDiff;
  }, [onDiff]);

  useEffect(() => {
    const handleMessage = (message: unknown) => {
      if (!message || typeof message !== 'object' || !('kind' in message))
        return;
      const msg = message as MutationMessage;
      // Only forward text mutations to avoid style/spacing diffs leaking in
      if (msg.kind === 'mutation:diff' && msg.diff.type === 'text') {
        onDiffRef.current(msg.diff);
      }
    };

    const connect = () => {
      if (isUnmountedRef.current) return;

      const port = safeRuntimeConnect(FLOW_TEXT_EDIT_PORT_NAME, (error) => {
        if (isRuntimeMessagingError(error)) {
          console.warn('[useTextEditBridge] Runtime unavailable while connecting text edit port.');
        } else {
          console.error('[useTextEditBridge] Failed to connect text edit port:', error);
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

      safePortPostMessage(port, {
        type: 'panel:init',
        payload: { tabId: resolvedTabId },
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

      const cmd: TextEditActivateCommand | TextEditDeactivateCommand = activeRef.current
        ? { kind: 'textEdit:activate' }
        : { kind: 'textEdit:deactivate' };
      safePortPostMessage(port, cmd);
    };

    isUnmountedRef.current = false;
    if (tabId === null) return;
    const resolvedTabId = tabId;
    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      safePortPostMessage(portRef.current, { kind: 'textEdit:deactivate' });
      try {
        portRef.current?.disconnect();
      } catch {
        // Ignore disconnect errors from stale runtime contexts.
      }
      portRef.current = null;
    };
  }, [tabId]);

  // Send activate/deactivate when active state changes
  useEffect(() => {
    const cmd: TextEditActivateCommand | TextEditDeactivateCommand = active
      ? { kind: 'textEdit:activate' }
      : { kind: 'textEdit:deactivate' };
    safePortPostMessage(portRef.current, cmd);
  }, [active]);
}
