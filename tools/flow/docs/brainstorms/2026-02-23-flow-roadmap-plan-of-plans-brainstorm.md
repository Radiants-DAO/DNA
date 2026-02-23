# Flow Roadmap — Plan of Plans Brainstorm

**Date:** 2026-02-23
**Context:** 17 plans archived as complete. 2 remain active. Time to take stock.

---

## Where We Are

The core loop works end-to-end: user enables Flow via FAB → selects elements → edits via design tools → mutations compile to prompt → push to sidecar → agent reads via MCP → agent posts feedback → feedback renders as badges + panel. Background owns the WebSocket, keeps alive, auto-sleeps.

**Implemented modes:** Default, Select, Design (7 sub-modes: layout, color, typography, effects, position, guides, accessibility), Comment, Question, Search, Inspect, Edit Text, Move.

**What's actually usable vs. what's wired but rough?** This is the real question. The mode system and tool factories are solid architecture, but several features are "wired" without being polished enough for a real workflow. The gap between "code exists" and "a designer would actually use this" is where the remaining work lives.

---

## The 12 Remaining VisBug Port Tasks

Grouped by impact and dependency:

### High Impact, Low Dependency
- **Legacy `content/features/` cleanup** — Dead code creates confusion. 7 files superseded by `modes/tools/*`. Pure deletion, no new features. Do this first to reduce cognitive load.
- **Keyboard Element Traversal** (Tab/Enter navigation) — Fundamental UX. Every mode benefits. No dependencies on other remaining tasks.

### High Impact, Medium Dependency
- **Annotation Overlay + Popover** — Comment/Question modes have hotkeys and FeedbackPanel, but the on-page experience (click → popover → type → badge appears) is incomplete. This is the "annotate" half of the core loop. Two tasks that should ship together.
- **Annotation Markdown Compilation** — Depends on overlay/popover being done. The basic `commentSlice` compilation exists but lacks Agentation-style detail levels and file grouping.

### Medium Impact
- **Copy/Paste Styles** — Nice power-user feature. Independent. Quick to build (capture computed styles → store → apply via mutation engine).
- **Group/Ungroup** — DOM restructuring. Independent. Needs careful undo handling since it's structural, not style-based.
- **Guides Tool** (sub-mode 6) — The measurement logic already exists in inspect mode's ruler. This is just wrapping it as a design sub-mode with click-to-anchor. Small task.

### Lower Priority / Can Defer
- **Popover API overlay system** — Progressive enhancement. Current shadow DOM approach works. Only matters for edge cases with stacking contexts.
- **Wire panel messages for all tools** — Incremental. Fix as gaps surface during real use.
- **End-to-end tests** — Important but should follow stabilization, not precede it.
- **Annotation Thread Panel** — The threaded conversation UI. Depends on overlay + popover. FeedbackPanel already shows comments; this adds resolve/dismiss lifecycle.

---

## What's NOT in Any Plan but Probably Should Be

### Polish & Bug Fixes
The archived plans were implemented across many sessions. Likely accumulated drift:
- Tool panels might not position correctly at all viewport sizes
- Mode transitions might leak event listeners
- Undo/redo across tool switches might have edge cases
- Dark mode / theme token consistency across all tool UIs

A **stabilization pass** before new features would catch these. Not a plan — more like a QA session with the extension loaded on a real project.

### The "Spacing Handles" Question
`content/overlays/spacingHandles.ts` exists — drag handles on elements for margin/padding. This is wired into layoutTool but unclear if it's working end-to-end. Could be a big UX win if polished (direct manipulation > arrow keys).

### Responsive Viewer (Phase 7)
The only other active plan. Completely independent of the VisBug port. Big feature (multi-viewport iframes, scroll sync, screenshot capture). Worth doing, but not blocking anything.

---

## Proposed Sequencing

### Sprint 1: Cleanup + Navigation Foundation
1. Legacy features/ cleanup (Task 6.0)
2. Keyboard element traversal (Task 3.3)
3. Guides tool wrap (Task 2.8) — tiny, just wraps existing code

### Sprint 2: Annotation System
4. Annotation overlay (Task 4.2)
5. Annotation popover (Task 4.3)
6. Markdown compilation upgrade (Task 4.4)
7. Thread panel (Task 4.5)

### Sprint 3: Power Features + Polish
8. Copy/paste styles (Task 3.1)
9. Group/ungroup (Task 3.2)
10. Stabilization pass (not in original plan)

### Sprint 4: Integration
11. Panel message wiring gaps (Task 6.3)
12. E2E tests (Task 6.4)
13. Popover API overlay (Task 6.1) — if time

### Separate Track: Responsive Viewer
Phase 7 can run in parallel via worktree if desired. No dependencies on the above.

---

## Open Questions

1. **Is the VisBug port plan still the right frame?** It was written when we had 4/9 tools and no wiring. Now we have 8/9 tools, full pipeline, inspect mode, move mode. The remaining 12 tasks feel more like "Flow v1 polish" than "VisBug port completion." Maybe retire the plan and write focused plans per sprint?

2. **Should annotation mode use the existing Comment/Question infrastructure or be separate?** The plan describes a separate Annotate mode, but Comment (C) and Question (Q) modes already exist with FeedbackPanel. The gap is the on-page UX (overlay, popover, badges), not the data model. Could just enhance Comment/Question modes rather than building a parallel system.

3. **When is "done enough" for the extension?** The MCP pipeline works. Design tools work. Inspect mode works. At what point do we shift focus from building more features to actually using Flow on real projects and fixing what surfaces?

4. **Responsive Viewer timing** — Is this a "nice to have" or does it unlock a specific workflow? If the primary use case is "inspect + annotate a single page for AI," the viewer can wait. If it's "test responsive behavior across breakpoints," it's more urgent.
