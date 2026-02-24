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
    /** Mutation engine ref for the currently selected element */
    elementRef: string;
    elementIndex: number;
    selector: string;
    tagName: string;
    id: string;
    classList: string[];
    rect: { top: number; left: number; width: number; height: number };
    textPreview: string;
    /** Optional click coordinates (viewport) used for DOM-anchored comment badges/composers. */
    clickPoint?: { x: number; y: number };
  };
}

// ─── Direction: Panel → Service Worker ───

export interface PanelInitMessage {
  type: 'panel:init';
  payload: {
    tabId: number;
  };
}

export interface PanelInspectMessage {
  type: 'panel:inspect';
  payload: {
    selector: string;
  };
}

export interface PanelFeatureMessage {
  type: 'panel:feature';
  payload: {
    featureId: string;
    action: 'activate' | 'deactivate';
  };
}

export interface PanelPingMessage {
  type: 'panel:ping';
}

export interface PanelSetFeedbackTypeMessage {
  type: 'panel:set-feedback-type';
  payload: { type: 'comment' | 'question' | null };
}

export interface PanelHighlightMessage {
  type: 'panel:highlight';
  payload: {
    radflowId: string;
  };
}

export interface PanelClearHighlightMessage {
  type: 'panel:clear-highlight';
}

export interface PanelClearPersistentSelectionsMessage {
  type: 'panel:clear-persistent-selections';
}

export interface PanelInjectStyleMessage {
  type: 'panel:inject-style';
  payload: {
    css: string;
  };
}

export interface PanelClearStylesMessage {
  type: 'panel:clear-styles';
}

export interface PanelCommentMessage {
  type: 'panel:comment';
  payload: {
    id: string;
    type: 'comment' | 'question';
    selector: string;
    componentName: string;
    content: string;
    /** Optional viewport coordinates to anchor badge placement near click point. */
    coordinates?: { x: number; y: number };
  };
}

export interface PanelCommentComposeMessage {
  type: 'panel:comment-compose';
  payload: {
    type: 'comment' | 'question';
    selector: string;
    componentName: string;
    x: number;
    y: number;
    /** Additional selectors from multi-selection (excludes primary). */
    linkedSelectors?: string[];
  };
}

export interface PanelCommentUpdateMessage {
  type: 'panel:comment-update';
  payload: {
    id: string;
    content: string;
  };
}

export interface PanelCommentRemoveMessage {
  type: 'panel:comment-remove';
  payload: {
    id: string;
  };
}

export interface PanelCommentClearMessage {
  type: 'panel:comment-clear';
  payload: Record<string, never>;
}

export interface PanelAccessibilityMessage {
  type: 'panel:accessibility';
  payload: {
    selector: string;
  };
}

export interface PanelSearchMessage {
  type: 'panel:search';
  payload: {
    query: string;
    mode: string;
  };
}

export interface PanelScanImagesMessage {
  type: 'panel:scan-images';
  payload: Record<string, never>;
}

export interface PanelSwapImageMessage {
  type: 'panel:swap-image';
  payload: {
    selector: string;
    newSrc: string;
  };
}

export interface PanelSetModeMessage {
  type: 'panel:set-mode';
  payload: { mode: string };
}

export interface PanelSetSubModeMessage {
  type: 'panel:set-sub-mode';
  payload: { subMode: string };
}

export interface PanelSetThemeMessage {
  type: 'panel:set-theme';
  payload: { theme: 'dark' | 'light' };
}

export interface PanelFlowToggleMessage {
  type: 'panel:flow-toggle';
  payload: { enabled: boolean };
}

export interface PanelAgentFeedbackMessage {
  type: 'panel:agent-feedback';
  payload: import('./types/agentFeedback').AgentFeedback;
}

export interface PanelAgentResolveMessage {
  type: 'panel:agent-resolve';
  payload: {
    tabId: number;
    targetId: string;
    summary: string;
  };
}

// ─── Inspection Pipeline Messages ───

