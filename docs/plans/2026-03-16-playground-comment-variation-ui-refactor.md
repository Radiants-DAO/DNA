# Playground Comment/Variation UI Refactor

**Date:** 2026-03-16
**Status:** Planned
**Scope:** `tools/playground/app/playground/components/` + `nodes/ComponentCard.tsx`
**Gold standard:** `/Users/rivermassey/Downloads/agentation-main`

---

## Problem Statement

All annotation and variation UI in the playground has zero transition animations. Popovers snap in and out, pins appear instantly, loading states show static "...", and input focus states are broken. The result feels developer-tier rough. The Agentation source demonstrates exactly what the polished version should feel like — every interaction has a precise CSS animation, spring easing, and tactile micro-feedback.

---

## Audit Findings Summary

### Critical Jank (P1)

| Issue | Location |
|---|---|
| All popovers mount/unmount with no transition | `AnnotationComposer`, `VariationComposer`, `AnnotationDetail`, `AnnotationList`, `ViolationBadge`, adopt dropdown — all conditional `{condition && <X />}` |
| AnnotationPin has no enter/exit animation | `AnnotationPin.tsx` — instant appearance, instant disappearance on resolve |
| Static "..." loading state on all submit buttons | `AnnotationComposer:215`, `VariationComposer:186`, `AnnotationDetail:155,184`, `AnnotationList:160` |
| Input focus rings stripped with nothing replacing them | `AnnotationDetail:142`, `AnnotationList:153` — `focus:outline-none` only |
| No visual feedback when card enters A/V mode | `ComponentCard.tsx:837` — only `cursor-crosshair`, no card-level indicator |
| IterationCard adopt dropdown: no outside-click close | `ComponentCard.tsx:106-158` |

### Architecture Issues (P2)

| Issue | Location |
|---|---|
| `AnnotationComposer` and `VariationComposer` are ~60% duplicated JSX | Both files |
| Popup positioning has no viewport clamping or flip logic | Both composers use raw click coords with no overflow guard |
| `AnnotationBadge` visually inconsistent with `ViolationBadge` | `AnnotationBadge.tsx` — bespoke hardcoded colors vs `<Badge>` variant |
| No stagger on multi-pin entrance/exit | `ComponentCard.tsx` — all pins mount simultaneously |

---

## Animation Reference (from Agentation)

```
Popup enter:  0.2s  cubic-bezier(0.34, 1.56, 0.64, 1)  scale(0.95)+Y(4px) → normal
Popup exit:   0.15s ease-in                              reverse
Shake:        0.25s ease-out                             ±3px dampening X oscillation
Marker enter: 0.25s cubic-bezier(0.22, 1, 0.36, 1)      scale(0.3) → scale(1), stagger 20ms
Marker exit:  0.2s  ease-out                             scale(1) → scale(0.3)
Badge enter:  0.3s  cubic-bezier(0.34, 1.2, 0.64, 1)    scale(0) → scale(1) with delay 0.4s
Height anim:  0.3s  cubic-bezier(0.16, 1, 0.3, 1)       grid-template-rows: 0fr → 1fr (NO JS)
Btn active:   scale(0.92) 0.1s ease on :active
```

---

## Phase 1 — CSS Animation Primitives

**Files to create/edit:**
- `app/playground/globals.css` — add keyframes
- `app/playground/hooks/useAnimatedMount.ts` — new hook

### 1A. Keyframes in globals.css

```css
@keyframes popupIn {
  from { opacity: 0; transform: translateX(-50%) scale(0.95) translateY(4px); }
  to   { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
}
@keyframes popupOut {
  from { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
  to   { opacity: 0; transform: translateX(-50%) scale(0.95) translateY(4px); }
}
@keyframes panelIn {
  from { opacity: 0; transform: scale(0.95) translateY(4px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes panelOut {
  from { opacity: 1; transform: scale(1) translateY(0); }
  to   { opacity: 0; transform: scale(0.95) translateY(4px); }
}
@keyframes markerIn {
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
  to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
@keyframes markerOut {
  from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  to   { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
}
@keyframes badgeIn {
  from { opacity: 0; transform: scale(0); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-3px); }
  40%      { transform: translateX(3px); }
  60%      { transform: translateX(-2px); }
  80%      { transform: translateX(1px); }
}
@keyframes pendingPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.3); }
  50%      { box-shadow: 0 0 0 4px rgba(255,255,255,0); }
}
@keyframes spinDot {
  0%   { opacity: 1; }
  50%  { opacity: 0.3; }
  100% { opacity: 1; }
}
```

