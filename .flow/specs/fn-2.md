# Page Editor MVP

## Overview

Build the Tauri-based page editor for RadFlow - the core visual editing experience. This is an "LLM-native design tool" where the primary value is providing design system context to LLMs like Claude Code.

**Core Value Proposition:** Select a component, get its exact file:line location copied to clipboard for perfect LLM context.

## Scope

### MVP Features (All Required)
1. **Component ID Mode** - Select components, copy `ComponentName @ file.tsx:line` to clipboard
2. **Text Edit Mode** - Rich text editing with clipboard accumulation OR direct file write
3. **Visual Property Panels** - Colors, Typography, Spacing, Layout (token pickers)
4. **Preview Mode** - Hide all DevTools UI, view clean page

### Out of Scope (Future)
- Spatial canvas view (Canvas is future, Page Editor is MVP)
- Responsive preview iframes
- Asset drag-to-insert
- Inspect mode (nice-to-have per spec)

## Technical Approach

### Architecture
```
Tauri Frontend (React)
├── Component ID Mode
├── Text Edit Mode
├── Property Panels
└── Preview Mode
        │
    Zustand Store (slices)
        │
    tauri-specta IPC
        │
Tauri Backend (Rust)
├── SWC Parser (components)
├── lightningcss (tokens)
├── notify (watcher)
└── tantivy (search)
```

### Key Patterns

1. **IPC via tauri-specta**: Generate TypeScript bindings from Rust commands
2. **State**: Zustand with slice composition + persist middleware
3. **Component detection**: SWC backend parses source → maps component names to file:line
4. **Token extraction**: lightningcss parses @theme blocks → populates property panel pickers
5. **Live updates**: notify file watcher → events trigger re-parse → UI updates

### Porting Strategy

| Current RadFlow | Tauri Approach |
|-----------------|----------------|
| React Fiber _debugSource | SWC parsing (works in production) |
| Client-side CSS parsing | lightningcss in Rust backend |
| HTTP API calls | Tauri IPC commands |
| contentEditable | TipTap for rich text (evaluate) |

## Key Decisions

1. **SWC for line numbers** - Not React Fiber. Fiber debug info only works in dev.
2. **Clipboard + Direct Write** - Both modes available via toggle
3. **Fixed right sidebar** - Property panels in right sidebar, tabs at top for pages
4. **Token-first editing** - Always show token picker first, inline values as fallback
5. **Project picker on launch** - User selects project folder to open

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| SWC parsing slow for large codebases | App freezes | Incremental indexing, progress UI |
| DOM to Source correlation | Cant map element to SWC | Use data attributes in dev build |
| lightningcss @theme breaking | Token extraction fails | Pin version, monitor releases |

## Quick Commands

```bash
# Development
cd src-tauri && cargo build      # Build Rust backend
pnpm tauri dev                   # Run in development

# Smoke test
pnpm tauri dev                   # Launch app
# Select theme-rad-os project
# Press V for Component ID mode
# Click any component
# Verify clipboard contains ComponentName @ file.tsx:line
```

## Acceptance Criteria

- [ ] Tauri app scaffolded with tauri-specta IPC working
- [ ] Project picker allows selecting folder on launch
- [ ] Component ID mode: V key activates, click copies location, toast confirms
- [ ] Text Edit mode: T key activates, contentEditable works, changes accumulate
- [ ] Property panels show tokens for colors/typography/spacing/layout
- [ ] Preview mode hides all DevTools UI
- [ ] File watcher triggers re-index on save
- [ ] Works with theme-rad-os as test target
- [ ] Cmd+Z undo works for direct file edits

## References

- Feature spec: /docs/features/06-tools-and-modes.md
- POCs: /research/pocs/ (lightningcss, swc, notify, tantivy)
- Current RadFlow: /Users/rivermassey/Desktop/dev/radflow/packages/devtools/

## Open Questions

1. **Webview loading**: How does target project render in the webview?
2. **DOM to Source mapping**: How to correlate clicked element to SWC data without Fiber?
3. **TipTap vs contentEditable**: Is TipTap overkill for text editing needs?
