/**
 * Store Types - Ported from Flow 0
 *
 * This file contains all type definitions for the Zustand store slices.
 * Tauri-specific types have been replaced with extension-compatible alternatives.
 */

// ============================================================================
// Viewport/Breakpoint Types
// ============================================================================

export interface Breakpoint {
  name: string;
  width: number;
}

export type PreviewViewMode = "grid" | "focused" | "variants";

/**
 * Canvas Rect - Bounding rectangle of the canvas iframe
 */
export interface CanvasRect {
  left: number;
  top: number;
  width: number;
  height: number;
  scale: number;
}

// ============================================================================
// Style Change Types (Undo/Redo)
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
// Bridge Types
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
  | "animation"
  // Extension-specific modes
  | "inspector"
  | "developer";

export type ModeBarPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

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

// ============================================================================
// Comment Slice Interface
// ============================================================================

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
// Theme Tokens (Extension-compatible version)
// ============================================================================

export interface ThemeTokens {
  inline: Record<string, string>;
  public: Record<string, string>;
}

// ============================================================================
// Component Info (Extension-compatible version)
// ============================================================================

export interface ComponentInfo {
  name: string;
  file: string;
  line: number;
  column: number;
  props?: Record<string, unknown>;
}

export interface ViolationInfo {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning" | "info";
}

// ============================================================================
// Assets (Extension-compatible version)
// ============================================================================

export interface IconAsset {
  id: string;
  name: string;
  path: string;
  category?: string;
}

export interface LogoAsset {
  id: string;
  name: string;
  path: string;
  variants?: string[];
}

export interface ImageAsset {
  id: string;
  name: string;
  path: string;
  width?: number;
  height?: number;
}

export interface AssetLibrary {
  icons: IconAsset[];
  logos: LogoAsset[];
  images: ImageAsset[];
}

// ============================================================================
// Spatial Types
// ============================================================================

export type NodeType = "File" | "Directory";

export interface FileNode {
  id: string;
  name: string;
  path: string;
  nodeType: NodeType;
  extension: string | null;
  size: number;
  sizeFormatted: string;
  totalSize: number | null;
  childCount: number | null;
  modified: string;
  isHidden: boolean;
  isReadable: boolean;
  isAutoCollapsed: boolean;
  children?: FileNode[];
}

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fileNode: FileNode;
  subtreeHeight: number;
  isCollapsed: boolean;
  isTruncationNode?: boolean;
  truncatedCount?: number;
}

export interface PanOffset {
  x: number;
  y: number;
}

// ============================================================================
// Component Canvas Types
// ============================================================================

export interface PropDefinition {
  type: string;
  values?: string[];
  default?: unknown;
  description?: string;
}

export interface SlotDefinition {
  description?: string;
}

export interface SchemaExample {
  name: string;
  code: string;
}

export interface ComponentSchema {
  name: string;
  description: string;
  filePath: string;
  props: Record<string, PropDefinition>;
  slots: Record<string, SlotDefinition> | string[];
  examples: SchemaExample[];
  subcomponents?: string[];
}

export interface DnaConfig {
  component: string;
  filePath: string;
  tokenBindings: Record<string, Record<string, string>>;
  states?: Record<string, Record<string, string>>;
}

export interface ComponentCanvasNode {
  id: string;
  schema: ComponentSchema;
  dna?: DnaConfig;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ConnectionType = "composition" | "tokenShare" | "variant";

export interface ComponentConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type: ConnectionType;
  label?: string;
}

export interface NodePreviewState {
  enabled: boolean;
  loaded: boolean;
  dimensions?: { width: number; height: number };
}

export interface PagePreviewConfig {
  enabled: boolean;
  url: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// Output Types
// ============================================================================

export type OutputTarget = "clipboard" | "file" | "both";

export interface PersistResult {
  success: boolean;
  target: OutputTarget;
  error?: string;
  filePath?: string;
  bytesWritten?: number;
}

export type PanelMode = "default" | "focus" | "advanced";

export function panelModeToOutputTarget(mode: PanelMode): OutputTarget {
  switch (mode) {
    case "default":
    case "focus":
      return "clipboard";
    case "advanced":
      return "file";
  }
}

// ============================================================================
// Workspace Types
// ============================================================================

export interface ThemeEntry {
  id: string;
  name: string;
  path: string;
  hasTokensCss: boolean;
  hasDarkCss: boolean;
  hasComponentsDir: boolean;
  apps: string[];
}

export interface AppEntry {
  id: string;
  name: string;
  path: string;
  themeIds: string[];
  devCommand: string;
  devPort: number;
  previewRoute: string;
}

export interface RecentWorkspace {
  path: string;
  name: string;
  lastOpened: string;
}

export type WorkspaceContext = {
  type: "monorepo";
  root: string;
  themes: ThemeEntry[];
  apps: AppEntry[];
  activeThemeId: string | null;
  activeAppId: string | null;
} | null;

// ============================================================================
// StyleValue Types (Simplified for extension)
// ============================================================================

export interface StyleValue {
  type: string;
  value: unknown;
  unit?: string;
  hidden?: boolean;
}

export type ResolvedTokenMap = Map<string, StyleValue>;

// ============================================================================
// Component Meta Types
// ============================================================================

export interface ComponentMeta {
  name: string;
  file: string;
  line: number;
  column: number;
  radflowId?: string;
  displayName?: string;
  props?: Record<string, unknown>;
}

// ============================================================================
// Slice Type Imports
// ============================================================================

import type { CanvasSlice } from "./slices/canvasSlice";
import type { UiStateSlice } from "./slices/uiStateSlice";
import type { TokensSlice } from "./slices/tokensSlice";
import type { ComponentsSlice } from "./slices/componentsSlice";
import type { BridgeSlice } from "./slices/bridgeSlice";
import type { EditingSlice, StyleEdit } from "./slices/editingSlice";
import type { SpatialViewportSlice } from "./slices/spatialViewportSlice";
import type { ComponentCanvasSlice } from "./slices/componentCanvasSlice";
import type { AssetsSlice } from "./slices/assetsSlice";
import type { WorkspaceSlice } from "./slices/workspaceSlice";
import type { MutationSlice } from "./slices/mutationSlice";
import type { PromptOutputSlice } from "./slices/promptOutputSlice";
import type { PromptBuilderSlice } from "./slices/promptBuilderSlice";

// ============================================================================
// Combined Store Type
// ============================================================================

export interface AppState
  extends CanvasSlice,
    UiStateSlice,
    TokensSlice,
    ComponentsSlice,
    BridgeSlice,
    EditingSlice,
    CommentSlice,
    SpatialViewportSlice,
    ComponentCanvasSlice,
    AssetsSlice,
    WorkspaceSlice,
    MutationSlice,
    PromptOutputSlice,
    PromptBuilderSlice {}

// Re-export slice types
export type {
  CanvasSlice,
  UiStateSlice,
  TokensSlice,
  ComponentsSlice,
  BridgeSlice,
  EditingSlice,
  SpatialViewportSlice,
  ComponentCanvasSlice,
  AssetsSlice,
  WorkspaceSlice,
  MutationSlice,
  PromptOutputSlice,
  PromptBuilderSlice,
  StyleEdit,
};
