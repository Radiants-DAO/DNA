/**
 * RadFlow Message Bridge
 *
 * Handles postMessage communication between the RadFlow host (Tauri)
 * and the bridge running in the target project's iframe.
 *
 * Implementation: fn-5.3
 */

import type { HostMessage, BridgeMessage, RadflowId } from './types.js';
import { serializeMap, getEntry } from './component-map.js';
import { findElementById, getIdFromElement, RADFLOW_ID_ATTR } from './dom-annotator.js';

/** Bridge version */
const BRIDGE_VERSION = '0.1.0';

/** Origin of the RadFlow host (set during handshake) */
let hostOrigin: string | null = null;

/** Currently highlighted element */
let highlightedElement: HTMLElement | null = null;

/** Highlight overlay element */
let highlightOverlay: HTMLElement | null = null;

/** CSS for highlight overlay */
const HIGHLIGHT_STYLES = `
  position: fixed;
  pointer-events: none;
  z-index: 999999;
  background: rgba(59, 130, 246, 0.15);
  border: 2px solid rgba(59, 130, 246, 0.8);
  border-radius: 4px;
  transition: all 0.15s ease-out;
`;

/**
 * Initialize the message bridge.
 * Listens for messages from the RadFlow host and sets up DOM event listeners.
 */
export function initMessageBridge(): void {
  if (typeof window === 'undefined') return;

  // Listen for postMessage from host
  window.addEventListener('message', handleMessage);

  // Set up click handler for selection
  document.addEventListener('click', handleClick, true);

  // Set up hover handlers for preview
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('mouseout', handleMouseOut, true);

  // Create highlight overlay element
  highlightOverlay = document.createElement('div');
  highlightOverlay.id = '__radflow-highlight-overlay';
  highlightOverlay.style.cssText = HIGHLIGHT_STYLES + 'display: none;';
  document.body.appendChild(highlightOverlay);

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
      sendToHost({ type: 'PONG', version: BRIDGE_VERSION });
      break;

    case 'GET_COMPONENT_MAP':
      sendToHost({
        type: 'COMPONENT_MAP',
        entries: serializeMap(),
      });
      break;

    case 'HIGHLIGHT':
      highlightElement(message.radflowId);
      break;

    case 'CLEAR_HIGHLIGHT':
      clearHighlight();
      break;

    case 'INJECT_STYLE':
      injectStyle(message.css);
      break;

    case 'CLEAR_STYLES':
      clearInjectedStyles();
      break;

    default:
      console.warn('[RadFlow] Unknown message type:', (message as { type: string }).type);
  }
}

/**
 * Highlight an element by its RadflowId.
 */
function highlightElement(radflowId: RadflowId): void {
  const element = findElementById(radflowId);
  if (!element || !highlightOverlay) return;

  highlightedElement = element;

  // Position the overlay
  const rect = element.getBoundingClientRect();
  highlightOverlay.style.display = 'block';
  highlightOverlay.style.top = `${rect.top}px`;
  highlightOverlay.style.left = `${rect.left}px`;
  highlightOverlay.style.width = `${rect.width}px`;
  highlightOverlay.style.height = `${rect.height}px`;
}

/**
 * Clear the current highlight.
 */
function clearHighlight(): void {
  highlightedElement = null;
  if (highlightOverlay) {
    highlightOverlay.style.display = 'none';
  }
}

/**
 * Handle click events for component selection.
 */
function handleClick(event: MouseEvent): void {
  if (!hostOrigin) return;

  // Find the closest annotated element
  const target = event.target as HTMLElement;
  const annotatedElement = findAnnotatedAncestor(target);
  if (!annotatedElement) return;

  const radflowId = getIdFromElement(annotatedElement);
  if (!radflowId) return;

  // Get the entry for source location
  const entry = getEntry(radflowId);

  // Prevent default behavior and stop propagation
  event.preventDefault();
  event.stopPropagation();

  // Send selection to host
  sendToHost({
    type: 'SELECTION',
    radflowId,
    source: entry?.source ?? null,
    fallbackSelectors: entry?.fallbackSelectors ?? [],
  });
}

