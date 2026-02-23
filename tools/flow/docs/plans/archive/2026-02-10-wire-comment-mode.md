# Wire Comment Mode — Implementation Plan

> **Status: COMPLETE** — `FeedbackPanel.tsx` (419 lines) wired as panel tab. Comment/question modes registered with hotkeys C/Q. `commentSlice.ts` handles CRUD + markdown compilation. Comments flow through `backgroundSessionStore` → `backgroundCompiler` → sidecar. Badge rendering in content script shadow DOM.

**Goal:** Make comment/question mode fully functional end-to-end: user clicks elements, adds feedback, sees it in a dedicated FeedbackPanel tab, badges appear on the page with hover tooltips, and comments flow into the prompt compiler and sidecar.

**Architecture:** The backend (`commentSlice.ts`, 316 lines) is already complete with full CRUD and markdown compilation. This plan fills three gaps: (1) a `FeedbackPanel` component wired into the tab bar, (2) content-script badge rendering with hover tooltips (shadow DOM, agentation-style), (3) prompt compiler + sidecar integration for comment data.

**Tech Stack:** React 19, Zustand, Chrome Extension MV3 (content script shadow DOM), Tailwind CSS v4, Vitest

**No dependencies** — runs in parallel with Sub-Plans 1 and 2.

---

## Prior Art & Conventions

- **Badge pattern:** `packages/extension/src/content/annotationBadges.ts` (96 lines) — shadow DOM host, numbered badges, scroll reposition
- **Tab routing:** `packages/extension/src/panel/components/layout/EditorLayout.tsx` — `TabId` union → `TabContent` switch
- **Tab bar:** `packages/extension/src/panel/components/layout/LeftTabBar.tsx` — `TABS` config array with `TabId`
- **Comment store:** `packages/extension/src/panel/stores/slices/commentSlice.ts` — all CRUD, `compileToMarkdown()`, `copyCommentsToClipboard()`
- **Comment UI:** `packages/extension/src/panel/components/CommentMode.tsx` — mode banner, popover input
- **Content handler:** `packages/extension/src/content/panelRouter.ts:425-443` — stub `handleComment()`
- **Agentation reference:** `node_modules/agentation/dist/index.d.ts` — badge styling reference

## Architecture Note: Tab Routing Disconnect

`EditorLayout` uses local `useState<TabId>` for tab selection. `commentSlice.setActiveFeedbackType()` sets `activePanel: "feedback"` in the Zustand store (`uiStateSlice`), but `EditorLayout` never reads from it. Fix: add `"feedback"` to `TabId` union and sync from the store when comment mode activates.

---

### Task 1: Add "Feedback" Tab to the Tab Bar

**Files:**
- Modify: `packages/extension/src/panel/components/layout/LeftTabBar.tsx` (lines 12-19, 27-35)
- Modify: `packages/extension/src/panel/components/layout/EditorLayout.tsx` (lines 31-52, 61)

**Step 1: Add `"feedback"` to `TabId` union**

In `LeftTabBar.tsx`, update the type (line 12-19):

```typescript
export type TabId =
  | "components"
  | "assets"
  | "variables"
  | "accessibility"
  | "designer"
  | "mutations"
  | "prompt"
  | "feedback";
```

**Step 2: Add feedback tab config to `TABS` array**

In `LeftTabBar.tsx`, add to the `TABS` array (after line 34):

```typescript
{ id: "feedback", label: "Feedback", icon: <ChatIcon /> },
```

Add a simple `ChatIcon` component (or reuse an existing icon). Minimal SVG:

```typescript
function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
```

**Step 3: Add FeedbackPanel to `TabContent` switch in `EditorLayout.tsx`**

Import the panel (will be created in Task 2):

```typescript
import { FeedbackPanel } from "../FeedbackPanel";
```

Add case to the switch (line 31-52):

```typescript
case "feedback":
  return <FeedbackPanel />;
```

**Step 4: Sync comment mode activation to tab selection**

In `EditorLayout.tsx`, add an effect that auto-switches to the feedback tab when comment mode activates:

```typescript
const activeFeedbackType = useAppStore((s) => s.activeFeedbackType);

// Auto-switch to feedback tab when comment mode activates
useEffect(() => {
  if (activeFeedbackType) {
    setActiveTab("feedback");
  }
}, [activeFeedbackType]);
```

