# RadFlow Tauri

Design System Manager for LLM CLI tools (Claude Code, Cursor, etc.)

## Stack
- Frontend: React 19, TypeScript 5.8, Zustand 5 (21 slices), Tailwind v4 (@theme blocks), Vite 7
- Backend: Tauri 2 (Rust) — SWC (TSX parsing), lightningcss (token extraction), notify (file watching), rayon (parallel scanning)
- Bindings: specta/tauri-specta auto-generates TypeScript from Rust types
- Theme system: DNA two-tier tokens (Brand → Semantic), three-file component pattern (.tsx + .schema.json + .dna.json)

## Commands
```bash
pnpm tauri dev       # Development
pnpm tauri build     # Production build
pnpm test            # Vitest
pnpm typecheck       # tsc --noEmit
cargo test           # Rust tests
```

## Architecture
- 21 Zustand slices (app/stores/slices/) with persist middleware for UI prefs
- 30 Tauri commands (tauri/src/commands/) — see bindings.ts for full API
- Floating panel UI (no docked sidebars) — icon bars + draggable panels
- Editor mode state machine: Cursor(Esc) → SmartEdit(E) → Select(V) → TextEdit(T) → Comment(C) → Question(Q) → Designer(D) → Preview(P)
- Three canvas modes: SpatialCanvas (file tree), PreviewCanvas (iframe), ComponentCanvas (schema grid)
- Clipboard-first output philosophy (no direct file writes)

## Key Patterns
- Slice pattern: StateCreator<AppState, [], [], SliceType> per feature
- Tauri commands: Result<T, String> with specta::Type derive
- Canvas hooks: useCanvasGestures + useCanvasPhysics + useCanvasSounds
- Token resolution: var() chain resolution with cycle detection (utils/tokenResolver.ts)
- Cross-slice deps: UiSlice.setEditorMode clears Comment + ComponentId state

## Key Files
- app/stores/appStore.ts — main store combining all slices
- app/components/layout/EditorLayout.tsx — layout orchestrator
- tauri/src/lib.rs — Rust entry, registers all 30 commands
- tauri/src/types/mod.rs — all Rust types (auto-serialize to TS)
- app/bindings.ts — auto-generated Tauri bindings
- tasks/IMPLEMENTATION.md — comprehensive change log

## Documentation
- Full docs: ~/Desktop/vault/radflow/
- Start: 01-Architecture/system-overview.md
- Features: 02-Features/ (comment-mode, editor-panels, page-builder, designer-panels, component-canvas, ai-integration)
