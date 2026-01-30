# Unified Edit Mode - Cursor Default with E Key Smart Edit

## Problem

RadFlow has multiple disconnected editor modes (Component-ID, Text-Edit, Comment, Preview) that don't share state or UX patterns. Users must context-switch between modes with different behaviors. The current modes lack:
- Visual feedback beyond hover states
- Unified clipboard/output management
- Smart detection of user intent
- Designer panel integration for DOM editing

## Vision

Create a unified editing system with **Cursor mode (Esc)** as default and **Smart Edit (E)** as the primary editing mode. "Show don't tell" - edit directly in the DOM rather than describing changes.

## Mode State Machine

```
┌─────────────────────────────────────────────────────────┐
│                    APP LAUNCH                            │
│                        ↓                                 │
│              ┌─────────────────┐                        │
│              │  CURSOR (Esc)   │ ← Default on launch    │
│              │  Neutral state  │                        │
│              └────────┬────────┘                        │
│                       │                                  │
│    ┌──────┬──────┬────┼────┬──────┬──────┬──────┐       │
│    ↓      ↓      ↓    ↓    ↓      ↓      ↓      ↓       │
│   [E]    [V]    [T]  [C]  [Q]    [D]    [A]    [P]      │
│  Smart Select Text Comm Quest Design Anim Preview      │
│                                                          │
│  Any mode → Esc → returns to Cursor                     │
│  Mid-edit → BLOCKED (must Enter/Esc first)              │
└─────────────────────────────────────────────────────────┘
```

### Mode Definitions

| Key | Mode | Behavior | Status |
|-----|------|----------|--------|
| **Esc** | Cursor | Default on launch. Neutral state. Alt+hover shows box-model overlay | Phase 1 |
| **E** | Smart Edit | Auto-detect edit type based on cursor position + modifiers | Phase 2 |
| **V** | Select/Prompt | Build linear prompt with element selections (can reuse/delete component-id mode code) | Phase 2 |
| **T** | Text-edit | Inline contenteditable with before/after diff | Phase 2 |
| **C** | Comment | Add feedback comment (radio toggle with Q) | Phase 1 |
| **Q** | Question | Add question (radio toggle with C) | Phase 1 |
| **D** | Designer | Show/hide property panels, capture DOM diffs | Phase 3 (blocked by fn-2) |
| **A** | Animation | Coming soon - disabled button | Future |
| **P** | Preview | Clean preview without overlays | Phase 2 |

### Mode Switching Rules

1. **Esc is true default** - app launches into Cursor mode
2. **C/Q are radio toggles** - pressing active mode turns it off (returns to Cursor)
3. **C/Q with popover open** - if popover is open and user presses C while in Q mode (or vice versa), switch the type from comment↔question without closing the popover
4. **Mid-edit blocking** - cannot switch modes while contenteditable is active
   - Must press Enter (confirm) or Esc (cancel) first
   - Keyboard shortcut simply does nothing during active edit
   - No visual indicator needed (relies on keyboard blocking only)
5. **Esc always exits** - from any mode, returns to Cursor

## UI Components

### Floating Icon Bar
- Position: bottom-center (default), repositionable to top/bottom + left/center/right
- Global user preference for position
- Evolve from existing `ModeToolbar.tsx`
- Match existing RadFlow styling (current theme)

### Drawer
- Opens FROM the bar (direction based on bar position)
- Hugs content by default, max viewport then overflow:scroll
- Resizable (drag handle) + collapsible
- Contains edit list per mode with filtering by mode type
- Rich preview (truncated selectors), option to show/edit full markdown
- Markdown is export-only (no bi-directional sync)

### Disabled Mode Buttons
- **D mode**: Disabled with tooltip "Coming soon - requires Designer Panel"
- **A mode**: Disabled with tooltip "Coming soon"

### Hover Tooltips
- Full details: Component, Source, Props, Parents, Selector
- Non-interactive (information display only)
- 150ms quick fade on mouse leave

### Visual Indicators
- Color-coded dots per mode + number badge for pending edits
- Cursor types: default, crosshair, text, pointer, glove pointer, comment, question

