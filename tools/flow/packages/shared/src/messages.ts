import { FLOW_MESSAGE_SOURCE } from './constants';
import type {
  FiberData,
  CustomProperty,
  InspectionResult,
  ReactGrabSource,
} from './types/inspection';

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

export interface ElementSelectedMessage {
  type: 'element:selected';
  payload: {
    elementIndex: number;
    selector: string;
    tagName: string;
    id: string;
    classList: string[];
    rect: { top: number; left: number; width: number; height: number };
    textPreview: string;
  };
}

// ─── Direction: Panel → Service Worker ───

export interface PanelInitMessage {
  type: 'panel:init';
  payload: {
    tabId: number;
  };
}

// ─── Inspection Pipeline Messages ───

/** Agent → Content: fiber and custom property extraction results */
export interface AgentFiberResult {
  type: 'flow:agent:fiber-result';
  source: typeof FLOW_MESSAGE_SOURCE;
  fiber: FiberData | null;
  customProperties: CustomProperty[];
  /** Optional React Grab source info (if installed in the app) */
  reactGrab?: ReactGrabSource | null;
}

/** Content → Agent: request fiber data for an element */
export interface ContentRequestFiber {
  type: 'flow:content:request-fiber';
  source: typeof FLOW_MESSAGE_SOURCE;
  /** Unique numeric ID assigned to the element by content script */
  elementIndex: number;
}

/** Content → Service Worker: full inspection result */
export interface ContentInspectionResult {
  type: 'flow:content:inspection-result';
  tabId: number;
  result: InspectionResult;
}

/** Panel → Content: request inspection of a target element */
export interface PanelRequestInspection {
  type: 'flow:panel:request-inspection';
  /** CSS selector or element index */
  target: string | number;
}

// ─── Union types ───

/** Messages sent via window.postMessage (agent ↔ content) */
export type WindowMessage =
  | ContentPingMessage
  | AgentPongMessage
  | AgentFiberResult
  | ContentRequestFiber;

/** Messages sent via chrome.runtime port (content → service worker) */
export type ContentToBackgroundMessage =
  | ElementHoveredMessage
  | ElementUnhoveredMessage
  | ElementSelectedMessage
  | AgentReadyMessage;

/** Messages sent via chrome.runtime port (service worker → panel) */
export type BackgroundToPanelMessage =
  | ElementHoveredMessage
  | ElementUnhoveredMessage
  | ElementSelectedMessage
  | AgentReadyMessage
  | ContentInspectionResult;

/** Messages sent via chrome.runtime port (panel → service worker) */
export type PanelToBackgroundMessage = PanelInitMessage | PanelRequestInspection;

/** Type guard for Flow window messages */
export function isFlowWindowMessage(event: MessageEvent): event is MessageEvent<WindowMessage> {
  return (
    event.data &&
    typeof event.data === 'object' &&
    'source' in event.data &&
    event.data.source === FLOW_MESSAGE_SOURCE
  );
}
