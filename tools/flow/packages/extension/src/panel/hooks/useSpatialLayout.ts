/**
 * useSpatialLayout - Computes layout for spatial file tree
 *
 * Ported from Flow 0.
 */

import { useMemo } from "react";
import { useAppStore } from "../stores/appStore";
import { calculateTreeLayout, calculateCanvasBounds } from "../utils/spatial/treeLayout";
import { DEFAULT_LAYOUT_CONFIG } from "../utils/spatial/constants";
import type { LayoutNode, TreeLayoutConfig } from "../types/spatial";

interface UseSpatialLayoutResult {
  layoutNodes: LayoutNode[];
  canvasBounds: { width: number; height: number };
}

export function useSpatialLayout(
  config: TreeLayoutConfig = DEFAULT_LAYOUT_CONFIG
): UseSpatialLayoutResult {
  const fileTree = useAppStore((s) => s.spatialFileTree);
  const expandedPaths = useAppStore((s) => s.spatialExpandedPaths);

  const layoutNodes = useMemo(() => {
    if (!fileTree) return [];
    return calculateTreeLayout(fileTree, expandedPaths, config);
  }, [fileTree, expandedPaths, config]);

  const canvasBounds = useMemo(
    () => calculateCanvasBounds(layoutNodes),
    [layoutNodes]
  );

  return { layoutNodes, canvasBounds };
}

export default useSpatialLayout;