Import `useEffect` (already imported via `useState`).

**Step 5: Build to verify (will fail on missing FeedbackPanel — expected)**

Run: `cd packages/extension && pnpm build`

Expected: Error — `FeedbackPanel` not found (created in Task 2)

**Step 6: Commit**

```bash
git add packages/extension/src/panel/components/layout/LeftTabBar.tsx packages/extension/src/panel/components/layout/EditorLayout.tsx
git commit -m "feat: add feedback tab to tab bar, sync with comment mode activation"
```

---

### Task 2: Create `FeedbackPanel.tsx`

**Files:**
- Create: `packages/extension/src/panel/components/FeedbackPanel.tsx`

**Step 1: Create the component**

```typescript
/**
 * FeedbackPanel — Lists comments and questions from comment mode.
 *
 * Two view modes:
 * - Grouped (default): comments organized by element/component
 * - Timeline: flat chronological list
 *
 * Each comment shows: type badge, component name, content, timestamp.
 * Edit/delete per comment. "Copy feedback" copies compiled markdown.
 */

import { useState, useCallback } from "react";
import { useAppStore } from "../stores/appStore";
import type { Feedback } from "../stores/types";
import { DogfoodBoundary } from "./ui/DogfoodBoundary";

type ViewMode = "grouped" | "timeline";

function groupByElement(comments: Feedback[]): Map<string, Feedback[]> {
  const grouped = new Map<string, Feedback[]>();
  for (const c of comments) {
    const key = c.componentName || c.elementSelector;
    const existing = grouped.get(key) ?? [];
    existing.push(c);
    grouped.set(key, [...existing]);
  }
  return grouped;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function FeedbackPanel() {
  const comments = useAppStore((s) => s.comments);
  const removeComment = useAppStore((s) => s.removeComment);
  const updateComment = useAppStore((s) => s.updateComment);
  const clearComments = useAppStore((s) => s.clearComments);
  const copyCommentsToClipboard = useAppStore((s) => s.copyCommentsToClipboard);
  const activeFeedbackType = useAppStore((s) => s.activeFeedbackType);
  const setActiveFeedbackType = useAppStore((s) => s.setActiveFeedbackType);

  const [viewMode, setViewMode] = useState<ViewMode>("grouped");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await copyCommentsToClipboard();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [copyCommentsToClipboard]);

  const startEdit = (comment: Feedback) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const confirmEdit = () => {
    if (editingId && editContent.trim()) {
      updateComment(editingId, editContent.trim());
    }
    setEditingId(null);
    setEditContent("");
  };

  if (comments.length === 0) {
    return (
      <DogfoodBoundary name="FeedbackPanel" file="FeedbackPanel.tsx" category="panel">
        <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-3 p-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p className="text-sm">No feedback yet</p>
          <p className="text-xs text-neutral-600">
            {activeFeedbackType
              ? "Alt+Click an element on the page to add feedback"
              : "Activate comment or question mode to start"}
          </p>
          {!activeFeedbackType && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setActiveFeedbackType("comment")}
                className="px-3 py-1.5 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-500 transition-colors"
              >
                Comment Mode
              </button>
              <button
                onClick={() => setActiveFeedbackType("question")}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
              >
                Question Mode
              </button>
            </div>
          )}
        </div>
      </DogfoodBoundary>
    );
  }

  const grouped = groupByElement(comments);

  return (
    <DogfoodBoundary name="FeedbackPanel" file="FeedbackPanel.tsx" category="panel">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-700">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-200">
              Feedback
            </span>
            <span className="text-xs text-neutral-500">
              {comments.length} item{comments.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* View mode toggle */}
            <button
              onClick={() => setViewMode(viewMode === "grouped" ? "timeline" : "grouped")}
              className="px-2 py-1 text-[10px] text-neutral-400 hover:text-neutral-200 transition-colors"
              title={viewMode === "grouped" ? "Switch to timeline" : "Switch to grouped"}
            >
              {viewMode === "grouped" ? "Timeline" : "Grouped"}
            </button>
            {/* Copy */}
            <button
              onClick={handleCopy}
              className="px-2 py-1 text-[10px] text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            {/* Clear */}
            <button
              onClick={clearComments}
              className="px-2 py-1 text-[10px] text-red-400 hover:text-red-300 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {viewMode === "grouped" ? (
            Array.from(grouped.entries()).map(([element, items]) => (
              <div key={element} className="mb-3">
                <div className="text-xs font-medium text-neutral-400 px-2 py-1 truncate">
                  {element}
                </div>
                {items.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    editing={editingId === comment.id}
                    editContent={editContent}
                    onEditContent={setEditContent}
                    onStartEdit={() => startEdit(comment)}
                    onConfirmEdit={confirmEdit}
                    onCancelEdit={() => setEditingId(null)}
                    onDelete={() => removeComment(comment.id)}
                  />
                ))}
              </div>
            ))
          ) : (
            [...comments]
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  editing={editingId === comment.id}
                  editContent={editContent}
                  onEditContent={setEditContent}
                  onStartEdit={() => startEdit(comment)}
                  onConfirmEdit={confirmEdit}
                  onCancelEdit={() => setEditingId(null)}
                  onDelete={() => removeComment(comment.id)}
                />
              ))
          )}
        </div>
      </div>
    </DogfoodBoundary>
  );
}

function CommentCard({
  comment,
  editing,
  editContent,
  onEditContent,
  onStartEdit,
  onConfirmEdit,
  onCancelEdit,
  onDelete,
}: {
  comment: Feedback;
  editing: boolean;
  editContent: string;
  onEditContent: (v: string) => void;
  onStartEdit: () => void;
  onConfirmEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) {
  const isQuestion = comment.type === "question";

  return (
    <div className="group px-2 py-1.5 rounded hover:bg-neutral-800/50 transition-colors">
      <div className="flex items-start gap-2">
        {/* Type badge */}
        <span
          className={`mt-0.5 shrink-0 text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
            isQuestion
              ? "bg-blue-500/20 text-blue-400"
              : "bg-yellow-500/20 text-yellow-400"
          }`}
        >
          {isQuestion ? "Q" : "C"}
        </span>

        <div className="flex-1 min-w-0">
          {/* Component name + time */}
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
            <span className="truncate">{comment.componentName}</span>
            <span>{formatTime(comment.timestamp)}</span>
          </div>

          {/* Content */}
          {editing ? (
            <div className="mt-1">
              <textarea
                value={editContent}
                onChange={(e) => onEditContent(e.target.value)}
                className="w-full text-xs bg-neutral-700 border border-neutral-600 rounded px-2 py-1 text-neutral-200 resize-none focus:outline-none focus:border-blue-500"
                rows={2}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    onConfirmEdit();
                  }
                  if (e.key === "Escape") onCancelEdit();
                }}
              />
              <div className="flex gap-1 mt-1">
                <button
                  onClick={onConfirmEdit}
                  className="text-[10px] text-blue-400 hover:text-blue-300"
                >
                  Save
                </button>
                <button
                  onClick={onCancelEdit}
                  className="text-[10px] text-neutral-500 hover:text-neutral-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-300 mt-0.5 whitespace-pre-wrap">
              {comment.content}
            </p>
          )}
        </div>

        {/* Actions (visible on hover) */}
        {!editing && (
          <div className="opacity-0 group-hover:opacity-100 flex gap-1 shrink-0 transition-opacity">
            <button
              onClick={onStartEdit}
              className="text-neutral-500 hover:text-neutral-300 p-0.5"
              title="Edit"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="text-neutral-500 hover:text-red-400 p-0.5"
              title="Delete"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Build to verify**

Run: `cd packages/extension && pnpm build`

Expected: Clean build

**Step 3: Commit**

```bash
git add packages/extension/src/panel/components/FeedbackPanel.tsx
git commit -m "feat: create FeedbackPanel with grouped/timeline views

