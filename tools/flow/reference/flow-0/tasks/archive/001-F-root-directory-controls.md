# Sub-Task 001-F: Spatial Controls

## Parent Task
001-spatial-file-viewer.md

---

## Overview

Control panel for the spatial file viewer: path input, dotfile toggle, auto-collapse settings. Lives in Flow's existing panel structure.

---

## Location

**Component:** `/tools/flow/app/components/spatial/SpatialControls.tsx`
**Slice:** `/tools/flow/app/stores/slices/spatialSettingsSlice.ts`

---

## Zustand Slice

```typescript
// /app/stores/slices/spatialSettingsSlice.ts
import { StateCreator } from "zustand";

export interface SpatialSettingsSlice {
  // State
  rootPath: string;
  showDotfiles: boolean;
  autoCollapsePatterns: string[];
  expandedPaths: Set<string>;

  // Actions
  setRootPath: (path: string) => void;
  toggleDotfiles: () => void;
  setAutoCollapsePatterns: (patterns: string[]) => void;
  toggleExpanded: (path: string) => void;
  expandPath: (path: string) => void;
  collapsePath: (path: string) => void;
  collapseAll: () => void;
}

const DEFAULT_AUTO_COLLAPSE = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "__pycache__",
  "target",
];

export const createSpatialSettingsSlice: StateCreator<
  AppState,
  [],
  [],
  SpatialSettingsSlice
> = (set, get) => ({
  rootPath: "",
  showDotfiles: false,
  autoCollapsePatterns: DEFAULT_AUTO_COLLAPSE,
  expandedPaths: new Set(),

  setRootPath: (path) => {
    set({ rootPath: path, expandedPaths: new Set() });
    // Trigger scan_directory command
    get().loadDirectory(path);
  },

  toggleDotfiles: () => {
    set((state) => ({ showDotfiles: !state.showDotfiles }));
  },

  setAutoCollapsePatterns: (patterns) => {
    set({ autoCollapsePatterns: patterns });
  },

  toggleExpanded: (path) => {
    set((state) => {
      const next = new Set(state.expandedPaths);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
        // Trigger lazy load
        get().loadFolderChildren(path);
      }
      return { expandedPaths: next };
    });
  },

  expandPath: (path) => {
    set((state) => {
      const next = new Set(state.expandedPaths);
      next.add(path);
      return { expandedPaths: next };
    });
    get().loadFolderChildren(path);
  },

  collapsePath: (path) => {
    set((state) => {
      const next = new Set(state.expandedPaths);
      next.delete(path);
      return { expandedPaths: next };
    });
  },

  collapseAll: () => {
    set({ expandedPaths: new Set() });
  },
});
```

---

## Component

```tsx
import { open } from '@tauri-apps/plugin-dialog';

export function SpatialControls() {
  const rootPath = useAppStore((s) => s.rootPath);
  const setRootPath = useAppStore((s) => s.setRootPath);
  const showDotfiles = useAppStore((s) => s.showDotfiles);
  const toggleDotfiles = useAppStore((s) => s.toggleDotfiles);
  const [inputValue, setInputValue] = useState(rootPath);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRootPath(inputValue);
  };

  // Open native folder picker dialog
  const handleBrowse = async () => {
    const folder = await open({
      directory: true,
      multiple: false,
      title: "Select project directory",
    });
    if (folder && typeof folder === 'string') {
      setInputValue(folder);
      setRootPath(folder);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-surface rounded-lg border border-border">
      {/* Path Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter directory path..."
          className="flex-1 px-3 py-2 bg-background border border-border rounded text-sm text-text placeholder:text-text-muted"
        />
        <button
          type="button"
          onClick={handleBrowse}
          className="px-3 py-2 bg-surface-elevated border border-border rounded text-sm text-text hover:bg-surface-hover"
        >
          <Folder size={14} />
        </button>
        {inputValue && (
          <button
            type="button"
            onClick={() => setInputValue("")}
            className="px-2 text-text-muted hover:text-text"
          >
            <X size={14} />
          </button>
        )}
      </form>

      {/* Dotfile Toggle */}
      <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
        <input
          type="checkbox"
          checked={showDotfiles}
          onChange={toggleDotfiles}
          className="rounded border-border"
        />
        Show dotfiles
      </label>

      {/* Auto-collapse Settings */}
      <AutoCollapseSettings />
    </div>
  );
}
```

