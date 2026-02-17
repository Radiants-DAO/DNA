# Flow UI Functional Test Walkthrough (Full Front-End Review)

Date: 2026-02-13
Owner: Front-end review pass
Scope: `tools/flow/packages/extension` + extension-facing sidecar flows in `tools/flow/packages/server`

---

## What This Covers

This checklist is based on a code-level review of the current Flow extension surface. It is split into:

1. Routed UI that should be testable now.
2. Routed UI with edge-case risk.
3. Implemented but not surfaced UI (front-end wiring gaps).

Use this doc as a step-by-step manual test script and fill in what is missing.

---

## Feature Status Map From Code Review

### Routed and testable now

- DevTools panel shell: left tabs, settings bar, theme toggle, Flow power toggle
- On-page runtime: toolbar, mode switching, hover/select overlays
- Designer + Mutations tabs
- Feedback tab (human comments/questions + agent feedback thread UI)
- Components/Variables/Assets/Accessibility tabs (scanner-driven)
- Prompt palette (`Cmd/Ctrl+K`) and prompt draft actions
- Session auto-save/restore in `chrome.storage.session`
- Sidecar connection indicator + tab-scoped incoming agent feedback

### Routed but with known caveats to verify

- Design submodes `guides` and `accessibility` exist in mode model but no dedicated on-page tool wiring
- `component-id` mode UI exists but no obvious user entrypoint
- Feedback "Copy" and "Clear" actions operate on human comments only, not agent feedback
- Settings bar "Search..." input is currently local UI state only (no wired behavior)

### Implemented but not surfaced in current panel routing

- `SearchPanel`, `ImageSwapPanel`, `ScreenshotPanel`, context `AccessibilityPanel`
- `ModeToolbar`, `ContextOutputPanel`, `MutationDiffPanel`
- `panel:get-component-map` path is present but not used by current `ComponentsPanel`
- `panel:screenshot` handler in content router is a stub response path

---

## Environment Setup

1. Start extension build/dev server:

```bash
cd tools/flow
pnpm --filter @flow/extension dev
```

2. Optional but recommended for agent-feedback tests:

```bash
cd tools/flow
pnpm --filter @flow/server dev -- --root . --port 3737
```

3. Load unpacked extension from:
`tools/flow/packages/extension/.output/chrome-mv3/`

4. Open at least two test pages:
- One React-heavy app/page
- One non-React/static page

5. Open DevTools for each page and select the Flow panel.

---

## How To Log Results

For each test item:

- Mark `[x]` when done.
- Add a short note under it:
  - Observed:
  - Missing/bug:
  - Severity: (critical/high/medium/low)

---

## A. Panel Shell and Connectivity

- [ ] `SHELL-01` Panel loads without crash on first open.
  - Expected: Left tab bar + top settings bar render; no blank panel.

- [ ] `SHELL-02` Left tab click toggles tab open/closed.
  - Expected: Clicking same tab again collapses to `PreviewCanvas`.

- [ ] `SHELL-03` Left tab keyboard navigation works (`ArrowUp`/`ArrowDown`).
  - Expected: Focus and active tab move through all 7 tabs.

- [ ] `SHELL-04` Mutations tab badge count updates when diffs exist.
  - Expected: Badge shows `1..9+` based on pending net diffs.

- [ ] `SHELL-05` Feedback tab badge count updates for human comments.
  - Expected: Badge increments with new comments/questions.

- [ ] `SHELL-06` Theme toggle (sun/moon) flips panel chrome styles.
  - Expected: Panel theme changes between dark/light and remains usable.

- [ ] `SHELL-07` Settings dropdown opens/closes correctly.
  - Expected: Click outside closes dropdown; no stuck state.

- [ ] `SHELL-08` Dogfood mode toggle changes state and persists after reload.
  - Expected: Toggle state survives panel reopen (persist middleware).

