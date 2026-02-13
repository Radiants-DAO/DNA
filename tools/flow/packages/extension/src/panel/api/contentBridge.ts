/**
 * Content Bridge - chrome.runtime messaging to content script
 *
 * Replaces Tauri's invoke/events with browser extension message passing.
 */

import { FLOW_PANEL_PORT_NAME } from "@flow/shared";
import type { PanelToBackgroundMessage } from "@flow/shared";
import {
  isRuntimeMessagingError,
  safePortPostMessage,
  safeRuntimeConnect,
} from "../../utils/runtimeSafety";

let port: chrome.runtime.Port | null = null;
let tabId: number | null = null;
let retryCount = 0;
const MAX_RETRIES = 10;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

// Track active listeners for reattachment after port reconnection
const messageListeners = new Set<(msg: unknown) => void>();

/**
 * Initialize the content bridge with the inspected tab ID.
 * Returns the connected port for the Panel to use for message listening.
 * This ensures only ONE port is created per panel instance.
 */
export function initContentBridge(inspectedTabId: number): chrome.runtime.Port | null {
  tabId = inspectedTabId;
  connectPort();
  return port;
}

/**
 * Get the current port (for components that need to add listeners after init)
 */
export function getPort(): chrome.runtime.Port | null {
  return port;
}

function connectPort(): void {
  if (tabId === null) return;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  const nextPort = safeRuntimeConnect(FLOW_PANEL_PORT_NAME, (error) => {
    if (isRuntimeMessagingError(error)) {
      console.warn("[contentBridge] Runtime unavailable while connecting; waiting to retry.");
    } else {
      console.error("[contentBridge] Failed to connect panel port:", error);
    }
  });
  if (!nextPort) {
    scheduleReconnect();
    return;
  }
  port = nextPort;

  // Reset retry count on successful connection
  retryCount = 0;

  // Send init message with tabId
  safePortPostMessage(port, { type: "panel:init", payload: { tabId } }, (error) => {
    if (isRuntimeMessagingError(error)) {
      console.warn("[contentBridge] Runtime unavailable during init message.");
    } else {
      console.error("[contentBridge] Failed to send init message:", error);
    }
  });

  // Reattach all tracked listeners to the new port
  for (const listener of messageListeners) {
    port.onMessage.addListener(listener);
  }

  port.onDisconnect.addListener(() => {
    port = null;
    if (retryCount >= MAX_RETRIES) {
      console.error('[contentBridge] Max reconnection attempts reached');
      return;
    }
    scheduleReconnect();
  });
}

function scheduleReconnect(): void {
  if (retryCount >= MAX_RETRIES) {
    console.error('[contentBridge] Max reconnection attempts reached');
    return;
  }
  if (reconnectTimer) clearTimeout(reconnectTimer);
  const delay = Math.min(1000 * 2 ** retryCount, 30000);
  retryCount++;
  reconnectTimer = setTimeout(connectPort, delay);
}

/**
 * Send a message to the content script via background
 */
export function sendToContent(message: PanelToBackgroundMessage): void {
  if (!port) {
    console.warn("[contentBridge] Port not connected, message dropped:", message);
    return;
  }
  safePortPostMessage(port, message, (error) => {
    if (isRuntimeMessagingError(error)) {
      console.warn("[contentBridge] Runtime unavailable; dropping message:", message.type);
      return;
    }
    console.error("[contentBridge] Failed to post message:", error);
  });
}

/**
 * Listen for messages from content script
 *
 * Listeners are tracked and automatically reattached when the port reconnects.
 */
export function onContentMessage(callback: (message: unknown) => void): () => void {
  const listener = (msg: unknown) => callback(msg);
  messageListeners.add(listener);

  // Attach to current port if connected
  if (port) {
    port.onMessage.addListener(listener);
  }

  return () => {
    messageListeners.delete(listener);
    if (port) {
      port.onMessage.removeListener(listener);
    }
  };
}

/**
 * Disconnect the content bridge
 */
export function disconnectContentBridge(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  try {
    port?.disconnect();
  } catch {
    // Ignore disconnect errors from stale runtime contexts.
  }
  port = null;
  tabId = null;
  retryCount = 0;
  messageListeners.clear();
}

/**
 * Request top-level mode change
 */
export function requestModeChange(mode: string): void {
  sendToContent({ type: "panel:set-mode", payload: { mode } });
}

/**
 * Request design sub-mode change
 */
export function requestSubModeChange(subMode: string): void {
  sendToContent({ type: "panel:set-sub-mode", payload: { subMode } });
}

/**
 * Enable/disable Flow runtime in the inspected page.
 */
export function requestFlowToggle(enabled: boolean): void {
  sendToContent({ type: "panel:flow-toggle", payload: { enabled } });
}
