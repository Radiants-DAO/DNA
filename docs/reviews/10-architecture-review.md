# fn-8.1 Review: 10-tauri-architecture.md - Rust Backend

**Date:** 2026-01-16
**Reviewer:** Claude Code
**Status:** COMPLETE - Spec mapped to implementation
**Completion:** 33% spec commands (7/21 from spec + 15 extra commands beyond spec)

---

## Executive Summary

The Rust backend implements **7 of 21 specified Tauri commands (33%)** from the spec, plus **15 extra commands** not in the spec (total: 22 commands). The implementation uses modern patterns with tauri-specta for TypeScript binding generation and demonstrates solid understanding of the underlying crates (lightningcss, SWC, notify). Key gaps are around git operations (deferred to CLI per CLAUDE.md), search indexing (simplified to in-memory fuzzy matching), and theme management (not started).

**Note:** The 33% reflects spec compliance only. The implementation has evolved beyond the spec with useful features like violation detection and dev server management that weren't originally planned.

**Key Finding:** The spec recommends git2 and tantivy crates, but [CLAUDE.md](../../CLAUDE.md) (source of truth) specifies git CLI and fuzzy-matcher instead. Implementation follows CLAUDE.md correctly. The architecture spec is outdated on these points.

---

## Command Mapping vs. Spec

### File Commands ✅ PARTIAL (2/5 spec + 1 extra)

| Spec Command | Implementation | Status | Notes |
|--------------|----------------|--------|-------|
| `read_file` | - | ❌ NOT FOUND | Spec defines this; not implemented |
| `write_file` | - | ❌ NOT FOUND | Spec defines this; not implemented |
| `list_directory` | - | ❌ NOT FOUND | Spec defines this; not implemented |
| `watch_start` | `start_watcher` | ✅ EXISTS | Uses notify with debouncing |
| `watch_stop` | `stop_watcher` | ✅ EXISTS | Properly stops watcher |
| - | `get_watched_path` | ✅ EXTRA | Not in spec but useful |

**Analysis:**
- The spec defines generic file operations (`read_file`, `write_file`, `list_directory`) but implementation skips these
- Likely reason: These are simple filesystem operations that may not need Rust (can use JS/Tauri plugins)
- Watcher implementation is solid: debouncing with configurable polling interval (100ms), extension filtering (css/tsx only)

---

### Parser Commands ✅ GOOD (5/7 spec)

| Spec Command | Implementation | Status | Notes |
|--------------|----------------|--------|-------|
| `parse_css` | `parse_tokens` | ✅ MAPPED | Lightningcss parsing @theme blocks |
| `extract_tokens` | (builtin to parse_tokens) | ✅ INTEGRATED | Returns ThemeTokens struct |
| `update_token` | - | ❌ NOT FOUND | Spec defines token updates |
| `serialize_css` | (implicit in parse_tokens) | ⚠️ PARTIAL | Parse only; no serialization yet |
| `parse_component` | `parse_component` | ✅ MAPPED | SWC-based TSX parsing |
| `extract_props` | (builtin to parse_component) | ✅ INTEGRATED | Returns ComponentInfo with props |
| `find_variants` | (builtin to parse_component) | ✅ INTEGRATED | Extracts union types as variants |

**Analysis:**
- CSS parsing correctly identifies @theme and @theme inline blocks, extracts tokens with proper type handling (colors, lengths, functions, var references)
- TSX parsing is sophisticated: extracts props interfaces, union types, default values, line numbers, export detection
- Missing: token update/serialization (spec item that would be needed for save operations)
- Test coverage is good for parsing; no update tests

**Code Quality Notes:**
- Component extractor handles multiple component patterns (exported functions, default exports, local declarations)
- Proper error handling with source map line tracking
- Both modules have unit tests with good coverage

---

### Git Commands ❌ NOT IMPLEMENTED (0/5 spec)

| Spec Command | Implementation | Status | Notes |
|--------------|----------------|--------|-------|
| `git_status` | - | ❌ NOT FOUND | Spec requires git2-rs |
| `git_commit` | - | ❌ NOT FOUND | Spec requires git2-rs |
| `git_fetch` | - | ❌ NOT FOUND | Spec requires git2-rs |
| `git_diff` | - | ❌ NOT FOUND | Spec requires git2-rs |
| `git_log` | - | ❌ NOT FOUND | Spec requires git2-rs |

