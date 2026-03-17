# RDNA Fix Log

Append-only record of every design system fix processed through the playground annotation pipeline.
Used to identify recurring patterns and iteratively improve the design system.

**Format:** Each entry is a level-2 heading with date, component, priority, and intent.

---

## 2026-03-16 — Toggle — P2 fix — hardcoded radius

- **Component:** Toggle
- **File:** `packages/radiants/components/core/Toggle/Toggle.tsx`
- **Priority:** P2
- **Annotation:** Toggle track uses hardcoded border-radius instead of radius-sm token
- **Fix:** Replaced `rounded-full` with `rounded-sm` in track styles
- **Resolved by:** Claude

---


## 2026-03-16 — toggle [P2/fix]
**Problem:** Toggle track uses hardcoded border-radius instead of radius-sm token
**Resolution:** Replaced rounded-full with rounded-sm in the track styles
**Files:** packages/radiants/components/core/Toggle/Toggle.tsx

---

## 2026-03-16 — Toggle — P2 fix — hardcoded radius (resolved)

- **Component:** Toggle
- **File:** `packages/radiants/components/core/Toggle/Toggle.tsx`
- **Priority:** P2
- **Annotation:** Toggle track uses hardcoded border-radius instead of radius-sm token
- **Fix:** Replaced `rounded-full` with `rounded-sm` in track styles
- **Status:** Resolved
- **Resolved by:** Claude

## 2026-03-16 — toggle [P2/fix]
**Problem:** Toggle track uses hardcoded border-radius instead of radius-sm token
**Resolution:** Replaced rounded-full with rounded-sm in the track styles
**Files:** packages/radiants/components/core/Toggle/Toggle.tsx

## 2026-03-17 — composershell-v2 [-/change]
**Problem:** We can delete the composershell v2
**Resolution:** Deleted ComposerShellV2.tsx, removed registry entry and demo component
**Files:** tools/playground/app/playground/components/refined/ComposerShellV2.tsx, tools/playground/app/playground/app-registry.ts, tools/playground/app/playground/components/playground-ui-demos.tsx

## 2026-03-17 — annotationpin-v2 [-/change]
**Problem:** We can delete the annotationpin V2
**Resolution:** Deleted AnnotationPinV2.tsx, removed registry entry and demo component
**Files:** tools/playground/app/playground/components/refined/AnnotationPinV2.tsx, tools/playground/app/playground/app-registry.ts, tools/playground/app/playground/components/playground-ui-demos.tsx

## 2026-03-17 — annotationdetail-v2 [-/change]
**Problem:** We can delete the annotationdetailV2
**Resolution:** Deleted AnnotationDetailV2.tsx, removed registry entry and demo component
**Files:** tools/playground/app/playground/components/refined/AnnotationDetailV2.tsx, tools/playground/app/playground/app-registry.ts, tools/playground/app/playground/components/playground-ui-demos.tsx

## 2026-03-17 — annotationpin [-/change]
**Problem:** Use the styles of the annotationbadge.tsx for the head of the annotation pin. (Solid border, no shadow no hover details.)
**Resolution:** Styled pin head to match AnnotationBadge — rounded-sm with border-line, removed shadow-glow-sm and hover scale transform
**Files:** tools/playground/app/playground/components/AnnotationPin.tsx

## 2026-03-17 — annotationlist [-/change]
**Problem:** Make the (3 pending) on a line below annotations. Smaller font size. Add spacing between resolve and dismiss
**Resolution:** Split pending count onto its own line below "Annotations" header at text-[10px], increased resolve/dismiss button gap from gap-1 to gap-3
**Files:** tools/playground/app/playground/components/AnnotationList.tsx

## 2026-03-17 — annotationlist [-/change]
**Problem:** Font sizes not great in terms of hierarchy
**Resolution:** Bumped section headers (Annotations, Resolved) from text-xs to text-sm, changed pending count from text-[10px] to text-xs for clear size hierarchy
**Files:** tools/playground/app/playground/components/AnnotationList.tsx

## 2026-03-17 — checkbox [-/change]
**Problem:** The focus state should have a glow, not a hard outline
**Resolution:** Replaced hard 2px ring + glow with soft layered glow (6px sun-yellow + 14px at 30% opacity) on both Checkbox and Radio focus-visible states
**Files:** packages/radiants/components/core/Checkbox/Checkbox.tsx

