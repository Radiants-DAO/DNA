import { useEffect, useState, useCallback, useRef } from "react";
import { useAppStore } from "../stores/appStore";
import type { ComponentInfo } from "../bindings";

interface TooltipPosition {
  x: number;
  y: number;
}

interface HierarchyNode {
  component: ComponentInfo;
  children: HierarchyNode[];
  depth: number;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

/**
 * Component ID Mode overlay.
 *
 * Features:
 * - Cursor changes to crosshair
 * - Element pills show component names on hover
 * - Single click copies location to clipboard
 * - Shift+Click adds to selection (multi-select)
 * - Shift+Cmd+Click selects all of same component type
 * - Click+Drag rectangle selection
 * - Toast confirms copy
 * - Right-click shows hierarchy context menu
 * - Violation indicators on offending components
 * - Filter to show only violations
 */
export function ComponentIdMode() {
  // Derive componentIdMode from editorMode (no longer a separate boolean)
  const componentIdMode = useAppStore((s) => s.editorMode === "component-id");
  const selectComponent = useAppStore((s) => s.selectComponent);
  const addToSelection = useAppStore((s) => s.addToSelection);
  const selectAllOfType = useAppStore((s) => s.selectAllOfType);
  const setHoveredComponent = useAppStore((s) => s.setHoveredComponent);
  const hoveredComponent = useAppStore((s) => s.hoveredComponent);
  const components = useAppStore((s) => s.components);
  const selectedComponents = useAppStore((s) => s.selectedComponents);
  const copySelectionToClipboard = useAppStore((s) => s.copySelectionToClipboard);
  const copyAllOfTypeToClipboard = useAppStore((s) => s.copyAllOfTypeToClipboard);
  const showViolationsOnly = useAppStore((s) => s.showViolationsOnly);
  const setShowViolationsOnly = useAppStore((s) => s.setShowViolationsOnly);
  const violations = useAppStore((s) => s.violations);
  const getViolationsForComponent = useAppStore((s) => s.getViolationsForComponent);

  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const [copiedComponent, setCopiedComponent] = useState<ComponentInfo | null>(null);
  const [copiedAllOfType, setCopiedAllOfType] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    position: TooltipPosition;
    hierarchy: HierarchyNode[];
  } | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  // Check if component has violations
  const componentHasViolations = useCallback(
    (component: ComponentInfo): boolean => {
      const componentViolations = getViolationsForComponent(component.file, component.line);
      return componentViolations.length > 0;
    },
    [getViolationsForComponent]
  );

  // Get violation count for component
  const getViolationCount = useCallback(
    (component: ComponentInfo): { warnings: number; errors: number } => {
      const componentViolations = getViolationsForComponent(component.file, component.line);
      return {
        warnings: componentViolations.filter((v) => v.severity === "warning").length,
        errors: componentViolations.filter((v) => v.severity === "error").length,
      };
    },
    [getViolationsForComponent]
  );

  // Build component hierarchy for context menu
  const buildHierarchy = useCallback(
    (targetComponent: ComponentInfo): HierarchyNode[] => {
      // For now, return flat list of components from same file
      // Future: build actual tree from SWC parent-child data
      const sameFile = components.filter((c) => c.file === targetComponent.file);
      return sameFile.map((c) => ({
        component: c,
        children: [],
        depth: 0,
      }));
    },
    [components]
  );

  // Find component from simulated click (for demo purposes)
  // In production, this would correlate DOM element to SWC-parsed component data
  const findComponentAtPoint = useCallback(
    (x: number, y: number): ComponentInfo | null => {
      // For now, return first component if we have any
      // Real implementation would use data attributes or element correlation
      if (components.length > 0) {
        // If showViolationsOnly is true, only return components with violations
        if (showViolationsOnly) {
          const violatingComponents = components.filter(componentHasViolations);
          return violatingComponents.length > 0 ? violatingComponents[0] : null;
        }
        return components[0];
      }
      return null;
    },
    [components, showViolationsOnly, componentHasViolations]
  );