**Analysis:**
- CLAUDE.md explicitly drops git2 in favor of git CLI
- No git commands found in implementation
- This is **correct per CLAUDE.md** but **violates 10-tauri-architecture.md**
- CCER: Spec conflict between docs/features/10-tauri-architecture.md (git2) and CLAUDE.md (git CLI)

---

### Project Commands ⚠️ REWORKED (0/4 spec + 2 extra)

| Spec Command | Implementation | Status | Notes |
|--------------|----------------|--------|-------|
| `index_project` | - | ❌ NOT FOUND | Would require comprehensive indexing |
| `search_project` | - | ❌ NOT FOUND | Search uses in-memory fuzzy-matcher |
| `get_component` | - | ❌ NOT FOUND | Implied by scan_components |
| `list_components` | - | ❌ NOT FOUND | Use `scan_components` instead |
| - | `detect_project` | ✅ EXTRA | Not in spec |
| - | `scan_components` | ✅ EXTRA | Returns all components in dir |

**Analysis:**
- Spec defines higher-level indexing/search API
- Implementation uses practical alternative: `scan_components` for discovery
- This is a reasonable simplification given that tantivy was dropped for fuzzy-matcher
- CCER: Missing comprehensive project index builder (needed for large projects; current approach scans on-demand)

---

### Theme Commands ❌ NOT IMPLEMENTED (0/4 spec)

| Spec Command | Implementation | Status | Notes |
|--------------|----------------|--------|-------|
| `list_themes` | - | ❌ NOT FOUND | Spec defines theme management |
| `get_current_theme` | - | ❌ NOT FOUND | Spec defines theme state |
| `switch_theme` | - | ❌ NOT FOUND | Spec defines theme switching |
| `save_theme` | - | ❌ NOT FOUND | Spec defines theme persistence |

**Analysis:**
- Theme commands completely absent from implementation
- This is a Phase 4+ feature (not Phase 1-3)
- The `parse_tokens` command extracts tokens but doesn't manage theme switching/persistence
- CCER: Theme module not yet implemented

---

### Extra Commands (15 beyond spec - NOT counted in spec compliance)

| Command | Purpose | Status |
|---------|---------|--------|
| `greet` | Test command | ✅ DEMO |
| `get_version` | Version info | ✅ USEFUL |
| `validate_project` | Project validation | ✅ USEFUL |
| `scan_violations` | Design violation detection | ✅ NEW FEATURE |
| `detect_violations` | Violation scanning | ✅ NEW FEATURE |
| `write_text_change` | Text editing | ✅ NEW FEATURE |
| `get_file_info` | File metadata | ✅ NEW FEATURE |
| `revert_text_change` | Undo text edits | ✅ NEW FEATURE |
| `start_dev_server` | Dev server management | ✅ NEW FEATURE |
| `stop_dev_server` | Stop dev server | ✅ NEW FEATURE |
| `get_dev_server_status` | Server status | ✅ NEW FEATURE |
| `get_dev_server_logs` | Server logs | ✅ NEW FEATURE |
| `check_dev_server_health` | Health check | ✅ NEW FEATURE |
| `preview_style_edits` | Diff preview | ✅ NEW FEATURE |
| `write_style_edits` | Batch write edits | ✅ NEW FEATURE |
| `restore_from_backup` | Revert batch edits | ✅ NEW FEATURE |

**Analysis:**
- 15 extra commands not in spec but implemented (mostly violation detection and dev server management)
- These suggest the implementation has evolved beyond the 10-tauri-architecture.md spec
- Extra features are reasonable extensions (design violations, dev server support)

---

## IPC Pattern Quality ✅ EXCELLENT

### tauri-specta Usage

All commands use the modern tauri-specta pattern:

```rust
#[tauri::command]
#[specta::specta]
pub fn command_name(arg: Type) -> Result<ReturnType, String> {
    // implementation
}
```

**Strengths:**
- Automatic TypeScript binding generation (`../src/bindings.ts`)
- Type safety across IPC boundary
- Debug builds export bindings
- All return types are serializable (serde::Serialize + specta::Type)

**Evidence:** `/src-tauri/src/lib.rs` lines 122-146 collect all commands correctly

---

## Crate Usage Analysis

