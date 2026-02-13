# Pencil vs RadFlow: Consolidated Architecture Comparison

> Task: fn-3-46x.7 | Epic: Pencil vs RadFlow Architecture Comparison
> Generated: 2026-01-22
> Audience: Internal decision-making document

---

## 1. Executive Summary

### Top 5 Recommendations

| # | Recommendation | Priority | Impact |
|---|----------------|----------|--------|
| 1 | **Use CSS scale() for Component Canvas** (not Shadow DOM) | High | Spec change |
| 2 | **Implement Claude Code skills** before MCP | High | Integration |
| 3 | **Complete Comment Mode** (Clipboard Panel) | Critical | User value |
| 4 | **Keep clipboard-first philosophy** | Core | Philosophy |
| 5 | **Add virtualization** for 100+ component support | Medium | Performance |

### Key Findings

**Architecture:**
- Pencil and RadFlow solve different problems with different philosophies
- Pencil: "Design becomes code" (WASM canvas, MCP direct writes, .pen format)
- RadFlow: "Design IS code" (iframe preview, clipboard-first, existing files)

**Technical Decisions:**
- CSS scale() is superior to Shadow DOM for Component Canvas (contradicts vault spec)
- Claude Code skills are sufficient for RadFlow's context-provider use case
- RadFlow's custom fiber walking is better than Bippy for Tauri + React 19
- Vite HMR and Storybook patterns are already correctly implemented

**Philosophy Validation:**
- RadFlow's clipboard-first approach is a valid differentiator, not a limitation
- Human-in-the-loop review aligns with developer workflows
- No need to add MCP write capabilities

---

## 2. Philosophy Comparison

### Pencil: "Design Becomes Code"

```
Designer creates → .pen file → AI manipulates → Code generated
                      ↓
              (translation layer)
```

**Characteristics:**
- Proprietary design format (`.pen`)
- AI as direct collaborator (MCP tools)
- Code generation from design
- Designer-first workflow
- Changes immediate, no human approval

### RadFlow: "Design IS Code"

```
Developer writes code → RadFlow provides context → AI suggests → Human reviews
                              ↓
                    (no translation layer)
```

**Characteristics:**
- Existing project files
- AI as assistant (clipboard context)
- No code generation
- Developer-first workflow
- Human reviews all changes

### Implications for Feature Decisions

| Decision | Pencil Approach | RadFlow Should |
|----------|-----------------|----------------|
| Direct writes | MCP tools | Skip (keep clipboard) |
| Code generation | Export from .pen | Skip (not needed) |
| AI integration | MCP server | Skills-first |
| File format | Proprietary | Standard CSS/TSX |
| Human review | Optional | Required (by design) |

---

## 3. Feature Matrix Summary

### Core Rendering

| Feature | Pencil | RadFlow | Verdict |
|---------|--------|---------|---------|
| Canvas | WASM (~7MB) | iframe + CSS scale() | Both valid for use case |
| Previews | Native primitives | Live React components | RadFlow shows real code |
| Real-time | Delta streaming | Vite HMR + style injection | Both fast |
| Isolation | JSON tree | iframe boundary | RadFlow more compatible |

### Integration

| Feature | Pencil | RadFlow | Verdict |
|---------|--------|---------|---------|
| AI integration | MCP (direct) | Clipboard (indirect) | Different philosophies |
| Multi-tool support | Claude, Cursor, etc. | Any tool (clipboard) | RadFlow more universal |
| Context format | JSON schema | Markdown | RadFlow human-readable |

### Token Systems

| Feature | Pencil | RadFlow | Verdict |
|---------|--------|---------|---------|
| Format | JSON variables | CSS custom properties | RadFlow uses standards |
| Theming | Multi-axis | Two-tier (public/inline) | Pencil more expressive |
| Read/Write | Both | Read-only (currently) | RadFlow defers writes |

---

## 4. Technical Deep Dives

### 4.1 Canvas Rendering Decision

**Recommendation: CSS scale() for Component Canvas**

| Approach | Performance | Complexity | React Compat | Verdict |
|----------|-------------|------------|--------------|---------|
| CSS scale() | Excellent | Low | Full | **Use** |
| Shadow DOM | Good | High | Partial | Avoid |
| WASM | Excellent | Very High | None | Overkill |
| iframe | Good | Medium | Full | Keep for Page Builder |

**Vault Spec Change Required:**

```diff
### Component Canvas
- - Shadow DOM isolation per component
+ - CSS transform scale() for thumbnails
+ - @tanstack/virtual for 100+ component virtualization
+ - iframe only for single-component detailed view
```

**Why Shadow DOM is Wrong:**
1. React event delegation breaks
2. Portals don't work (modals, dropdowns)
3. Context doesn't propagate
4. Significant workarounds needed

**Why CSS scale() is Right:**
1. GPU-composited (60fps)
2. Zero dependencies
3. Full React compatibility
4. ~190 MB for 100 previews (acceptable)

### 4.2 MCP vs Skills Decision

**Recommendation: Skills-First with Optional MCP**

| Approach | Priority | Scope |
|----------|----------|-------|
| Claude Code Skills | High | Primary |
| MCP (read-only) | Low | Optional |
| MCP (write) | N/A | Not recommended |

**Proposed Skill Set:**

