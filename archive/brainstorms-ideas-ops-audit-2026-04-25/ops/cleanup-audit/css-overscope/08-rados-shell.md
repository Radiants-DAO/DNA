# RadOS Shell — CSS Over-scope Audit

Scope: `apps/rad-os/components/Rad_os/{Taskbar,StartMenu,SettingsMenu,Desktop}.tsx` (+ sibling shell files). Looking for wrapper divs that should collapse, duplicated row layouts, and primitive-covered structure.

---

### F1: Taskbar column-wrapper `<div>` around each `<Toolbar.Root>` — Med
- File: `apps/rad-os/components/Rad_os/Taskbar.tsx:165`, `apps/rad-os/components/Rad_os/Taskbar.tsx:233`
- Pattern: wrapper-collapse | primitive-has-it
- Current:
  ```tsx
  <div className="flex items-center justify-start">
    <Toolbar.Root>
      ...
    </Toolbar.Root>
  </div>
  ```
- Proposal: Move `justify-start` / `justify-end` onto the existing `<Toolbar.Root>` (which is the `@base-ui` Toolbar root and already renders a flex container with `items-center`). Drop the outer `<div>` entirely. The outer grid column already owns width; the inner wrapper adds nothing except a second flex layer.
  ```tsx
  <Toolbar.Root className="justify-start">...</Toolbar.Root>
  ```
- Why safe: The grid cell (`grid-cols-3`) already constrains width; only horizontal alignment moves, which `Toolbar.Root` can receive via `className`.

### F2: `DarkModeToggle` `<span className="inline-flex items-center">` around `<Switch>` — Low
- File: `apps/rad-os/components/Rad_os/Taskbar.tsx:134-140`
- Pattern: pass-through
- Current:
  ```tsx
  <Tooltip content={...}>
    <span className="inline-flex items-center" aria-label={...}>
      <Switch checked={darkMode} onChange={...} size="lg" />
    </span>
  </Tooltip>
  ```
- Proposal: Pass `aria-label` to `<Switch>` directly (matches F1 SettingsMenu usage `aria-label="Dark mode"` at `SettingsMenu.tsx:184`) and remove the `<span>`. Tooltip can wrap the Switch with `asChild`-style composition if needed.
  ```tsx
  <Tooltip content={...}><Switch aria-label={...} .../></Tooltip>
  ```
- Why safe: The span exists only as a tooltip trigger target; the Switch is already a focusable interactive element, and `aria-label` is still delivered.

### F3: `VolumeControl` inner `<div className="h-24">` around vertical `<Slider>` — Low
- File: `apps/rad-os/components/Rad_os/Taskbar.tsx:32-43`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <PopoverContent className="!p-1.5 flex flex-col items-center gap-1">
    <div className="h-24">
      <Slider orientation="vertical" ... />
    </div>
    <span>...{volume}</span>
  </PopoverContent>
  ```
- Proposal: Apply `h-24` directly to `<Slider className="h-24">` (or add a height prop). The wrapper exists only to hand the Slider its track length.
- Why safe: Slider already accepts className (see other `size="md"` usage); removing a pure-sizing div doesn't change flex children count meaningfully because `h-24` carries over.

### F4: StartMenu row-ref wrapper `<div>` around `<MenuRow>` — Med
- File: `apps/rad-os/components/Rad_os/StartMenu.tsx:206-222`
- Pattern: wrapper-collapse | primitive-has-it
- Current:
  ```tsx
  <div key={app.id} ref={(el) => { appRowRefs.current.set(app.id, el); }}>
    <MenuRow icon={...} label={...} hasChildren={...} ... />
  </div>
  ```
- Proposal: Forward a ref through `<MenuRow>` (`React.forwardRef` onto the underlying `<Button>`) and attach directly: `<MenuRow ref={(el) => appRowRefs.current.set(app.id, el)} ... />`. This removes 1 DOM node per app × N apps, and the row ref was only needed to measure `getBoundingClientRect().top` for the popout (line 171) — which reads the Button rect just as well.
- Why safe: `Button` in `@rdna/radiants` already renders a single focusable element; forwarding ref changes no layout, only eliminates a pure-ref wrapper div.

### F5: StartMenu header `<div className="px-3 pb-1">` with single `<span>` — Low
- File: `apps/rad-os/components/Rad_os/StartMenu.tsx:186-190`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div className="px-3 pb-1">
    <span className="font-mono text-xs text-mute uppercase tracking-tight">{cat.label}</span>
  </div>
  ```