### 1B. `useAnimatedMount` hook

```ts
// State machine: "unmounted" → "entering" → "entered" → "exiting" → "unmounted"
// Returns { mounted, animClass } — mount on "entering"/"entered"/"exiting", unmount on "unmounted"
// enterDuration: 200ms default, exitDuration: 150ms default
```

Usage:
```tsx
const { mounted, animClass } = useAnimatedMount(isOpen, { enter: 200, exit: 150 });
return mounted ? <div className={animClass}>...</div> : null;
```

---

## Phase 2 — Shared `ComposerShell` Primitive

**File to create:** `app/playground/components/ComposerShell.tsx`

`AnnotationComposer` and `VariationComposer` share:
- Dark panel wrapper (same bg, border-radius, shadow)
- Element path header line
- Textarea with animated focus border
- Action row: cancel + primary button
- Submit loading state

Extract to `<ComposerShell>` that accepts:
```tsx
interface ComposerShellProps {
  isOpen: boolean;
  position: { left: number; top: number };  // raw, shell handles clamping
  elementLabel?: string;
  placeholder: string;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (text: string) => void;
  onCancel: () => void;
  accentClass?: string;  // optional tint for variation mode
  children?: React.ReactNode;  // extra controls (e.g. variation type selector)
}
```

Both composers become thin wrappers that supply their mode-specific props.

---

## Phase 3 — Popup Animations (all popovers)

**Target:** `AnnotationComposer`, `VariationComposer`, `AnnotationDetail`, `AnnotationList`, `ViolationBadge`, adopt dropdown

Apply `useAnimatedMount` to each. CSS animation classes:

- `AnnotationComposer` / `VariationComposer` (fixed, centered on click):
  - Enter: `animation: popupIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`
  - Exit: `animation: popupOut 0.15s ease-in forwards`
  - Shake: add/remove `.shake` class → `animation: shake 0.25s ease-out`

- `AnnotationList` / `ViolationBadge` / adopt dropdown (anchored panels, not centered):
  - Enter: `animation: panelIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`
  - Exit: `animation: panelOut 0.15s ease-in forwards`

- `AnnotationDetail` (positioned below a pin):
  - Same as panel but origin-top

### Outside-click behavior change

Current: clicking outside `AnnotationComposer` with text saves and closes.
Target (matching Agentation): outside-click **shakes** instead of dismissing if textarea has content. Empty → dismiss. This prevents accidental loss.

Fix `IterationCard` adopt dropdown — add `useEffect` outside-click listener using the existing `ViolationBadge` pattern.

---

## Phase 4 — Pin Animations

**File:** `app/playground/components/AnnotationPin.tsx`
**Host:** `ComponentCard.tsx` (manages `exitingPins` state)

### Enter
Pins should animate in on mount. Add `animate-[markerIn_0.25s_cubic-bezier(0.22,1,0.36,1)_both]` or equivalent inline `animationDelay: index * 20` for staggered entrance when multiple pins exist.

The stem (`h-2 w-px`) should scale from 0 height → full:
```css
/* stem */
transform-origin: top;
animation: stemIn 0.2s 0.1s ease-out both;
@keyframes stemIn { from { scaleY(0) } to { scaleY(1) } }
```

### Pending pulse
Pins with `status === "pending"` should have a subtle ring pulse:
```css
animation: pendingPulse 2s ease-in-out infinite;
```

### Exit
Add `exitingPins: Set<string>` state to `ComponentCard`. When resolved/dismissed:
1. Add pin ID to `exitingPins`
2. After 200ms → remove from `annotations[]`
3. Pin renders exit class while ID is in `exitingPins`

---

## Phase 5 — Smart Popup Positioning

**Used in:** `ComposerShell`, `AnnotationDetail`

Replace raw click coordinates with a clamped positioning utility:

```ts
function clampPopoverPosition(
  anchorX: number,   // px from left of card
  anchorY: number,   // px from top of card
  popoverW: number,  // 280px
  popoverH: number,  // estimated
  cardRect: DOMRect
): { left: number; top: number; flipY?: boolean }
```

