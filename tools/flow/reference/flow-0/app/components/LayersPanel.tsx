import { useState, useCallback, useMemo } from "react";
import { useAppStore } from "../stores/appStore";
import type { ComponentInfo } from "../bindings";

interface TreeNode {
  id: string;
  component: ComponentInfo;
  children: TreeNode[];
  expanded: boolean;
}

/**
 * Layers Panel - Right sidebar showing component tree structure.
 *
 * Features:
 * - Tree structure mirroring code/folder hierarchy
 * - Expandable/collapsible nodes
 * - Bidirectional sync: hover canvas ↔ highlight in panel
 * - Click to select and copy to clipboard
 */
export function LayersPanel() {
  // Derive componentIdMode from editorMode (no longer a separate boolean)
  const componentIdMode = useAppStore((s) => s.editorMode === "component-id");
  const components = useAppStore((s) => s.components);
  const hoveredComponent = useAppStore((s) => s.hoveredComponent);
  const selectedComponents = useAppStore((s) => s.selectedComponents);
  const setHoveredComponent = useAppStore((s) => s.setHoveredComponent);
  const selectComponent = useAppStore((s) => s.selectComponent);
  const copySelectionToClipboard = useAppStore((s) => s.copySelectionToClipboard);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build tree structure grouped by file
  const tree = useMemo(() => {
    const fileMap = new Map<string, ComponentInfo[]>();

    // Group components by file
    for (const comp of components) {
      const existing = fileMap.get(comp.file) || [];
      existing.push(comp);
      fileMap.set(comp.file, existing);
    }

    // Build tree nodes
    const nodes: TreeNode[] = [];
    for (const [file, comps] of fileMap) {
      const sortedComps = [...comps].sort((a, b) => a.line - b.line);
      const fileNode: TreeNode = {
        id: file,
        component: {
          name: file.split("/").pop() || file,
          file,
          line: 0,
          props: [],
          defaultExport: false,
          unionTypes: [],
        },
        children: sortedComps.map((c) => ({
          id: `${c.file}:${c.line}`,
          component: c,
          children: [],
          expanded: false,
        })),
        expanded: expandedNodes.has(file),
      };
      nodes.push(fileNode);
    }

    return nodes;
  }, [components, expandedNodes]);

  // Toggle node expansion
  const toggleExpanded = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Handle node click
  const handleNodeClick = useCallback(
    async (component: ComponentInfo) => {
      // Only select actual components, not file headers
      if (component.line === 0) return;

      selectComponent(component);
      await copySelectionToClipboard();
    },
    [selectComponent, copySelectionToClipboard]
  );

  // Handle node hover
  const handleNodeHover = useCallback(
    (component: ComponentInfo | null) => {
      // Only hover actual components, not file headers
      if (component && component.line === 0) return;
      setHoveredComponent(component);
    },
    [setHoveredComponent]
  );

  // Check if node is selected
  const isSelected = useCallback(
    (component: ComponentInfo) => {
      return selectedComponents.some(
        (c) => c.file === component.file && c.line === component.line
      );
    },
    [selectedComponents]
  );

  // Check if node is hovered
  const isHovered = useCallback(
    (component: ComponentInfo) => {
      return (
        hoveredComponent?.file === component.file &&
        hoveredComponent?.line === component.line
      );
    },
    [hoveredComponent]
  );

  // Only show in Component ID mode
  if (!componentIdMode) return null;

  return (
    <div
      data-radflow-panel
      className="fixed right-0 top-0 bottom-0 w-64 bg-surface border-l border-edge z-40 flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-edge">
        <h2 className="text-sm font-semibold text-text">Layers</h2>
        <p className="text-xs text-text-muted mt-0.5">
          {components.length} components
        </p>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto py-2">
        {tree.length === 0 ? (
          <div className="px-4 py-8 text-center text-text-muted text-sm">
            <p>No components loaded</p>
            <p className="text-xs mt-1">
              Scan a project to see components
            </p>
          </div>
        ) : (
          tree.map((fileNode) => (
            <div key={fileNode.id}>
              {/* File header */}
              <button
                onClick={() => toggleExpanded(fileNode.id)}
                className="w-full text-left px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-background/50 flex items-center gap-1.5"
              >
                <span className="text-text-muted">
                  {expandedNodes.has(fileNode.id) ? "▼" : "▶"}
                </span>
                <span className="truncate">{fileNode.component.name}</span>
              </button>

              {/* Component children */}
              {expandedNodes.has(fileNode.id) && (
                <div className="ml-4">
                  {fileNode.children.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => handleNodeClick(node.component)}
                      onMouseEnter={() => handleNodeHover(node.component)}
                      onMouseLeave={() => handleNodeHover(null)}
                      className={`
                        w-full text-left px-3 py-1.5 text-sm transition-colors flex items-center gap-2
                        ${isSelected(node.component)
                          ? "bg-accent/20 text-accent"
                          : isHovered(node.component)
                          ? "bg-accent/10"
                          : "hover:bg-background/50"
                        }
                      `}
                    >
                      {isSelected(node.component) && (
                        <span className="text-accent text-xs">●</span>
                      )}
                      <span className="truncate font-medium">
                        {node.component.name}
                      </span>
                      <span className="text-text-muted text-xs ml-auto">
                        :{node.component.line}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-edge text-[10px] text-text-muted">
        Click to copy • Hover syncs with canvas
      </div>
    </div>
  );
}
