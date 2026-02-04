/**
 * Content Bridge - chrome.runtime messaging to content script
 *
 * Replaces Tauri's invoke/events with browser extension message passing.
 */

import { FLOW_PANEL_PORT_NAME } from "@flow/shared";
import type { PanelToBackgroundMessage } from "@flow/shared";

let port: chrome.runtime.Port | null = null;
let tabId: number | null = null;

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
 * Note: Captures the current port at subscription time to avoid race conditions
 * where cleanup removes listeners from a different port after reconnection.
 */
export function onContentMessage(callback: (message: unknown) => void): () => void {
  const currentPort = port;
  if (!currentPort) {
    console.warn("[contentBridge] Port not connected");
    return () => {};
  }

  const listener = (msg: unknown) => callback(msg);
  currentPort.onMessage.addListener(listener);

  return () => {
    currentPort.onMessage.removeListener(listener);
  };
}

/**
 * Disconnect the content bridge
 */
export function disconnectContentBridge(): void {
  port?.disconnect();
  port = null;
  tabId = null;
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
