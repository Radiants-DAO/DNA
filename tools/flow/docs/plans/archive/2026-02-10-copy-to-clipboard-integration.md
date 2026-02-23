# Copy-to-Clipboard Integration — Implementation Plan

> **Status: COMPLETE** — `promptCompiler.ts` (254 lines) compiles all mode data. `backgroundCompiler.ts` auto-compiles on changes. `ContextOutputPanel.tsx` presents compiled output with clipboard copy. Multiple panel components (`VariablesPanel`, `SearchPanel`, `ComponentsPanel`, etc.) have copy-to-clipboard wiring. Sidecar sync pushes on every compile.

**Goal:** Wire up a complete, reactive copy-to-clipboard pipeline: all modes (design, annotate, editText, comment) feed into a single prompt compiler that auto-recompiles on data changes, presents section-by-section output with toggleable sections, and copies well-structured markdown to the clipboard.

**Architecture:** The prompt compiler (`promptCompiler.ts`, 172 lines) and auto-compile hook (`usePromptAutoCompile.ts`, 35 lines) exist but are disconnected. The `ContextOutputPanel` is minimal (no section toggles, no section breakdown). The sidecar sync module (`sidecarSync.ts`, 59 lines) exists but is never called. This plan: (1) connects the auto-compile hook, (2) adds comments to the compiler input (Sub-Plan 3 dependency), (3) rebuilds `ContextOutputPanel` with section toggles and copy-all, (4) wires sidecar sync to push on every compile.

**Tech Stack:** React 19, Zustand, Chrome Extension MV3, Tailwind CSS v4, Vitest

**Depends on:** Sub-Plan 3 (comments in compiler). Can proceed in parallel for Tasks 1-4; Task 5 requires comment data flowing.

---

## Prior Art & Conventions

- **Prompt compiler:** `packages/extension/src/services/promptCompiler.ts` — `PromptCompiler` class, `CompilerInput`, `CompiledPrompt`, `PromptSection` types
- **Auto-compile hook:** `packages/extension/src/panel/hooks/usePromptAutoCompile.ts` — exists, orphaned (never called)
- **Prompt output slice:** `packages/extension/src/panel/stores/slices/promptOutputSlice.ts` — `compilePrompt()`, `copyToClipboard()`, `compiledPrompt` state
- **Context output panel:** `packages/extension/src/panel/components/ContextOutputPanel.tsx` — minimal UI (copy + preview buttons, markdown preview)
- **Sidecar sync:** `packages/extension/src/services/sidecarSync.ts` — `connectToSidecar()`, `pushSessionToSidecar()`, never imported
- **Tab routing:** `packages/extension/src/panel/components/layout/EditorLayout.tsx` — `TabId: "prompt"` renders `<ContextOutputPanel />`
- **All data slices:** `annotationSlice`, `textEditsSlice`, `mutationSlice`, `animationDiffsSlice`, `promptBuilderSlice`, `commentSlice`

## Current State (What's Broken)

1. **`usePromptAutoCompile` is never called** — defined in `hooks/usePromptAutoCompile.ts` but never imported or mounted. Auto-compilation doesn't happen.
2. **`ContextOutputPanel` has no section toggles** — just a flat "Copy Prompt" + "Preview" button and raw markdown dump. No section-by-section breakdown.
3. **Comments not in compiler** — `CompilerInput` has 6 fields, none are `comments`. Sub-Plan 3 adds this.
4. **Sidecar sync is disconnected** — `connectToSidecar()` and `pushSessionToSidecar()` are never imported anywhere. Data never reaches MCP server.
5. **No section toggle state** — no way to exclude specific sections (mutations, annotations, etc.) from the compiled output.

---

### Task 1: Add Section Toggle State to Prompt Output Slice

**Files:**
- Modify: `packages/extension/src/panel/stores/slices/promptOutputSlice.ts`

**Step 1: Define section toggle types and add to slice state**

In `promptOutputSlice.ts`, add section toggle state. The `PromptSection.type` union already defines the section keys.

