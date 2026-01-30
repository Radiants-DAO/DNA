import type { FileNode, LayoutNode, TreeLayoutConfig } from "../../types/spatial";
import { DEFAULT_LAYOUT_CONFIG, SPATIAL_PERFORMANCE } from "./constants";

/**
 * Vertical tree layout - parent on top, children below
 * Children are arranged horizontally, each taking up their subtree width
 */

function measureSubtreeWidth(
  node: FileNode,
  expandedPaths: Set<string>,
  config: TreeLayoutConfig
): number {
  if (node.nodeType === "Directory" && !expandedPaths.has(node.path)) {
    return config.nodeWidth;
  }

  if (!node.children?.length) {
    return config.nodeWidth;
  }

  const visibleCount = Math.min(node.children.length, config.maxVisibleChildren);
  const hasTruncation = node.children.length > config.maxVisibleChildren;

  let totalWidth = 0;
  for (let i = 0; i < visibleCount; i++) {
    totalWidth += measureSubtreeWidth(node.children[i], expandedPaths, config);
  }

  if (hasTruncation) {
    totalWidth += config.nodeWidth;
  }

  const itemCount = visibleCount + (hasTruncation ? 1 : 0);
  const gaps = Math.max(0, itemCount - 1) * config.horizontalGap;

  return Math.max(config.nodeWidth, totalWidth + gaps);
}

function buildSubtreeWidths(
  node: FileNode,
  expandedPaths: Set<string>,
  config: TreeLayoutConfig,
  widths: Map<string, number>
): void {
  const width = measureSubtreeWidth(node, expandedPaths, config);
  widths.set(node.path, width);

  if (
    node.nodeType === "Directory" &&
    expandedPaths.has(node.path) &&
    node.children?.length
  ) {
    const visibleCount = Math.min(node.children.length, config.maxVisibleChildren);
    for (let i = 0; i < visibleCount; i++) {
      buildSubtreeWidths(node.children[i], expandedPaths, config, widths);
    }
  }
}

function positionNodes(
  node: FileNode,
  startX: number,
  startY: number,
  availableWidth: number,
  expandedPaths: Set<string>,
  subtreeWidths: Map<string, number>,
  config: TreeLayoutConfig,
  results: LayoutNode[]
): void {
  const isCollapsed = node.nodeType === "Directory" && !expandedPaths.has(node.path);

  // Center node horizontally within its available width
  const nodeX = startX + (availableWidth - config.nodeWidth) / 2;

  results.push({
    id: node.id,
    x: nodeX,
    y: startY,
    width: config.nodeWidth,
    height: config.nodeHeight,
    fileNode: node,
    subtreeHeight: subtreeWidths.get(node.path) ?? config.nodeWidth, // Note: storing width as subtreeHeight for compatibility
    isCollapsed,
  });

  if (isCollapsed || !node.children?.length) return;

  // Children go below parent
  const childY = startY + config.nodeHeight + config.verticalGap;
  let childX = startX;

  const visibleCount = Math.min(node.children.length, config.maxVisibleChildren);
  const truncatedCount = node.children.length - visibleCount;

  for (let i = 0; i < visibleCount; i++) {
    const child = node.children[i];
    const childWidth = subtreeWidths.get(child.path) ?? config.nodeWidth;
    positionNodes(
      child,
      childX,
      childY,
      childWidth,
      expandedPaths,
      subtreeWidths,
      config,
      results
    );
    childX += childWidth + config.horizontalGap;
  }

  if (truncatedCount > 0) {
    results.push({
      id: `${node.id}__truncation`,
      x: childX + (config.nodeWidth - config.nodeWidth) / 2,
      y: childY,
      width: config.nodeWidth,
      height: config.nodeHeight,
      fileNode: node,
      subtreeHeight: config.nodeWidth,
      isCollapsed: false,
      isTruncationNode: true,
      truncatedCount,
    });
  }
}

export function calculateTreeLayout(
  root: FileNode,
  expandedPaths: Set<string>,
  config: TreeLayoutConfig = DEFAULT_LAYOUT_CONFIG
): LayoutNode[] {
  const start = performance.now();

  const subtreeWidths = new Map<string, number>();
  buildSubtreeWidths(root, expandedPaths, config, subtreeWidths);

  const rootWidth = subtreeWidths.get(root.path) ?? config.nodeWidth;
  const results: LayoutNode[] = [];

  positionNodes(
    root,
    config.rootOffsetX,
    config.rootOffsetY,
    rootWidth,
    expandedPaths,
    subtreeWidths,
    config,
    results
  );

  const elapsed = performance.now() - start;
  if (elapsed > SPATIAL_PERFORMANCE.LAYOUT_BUDGET_MS) {
    console.warn(
      `[spatial] Layout took ${elapsed.toFixed(1)}ms (budget: ${SPATIAL_PERFORMANCE.LAYOUT_BUDGET_MS}ms, nodes: ${results.length})`
    );
  }

  return results;
}

export function calculateCanvasBounds(
  nodes: LayoutNode[],
  padding: number = 40
): { width: number; height: number } {
  if (!nodes.length) {
    return {
      width: typeof window !== "undefined" ? window.innerWidth : 1200,
      height: typeof window !== "undefined" ? window.innerHeight : 800,
    };
  }

  let maxX = 0;
  let maxY = 0;

  for (const node of nodes) {
    maxX = Math.max(maxX, node.x + node.width + padding);
    maxY = Math.max(maxY, node.y + node.height + padding);
  }

  const minWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
  const minHeight = typeof window !== "undefined" ? window.innerHeight : 800;

  return {
    width: Math.max(maxX, minWidth),
    height: Math.max(maxY, minHeight),
  };
}
