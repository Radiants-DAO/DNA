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
 * Note: `active` is now derived from editorMode === "component-id"
 */
export function useComponentIdMode() {
  const active = useAppStore((s) => s.editorMode === "component-id");
  const selectedComponents = useAppStore((s) => s.selectedComponents);
  const hoveredComponent = useAppStore((s) => s.hoveredComponent);
  const setEditorMode = useAppStore((s) => s.setEditorMode);
  const selectComponent = useAppStore((s) => s.selectComponent);
  const deselectComponent = useAppStore((s) => s.deselectComponent);
  const clearSelection = useAppStore((s) => s.clearSelection);
  const setHovered = useAppStore((s) => s.setHoveredComponent);
  const copyToClipboard = useAppStore((s) => s.copySelectionToClipboard);

  // Wrapper to maintain API compatibility
  const setActive = (active: boolean) => {
    if (active) {
      setEditorMode("component-id");
    } else {
      setEditorMode("cursor");
    }
  };

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
 * Note: `active` is now derived from editorMode === "text-edit"
 * REMOVED: directWriteMode - direct write sunset per fn-9
 */
export function useTextEditMode() {
  const active = useAppStore((s) => s.editorMode === "text-edit");
  const pendingEdits = useAppStore((s) => s.pendingEdits);
  const setEditorMode = useAppStore((s) => s.setEditorMode);
  const addEdit = useAppStore((s) => s.addPendingEdit);
  const removeEdit = useAppStore((s) => s.removePendingEdit);
  const clearEdits = useAppStore((s) => s.clearPendingEdits);
  const copyToClipboard = useAppStore((s) => s.copyEditsToClipboard);

  // Wrapper to maintain API compatibility
  const setActive = (active: boolean) => {
    if (active) {
      setEditorMode("text-edit");
    } else {
      setEditorMode("cursor");
    }
  };

  return {
    active,
    pendingEdits,
    setActive,
    addEdit,
    removeEdit,
    clearEdits,
    copyToClipboard,
  };
}