Lists all comments and questions with type badges, edit/delete,
copy-to-clipboard, and view mode toggle. Empty state with mode activation buttons."
```

---

### Task 3: Create Comment Badges on Page (Content Script)

**Files:**
- Create: `packages/extension/src/content/commentBadges.ts`
- Modify: `packages/extension/src/content/panelRouter.ts:425-443`

**Step 1: Create `commentBadges.ts`**

Pattern follows `annotationBadges.ts` but with hover tooltips and agentation-style badge design:

```typescript
/**
 * Comment badges rendered in the inspected page via Shadow DOM.
 *
 * Numbered badges appear on elements that have comments.
 * Hovering a badge shows a tooltip with the comment text.
 * Design inspired by agentation.dev badge patterns.
 */

const BADGE_HOST_ID = '__flow-comment-badges__';

interface CommentBadge {
  id: string;
  selector: string;
  index: number;
  type: 'comment' | 'question';
  content: string;
  componentName: string;
}

let shadowRoot: ShadowRoot | null = null;
const badgeMap = new Map<string, CommentBadge>();

function ensureShadowHost(): ShadowRoot {
  if (shadowRoot) return shadowRoot;

  const existing = document.getElementById(BADGE_HOST_ID);
  if (existing) existing.remove();

  const host = document.createElement('div');
  host.id = BADGE_HOST_ID;
  host.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:2147483647;';
  document.documentElement.appendChild(host);
  shadowRoot = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = `
    .comment-badge {
      position: fixed;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      color: white;
      font-size: 11px;
      font-weight: 700;
      font-family: system-ui, -apple-system, sans-serif;
      pointer-events: auto;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,255,255,0.1);
      transform: translate(-50%, -100%) translateY(-4px);
      transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
      z-index: 2147483647;
    }
    .comment-badge.type-comment {
      background: #eab308;
    }
    .comment-badge.type-question {
      background: #3b82f6;
    }
    .comment-badge:hover {
      transform: translate(-50%, -100%) translateY(-4px) scale(1.15);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.2);
    }
    .comment-tooltip {
      position: fixed;
      max-width: 240px;
      padding: 6px 10px;
      border-radius: 6px;
      background: #1c1c1e;
      border: 1px solid rgba(255,255,255,0.1);
      color: #e5e5e5;
      font-size: 12px;
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.4;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease-out;
      z-index: 2147483647;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    .comment-tooltip.visible {
      opacity: 1;
    }
    .comment-tooltip .tooltip-header {
      font-size: 10px;
      color: #999;
      margin-bottom: 2px;
    }
    .comment-tooltip .tooltip-content {
      white-space: pre-wrap;
      word-break: break-word;
    }
  `;
  shadowRoot.appendChild(style);

  // Create shared tooltip element
  const tooltip = document.createElement('div');
  tooltip.className = 'comment-tooltip';
  tooltip.innerHTML = '<div class="tooltip-header"></div><div class="tooltip-content"></div>';
  shadowRoot.appendChild(tooltip);

  return shadowRoot;
}

