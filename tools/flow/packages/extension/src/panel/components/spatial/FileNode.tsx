/**
 * FileNode - Individual node in the spatial file tree
 *
 * Ported from Flow 0.
 */

import { useState, useCallback, useEffect, useRef, useMemo, memo } from "react";
import type { LayoutNode, SelectModifiers } from "../../types/spatial";
import {
  ChevronRight,
  FolderIcon,
  CheckIcon,
  MoreHorizontalIcon,
  getFileIcon,
} from "./icons";

interface FileNodeProps {
  node: LayoutNode;
  isSelected: boolean;
  isHighlighted: boolean;
  isFocused: boolean;
  onToggleExpand: (path: string) => void;
  onSelect: (path: string, modifiers: SelectModifiers) => void;
  onCopyPath: (path: string) => void;
  onDoubleClick?: (node: LayoutNode) => void;
}

/**
 * Build CSS class string for the file node based on visual states.
 * States layer properly: a node can be selected AND focused, or hovered AND selected.
 */
function buildNodeClassName(
  isSelected: boolean,
  isFocused: boolean,
  isHighlighted: boolean,
  showCopyFeedback: boolean
): string {
  const classes = [
    "file-node",
    "absolute",
    "flex",
    "items-center",
    "gap-2",
    "px-3",
    "py-2",
    "rounded-lg",
    "cursor-pointer",
  ];

  // State classes - these layer properly via CSS specificity
  if (showCopyFeedback) {
    classes.push("file-node--copy-feedback");
  } else if (isHighlighted) {
    classes.push("file-node--highlighted");
  }

  if (isSelected) {
    classes.push("file-node--selected");
  }

  if (isFocused) {
    classes.push("file-node--focused");
  }

  return classes.join(" ");
}

export const FileNode = memo(function FileNode({
  node,
  isSelected,
  isHighlighted,
  isFocused,
  onToggleExpand,
  onSelect,
  onCopyPath,
  onDoubleClick,
}: FileNodeProps): React.ReactElement {
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFolder = node.fileNode.nodeType === "Directory";
  const isExpanded = !node.isCollapsed;
  const Icon = isFolder ? FolderIcon : getFileIcon(node.fileNode.extension);

  // Memoize the class name to avoid recalculation on every render
  const nodeClassName = useMemo(
    () => buildNodeClassName(isSelected, isFocused, isHighlighted, showCopyFeedback),
    [isSelected, isFocused, isHighlighted, showCopyFeedback]
  );

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(
    async (path: string): Promise<void> => {
      try {
        await navigator.clipboard.writeText(path);
        setShowCopyFeedback(true);
        copyTimeoutRef.current = setTimeout(
          () => setShowCopyFeedback(false),
          400
        );
        onCopyPath(path);
      } catch {
        // Clipboard write failed silently
      }
    },
    [onCopyPath]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const modifiers: SelectModifiers = {
        shift: e.shiftKey,
        cmd: e.metaKey || e.ctrlKey,
      };
      const hasModifier = modifiers.shift || modifiers.cmd;

      if (isFolder) {
        if (hasModifier) {
          onSelect(node.fileNode.path, modifiers);
        } else {
          onToggleExpand(node.fileNode.path);
        }
      } else {
        onSelect(node.fileNode.path, modifiers);
        if (!hasModifier) {
          handleCopy(node.fileNode.path);
        }
      }
    },
    [isFolder, node.fileNode.path, onToggleExpand, onSelect, handleCopy]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDoubleClick?.(node);
    },
    [node, onDoubleClick]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();

      if (isFolder) {
        onToggleExpand(node.fileNode.path);
      } else {
        handleCopy(node.fileNode.path);
      }
    },
    [isFolder, node.fileNode.path, onToggleExpand, handleCopy]
  );

  // Truncation placeholder node ("+N more" indicator)
  if (node.isTruncationNode) {
    return (
      <div
        role="treeitem"
        aria-label={`${node.truncatedCount} more items`}
        tabIndex={0}
        className="file-node-truncation absolute flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-[rgba(255,255,255,0.5)]"
        style={{
          left: node.x,
          top: node.y,
          width: node.width,
          height: node.height,
        }}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick(e as unknown as React.MouseEvent);
          }
        }}
      >
        <MoreHorizontalIcon size={14} />
        <span className="text-sm">+{node.truncatedCount} more</span>
      </div>
    );
  }

  return (
    <div
      role="treeitem"
      aria-expanded={isFolder ? isExpanded : undefined}
      aria-selected={isSelected}
      tabIndex={isFocused ? 0 : -1}
      className={nodeClassName}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        zIndex: isSelected || isFocused ? 3 : 2,
        backgroundColor: isSelected
          ? "rgba(59, 130, 246, 0.2)"
          : showCopyFeedback
            ? "rgba(34, 197, 94, 0.2)"
            : isHighlighted
              ? "rgba(59, 130, 246, 0.1)"
              : "rgba(26, 26, 26, 0.95)",
        border: isFocused
          ? "1px solid rgba(59, 130, 246, 0.5)"
          : isSelected
            ? "1px solid rgba(59, 130, 246, 0.3)"
            : "1px solid rgba(255, 255, 255, 0.08)",
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Folder expand/collapse chevron */}
      {isFolder && (
        <div
          className="transition-transform duration-150 ease-out"
          style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          <ChevronRight size={14} className="text-[rgba(255,255,255,0.5)]" />
        </div>
      )}

      {/* File/folder icon */}
      <Icon size={16} className="text-[rgba(255,255,255,0.5)] flex-shrink-0" />

      {/* File name */}
      <span className="flex-1 truncate text-sm text-white">
        {node.fileNode.name}
      </span>

      {/* Metadata: child count for folders, file size for files */}
      <span className="text-xs text-[rgba(255,255,255,0.5)] flex-shrink-0">
        {isFolder
          ? `(${node.fileNode.childCount ?? 0})`
          : node.fileNode.sizeFormatted}
      </span>

      {/* Copy success indicator */}
      {showCopyFeedback && (
        <CheckIcon size={14} className="text-[#22c55e] flex-shrink-0" />
      )}
    </div>
  );
});

export default FileNode;