/**
 * Handle mouseover events for hover preview.
 */
function handleMouseOver(event: MouseEvent): void {
  if (!hostOrigin) return;

  const target = event.target as HTMLElement;
  const annotatedElement = findAnnotatedAncestor(target);
  if (!annotatedElement) return;

  const radflowId = getIdFromElement(annotatedElement);
  if (radflowId) {
    sendToHost({ type: 'HOVER', radflowId });
  }
}

/**
 * Handle mouseout events for hover preview.
 */
function handleMouseOut(event: MouseEvent): void {
  if (!hostOrigin) return;

  const target = event.target as HTMLElement;
  const relatedTarget = event.relatedTarget as HTMLElement | null;

  // Only send null hover if we're leaving all annotated elements
  if (relatedTarget) {
    const annotatedElement = findAnnotatedAncestor(relatedTarget);
    if (annotatedElement) return; // Still hovering an annotated element
  }

  sendToHost({ type: 'HOVER', radflowId: null });
}

/**
 * Find the closest ancestor (or self) with a data-radflow-id attribute.
 */
function findAnnotatedAncestor(element: HTMLElement | null): HTMLElement | null {
  while (element) {
    if (element.hasAttribute(RADFLOW_ID_ATTR)) {
      return element;
    }
    element = element.parentElement;
  }
  return null;
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
 * Disconnect from the host and clean up.
 */
export function disconnect(): void {
  hostOrigin = null;
  clearHighlight();
}

/**
 * Update highlight position (call on scroll/resize).
 */
export function updateHighlightPosition(): void {
  if (!highlightedElement || !highlightOverlay) return;

  const rect = highlightedElement.getBoundingClientRect();
  highlightOverlay.style.top = `${rect.top}px`;
  highlightOverlay.style.left = `${rect.left}px`;
  highlightOverlay.style.width = `${rect.width}px`;
  highlightOverlay.style.height = `${rect.height}px`;
}

/**
 * Send an error message to the host.
 */
export function sendError(message: string): void {
  sendToHost({ type: 'ERROR', message });
}

// ============================================
// Style Injection (fn-5.5)
// ============================================

/** ID for the injected style element */
const INJECTED_STYLE_ID = '__radflow-injected-styles';

/** Reference to the injected style element */
let injectedStyleElement: HTMLStyleElement | null = null;

/**
 * Inject CSS into the target document.
 * Replaces any previously injected styles (does not append).
 *
 * Styles should be scoped via [data-radflow-id] selectors.
 * Example: [data-radflow-id="rf_a1b2c3"] { color: red; }
 */
export function injectStyle(css: string): void {
  if (typeof document === 'undefined') return;

  // Remove existing style element if present
  if (injectedStyleElement) {
    injectedStyleElement.textContent = css;
    console.log('[RadFlow] Updated injected styles');
    return;
  }

  // Create new style element
  injectedStyleElement = document.createElement('style');
  injectedStyleElement.id = INJECTED_STYLE_ID;
  injectedStyleElement.textContent = css;

  // Inject into document head
  document.head.appendChild(injectedStyleElement);
  console.log('[RadFlow] Injected styles');
}

/**
 * Clear all injected styles.
 */
export function clearInjectedStyles(): void {
  if (injectedStyleElement) {
    injectedStyleElement.remove();
    injectedStyleElement = null;
    console.log('[RadFlow] Cleared injected styles');
    return;
  }

  // Fallback: try to find by ID in case of stale reference
  const existing = document.getElementById(INJECTED_STYLE_ID);
  if (existing) {
    existing.remove();
    console.log('[RadFlow] Cleared injected styles (fallback)');
  }
}

/**
 * Get the currently injected CSS.
 */
export function getInjectedStyles(): string | null {
  return injectedStyleElement?.textContent ?? null;
}
