# Sub-Task 001-C: FileNode Component

## Parent Task
001-spatial-file-viewer.md

---

## Overview

React component for rendering file/folder nodes on the spatial canvas. Follows Flow's component patterns and integrates with Zustand slices.

---

## Location

**Component:** `/tools/flow/app/components/spatial/FileNode.tsx`
**Types:** `/tools/flow/app/types/spatial.ts`

---

## Component Interface

```typescript
interface FileNodeProps {
  node: LayoutNode;
  isSelected: boolean;
  isHighlighted: boolean;  // Search result
  isFocused: boolean;      // Keyboard nav
  onToggleExpand: (path: string) => void;
  onSelect: (path: string, modifiers: SelectModifiers) => void;
  onCopyPath: (path: string) => void;
}

interface SelectModifiers {
  shift: boolean;
  cmd: boolean;
}
```

---

## Visual Layout

### File Node
```
┌────────────────────────────────────────┐
│  [Icon]  filename.ts            12.4KB │
└────────────────────────────────────────┘
```

### Folder Node
```
┌────────────────────────────────────────┐
│  [▶] [📁]  src/         (24) 1.2MB    │
└────────────────────────────────────────┘
      ^chevron            ^count ^size
```

### Truncation Node
```
┌──────────────────────────┐
│  [...]  +24 More Files   │
└──────────────────────────┘
```

---

## Styling (Flow Palette)

```typescript
// Match Flow's existing color system
const COLORS = {
  background: "var(--color-surface)",        // #141414
  backgroundHover: "var(--color-surface-elevated)",
  text: "var(--color-text)",                 // #ffffff
  textMuted: "var(--color-text-muted)",      // rgba(255,255,255,0.5)
  border: "var(--color-border)",             // rgba(255,255,255,0.08)
  borderHover: "rgba(255, 255, 255, 0.16)",
  borderSelected: "var(--color-primary)",    // #3b82f6
  borderHighlight: "#f59e0b",                // amber for search
  copyFlash: "#22c55e",                      // success green
};
```

---

## States

**Default:** Base styling, cursor pointer
**Hover:** Border brightens
**Selected:** Blue border + background tint (multi-select)
**Focused:** Blue focus ring (keyboard nav)
**Highlighted:** Amber border + glow + pulse (search result)
**Copy Feedback:** Green flash 400ms

### Folder Chevron Animation

```tsx
<motion.div
  animate={{ rotate: isExpanded ? 90 : 0 }}
  transition={{ duration: 0.15 }}
>
  <ChevronRight size={14} />
</motion.div>
```

---

## Behavior

### Click Handling

```typescript
const handleClick = (e: React.MouseEvent) => {
  const modifiers = { shift: e.shiftKey, cmd: e.metaKey || e.ctrlKey };

  if (node.fileNode.nodeType === "Directory") {
    if (!modifiers.shift && !modifiers.cmd) {
      onToggleExpand(node.fileNode.path);
    } else {
      onSelect(node.fileNode.path, modifiers);
    }
  } else {
    onSelect(node.fileNode.path, modifiers);
    if (!modifiers.shift && !modifiers.cmd) {
      onCopyPath(node.fileNode.path);
    }
  }
};
```

### Truncation Node

```typescript
const handleTruncationClick = () => {
  // Load next batch (increase maxVisibleChildren for this folder)
  loadMoreChildren(node.fileNode.path);
};
```

---

## Icons (Lucide)

```typescript
import {
  Folder, FileCode, FileJson, FileText, File,
  ChevronRight, MoreHorizontal, Check
} from "lucide-react";

const FILE_ICONS: Record<string, LucideIcon> = {
  folder: Folder,
  ts: FileCode,
  tsx: FileCode,
  js: FileCode,
  jsx: FileCode,
  json: FileJson,
  md: FileText,
  default: File,
};

function getIcon(node: FileNode): LucideIcon {
  if (node.nodeType === "Directory") return Folder;
  return FILE_ICONS[node.extension ?? ""] ?? FILE_ICONS.default;
}
```

---

## Implementation

```tsx
export function FileNode({
  node,
  isSelected,
  isHighlighted,
  isFocused,
  onToggleExpand,
  onSelect,
  onCopyPath,
}: FileNodeProps) {
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const isFolder = node.fileNode.nodeType === "Directory";
  const isExpanded = !node.isCollapsed;
  const Icon = getIcon(node.fileNode);

  const handleCopy = async (path: string) => {
    await navigator.clipboard.writeText(path);
    setShowCopyFeedback(true);
    setTimeout(() => setShowCopyFeedback(false), 400);
    onCopyPath(path);
  };

  if (node.isTruncationNode) {
    return <TruncationNode count={node.truncatedCount!} onClick={...} />;
  }

  return (
    <motion.div
      className={cn(
        "absolute flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer",
        "bg-surface border border-border transition-colors",
        isSelected && "border-primary bg-primary/10",
        isHighlighted && "border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]",
        isFocused && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        showCopyFeedback && "bg-success/20 border-success"
      )}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
      }}
      onClick={handleClick}
      animate={isHighlighted ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 1.5, repeat: 1 }}
    >
      {/* Chevron for folders */}
      {isFolder && (
        <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
          <ChevronRight size={14} className="text-text-muted" />
        </motion.div>
      )}

      {/* Icon */}
      <Icon size={16} className="text-text-muted flex-shrink-0" />

      {/* Name */}
      <span className="flex-1 truncate text-sm text-text">
        {node.fileNode.name}
      </span>

      {/* Size/Count */}
      <span className="text-xs text-text-muted flex-shrink-0">
        {isFolder
          ? `(${node.fileNode.childCount}) ${node.fileNode.sizeFormatted}`
          : node.fileNode.sizeFormatted}
      </span>

      {/* Copy feedback */}
      {showCopyFeedback && (
        <Check size={14} className="text-success flex-shrink-0" />
      )}
    </motion.div>
  );
}
```

---

## Acceptance Criteria

1. [ ] Renders file nodes with icon, name, size
2. [ ] Renders folder nodes with chevron, child count, total size
3. [ ] Chevron animates on expand/collapse
4. [ ] Click file → copy path + visual feedback
5. [ ] Click folder → expand/collapse
6. [ ] Shift/Cmd+click → multi-select
7. [ ] Selected state: blue border
8. [ ] Highlighted state: amber + pulse (search)
9. [ ] Focused state: focus ring (keyboard)
10. [ ] Truncation node renders correctly
11. [ ] Uses Flow's color system
12. [ ] Uses Lucide icons

### Accessibility Criteria

13. [ ] `role="treeitem"` on each node
14. [ ] `aria-expanded` on folder nodes (true/false based on expand state)
15. [ ] `aria-selected` reflects selection state
16. [ ] `tabIndex={isFocused ? 0 : -1}` for roving tabindex
17. [ ] Visible focus ring (2px primary color, offset)
18. [ ] Copy confirmation via `aria-live="polite"` region (in parent)

---

## Dependencies

- `framer-motion` (existing in Flow)
- `lucide-react` (existing in Flow)
- `clsx` or `cn` utility (existing in Flow)
