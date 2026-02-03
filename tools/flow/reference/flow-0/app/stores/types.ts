import type {
  ComponentInfo,
  ThemeTokens,
  ViolationInfo,
  ProjectInfo,
  ServerStatus,
} from "../bindings";
import type { ComponentMeta } from "../types/componentMeta";

// Server log event (emitted via Tauri events, not from commands)
export interface ServerLog {
  line: string;
  timestamp: number;
  isError: boolean;
}

// ============================================================================
// Viewport/Breakpoint Types (fn-7.22)
// ============================================================================

export interface Breakpoint {
  name: string;
  width: number;
}

export type PreviewViewMode = "grid" | "focused" | "variants";

/**
 * Canvas Rect - Bounding rectangle of the canvas iframe (fn-2-gnc.10)
 */
export interface CanvasRect {
  left: number;
  top: number;
  width: number;
  height: number;
  scale: number;
}

// ============================================================================
// Style Change Types (fn-7.21 Undo/Redo)
// ============================================================================

export interface StyleChange {
  id: string;
  timestamp: number;
  elementSelector: string;
  property: string;
  oldValue: string | null;
  newValue: string;
  componentName?: string;
}

// ============================================================================
// Bridge Types (from @rdna/bridge)
// ============================================================================

export type RadflowId = string;

export interface SourceLocation {
  filePath: string;
  relativePath: string;
  line: number;
  column: number;
}

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

export type BridgeConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

/** Comment data sent to bridge for rendering in iframe */
export interface BridgeComment {
  id: string;
  type: "comment" | "question";
  radflowId: string | null;
  selector: string;
  componentName: string;
  content: string;
  index: number;
}

export interface BridgeSelection {
  radflowId: RadflowId;
  source: SourceLocation | null;
  fallbackSelectors: string[];
}

// ============================================================================
// Project State
// ============================================================================

export interface RecentProject {
  name: string;
  path: string;
  lastOpened: string;
}

// ============================================================================
// Rectangle Selection
// ============================================================================

export interface SelectionRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// ============================================================================
// Text Edit Mode
// ============================================================================

export interface TextEdit {
  id: string;
  componentName: string;
  file: string;
  line: number;
  originalText: string;
  newText: string;
  timestamp: number;
}

// ============================================================================
// Property Panels
// ============================================================================

export type PanelType = "colors" | "typography" | "spacing" | "layout" | "feedback";

// ============================================================================
// Design Tokens
// ============================================================================

import type { StyleValue } from "../types/styleValue";
import type { SpatialViewportSlice } from "./slices/spatialViewportSlice";
import type { ComponentCanvasSlice } from "./slices/componentCanvasSlice";
import type { AssetsSlice } from "./slices/assetsSlice";
import type { WorkspaceSlice } from "./slices/workspaceSlice";

export type ResolvedTokenMap = Map<string, StyleValue>;

export interface TokensSlice {
  tokens: ThemeTokens | null;
  tokensLoading: boolean;
  tokensError: string | null;
  darkTokens: Partial<{ [key: string]: string }> | null;
  colorMode: "light" | "dark";
  resolvedTokens: ResolvedTokenMap;

  loadTokens: (cssPath: string) => Promise<void>;
  loadThemeTokens: (themePath: string) => Promise<void>;
  clearTokens: () => void;
  setColorMode: (mode: "light" | "dark") => void;
  resolveToken: (name: string) => StyleValue | null;
  invalidateResolvedTokens: () => void;
  getActiveTokens: () => ThemeTokens | null;
}

// ============================================================================
// UI State
// ============================================================================

export type EditorMode =
  | "cursor"
  | "component-id"
  | "text-edit"
  | "preview"
  | "clipboard"
  | "comment"
  | "smart-edit"
  | "select-prompt"
  | "designer"
  | "animation";

export type ModeBarPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

// ============================================================================
// File Watcher
// ============================================================================

export interface FileEvent {
  type: "Modified" | "Created" | "Removed";
  path: string;
}

export interface WatcherSlice {
  watcherActive: boolean;
  watchedPath: string | null;
  lastFileEvent: FileEvent | null;

  startWatcher: (path: string) => Promise<{ success: boolean; error?: string }>;
  stopWatcher: () => Promise<{ success: boolean; error?: string }>;
  handleFileEvent: (event: FileEvent) => void;
  setLastFileEvent: (event: FileEvent | null) => void;
}

// ============================================================================
// Project Detection + Dev Server
// ============================================================================

export interface ProjectSlice {
  project: ProjectInfo | null;
  projectLoading: boolean;
  projectError: string | null;
  serverStatus: ServerStatus;
  serverLogs: ServerLog[];
  maxServerLogs: number;

  detectProject: (path: string) => Promise<{ success: boolean; error?: string }>;
  clearProject: () => void;
  startDevServer: () => Promise<{ success: boolean; error?: string }>;
  stopDevServer: () => Promise<{ success: boolean; error?: string }>;
  refreshServerStatus: () => Promise<void>;
  checkServerHealth: (port: number) => Promise<boolean>;
  addServerLog: (log: ServerLog) => void;
  clearServerLogs: () => void;
  setServerStatus: (status: ServerStatus) => void;
}