- Proposal: Hoist padding to the `<span>` (make it `inline-block`) or render as a single `<div>` / `<h3>`:
  ```tsx
  <div className="px-3 pb-1 font-mono text-xs text-mute uppercase tracking-tight">{cat.label}</div>
  ```
- Why safe: No flex sibling interaction; styles merge cleanly, semantics improve (header-ish role).

### F6: StartMenu `SubmenuPanel` double-wrapper — Med
- File: `apps/rad-os/components/Rad_os/StartMenu.tsx:267-277`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div ref={registerEl} className="absolute" style={{ left, top, width: COLUMN_WIDTH_PX }}>
    <div className="pixel-rounded-sm pixel-shadow-floating bg-page">{children}</div>
  </div>
  ```
- Proposal: A code comment at line 264 already notes this is deliberate ("pixel-rounded sets its own `position: relative` and would otherwise clobber `absolute`"). KEEP as-is — this is a documented pixel-corner pattern collision, not over-scope. Flagging here to make reviewers aware so it isn't mistakenly collapsed.
- Why safe: N/A — leave in place.

### F7: StartMenu outer `menuRef` container + inner styled panel — Low
- File: `apps/rad-os/components/Rad_os/StartMenu.tsx:174-183`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div ref={menuRef} className="absolute top-full left-0 mt-2 z-10" onPointerMove={appHover.onContainerMove}>
    <div className="pixel-rounded-sm pixel-shadow-floating flex flex-col min-w-0 bg-page pb-1" style={{ width: COLUMN_WIDTH_PX }}>
      ...
  ```
- Proposal: Same pixel-rounded constraint as F6 likely applies (pixel-rounded forces `position: relative`). But here the outer wrapper also hosts the submenu sibling at line 229 as an absolute-positioned child. So the outer must remain the positioning parent. KEEP — second case of the same deliberate pattern.
- Why safe: N/A — leave in place (documented).

### F8: SettingsMenu section wrapper `<div className="py-1">` around each group — Med
- File: `apps/rad-os/components/Rad_os/SettingsMenu.tsx:174`, `:217`, `:236`, `:287`, `:308`
- Pattern: duplicate-layout
- Current: Each of the 5 sections repeats:
  ```tsx
  <div className="py-1">
    <SectionHeader>Appearance</SectionHeader>
    <Row .../>
    <Row .../>
  </div>
  <Separator className="mx-2" />
  ```
- Proposal: Hoist a `<Section title="Appearance">...</Section>` primitive that renders `<section className="py-1">` + `SectionHeader` + children, and render the separator between sections via a `<Section.Group>` or array-map with `Separator`. Eliminates ~15 LOC and the hand-repeated `<Separator className="mx-2" />` between each.
- Why safe: Pure refactor; CSS classes preserved verbatim; no state dependencies between sections.

### F9: SettingsMenu triple-wrap at panel root — Med
- File: `apps/rad-os/components/Rad_os/SettingsMenu.tsx:164-172`
- Pattern: wrapper-collapse (partial)
- Current:
  ```tsx
  <div ref={menuRef} className="absolute top-full right-0 mt-2 z-10 w-80">
    <div className="pixel-rounded-sm pixel-shadow-floating">
      <div className="flex flex-col bg-page max-h-[calc(100vh-5rem)] overflow-y-auto">
        ...
      </div>
    </div>
  </div>
  ```
- Proposal: Middle `pixel-rounded` wrapper likely has to stay (same pixel-corner / position-relative constraint as F6/F7). But the innermost `flex flex-col` could merge with the pixel-rounded container since `flex-col` + `bg-page` + `overflow-y-auto` are styles; however `pixel-rounded-*` + `overflow-hidden` is banned per MEMORY.md. KEEP as-is and document — three levels is the minimum given pixel-corner rules.
- Why safe: N/A — documented constraint.

### F10: SettingsMenu Row/StackedRow inner `<div className="flex flex-col">` — Low
- File: `apps/rad-os/components/Rad_os/SettingsMenu.tsx:71-76`
- Pattern: wrapper-collapse
- Current (StackedRow):
  ```tsx
  <div className="flex flex-col gap-2 px-3 py-2">
    <div className="flex flex-col">
      <span className="font-joystix ...">{label}</span>
      {hint ? <span className="font-mondwest ...">{hint}</span> : null}
    </div>
    {children}
  </div>
  ```
