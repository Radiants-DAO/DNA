# Radio app — CSS over-scope audit

Scope: `apps/rad-os/components/apps/radio/`
Files audited: `Radio.tsx`, `RadioEffectsRow.tsx`, `RadioDisc.tsx`, `RadioVisualizer.tsx`, `RadioFrame.tsx`, `RadioWidget.tsx`, `styles.ts`.

Legend for Pattern tag: `wrapper-collapse` | `duplicate-layout` | `primitive-has-it` | `pass-through` | `style-class-duplication` | `hoist-primitive`.

---

### F1: Transport pill wrapper is a single-purpose padding div — [Low]
- File: `apps/rad-os/components/apps/radio/Radio.tsx:247`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div className="px-2 py-2">
    <TransportPill pressedStates={[prevPressed, isPlaying, nextPressed]}>...</TransportPill>
  </div>
  ```
- Proposal: Drop the wrapper and either (a) let `RadioFrame` own a single top padding token, or (b) pass `className="mx-2 my-2"` straight onto `<TransportPill>` (Ctrl primitives accept a `className`). Removes one non-semantic container whose only job is 8px padding.
- Why safe: `RadioFrame` already handles horizontal layout (`flex-col overflow-hidden`) and the LCD sibling sets its own margins.

---

### F2: LCDScreen uses `padding="none"` then re-adds padding via inline style — [Med]
- File: `apps/rad-os/components/apps/radio/Radio.tsx:273`-`289`
- Pattern: primitive-has-it / style-class-duplication
- Current:
  ```tsx
  <LCDScreen
    padding="none"
    style={{
      width: 260,
      padding: '12px 8px 8px',
      marginLeft: 'auto', marginRight: 'auto',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-start', gap: 8,
      borderBottomLeftRadius: 128, borderBottomRightRadius: 128,
    }}
  >
  ```
- Proposal: Pass a real `padding` variant (or `className="mx-auto flex flex-col gap-2 pt-3 px-2 pb-2"`) and expose `borderRadius` / `width` via props on `LCDScreen`. The current shape is "opt out of primitive, then re-implement it in style" — the primitive's padding API is useless.
- Why safe: Flex + gap + padding are non-state-bearing; moving them to className/props changes nothing behaviorally. If `LCDScreen` doesn't yet expose a bottom-radius prop, that's a one-line addition.

---

### F3: Header stack wraps a single Visualizer + single time row — [Low]
- File: `apps/rad-os/components/apps/radio/Radio.tsx:291`-`306`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div className="flex flex-col self-stretch" style={{ gap: 4 }}>
    <RadioVisualizer .../>
    <div className="flex items-center justify-between ...">...</div>
  </div>
  ```
- Proposal: The parent `LCDScreen` is already `display:flex; flex-direction:column; gap:8`. The inner wrapper exists only to override gap (4 vs 8). Collapse by dropping the wrapper and adding `style={{ marginTop: -4 }}` to the time row — or better, let the LCDScreen expose a tighter sub-gap token, or inline the Visualizer's bottom margin inside `RadioVisualizer`. Removes 1 flex level.
- Why safe: `self-stretch` is redundant inside a flex-col parent (children default stretch cross-axis already). Visualizer + time row are both full-width.

---

### F4: Volume row: icon/slider/percent row duplicates the LCD flex parent — [Low]
- File: `apps/rad-os/components/apps/radio/Radio.tsx:309`
- Pattern: duplicate-layout
- Current: `<div className="flex items-center self-stretch" style={{ gap: 6 }}>` holding icon + `VolumeSlider` + percent.
- Proposal: Keep the row wrapper (it flips from column-flow to row-flow, legit), but drop `self-stretch` — inside a `flex-col` parent, children already stretch. Also split `gap-6` out of inline style into `gap-1.5` / `gap-[6px]` for consistency — right now Radio mixes Tailwind `gap-3` (effects row) with inline `gap: 6` / `gap: 8` / `gap: 4` across siblings, which defeats token scanning.
- Why safe: `self-stretch` is a no-op here; gap-style consolidation is mechanical.

---

### F5: RadioDisc outer wrapper in `Radio.tsx` — pure margin shim — [Med]
- File: `apps/rad-os/components/apps/radio/Radio.tsx:339`
- Pattern: wrapper-collapse
- Current:
  ```tsx
  <div className="self-stretch" style={{ marginTop: -16 }}>
    <RadioDisc ... />
  </div>
  ```