// ============================================================================
// Target Project (external dev servers)
// ============================================================================

export interface TargetProject {
  name: string;
  url: string;
  port: number;
  status: "online" | "offline" | "checking";
}

export interface TargetProjectSlice {
  targetProjects: TargetProject[];
  activeTarget: TargetProject | null;
  isScanning: boolean;

  scanForProjects: () => Promise<void>;
  setActiveTarget: (target: TargetProject | null) => void;
  addTargetProject: (project: TargetProject) => void;
  removeTargetProject: (url: string) => void;
}

// ============================================================================
// Theme Discovery
// ============================================================================

export interface HealthResponse {
  ok: true;
  version: string;
  timestamp: number;
  theme?: {
    name: string;
    displayName: string;
    root: string;
  };
  app?: {
    name: string;
    displayName: string;
    path: string;
  };
  apps?: Array<{
    name: string;
    displayName: string;
    port: number;
  }>;
  project?: string;
}

export interface DiscoveredTheme {
  name: string;
  displayName: string;
  root: string;
  apps: DiscoveredApp[];
  isLegacy: boolean;
}

export interface DiscoveredApp {
  name: string;
  displayName: string;
  port: number;
  url: string;
  status: "online" | "offline" | "checking";
  bridgeVersion?: string;
}

export interface ThemeSlice {
  discoveredThemes: DiscoveredTheme[];
  activeTheme: DiscoveredTheme | null;
  activeApp: DiscoveredApp | null;
  isThemeScanning: boolean;
  lastScanAt: number | null;
  scanError: string | null;

  scanForThemes: () => Promise<void>;
  setActiveTheme: (theme: DiscoveredTheme | null) => void;
  setActiveApp: (app: DiscoveredApp | null) => void;
  checkAppHealth: (app: DiscoveredApp) => Promise<DiscoveredApp>;
  refreshActiveApp: () => Promise<void>;
  getAppByPort: (port: number) => DiscoveredApp | null;
}

// ============================================================================
// Feedback Mode (Comments + Questions)
// ============================================================================

export type FeedbackType = "comment" | "question";

export type DataSource = "bridge" | "fiber" | "dom" | "bridge+fiber";

export interface RichContext {
  provenance: DataSource;
  provenanceDetail?: string;
  radflowId?: string;
  props?: Record<string, unknown>;
  parentChain?: string[];
  fiberType?: "function" | "class" | "forward_ref" | "memo";
  fallbackSelectors?: string[];
}

export interface Feedback {
  id: string;
  type: FeedbackType;
  elementSelector: string;
  componentName: string;
  devflowId: string | null;
  source: SourceLocation | null;
  content: string;
  coordinates: { x: number; y: number };
  timestamp: number;
  richContext?: RichContext;
}

export type Comment = Feedback;

export interface CommentSlice {
  comments: Feedback[];
  activeFeedbackType: FeedbackType | null;
  hoveredCommentElement: string | null;
  selectedCommentElements: string[];

  setActiveFeedbackType: (type: FeedbackType | null) => void;
  addComment: (comment: Omit<Feedback, "id" | "timestamp">) => void;
  updateComment: (id: string, content: string) => void;
  removeComment: (id: string) => void;
  clearComments: () => void;
  clearCommentsForFile: (filePath: string) => void;
  setHoveredCommentElement: (selector: string | null) => void;
  setSelectedCommentElement: (selector: string | null) => void;
  toggleSelectedCommentElement: (selector: string) => void;
  clearSelectedCommentElements: () => void;
  compileToMarkdown: (type?: FeedbackType | "all") => string;
  copyCommentsToClipboard: (type?: FeedbackType | "all") => Promise<void>;
}

// ============================================================================
// Consolidated Slice Imports
// ============================================================================

import type { CanvasSlice } from "./slices/canvasSlice";
import type { UiStateSlice } from "./slices/uiStateSlice";
import type { ComponentsSlice } from "./slices/componentsSlice";
import type { BridgeSlice } from "./slices/bridgeSlice";
import type { EditingSlice } from "./slices/editingSlice";
import type { OutputSlice } from "../types/output";

// ============================================================================
// Combined Store Type (13 slices, consolidated from 20)
// ============================================================================

export interface AppState
  extends CanvasSlice,
    UiStateSlice,
    TokensSlice,
    ComponentsSlice,
    WatcherSlice,
    BridgeSlice,
    ProjectSlice,
    EditingSlice,
    CommentSlice,
    SpatialViewportSlice,
    ComponentCanvasSlice,
    AssetsSlice,
    WorkspaceSlice {}

// Re-export consolidated slice types
export type {
  CanvasSlice,
  UiStateSlice,
  ComponentsSlice,
  BridgeSlice,
  EditingSlice,
  OutputSlice,
};

// Re-export StyleEdit from editingSlice for backward compatibility
export type { StyleEdit } from "./slices/editingSlice";