- [ ] `SHELL-09` Bridge status dot reflects connection state.
  - Expected: Connected when panel-content bridge is active; not stuck in connecting/error.

- [ ] `SHELL-10` Sidecar status dot behavior.
  - Expected: Hidden when disconnected; yellow while connecting; green when connected.

---

## B. Flow Power Toggle and On-Page Runtime

- [ ] `FLOW-01` Flow is OFF by default after panel open.
  - Expected: Toggle reads `Flow OFF`; on-page toolbar hidden.

- [ ] `FLOW-02` Turning Flow ON shows on-page toolbar.
  - Expected: Toolbar appears in inspected page overlay root.

- [ ] `FLOW-03` Turning Flow ON auto-sets top-level mode to `design`.
  - Expected: Mode state changes and design hover/select behavior starts.

- [ ] `FLOW-04` Turning Flow OFF hides overlays and clears highlight state.
  - Expected: Hover box/label disappear; persistent selections clear.

- [ ] `FLOW-05` Flow toggle is disabled if bridge not connected.
  - Expected: Cannot switch ON while panel-content port unavailable.

- [ ] `FLOW-06` Normal page interaction when Flow OFF.
  - Expected: Clicks/typing/scroll unaffected by Flow interception.

---

## C. Mode Switching and Hotkeys (On Page)

- [ ] `MODE-01` Top-level hotkeys change mode: `d`, `c`, `q`, `s`, `i`, `t`, `Esc`.
  - Expected: `mode:changed` syncs to panel and behavior changes accordingly.

- [ ] `MODE-02` Escape returns to default mode from any active mode.
  - Expected: Hover overlays and tool states reset correctly.

- [ ] `MODE-03` In design mode, number keys `1-8` switch design submode.
  - Expected: Submode updates in mode state; relevant tool behavior changes when supported.

- [ ] `MODE-04` On-page toolbar buttons switch top-level mode.
  - Expected: Buttons visually reflect active mode; panel state mirrors selection.

- [ ] `MODE-05` On-page design submode popup buttons switch submode.
  - Expected: Selected submode button is highlighted.

- [ ] `MODE-06` Hotkeys ignored while typing in inputs/textareas/contenteditable.
  - Expected: No unintended mode switches during text entry.

- [ ] `MODE-07` Search mode has no hover overlay box.
  - Expected: `showsHoverOverlay=false` behavior matches mode config.

- [ ] `MODE-08` Comment/question mode sets panel feedback type and tab focus.
  - Expected: Feedback tab auto-opens when entering comment/question flow.

---

## D. Selection and Inspection Pipeline

- [ ] `SEL-01` Hovering elements shows overlay + label.
  - Expected: Label includes tag/id/class snippets.

- [ ] `SEL-02` Clicking element selects and sends metadata to panel.
  - Expected: Selected element data appears, including selector and rect.

- [ ] `SEL-03` Inspection result arrives after selection.
  - Expected: Designer initially shows loading, then grouped style sections populate.

- [ ] `SEL-04` Non-React page inspection still succeeds.
  - Expected: No crash; fiber context may be null but styles/layout/animations still present.

- [ ] `SEL-05` Re-selecting another element updates inspector context correctly.
  - Expected: No stale selector or stale style data.

- [ ] `SEL-06` Persistent selection outline appears on select and pulses.
  - Expected: Outline remains and can be cleared by relevant actions.

- [ ] `SEL-07` Overlay survives moderate DOM churn and scroll changes.
  - Expected: Highlight tracks current hovered/selected element or clears safely when detached.

---

## E. Designer Tab (Style Editing)

- [ ] `DESIGN-01` Empty state when no element selected.
  - Expected: "No element selected" guidance appears.

- [ ] `DESIGN-02` Layout section changes apply style mutation.
  - Expected: DOM updates and mutation diff logs.

- [ ] `DESIGN-03` Spacing section changes apply style mutation.
  - Expected: Margin/padding updates visible immediately.

