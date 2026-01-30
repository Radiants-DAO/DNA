/**
 * RadFlow Bridge Types
 *
 * Core type definitions for the bridge package.
 * These types are used both internally and exported for consumers.
 */

/** Unique identifier for RadFlow-tracked elements */
export type RadflowId = string;

/** Source location for a component in the target project */
export interface SourceLocation {
  filePath: string;      // Absolute: /Users/.../src/components/Button.tsx
  relativePath: string;  // Relative: src/components/Button.tsx
  line: number;          // 1-indexed
  column: number;        // 1-indexed
}

/** Internal component entry with live DOM reference */
export interface ComponentEntry {
  // Identity
  radflowId: RadflowId;
  name: string;                    // "Button", "Card", "anonymous"
  displayName: string | null;      // From Component.displayName

  // DOM binding
  element: HTMLElement;            // Live reference (NOT serialized)
  selector: string;                // CSS selector: [data-radflow-id="rf_a1b2c3"]
  fallbackSelectors: string[];     // ['button[aria-label="Submit"]', '.btn-primary']

  // Source location (for file writes)
  source: SourceLocation | null;   // null for node_modules components

  // React internals (readonly, for inspection)
  fiber: {
    type: string;                  // 'function' | 'class' | 'forward_ref' | 'memo'
    props: Record<string, unknown>;
    key: string | null;
  };

  // Hierarchy
  parentId: RadflowId | null;
  childIds: RadflowId[];
}

/** Serialized entry sent over postMessage (no live DOM refs) */
export interface SerializedComponentEntry {
  radflowId: RadflowId;
  name: string;
  displayName: string | null;
  selector: string;
  fallbackSelectors: string[];
  source: SourceLocation | null;
  fiberType: string;
  props: Record<string, unknown>;
  parentId: RadflowId | null;
  childIds: RadflowId[];
}

/** Comment/question to render as badge overlay in the iframe */
export interface BridgeComment {
  id: string;
  type: "comment" | "question";
  radflowId: RadflowId | null;
  selector: string;
  componentName: string;
  content: string;
  index: number;
}

/** Bridge interface exposed on window.__RADFLOW__ */
export interface RadflowBridge {
  version: string;
  componentMap: Map<RadflowId, ComponentEntry>;
  getEntry(id: RadflowId): ComponentEntry | undefined;
  getEntryByElement(el: HTMLElement): ComponentEntry | undefined;
}

// ============================================
// postMessage Protocol Types
// ============================================

/** Messages sent from Host (Tauri) to Bridge (iframe) */
export type HostMessage =
  | { type: 'PING' }
  | { type: 'GET_COMPONENT_MAP' }
  | { type: 'HIGHLIGHT'; radflowId: RadflowId }
  | { type: 'CLEAR_HIGHLIGHT' }
  | { type: 'INJECT_STYLE'; css: string }
  | { type: 'CLEAR_STYLES' }
  | { type: 'ADD_COMMENT'; comment: BridgeComment }
  | { type: 'REMOVE_COMMENT'; commentId: string }
  | { type: 'CLEAR_COMMENTS' };

/** Messages sent from Bridge (iframe) to Host (Tauri) */
export type BridgeMessage =
  | { type: 'PONG'; version: string }
  | { type: 'COMPONENT_MAP'; entries: SerializedComponentEntry[] }
  | { type: 'SELECTION'; radflowId: RadflowId; source: SourceLocation | null; fallbackSelectors: string[] }
  | { type: 'HOVER'; radflowId: RadflowId | null }
  | { type: 'ERROR'; message: string };

// ============================================
// Health Endpoint Types
// ============================================

/**
 * RadFlow manifest schema (radflow.config.json)
 *
 * Defines theme structure for multi-app projects.
 * Located at theme root (e.g., packages/radiants/radflow.config.json)
 */
export interface RadflowConfig {
  version: '1';
  theme: {
    name: string;        // kebab-case identifier
    displayName: string; // human-readable
  };
  apps: RadflowAppConfig[];
}

export interface RadflowAppConfig {
  name: string;        // kebab-case identifier
  displayName: string; // human-readable
  path: string;        // relative path from theme root
  port: number;        // default dev server port
}

/**
 * Response from /api/radflow/health endpoint
 *
 * Supports two modes:
 * - Theme mode (radflow.config.json found): Returns theme, app, apps fields
 * - Legacy mode (no manifest): Returns only project field
 */
export interface HealthResponse {
  ok: true;
  version: string;
  timestamp: number;

  // Theme mode fields (present when radflow.config.json found)
  theme?: {
    name: string;
    displayName: string;
    root: string;        // absolute path to theme root
  };
  app?: {
    name: string;
    displayName: string;
    path: string;        // relative path from theme root
  };
  apps?: Array<{
    name: string;
    displayName: string;
    port: number;
  }>;

  // Legacy mode field (present when no manifest, derived from package.json)
  project?: string;
}

// ============================================
// Augment global Window interface
// ============================================

declare global {
  interface Window {
    __RADFLOW__?: RadflowBridge;
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactDevToolsHook;
  }
}

/** Minimal typing for React DevTools global hook */
export interface ReactDevToolsHook {
  rendererInterfaces?: Map<number, RendererInterface>;
  inject?: (renderer: unknown) => number;
  onCommitFiberRoot?: (
    rendererID: number,
    root: FiberRoot,
    priorityLevel?: number
  ) => void;
  supportsFiber?: boolean;
}

export interface RendererInterface {
  getSourceForFiber?: (fiber: Fiber) => { fileName: string; lineNumber: number; columnNumber?: number } | null;
  findFiberByHostInstance?: (instance: Element) => Fiber | null;
}

/** Minimal Fiber type for what we need */
export interface Fiber {
  type: unknown;
  key: string | null;
  stateNode: Element | null;
  return: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  memoizedProps: Record<string, unknown>;
  _debugSource?: { fileName: string; lineNumber: number; columnNumber?: number };
  _debugOwner?: Fiber;
}

export interface FiberRoot {
  current: Fiber;
}
