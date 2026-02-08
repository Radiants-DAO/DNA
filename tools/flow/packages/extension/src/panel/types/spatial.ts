/**
 * Spatial canvas types
 * Ported from Flow 0
 */

import { z } from "zod";

export type NodeType = "File" | "Directory";

export interface FileNode {
  id: string;
  name: string;
  path: string;
  nodeType: NodeType;
  extension: string | null;
  size: number;
  sizeFormatted: string;
  totalSize: number | null; // For directories
  childCount: number | null; // For directories
  modified: string; // ISO timestamp
  isHidden: boolean;
  isReadable: boolean;
  isAutoCollapsed: boolean; // node_modules, .git, etc.
  children?: FileNode[];
}

export const TreeLayoutConfigSchema = z.object({
  horizontalGap: z.number().default(200),
  verticalGap: z.number().default(20),
  nodeWidth: z.number().default(200),
  nodeHeight: z.number().default(64),
  rootOffsetX: z.number().default(40),
  rootOffsetY: z.number().default(40),
  maxVisibleChildren: z.number().default(20),
});

export type TreeLayoutConfig = z.infer<typeof TreeLayoutConfigSchema>;

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fileNode: FileNode;
  subtreeHeight: number;
  isCollapsed: boolean;
  isTruncationNode?: boolean;
  truncatedCount?: number;
}

export interface SelectModifiers {
  shift: boolean;
  cmd: boolean;
}

export interface SearchMatch {
  node: FileNode;
  score: number;
  matchedIndices: number[];
  pathSegments: string[];
}

export interface PanOffset {
  x: number;
  y: number;
}

export interface CanvasBounds {
  width: number;
  height: number;
}

export interface DirectoryContents {
  path: string;
  children: FileNode[];
  metadata: {
    totalFiles: number;
    totalFolders: number;
    totalSize: number;
    readTimeMs: number;
  };
}

export interface SearchResults {
  query: string;
  results: SearchMatch[];
  totalMatches: number;
  truncated: boolean;
  searchTimeMs: number;
}

export type SpatialErrorKind =
  | "NotFound"
  | "PermissionDenied"
  | "NotDirectory"
  | "IoError";

export interface SpatialError {
  kind: SpatialErrorKind;
  path?: string;
  message?: string;
}
