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