function getTooltip(): HTMLElement | null {
  return shadowRoot?.querySelector('.comment-tooltip') as HTMLElement | null;
}

export function addCommentBadge(badge: CommentBadge): void {
  badgeMap.set(badge.id, badge);
  renderAllBadges();
}

export function removeCommentBadge(id: string): void {
  badgeMap.delete(id);
  renderAllBadges();
}

export function clearCommentBadges(): void {
  badgeMap.clear();
  if (shadowRoot) {
    shadowRoot.querySelectorAll('.comment-badge').forEach((el) => el.remove());
  }
}

function renderAllBadges(): void {
  const root = ensureShadowHost();

  // Remove existing badges (not tooltip)
  root.querySelectorAll('.comment-badge').forEach((el) => el.remove());

  let index = 0;
  for (const badge of badgeMap.values()) {
    const el = document.querySelector(badge.selector);
    if (!el) continue;

    const rect = el.getBoundingClientRect();
    const badgeEl = document.createElement('div');
    badgeEl.className = `comment-badge type-${badge.type}`;
    badgeEl.textContent = String(index + 1);
    badgeEl.style.left = `${rect.right}px`;
    badgeEl.style.top = `${rect.top}px`;
    badgeEl.dataset.commentId = badge.id;

    // Hover tooltip
    badgeEl.addEventListener('mouseenter', () => {
      const tooltip = getTooltip();
      if (!tooltip) return;
      const header = tooltip.querySelector('.tooltip-header') as HTMLElement;
      const content = tooltip.querySelector('.tooltip-content') as HTMLElement;
      header.textContent = `${badge.type === 'question' ? 'Question' : 'Comment'} on ${badge.componentName}`;
      content.textContent = badge.content;
      // Position tooltip above badge
      const badgeRect = badgeEl.getBoundingClientRect();
      tooltip.style.left = `${badgeRect.left}px`;
      tooltip.style.top = `${badgeRect.top - 8}px`;
      tooltip.style.transform = 'translateY(-100%)';
      tooltip.classList.add('visible');
    });

    badgeEl.addEventListener('mouseleave', () => {
      const tooltip = getTooltip();
      if (tooltip) tooltip.classList.remove('visible');
    });

    root.appendChild(badgeEl);
    index++;
  }
}