- Proposal: Drop the inner `<div className="flex flex-col">`. Two `<span>`s stacked inside a `flex-col` parent already stack vertically by default (spans are inline, but the outer flex-col + gap handles it) — OR convert spans to `<div>`s and let the outer `gap-2` do everything. If the `gap-2` should not apply between label and hint, keep inner div but use `<div className="flex flex-col gap-0">` (redundant) → just merge the label/hint into the outer and use gap-0.5 for title-pair, larger gap on `children`.
- Why safe: Only affects intra-label spacing (`mt-0.5` on hint remains); control still lives in the outer row.

### F11: SettingsMenu Data section hand-rolled row — Low
- File: `apps/rad-os/components/Rad_os/SettingsMenu.tsx:309-324`
- Pattern: duplicate-layout
- Current:
  ```tsx
  <div className="px-3 py-2">
    <Button fullWidth ... >Reset RadOS</Button>
    <p className="font-mondwest text-xs text-mute mt-2">Clears preferences...</p>
  </div>
  ```
- Proposal: Use `<StackedRow label="Reset RadOS" hint="Clears preferences...">` with the Button as children (or add a `footer` prop to StackedRow for the description). Matches the existing row primitives.
- Why safe: Layout is structurally a stacked row with a destructive control; no unique behavior that StackedRow can't express.

### F12: SettingsMenu footer row uses raw `<div>` and `border-t` instead of `<Separator />` — Low
- File: `apps/rad-os/components/Rad_os/SettingsMenu.tsx:328`
- Pattern: duplicate-layout
- Current: `<div className="bg-depth px-3 py-2 border-t border-rule flex items-center justify-between mt-auto">`
- Proposal: Replace with `<Separator />` above + a semantic `<footer>` for the content, keeping `bg-depth` as the footer style. Aligns with the `<Separator className="mx-2" />` used throughout the file and avoids a raw `border-t` (which touches `rdna/no-pixel-border` concerns, though this is a flat menu so likely fine).
- Why safe: Cosmetic equivalence; `<Separator />` already used 5× above.

### F13: Desktop watermark `<div className="relative">` — Low
- File: `apps/rad-os/components/Rad_os/Desktop.tsx:92`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div className="absolute inset-0 flex items-center justify-center z-0 text-main pointer-events-none text-center">
    <div className="relative">
      <WordmarkLogo .../>
      <div>RadOS v1.0</div>
      <div>{displayed}...</div>
    </div>
  </div>
  ```
- Proposal: The inner `position: relative` isn't used as a positioning parent by any child (no absolute descendants). Drop the inner `<div className="relative">` and let children render as direct flex items (`flex-col` added to outer, or wrap in a single semantic element).
- Why safe: No descendant relies on `relative`; outer `flex items-center justify-center` still centers the group.

### F14: Desktop ambient-wallpaper wrapper `<div className="absolute inset-0 z-0 bg-inv">` — Low
- File: `apps/rad-os/components/Rad_os/Desktop.tsx:81`
- Pattern: pass-through
- Current:
  ```tsx
  {AmbientWallpaper ? (
    <div className="absolute inset-0 z-0 bg-inv">
      <AmbientWallpaper />
    </div>
  ) : (
    <div className="absolute inset-0 z-0 bg-accent dark:bg-page">
      <WebGLSun />
    </div>
  )}
  ```
- Proposal: If `<AmbientWallpaper>` already renders a full-bleed container (common wallpaper contract), the wrapper is redundant. Verify wallpaper components fill their parent; if so, hoist sizing/positioning into the ambient contract. If the `bg-inv` fallback is needed for transparent wallpapers, keep — but flag as an audit question.
- Why safe: Contract-dependent; needs 1-line check on a wallpaper component. Likely safe to collapse.

---

## Summary
14 findings across the 4 target files. **High-value refactors**: F1 (Taskbar column wrappers × 2, primitive-has-it), F4 (StartMenu row ref wrapper × N-apps), F8 (SettingsMenu 5-section repeat → Section primitive). **Keep-as-documented**: F6, F7, F9 (pixel-corner + position-relative collision is a real constraint per MEMORY.md). **Smaller wins**: F2, F3, F5, F10-F14. No portal/@base-ui double-output issues spotted — `Toolbar.Root`, `Popover`, `Tooltip` are used cleanly. Biggest duplication opportunity is hoisting a `<Section>` primitive for SettingsMenu.

Report path: `/Users/rivermassey/Desktop/dev/DNA-logo-maker/ops/cleanup-audit/css-overscope/08-rados-shell.md`