- [ ] `DESIGN-04` Size section changes apply style mutation.
  - Expected: Width/height changes visible.

- [ ] `DESIGN-05` Position section changes apply style mutation.
  - Expected: Position/top/left/z-index behavior updates.

- [ ] `DESIGN-06` Typography section changes apply style mutation.
  - Expected: Font style/size/line-height changes apply.

- [ ] `DESIGN-07` Backgrounds section changes apply style mutation.
  - Expected: Background color/gradient changes apply.

- [ ] `DESIGN-08` Borders section changes apply style mutation.
  - Expected: Border visuals update.

- [ ] `DESIGN-09` Box Shadows section changes apply style mutation.
  - Expected: Shadow updates apply and are tracked.

- [ ] `DESIGN-10` Effects section changes apply style mutation.
  - Expected: Effects/filter/blend changes apply.

- [ ] `DESIGN-11` Section collapse/expand interaction is stable.
  - Expected: No unexpected resets or flicker.

- [ ] `DESIGN-12` Breadcrumb/selector display matches selected element.
  - Expected: Selector suffix and tag name update per selection.

---

## F. Mutations Tab and Undo/Redo

- [ ] `MUT-01` Mutation list shows selector + property before/after deltas.
  - Expected: Each mutation includes readable change details.

- [ ] `MUT-02` Undo button works and decrements undo stack.
  - Expected: DOM reverts and canUndo/canRedo update.

- [ ] `MUT-03` Redo button works after undo.
  - Expected: DOM re-applies change.

- [ ] `MUT-04` "Clear all" resets net diff list and undo/redo counters.
  - Expected: Mutation tab returns to empty state.

- [ ] `MUT-05` `Cmd/Ctrl+Z` and `Cmd/Ctrl+Shift+Z` work in panel context.
  - Expected: Keyboard shortcuts mirror undo/redo buttons.

- [ ] `MUT-06` `Cmd/Ctrl+Z` and redo work in page while in design mode.
  - Expected: Unified mutation engine handles key actions.

- [ ] `MUT-07` No mutation leakage when switching tabs or modes.
  - Expected: State remains coherent across panel navigation.

---

## G. Feedback Tab (Comments and Questions)

- [ ] `FDBK-01` Empty state shows correct call-to-action when no feedback exists.
  - Expected: Buttons for Comment Mode and Question Mode are visible.

- [ ] `FDBK-02` In comment mode, clicking element opens on-page composer bubble.
  - Expected: Bubble appears near click point and focuses textarea.

- [ ] `FDBK-03` Saving comment creates yellow badge + panel item.
  - Expected: Item count increments; badge anchored to selected element.

- [ ] `FDBK-04` Saving question creates blue badge + panel item.
  - Expected: Type label distinguishes question vs comment.

- [ ] `FDBK-05` Badge hover shows tooltip content.
  - Expected: Tooltip shows component header + feedback text.

- [ ] `FDBK-06` Clicking badge opens edit composer.
  - Expected: Existing text prefilled; save updates both page and panel.

- [ ] `FDBK-07` Editing from panel updates on-page badge content.
  - Expected: Badge tooltip reflects edited text.

- [ ] `FDBK-08` Delete from panel removes badge and list row.
  - Expected: Removed item no longer appears after refresh/re-render.

- [ ] `FDBK-09` Clear in panel removes all human comment/question badges.
  - Expected: Human feedback list empties and badges disappear.

- [ ] `FDBK-10` Grouped/timeline toggle changes list ordering/grouping.
  - Expected: Grouped by element or flat chronological timeline.

- [ ] `FDBK-11` Copy button writes markdown to clipboard.
  - Expected: Markdown contains human comments/questions.

- [ ] `FDBK-12` Scroll/resize repositions both human and agent badges.
  - Expected: Badges stay anchored to elements; no drift.