/** Call on scroll/resize to reposition badges */
export function repositionCommentBadges(): void {
  if (!shadowRoot) return;
  for (const badge of badgeMap.values()) {
    const el = document.querySelector(badge.selector);
    const badgeEl = shadowRoot.querySelector(`[data-comment-id="${CSS.escape(badge.id)}"]`) as HTMLElement;
    if (!el || !badgeEl) continue;
    const rect = el.getBoundingClientRect();
    badgeEl.style.left = `${rect.right}px`;
    badgeEl.style.top = `${rect.top}px`;
  }
}
```

**Step 2: Wire `handleComment` in `panelRouter.ts`**

Replace lines 425-443:

```typescript
import { addCommentBadge, removeCommentBadge, clearCommentBadges } from './commentBadges';

function handleComment(payload: {
  id: string;
  type: string;
  selector: string;
  componentName: string;
  content: string;
}): CommentResponse {
  addCommentBadge({
    id: payload.id,
    selector: payload.selector,
    index: 0, // Will be recalculated during render
    type: payload.type as 'comment' | 'question',
    content: payload.content,
    componentName: payload.componentName,
  });

  return {
    type: 'comment:result',
    payload: {
      id: payload.id,
      success: true,
    },
  };
}
```

**Step 3: Add scroll/resize listener for badge repositioning**

In `panelRouter.ts` or `content.ts`, add:

```typescript
window.addEventListener('scroll', () => repositionCommentBadges(), { passive: true });
window.addEventListener('resize', () => repositionCommentBadges(), { passive: true });
```

**Step 4: Add `panel:comment-remove` and `panel:comment-clear` handlers**

In the `panelRouter.ts` message switch, add cases:

```typescript
case 'panel:comment-remove':
  removeCommentBadge(msg.payload.id);
  break;
case 'panel:comment-clear':
  clearCommentBadges();
  break;
```

**Step 5: Wire `removeComment` and `clearComments` in panel to send messages to content**

In `FeedbackPanel.tsx`, when deleting a comment, also call `sendToContent`:

```typescript
const handleDelete = (id: string) => {
  removeComment(id);
  sendToContent({ type: 'panel:comment-remove', payload: { id } });
};
```

And for clear:

```typescript
const handleClear = () => {
  clearComments();
  sendToContent({ type: 'panel:comment-clear', payload: {} });
};
```

**Step 6: Build to verify**

Run: `cd packages/extension && pnpm build`

**Step 7: Commit**

```bash
git add packages/extension/src/content/commentBadges.ts packages/extension/src/content/panelRouter.ts packages/extension/src/panel/components/FeedbackPanel.tsx
git commit -m "feat: render comment badges on page with hover tooltips

Shadow DOM badges with yellow (comment) and blue (question) colors.
Hover shows tooltip with comment text. Reposition on scroll/resize.
panelRouter handleComment creates real badges instead of logging."
```

---

### Task 4: Add Comments to Prompt Compiler

**Files:**
- Modify: `packages/extension/src/services/promptCompiler.ts`
- Modify: `packages/extension/src/panel/stores/slices/promptOutputSlice.ts`
- Modify: `packages/extension/src/panel/hooks/usePromptAutoCompile.ts`
- Modify: `packages/extension/src/panel/components/ContextOutputPanel.tsx`

**Step 1: Add `comments` to `CompilerInput`**

In `promptCompiler.ts`, add import and field:

```typescript
import type { Feedback } from '../panel/stores/types';