/** Agent → Content: fiber and custom property extraction results */
export interface AgentFiberResult {
  type: 'flow:agent:fiber-result';
  source: typeof FLOW_MESSAGE_SOURCE;
  /** Element index corresponding to the request */
  elementIndex: number;
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

/** Content → Service Worker: multi-selection state update */
export interface SelectionMultiStateMessage {
  type: 'selection:multi-state';
  payload: {
    selectors: string[];
  };
}

/** Content → Service Worker: full inspection result */
export interface ContentInspectionResult {
  type: 'flow:content:inspection-result';
  tabId: number;
  result: InspectionResult;
  /** Mutation engine ref for the inspected element (used when inspecting via panel:inspect) */
  elementRef?: string;
}

/** Panel → Content: request inspection of a target element */
export interface PanelRequestInspection {
  type: 'flow:panel:request-inspection';
  /** CSS selector or element index */
  target: string | number;
}

// ─── Direction: Content → Service Worker (background pipeline) ───

export interface FlowActivityMessage {
  type: 'flow:activity';
  payload: { timestamp: number };
}

// ─── Direction: Panel → Service Worker (background pipeline) ───

export interface PanelSessionDataMessage {
  type: 'panel:session-data';
  payload: {
    textEdits: unknown[];
    mutationDiffs: unknown[];
    animationDiffs: unknown[];
    promptDraft: unknown[];
    promptSteps: unknown[];
    comments: unknown[];
  };
}

export interface PanelHumanThreadReplyMessage {
  type: 'panel:human-thread-reply';
  payload: {
    tabId: number;
    feedbackId: string;
    content: string;
  };
}

// ─── Direction: Service Worker → Panel (background pipeline) ───

export interface BgAgentFeedbackMessage {
  type: 'bg:agent-feedback';
  payload: import('./types/agentFeedback').AgentFeedback;
}

export interface BgAgentResolveMessage {
  type: 'bg:agent-resolve';
  payload: {
    tabId: number;
    targetId: string;
    summary: string;
  };
}

export interface BgAgentThreadReplyMessage {
  type: 'bg:agent-thread-reply';
  payload: {
    tabId: number;
    targetId: string;
    message: import('./types/agentFeedback').ThreadMessage;
  };
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
  | SelectionMultiStateMessage
  | AgentReadyMessage
  | ContentInspectionResult
  | FlowActivityMessage;

/** Messages sent via chrome.runtime port (service worker → panel) */
export type BackgroundToPanelMessage =
  | ElementHoveredMessage
  | ElementUnhoveredMessage
  | ElementSelectedMessage
  | SelectionMultiStateMessage
  | AgentReadyMessage
  | ContentInspectionResult
  | BgAgentFeedbackMessage
  | BgAgentResolveMessage
  | BgAgentThreadReplyMessage;

/** Messages sent via chrome.runtime port (panel → service worker) */
export type PanelToBackgroundMessage =
  | PanelInitMessage
  | PanelRequestInspection
  | PanelInspectMessage
  | PanelFeatureMessage
  | PanelPingMessage
  | PanelSetFeedbackTypeMessage
  | PanelHighlightMessage
  | PanelClearHighlightMessage
  | PanelClearPersistentSelectionsMessage
  | PanelInjectStyleMessage
  | PanelClearStylesMessage
  | PanelCommentMessage
  | PanelCommentComposeMessage
  | PanelCommentUpdateMessage
  | PanelCommentRemoveMessage
  | PanelCommentClearMessage
  | PanelAccessibilityMessage
  | PanelSearchMessage
  | PanelScanImagesMessage
  | PanelSwapImageMessage
  | PanelSetModeMessage
  | PanelSetSubModeMessage
  | PanelSetThemeMessage
  | PanelFlowToggleMessage
  | PanelAgentFeedbackMessage
  | PanelAgentResolveMessage
  | PanelSessionDataMessage
  | PanelHumanThreadReplyMessage;

/** Type guard for Flow window messages */
export function isFlowWindowMessage(event: MessageEvent): event is MessageEvent<WindowMessage> {
  return (
    event.data &&
    typeof event.data === 'object' &&
    'source' in event.data &&
    event.data.source === FLOW_MESSAGE_SOURCE
  );
}

// ─── Contextual Panel Messages ───

/** Search result item */
export interface SearchResultItem {
  index: number;
  selector: string;
  tagName: string;
  id: string;
  classList: string[];
  textPreview: string;
  attributes: Record<string, string>;
}

/** Content → Panel: search results */
export interface SearchResponse {
  type: 'search:results';
  payload: {
    query: string;
    results: SearchResultItem[];
    count: number;
  };
}

/** Accessibility info */
export interface AccessibilityInfo {
  role: string | null;
  ariaLabel: string | null;
  ariaDescribedBy: string | null;
  ariaLabelledBy: string | null;
  ariaHidden: boolean;
  tabIndex: number | null;
  isInteractive: boolean;
  hasFocusIndicator: boolean;
}

/** Contrast info */
export interface ContrastInfo {
  foreground: string;
  background: string;
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  largeText: boolean;
}

/** Accessibility violation */
export interface AccessibilityViolation {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string | null;
}

/** Content → Panel: accessibility results */
export interface AccessibilityResponse {
  type: 'accessibility:result';
  payload: {
    info: AccessibilityInfo;
    contrast: ContrastInfo | null;
    violations: AccessibilityViolation[];
  };
}

/** Page image info */
export interface PageImage {
  index: number;
  selector: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
}

/** Content → Panel: images list */
export interface ImagesResponse {
  type: 'images:list';
  payload: {
    images: PageImage[];
  };
}

/** Content → Panel: image swap result */
export interface ImageSwapResponse {
  type: 'imageswap:result';
  payload: {
    success: boolean;
    imageIndex: number;
    oldSrc: string;
    newSrc: string;
  };
}

// ─── Scanner Result Types (used by inspectedWindow.eval scanners) ───

export interface ScannedToken {
  name: string;
  value: string;
  resolvedValue: string;
  darkValue?: string;
  category: 'color' | 'spacing' | 'radius' | 'shadow' | 'font' | 'motion' | 'size' | 'other';
  tier: 'brand' | 'semantic' | 'unknown';
}

export interface TokenScanResult {
  tokens: ScannedToken[];
  framework?: string;
  colorScheme: 'light' | 'dark' | 'both';
}

export interface ScannedComponent {
  name: string;
  framework: 'react' | 'vue' | 'svelte' | 'angular' | 'web-component' | 'html';
  instances: number;
  selector: string;
  source?: { fileName: string; lineNumber: number; columnNumber: number };
}

export interface ComponentScanResult {
  components: ScannedComponent[];
  framework?: string;
}

// ─── Asset Scan Types ───

export interface ScannedImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
  tagName: string;
  /** True for CSS background images */
  isBackground?: boolean;
}

export interface ScannedFont {
  family: string;
  /** e.g. 'google-fonts', 'typekit', 'local', 'self-hosted' */
  source: string;
  weights: string[];
  styles: string[];
  url?: string;
}

export interface ScannedStylesheet {
  url: string;
  /** 'link' for <link> tags, 'inline' for <style> tags */
  type: 'link' | 'inline';
  /** Size in bytes (0 for inline) */
  size: number;
}

export interface ScannedScript {
  url: string;
  /** 'external' for <script src>, 'inline' for inline */
  type: 'external' | 'inline';
  async: boolean;
  defer: boolean;
}

export interface AssetScanResult {
  images: ScannedImage[];
  fonts: ScannedFont[];
  stylesheets: ScannedStylesheet[];
  scripts: ScannedScript[];
}

// ─── Accessibility Audit Types ───

export interface AuditViolation {
  nodeName: string;
  severity: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  suggestion: string;
}

export interface AXNodeSummary {
  role: string;
  name: string;
  nodeId: string;
  children: string[];
  ignored: boolean;
}

export interface HeadingEntry {
  level: number;
  text: string;
}

export interface LandmarkEntry {
  role: string;
  name: string;
}

export interface ContrastIssue {
  selector: string;
  text: string;
  foreground: string;
  background: string;
  ratio: number;
  largeText: boolean;
  passesAA: boolean;
  passesAAA: boolean;
}

export interface AccessibilityAudit {
  violations: AuditViolation[];
  summary: { errors: number; warnings: number; passed: number };
  headingHierarchy: HeadingEntry[];
  landmarks: LandmarkEntry[];
  ariaTree: AXNodeSummary[];
  ariaTreeTruncated?: boolean;
}

// ─── CSS Cascade Types ───

export interface CascadeEntry {
  property: string;
  value: string;
  selector: string;
  /** Stylesheet URL or "inline" or "user-agent" */
  source: string;
  isInherited: boolean;
  isOverridden: boolean;
}

export interface CascadeResult {
  inlineStyles: CascadeEntry[];
  matchedRules: CascadeEntry[];
  inheritedRules: CascadeEntry[];
}

// ─── Type Guards for Contextual Panel Messages ───

/** Type guard for SearchResponse */
export function isSearchResponse(msg: unknown): msg is SearchResponse {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    (msg as { type: unknown }).type === 'search:results' &&
    'payload' in msg
  );
}

/** Type guard for AccessibilityResponse */
export function isAccessibilityResponse(msg: unknown): msg is AccessibilityResponse {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    (msg as { type: unknown }).type === 'accessibility:result' &&
    'payload' in msg
  );
}

/** Type guard for ImagesResponse */
export function isImagesResponse(msg: unknown): msg is ImagesResponse {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    (msg as { type: unknown }).type === 'images:list' &&
    'payload' in msg
  );
}

/** Type guard for ImageSwapResponse */
export function isImageSwapResponse(msg: unknown): msg is ImageSwapResponse {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    (msg as { type: unknown }).type === 'imageswap:result' &&
    'payload' in msg
  );
}