```typescript
import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import type { CompiledPrompt, PromptSection } from '../../../services/promptCompiler';
import { promptCompiler } from '../../../services/promptCompiler';

export type SectionType = PromptSection['type'];

export interface PromptOutputSlice {
  compiledPrompt: CompiledPrompt | null;
  isCompiling: boolean;
  lastCopiedAt: number | null;
  /** Which sections are enabled for copy. All true by default. */
  enabledSections: Record<SectionType, boolean>;
  compilePrompt: () => void;
  copyToClipboard: () => Promise<void>;
  clearCompiledPrompt: () => void;
  toggleSection: (section: SectionType) => void;
  setAllSections: (enabled: boolean) => void;
}
```

**Step 2: Initialize all sections as enabled**

```typescript
const DEFAULT_SECTIONS: Record<SectionType, boolean> = {
  annotations: true,
  'text-changes': true,
  'style-mutations': true,
  'animation-changes': true,
  instructions: true,
  comments: true,
};

export const createPromptOutputSlice: StateCreator<AppState, [], [], PromptOutputSlice> = (set, get) => ({
  compiledPrompt: null,
  isCompiling: false,
  lastCopiedAt: null,
  enabledSections: { ...DEFAULT_SECTIONS },

  // ... existing methods unchanged ...

  toggleSection: (section) => {
    set((state) => ({
      enabledSections: {
        ...state.enabledSections,
        [section]: !state.enabledSections[section],
      },
    }));
  },

  setAllSections: (enabled) => {
    set({
      enabledSections: Object.fromEntries(
        Object.keys(DEFAULT_SECTIONS).map((k) => [k, enabled]),
      ) as Record<SectionType, boolean>,
    });
  },
});
```

**Step 3: Update `copyToClipboard` to filter by enabled sections**

The `copyToClipboard` method should only copy sections that are enabled:

```typescript
copyToClipboard: async () => {
  const state = get();
  if (!state.compiledPrompt) {
    state.compilePrompt();
  }
  const prompt = get().compiledPrompt;
  if (prompt) {
    const enabled = get().enabledSections;
    const filteredMarkdown = prompt.sections
      .filter((s) => enabled[s.type])
      .map((s) => s.markdown)
      .join('\n\n---\n\n');
    await navigator.clipboard.writeText(filteredMarkdown);
    set({ lastCopiedAt: Date.now() });
  }
},
```

**Step 4: Update AppState types**

In `packages/extension/src/panel/stores/types.ts`, verify `PromptOutputSlice` is included in the `AppState` intersection. It should already be there — just confirm the updated slice type flows through.

**Step 5: Commit**

```bash
git add packages/extension/src/panel/stores/slices/promptOutputSlice.ts
git commit -m "feat: add section toggle state to prompt output slice"
```

---

### Task 2: Rebuild ContextOutputPanel with Section Toggles

**Files:**
- Modify: `packages/extension/src/panel/components/ContextOutputPanel.tsx`

**Step 1: Add section metadata map**

Define labels and descriptions for each section type:

```typescript
const SECTION_META: Record<string, { label: string; icon: string }> = {
  annotations: { label: 'Annotations', icon: '📌' },
  'text-changes': { label: 'Text Changes', icon: '✏️' },
  'style-mutations': { label: 'Style Mutations', icon: '🎨' },
  'animation-changes': { label: 'Animation Changes', icon: '🎬' },
  instructions: { label: 'Instructions', icon: '📝' },
  comments: { label: 'Comments', icon: '💬' },
};
```

> Note: Icons are just for the section headers — remove if emojis don't fit the design language. Can use plain text labels only.

**Step 2: Rewrite the component with section breakdown**

