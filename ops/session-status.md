## Session Status — 2026-03-29 (continued)

**Plan:** Pretext type scale + editorial typography + spacing system
**Branch:** main

### Completed
- [x] Pretext type scale module (`packages/radiants/patterns/pretext-type-scale.ts`)
- [x] GoodNews headings rewired to fluid type tiers
- [x] Editorial fonts added to typography-data.ts (6 fonts, core/editorial categories)
- [x] First Things First editorial specimen (all 6 fonts showcased)
- [x] `--font-tiny` / `--font-waves-tiny` tokens added to fonts.css
- [x] **Spacing scale** defined in pretext-type-scale.ts (named roles, all × bodyLh)
- [x] GoodNews spacing rewritten: `layGap(n)` → `laySpace(role)`, all derived from bodyLh
- [x] Draggable SVG obstacle deleted (drag/resize handlers, hull loading, SVG render)
- [x] Masthead fixed: h1 `leading-none`, Mondwest bumped to `text-lg`, Pixeloid → `font-caption`, `font-display` h1
- [x] Masthead inline styles cleaned up → Tailwind classes where possible

### In Progress
- [ ] Nothing active

### Remaining (from feedback)
- [ ] Drop cap Y position ("too high") — needs baseline alignment investigation
- [ ] Hero image inline/rich-text treatment — reference pretext rich text demo
- [ ] Body text fluid scaling (currently fixed baseFontSize from root)
- [ ] Layout recipe abstraction — extract GoodNews into a named template
- [ ] ManifestoApp editorial treatment (First Things First style)

### Feedback Addressed
| # | Issue | Status |
|---|-------|--------|
| 1 | Drop cap too high | remaining |
| 2 | Hero image inline/rich-text | remaining (architectural) |
| 3 | Mondwest too small in masthead | fixed (text-lg) |
| 4 | h1 line spacing too big | fixed (leading-none) |
| 5 | "$2M" sizing off | fixed (text-lg) |
| 6 | Container uses pretext? | masthead is DOM (documented) |
| 7 | Delete SVG graphic | done |
| 8 | Doesn't resize well | partially addressed (fluid headings, masthead classes) |
| 9 | Spacing too large | fixed (spacing scale) |

### What to Test
- [ ] GoodNews: spacing between elements should be tighter and proportional
- [ ] GoodNews: masthead h1 line-height tight, Mondwest text larger
- [ ] GoodNews: no draggable SVG obstacle
- [ ] GoodNews: resize window — headings scale smoothly
- [ ] BrandAssetsApp → Type → Editorial tab: manifesto renders
- [ ] Run `pnpm lint:design-system` — no new errors

### Spacing Scale (new)
All values are multipliers of `bodyLh`:
| Role | Multiplier | Purpose |
|------|-----------|---------|
| paragraph | 0.75 | Between paragraphs |
| headingBefore | 1.5 | Before a heading |
| headingAfter | 0.5 | After a heading (ties to content) |
| rule | 0.5 | Around horizontal rules |
| section | 2 | Between major sections |
| column | 0.5 | Column gutter |

### Team Status
No active agents