- Proposal: Move `marginTop` onto `RadioDisc` via its existing `style?: CSSProperties` prop (already threaded through — see `RadioDisc.tsx:41`, `:106`). The disc already renders `w-full aspect-square`, so `self-stretch` is redundant.
- Why safe: RadioDisc accepts a `style` override that merges into the root; no layout math changes.

---

### F6: VolumeSlider track: className + inline style fight for the same element — [Low]
- File: `apps/rad-os/components/apps/radio/Radio.tsx:160`-`179`
- Pattern: style-class-duplication
- Current: `className="flex-1 cursor-pointer relative"` + `style={{ paddingTop: 6, paddingBottom: 6, touchAction: 'none' }}`. Inside `RadioEffectsRow.tsx:106` the sibling `LcdSlider` keeps `className="relative w-full cursor-pointer"` + `style={{ height: 14, touchAction: 'none' }}`. Two near-identical thin-track sliders diverge on hit-area strategy (padding vs fixed height) and on width (`flex-1` vs `w-full`).
- Proposal: Hoist a single `LcdTrack` primitive (or `LcdSlider` from `RadioEffectsRow`) that both Radio volume and SLOW/REVERB use. Same DOM: track line + fill + glow shadows. Differences collapse to props: `showThumb`, `showTicks`, `showEndCaps`.
- Why safe: Shadow string, fill gradient, and geometry are identical between the two — just copy-pasted. One primitive eliminates ~50 LOC of drift.

---

### F7: `DbScale` and channel blocks wrap a single item — [Med]
- File: `apps/rad-os/components/apps/radio/RadioEffectsRow.tsx:235`-`257` (L) and `:282`-`304` (R)
- Pattern: duplicate-layout / hoist-primitive
- Current: Each channel uses **four nested flex containers**:
  ```tsx
  <div className="flex items-start gap-1">           // outer row
    <div className="flex flex-col items-center gap-1"> // meter column
      <Meter ... />
      <span ...>L</span>
    </div>
    <DbScale />                                        // DbScale is ALSO flex
  </div>
  ```
  The L and R blocks are mirror images (L: meter then scale; R: scale then meter), each repeating a 4-level flex chain.
- Proposal: Extract a `<MeterChannel label dbScaleSide>` primitive that renders meter + dB scale + label with one set of flex classes. The outer `flex items-start gap-1` collapses into the child; the column div collapses into the primitive's internals.
- Why safe: L and R are identical except for sibling order — perfect DRY target. Removes 2 nested flex chains × 2 channels = 4 layout divs.

---

### F8: SLOW/REVERB column wraps each slider + label in identical `flex-col items-center gap-0.5` — [Med]
- File: `apps/rad-os/components/apps/radio/RadioEffectsRow.tsx:260`-`279`
- Pattern: duplicate-layout / hoist-primitive
- Current:
  ```tsx
  <div className="flex-1 flex flex-col self-stretch gap-3">
    <div className="flex flex-col items-center gap-0.5">
      <LcdSlider value={slow} onChange={onSlowChange} />
      <span className="text-xs uppercase tracking-wider font-mono" style={lcdText}>Slow</span>
    </div>
    <div className="flex flex-col items-center gap-0.5">
      <LcdSlider value={reverb} onChange={onReverbChange} />
      <span className="text-xs uppercase ...">Reverb</span>
    </div>
  </div>
  ```
- Proposal: Collapse into `<LabeledLcdSlider label="Slow" value={slow} onChange={onSlowChange} />`. Label rendering + class list is duplicated verbatim. While you're there, `flex flex-col items-center` on a full-width slider doesn't center anything because the slider is already `w-full` — the label is the only item that benefits, so just give the label `text-center` and drop `items-center`.
- Why safe: Two identical blocks differ only by prop/label. Centering a label via `text-center` is equivalent and kills the inner flex.

---