### Box Model Overlay (Alt+hover in Cursor mode only)
- Shows margin, padding, border, gap (flex/grid)
- 150ms quick fade on Alt release

## Output Format

### With React Source (fiber available)

```markdown
# Edit Session

## src/components/Hero.tsx

### Heading: line 42
**Text Change:**
- Before: "Welcom to our site"
- After: "Welcome to our site"

### Button "Submit": line 67
**Style Changes:**
- `padding`: 8px → 12px
- `background`: var(--btn-bg) → var(--accent)

**Comment:**
- Make this more prominent

  **Context** (bridge):
  - Type: function component
  - Parents: Form → Page
```

### Without React Source (DOM-only fallback)

```markdown
# Edit Session

## button.primary.submit

### Button
**Text Change:**
- Before: "Sbumit"
- After: "Submit"

  **Context** (dom):
  - Classes: primary, submit, btn-lg
  - Selector: `button.primary.submit`
```

**Key difference**: CSS selector becomes the "file" header when no source file available.

## V Mode (Select/Prompt Builder)

Build contextual prompts with element selections:
1. Press V, text bubble opens above bar
2. Click element → populates bar with truncated ref (e.g., `[button]`, `[text: fdsafdsa]`)
3. Add text between selections
4. Click ref → highlights/navigates to element
5. Pencil icon → edit/replace selection
6. Copy outputs full markdown with details, UI shows truncated

Soft limit: ~10 selections with warning

**Implementation note:** Existing component-id mode code (`componentIdSlice.ts`, related UI) can be reused or deleted for V mode - whatever is easiest. The selection/hover/multi-select patterns are similar.

## Change Detection (D Mode - Phase 3)

### Performance Budget
- Target: <100ms latency for detecting style changes
- Noticeable delay acceptable for non-realtime feedback

### Implementation Approach
- MutationObserver on target element subtree
- Diff computed styles before/after
- Hook into bridge's style injection system

### Fallback Behavior
- If exceeds 100ms budget: Throttle to 200ms with "calculating..." indicator
- Graceful degradation, never block UI

## Phases with Exit Criteria

### Phase 1: Icon Bar + State Foundation

**Deliverables:**
- Floating icon bar with all mode buttons
- Migrate existing comments panel to drawer
- Cursor mode (Esc) as default on launch
- C/Q modes functional with radio toggle behavior
- Disabled D/A buttons with "coming soon" tooltips
- **State consolidation**: Consolidate all mode-related boolean flags (`textEditMode`, `componentIdMode`, `previewMode`) into single `editorMode` enum as source of truth

**Exit Criteria (must all pass):**
- [ ] Icon bar renders at bottom-center
- [ ] C/Q modes work with radio toggle
- [ ] Drawer opens from bar position
- [ ] Bar position persists to localStorage (edit history is session-only)
- [ ] Cmd+Shift+C copies current mode's edits
- [ ] Position preference saves/loads
- [ ] `editorMode` enum is single source of truth (no separate boolean flags)

**NOT in Phase 1:**
- E mode (Smart Edit)
- V mode (Select/Prompt)
- T mode (Text-edit with diff)
- Box model overlay
- D mode (Designer)

### Phase 2: Individual Modes

**Deliverables:**
- E (Smart Edit with basic auto-detect)
- V (Select/Prompt builder)
- T (Text-edit with before/after diff)
- P (Preview integrated)
- Alt+hover box model overlay (Cursor mode)

**Exit Criteria:**
- [ ] E mode detects text vs element based on cursor
- [ ] V mode accumulates selections with truncated refs
- [ ] T mode captures before/after text diff
- [ ] Before/after diff in clipboard output
- [ ] Box model overlay appears on Alt+hover

### Phase 3: Clipboard Panel + D Mode

**Deliverables:**
- Refined clipboard panel with mode filtering
- D mode (after fn-2 completion)

**Exit Criteria:**
- [ ] Clipboard filters by mode type
- [ ] D mode shows/hides property panels
- [ ] DOM diffs captured for style changes

## Dependencies

- **fn-2** blocks D mode fully (designer panel integration)
- All other modes can be developed and tested in dogfood mode