Logic (matching Agentation):
- **Horizontal:** `Math.max(popoverW/2 + 8, Math.min(cardWidth - popoverW/2 - 8, anchorX))`
- **Vertical flip:** if `anchorY > cardHeight - popoverH - 20` → render above anchor (`bottom` instead of `top`)

Apply to both `AnnotationComposer` and `VariationComposer` via the shared `ComposerShell`.

---

## Phase 6 — Input & Focus Polish

**Files:** `AnnotationComposer`, `VariationComposer`, `AnnotationDetail`, `AnnotationList`

### Textarea focus ring
Replace `focus:outline-none` with `focus:outline-none focus:border-white/20 focus:bg-white/[0.06]`.

For animated border (matching Agentation exactly):
```tsx
const [focused, setFocused] = useState(false);
<textarea
  style={{ borderColor: focused ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)' }}
  className="transition-[border-color,background] duration-150"
  onFocus={() => setFocused(true)}
  onBlur={() => setFocused(false)}
/>
```

### Animated loading state
Replace `{submitting ? "..." : label}` with:
```tsx
{submitting ? <LoadingDots /> : label}
```

`LoadingDots` — three dots with staggered `animation: spinDot 1s ease-in-out infinite`:
```tsx
function LoadingDots() {
  return (
    <span className="flex gap-0.5 items-center">
      {[0, 150, 300].map((delay) => (
        <span key={delay} className="w-1 h-1 rounded-full bg-current"
          style={{ animation: `spinDot 1s ${delay}ms ease-in-out infinite` }} />
      ))}
    </span>
  );
}
```

---

## Phase 7 — Card Mode Visual Feedback

**File:** `ComponentCard.tsx`

When `editorMode === "annotate"` or `"variation"`:
- Add a faint mode-tinted border to the card hover state
- Show a small mode indicator badge (e.g. "A" or "V") at top-right corner of card on hover

```tsx
// In the card's className:
editorMode === "annotate" && isHovering
  ? "ring-1 ring-amber-400/30"
  : editorMode === "variation" && isHovering
  ? "ring-1 ring-violet-400/30"
  : ""
```

Alternatively: when card is in annotate mode, show a bottom border pulse (2px accent color, 1.5s pulse).

---

## Phase 8 — Badge Consistency

**File:** `AnnotationBadge.tsx`

Align with `ViolationBadge` visual style:
- Use consistent surface treatment (`bg-white/[0.08] border border-white/[0.12]`)
- Badge count pill: use same `badgeIn` animation keyframe
- On count change: replay animation (key the badge element on count value)

---

## Execution Order

```
Phase 1 (CSS primitives + hook)       — unblocks everything else, ~1hr
Phase 2 (ComposerShell extract)       — reduces risk of drift, ~1.5hr
Phase 3 (popup animations)            — highest visual impact, ~2hr
Phase 4 (pin animations)              — polished feel on create/resolve, ~1hr
Phase 5 (smart positioning)           — edge case fix, ~45min
Phase 6 (input + loading)             — accessibility + feedback, ~1hr
Phase 7 (card mode feedback)          — mode discoverability, ~30min
Phase 8 (badge consistency)           — aesthetic alignment, ~30min
```

Total estimate: ~8.5hr single-threaded. Can parallelize Phase 3/4/5/6 as separate agents after Phase 1+2 land.

---

## Files Touched

| File | Change |
|---|---|
| `app/playground/globals.css` | Add keyframes |
| `app/playground/hooks/useAnimatedMount.ts` | New hook |
| `app/playground/components/ComposerShell.tsx` | New shared primitive |
| `app/playground/components/AnnotationComposer.tsx` | Use ComposerShell, animated mount |
| `app/playground/components/VariationComposer.tsx` | Use ComposerShell, animated mount |
| `app/playground/components/AnnotationDetail.tsx` | Animated mount, input polish, positioning |
| `app/playground/components/AnnotationList.tsx` | Animated mount, inline action height anim, input polish |
| `app/playground/components/AnnotationPin.tsx` | Enter/exit/pulse animations |
| `app/playground/components/AnnotationBadge.tsx` | Badge consistency |
| `app/playground/components/ViolationBadge.tsx` | Animated mount (minor) |
| `app/playground/nodes/ComponentCard.tsx` | exitingPins state, adopt dropdown fix, mode feedback |
