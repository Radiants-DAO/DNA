# fn-1 Research Phase: Tech Stack Validation & POCs

## Overview

Validate that Tauri/Rust is the right tech stack for RadFlow Tauri by building minimal POCs against real theme files. The primary goal is **tech stack decision** within 3-5 days.

**Project Vision**: RadFlow Tauri is an **LLM-native design tool** - a context interface that helps designers quickly provide design system context to LLMs (like Claude Code) for code generation. It's NOT a traditional visual editor; it's a visual codebase explorer with easy context export.

**Key Insight**: Complex operations (git commits, multi-file refactors) are delegated to LLMs via prompts. RadFlow handles display + simple writes only.

## Core Decisions from Interview

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Platform | Mac-only | Simpler, native performance, user's machine |
| Tech stack attitude | Pragmatic | Tauri/Rust preferred, but ship > perfect |
| Complex ops | LLM delegation | Git commits, multi-file changes via LLM prompts |
| Canvas purpose | Context collector | Interactive preview + select, NOT Figma editor |
| Search scope (v1) | Names only | Component + icon names, not full-text |
| POC git2 | **DROPPED** | Git handled by LLM, not native code |
| Spec updates | After POCs | Let technical reality inform spec decisions |
| Escalation | Reconsider Rust | If lightningcss fails, evaluate Swift/Go/Electron |

## Revised POC List

### Phase 0: Critical Validation (BLOCKER)
1. **fn-1.1: lightningcss @theme parsing**
   - Test if lightningcss can parse Tailwind v4's `@theme` and `@theme inline` blocks
   - If FAIL: Reconsider Rust entirely (not fallback within Rust)
   - Success = tech stack greenlight

### Phase 1: Additional POCs (if Phase 0 passes)
2. **fn-1.2: SWC TSX parsing** - Extract props interface + location (path:line) for Component ID feature
3. **fn-1.4: notify file watching** - Detect external file changes (when LLM edits files)
4. **fn-1.5: tantivy search** - MINIMAL: Index component/icon names only

### Phase 2: Spec Validation
5. **fn-1.6: Design systems research** - Quick validation of our spec against best practices (not deep dive)
6. **fn-1.7: Spec vs reality gaps** - Document mismatches (deferred until after POCs)
7. **fn-1.8: Update feature specs** - Incorporate POC findings

### DROPPED
- ~~fn-1.3: git2 commit workflow~~ - LLM handles commits via prompts

## Success Criteria

**Primary**: Tech stack decision made with confidence
- If all POCs pass: Proceed with Tauri/Rust
- If lightningcss fails: Evaluate alternatives (Swift, Electron, Go+Wails)

**Secondary**:
- [ ] lightningcss parses `@theme` blocks from real tokens.css
- [ ] SWC extracts props + file:line from Button.tsx
- [ ] notify detects file changes in theme directory
- [ ] tantivy indexes and searches component names
- [ ] Feature specs updated with POC findings

## Scope Boundaries

**In Scope**:
- Minimal POCs proving feasibility
- Running against real theme-rad-os files
- Updating specs based on findings

**Out of Scope**:
- Deep design systems research
- Token migration planning
- Full implementation
- Perfect code (POCs are throwaway)

## Quick Commands

```bash
# Check flow status
.flow/bin/flowctl list

# POC directory
cd research/pocs

# After Rust setup
cargo new lightningcss-poc
cargo new swc-poc
cargo new notify-poc
cargo new tantivy-poc

# Run POC tests
cargo test --package lightningcss-poc
```

## Test Data

- **Fixtures**: Small test files in `research/pocs/fixtures/` for unit tests
- **Real data**: `/Users/rivermassey/Desktop/dev/radflow/packages/theme-rad-os` for integration

## Key Context for POCs

### What RadFlow Actually Does
1. **Display**: Show tokens, components, icons visually
2. **Select**: Click/multi-select elements in Canvas or Browser
3. **Copy**: Export file:line + context to clipboard for LLM
4. **Simple writes**: Direct token value changes in CSS
5. **Delegate**: Complex changes → prompt LLM via clipboard

### Canvas = Context Collector
- Interactive preview (hover states, selection)
- Select single or multiple components
- "Needs review" box for non-default styled components (heuristics: inline styles, !important)
- Copy selection context to LLM
- Very few/no writes - it's for gathering context

### Search (v1)
- Index component names + icon names
- Enter = copy context
- Cmd+Enter = navigate to location
- Full-text search is post-v1

## Backup Plans

### Figma Architecture Reference
Figma's stack validates our options:
- **Canvas rendering**: C++ compiled to WASM (performance-critical)
- **Frontend UI**: React + TypeScript
- **Multiplayer backend**: Rust
- **Desktop app**: Electron

**Key insight**: Even Figma uses Electron for desktop. Rust is for backend services, not the whole app. Canvas is where performance matters (WASM).

### If Tauri/Rust Doesn't Work
1. **Don't try Rust alternatives** - the issue suggests Rust ecosystem isn't mature enough for our needs
2. **Primary fallback: Electron + TypeScript** - Figma proves it scales, known ecosystem, fast to build
3. **If canvas performance matters**: Consider WASM for rendering engine only
4. **Evaluate based on failure mode**:
   - Rust learning curve → Electron (familiar web stack)
   - Ecosystem gaps → Electron (mature packages)
   - Need native feel → SwiftUI (Mac-only anyway)

## Timeline

**Target**: 3-5 days for tech stack decision

| Day | Focus |
|-----|-------|
| 1-2 | fn-1.1 lightningcss POC (blocker) |
| 2-3 | fn-1.2 SWC + fn-1.4 notify (parallel if lightningcss passes) |
| 3-4 | fn-1.5 tantivy (minimal) |
| 4-5 | Spec validation + updates |

## References

### Real Theme Files
- Tokens: `/Users/rivermassey/Desktop/dev/radflow/packages/theme-rad-os/tokens.css`
- Components: `/Users/rivermassey/Desktop/dev/radflow/packages/theme-rad-os/components/core/`
- Full theme: `/Users/rivermassey/Desktop/dev/radflow/packages/theme-rad-os/`

### Feature Specs
- All 12 specs in `/docs/features/` - v1 essential
- Theme spec: `docs/theme-spec.md` (defer updates until after POCs)
- Conflicts: `docs/spec-conflicts.md`

### Rust Crates
- lightningcss: https://lightningcss.dev/
- swc_ecma_parser: https://swc.rs/docs/usage/ecmascript
- notify: https://docs.rs/notify/latest/notify/
- tantivy: https://docs.rs/tantivy/latest/tantivy/
