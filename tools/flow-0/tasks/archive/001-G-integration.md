# Sub-Task 001-G: Flow Integration

## Parent Task
001-spatial-file-viewer.md

---

## Overview

Wire the spatial file viewer into Flow as a new editor mode. Integrates with existing state management, layout system, and UI patterns.

---

## Editor Mode Integration

### Add to ViewportSlice

```typescript
// /app/stores/slices/viewportSlice.ts

// Extend EditorMode enum
export type EditorMode =
  | "normal"
  | "component-id"
  | "text-edit"
  | "comment"
  | "smart-annotate"
  | "spatial-browser";  // NEW

// Add to ViewportSlice
interface ViewportSlice {
  editorMode: EditorMode;
  setEditorMode: (mode: EditorMode) => void;
  // ...
}
```

### Mode Toggle

```typescript
// Keyboard shortcut (in useKeyboardShortcuts)
if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
  e.preventDefault();
  setEditorMode(
    editorMode === "spatial-browser" ? "normal" : "spatial-browser"
  );
}
```

---

## Combined Zustand Store

### New Slices to Add

```typescript
// /app/stores/appStore.ts

import { createFileTreeSlice, FileTreeSlice } from "./slices/fileTreeSlice";
import { createSpatialSelectionSlice, SpatialSelectionSlice } from "./slices/spatialSelectionSlice";
import { createSpatialSettingsSlice, SpatialSettingsSlice } from "./slices/spatialSettingsSlice";
import { createSpatialViewportSlice, SpatialViewportSlice } from "./slices/spatialViewportSlice";

// Extend AppState
export interface AppState
  extends ComponentIdSlice,
    TextEditSlice,
    // ... existing slices
    FileTreeSlice,           // NEW
    SpatialSelectionSlice,   // NEW
    SpatialSettingsSlice,    // NEW
    SpatialViewportSlice     // NEW
    {}

// Add to store creation
export const useAppStore = create<AppState>()(
  devtools(
    subscribeWithSelector(
      persist(
        (...args) => ({
          // ... existing slices
          ...createFileTreeSlice(...args),
          ...createSpatialSelectionSlice(...args),
          ...createSpatialSettingsSlice(...args),
          ...createSpatialViewportSlice(...args),
        }),
        {
          name: "radflow-app-store",
          partialize: (state) => ({
            // ... existing persisted state
            rootPath: state.rootPath,
            showDotfiles: state.showDotfiles,
            autoCollapsePatterns: state.autoCollapsePatterns,
          }),
        }
      )
    )
  )
);
```

---

## FileTreeSlice

```typescript
// /app/stores/slices/fileTreeSlice.ts

export interface FileTreeSlice {
  // State
  fileTree: FileNode | null;
  isLoadingTree: boolean;
  treeError: string | null;

  // Actions
  loadDirectory: (path: string) => Promise<void>;
  loadFolderChildren: (path: string) => Promise<void>;
  refreshTree: () => Promise<void>;

  // Computed
  visibleNodes: LayoutNode[];
}

export const createFileTreeSlice: StateCreator<
  AppState,
  [],
  [],
  FileTreeSlice
> = (set, get) => ({
  fileTree: null,
  isLoadingTree: false,
  treeError: null,

  loadDirectory: async (path) => {
    set({ isLoadingTree: true, treeError: null });

    try {
      const result = await commands.scanDirectory(path, get().showDotfiles);

      if (result.status === "ok") {
        set({
          fileTree: result.data.children[0] ?? null, // Root node
          rootPath: path,
          expandedPaths: new Set(),
          isLoadingTree: false,
        });
      } else {
        set({ treeError: result.error, isLoadingTree: false });
      }
    } catch (error) {
      set({ treeError: String(error), isLoadingTree: false });
    }
  },

  loadFolderChildren: async (path) => {
    try {
      const result = await commands.expandFolder(path, get().showDotfiles);

      if (result.status === "ok") {
        // Merge children into tree
        set((state) => ({
          fileTree: mergeChildren(state.fileTree, path, result.data),
        }));
      }
    } catch (error) {
      console.error("Failed to load folder:", error);
    }
  },

  refreshTree: async () => {
    const { rootPath } = get();
    if (rootPath) {
      await get().loadDirectory(rootPath);
    }
  },

  // NOTE: visibleNodes should NOT be a getter - use selector pattern in components
  // Getters don't trigger re-renders. Use useAppStore with shallow compare instead.
});

// CORRECT: Use selector pattern in components for computed values
// /app/hooks/useSpatialLayout.ts
import { shallow } from "zustand/shallow";

export function useSpatialLayout() {
  // This selector will re-run when dependencies change and trigger re-render
  const layoutNodes = useAppStore(
    (s) => {
      if (!s.fileTree) return [];
      return calculateTreeLayout(s.fileTree, s.expandedPaths, s.spatialLayoutConfig);
    },
    shallow // Use shallow compare for array result
  );

  const canvasBounds = useMemo(
    () => calculateCanvasBounds(layoutNodes, 40),
    [layoutNodes]
  );

  return { layoutNodes, canvasBounds };
}
```

---

## Layout Integration

### EditorLayout.tsx Modification

