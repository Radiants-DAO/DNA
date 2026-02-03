# Plan Review Request: fn-1 Research Phase

**Instructions**: Copy everything below the line and paste into ChatGPT, Claude, or another LLM for a John Carmack-level plan review.

---

# REQUEST: Review This Implementation Plan

You are a senior software architect conducting a rigorous plan review. Think like John Carmack - be direct, technical, and focus on what could go wrong.

## Review Criteria

Score each dimension 1-5 and provide specific feedback:

1. **Clarity** - Is the goal unambiguous? Are success criteria measurable?
2. **Feasibility** - Can this actually be built? Are there hidden blockers?
3. **Completeness** - What's missing? What edge cases aren't covered?
4. **Risk Assessment** - Are the risks correctly identified? Are mitigations adequate?
5. **Task Breakdown** - Are tasks right-sized? Dependencies correct?

## At the end, provide:
- **Verdict**: `SHIP` (ready to implement), `NEEDS_WORK` (fixable issues), or `MAJOR_RETHINK` (fundamental problems)
- **Top 3 concerns** (if any)
- **Specific fixes** for any issues found

---

# PLAN TO REVIEW

## Project Context

**RadFlow Tauri** is a native desktop application (Mac-only) for visual design system editing. It's an **LLM-native design tool** - a context interface that helps designers quickly provide design system context to LLMs (like Claude Code) for code generation.

**Key architectural insight**: Complex operations (git commits, multi-file refactors) are delegated to LLMs via prompts. RadFlow handles display + simple writes only. The Canvas is a context collector, NOT a Figma-style visual editor.

**Figma architecture reference**: Figma uses Electron for desktop, C++/WASM for canvas rendering, React/TypeScript for UI, and Rust for backend services. This validates Electron as a viable fallback.

---

## Epic: fn-1 Research Phase: Tech Stack Validation & POCs

### Goal
Validate that Tauri/Rust is the right tech stack by building minimal POCs against real theme files. **Primary success metric**: Tech stack decision made with confidence within 3-5 days.

### Core Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Platform | Mac-only | Simpler, native performance |
| Tech stack attitude | Pragmatic | Tauri/Rust preferred, but ship > perfect |
| Complex ops | LLM delegation | Git commits via LLM prompts, not native code |
| Canvas purpose | Context collector | Interactive preview + select, NOT Figma editor |
| Search scope (v1) | Names only | Component + icon names, not full-text |
| git2 POC | **DROPPED** | LLM handles commits |
| Escalation path | Reconsider Rust entirely | If lightningcss fails, evaluate Swift/Go/Electron |

### POC List & Dependencies

```
Phase 0: BLOCKER
  fn-1.1: lightningcss @theme parsing
    └── If FAIL → stop, reconsider tech stack

Phase 1: (only if Phase 0 passes)
  fn-1.2: SWC TSX parsing ─┐
  fn-1.4: notify watching  ├── Can run in parallel
  fn-1.5: tantivy search  ─┘

Phase 2: Documentation
  fn-1.6: Design systems validation
  fn-1.7: Spec vs reality gaps (after fn-1.6)
  fn-1.8: Update feature specs (after fn-1.7)

DROPPED:
  fn-1.3: git2 commit workflow (LLM handles this)
```

### Timeline

| Day | Focus |
|-----|-------|
| 1-2 | fn-1.1 lightningcss POC (blocker) |
| 2-3 | fn-1.2 SWC + fn-1.4 notify (parallel) |
| 3-4 | fn-1.5 tantivy (minimal) |
| 4-5 | Spec validation + updates |

---

## Task Details

### fn-1.1: lightningcss @theme block parsing (CRITICAL BLOCKER)

**Goal**: Test if lightningcss can parse Tailwind v4's `@theme` and `@theme inline` blocks (non-standard CSS at-rules).

**Test Input** (real tokens.css):
```css
@theme inline {
  --color-sun-yellow: #FCE184;
  --color-warm-cloud: #FEF8E2;
}

@theme {
  --color-surface-primary: var(--color-warm-cloud);
  --color-content-primary: var(--color-black);
}
```

