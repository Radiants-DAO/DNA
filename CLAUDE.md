# RadFlow Tauri

Native desktop app for visual design system editing. Tauri (Rust backend + React frontend).

**Status:** Research & Planning Phase

---

## Structure

```
radflow-tauri/
├── docs/features/     # Feature specs (source of truth)
├── docs/rust-patterns.md  # Crate usage examples
├── src-tauri/         # Rust backend (not yet scaffolded)
└── src/               # React frontend (not yet scaffolded)
```

---

## Stack

| Crate | Purpose |
|-------|---------|
| tauri 2.0 | App framework |
| tauri-plugin-fs | File ops + watching |
| lightningcss | CSS parsing |
| swc_ecma_parser | TSX parsing |
| fuzzy-matcher | Search |
| serde | Serialization |

**Dropped:** git2 → git CLI, notify → tauri-plugin-fs, tantivy → fuzzy-matcher

---

## Priorities

| # | Feature | Complexity |
|---|---------|------------|
| 1 | Tauri Shell | Low |
| 2 | File System | Low |
| 3 | CSS Parser | Medium |
| 4 | Variables Editor | Medium |
| 5 | Typography Editor | Medium |
| 6 | TSX Parser | High |
| 7 | Component Browser | High |
| 8 | Git Integration | Low (CLI) |
| 9 | Search | Low (in-memory) |
| 10 | Component Grid | Medium |

---

## Principles

1. **Specs are source of truth** — Read `/docs/features/` before implementing
2. **POC first** — Prove crates work before building features
3. **Rust does heavy lifting** — Parsing, file ops in backend
4. **React for UI** — Port existing RadFlow components
5. **Git is save** — Cmd+S commits, no ambiguous saves
6. **Scrollable grid > infinite canvas** — Simpler, good enough

---

## Commands

```bash
pnpm tauri dev      # Development
pnpm tauri build    # Production build
cargo test          # Rust tests
```

---

## Links

- Feature Specs: `/docs/features/`
- Rust Patterns: `/docs/rust-patterns.md`
- Original RadFlow: `/Users/rivermassey/Desktop/dev/radflow`
- Tauri Docs: https://tauri.app/v2/guides/

<!-- BEGIN FLOW-NEXT -->
## Flow-Next

This project uses Flow-Next for task tracking. Use `.flow/bin/flowctl` instead of markdown TODOs or TodoWrite.

**Quick commands:**
```bash
.flow/bin/flowctl list                # List all epics + tasks
.flow/bin/flowctl epics               # List all epics
.flow/bin/flowctl tasks --epic fn-N   # List tasks for epic
.flow/bin/flowctl ready --epic fn-N   # What's ready
.flow/bin/flowctl show fn-N.M         # View task
.flow/bin/flowctl start fn-N.M        # Claim task
.flow/bin/flowctl done fn-N.M --summary-file s.md --evidence-json e.json
```

**Rules:**
- Use `.flow/bin/flowctl` for ALL task tracking
- Do NOT create markdown TODOs or use TodoWrite
- Re-anchor (re-read spec + status) before every task

**More info:** `.flow/bin/flowctl --help` or read `.flow/usage.md`
<!-- END FLOW-NEXT -->