```tsx
// /app/components/layout/EditorLayout.tsx

export function EditorLayout() {
  const editorMode = useAppStore((s) => s.editorMode);

  return (
    <div className="flex flex-col h-screen">
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        <LeftPanel />

        {/* Conditional center panel */}
        {editorMode === "spatial-browser" ? (
          <SpatialCanvas />
        ) : (
          <PreviewCanvas />
        )}

        <RightPanel />
      </div>

      <StatusBar />
    </div>
  );
}
```

---

## SpatialCanvas Component

```tsx
// /app/components/spatial/SpatialCanvas.tsx

export function SpatialCanvas() {
  const { layoutNodes, canvasBounds } = useSpatialLayout();
  const selectedPaths = useAppStore((s) => s.selectedPaths);
  const highlightedPath = useAppStore((s) => s.highlightedPath);
  const focusedPath = useAppStore((s) => s.focusedPath);
  const isLoading = useAppStore((s) => s.isLoadingTree);
  const error = useAppStore((s) => s.treeError);

  // Pan state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Load default directory on mount
  useEffect(() => {
    const projectPath = useAppStore.getState().projectPath;
    if (projectPath) {
      useAppStore.getState().loadDirectory(projectPath);
    }
  }, []);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => refreshTree()} />;
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-background"
      onMouseDown={handlePanStart}
    >
      {/* Pannable container */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          width: canvasBounds.width,
          height: canvasBounds.height,
        }}
      >
        {/* Connection lines */}
        <ConnectionLines
          layoutNodes={layoutNodes}
          highlightedPaths={highlightedPath ? new Set([highlightedPath]) : new Set()}
        />

        {/* File nodes */}
        {layoutNodes.map((node) => (
          <FileNode
            key={node.id}
            node={node}
            isSelected={selectedPaths.has(node.fileNode.path)}
            isHighlighted={highlightedPath === node.fileNode.path}
            isFocused={focusedPath === node.fileNode.path}
            onToggleExpand={toggleExpanded}
            onSelect={selectPath}
            onCopyPath={copyPath}
          />
        ))}
      </div>

      {/* Controls overlay */}
      <div className="absolute top-4 left-4 z-10">
        <SpatialControls />
      </div>

      {/* Search overlay */}
      <SpatialSearch />
    </div>
  );
}
```

---

## Keyboard Shortcuts Integration

```typescript
// Add to existing useKeyboardShortcuts hook

// Spatial browser shortcuts (only when mode is active)
if (editorMode === "spatial-browser") {
  if (e.key === "ArrowUp") {
    e.preventDefault();
    moveFocusPrevious();
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    moveFocusNext();
  }
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    collapseOrMoveToParent();
  }
  if (e.key === "ArrowRight") {
    e.preventDefault();
    expandOrMoveToChild();
  }
  if (e.key === "Enter") {
    e.preventDefault();
    copySelectedPaths();
  }
  if (e.key === " ") {
    e.preventDefault();
    toggleFocusedExpand();
  }
}
```

---

## File Structure Summary

```
tools/flow/app/
├── components/
│   ├── layout/
│   │   └── EditorLayout.tsx    # MODIFIED - add mode switch
│   └── spatial/                # NEW directory
│       ├── SpatialCanvas.tsx
│       ├── FileNode.tsx
│       ├── TruncationNode.tsx
│       ├── ConnectionLines.tsx
│       ├── SpatialControls.tsx
│       └── SpatialSearch.tsx
├── stores/
│   ├── appStore.ts             # MODIFIED - add new slices
│   └── slices/
│       ├── fileTreeSlice.ts        # NEW
│       ├── spatialSelectionSlice.ts # NEW
│       ├── spatialSettingsSlice.ts # NEW
│       └── spatialViewportSlice.ts # NEW
├── hooks/
│   ├── useKeyboardShortcuts.ts # MODIFIED - add spatial shortcuts
│   ├── useSpatialLayout.ts     # NEW
│   ├── useSpatialKeyboard.ts   # NEW
│   └── useSpatialSearch.ts     # NEW
├── types/
│   └── spatial.ts              # NEW
└── utils/
    └── spatial/                # NEW directory
        ├── treeLayout.ts
        └── fuzzySearch.ts
```

---

## Acceptance Criteria

1. [ ] New "spatial-browser" editor mode
2. [ ] Cmd+B toggles between normal and spatial mode
3. [ ] SpatialCanvas replaces PreviewCanvas when active
4. [ ] All Zustand slices integrated into appStore
5. [ ] Settings persist via middleware
6. [ ] Keyboard shortcuts work in spatial mode
7. [ ] Default project directory loads on mount
8. [ ] Loading and error states display correctly
9. [ ] Existing Flow UI (TitleBar, panels) still works
10. [ ] Mode indicator shows in StatusBar

### Accessibility Criteria

11. [ ] SpatialCanvas has `role="tree"` and `aria-label="File tree"`
12. [ ] Error boundary with accessible error message
13. [ ] Loading state has `aria-busy="true"` and `aria-live="polite"`
14. [ ] `aria-live="polite"` region for copy confirmations
15. [ ] Mode toggle button has `aria-pressed` state
16. [ ] Keyboard nav: Arrow keys move focus, Enter copies, Space expands

---

## Dependencies

- All sub-tasks (001-A through 001-F, 001-H)
- Existing Flow infrastructure
