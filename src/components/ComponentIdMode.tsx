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

/**
 * Component ID Mode overlay.
 *
 * Features:
 * - Cursor changes to crosshair
 * - Element pills show component names on hover
 * - Single click copies location to clipboard
 * - Toast confirms copy
 * - Right-click shows hierarchy context menu
 */
export function ComponentIdMode() {
  const componentIdMode = useAppStore((s) => s.componentIdMode);
  const setComponentIdMode = useAppStore((s) => s.setComponentIdMode);
  const selectComponent = useAppStore((s) => s.selectComponent);
  const setHoveredComponent = useAppStore((s) => s.setHoveredComponent);
  const hoveredComponent = useAppStore((s) => s.hoveredComponent);
  const components = useAppStore((s) => s.components);
  const componentMap = useAppStore((s) => s.componentMap);

  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const [copiedComponent, setCopiedComponent] = useState<ComponentInfo | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    position: TooltipPosition;
    hierarchy: HierarchyNode[];
  } | null>(null);

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
        return components[0];
      }
      return null;
    },
    [components]
  );

  // Format clipboard text
  const formatClipboardText = (component: ComponentInfo): string => {
    // Format: ComponentName @ file.tsx:line
    const fileName = component.file.split("/").pop() || component.file;
    return `${component.name} @ ${fileName}:${component.line}`;
  };

  // Copy to clipboard with toast
  const copyToClipboard = useCallback(async (component: ComponentInfo) => {
    const text = formatClipboardText(component);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedComponent(component);
      selectComponent(component);
      // Clear toast after 2 seconds
      setTimeout(() => setCopiedComponent(null), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }, [selectComponent]);

  // Handle mouse move for hover detection
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
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
    [findComponentAtPoint, setHoveredComponent]
  );

  // Handle click for selection
  const handleClick = useCallback(
    (e: MouseEvent) => {
      // Close context menu on any click
      setContextMenu(null);

      const target = e.target as HTMLElement;
      if (!target || target.closest("[data-radflow-panel]")) return;

      e.preventDefault();
      e.stopPropagation();

      const component = findComponentAtPoint(e.clientX, e.clientY);
      if (component) {
        copyToClipboard(component);
      }
    },
    [findComponentAtPoint, copyToClipboard]
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
      document.body.style.cursor = "";
      return;
    }

    // Change cursor to crosshair
    document.body.style.cursor = "crosshair";

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("contextmenu", handleContextMenu, true);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.body.style.cursor = "";
    };
  }, [componentIdMode, handleMouseMove, handleClick, handleContextMenu, setHoveredComponent]);

  if (!componentIdMode) return null;

  return (
    <>
      {/* Hover Tooltip (Element Pill) */}
      {hoveredComponent && tooltipPosition && (
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
            <div className="font-semibold text-text">
              {hoveredComponent.name}
            </div>
            <div className="text-text-muted text-xs font-mono mt-1">
              {hoveredComponent.file}:{hoveredComponent.line}
            </div>
            <div className="text-text-muted text-[10px] mt-2">
              Click to copy • Right-click for hierarchy
            </div>
          </div>
        </div>
      )}

      {/* Copy Toast */}
      {copiedComponent && (
        <div
          data-radflow-panel
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-accent text-white px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="font-semibold text-sm">Copied to clipboard!</div>
            <div className="text-white/80 text-xs font-mono mt-1">
              {formatClipboardText(copiedComponent)}
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
            {contextMenu.hierarchy.map((node, i) => {
              const isHovered = hoveredComponent?.file === node.component.file &&
                hoveredComponent?.line === node.component.line;
              return (
                <button
                  key={`${node.component.file}:${node.component.line}`}
                  onClick={() => {
                    copyToClipboard(node.component);
                    setContextMenu(null);
                  }}
                  className={`
                    w-full text-left px-3 py-2 text-sm hover:bg-background/50 transition-colors
                    ${isHovered ? "bg-accent/10" : ""}
                  `}
                  style={{ paddingLeft: `${12 + node.depth * 16}px` }}
                >
                  <span className="font-medium text-text">{node.component.name}</span>
                  <span className="text-text-muted text-xs ml-2">
                    :{node.component.line}
                  </span>
                </button>
              );
            })}
            {contextMenu.hierarchy.length === 0 && (
              <div className="px-3 py-2 text-sm text-text-muted">
                No components found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode Indicator */}
      <div
        data-radflow-panel
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      >
        <div className="bg-accent/90 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
          Component ID Mode
        </div>
      </div>
    </>
  );
}