**Expected Output**:
```rust
struct ThemeTokens {
    inline: HashMap<String, String>,  // Internal reference tokens
    public: HashMap<String, String>,  // Tailwind utility tokens
}
```

**Success**: Proceed with Tauri/Rust
**Failure**: Do NOT try Rust fallbacks. Evaluate: SwiftUI, Electron, Go+Wails

**Acceptance Criteria**:
- [ ] Create Rust POC project at `research/pocs/lightningcss-poc/`
- [ ] Parse real tokens.css file
- [ ] Extract variables from `@theme inline` blocks
- [ ] Extract variables from `@theme` blocks
- [ ] Distinguish between `@theme` and `@theme inline`
- [ ] Document result: PASS with code samples OR FAIL with fallback strategy

---

### fn-1.2: SWC TSX parsing for Component ID

**Goal**: Extract component props + file:line location for the Component ID feature (click component → copy location for LLM).

**Example Input**:
```typescript
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}
export default function Button({ variant = 'primary' }: ButtonProps) {...}
```

**Expected Output**:
```json
{
  "name": "Button",
  "file": "components/core/Button.tsx",
  "line": 45,
  "props": [
    {"name": "variant", "type": "ButtonVariant", "default": "primary"}
  ],
  "defaultExport": true
}
```

**Acceptance Criteria**:
- [ ] Parse Button.tsx successfully
- [ ] Extract union type definitions
- [ ] Extract interface props with types
- [ ] Identify default values from destructuring
- [ ] Detect default export

---

### fn-1.4: notify file watching

**Goal**: Detect external file changes (when LLM edits files outside RadFlow).

**Test Scenarios**:
1. Watch directory recursively
2. Filter events (only .css, .tsx files)
3. Debounce rapid changes (100ms)
4. Handle file creation/deletion

**Acceptance Criteria**:
- [ ] Watch a directory recursively
- [ ] Detect modifications, creations, deletions
- [ ] Filter to .css and .tsx files
- [ ] Implement debouncing
- [ ] Send events via channel

---

### fn-1.5: tantivy search (MINIMAL)

**Goal**: Index component/icon names for quick search. v1 only needs name search, not full-text.

**Test Scope**:
- Index ~30 component names
- Index ~168 icon names
- Fuzzy matching: "btn" → finds "Button"
- Return name + file path

**NOT in v1**: Full file content indexing, complex queries

**Acceptance Criteria**:
- [ ] Index component names
- [ ] Search with fuzzy matching
- [ ] Return file path
- [ ] Benchmark: index 200 names quickly

---

### fn-1.6: Design systems validation (1-2 hours max)

**Goal**: Quick check that our theme-spec.md aligns with industry patterns.

**Questions**:
1. Does `surface-*`, `content-*`, `edge-*` naming align with others?
2. Is 3-tier token architecture (brand → semantic → component) standard?
3. Any obvious gaps?

**Output**: Brief notes, not comprehensive research.

---

## Key Risks Identified

| Risk | Severity | Mitigation |
|------|----------|------------|
| lightningcss doesn't parse `@theme` | CRITICAL | This is the blocker - fail fast, pivot to Electron |
| SWC TSX parsing complexity | High | Start simple (Button.tsx), expand if works |
| Tauri 2.0 breaking changes | Medium | Use stable API only |
| Rust learning curve | Medium | If painful, Electron is proven fallback |

---

## Backup Plan

If lightningcss fails:
1. **Don't try Rust alternatives** - the issue suggests ecosystem isn't mature enough
2. **Primary fallback: Electron + TypeScript** - Figma proves it works at scale
3. **Evaluate based on failure mode**:
   - Rust too hard → Electron
   - Ecosystem gaps → Electron
   - Need native feel → SwiftUI (Mac-only anyway)

---

# YOUR REVIEW

Please provide:
1. Score each dimension (Clarity, Feasibility, Completeness, Risk Assessment, Task Breakdown) 1-5
2. Specific issues found
3. Verdict: `SHIP`, `NEEDS_WORK`, or `MAJOR_RETHINK`
4. Top 3 concerns
5. Specific fixes required
