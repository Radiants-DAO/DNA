import type { ComponentInfo, ThemeTokens, ViolationInfo } from "../bindings";

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

export interface TextEditSlice {
  textEditMode: boolean;
  directWriteMode: boolean;
  pendingEdits: TextEdit[];

  setTextEditMode: (active: boolean) => void;
  setDirectWriteMode: (enabled: boolean) => void;
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

export type EditorMode = "component-id" | "text-edit" | "preview";

export interface UiSlice {
  editorMode: EditorMode;
  previewMode: boolean;
  sidebarWidth: number;
  sidebarCollapsed: boolean;

  setEditorMode: (mode: EditorMode) => void;
  setPreviewMode: (enabled: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
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
// Combined Store Type
// ============================================================================

export interface AppState
  extends ComponentIdSlice,
    TextEditSlice,
    PanelsSlice,
    TokensSlice,
    UiSlice,
    ComponentsSlice,
    ViolationsSlice {}