### lightningcss ✅ WELL USED

**tokens.rs analysis:**
- Correctly parses CSS into AST via `StyleSheet::parse()`
- Handles @theme at-rules via `CssRule::Unknown`
- Extracts token/value pairs from rule block
- Type-aware serialization:
  - Colors: RGB hex or rgba() format
  - Lengths: px, rem, em, vw, vh
  - CSS variables: var(name) format
  - Functions: function_name(...) placeholder
  - Numbers, identifiers, strings with proper quoting

**Test Coverage:** 3 tests covering theme blocks, empty files, no-theme files

**Gap:** No token update/serialization (spec `update_token` + `serialize_css` not implemented)

---

### SWC (swc_ecma_parser) ✅ WELL USED

**components.rs analysis:**
- Full TypeScript/TSX parser with error handling
- Extracts:
  - Function components (PascalCase names)
  - Props interfaces with type annotations
  - Union type aliases (variants)
  - Default values from destructuring
  - Line numbers for all entities
  - Export status (default vs named)

**Complex Type Handling:**
- Type references with generics: `Button<T, U>`
- Union types: `A | B | C`
- Qualified names: `React.ReactNode`
- Function types: `(arg: T) => U`
- Array types: `T[]`
- Literal types: `'primary' | 'secondary'`

**Test Coverage:** 2 tests with good assertions on variants, defaults, line tracking

**Strengths:**
- Recursive directory scanning with pattern matching
- Skips node_modules and hidden directories
- Graceful error handling (skips unparseable files)
- Detailed component extraction

---

### notify ✅ WELL USED

**watcher.rs analysis:**
- ConfigDebouncing with 100ms poll interval prevents rapid re-parsing
- Extension filtering: only watches .css and .tsx files
- Recursive directory watching setup
- Proper state management with Arc<Mutex<>>
- Event filtering with conversion to custom FileEvent enum
- Emits to frontend via `app.emit("file-changed", event)`

**Strengths:**
- Thread-safe state management
- Clean error handling for lock poisoning
- Tests verify extension filtering and event conversion

**Gap:** No mention of cross-platform file watcher differences (spec notes this as risk)

---

## File Structure & Organization ✅ GOOD

Matches spec layout (mostly):

```
src-tauri/src/
├── lib.rs              ✅ Commands registration + entry point
├── main.rs             ✅ Tauri app setup
├── types/mod.rs        ✅ Shared types
├── commands/
│   ├── mod.rs          ✅ Module exports
│   ├── components.rs   ✅ TSX parsing
│   ├── tokens.rs       ✅ CSS parsing
│   ├── watcher.rs      ✅ File watching
│   ├── project.rs      ✅ Project detection
│   ├── dev_server.rs   ✅ Dev server management
│   ├── file_write.rs   ✅ Batch file writing
│   ├── text_edit.rs    ✅ Text editing (new)
│   └── violations.rs   ✅ Violation detection (new)
```

One missing per spec:
- `/commands/git.rs` — Git operations (deferred to CLI)
- `/commands/theme.rs` — Theme management (not started)

---

## State Management ✅ GOOD

Uses Tauri's `State<T>` pattern correctly:

**WatcherState:**
- Arc<Mutex<Option<RecommendedWatcher>>> for current watcher
- Arc<Mutex<Option<String>>> for watched path
- Proper lock/unlock in commands
- Default to None (no watcher initially)

**DevServerState:**
- Arc<Mutex<Option<DevServerProcess>>> for child process
- Arc<Mutex<ServerStatus>> for current status
- Thread-safe process management

**Pattern:** Shared mutable state via `tauri::manage()` in main (lib.rs:161-162)

---

## Type System ✅ STRONG

All exported types derive necessary traits:

```rust
#[derive(Serialize, Deserialize, Type)]
```

**Key Types:**
- `ComponentInfo` — Component metadata
- `PropInfo` — Prop details with defaults
- `UnionTypeInfo` — Variant definitions
- `ThemeTokens` — Token collections
- `FileEvent` — Watcher events (tagged enum)
- `ViolationInfo` — Design violations
- `ServerStatus` — Dev server states
- `ProjectInfo` — Project detection results

All use serde rename attributes for camelCase TS bindings ✅

---

## Error Handling ⚠️ BASIC

Pattern: Return `Result<T, String>` with error messages

