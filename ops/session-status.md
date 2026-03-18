## Session Status — 2026-03-17 21:10

**Plan:** docs/brainstorms/2026-03-17-rdna-pixel-corners-brainstorm.md (brainstorm complete, plan not yet created)
**Branch:** main (worktree ready: feat/rdna-pixel-corners at /private/tmp/claude/rdna-pixel-corners)
**Checkpoint:** `pixel-corners-experiment` — rollback point before global Tailwind override

### Completed
- [x] Pixel corners CSS: 5 sizes (xs/sm/md/lg/xl) with ::after border ring (commit: 8041ff7a)
- [x] Tailwind override: rounded-xs/sm/md/lg → pixel corners globally in rad-os globals.css (commit: 8041ff7a)
- [x] AppWindow: pixel-corners class + drop-shadow (prior session)
- [x] Button primary (light mode): removed lift/shadow hover, added retro-OS inset bevel, fixed double border (commit: 8041ff7a)
- [x] Brainstorm doc captured with all 12 issues categorized (commit: 8041ff7a)
- [x] Worktree created: feat/rdna-pixel-corners at /private/tmp/claude/rdna-pixel-corners

### In Progress
- [ ] ~RDNA Pixel Corners Refactor~ — brainstorm done, needs /wf-plan

### Remaining (high-level from brainstorm)
- [ ] Move pixel-corners.css from rad-os globals → radiants package (new pixel-corners.css)
- [ ] Fix all button variants (secondary, outline, ghost, destructive, text) — same pattern as primary
- [ ] Fix double borders: ToggleGroup, NavigationMenu, Combobox, Slider
- [ ] Fix missing borders: Card, ScrollArea, Meter, form fields (Input, Select, NumberField)
- [ ] Remove unwanted borders: Breadcrumbs, ghost/text variants
- [ ] Retro-OS refactors: Switch, Slider, Tabs
- [ ] Dark mode: bevel + glow via filter: drop-shadow() for all button variants
- [ ] Circles strategy: Radio (new), Switch thumb shape decision
- [ ] Shadow token audit: evaluate box-shadow → filter: drop-shadow() migration
- [ ] Focus ring audit: verify focus-visible works with clip-path

### Next Action
> Run /wf-plan on the brainstorm doc to create a phased implementation plan, then begin Phase 1 (package setup + move CSS to radiants).

### What to Test
- [ ] Primary button in light mode: single pixel border, inset bevel (light TL, dark BR), shadow swap on press
- [ ] All rounded-xs/sm elements: pixel corners rendering, no double borders
- [ ] AppWindow: pixel corners + drop-shadow still working
- [ ] Dark mode: check for regressions (button glows may be clipped by clip-path — known issue, fix pending)

### Team Status
No active agents