- [ ] `FDBK-13` Exiting comment/question mode clears temporary selection state.
  - Expected: No stale hovered/selected feedback element state.

---

## H. Agent Feedback and Sidecar Threading

These require sidecar server + MCP tool calls.

- [ ] `AGENT-01` Sidecar status transitions to connected when server is running.
  - Expected: Green sidecar dot in settings bar.

- [ ] `AGENT-02` `flow_post_feedback` creates agent item and purple badge.
  - Expected: Agent item appears in Feedback tab with intent/severity/status.

- [ ] `AGENT-03` Posting same `id` updates existing feedback instead of duplicate.
  - Expected: Single item per `{id, tabId}` in panel.

- [ ] `AGENT-04` Agent badge intent icon/tooltip render correctly.
  - Expected: Badge text and tooltip reflect payload.

- [ ] `AGENT-05` Thread expand/collapse works for agent feedback replies.
  - Expected: Reply count toggles threaded message list.

- [ ] `AGENT-06` Human reply from panel appends immediately to thread.
  - Expected: Optimistic UI update visible instantly.

- [ ] `AGENT-07` Human reply while sidecar disconnected is queued.
  - Expected: No crash; queued behavior logged and message sends on reconnect.

- [ ] `AGENT-08` `flow_resolve_annotation` marks item resolved and updates badge.
  - Expected: Badge turns resolved and eventually fades out.

- [ ] `AGENT-09` Tab scoping holds with two inspected tabs.
  - Expected: Agent feedback only appears on matching tabId.

- [ ] `AGENT-10` Verify current clear/copy semantics with agent feedback present.
  - Expected: Clear/Copy in Feedback header affect human comments; agent list remains (current behavior).

---

## I. Components Tab

- [ ] `COMP-01` Auto-scan runs on tab open and on navigation.
  - Expected: Shows scanning state then results/empty state.

- [ ] `COMP-02` Manual rescan button works.
  - Expected: Loading state toggles and list refreshes.

- [ ] `COMP-03` Search filters by name/framework/selector.
  - Expected: Filtered list updates live.

- [ ] `COMP-04` Components grouped into UI vs Functional sections.
  - Expected: Groups render with counts and collapse behavior.

- [ ] `COMP-05` Selecting a row opens preview panel.
  - Expected: Preview shows selector/source/instances when available.

- [ ] `COMP-06` Copy selector action works from preview.
  - Expected: Clipboard receives selector and copied state feedback appears.

- [ ] `COMP-07` Non-component pages show sensible empty state.
  - Expected: No crash and clear "No components detected" messaging.

- [ ] `COMP-08` Stress check on deep React tree.
  - Expected: Scan does not freeze panel or throw stack overflow.

---

## J. Variables Tab

- [ ] `TOK-01` Auto-scan populates token count and framework hint.
  - Expected: Count reflects discovered CSS custom properties.

- [ ] `TOK-02` Categories render correctly (colors, spacing, radius, shadows, fonts, motion, size, other).
  - Expected: Non-empty categories visible with counts.

- [ ] `TOK-03` Token rows display correct visual previews (swatch/bar/radius/shadow).
  - Expected: Rendering matches token type.

- [ ] `TOK-04` Semantic tokens show `S` badge.
  - Expected: Tier marker appears for semantic tokens.

- [ ] `TOK-05` Clicking token copies `var(--token-name)` string.
  - Expected: Copy toast appears and clipboard has value.

- [ ] `TOK-06` Rescan button refreshes values after style changes/navigation.
  - Expected: Updated token values reflected.

- [ ] `TOK-07` Dark-mode values are shown when discoverable.
  - Expected: Tokens with dark overrides expose `darkValue` behavior.

---

## K. Assets Tab

- [ ] `ASSET-01` Subtab counts populate for Images, Fonts, CSS, JS.
  - Expected: Count badges match scanned arrays.

