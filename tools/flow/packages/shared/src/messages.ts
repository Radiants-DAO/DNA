import { FLOW_MESSAGE_SOURCE } from './constants';

// ─── Direction: Agent → Content (via window.postMessage) ───

export interface AgentPongMessage {
  type: 'agent:pong';
  source: typeof FLOW_MESSAGE_SOURCE;
  payload: {
    timestamp: number;
    globals: string[]; // list of detected globals (e.g. ['React', 'gsap'])
  };
}

// ─── Direction: Content → Agent (via window.postMessage) ───

export interface ContentPingMessage {
  type: 'content:ping';
  source: typeof FLOW_MESSAGE_SOURCE;
  payload: {
    timestamp: number;
  };
}

// ─── Direction: Content → Service Worker (via chrome.runtime port) ───

export interface ElementHoveredMessage {
  type: 'element:hovered';
  payload: {
    tagName: string;
    id: string;
    classList: string[];
    rect: { top: number; left: number; width: number; height: number };
    textPreview: string; // first 80 chars of textContent
  };
}

export interface ElementUnhoveredMessage {
  type: 'element:unhovered';
  payload: null;
}

export interface AgentReadyMessage {
  type: 'agent:ready';
  payload: {
    globals: string[];
  };
}

// ─── Direction: Panel → Service Worker ───

export interface PanelInitMessage {
  type: 'panel:init';
  payload: {
    tabId: number;
  };
}

// ─── Union types ───

/** Messages sent via window.postMessage (agent ↔ content) */
export type WindowMessage = ContentPingMessage | AgentPongMessage;

/** Messages sent via chrome.runtime port (content → service worker) */
export type ContentToBackgroundMessage =
  | ElementHoveredMessage
  | ElementUnhoveredMessage
  | AgentReadyMessage;

/** Messages sent via chrome.runtime port (service worker → panel) */
export type BackgroundToPanelMessage =
  | ElementHoveredMessage
  | ElementUnhoveredMessage
  | AgentReadyMessage;

/** Messages sent via chrome.runtime port (panel → service worker) */
export type PanelToBackgroundMessage = PanelInitMessage;

/** Type guard for Flow window messages */
export function isFlowWindowMessage(event: MessageEvent): event is MessageEvent<WindowMessage> {
  return (
    event.data &&
    typeof event.data === 'object' &&
    'source' in event.data &&
    event.data.source === FLOW_MESSAGE_SOURCE
  );
}
