/**
 * Message source identifier used for window.postMessage origin filtering.
 * Both the agent script and content script check this to ignore unrelated messages.
 */
export const FLOW_MESSAGE_SOURCE = '__flow__' as const;

/**
 * Port name for chrome.runtime.connect between content script and service worker.
 */
export const FLOW_PORT_NAME = 'flow-content' as const;

/**
 * Port name for chrome.runtime.connect between DevTools panel and service worker.
 */
export const FLOW_PANEL_PORT_NAME = 'flow-panel' as const;

/**
 * Port name for mutation observer panel (Phase 4).
 */
export const FLOW_MUTATION_PORT_NAME = 'flow-mutation' as const;

/**
 * Port name for text edit panel (Phase 4).
 */
export const FLOW_TEXT_EDIT_PORT_NAME = 'flow-text-edit' as const;

/**
 * All panel port names for extensible router registration.
 */
export const FLOW_PANEL_PORTS = [
  FLOW_PANEL_PORT_NAME,
  FLOW_MUTATION_PORT_NAME,
  FLOW_TEXT_EDIT_PORT_NAME,
] as const;
