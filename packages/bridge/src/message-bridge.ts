/**
 * RadFlow Message Bridge
 *
 * Handles postMessage communication between the RadFlow host (Tauri)
 * and the bridge running in the target project's iframe.
 *
 * Implementation: fn-5.3
 */

import type { HostMessage, BridgeMessage } from './types';
import { serializeMap } from './component-map';

/** Origin of the RadFlow host (set during handshake) */
let hostOrigin: string | null = null;

/**
 * Initialize the message bridge.
 * Listens for messages from the RadFlow host.
 */
export function initMessageBridge(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('message', handleMessage);
  console.log('[RadFlow] Message bridge listening');
}

/**
 * Handle incoming messages from the host.
 */
function handleMessage(event: MessageEvent): void {
  // Validate origin (set on first PING)
  if (hostOrigin && event.origin !== hostOrigin) {
    return;
  }

  const message = event.data as HostMessage;
  if (!message || typeof message.type !== 'string') {
    return;
  }

  switch (message.type) {
    case 'PING':
      // Remember the host origin
      hostOrigin = event.origin;
      sendToHost({ type: 'PONG', version: '0.1.0' });
      break;

    case 'GET_COMPONENT_MAP':
      sendToHost({
        type: 'COMPONENT_MAP',
        entries: serializeMap(),
      });
      break;

    case 'HIGHLIGHT':
      // Implementation in fn-5.3
      console.log('[RadFlow] Highlight:', message.radflowId);
      break;

    case 'CLEAR_HIGHLIGHT':
      // Implementation in fn-5.3
      console.log('[RadFlow] Clear highlight');
      break;

    case 'INJECT_STYLE':
      // Implementation in fn-5.5
      console.log('[RadFlow] Inject style:', message.css.slice(0, 50) + '...');
      break;

    case 'CLEAR_STYLES':
      // Implementation in fn-5.5
      console.log('[RadFlow] Clear styles');
      break;

    default:
      console.warn('[RadFlow] Unknown message type:', (message as { type: string }).type);
  }
}

/**
 * Send a message to the RadFlow host.
 */
export function sendToHost(message: BridgeMessage): void {
  if (!hostOrigin) {
    console.warn('[RadFlow] Cannot send message - no host connection');
    return;
  }

  window.parent.postMessage(message, hostOrigin);
}

/**
 * Check if the bridge is connected to a host.
 */
export function isConnected(): boolean {
  return hostOrigin !== null;
}

/**
 * Disconnect from the host.
 */
export function disconnect(): void {
  hostOrigin = null;
}