```tsx
import React, { useCallback, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import type { SectionType } from '../stores/slices/promptOutputSlice';

const SECTION_LABELS: Record<SectionType, string> = {
  annotations: 'Annotations',
  'text-changes': 'Text Changes',
  'style-mutations': 'Style Mutations',
  'animation-changes': 'Animation Changes',
  instructions: 'Instructions',
  comments: 'Comments',
};

export function ContextOutputPanel() {
  const {
    compiledPrompt,
    isCompiling,
    lastCopiedAt,
    enabledSections,
    copyToClipboard,
    toggleSection,
  } = useAppStore();

  const [showPreview, setShowPreview] = useState(false);

  const handleCopy = useCallback(async () => {
    await copyToClipboard();
  }, [copyToClipboard]);

  const recentlyCopied = lastCopiedAt && Date.now() - lastCopiedAt < 2000;

  // Count items per section from compiled output
  const sections = compiledPrompt?.sections ?? [];
  const enabledCount = sections.filter((s) => enabledSections[s.type]).length;
  const totalItems = sections.reduce(
    (sum, s) => (enabledSections[s.type] ? sum + s.itemCount : sum),
    0,
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-edge-primary">
        <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
          Prompt Output
        </h3>
        <span className="text-xs text-content-secondary">
          {totalItems} item{totalItems !== 1 ? 's' : ''} · {enabledCount} section{enabledCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Section toggles */}
      <div className="px-3 py-2 space-y-1 border-b border-edge-primary">
        {sections.map((section) => (
          <label
            key={section.type}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={enabledSections[section.type]}
              onChange={() => toggleSection(section.type)}
              className="rounded border-edge-primary text-content-primary"
            />
            <span className="text-xs text-content-secondary group-hover:text-content-primary transition-colors flex-1">
              {SECTION_LABELS[section.type] ?? section.type}
            </span>
            <span className="text-xs text-content-secondary tabular-nums">
              {section.itemCount}
            </span>
          </label>
        ))}

        {sections.length === 0 && (
          <p className="text-xs text-content-secondary italic">
            No data yet. Use design tools, annotate, or add comments to build the prompt.
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 px-3 py-2 border-b border-edge-primary">
        <button
          onClick={handleCopy}
          disabled={totalItems === 0 || isCompiling}
          className="flex-1 rounded bg-surface-primary border border-edge-primary px-3 py-2 text-xs font-medium text-content-primary hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isCompiling ? 'Compiling...' : recentlyCopied ? 'Copied!' : 'Copy Prompt'}
        </button>
        <button
          onClick={() => setShowPreview(!showPreview)}
          disabled={sections.length === 0}
          className="rounded border border-edge-primary px-3 py-2 text-xs text-content-secondary hover:text-content-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {showPreview ? 'Hide' : 'Preview'}
        </button>
      </div>

      {/* Markdown preview (filtered by enabled sections) */}
      {showPreview && compiledPrompt && (
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <pre className="whitespace-pre-wrap text-xs text-content-primary font-mono leading-relaxed">
            {compiledPrompt.sections
              .filter((s) => enabledSections[s.type])
              .map((s) => s.markdown)
              .join('\n\n---\n\n')}
          </pre>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Verify existing imports in EditorLayout**

Confirm `EditorLayout.tsx` already imports `ContextOutputPanel` and routes `case "prompt"` to it. No changes needed in EditorLayout for this task.

**Step 4: Commit**

```bash
git add packages/extension/src/panel/components/ContextOutputPanel.tsx
git commit -m "feat: rebuild ContextOutputPanel with section toggles and preview"
```

---

### Task 3: Mount the Auto-Compile Hook

**Files:**
- Modify: `packages/extension/src/panel/hooks/usePromptAutoCompile.ts` (update to include comments)
- Modify: `packages/extension/src/entrypoints/panel/Panel.tsx` (mount the hook)

**Step 1: Update `usePromptAutoCompile` to include comments**

Add `comments` from the store to the dependency list:

```typescript
import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