---

## Auto-Collapse Settings

```tsx
function AutoCollapseSettings() {
  const patterns = useAppStore((s) => s.autoCollapsePatterns);
  const setPatterns = useAppStore((s) => s.setAutoCollapsePatterns);
  const [isOpen, setIsOpen] = useState(false);
  const [newPattern, setNewPattern] = useState("");

  const addPattern = () => {
    if (newPattern && !patterns.includes(newPattern)) {
      setPatterns([...patterns, newPattern]);
      setNewPattern("");
    }
  };

  const removePattern = (pattern: string) => {
    setPatterns(patterns.filter((p) => p !== pattern));
  };

  const resetDefaults = () => {
    setPatterns(DEFAULT_AUTO_COLLAPSE);
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text"
      >
        <Settings size={14} />
        Auto-collapse settings
        <ChevronDown size={14} className={isOpen ? "rotate-180" : ""} />
      </button>

      {isOpen && (
        <div className="mt-2 p-2 bg-background rounded border border-border">
          {/* Pattern chips */}
          <div className="flex flex-wrap gap-1 mb-2">
            {patterns.map((pattern) => (
              <span
                key={pattern}
                className="flex items-center gap-1 px-2 py-1 bg-surface rounded text-xs text-text"
              >
                {pattern}
                <button onClick={() => removePattern(pattern)}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          {/* Add pattern */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              placeholder="Add pattern..."
              className="flex-1 px-2 py-1 bg-surface border border-border rounded text-xs"
              onKeyDown={(e) => e.key === "Enter" && addPattern()}
            />
            <button
              onClick={addPattern}
              className="px-2 py-1 bg-primary text-white rounded text-xs"
            >
              Add
            </button>
          </div>

          {/* Reset */}
          <button
            onClick={resetDefaults}
            className="mt-2 text-xs text-text-muted hover:text-text"
          >
            Reset to defaults
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Persistence

Uses Zustand's persist middleware (already configured in Flow):

```typescript
// In appStore.ts persist config
partialize: (state) => ({
  // ... existing persisted state
  rootPath: state.rootPath,
  showDotfiles: state.showDotfiles,
  autoCollapsePatterns: state.autoCollapsePatterns,
  // Note: expandedPaths not persisted (resets on load)
}),
```

---

## Acceptance Criteria

1. [ ] Path input with submit on Enter
2. [ ] Clear button clears input
3. [ ] **Browse button opens native folder picker via `@tauri-apps/plugin-dialog`**
4. [ ] Dotfile toggle checkbox
5. [ ] Auto-collapse settings expandable
6. [ ] Add/remove patterns
7. [ ] Reset to defaults button
8. [ ] Settings persist via Zustand middleware
9. [ ] Uses Flow's styling system
10. [ ] Integrates with existing Flow panels

### Accessibility Criteria

11. [ ] Path input has `aria-label="Directory path"`
12. [ ] Browse button has `aria-label="Browse for folder"`
13. [ ] Clear button has `aria-label="Clear path"`
14. [ ] Dotfile toggle is a proper `<input type="checkbox">` with label
15. [ ] Auto-collapse section uses `<details>`/`<summary>` or has `aria-expanded`
16. [ ] Pattern chips have remove button with `aria-label="Remove {pattern}"`

---

## Dependencies

- Zustand (existing in Flow)
- Lucide icons (existing in Flow)
- `@tauri-apps/plugin-dialog` (✅ already configured in tauri.conf.json and Cargo.toml)
