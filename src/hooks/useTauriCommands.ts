import { useCallback } from "react";
import { useAppStore } from "../stores/appStore";
import { commands, type ComponentInfo, type ThemeTokens } from "../bindings";

/**
 * Hook for accessing components with Tauri IPC.
 * Wraps the store actions with additional conveniences.
 */
export function useComponents() {
  const components = useAppStore((s) => s.components);
  const loading = useAppStore((s) => s.componentsLoading);
  const error = useAppStore((s) => s.componentsError);
  const componentMap = useAppStore((s) => s.componentMap);
  const scanComponents = useAppStore((s) => s.scanComponents);
  const clearComponents = useAppStore((s) => s.clearComponents);

  const getComponentByLocation = useCallback(
    (file: string, line: number): ComponentInfo | undefined => {
      return componentMap.get(`${file}:${line}`);
    },
    [componentMap]
  );

  return {
    components,
    loading,
    error,
    scanComponents,
    clearComponents,
    getComponentByLocation,
  };
}

/**
 * Hook for accessing design tokens with Tauri IPC.
 */
export function useTokens() {
  const tokens = useAppStore((s) => s.tokens);
  const loading = useAppStore((s) => s.tokensLoading);
  const error = useAppStore((s) => s.tokensError);
  const loadTokens = useAppStore((s) => s.loadTokens);
  const clearTokens = useAppStore((s) => s.clearTokens);

  return {
    tokens,
    loading,
    error,
    loadTokens,
    clearTokens,
  };
}

/**
 * Hook for Component ID mode state and actions.
 */
export function useComponentIdMode() {
  const active = useAppStore((s) => s.componentIdMode);
  const selectedComponents = useAppStore((s) => s.selectedComponents);
  const hoveredComponent = useAppStore((s) => s.hoveredComponent);
  const setActive = useAppStore((s) => s.setComponentIdMode);
  const selectComponent = useAppStore((s) => s.selectComponent);
  const deselectComponent = useAppStore((s) => s.deselectComponent);
  const clearSelection = useAppStore((s) => s.clearSelection);
  const setHovered = useAppStore((s) => s.setHoveredComponent);
  const copyToClipboard = useAppStore((s) => s.copySelectionToClipboard);

  return {
    active,
    selectedComponents,
    hoveredComponent,
    setActive,
    selectComponent,
    deselectComponent,
    clearSelection,
    setHovered,
    copyToClipboard,
  };
}

/**
 * Hook for Text Edit mode state and actions.
 */
export function useTextEditMode() {
  const active = useAppStore((s) => s.textEditMode);
  const directWriteMode = useAppStore((s) => s.directWriteMode);
  const pendingEdits = useAppStore((s) => s.pendingEdits);
  const setActive = useAppStore((s) => s.setTextEditMode);
  const setDirectWrite = useAppStore((s) => s.setDirectWriteMode);
  const addEdit = useAppStore((s) => s.addPendingEdit);
  const removeEdit = useAppStore((s) => s.removePendingEdit);
  const clearEdits = useAppStore((s) => s.clearPendingEdits);
  const copyToClipboard = useAppStore((s) => s.copyEditsToClipboard);

  return {
    active,
    directWriteMode,
    pendingEdits,
    setActive,
    setDirectWrite,
    addEdit,
    removeEdit,
    clearEdits,
    copyToClipboard,
  };
}

/**
 * Hook for UI state and actions.
 */
export function useEditorUI() {
  const editorMode = useAppStore((s) => s.editorMode);
  const previewMode = useAppStore((s) => s.previewMode);
  const sidebarWidth = useAppStore((s) => s.sidebarWidth);
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const setEditorMode = useAppStore((s) => s.setEditorMode);
  const setPreviewMode = useAppStore((s) => s.setPreviewMode);
  const setSidebarWidth = useAppStore((s) => s.setSidebarWidth);
  const setSidebarCollapsed = useAppStore((s) => s.setSidebarCollapsed);

  return {
    editorMode,
    previewMode,
    sidebarWidth,
    sidebarCollapsed,
    setEditorMode,
    setPreviewMode,
    setSidebarWidth,
    setSidebarCollapsed,
  };
}

/**
 * Hook for property panels state.
 */
export function usePanels() {
  const activePanel = useAppStore((s) => s.activePanel);
  const panelWidth = useAppStore((s) => s.panelWidth);
  const setActivePanel = useAppStore((s) => s.setActivePanel);
  const setPanelWidth = useAppStore((s) => s.setPanelWidth);

  return {
    activePanel,
    panelWidth,
    setActivePanel,
    setPanelWidth,
  };
}