### F9: `DbScale` is a class-only wrapper that can take its parent's flex — [Low]
- File: `apps/rad-os/components/apps/radio/RadioEffectsRow.tsx:208`-`219`
- Pattern: wrapper-collapse
- Current: `DbScale` renders a flex-col div whose sole purpose is to space 3 spans at `0 / -12 / -48` over an 80px column.
- Proposal: Fine as a helper, BUT note it only renders at a single height (`h-20` = 80px) which is visually aligned with the `Meter`'s `size="sm"` vertical height. That linkage is invisible — if someone bumps meter size, dB scale silently mis-aligns. Either (a) take `height` as a prop, (b) render inside the same MeterChannel primitive from F7 so heights share a local constant.
- Why safe: Cosmetic coupling — no behavior change. Prevents silent drift.

---

### F10: `RadioDisc` className merge vs inline style split — [Low]
- File: `apps/rad-os/components/apps/radio/RadioDisc.tsx:82`-`107`
- Pattern: style-class-duplication
- Current: `rounded-full overflow-hidden` come via className, but `backgroundColor`, `boxShadow`, and the spread-in `...style` all live in inline style. The inline shadow array (6 layers) is the core visual — fine inline. But `backgroundColor: 'oklch(0 0 0)'` could move to `className="bg-black"` equivalent token or into a `lcd-black` semantic token so other Radio elements (Visualizer `backgroundColor: 'oklch(0 0 0)'` at line 29; RadioDisc at line 91) share one source.
- Proposal: Define `--color-lcd-black` (or reuse an existing token) once; both files consume `backgroundColor: 'var(--color-lcd-black)'`. The eslint-disable-next-line for "lcd-device-screen-always-black" in both files is a clear signal the token should exist.
- Why safe: Token consolidation only — same resolved color.

---

### F11: RadioFrame hard-codes size + radius that the caller also knows — [Low]
- File: `apps/rad-os/components/apps/radio/RadioFrame.tsx:23`-`47`
- Pattern: pass-through
- Current: Frame width `277`, paddingBottom `8.5`, and the 4 border-radius values are hard-coded in `RadioFrame`, while the LCD inside `Radio.tsx` hard-codes width `260` and `borderBottomLeftRadius: 128`. The "260 = 277 − 8.5×2" and "128 ≈ 136 − 8" couplings are implicit math across two files.
- Proposal: Lift the frame dimensions into a single constants object (e.g. `radioMetrics = { frameW: 277, lcdW: 260, bowlRadius: 136, lcdBowlRadius: 128, pad: 8.5 }`) colocated in `styles.ts`. Both files import from it. Saves nothing in div count but prevents dimension drift, which is the structural issue driving the inline-style bloat.
- Why safe: Pure constant extraction, no runtime change.

---

### F12: `RadioWidget` double wrapper for pointer-events toggle — [Low]
- File: `apps/rad-os/components/apps/radio/RadioWidget.tsx:18`-`37`
- Pattern: wrapper-collapse
- Current: Outer `fixed pointer-events-none` + inner `pointer-events-auto` — classic "turn off then back on" pattern.
- Proposal: This pattern is common and intentional (lets the off-screen transform area not block clicks). It is safe to keep, BUT the inner wrapper has no other role — `Radio` could accept a `className` prop so `pointer-events-auto` lands on its root (`RadioFrame`) directly. Saves 1 div.
- Why safe: `RadioFrame` is already `position: relative` with no pointer-events constraint of its own.

---

## Summary / hotspots

1. **Highest ROI**: F2 (LCDScreen `padding="none"` then re-pads) — the primitive's API is being bypassed; this pattern likely repeats in other apps using `@rdna/ctrl`.
2. **Structural DRY wins**: F6 (unify `VolumeSlider` + `LcdSlider`), F7 (`MeterChannel` primitive), F8 (`LabeledLcdSlider`). These three hoists remove ~4 nested layout divs per render and ~60 LOC of copy-pasted glow styling.
3. **Token consolidation**: F10 — both Visualizer and Disc silently agree on `oklch(0 0 0)` for the LCD background but disable the linter separately. One semantic token fixes both.
4. **Constant drift**: F11 — Radio geometry is encoded twice (frame math + LCD math). A `radioMetrics` export prevents future inline-style sprawl.
5. **Low-effort cleanups**: F1, F3, F4, F5, F9, F12 — each removes one redundant wrapper or consolidates a class/style duplication.

Path: `/Users/rivermassey/Desktop/dev/DNA-logo-maker/ops/cleanup-audit/css-overscope/05-radio.md`
