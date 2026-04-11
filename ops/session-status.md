## Session Status — 2026-04-10 (Ctrl Visual Fidelity + Layout Inspector Panel)

**Plan:** `~/.claude/plans/melodic-wiggling-dongarra.md` (Visual Fidelity Pass)
**Branch:** main (103 commits ahead of origin, all auto-committed, tree clean)
**Working surface:** `apps/rad-os/app/ctrl-preview/page.tsx` — Layout Inspector Panel from Paper node SJE-0

### Completed
[7 earlier tasks completed — ctrl.css tokens, @source, 25 components restyled, new components]
- [x] Layout Inspector Panel built on ctrl-preview — near-perfect visual fidelity to Paper SJE-0
- [x] Ctrl CSS dark mode fix — semantic aliases moved to `:root, .dark {}` (not `@theme`) so `var()` resolves per color mode
- [x] Body font color — `--ctrl-label` = `color-mix(in oklch, var(--color-main) 50%, transparent)` (cream at 50%)
- [x] Dropdown component — `packages/ctrl/selectors/Dropdown/Dropdown.tsx` wrapping `@base-ui/react/select` with ctrl styling
- [x] Dropdown wired into W/H rows of Layout Inspector Panel (4 dropdowns, full popup + state update verified)
- [x] Memory docs: `feedback_ctrl_theme_dark_mode.md`, `feedback_ctrl_portal_tokens.md`

### In Progress
- [ ] ~Layout Inspector Panel refinement~ — core done, dropdowns wired. Next: wire more ctrl primitives.

### Remaining
- [ ] Refactor `PanelTitle` to match Paper's L-shape trailing rule (top + right border, not horizontal line)
- [ ] Refactor `Section` to support header controls slot (toggle + collapse action in the rule line)
- [ ] Refactor `PropertyRow` to be a multi-cell grid (label + N value cells with 1px gap) instead of label + single children
- [ ] Build `Toggle` ctrl variant at 16px micro-size (for the MIN/MAX toggle in Section headers)
- [ ] **Namespace migration**: ctrl color tokens → `--color-ctrl-*` so Tailwind `text-ctrl-label`, `bg-ctrl-cell-bg`, `border-ctrl-*` utilities actually generate (currently silent no-ops across all 25+ ctrl components)
- [ ] Replace custom `Trap`/`LabelCell`/`ValueCell` helpers in ctrl-preview page with refactored ctrl primitives

### Next Action
> Refactor `PropertyRow` to a multi-cell grid (label + N value cells with 1px gap), then use it in the Layout Inspector Panel to replace the inline `flex gap-[1px]` rows.

### What to Test
Based on recent file changes in `packages/ctrl/`:
- [ ] Layout Inspector Panel at `localhost:3000/ctrl-preview` — dropdowns open, items show, selection updates trigger
- [ ] Dark mode: all `--ctrl-*` tokens resolve to cream values (verified via getComputedStyle on `.dark` element)
- [ ] Portal behavior: Dropdown popup uses `var(--color-cream)` (not `--color-main`) — works outside `.dark` context
- [ ] Keyboard nav on Dropdown (base-ui provides: arrows, home/end, type-ahead)
- [ ] Active states: H row "10" shows gold glow; other values show cream 50%

### Team Status
No active agents

### Key Learnings This Session
1. **Tailwind v4 `@theme` freezes var() at build time** — Can't use `@theme` for semantic aliases that need to flip between color modes. Put static values in `@theme` (for utility generation), put `var()` aliases in `:root, .dark {}`.
2. **Portals escape `.dark`** — base-ui portals mount on `document.body`, outside the `.dark` wrapper. Mode-flipping tokens resolve to light-mode values inside portals. Fix: use brand primitives (`--color-cream`, `--color-ink`) inside portal content.
3. **Tailwind v4 only generates color utilities from `--color-*` namespace** — `text-ctrl-label` / `bg-ctrl-cell-bg` / `border-ctrl-*` currently don't exist as CSS rules. All ctrl component Tailwind class usage is silent no-op. Fix requires namespace migration.
4. **Dropdown architecture decision**: ctrl wraps `@base-ui/react` directly (same layer as radiants), NOT radiants components. Keeps visual languages independent, shares behavior.
