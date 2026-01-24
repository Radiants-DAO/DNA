// Main app store with all slices
export { useAppStore } from "./appStore";
export type {
  AppState,
  ComponentIdSlice,
  TextEditSlice,
  PanelsSlice,
  TokensSlice,
  UiSlice,
  ComponentsSlice,
  EditorMode,
  PanelType,
  TextEdit,
} from "./appStore";

// Project store (separate - uses Tauri plugin-store for persistence)
export { useProjectStore } from "./projectStore";
export type { RecentProject } from "./projectStore";