| Skill | Description | Priority |
|-------|-------------|----------|
| `/radflow:context` | Bundle selection as markdown | High |
| `/radflow:tokens` | Export design tokens | High |
| `/radflow:source` | Get source file location | Medium |
| `/radflow:components` | List discovered components | Medium |

**Why Skills Over MCP:**
1. Simpler implementation
2. Aligned with clipboard workflow
3. Human review built-in
4. Claude Code is primary target

---

## 5. Actionable Recommendations

### What to Build Next

| Item | Priority | Effort | Impact |
|------|----------|--------|--------|
| Clipboard Panel | Critical | 2-3 weeks | Completes Comment Mode |
| Component Canvas (CSS scale()) | High | 2 weeks | New capability |
| `/radflow:context` skill | High | 1 week | AI integration |
| Virtualization | Medium | 1 week | Scalability |

### What to Skip or Defer

| Item | Reason | Status |
|------|--------|--------|
| WASM canvas | Overkill for use case | Skip |
| Shadow DOM isolation | React incompatible | Skip (remove from spec) |
| MCP server | Skills sufficient | Defer |
| Direct write mode | Against philosophy | Defer indefinitely |
| Code generation | Not needed | Skip |

### Patterns to Adopt from Pencil

| Pattern | Pencil Implementation | RadFlow Application |
|---------|----------------------|---------------------|
| Delta streaming | Partial JSON updates | Stream context preview |
| Session persistence | sessionId resume | AI conversation continuity |
| Multi-axis theming | device × mode variants | Responsive tokens |
| Registration API | Component metadata | Component Canvas config |

### RadFlow Differentiators to Maintain

| Differentiator | Value | Action |
|----------------|-------|--------|
| Clipboard-first | Human review | Keep as core philosophy |
| No abstraction | "Design IS code" | No proprietary format |
| Standard formats | CSS, TSX | Continue using standards |
| Developer-first | IDE integration | Focus on Claude Code |

---

## 6. Open Questions

### Technical Questions

| Question | Context | Resolution Path |
|----------|---------|-----------------|
| How to handle file watcher + Comment Mode sync? | Auto-clear comments on source change | Implement in Clipboard Panel |
| Virtualization threshold? | When to enable for component grid | Benchmark at 50, 100, 200 components |
| Skills API stability? | Claude Code plugin API maturity | Monitor API changes |

### Product Questions

| Question | Context | Resolution Path |
|----------|---------|-----------------|
| Cross-tool demand? | Do users want Cursor/Windsurf support? | User feedback after skills ship |
| Component Canvas priority? | Comment Mode vs Canvas first? | Comment Mode (critical priority) |
| Direct write demand? | Will users want AI to write directly? | Monitor user feedback |

### Research Questions

| Question | Context | Resolution Path |
|----------|---------|-----------------|
| Plasmic registration pattern details? | Slot system implementation | Deeper Plasmic code analysis |
| Text blur at tiny scales? | CSS scale() limitation | Test at 0.1x, 0.05x scales |
| Memory pressure thresholds? | When does GPU memory matter? | Profile on lower-end hardware |

---

## 7. Supporting Documents

This comparison synthesizes findings from:

| Document | Content |
|----------|---------|
| `01-radflow-inventory.md` | RadFlow current state (BUILT/PARTIAL/PLANNED) |
| `02-pencil-architecture.md` | Pencil deep dive (streaming, MCP, .pen format) |
| `03-research-validation.md` | Research recommendations validated |
| `04-feature-matrix.md` | Feature-by-feature comparison |
| `05-canvas-rendering.md` | CSS vs WASM vs Shadow DOM analysis |
| `06-mcp-vs-skills.md` | Integration strategy recommendation |

---

## 8. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-22 | CSS scale() over Shadow DOM | React compatibility, simpler |
| 2026-01-22 | Skills before MCP | Aligns with clipboard philosophy |
| 2026-01-22 | Keep custom fiber walking | Better than Bippy for Tauri + React 19 |
| 2026-01-22 | No direct write mode | Maintains human review principle |
| 2026-01-22 | Comment Mode is critical | Vault spec priority confirmed |

---

## 9. Summary Table

| Dimension | Pencil | RadFlow | Recommendation |
|-----------|--------|---------|----------------|
| **Philosophy** | Design → Code | Design IS Code | Keep RadFlow's approach |
| **AI Role** | Direct collaborator | Context provider | Keep clipboard-first |
| **Canvas** | WASM | CSS scale() | Update spec to CSS scale() |
| **Integration** | MCP | Skills | Implement skills first |
| **File Format** | .pen | CSS/TSX | Keep standard formats |
| **Target User** | Designers + AI | Developers + AI | Keep developer focus |

---

## Conclusion

Pencil and RadFlow are complementary products with different philosophies. RadFlow should:

1. **Not copy Pencil** - Different problems, different solutions
2. **Learn from Pencil** - Streaming patterns, session persistence, theming
3. **Maintain differentiators** - Clipboard-first, human review, standard formats
4. **Fix the vault spec** - CSS scale() instead of Shadow DOM
5. **Complete Comment Mode** - Critical priority, highest user value

The research validates RadFlow's core approach while identifying specific technical improvements (CSS scale(), virtualization, skills) that align with its philosophy.
