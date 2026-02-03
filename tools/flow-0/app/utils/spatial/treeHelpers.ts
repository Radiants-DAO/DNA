import type { FileNode, LayoutNode } from "../../types/spatial";

export function getParentPath(path: string): string {
  const lastSlash = path.lastIndexOf("/");
  if (lastSlash <= 0) return "/";
  return path.substring(0, lastSlash);
}

export function getAncestorPaths(path: string): string[] {
  const ancestors: string[] = [];
  let current = getParentPath(path);

  while (current && current !== "/" && current.length > 1) {
    ancestors.push(current);
    current = getParentPath(current);
  }

  return ancestors;
}

/** Merge children into an existing tree node at targetPath (for lazy loading) */
export function mergeChildren(
  tree: FileNode | null,
  targetPath: string,
  children: FileNode[]
): FileNode | null {
  if (!tree) return null;

  if (tree.path === targetPath) {
    return { ...tree, children, childCount: children.length };
  }

  if (!tree.children) return tree;

  let wasUpdated = false;
  const updatedChildren = tree.children.map((child) => {
    if (targetPath.startsWith(child.path + "/") || targetPath === child.path) {
      const updated = mergeChildren(child, targetPath, children);
      if (updated !== child) {
        wasUpdated = true;
        return updated!;
      }
    }
    return child;
  });

  return wasUpdated ? { ...tree, children: updatedChildren } : tree;
}

export function findNodeByPath(
  tree: FileNode | null,
  targetPath: string
): FileNode | null {
  if (!tree) return null;
  if (tree.path === targetPath) return tree;

  if (!tree.children) return null;

  for (const child of tree.children) {
    if (targetPath === child.path || targetPath.startsWith(child.path + "/")) {
      const found = findNodeByPath(child, targetPath);
      if (found) return found;
    }
  }

  return null;
}

/** Remove paths that no longer exist in the tree */
export function cleanupStalePaths(
  paths: Set<string>,
  tree: FileNode | null
): Set<string> {
  if (paths.size === 0) return paths;

  const validPaths = new Set<string>();
  for (const path of paths) {
    if (findNodeByPath(tree, path)) {
      validPaths.add(path);
    }
  }

  return validPaths.size === paths.size ? paths : validPaths;
}

/** Sort nodes by visual position: left-to-right columns, then top-to-bottom */
export function sortByVisualOrder(nodes: LayoutNode[]): LayoutNode[] {
  const COLUMN_TOLERANCE = 50;
  return [...nodes].sort((a, b) => {
    const colA = Math.floor(a.x / COLUMN_TOLERANCE);
    const colB = Math.floor(b.x / COLUMN_TOLERANCE);
    return colA !== colB ? colA - colB : a.y - b.y;
  });
}

export function countTreeNodes(tree: FileNode | null): number {
  if (!tree) return 0;
  let count = 1;
  if (tree.children) {
    for (const child of tree.children) {
      count += countTreeNodes(child);
    }
  }
  return count;
}

export function getAllFilePaths(tree: FileNode | null): string[] {
  if (!tree) return [];

  const paths: string[] = [];

  function traverse(node: FileNode): void {
    if (node.nodeType === "File") {
      paths.push(node.path);
    }
    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(tree);
  return paths;
}