export function usePromptAutoCompile() {
  const annotations = useAppStore((s) => s.annotations);
  const textEdits = useAppStore((s) => s.textEdits);
  const mutationDiffs = useAppStore((s) => s.mutationDiffs);
  const animationDiffs = useAppStore((s) => s.animationDiffs);
  const promptSteps = useAppStore((s) => s.promptSteps);
  const comments = useAppStore((s) => s.comments);
  const compilePrompt = useAppStore((s) => s.compilePrompt);

  useEffect(() => {
    const totalItems =
      (annotations?.length ?? 0) +
      (textEdits?.length ?? 0) +
      (mutationDiffs?.length ?? 0) +
      (animationDiffs?.length ?? 0) +
      (promptSteps?.length ?? 0) +
      (comments?.length ?? 0);

    if (totalItems === 0) return;

    const timer = setTimeout(() => {
      compilePrompt();
    }, 300);

    return () => clearTimeout(timer);
  }, [annotations, textEdits, mutationDiffs, animationDiffs, promptSteps, comments, compilePrompt]);
}
```

**Step 2: Find Panel.tsx and mount the hook**

Read `packages/extension/src/entrypoints/panel/Panel.tsx` to find the right mount point.

Add the hook call inside the `Panel` component (or `App` root component, whichever is the top-level panel component):

```typescript
import { usePromptAutoCompile } from '../../panel/hooks/usePromptAutoCompile';

function Panel() {
  // ... existing hooks ...
  usePromptAutoCompile();

  // ... existing render ...
}
```

The hook has no UI — it's a fire-and-forget side-effect that keeps `compiledPrompt` fresh.

**Step 3: Verify auto-compile fires**

After mounting, any mutation to annotations/textEdits/mutationDiffs/comments should trigger recompilation after 300ms. The `ContextOutputPanel` preview should update reactively without clicking "Preview".

**Step 4: Commit**

```bash
git add packages/extension/src/panel/hooks/usePromptAutoCompile.ts packages/extension/src/entrypoints/panel/Panel.tsx
git commit -m "feat: mount auto-compile hook — prompt recompiles on data changes"
```

---

### Task 4: Add Comments to Prompt Compiler

> **Note:** This task requires Sub-Plan 3 Task 4 to be complete (comments flowing into the compiler). If Sub-Plan 3 is not done yet, skip to Task 5 and return here later.

**Files:**
- Modify: `packages/extension/src/services/promptCompiler.ts` (add `comments` to `CompilerInput`, add `compileComments()`)
- Modify: `packages/extension/src/panel/stores/slices/promptOutputSlice.ts` (pass comments to compiler)
- Reference: `packages/extension/src/panel/stores/slices/commentSlice.ts` (Feedback type)

**Step 1: Import Feedback type and add to CompilerInput**

In `promptCompiler.ts`, add `comments` as a new input field:

```typescript
import type { MutationDiff } from '@flow/shared';
import type { Annotation } from '@flow/shared';
import type { TextEdit } from '@flow/shared';
import type { AnimationDiff } from '@flow/shared';
import type { PromptStep } from '@flow/shared';

// The Feedback type is defined in commentSlice.ts. Import from there or define inline.
// If commentSlice exports it, use that. Otherwise define a minimal interface:
interface CommentFeedback {
  id: string;
  type: 'comment' | 'question';
  content: string;
  componentName?: string;
  sourceFile?: string;
  sourceLine?: number;
  selector: string;
  timestamp: number;
}

