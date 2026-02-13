# Research Priorities

## Phase 1: Foundation (Do First)

### 1. Tauri 2.0 Setup
**Goal:** Verify Tauri 2.0 is production-ready, understand patterns

**Research:**
- [ ] Tauri 2.0 stable status
- [ ] Tauri + Vite + React setup
- [ ] IPC patterns (invoke commands)
- [ ] Event system (frontend ↔ backend)
- [ ] Plugin ecosystem

**Search Terms:**
```
"tauri 2.0 stable release"
"tauri 2.0 vite react template"
"tauri invoke command example"
"tauri event system"
```

**Output:** Working Tauri shell with basic IPC

---

### 2. CSS Parsing (lightningcss)
**Goal:** Parse @theme blocks, extract tokens, modify, serialize

**Research:**
- [ ] lightningcss API for custom properties
- [ ] Parsing @theme inline blocks
- [ ] AST modification
- [ ] Serialization back to CSS

**Search Terms:**
```
"lightningcss rust api"
"lightningcss parse custom properties"
"lightningcss ast modification"
"lightningcss serialize css"
```

**Output:** POC that reads globals.css, extracts tokens, modifies one, writes back

---

### 3. File Watching (notify)
**Goal:** Watch directories, debounce events, trigger updates

**Research:**
- [ ] notify-rs basic usage
- [ ] Debouncing strategies
- [ ] Recursive watching
- [ ] Cross-platform differences

**Search Terms:**
```
"notify-rs tutorial"
"notify-rs debounce events"
"rust file watcher recursive"
```

**Output:** POC that watches a directory and logs changes

---

## Phase 2: Parsing (High Value)

### 4. TSX Parsing (SWC)
**Goal:** Extract component props interface, detect variants

**Research:**
- [ ] swc_ecma_parser API
- [ ] TypeScript interface extraction
- [ ] Default export detection
- [ ] JSX traversal

**Search Terms:**
```
"swc_ecma_parser typescript example"
"swc extract interface rust"
"swc parse tsx file"
"swc ast traversal"
```

**Output:** POC that reads Button.tsx and extracts props

---

### 5. Git Operations (git2)
**Goal:** Stage, commit, status, diff

**Research:**
- [ ] git2-rs basic operations
- [ ] Staging specific files
- [ ] Creating commits
- [ ] Getting status
- [ ] Generating diffs

**Search Terms:**
```
"git2-rs tutorial"
"git2 commit example rust"
"git2 stage files"
"git2 status"
```

**Output:** POC that stages and commits a file

---

## Phase 3: Search & Canvas

### 6. Search Index (tantivy)
**Goal:** Index components, fuzzy search, rank results

**Research:**
- [ ] tantivy schema definition
- [ ] Index building
- [ ] Fuzzy search configuration
- [ ] Query syntax

**Search Terms:**
```
"tantivy tutorial"
"tantivy fuzzy search"
"tantivy schema example"
"tantivy incremental index"
```

**Output:** POC that indexes components and searches them

---

### 7. Canvas Library
**Goal:** Choose React canvas library for component grid

**Research:**
- [ ] react-konva capabilities
- [ ] xyflow for node graphs
- [ ] fabric.js features
- [ ] Custom canvas implementation
- [ ] Performance with 100+ items

**Search Terms:**
```
"react-konva vs fabric.js"
"react infinite canvas library"
"xyflow react tutorial"
"canvas zoom pan react"
```

**Output:** Decision document with pros/cons

---

## Phase 4: Advanced

### 8. Source Maps
**Goal:** Map component locations to line numbers

**Research:**
- [ ] Source map format
- [ ] Parsing in Rust
- [ ] Real-time updates on file change

**Search Terms:**
```
"source map parsing rust"
"source map v3 format"
```

---

### 9. React Fiber Inspection
**Goal:** Detect component names from rendered elements

**Research:**
- [ ] React DevTools internals
- [ ] Fiber tree access
- [ ] Component name extraction

**Search Terms:**
```
"react devtools fiber api"
"react element to component mapping"
```

---

## Research Template

For each topic, create a file in `/research/` with:

```markdown
# [Topic Name]

## Goal
What we're trying to achieve

## Findings
What we learned

## Code Examples
Working code snippets

## Decision
What approach we're taking

## Links
- Useful resources
```