export interface CompilerInput {
  annotations: Annotation[];
  textEdits: TextEdit[];
  mutationDiffs: MutationDiff[];
  animationDiffs: AnimationDiff[];
  promptSteps: PromptStep[];
  comments: Feedback[];
}
```

**Step 2: Add `compileComments` method to `PromptCompiler`**

```typescript
private compileComments(comments: Feedback[]): PromptSection {
  const feedbackComments = comments.filter((c) => c.type === 'comment');
  const feedbackQuestions = comments.filter((c) => c.type === 'question');
  const lines: string[] = [];

  if (feedbackComments.length > 0) {
    lines.push('### Comments');
    lines.push('');
    feedbackComments.forEach((c, i) => {
      const location = c.source ? ` (${c.source.filePath}:${c.source.line})` : '';
      lines.push(`${i + 1}. \`${c.componentName}\`${location}`);
      lines.push(`   - ${c.content}`);
      lines.push('');
    });
  }

  if (feedbackQuestions.length > 0) {
    lines.push('### Questions');
    lines.push('');
    feedbackQuestions.forEach((c, i) => {
      const location = c.source ? ` (${c.source.filePath}:${c.source.line})` : '';
      lines.push(`${i + 1}. \`${c.componentName}\`${location}`);
      lines.push(`   ? ${c.content}`);
      lines.push('');
    });
  }

  return {
    type: 'comments' as PromptSection['type'],
    markdown: `## Feedback\n\n${lines.join('\n')}`,
    itemCount: comments.length,
  };
}
```

Add `'comments'` to the `PromptSection.type` union:

```typescript
export interface PromptSection {
  type: 'annotations' | 'text-changes' | 'style-mutations' | 'animation-changes' | 'instructions' | 'comments';
  markdown: string;
  itemCount: number;
}
```

**Step 3: Call `compileComments` in `compile()` method**

After the `promptSteps` check (~line 55):

```typescript
if (input.comments.length > 0) {
  sections.push(this.compileComments(input.comments));
}
```

**Step 4: Update `promptOutputSlice.ts`**

Add `comments` to the compile call:

```typescript
const compiled = promptCompiler.compile({
  annotations: state.annotations ?? [],
  textEdits: state.textEdits ?? [],
  mutationDiffs: state.mutationDiffs ?? [],
  animationDiffs: state.animationDiffs ?? [],
  promptSteps: state.promptSteps ?? [],
  comments: state.comments ?? [],
});
```

**Step 5: Update `usePromptAutoCompile.ts`**

Add comments to the item count and deps:

```typescript
const comments = useAppStore((s) => s.comments);
// ... in totalItems:
(comments?.length ?? 0) +
// ... in useEffect deps:
[annotations, textEdits, mutationDiffs, animationDiffs, promptSteps, comments, compilePrompt]
```

**Step 6: Update `ContextOutputPanel.tsx`**

Add comments count:

```typescript
const comments = useAppStore((s) => s.comments?.length ?? 0);
const totalItems = annotations + textEdits + mutationDiffs + animationDiffs + promptSteps + comments;
```

**Step 7: Update prompt compiler tests**

In `packages/extension/src/services/__tests__/promptCompiler.test.ts`, add `comments: []` to all existing test inputs, and add a new test:

```typescript
it('should compile comments and questions', () => {
  const result = promptCompiler.compile({
    annotations: [],
    textEdits: [],
    mutationDiffs: [],
    animationDiffs: [],
    promptSteps: [],
    comments: [
      {
        id: '1', type: 'comment', elementSelector: '.btn', componentName: 'Button',
        devflowId: null, source: null, content: 'Make this bigger', coordinates: { x: 0, y: 0 }, timestamp: 1000,
      },
      {
        id: '2', type: 'question', elementSelector: '.nav', componentName: 'Nav',
        devflowId: null, source: null, content: 'Should this be sticky?', coordinates: { x: 0, y: 0 }, timestamp: 2000,
      },
    ],
  });
  expect(result.markdown).toContain('## Feedback');
  expect(result.markdown).toContain('Make this bigger');
  expect(result.markdown).toContain('Should this be sticky?');
  expect(result.sections[0].itemCount).toBe(2);
});
```

**Step 8: Run tests**

Run: `cd packages/extension && npx vitest run src/services/__tests__/promptCompiler.test.ts`

Expected: All tests pass

**Step 9: Commit**

```bash
git add packages/extension/src/services/promptCompiler.ts packages/extension/src/panel/stores/slices/promptOutputSlice.ts packages/extension/src/panel/hooks/usePromptAutoCompile.ts packages/extension/src/panel/components/ContextOutputPanel.tsx packages/extension/src/services/__tests__/promptCompiler.test.ts
git commit -m "feat: add comments to prompt compiler and auto-compile pipeline

