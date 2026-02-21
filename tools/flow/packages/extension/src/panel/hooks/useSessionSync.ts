import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

/**
 * Subscribes to sidecar status from background service worker.
 *
 * Session push and agent message routing are now handled by the background
 * (via panel:session-data and bg:agent-* messages). This hook only manages
 * the sidecar connection status indicator in the panel UI.
 */
export function useSessionSync() {
  useEffect(() => {
    // Get initial sidecar status from background
    chrome.runtime.sendMessage({ type: 'get-sidecar-status' }, (response) => {
      if (chrome.runtime.lastError) return;
      if (response) {
        useAppStore
          .getState()
          .setSidecarStatus(response.connected ? 'connected' : 'disconnected');
      }
    });

    // Listen for status change broadcasts from background
    const onMessage = (message: { type: string }) => {
      if (message.type === 'sidecar-connected') {
        useAppStore.getState().setSidecarStatus('connected');
      } else if (message.type === 'sidecar-disconnected') {
        useAppStore.getState().setSidecarStatus('disconnected');
      }
    };

    chrome.runtime.onMessage.addListener(onMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(onMessage);
    };
  }, []);
}