**Issues:**
- String errors lose error type information
- Better: Use custom error enum or `tauri::error::Error`
- Makes error recovery on frontend difficult
- No structured error codes for specific failures

**Example Fix:**
```rust
#[derive(Serialize, Type)]
pub enum CommandError {
    PathNotFound(String),
    ParseFailed(String),
    IoError(String),
}
pub fn command() -> Result<T, CommandError>
```

---

## Testing Coverage ✅ GOOD

**tokens.rs:**
- test_parse_theme_tokens (inline + public tokens)
- test_parse_empty_css
- test_parse_no_theme_blocks

**components.rs:**
- test_parse_button_component (complex props, variants, defaults)
- test_line_number_tracking

**watcher.rs:**
- test_has_watched_extension (CSS, TSX, rejection of others)
- test_event_to_file_events_filters_extensions

**project.rs:**
- test_extract_dev_port_with_p_flag
- test_extract_dev_port_with_port_flag
- test_extract_dev_port_default
- test_extract_dev_port_no_script
- test_package_manager_commands

**Total:** 12 unit tests with reasonable coverage of core parsing/filtering logic

**Gap:** Integration tests with actual Tauri commands; no end-to-end test

---

## Performance Considerations ⚠️ NEEDS REVIEW

**Potential Issues:**

1. **Component Scanning (components.rs:427-438)**
   - Recursive scan of entire directory tree
   - Parses every .tsx file
   - **Risk:** Slow on projects with thousands of components
   - **Mitigation:** Needed: Incremental indexing or caching

2. **Watcher Debouncing (watcher.rs:92)**
   - 100ms poll interval may miss rapid changes
   - Alternative: Use OS-native file events (inotify/FSEvents) instead of polling
   - notify defaults to OS-native; poll_interval may override

3. **Token Parsing (tokens.rs:13-170)**
   - Full AST traversal for every CSS file
   - No token caching mentioned
   - **Impact:** Re-parsing on every change could be slow for large CSS files

**Recommendation:** Benchmark with realistic project sizes before Phase 2:
- Small project: 50 components, 5 CSS files (target: <100ms scan)
- Medium project: 500 components, 20 CSS files (target: <500ms scan)
- Large project: 2000+ components, 50+ CSS files (target: <2s scan)

If targets not met, implement incremental indexing with file hash caching.

---

## Security Considerations ✅ GOOD

**Path Safety (file_write.rs:91-134):**
- Canonicalizes paths to resolve symlinks
- Checks containment within project root
- Blocks writes to node_modules/ and .git/
- Validates against path traversal attacks

**Code Injection:** None found (all external input properly parsed/typed)

---

## Gaps Between Spec & Implementation

### CCER Entries (Critical, Could affect Execution/Review)

| Priority | Item | Spec | Implementation | Impact |
|----------|------|------|-----------------|--------|
| P0 | **Token Updates** | update_token + serialize_css | Not implemented | **Blocks edit workflow** - Parsing works but can't save changes |
| P1 | **Git Operations** | git2-rs commands (git_status, git_commit, etc.) | Not implemented; deferred to CLI per CLAUDE.md | Spec conflict - Implementation correctly follows CLAUDE.md |
| P2 | **Theme System** | 4 theme commands (list, get, switch, save) | Not implemented | Phase 4+ feature - Not started |
| P2 | **File Operations** | read_file, write_file, list_directory | Not implemented | Likely handled by Tauri FS plugin |
| P3 | **Project Index** | index_project + search_project | scan_components as alternative | Practical simplification; fuzzy matching sufficient |
| P3 | **Search** | tantivy full-text search | Not implemented; deferred to fuzzy-matcher per CLAUDE.md | CLAUDE.md deviation - Simpler approach sufficient |

---

## Alignment with CLAUDE.md Principles

| Principle | Status | Evidence |
|-----------|--------|----------|
| **Specs are source of truth** | ✅ PARTIAL | Following CLAUDE.md (git CLI, fuzzy-matcher) but 10-architecture.md has conflicting crate choices |
| **POC first** | ✅ YES | lightningcss, SWC, notify all have working POCs with tests |
| **Rust does heavy lifting** | ✅ YES | Parsing, file watching, violation detection all in Rust |
| **React for UI** | ⚠️ N/A | Can't assess without seeing React code |
| **Git is save** | ❌ NO | No git integration yet (deferred to CLI) |
| **Scrollable grid > canvas** | ⚠️ N/A | Canvas components not implemented yet |

