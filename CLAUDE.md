# RadFlow Tauri

## Project Overview

RadFlow Tauri is a native desktop application for visual design system editing. This is a ground-up rebuild of RadFlow using Tauri (Rust backend + React frontend).

**Status:** Research & Planning Phase

---

## Project Structure

```
radflow-tauri/
├── docs/
│   └── features/          # Feature specifications (12 specs)
├── research/              # Research notes and findings
├── src-tauri/             # Rust backend (not yet scaffolded)
└── src/                   # React frontend (not yet scaffolded)
```

---

## Feature Specs

All features are documented in `/docs/features/`. Each spec includes:
- Feature description and behavior
- Research section with search terms
- Rust backend integration requirements
- Open questions

**Read specs before implementing.** They are the source of truth.

---

## Complexity Priorities

| Priority | Feature | Complexity | Notes |
|----------|---------|------------|-------|
| 1 | Tauri Shell | Low | Basic app scaffold |
| 2 | File System | Low | Read/write/watch files |
| 3 | CSS Parser | Medium | lightningcss for tokens |
| 4 | Variables Editor | Medium | Port existing UI |
| 5 | Typography Editor | Medium | Port existing UI |
| 6 | TSX Parser | High | SWC for components |
| 7 | Component Browser | High | Props extraction |
| 8 | Git Integration | Medium | git2 crate |
| 9 | Search Index | Medium | tantivy |
| 10 | Canvas Editor | Very High | Most complex feature |

---

## Key Crates

| Crate | Purpose |
|-------|---------|
| tauri 2.0 | App framework |
| lightningcss | CSS parsing |
| swc_ecma_parser | TSX parsing |
| git2 | Git operations |
| notify | File watching |
| tantivy | Full-text search |
| serde | Serialization |

---

## Research Phase Tasks

1. **Proof of Concepts** — Build small POCs before full implementation:
   - CSS parsing with lightningcss
   - TSX parsing with SWC
   - Git commit workflow with git2
   - File watching with notify
   - Search indexing with tantivy

2. **Canvas Library Evaluation** — Compare:
   - react-konva
   - xyflow
   - fabric.js
   - Custom implementation

3. **Tauri 2.0** — Verify stable, review migration guides

---

## Commands

```bash
# Not yet scaffolded - use these after Tauri init:
pnpm tauri dev      # Development
pnpm tauri build    # Production build
cargo test          # Run Rust tests
```

---

## Principles

1. **Specs are source of truth** — Read before implementing
2. **POC first** — Prove feasibility before building
3. **Rust does heavy lifting** — Parsing, indexing, git in backend
4. **React for UI** — Port existing RadFlow components
5. **Git is save** — Cmd+S commits, no ambiguous saves

---

## Links

- Feature Specs: `/docs/features/`
- Current RadFlow: `/Users/rivermassey/Desktop/dev/radflow`
- Tauri Docs: https://tauri.app/v2/guides/