Comments and questions appear as '## Feedback' section in compiled output.
Auto-recompile triggers when comments change."
```

---

### Task 5: Add Comments to Sidecar Sync

**Files:**
- Modify: `packages/extension/src/services/sidecarSync.ts`
- Modify: `packages/extension/src/panel/hooks/useSessionAutoSave.ts`

**Step 1: Add `comments` to sidecar payload**

In `sidecarSync.ts`, add to the `sessionData` parameter type:

```typescript
export function pushSessionToSidecar(
  tabId: number,
  compiledMarkdown: string,
  sessionData: {
    annotations: unknown[];
    textEdits: unknown[];
    mutationDiffs: unknown[];
    animationDiffs: unknown[];
    promptSteps: unknown[];
    comments: unknown[];
  },
): void {
```

**Step 2: Add `comments` to `useSessionAutoSave.ts`**

Add to the store selector and payload:

```typescript
const comments = useAppStore((s) => s.comments);
// ... in the payload:
comments: comments ?? [],
// ... in useEffect deps:
[annotations, textEdits, mutationDiffs, animationDiffs, promptSteps, comments, activeLanguage]
```

**Step 3: Build to verify**

Run: `cd packages/extension && pnpm build`

**Step 4: Commit**

```bash
git add packages/extension/src/services/sidecarSync.ts packages/extension/src/panel/hooks/useSessionAutoSave.ts
git commit -m "feat: include comments in sidecar session-update payload"
```

---

### Task 6: End-to-End Verification

**Step 1: Build**

```bash
cd packages/extension && pnpm build
```

**Step 2: Run all tests**

```bash
cd packages/extension && npx vitest run
```

**Step 3: Manual browser test**

1. Load extension → open DevTools panel
2. Click "Feedback" tab → see empty state with "Comment Mode" / "Question Mode" buttons
3. Click "Comment Mode" → mode banner appears
4. Alt+click an element on the page → comment popover appears in panel
5. Type "Make this bigger" → Cmd+Enter
6. See comment in FeedbackPanel (grouped view)
7. See yellow numbered badge on the page element
8. Hover badge → tooltip shows "Comment on [element]: Make this bigger"
9. Toggle to "Timeline" view → see chronological list
10. Click "Question Mode" → Alt+click another element → type question
11. See blue badge on page, question in panel
12. Switch to "Prompt" tab → see "## Feedback" section with both comments and questions
13. Click "Copy" → paste in editor → verify markdown structure
14. Edit a comment → verify update in panel
15. Delete a comment → verify badge removed from page
16. "Clear" → all badges gone, panel empty

**Step 4: Commit**

```bash
git add -A
git commit -m "test: verify comment mode end-to-end"
```

---

## Summary of Changes

| Action | File |
|--------|------|
| **Created** | `packages/extension/src/panel/components/FeedbackPanel.tsx` |
| **Created** | `packages/extension/src/content/commentBadges.ts` |
| **Modified** | `packages/extension/src/panel/components/layout/LeftTabBar.tsx` |
| **Modified** | `packages/extension/src/panel/components/layout/EditorLayout.tsx` |
| **Modified** | `packages/extension/src/content/panelRouter.ts` |
| **Modified** | `packages/extension/src/services/promptCompiler.ts` |
| **Modified** | `packages/extension/src/panel/stores/slices/promptOutputSlice.ts` |
| **Modified** | `packages/extension/src/panel/hooks/usePromptAutoCompile.ts` |
| **Modified** | `packages/extension/src/panel/components/ContextOutputPanel.tsx` |
| **Modified** | `packages/extension/src/services/sidecarSync.ts` |
| **Modified** | `packages/extension/src/panel/hooks/useSessionAutoSave.ts` |
| **Modified** | `packages/extension/src/services/__tests__/promptCompiler.test.ts` |