---

## Implementation Maturity

**Phase Alignment (from spec section 'Migration Path'):**
- **Phase 1: Tauri Shell** — ✅ DONE (entry point, command registration, state management working)
- **Phase 2: Native Filesystem** — ⚠️ PARTIAL (watcher working; basic read/write not found; might be in FS plugin)
- **Phase 3: Native Parsers** — ✅ DONE (CSS and TSX parsing with tests)
- **Phase 4: Git Integration** — ❌ NOT STARTED (deferred to CLI per CLAUDE.md)
- **Phase 5: Project Index** — ⚠️ PARTIAL (scan_components works; comprehensive indexing not built)
- **Phase 6: Canvas Editor** — ❌ NOT STARTED

**Overall:** Matches Phase 1-3 well; extra work on dev server and violations detection

---

## Recommendations

### Immediate (before Phase 2 completion)
1. **Resolve spec conflict:** Update 10-tauri-architecture.md to reflect git CLI approach and fuzzy-matcher (not git2 or tantivy)
2. **Implement token updates:** Add `update_token_value()` command for edit workflow
3. **Add performance tests:** Benchmark component scanning with 1000+ component projects
4. **Document error mapping:** Define how Rust errors map to frontend error codes

### Short-term (Phase 3-4)
1. **Theme system:** Implement 4 theme commands for phase 4
2. **Git CLI wrapper:** Implement git status, commit, fetch, diff via process spawning
3. **Incremental indexing:** Add caching/change tracking to avoid full rescans
4. **Cross-platform testing:** Test file watcher on Windows, macOS, Linux

### Technical Debt
1. Replace `Result<T, String>` with structured error types
2. Add integration tests for Tauri commands (currently unit tests only)
3. Document deviation from spec in CLAUDE.md

---

## Conclusion

The Rust backend implementation is **solid for its current scope** but has **lower spec compliance (33%) than initially apparent**. The architecture correctly uses tauri-specta for type-safe IPC, demonstrates competent use of lightningcss and SWC for parsing, and properly manages state with Arc<Mutex<>>. However, many spec commands are either not implemented or replaced with different approaches.

**Key achievements:**
- 22 total commands implemented (7 from spec + 15 extra beyond spec)
- 12 unit tests with good coverage
- Modern Tauri 2.0 patterns (specta, plugin architecture)
- Type-safe IPC with automatic TS bindings
- Solid error handling and path validation
- Useful extras: violation detection, dev server management

**Key gaps:**
- Git operations: 0/5 (deferred to CLI per CLAUDE.md)
- Theme system: 0/4 (Phase 4+ feature)
- Token updates: 0/2 (blocks edit workflow - P0 priority)
- File operations: 0/3 (may use Tauri FS plugin)

**Recommendation:** The implementation has evolved in a different direction than the spec. Before Phase 4+ work, **update 10-tauri-architecture.md** to reflect:
1. Actual crate choices (git CLI, fuzzy-matcher)
2. Extra commands that have been added
3. Commands that were descoped or replaced

---

## Completion Metrics

- **Spec Commands Implemented:** 7/21 from spec (33%)
  - File: 2/5 (watch_start, watch_stop)
  - Parser: 5/7 (parse_css, extract_tokens, parse_component, extract_props, find_variants)
  - Git: 0/5 (deferred to CLI)
  - Project: 0/4 (replaced with scan_components)
  - Theme: 0/4 (not started)
- **Extra Commands (beyond spec):** 15 commands (violation detection, dev server, text edit, file write)
- **Total Commands:** 22 (7 spec + 15 extra)
- **Phase 1-3 Completeness:** ~60% (core parsing works, but missing token updates, file ops)
- **Test Coverage:** 12 unit tests across 4 modules
- **Type Safety:** 100% (all exported types properly derive Serialize + specta::Type)
- **Code Quality:** Good (proper error handling, state management, path validation)
- **Performance Risk:** Medium (component scanning could be optimized; no caching)
- **Security:** Good (path canonicalization, protected directories blocked)

**Overall Assessment: SOLID FOUNDATION but spec divergence needs documentation update**