  // Format clipboard text for single component
  const formatClipboardText = (component: ComponentInfo): string => {
    // Format: ComponentName @ file.tsx:line
    const fileName = component.file.split("/").pop() || component.file;
    return `${component.name} @ ${fileName}:${component.line}`;
  };

  // Format clipboard text for multi-select
  const formatMultiSelectClipboardText = (components: ComponentInfo[]): string => {
    return components
      .map((c) => {
        const fileName = c.file.split("/").pop() || c.file;
        return `${c.name} @ ${fileName}:${c.line}`;
      })
      .join("\n");
  };

  // Copy to clipboard with toast
  const copyToClipboard = useCallback(
    async (component: ComponentInfo, additive: boolean = false) => {
      if (additive) {
        addToSelection(component);
        // Copy all selected (including this one)
        await copySelectionToClipboard();
      } else {
        selectComponent(component);
        const text = formatClipboardText(component);
        try {
          await navigator.clipboard.writeText(text);
        } catch (err) {
          console.error("Failed to copy to clipboard:", err);
        }
      }
      setCopiedComponent(component);
      // Clear toast after 2 seconds
      setTimeout(() => setCopiedComponent(null), 2000);
    },
    [selectComponent, addToSelection, copySelectionToClipboard]
  );

  // Copy all of type to clipboard
  const copyAllOfType = useCallback(
    async (componentName: string) => {
      selectAllOfType(componentName);
      await copyAllOfTypeToClipboard(componentName);
      setCopiedAllOfType(componentName);
      // Clear toast after 2 seconds
      setTimeout(() => setCopiedAllOfType(null), 2000);
    },
    [selectAllOfType, copyAllOfTypeToClipboard]
  );

  // Handle mouse move for hover detection
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      // Handle dragging
      if (dragState.isDragging) {
        setDragState((prev) => ({
          ...prev,
          currentX: e.clientX,
          currentY: e.clientY,
        }));
        return;
      }

      const target = e.target as HTMLElement;
      if (!target) return;

      // Ignore our own UI elements
      if (target.closest("[data-radflow-panel]")) {
        setHoveredComponent(null);
        setTooltipPosition(null);
        return;
      }