- [ ] `ASSET-02` Images tab supports grid/list view toggle.
  - Expected: Render mode changes without data loss.

- [ ] `ASSET-03` Images are grouped by category (icons/logos/photos/backgrounds/other).
  - Expected: Category sections and badges appear.

- [ ] `ASSET-04` Clicking image copies source URL.
  - Expected: Copy toast appears with truncated preview.

- [ ] `ASSET-05` Image search filters by src/alt/tagName.
  - Expected: Filtered groups/items update.

- [ ] `ASSET-06` Fonts tab shows family, weights, source labels.
  - Expected: Source badge (google-fonts/typekit/self-hosted/local) appears.

- [ ] `ASSET-07` CSS tab lists linked + inline stylesheets.
  - Expected: Type badge and size display work.

- [ ] `ASSET-08` JS tab lists external + inline scripts with async/defer markers.
  - Expected: Script metadata displayed correctly.

- [ ] `ASSET-09` Search works in Fonts/CSS/JS subtabs.
  - Expected: Query filters each active subtab correctly.

- [ ] `ASSET-10` Rescan updates asset sets after navigation/change.
  - Expected: New assets appear; stale ones disappear.

---

## L. Accessibility Audit Tab (Page-Level)

- [ ] `A11Y-01` Audit auto-runs on tab open.
  - Expected: Loading state then summary.

- [ ] `A11Y-02` Summary bar reflects errors/warnings/contrast counts.
  - Expected: Counts align with rendered sections.

- [ ] `A11Y-03` Re-run audit button refreshes results.
  - Expected: New results replace old without stale rows.

- [ ] `A11Y-04` Errors section renders detailed violations.
  - Expected: Rule/nodeName/suggestion present.

- [ ] `A11Y-05` Warnings section renders heading-order and related issues.
  - Expected: Warning items visible when applicable.

- [ ] `A11Y-06` Contrast issues section renders color swatches and ratios.
  - Expected: Rows include selector/text/ratio info.

- [ ] `A11Y-07` Heading hierarchy section shows heading tree order.
  - Expected: Indentation reflects heading levels.

- [ ] `A11Y-08` Landmarks section lists detected ARIA landmarks.
  - Expected: Landmark role/name rows present.

- [ ] `A11Y-09` Clean page shows "No issues found" state.
  - Expected: Green pass state appears when no violations.

---

## M. Prompt Palette and Prompt Pipeline

- [ ] `PROMPT-01` `Cmd/Ctrl+K` opens prompt palette; `Esc` closes.
  - Expected: Modal overlay appears/disappears reliably.

- [ ] `PROMPT-02` Add text command inserts text node into prompt draft.
  - Expected: Draft row appears with removable text chip.

- [ ] `PROMPT-03` Remove text/chip node updates draft immediately.
  - Expected: Node disappears from draft list.

- [ ] `PROMPT-04` "Pick element from page" flow works.
  - Expected: Palette hides, next click selects element, adds element chip, then palette reopens.

- [ ] `PROMPT-05` Clicking element chip scrolls to and highlights target element.
  - Expected: Page scroll + persistent selection pulse.

- [ ] `PROMPT-06` "Clear selected outlines" removes persistent selections.
  - Expected: Outline overlays are cleared.

- [ ] `PROMPT-07` "Copy compiled prompt" triggers clipboard copy.
  - Expected: Clipboard includes compiled markdown sections from current session data.

- [ ] `PROMPT-08` "Clear prompt draft" empties draft list.
  - Expected: Draft placeholder text returns.

- [ ] `PROMPT-09` Chip hover tooltip shows metadata details.
  - Expected: Tooltip includes selector/component/token/asset metadata if present.

- [ ] `PROMPT-10` Component/token/asset insert groups appear when source data exists.
  - Expected: Group items populate from store-backed prompt sources.

- [ ] `PROMPT-11` Compiled prompt clears when all source collections are empty.
  - Expected: No stale copied output after clearing all data.

