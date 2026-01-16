import type {
  ComponentInfo,
  ThemeTokens,
  ViolationInfo,
  ProjectInfo,
  ServerStatus,
} from "../bindings";

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

// ============================================================================
// Style Change Types (fn-7.21 Undo/Redo)
// ============================================================================

/**
 * Represents a single style injection change that can be undone/redone.
 * These are live CSS changes applied to elements in the preview iframe,
 * NOT file writes (those use clipboard context output per fn-9).
 */
export interface StyleChange {
  id: string;
  timestamp: number;
  /** CSS selector identifying the element */
  elementSelector: string;
  /** CSS property name (e.g., "padding", "color") */
  property: string;
  /** Previous value (null if property didn't exist) */
  oldValue: string | null;
  /** New value being applied */
  newValue: string;
  /** Optional component name for UI display */
  componentName?: string;
}

// ============================================================================
// Bridge Types (from @radflow/bridge)
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

export interface BridgeSelection {
  radflowId: RadflowId;
  source: SourceLocation | null;
  fallbackSelectors: string[];
}

// ============================================================================
// Project State (existing, moved here for reference)
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
// Component ID Mode
// ============================================================================

export interface ComponentIdSlice {
  componentIdMode: boolean;
  selectedComponents: ComponentInfo[];
  hoveredComponent: ComponentInfo | null;
  selectionRect: SelectionRect | null;
  showViolationsOnly: boolean;

  setComponentIdMode: (active: boolean) => void;
  selectComponent: (component: ComponentInfo) => void;
  addToSelection: (component: ComponentInfo) => void;
  selectAllOfType: (componentName: string) => void;
  deselectComponent: (component: ComponentInfo) => void;
  clearSelection: () => void;
  setHoveredComponent: (component: ComponentInfo | null) => void;
  setSelectionRect: (rect: SelectionRect | null) => void;
  selectComponentsInRect: (rect: SelectionRect) => void;
  setShowViolationsOnly: (show: boolean) => void;
  copySelectionToClipboard: () => Promise<void>;
  copyAllOfTypeToClipboard: (componentName: string) => Promise<void>;
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

// REMOVED: DirectWriteRecord - direct write mode sunset per fn-9
// REMOVED: FileModificationRecord - direct write mode sunset per fn-9

export interface TextEditSlice {
  textEditMode: boolean;
  pendingEdits: TextEdit[];

  setTextEditMode: (active: boolean) => void;
  addPendingEdit: (edit: Omit<TextEdit, "id" | "timestamp">) => void;
  removePendingEdit: (id: string) => void;
  clearPendingEdits: () => void;
  copyEditsToClipboard: () => Promise<void>;
}

// ============================================================================
// Property Panels
// ============================================================================

export type PanelType = "colors" | "typography" | "spacing" | "layout";

export interface PanelsSlice {
  activePanel: PanelType | null;
  panelWidth: number;

  setActivePanel: (panel: PanelType | null) => void;
  setPanelWidth: (width: number) => void;
  resetPanelWidth: () => void;
}

// ============================================================================
// Design Tokens
// ============================================================================

export interface TokensSlice {
  tokens: ThemeTokens | null;
  tokensLoading: boolean;
  tokensError: string | null;

  loadTokens: (cssPath: string) => Promise<void>;
  clearTokens: () => void;
}

// ============================================================================
// UI State
// ============================================================================

export type EditorMode = "normal" | "component-id" | "text-edit" | "preview" | "clipboard";

export interface UiSlice {
  editorMode: EditorMode;
  previewMode: boolean;
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  devMode: boolean;

  setEditorMode: (mode: EditorMode) => void;
  setPreviewMode: (enabled: boolean) => void;
  setSidebarWidth: (width: number) => void;
  resetSidebarWidth: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDevMode: (enabled: boolean) => void;
}

// ============================================================================
// Components (from Rust backend)
// ============================================================================

export interface ComponentsSlice {
  components: ComponentInfo[];
  componentsLoading: boolean;
  componentsError: string | null;
  componentMap: Map<string, ComponentInfo>; // file:line -> component

  scanComponents: (dir: string) => Promise<void>;
  clearComponents: () => void;
}

// ============================================================================
// Violations (from Rust backend)
// ============================================================================

export interface ViolationsSlice {
  violations: ViolationInfo[];
  violationsLoading: boolean;
  violationsError: string | null;
  violationsByFile: Map<string, ViolationInfo[]>; // file -> violations

  scanViolations: (dir: string) => Promise<void>;
  clearViolations: () => void;
  getViolationsForComponent: (file: string, line: number) => ViolationInfo[];
}

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
// Bridge Connection (fn-5.3)
// ============================================================================

export interface BridgeSlice {
  // Connection state
  bridgeStatus: BridgeConnectionStatus;
  bridgeVersion: string | null;
  bridgeError: string | null;
  lastPingAt: number | null;
  reconnectAttempts: number;

  // Component data from bridge
  bridgeComponentMap: SerializedComponentEntry[];
  bridgeComponentLookup: Map<RadflowId, SerializedComponentEntry>;

  // Selection/hover state
  bridgeSelection: BridgeSelection | null;
  bridgeHoveredId: RadflowId | null;