export interface CompilerInput {
  annotations: Annotation[];
  textEdits: TextEdit[];
  mutationDiffs: MutationDiff[];
  animationDiffs: AnimationDiff[];
  promptSteps: PromptStep[];
  comments: CommentFeedback[];
}
```

**Step 2: Add `'comments'` to the `PromptSection` type union**

```typescript
export interface PromptSection {
  type: 'annotations' | 'text-changes' | 'style-mutations' | 'animation-changes' | 'instructions' | 'comments';
  markdown: string;
  itemCount: number;
}
```

**Step 3: Add `compileComments()` method to `PromptCompiler`**

Add after `compilePromptSteps()`:

```typescript
private compileComments(comments: CommentFeedback[]): PromptSection {
  const lines = comments.map((c, i) => {
    const label = c.componentName ? `<${c.componentName}>` : c.selector;
    const location = c.sourceFile ? ` (${c.sourceFile}:${c.sourceLine})` : '';
    const typeTag = c.type === 'question' ? ' [Question]' : '';
    return `${i + 1}. \`${label}\`${location}${typeTag}\n   > ${c.content}`;
  });
  return {
    type: 'comments',
    markdown: `## Comments & Feedback\n\n${lines.join('\n\n')}`,
    itemCount: comments.length,
  };
}
```

**Step 4: Call `compileComments()` in `compile()`**

In the `compile()` method, after the `promptSteps` block:

```typescript
if (input.comments.length > 0) {
  sections.push(this.compileComments(input.comments));
}
```

And add comments to the source file counter:

```typescript
input.comments.forEach((item) => item.sourceFile && allFiles.add(item.sourceFile));
```

**Step 5: Update `promptOutputSlice.compilePrompt()` to pass comments**

In `promptOutputSlice.ts`, update `compilePrompt()`:

```typescript
compilePrompt: () => {
  set({ isCompiling: true });
  const state = get();
  const compiled = promptCompiler.compile({
    annotations: state.annotations ?? [],
    textEdits: state.textEdits ?? [],
    mutationDiffs: state.mutationDiffs ?? [],
    animationDiffs: state.animationDiffs ?? [],
    promptSteps: state.promptSteps ?? [],
    comments: state.comments ?? [],
  });
  set({ compiledPrompt: compiled, isCompiling: false });
},
```

**Step 6: Commit**

```bash
git add packages/extension/src/services/promptCompiler.ts packages/extension/src/panel/stores/slices/promptOutputSlice.ts
git commit -m "feat: add comments to prompt compiler input and output"
```

---

### Task 5: Wire Sidecar Sync to Auto-Push on Compile

**Files:**
- Modify: `packages/extension/src/services/sidecarSync.ts` (add comments to payload)
- Create: `packages/extension/src/panel/hooks/useSessionSync.ts` (auto-push hook)
- Modify: `packages/extension/src/entrypoints/panel/Panel.tsx` (mount sync hook)

**Step 1: Add comments to `pushSessionToSidecar` payload**

In `sidecarSync.ts`, extend the `sessionData` parameter:

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
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  ws.send(
    JSON.stringify({
      type: 'session-update',
      payload: {
        tabId,
        compiledMarkdown,
        ...sessionData,
      },
    }),
  );
}
```

**Step 2: Create `useSessionSync` hook**

Create `packages/extension/src/panel/hooks/useSessionSync.ts`:

```typescript
import { useEffect, useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { connectToSidecar, pushSessionToSidecar } from '../../services/sidecarSync';

/**
 * Connects to sidecar on mount and pushes session data
 * whenever the compiled prompt changes.
 */
export function useSessionSync() {
  const compiledPrompt = useAppStore((s) => s.compiledPrompt);
  const annotations = useAppStore((s) => s.annotations);
  const textEdits = useAppStore((s) => s.textEdits);
  const mutationDiffs = useAppStore((s) => s.mutationDiffs);
  const animationDiffs = useAppStore((s) => s.animationDiffs);
  const promptSteps = useAppStore((s) => s.promptSteps);
  const comments = useAppStore((s) => s.comments);
  const lastPushedHash = useRef<string>('');

  // Connect on mount
  useEffect(() => {
    connectToSidecar();
  }, []);

  // Push when compiled prompt changes
  useEffect(() => {
    if (!compiledPrompt) return;

    const payload = {
      annotations: annotations ?? [],
      textEdits: textEdits ?? [],
      mutationDiffs: mutationDiffs ?? [],
      animationDiffs: animationDiffs ?? [],
      promptSteps: promptSteps ?? [],
      comments: comments ?? [],
    };

    // Content hash (not timestamp) to avoid duplicate pushes
    const hash = JSON.stringify({
      tabId: compiledPrompt.metadata.tabId,
      compiledMarkdown: compiledPrompt.markdown,
      payload,
    });
    if (hash === lastPushedHash.current) return;
    lastPushedHash.current = hash;

    pushSessionToSidecar(
      compiledPrompt.metadata.tabId,
      compiledPrompt.markdown,
      payload,
    );
  }, [compiledPrompt, annotations, textEdits, mutationDiffs, animationDiffs, promptSteps, comments]);
}
```

**Step 3: Mount in Panel.tsx**

In `packages/extension/src/entrypoints/panel/Panel.tsx`, import and call:

