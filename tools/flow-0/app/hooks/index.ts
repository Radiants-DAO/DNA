export {
  useComponents,
  useTokens,
  useComponentIdMode,
  useTextEditMode,
} from "./useTauriCommands";

export { useKeyboardShortcuts } from "./useKeyboardShortcuts";
export { useFileWatcher } from "./useFileWatcher";
export { useBridgeConnection } from "./useBridgeConnection";
export { useDevServer, useDevServerReady } from "./useDevServer";
export { useStyleInjection } from "./useStyleInjection";
export type { StyleEdit, UseStyleInjectionOptions, UseStyleInjectionReturn } from "./useStyleInjection";
export { useFileWrite } from "./useFileWrite";
export type { WriteResult, DiffEntry, DiffPreviewResult } from "./useFileWrite";
export { useSearch } from "./useSearch";
export type { SearchResult, SearchScope, UseSearchReturn } from "./useSearch";
export { useUndoRedo } from "./useUndoRedo";
export { useCanvasRect } from "./useCanvasRect";
export type { CanvasRect } from "./useCanvasRect";

// Canvas interaction hooks (fn-2-gnc.9)
export { useInstanceHover } from "./useInstanceHover";
export type { UseInstanceHoverOptions } from "./useInstanceHover";
export { useInstanceSelection } from "./useInstanceSelection";
export type { UseInstanceSelectionOptions } from "./useInstanceSelection";
export { useScrub } from "./useScrub";
export type { UseScrubOptions, UseScrubReturn, ScrubInputProps } from "./useScrub";