  // Actions
  setBridgeStatus: (status: BridgeConnectionStatus) => void;
  setBridgeConnected: (version: string) => void;
  setBridgeError: (error: string) => void;
  setBridgeDisconnected: () => void;
  incrementReconnectAttempts: () => void;
  updateBridgeComponentMap: (entries: SerializedComponentEntry[]) => void;
  setBridgeSelection: (selection: BridgeSelection) => void;
  setBridgeHoveredId: (id: RadflowId | null) => void;
  clearBridgeSelection: () => void;
  getBridgeComponent: (id: RadflowId) => SerializedComponentEntry | null;
}

// ============================================================================
// Project Detection + Dev Server
// ============================================================================

export interface ProjectSlice {
  // Project detection state
  project: ProjectInfo | null;
  projectLoading: boolean;
  projectError: string | null;

  // Dev server state
  serverStatus: ServerStatus;
  serverLogs: ServerLog[];
  maxServerLogs: number;

  // Actions
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
// Edit Accumulation (fn-5.6)
// ============================================================================

export interface StyleEdit {
  id: string;
  radflowId: RadflowId;
  componentName: string;
  source: SourceLocation;
  property: string;
  oldValue: string;
  newValue: string;
  timestamp: number;
}

export interface EditsSlice {
  // State
  pendingStyleEdits: StyleEdit[];
  editsByFile: Map<string, StyleEdit[]>;

  // Actions
  addStyleEdit: (edit: Omit<StyleEdit, "id" | "timestamp">) => void;
  removeStyleEdit: (id: string) => void;
  removeStyleEditsByRadflowId: (radflowId: RadflowId) => void;
  undoLastStyleEdit: () => StyleEdit | null;
  clearAllStyleEdits: () => void;

  // Getters
  getStyleEditsByFile: () => Map<string, StyleEdit[]>;
  getStyleEditsForComponent: (radflowId: RadflowId) => StyleEdit[];
  getStyleEditCount: () => number;
}

// ============================================================================
// Selection State (fn-5.5)
// ============================================================================

export interface SelectionSlice {
  // Selected component (computed from bridgeSelection)
  selectedEntry: SerializedComponentEntry | null;

  // Multi-selection support (future use)
  multiSelectEnabled: boolean;
  selectedIds: Set<RadflowId>;

  // Actions
  selectById: (radflowId: RadflowId) => void;
  addToMultiSelect: (radflowId: RadflowId) => void;
  removeFromMultiSelect: (radflowId: RadflowId) => void;
  toggleMultiSelect: (radflowId: RadflowId) => void;
  clearMultiSelect: () => void;
  setMultiSelectEnabled: (enabled: boolean) => void;

  // Computed getters
  getSelectedSource: () => SourceLocation | null;
  getSelectedFallbackSelectors: () => string[];
  isSelected: (radflowId: RadflowId) => boolean;
}

// ============================================================================
// Viewport Slice (fn-7.22)
// ============================================================================

export interface ViewportSlice {
  // Viewport state
  breakpoints: Breakpoint[];
  activeBreakpoint: string | null;
  customWidth: number | null;
  viewportWidth: number | null;

  // Target URL (dev server URL for iframe)
  targetUrl: string | null;

  // Preview view mode
  previewViewMode: PreviewViewMode;
  variantComponent: string | null;
  refreshKey: number;

  // Actions
  setBreakpoints: (breakpoints: Breakpoint[]) => void;
  setActiveBreakpoint: (name: string | null) => void;
  setCustomWidth: (width: number | null) => void;
  selectBreakpointByIndex: (index: number) => void;
  resetBreakpoints: () => void;
  setTargetUrl: (url: string | null) => void;
  setPreviewViewMode: (mode: PreviewViewMode) => void;
  setVariantComponent: (name: string | null) => void;
  refreshPreview: () => void;
}

// ============================================================================
// Undo/Redo Slice (fn-7.21)
// ============================================================================

export interface UndoSlice {
  styleUndoStack: StyleChange[];
  styleRedoStack: StyleChange[];
  maxStyleHistory: number;

  pushStyleChange: (change: Omit<StyleChange, "id" | "timestamp">) => void;
  undoStyleChange: () => StyleChange | null;
  redoStyleChange: () => StyleChange | null;
  clearStyleHistory: () => void;
  getStyleUndoCount: () => number;
  getStyleRedoCount: () => number;
  canUndoStyle: () => boolean;
  canRedoStyle: () => boolean;
}

// ============================================================================
// Target Project (external dev servers to connect to)
// ============================================================================

export interface TargetProject {
  name: string;
  url: string;
  port: number;
  status: "online" | "offline" | "checking";
}

export interface TargetProjectSlice {
  // State
  targetProjects: TargetProject[];
  activeTarget: TargetProject | null;
  isScanning: boolean;

  // Actions
  scanForProjects: () => Promise<void>;
  setActiveTarget: (target: TargetProject | null) => void;
  addTargetProject: (project: TargetProject) => void;
  removeTargetProject: (url: string) => void;
}

// ============================================================================
// Combined Store Type
// ============================================================================

export interface AppState
  extends ComponentIdSlice,
    TextEditSlice,
    PanelsSlice,
    TokensSlice,
    UiSlice,
    ComponentsSlice,
    ViolationsSlice,
    WatcherSlice,
    BridgeSlice,
    ProjectSlice,
    SelectionSlice,
    EditsSlice,
    ViewportSlice,
    UndoSlice,
    TargetProjectSlice {}
