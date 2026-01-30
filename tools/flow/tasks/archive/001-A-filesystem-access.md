# Sub-Task 001-A: Rust Filesystem Commands

## Parent Task
001-spatial-file-viewer.md

---

## Overview

Tauri Rust commands for filesystem operations. Provides type-safe, performant backend for the spatial file viewer. Commands are auto-generated to TypeScript bindings via tauri-specta.

---

## Location

**Rust:** `/tools/flow/src-tauri/src/commands/spatial.rs`
**Bindings:** `/tools/flow/app/bindings.ts` (auto-generated)

---

## Commands

### 1. scan_directory

Lists immediate children of a directory (depth=1).

```rust
#[tauri::command]
#[specta::specta]
pub async fn scan_directory(
    path: String,
    show_hidden: bool,
) -> Result<DirectoryContents, String> {
    // Returns immediate children only (lazy loading)
}
```

**Response:**
```typescript
interface DirectoryContents {
  path: string;
  children: FileNode[];
  metadata: {
    totalFiles: number;
    totalFolders: number;
    totalSize: number;
    readTimeMs: number;
  };
}
```

### 2. expand_folder

Fetches children of a specific folder (on-demand expansion).

```rust
#[tauri::command]
#[specta::specta]
pub async fn expand_folder(
    path: String,
    show_hidden: bool,
) -> Result<Vec<FileNode>, String> {
    // Returns immediate children for lazy loading
}
```

### 3. search_files

Fuzzy search within a directory tree.

```rust
#[tauri::command]
#[specta::specta]
pub async fn search_files(
    root: String,
    query: String,
    max_results: u32,
    show_hidden: bool,
) -> Result<SearchResults, String> {
    // Recursive search with scoring
}
```

**Response:**
```typescript
interface SearchResults {
  query: string;
  results: SearchMatch[];
  totalMatches: number;
  truncated: boolean;
  searchTimeMs: number;
}

interface SearchMatch {
  node: FileNode;
  score: number;
  matchedIndices: number[];
}
```

### 4. watch_directory

Start/stop file system watching.

```rust
#[tauri::command]
#[specta::specta]
pub async fn start_directory_watch(
    path: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    // Emit "spatial-file-changed" events
}

#[tauri::command]
#[specta::specta]
pub async fn stop_directory_watch() -> Result<(), String> {
    // Stop watching
}
```

---

## Types

### FileNode (Rust)

```rust
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct FileNode {
    pub id: String,           // Hash of path
    pub name: String,
    pub path: String,         // Absolute path
    pub node_type: NodeType,  // File or Directory
    pub extension: Option<String>,
    pub size: u64,
    pub size_formatted: String,
    pub total_size: Option<u64>,  // For directories
    pub child_count: Option<u32>, // For directories
    pub modified: String,     // ISO timestamp
    pub is_hidden: bool,
    pub is_readable: bool,
    pub is_auto_collapsed: bool,  // node_modules, .git, etc.
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub enum NodeType {
    File,
    Directory,
}
```

### Auto-Collapse Patterns

```rust
const AUTO_COLLAPSE_DIRS: &[&str] = &[
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    "__pycache__",
    "target",
    ".turbo",
];
```

---

## Error Handling

```rust
#[derive(Debug, Serialize, Deserialize, specta::Type)]
pub enum SpatialError {
    NotFound { path: String },
    PermissionDenied { path: String },
    NotDirectory { path: String },
    IoError { message: String },
}
```

Map to HTTP-like semantics:
- `NotFound` → ENOENT
- `PermissionDenied` → EACCES
- `NotDirectory` → ENOTDIR

---

## Performance

```rust
const LIMITS: Limits = Limits {
    max_children: 1000,
    max_search_results: 500,
    max_search_depth: 10,
    timeout_ms: 30000,
};
```

**Optimizations:**
- Use `rayon` for parallel directory scanning
- Cache `child_count` and `total_size` calculations
- Early termination for search at max_results

---

## File Structure

```
src-tauri/src/
├── commands/
│   ├── mod.rs              # Export spatial module
│   └── spatial.rs          # NEW - all spatial commands
├── lib.rs                  # Register commands
└── main.rs
```

---

## Integration

### Register Commands (lib.rs)

```rust
mod commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // Existing commands...
            commands::spatial::scan_directory,
            commands::spatial::expand_folder,
            commands::spatial::search_files,
            commands::spatial::start_directory_watch,
            commands::spatial::stop_directory_watch,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Generate Bindings

```bash
# In tools/flow directory
pnpm tauri:codegen
```

---

## Acceptance Criteria

1. [ ] `scan_directory` returns immediate children with metadata
2. [ ] `expand_folder` returns children for lazy loading
3. [ ] `search_files` returns scored matches with indices
4. [ ] `start_directory_watch` emits change events
5. [ ] All commands have specta types for auto-binding
6. [ ] Error handling with typed SpatialError enum
7. [ ] Auto-collapse flag set for known heavy directories
8. [ ] Performance: <100ms for typical project root scan
9. [ ] Hidden files filtered based on `show_hidden`
10. [ ] Results sorted: directories first, then alphabetically

---

## Dependencies

- `tokio` - Async runtime (existing)
- `serde` - Serialization (existing)
- `specta` - TypeScript binding generation (existing)
- `rayon` - Parallel iteration (✅ added to Cargo.toml)
- `notify` - File watching (existing in Flow)