- [ ] `PROMPT-12` Sidecar session push occurs when compiled prompt changes.
  - Expected: With sidecar connected, session updates are sent without duplicate spam.

---

## N. Session Persistence and Reconnection

- [ ] `SESSION-01` Add mutations/comments/draft, close and reopen panel on same tab.
  - Expected: Session restores from `chrome.storage.session`.

- [ ] `SESSION-02` Tab isolation works.
  - Expected: Session data from tab A does not appear in tab B.

- [ ] `SESSION-03` Bridge reconnect after service worker restart.
  - Expected: Panel recovers and continues receiving messages.

- [ ] `SESSION-04` Sidecar reconnect behavior.
  - Expected: Status returns connected and queued human replies flush.

- [ ] `SESSION-05` Panel unmount cleanup.
  - Expected: Flow toggle cleanup requests disable; no lingering ghost listeners.

---

## O. Explicit Front-End Gap Checks (Expected Missing/Partial)

Use these to document wiring gaps and prioritize next work.

- [ ] `GAP-01` No routed UI entry for `SearchPanel`.
  - Expected currently: Not reachable from left tabs/settings.

- [ ] `GAP-02` No routed UI entry for `ImageSwapPanel`.
  - Expected currently: Not reachable in current tab layout.

- [ ] `GAP-03` No routed UI entry for `ScreenshotPanel`.
  - Expected currently: Not reachable in current tab layout.

- [ ] `GAP-04` No routed UI entry for context `AccessibilityPanel`.
  - Expected currently: Only page-level `AccessibilityAuditPanel` is routed.

- [ ] `GAP-05` `panel:screenshot` handler remains stub in content router.
  - Expected currently: Returns failure payload if called.

- [ ] `GAP-06` `panel:get-component-map` path is dead relative to current components scanner flow.
  - Expected currently: Current Components tab uses `scanComponents()` eval path.

- [ ] `GAP-07` Settings bar search input has no connected behavior.
  - Expected currently: Pure local state, no filtering/action.

- [ ] `GAP-08` No visible control to enter `component-id` editor mode.
  - Expected currently: Overlay exists in code, but no routed trigger.

- [ ] `GAP-09` Design submodes `guides` and `accessibility` lack dedicated on-page tool attachment.
  - Expected currently: Mode state changes, but no specialized tool UI behavior.

- [ ] `GAP-10` Prompt source lists (components/tokens/assets) may be sparse due slice wiring differences.
  - Expected currently: Prompt palette actions work even if source groups are empty.

- [ ] `GAP-11` ContextOutputPanel is implemented but not routed.
  - Expected currently: No direct panel path to section toggles/preview UI.

- [ ] `GAP-12` ModeToolbar (panel component) is implemented but not mounted.
  - Expected currently: On-page toolbar is primary mode UI.

---

## Optional: Quick MCP Payloads for Agent Tests

Use your MCP client to call:

1. `flow_post_feedback`

```json
{
  "tabId": 123,
  "selector": "button.primary",
  "content": "Button contrast is too low on hover.",
  "intent": "fix",
  "severity": "important",
  "componentName": "PrimaryButton"
}
```

2. `flow_reply_to_thread`

```json
{
  "tabId": 123,
  "id": "<feedback-id>",
  "content": "Can you confirm if this should be AA or AAA?"
}
```

3. `flow_resolve_annotation`

```json
{
  "tabId": 123,
  "id": "<feedback-id>",
  "summary": "Updated color token to pass AA contrast."
}
```

4. `flow_get_pending_feedback`

```json
{
  "tabId": 123,
  "offset": 0,
  "limit": 50
}
```

---

## Completion Summary Template

After running all sections, add:

- Total tests run:
- Total issues found:
- Critical:
- High:
- Medium:
- Low:
- Top 5 front-end gaps to prioritize:

