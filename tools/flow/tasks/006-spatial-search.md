# Task 006: Spatial Search

## Overview

Fuzzy search across the file tree with canvas navigation. This is a core feature of the spatial file viewer, enabling quick file discovery and context building for AI workflows.

**Note:** Extracted from 001-H. Search is a significant feature that warrants its own epic due to scope and importance for the overall app experience.

---

## Prerequisites

- Spatial File Viewer MVP complete (001-0 through 001-G)
- File tree loaded and navigable
- Basic keyboard shortcuts working

---

## Core Features

### 1. Search Overlay (Cmd+K Style)

- **Trigger:** Cmd+F when in spatial-browser mode
- **UI:** Centered overlay with dark backdrop
- **Auto-focus:** Input focused immediately on open
- **Dismiss:** Escape key or click outside

### 2. Fuzzy Search Algorithm

```typescript
interface SearchMatch {
  node: FileNode;
  score: number;
  matchedIndices: number[];  // For highlighting
  pathSegments: string[];    // Breadcrumb display
}

// Scoring factors:
// - Consecutive character matches bonus
// - Start of word/filename bonus
// - Shorter path length preference
// - Extension match bonus
```

### 3. Results Display

- **Max results:** 50 for performance
- **Result row:** Icon + highlighted filename + parent path breadcrumb
- **Selected state:** Arrow key navigation with visual indicator
- **Empty state:** "No files matching {query}"

### 4. Navigation on Select

When user selects a result:
1. **Expand ancestors** - All parent folders auto-expand
2. **Pan canvas** - Center the found node in viewport
3. **Highlight pulse** - 1.5s amber glow animation
4. **Close search** - Overlay dismisses
5. **Set focus** - Found node becomes focused

---

## Rust Backend

### search_files Command

```rust
#[tauri::command]
fn search_files(
    root: String,
    query: String,
    max_results: Option<u32>,
    show_hidden: bool,
) -> Result<SearchResults, SpatialError> {
    // Recursive search with early termination
    // Returns FileNode matches with score
}
```

### Caching Strategy

- Cache file tree metadata in memory
- Incremental updates via watcher
- Search operates on cached data for speed

---

## UI Components

### SpatialSearch.tsx

```tsx
// /app/components/spatial/SpatialSearch.tsx
export function SpatialSearch() {
  // Overlay with input + results list
  // Keyboard navigation (arrow keys, Enter, Escape)
  // Debounced query (300ms)
}
```

### SearchResultRow.tsx

```tsx
// Individual result with icon, highlighted text, path
function SearchResultRow({ result, isSelected, onClick }) {
  // HighlightedText for matched characters
  // File icon based on extension
  // Parent path breadcrumb
}
```

### HighlightedText.tsx

```tsx
// Renders text with matched indices highlighted
function HighlightedText({ text, indices }) {
  // Green/accent color for matched chars
}
```

---

## Zustand State

Add to spatialViewportSlice or create dedicated searchSlice:

```typescript
interface SpatialSearchState {
  searchQuery: string;
  searchResults: SearchMatch[];
  selectedResultIndex: number;
  isSearchOpen: boolean;
}

interface SpatialSearchActions {
  openSearch: () => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;
  selectNextResult: () => void;
  selectPreviousResult: () => void;
  navigateToResult: (result: SearchMatch) => void;
}
```

---

## Acceptance Criteria

### Core Functionality
- [ ] Cmd+F opens search overlay in spatial-browser mode
- [ ] Fuzzy search matches filenames across entire tree
- [ ] Results show highlighted matched characters
- [ ] Arrow keys navigate results list
- [ ] Enter selects and navigates to result
- [ ] Escape closes search
- [ ] Parent folders auto-expand when result selected
- [ ] Canvas pans to center selected node
- [ ] Selected node pulses with highlight animation

### Performance
- [ ] Debounced input (300ms) to reduce search calls
- [ ] Max 50 results for rendering performance
- [ ] Search completes in <100ms for typical projects

### Empty States
- [ ] "No results" message when query returns nothing
- [ ] Clear button to reset query

### Accessibility
- [ ] Search dialog has `role="dialog"` and `aria-modal="true"`
- [ ] Input has `aria-label="Search files"`
- [ ] Results list has `role="listbox"`
- [ ] Each result has `role="option"` and `aria-selected`
- [ ] `aria-activedescendant` tracks selected result
- [ ] Result count announced: `aria-live="polite"` with "{n} results"
- [ ] Focus trapped in dialog while open
- [ ] Focus returns to trigger element on close

---

## File Structure

```
app/
├── components/spatial/
│   ├── SpatialSearch.tsx      # Main search overlay
│   ├── SearchResultRow.tsx    # Individual result row
│   └── HighlightedText.tsx    # Text with match highlighting
├── hooks/
│   └── useSpatialSearch.ts    # Search logic hook
└── utils/spatial/
    └── fuzzySearch.ts         # Client-side fuzzy matching
```

---

## Future Enhancements

- Content search (grep-style, inside files)
- Recent searches history
- Search filters (by extension, size, date)
- Glob pattern support
- Integration with global command palette