## Deprecated: SmartAnnotate Mode

The existing `smart-annotate` mode (`smartAnnotateSlice.ts`) will be **removed** as dead code (0% UI implementation). Analysis of unique features:

| Feature | SmartAnnotate | Unified Edit Mode | Action |
|---------|---------------|-------------------|--------|
| Inline text editing | `startInlineEdit`, `finishInlineEdit` | T mode (contenteditable) | Already covered |
| Before/after text diff | `originalText`, `editedText` | T mode output | Already covered |
| Computed styles capture | `computedStyles` field | D mode (Phase 3) | Defer to D mode |
| Text selection quoting | `selectedText` field | - | Can add to Comment mode later |
| Accessibility attributes | `accessibility` field | - | Can add to Comment mode later |
| Nearby context | `nearbyText`, `nearbyElements` | - | Low priority, skip |
| CSS classes | `cssClasses` field | Rich context already has classes | Already covered |

**Cleanup tasks (Phase 1):**
- Remove `smart-annotate` from `EditorMode` union type
- Delete `smartAnnotateSlice.ts` and related imports
- Remove `SmartAnnotateSlice` from `AppState` interface

## Key Decisions (Resolved)

1. **Esc is true default** - app launches into Cursor mode, E is active editing
2. **Mid-edit blocking via keyboard** - no visual indicator, shortcuts just don't work
3. **C/Q radio toggle** - pressing active mode returns to Cursor
4. **DOM-only uses selector as header** - e.g., `## button.primary.submit`
5. **100ms change detection budget** - throttle to 200ms with indicator if exceeded
6. **D mode disabled while blocked** - tooltip explains dependency
7. **Clipboard accumulates all** - Shift+Cmd+C copies active mode only
8. **Enter confirms, Esc cancels** - consistent across all edit types
9. **No undo** - rely on clear and re-do
10. **Multi-select** - batch style edits (same change to all)
11. **SmartAnnotate mode removed** - `smart-annotate` will be REMOVED from `EditorMode` types (dead code, 0% UI implementation). Unique features (inline text editing, computed styles capture, text selection quoting, accessibility attributes) can be added to Comment mode later if needed. T mode already covers inline text editing with before/after diff.
12. **localStorage scope** - only bar position persists to localStorage; edit history is session-only (clears on page reload/close)
13. **State consolidation** - single `editorMode` enum is source of truth; remove separate `textEditMode`, `componentIdMode`, `previewMode` boolean flags

## Edge Cases

- **No React source**: CSS selector as file header, classes/computed styles in context
- **Page reload during edit**: Edit history clears (session-only); bar position preserved
- **10+ selections in V mode**: Soft warning about unwieldy prompts
- **Switch mode mid-edit**: Blocked - keyboard shortcuts ignored until Enter/Esc
- **Change detection slow**: Throttle to 200ms, show "calculating..." indicator

## Open Questions (Remaining)

- Exact modifier key mappings for Smart Edit auto-detect (TBD in Phase 2 implementation)

## Reference Materials

- UI Mockups: `/Users/rivermassey/Desktop/Actions bar/`
- Hover tooltip example: `/Users/rivermassey/Desktop/hvoer.png`
- Agentation package: `node_modules/agentation` (inspiration, not fork)
- Visualizer reference: `/Users/rivermassey/Desktop/dev/_references/Visualizer` (reviewed for UI patterns: positioning, keyboard handling, drawer behavior)

## Acceptance (Full Feature)

- [ ] Floating icon bar renders with all mode buttons
- [ ] Disabled modes show "coming soon" tooltip
- [ ] Esc enters Cursor mode (default on launch)
- [ ] C/Q modes work with radio toggle behavior
- [ ] Mid-edit mode switching blocked (keyboard only)
- [ ] Drawer opens from bar position correctly
- [ ] Bar position persists to localStorage (edit history is session-only)
- [ ] Clipboard accumulates all modes, filter works
- [ ] Before/after diff output for text edits
- [ ] DOM-only fallback uses selector as header
- [ ] Change detection throttles gracefully
- [ ] Match existing RadFlow styling