## 2026-03-17 — field [-/question]
**Problem:** What is the difference between this and input.tsx?
**Resolution:** Dismissed — Input is the visual text input primitive (styling, focus states). Field is an accessible wrapper that composes label, description, error message, and any input-like child with proper aria attributes. Complementary layers, not redundant.
**Files:** none

## 2026-03-17 — contextmenu [-/fix]
**Problem:** In dark mode, the contextmenu dropdown choices on-hover should have a cream background with ink text
**Resolution:** Changed hover from bg-accent to bg-inv + text-flip on ContextMenuItem and ContextMenuCheckboxItem. Destructive items keep text-danger on hover.
**Files:** packages/radiants/components/core/ContextMenu/ContextMenu.tsx

## 2026-03-17 — collapsible [P1/change]
**Problem:** Make sure this is using a radiants icon from the icon library, use mondwest for the copy below, and give it better hover states in both light and dark mode
**Resolution:** Replaced inline + text with ChevronDown from radiants icons/generated, added font-heading (Mondwest) to content panel, enhanced trigger hover with border-line-hover + text-head for better visibility in both modes
**Files:** packages/radiants/components/core/Collapsible/Collapsible.tsx

## 2026-03-17 — annotationpin [-/change]
**Problem:** Pins should change w/ light/dark mode (same as badge), delete popover info, comments icon should change to edit icon, clicking enters edit flow
**Resolution:** Switched pin head to semantic tokens (border-main/25, bg-main/[0.08], text-main) for light/dark adaptation. Removed hover popover overlay. Replaced CommentIcon with EditIcon as default. Removed unused PRIORITY_COLORS map and hovered state.
**Files:** tools/playground/app/playground/components/AnnotationPin.tsx

## 2026-03-17 — collapsible [-/change]
**Problem:** This font should be mondwest
**Resolution:** Dismissed — already using font-heading (PP Mondwest) on both Trigger and Content from prior P1 fix
**Files:** none

## 2026-03-17 — alert [—/change]
**Problem:** Should have shadow of alert.iteration-1
**Resolution:** Added shadow-raised to alert base class, matching iteration-1 styling
**Files:** packages/radiants/components/core/Alert/Alert.tsx

## 2026-03-17 — alert [—/change]
**Problem:** Light mode should follow RDNA guidance — shadows + borders of alert-iteration-1, bg from current borders. Dark mode perfect as-is.
**Resolution:** Applied iteration-1 light mode styling: shadow-raised base, border-line borders, colored bg, text-main. Dark mode glow preserved.
**Files:** packages/radiants/components/core/Alert/Alert.tsx

## 2026-03-17 — contextmenu [—/change]
**Problem:** Remove the top/bottom padding from the contextmenu dropdown
**Resolution:** Changed py-1 to py-0 on ContextMenu Popup
**Files:** packages/radiants/components/core/ContextMenu/ContextMenu.tsx

## 2026-03-17 — toggle [—/change]
**Problem:** When checked/active, text should be ink, border should be ink (light mode)
**Resolution:** Changed pressed state from text-flip/border-accent to text-accent-inv/border-inv for ink appearance
**Files:** packages/radiants/components/core/Toggle/Toggle.tsx

## 2026-03-17 — field [—/change]
**Problem:** When active/typing, the bg of the field should be white
**Resolution:** Input already has focus:bg-card (= pure-white). Added focus:bg-card to Combobox Input for consistency.
**Files:** packages/radiants/components/core/Combobox/Combobox.tsx

## 2026-03-17 — combobox [—/change]
**Problem:** Doesn't drop down when clicked, only shows when typed
**Resolution:** Added explicit openOnInputClick prop to Combobox Root for click-to-open behavior
**Files:** packages/radiants/components/core/Combobox/Combobox.tsx

## 2026-03-17 — badge [—/change]
**Problem:** Use the font used for the playground cards (font-mono) instead of font-heading
**Resolution:** Changed badge font from font-heading to font-mono to match playground card styling
**Files:** packages/radiants/components/core/Badge/Badge.tsx

## 2026-03-17 — navigationmenu [—/change]
**Problem:** Hover should have black bg, cream text
**Resolution:** Changed trigger and link hover to bg-inv text-flip (ink bg, cream text). Also updated popup-open state to match.
**Files:** packages/radiants/components/core/NavigationMenu/NavigationMenu.tsx

