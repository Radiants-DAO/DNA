/**
 * Content Bridge - chrome.runtime messaging to content script
 *
 * Replaces Tauri's invoke/events with browser extension message passing.
 */

import { FLOW_PANEL_PORT_NAME } from "@flow/shared";
import type { PanelToBackgroundMessage } from "@flow/shared";

let port: chrome.runtime.Port | null = null;
let tabId: number | null = null;

// Track active listeners for reattachment after port reconnection
const messageListeners = new Set<(msg: unknown) => void>();

/**
 * Initialize the content bridge with the inspected tab ID.
 * Returns the connected port for the Panel to use for message listening.
 * This ensures only ONE port is created per panel instance.
 */
export function initContentBridge(inspectedTabId: number): chrome.runtime.Port {
  tabId = inspectedTabId;
  connectPort();
  return port!;
}

/**
 * Get the current port (for components that need to add listeners after init)
 */
export function getPort(): chrome.runtime.Port | null {
  return port;
}

function connectPort(): void {
  if (!tabId) return;

  port = chrome.runtime.connect({ name: FLOW_PANEL_PORT_NAME });

  // Send init message with tabId
  port.postMessage({ type: "panel:init", payload: { tabId } });

  // Reattach all tracked listeners to the new port
  for (const listener of messageListeners) {
    port.onMessage.addListener(listener);
  }

  port.onDisconnect.addListener(() => {
    port = null;
    // Attempt to reconnect after a delay
    setTimeout(connectPort, 1000);
  });
}

/**
 * Send a message to the content script via background
 */
export function sendToContent(message: PanelToBackgroundMessage): void {
  if (!port) {
    console.warn("[contentBridge] Port not connected, message dropped:", message);
    return;
  }
  port.postMessage(message);
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
  port?.disconnect();
  port = null;
  tabId = null;
  messageListeners.clear();
}

/**
 * Request element inspection
 */
export function requestInspection(selector: string): void {
  sendToContent({ type: "panel:inspect", payload: { selector } });
}

/**
 * Apply a style mutation
 */
export function applyStyleMutation(
  selector: string,
  property: string,
  value: string
): void {
  sendToContent({
    type: "panel:mutate-style",
    payload: { selector, property, value },
  });
}

/**
 * Request text edit mode activation
 */
export function activateTextEdit(selector: string): void {
  sendToContent({
    type: "panel:text-edit",
    payload: { selector, action: "activate" },
  });
}

/**
 * Request feature activation
 */
export function activateFeature(featureId: string): void {
  sendToContent({
    type: "panel:feature",
    payload: { featureId, action: "activate" },
  });
}

/**
 * Request feature deactivation
 */
export function deactivateFeature(featureId: string): void {
  sendToContent({
    type: "panel:feature",
    payload: { featureId, action: "deactivate" },
  });
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