      // Find component at cursor position
      const component = findComponentAtPoint(e.clientX, e.clientY);
      setHoveredComponent(component);
      if (component) {
        setTooltipPosition({ x: e.clientX, y: e.clientY });
      } else {
        setTooltipPosition(null);
      }
    },
    [findComponentAtPoint, setHoveredComponent, dragState.isDragging]
  );

  // Handle mouse down for drag selection
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.closest("[data-radflow-panel]")) return;

      // Only start drag on left click without modifiers
      if (e.button === 0 && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        setDragState({
          isDragging: true,
          startX: e.clientX,
          startY: e.clientY,
          currentX: e.clientX,
          currentY: e.clientY,
        });
      }
    },
    []
  );

  // Handle mouse up for drag selection
  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!dragState.isDragging) return;

      const minDragDistance = 10; // Minimum pixels to consider it a drag
      const dragDistanceX = Math.abs(dragState.currentX - dragState.startX);
      const dragDistanceY = Math.abs(dragState.currentY - dragState.startY);

      if (dragDistanceX > minDragDistance || dragDistanceY > minDragDistance) {
        // It was a drag selection
        // In a real implementation, we'd find all components within the rectangle
        // For now, we'll select all components as a demo
        const rect = {
          left: Math.min(dragState.startX, dragState.currentX),
          right: Math.max(dragState.startX, dragState.currentX),
          top: Math.min(dragState.startY, dragState.currentY),
          bottom: Math.max(dragState.startY, dragState.currentY),
        };
        console.log("Rectangle selection:", rect);
        // TODO: Query DOM for elements within rect and match to components
      }

      setDragState({
        isDragging: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
      });
    },
    [dragState]
  );

  // Handle click for selection
  const handleClick = useCallback(
    (e: MouseEvent) => {
      // Ignore if it was a drag
      if (dragState.isDragging) return;

      // Close context menu on any click
      setContextMenu(null);

      const target = e.target as HTMLElement;
      if (!target || target.closest("[data-radflow-panel]")) return;

      e.preventDefault();
      e.stopPropagation();

      const component = findComponentAtPoint(e.clientX, e.clientY);
      if (component) {
        if (e.shiftKey && (e.metaKey || e.ctrlKey)) {
          // Shift+Cmd+Click: Select all of same type
          copyAllOfType(component.name);
        } else if (e.shiftKey) {
          // Shift+Click: Add to selection
          copyToClipboard(component, true);
        } else {
          // Regular click: Single selection
          copyToClipboard(component, false);
        }
      }
    },
    [findComponentAtPoint, copyToClipboard, copyAllOfType, dragState.isDragging]
  );

  // Handle right-click for hierarchy menu
  const handleContextMenu = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.closest("[data-radflow-panel]")) return;

      e.preventDefault();
      e.stopPropagation();

      const component = findComponentAtPoint(e.clientX, e.clientY);
      if (component) {
        const hierarchy = buildHierarchy(component);
        setContextMenu({
          position: { x: e.clientX, y: e.clientY },
          hierarchy,
        });
      }
    },
    [findComponentAtPoint, buildHierarchy]
  );

  // Set up event listeners when mode is active
  useEffect(() => {
    if (!componentIdMode) {
      // Clean up state when mode is deactivated
      setHoveredComponent(null);
      setTooltipPosition(null);
      setContextMenu(null);
      setDragState({ isDragging: false, startX: 0, startY: 0, currentX: 0, currentY: 0 });
      document.body.style.cursor = "";
      return;
    }

    // Change cursor to crosshair
    document.body.style.cursor = "crosshair";

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("contextmenu", handleContextMenu, true);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.body.style.cursor = "";
    };
  }, [
    componentIdMode,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handleClick,
    handleContextMenu,
    setHoveredComponent,
  ]);

  if (!componentIdMode) return null;

  // Calculate selection rectangle
  const selectionRect =
    dragState.isDragging
      ? {
          left: Math.min(dragState.startX, dragState.currentX),
          top: Math.min(dragState.startY, dragState.currentY),
          width: Math.abs(dragState.currentX - dragState.startX),
          height: Math.abs(dragState.currentY - dragState.startY),
        }
      : null;

  // Get violation stats
  const totalViolations = violations.length;
  const totalErrors = violations.filter((v) => v.severity === "error").length;
  const totalWarnings = violations.filter((v) => v.severity === "warning").length;

  return (
    <>
      {/* Selection Rectangle */}
      {selectionRect && selectionRect.width > 10 && selectionRect.height > 10 && (
        <div
          data-radflow-panel
          className="fixed z-40 pointer-events-none border-2 border-accent bg-accent/10"
          style={{
            left: `${selectionRect.left}px`,
            top: `${selectionRect.top}px`,
            width: `${selectionRect.width}px`,
            height: `${selectionRect.height}px`,
          }}
        />
      )}

      {/* Hover Tooltip (Element Pill) */}
      {hoveredComponent && tooltipPosition && !dragState.isDragging && (
        <div
          data-radflow-panel
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${tooltipPosition.x + 12}px`,
            top: `${tooltipPosition.y + 12}px`,
            maxWidth: "400px",
          }}
        >
          <div className="bg-surface border border-edge rounded-lg shadow-lg p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text">{hoveredComponent.name}</span>
              {componentHasViolations(hoveredComponent) && (
                <span className="flex items-center gap-1">
                  {getViolationCount(hoveredComponent).errors > 0 && (
                    <span className="text-red-500 text-xs">
                      {getViolationCount(hoveredComponent).errors}
                    </span>
                  )}
                  {getViolationCount(hoveredComponent).warnings > 0 && (
                    <span className="text-yellow-500 text-xs">
                      {getViolationCount(hoveredComponent).warnings}
                    </span>
                  )}
                </span>
              )}
            </div>
            <div className="text-text-muted text-xs font-mono mt-1">
              {hoveredComponent.file}:{hoveredComponent.line}
            </div>
            <div className="text-text-muted text-[10px] mt-2 space-y-0.5">
              <div>Click to copy</div>
              <div>Shift+Click to add to selection</div>
              <div>Shift+Cmd+Click to select all of type</div>
              <div>Right-click for hierarchy</div>
            </div>
          </div>
        </div>
      )}

      {/* Copy Toast (Single) */}
      {copiedComponent && !copiedAllOfType && (
        <div
          data-radflow-panel
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-accent text-white px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="font-semibold text-sm">
              {selectedComponents.length > 1
                ? `Copied ${selectedComponents.length} components!`
                : "Copied to clipboard!"}
            </div>
            <div className="text-white/80 text-xs font-mono mt-1 max-w-md truncate">
              {selectedComponents.length > 1
                ? formatMultiSelectClipboardText(selectedComponents.slice(0, 3)) +
                  (selectedComponents.length > 3 ? "\n..." : "")
                : formatClipboardText(copiedComponent)}
            </div>
          </div>
        </div>
      )}

      {/* Copy Toast (All of Type) */}
      {copiedAllOfType && (
        <div
          data-radflow-panel
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-accent text-white px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="font-semibold text-sm">
              All {copiedAllOfType} instances copied!
            </div>
            <div className="text-white/80 text-xs font-mono mt-1">
              {selectedComponents.length} instances selected
            </div>
          </div>
        </div>
      )}

      {/* Right-click Context Menu (Hierarchy) */}
      {contextMenu && (
        <div
          data-radflow-panel
          className="fixed z-50"
          style={{
            left: `${contextMenu.position.x}px`,
            top: `${contextMenu.position.y}px`,
          }}
        >
          <div className="bg-surface border border-edge rounded-lg shadow-lg py-1 min-w-[200px] max-h-[300px] overflow-auto">
            <div className="px-3 py-2 text-xs text-text-muted font-semibold uppercase border-b border-edge">
              Component Hierarchy
            </div>
            {contextMenu.hierarchy.map((node) => {
              const isSelected = selectedComponents.some(
                (c) => c.file === node.component.file && c.line === node.component.line
              );
              const hasViolations = componentHasViolations(node.component);
              return (
                <button
                  key={`${node.component.file}:${node.component.line}`}
                  onClick={() => {
                    copyToClipboard(node.component, false);
                    setContextMenu(null);
                  }}
                  className={`
                    w-full text-left px-3 py-2 text-sm hover:bg-background/50 transition-colors flex items-center justify-between
                    ${isSelected ? "bg-accent/10" : ""}
                  `}
                  style={{ paddingLeft: `${12 + node.depth * 16}px` }}
                >
                  <div>
                    <span className="font-medium text-text">{node.component.name}</span>
                    <span className="text-text-muted text-xs ml-2">:{node.component.line}</span>
                  </div>
                  {hasViolations && (
                    <span className="w-2 h-2 rounded-full bg-red-500" title="Has violations" />
                  )}
                </button>
              );
            })}
            {contextMenu.hierarchy.length === 0 && (
              <div className="px-3 py-2 text-sm text-text-muted">No components found</div>
            )}
          </div>
        </div>
      )}

      {/* Mode Indicator & Violations Filter */}
      <div
        data-radflow-panel
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2"
      >
        <div className="bg-accent/90 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
          Component ID Mode
        </div>
        {totalViolations > 0 && (
          <button
            onClick={() => setShowViolationsOnly(!showViolationsOnly)}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium shadow-lg transition-colors
              ${showViolationsOnly ? "bg-red-500 text-white" : "bg-surface text-text border border-edge"}
            `}
          >
            {totalWarnings > 0 && <span className="text-yellow-400 mr-1">{totalWarnings}</span>}
            {totalErrors > 0 && <span className="text-red-400 mr-1">{totalErrors}</span>}
            {showViolationsOnly ? "Showing violations" : "Show violations"}
          </button>
        )}
      </div>

      {/* Selection Count Indicator */}
      {selectedComponents.length > 1 && (
        <div
          data-radflow-panel
          className="fixed top-4 right-4 z-50 bg-surface border border-edge rounded-lg shadow-lg px-3 py-2"
        >
          <div className="text-xs text-text-muted">Selected</div>
          <div className="text-lg font-semibold text-text">{selectedComponents.length}</div>
        </div>
      )}
    </>
  );
}