## 2026-03-17 — navigationmenu [—/change]
**Problem:** Dropdown should have 0 padding, ink bg on hover, cream text
**Resolution:** Removed content padding (p-3 to p-0), link hover uses bg-inv text-flip
**Files:** packages/radiants/components/core/NavigationMenu/NavigationMenu.tsx

## 2026-03-17 — alert [—/change]
**Problem:** In dark mode, make sure success/warning/error/info glows match their border glows
**Resolution:** Already correct — dark:border-success and dark:shadow use the same --color-success token (and likewise for warning/danger/link). No code change needed.
**Files:** none

## 2026-03-17 — alert [—/change]
**Problem:** Light mode bg colors: success=mint, warning=yellow, error=red, info=blue. Add relevant icons from radiants icon library.
**Resolution:** BG colors were already correct (success=mint, warning=sun-yellow, error=sun-red, info=sky-blue). Added variant-aware default icons via AlertVariantContext: Checkmark (success), WarningFilled (warning), CloseFilled (error), InfoFilled (info). Alert.Icon renders the default icon when no children are provided.
**Files:** packages/radiants/components/core/Alert/Alert.tsx

## 2026-03-17 — checkbox [—/change]
**Problem:** When checked, the full checkbox seems to move down
**Resolution:** Added absolute inset-0 to the Indicator wrapper so it overlays without affecting layout flow
**Files:** packages/radiants/components/core/Checkbox/Checkbox.tsx

## 2026-03-17 — checkbox [—/change]
**Problem:** In dark mode the check should be black (not white)
**Resolution:** Changed checkmark color from text-main (cream in dark) to text-accent-inv (ink in both modes)
**Files:** packages/radiants/components/core/Checkbox/Checkbox.tsx

## 2026-03-17 — spinner [P4/change]
**Problem:** Create a loading dots variant: 3 pixelated dots filling left-to-right, "LOADING…"/"LOADED" text in PixelCode font, flash on completion, light/dark mode support.
**Resolution:** Added `dots` variant to Spinner via new `variant` prop. LoadingDots sub-component renders 3 square dots (no rounded corners) with sequential fill animation, font-mono text, and animate-pulse flash on completion. Uses bg-main/bg-line/text-main for mode support.
**Files:** packages/radiants/components/core/Spinner/Spinner.tsx

## 2026-03-17 — spinner [-/change]
**Problem:** let's change the finished state to the checkmark icon here
**Resolution:** Replaced Unicode checkmark character (✓) with radiants Checkmark SVG icon component for the completed state in the default variant
**Files:** packages/radiants/components/core/Spinner/Spinner.tsx

## 2026-03-17 — spinner [-/change]
**Problem:** doesn't seem like anything is happening in light mode on the dots, lets make them yellow by default, fill with black
**Resolution:** Changed unfilled dot color from bg-line to bg-accent (brand yellow) so the loading animation is visible in light mode — filled dots remain bg-main (black)
**Files:** packages/radiants/components/core/Spinner/Spinner.tsx

## 2026-03-17 — alert [-/change]
**Problem:** add relevant icons to all alert variants
**Resolution:** Added CommentsBlank icon for the default variant — all 5 variants (default, success, warning, error, info) now have icons in VARIANT_ICONS
**Files:** packages/radiants/components/core/Alert/Alert.tsx

## 2026-03-17 — badge [-/change]
**Problem:** reduce the left/right padding -> should be the same as top/bottom
**Resolution:** Equalized horizontal padding to match vertical — sm: px-0.5/py-0.5, md: px-1/py-1
**Files:** packages/radiants/components/core/Badge/Badge.tsx

## 2026-03-17 — alert [-/change]
**Problem:** background glow on success should be mint-colored
**Resolution:** Swapped dark mode success glow from --color-success (light mint, low chroma) to --color-success-mint (saturated mint), bumped radius 8px→12px
**Files:** packages/radiants/components/core/Alert/Alert.tsx

## 2026-03-17 — alert [-/change]
**Problem:** background/drop shadow on info variant should be blue (same as border)
**Resolution:** Changed info glow to use --color-sky-blue directly, bumped radius 8px→12px for visibility
**Files:** packages/radiants/components/core/Alert/Alert.tsx

## 2026-03-17 — alert [-/change]
**Problem:** drop shadow/glow on error should be red (same as light mode)
**Resolution:** Changed error glow to use --color-sun-red directly, bumped radius 8px→12px for visibility
**Files:** packages/radiants/components/core/Alert/Alert.tsx