```typescript
import { useSessionSync } from '../../panel/hooks/useSessionSync';

function Panel() {
  // ... existing hooks ...
  usePromptAutoCompile();
  useSessionSync();

  // ... existing render ...
}
```

**Step 4: Commit**

```bash
git add packages/extension/src/services/sidecarSync.ts packages/extension/src/panel/hooks/useSessionSync.ts packages/extension/src/entrypoints/panel/Panel.tsx
git commit -m "feat: wire sidecar sync to auto-push compiled prompt on changes"
```

---

### Task 6: End-to-End Verification

**Files:** None (verification only)

**Step 1: Build the extension**

```bash
cd packages/extension && pnpm build
```

Expected: Clean build, no TypeScript errors.

**Step 2: Test auto-compilation**

1. Open Chrome DevTools panel
2. Inspect an element on any page
3. Make a design edit (e.g., change a color)
4. Wait 300ms
5. Open the "Prompt" tab
6. Verify: `compiledPrompt` is non-null, "Style Mutations" section appears

**Step 3: Test section toggles**

1. In the Prompt tab, uncheck "Style Mutations"
2. Click "Copy Prompt"
3. Paste into a text editor
4. Verify: The pasted markdown does NOT contain the "## Style Mutations" section
5. Re-check "Style Mutations", click "Copy Prompt" again
6. Verify: The pasted markdown now contains "## Style Mutations"

**Step 4: Test copy-all**

1. Add an annotation (annotate mode, click element, type text)
2. Make a text edit (text edit mode, change text)
3. Add a comment (comment mode, alt+click, type feedback)
4. Open Prompt tab
5. Verify: Sections show item counts for each type
6. Click "Copy Prompt" → verify markdown contains all sections
7. Verify button shows "Copied!" for ~2 seconds

**Step 5: Test preview toggle**

1. Click "Preview" → verify markdown renders in scrollable area
2. Toggle sections off → verify preview updates in real-time
3. Click "Hide" → verify preview area disappears

**Step 6: Test sidecar sync (if server is running)**

1. Start MCP server: `cd packages/server && pnpm dev`
2. Make edits in extension
3. Check server logs for incoming `session-update` WebSocket messages
4. Verify comments are included in the payload

**Step 7: Commit verification notes (optional)**

```bash
git commit --allow-empty -m "chore: verify copy-to-clipboard integration complete"
```

---

## Data Flow Summary

```
User makes edits (any mode)
  → Data lands in respective Zustand slice
  → usePromptAutoCompile detects change (300ms debounce)
  → promptOutputSlice.compilePrompt()
    → promptCompiler.compile({
        annotations, textEdits, mutationDiffs,
        animationDiffs, promptSteps,
        comments  ← NEW
      })
    → Returns CompiledPrompt { markdown, sections[], metadata }
  → compiledPrompt stored in Zustand
  → ContextOutputPanel re-renders with section breakdown
  → useSessionSync detects compiledPrompt change
    → pushSessionToSidecar(tabId, markdown, sessionData)
    → WebSocket → MCP server context-store

User clicks "Copy Prompt"
  → copyToClipboard()
  → Filters sections by enabledSections toggles
  → navigator.clipboard.writeText(filteredMarkdown)
  → "Copied!" state for 2s
```

## Files Modified

| File | Change |
|------|--------|
| `panel/stores/slices/promptOutputSlice.ts` | Add `enabledSections`, `toggleSection()`, `setAllSections()`, filter copy by enabled |
| `panel/components/ContextOutputPanel.tsx` | Full rebuild: section toggles, preview toggle, counts per section |
| `panel/hooks/usePromptAutoCompile.ts` | Add `comments` to dependency list |
| `entrypoints/panel/Panel.tsx` | Mount `usePromptAutoCompile()` and `useSessionSync()` |
| `services/promptCompiler.ts` | Add `comments` to `CompilerInput`, add `compileComments()`, add `'comments'` to `PromptSection.type` |
| `services/sidecarSync.ts` | Add `comments` to `pushSessionToSidecar` payload type |

## Files Created

| File | Purpose |
|------|---------|
| `panel/hooks/useSessionSync.ts` | Auto-push to sidecar when compiled prompt changes |
