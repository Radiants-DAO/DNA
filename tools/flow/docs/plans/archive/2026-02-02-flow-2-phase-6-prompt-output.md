# Phase 6: LLM Context Output + Prompt Builder

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Compile all accumulated session interactions (annotations, text edits, mutation diffs, designer changes, animation tweaks, prompt builder chains) into structured, source-resolved prompts delivered via clipboard or MCP.

**Architecture:** A PromptCompiler service aggregates data from all Zustand slices (mutation diffs, annotations, text edits, designer changes, animation diffs, prompt builder steps) into spec-compliant markdown. The store lives under `packages/extension/src/panel/stores` and UI panels under `packages/extension/src/panel/components`. The Prompt Builder UI provides a visual query builder with element slots and property dropdowns, filtered through language adapters (CSS/Tailwind/Figma). Session state persists via chrome.storage APIs with per-tab isolation.

**Tech Stack:** React 19, Zustand 5, TypeScript 5.8, Tailwind v4, chrome.storage.session/local, Shadow DOM (annotation badges), MCP sidecar integration (get_mutation_diffs)

**Plan adjustments (2026-02-03):**
- Tasks 1-3 are completed in Batch 1 (PromptCompiler, shared types, promptOutputSlice).
- `textEdits`, `designerChanges`, and `animationDiffs` slices were missing; Task 9 now defines them and their wiring.
- File path references are updated to match the `panel/` directory layout.

---

## Task 1: Create PromptCompiler service — types and skeleton

Create the core compiler types and empty service class.

**Status:** Completed (Batch 1)

**File:** `packages/extension/src/services/promptCompiler.ts`

```typescript
import type { MutationDiff } from '@flow/shared';
import type { Annotation } from '@flow/shared';
import type { TextEdit } from '@flow/shared';
import type { DesignerChange } from '@flow/shared';
import type { AnimationDiff } from '@flow/shared';
import type { PromptStep } from '@flow/shared';

export interface CompilerInput {
  annotations: Annotation[];
  textEdits: TextEdit[];
  mutationDiffs: MutationDiff[];
  designerChanges: DesignerChange[];
  animationDiffs: AnimationDiff[];
  promptSteps: PromptStep[];
}

export interface CompiledPrompt {
  markdown: string;
  sections: PromptSection[];
  metadata: {
    tabId: number;
    timestamp: number;
    elementCount: number;
    sourceFileCount: number;
  };
}

export interface PromptSection {
  type: 'annotations' | 'text-changes' | 'style-mutations' | 'designer-changes' | 'animation-changes' | 'instructions';
  markdown: string;
  itemCount: number;
}

export class PromptCompiler {
  compile(input: CompilerInput): CompiledPrompt {
    const sections: PromptSection[] = [];

    if (input.annotations.length > 0) {
      sections.push(this.compileAnnotations(input.annotations));
    }
    if (input.textEdits.length > 0) {
      sections.push(this.compileTextEdits(input.textEdits));
    }
    if (input.mutationDiffs.length > 0) {
      sections.push(this.compileMutationDiffs(input.mutationDiffs));
    }
    if (input.designerChanges.length > 0) {
      sections.push(this.compileDesignerChanges(input.designerChanges));
    }
    if (input.animationDiffs.length > 0) {
      sections.push(this.compileAnimationDiffs(input.animationDiffs));
    }
    if (input.promptSteps.length > 0) {
      sections.push(this.compilePromptSteps(input.promptSteps));
    }

    const markdown = sections.map((s) => s.markdown).join('\n\n---\n\n');
    const allFiles = new Set<string>();
    // Count unique source files from all inputs
    input.annotations.forEach((item) => item.sourceFile && allFiles.add(item.sourceFile));
    input.textEdits.forEach((item) => item.sourceFile && allFiles.add(item.sourceFile));
    input.designerChanges.forEach((item) => item.sourceFile && allFiles.add(item.sourceFile));
    input.animationDiffs.forEach((item) => item.sourceFile && allFiles.add(item.sourceFile));
    input.mutationDiffs.forEach((item) => {
      if (item.element.sourceFile) allFiles.add(item.element.sourceFile);
    });

    return {
      markdown,
      sections,
      metadata: {
        tabId: 0, // Set by caller
        timestamp: Date.now(),
        elementCount: sections.reduce((sum, s) => sum + s.itemCount, 0),
        sourceFileCount: allFiles.size,
      },
    };
  }

  private compileAnnotations(annotations: Annotation[]): PromptSection {
    const lines = annotations.map((a, i) => {
      const location = a.sourceFile ? ` at ${a.sourceFile}:${a.sourceLine}` : '';
      return `${i + 1}. \`<${a.componentName}>\`${location}\n   -> "${a.text}"`;
    });
    return {
      type: 'annotations',
      markdown: `## Annotations\n\n${lines.join('\n\n')}`,
      itemCount: annotations.length,
    };
  }

  private compileTextEdits(edits: TextEdit[]): PromptSection {
    const lines = edits.map((e, i) => {
      const location = e.sourceFile ? `${e.sourceFile}:${e.sourceLine}` : e.selector;
      return `${i + 1}. ${location}\n   - Before: "${e.before}"\n   - After: "${e.after}"`;
    });
    return {
      type: 'text-changes',
      markdown: `## Text Changes\n\n${lines.join('\n\n')}`,
      itemCount: edits.length,
    };
  }

  private compileMutationDiffs(diffs: MutationDiff[]): PromptSection {
    const lines = diffs.map((d, i) => {
      const label = d.element.componentName ? `<${d.element.componentName}>` : d.element.selector;
      const line = d.element.sourceLine ? `:${d.element.sourceLine}` : '';
      const location = d.element.sourceFile
        ? `\`${label}\` (${d.element.sourceFile}${line})`
        : `\`${d.element.selector}\``;
      const changes = d.changes
        .map((c) => `   - ${c.property}: \`${c.oldValue}\` -> \`${c.newValue}\``)
        .join('\n');
      return `${i + 1}. ${location}\n${changes}`;
    });
    return {
      type: 'style-mutations',
      markdown: `## Style Mutations\n\n${lines.join('\n\n')}`,
      itemCount: diffs.length,
    };
  }

  private compileDesignerChanges(changes: DesignerChange[]): PromptSection {
    const lines = changes.map((d, i) => {
      const location = d.sourceFile ? `\`<${d.componentName}>\` (${d.sourceFile}:${d.sourceLine})` : `\`${d.selector}\``;
      const props = d.changes
        .map((c) => `   - ${c.property}: \`${c.oldValue}\` -> \`${c.newValue}\``)
        .join('\n');
      return `${i + 1}. ${location}\n${props}`;
    });
    return {
      type: 'designer-changes',
      markdown: `## Designer Changes\n\n${lines.join('\n\n')}`,
      itemCount: changes.length,
    };
  }

  private compileAnimationDiffs(diffs: AnimationDiff[]): PromptSection {
    const lines = diffs.map((d, i) => {
      const location = d.sourceFile ? `\`${d.target}\` in \`<${d.componentName}>\` (${d.sourceFile}:${d.sourceLine})` : `\`${d.target}\``;
      const changes = d.changes.map((c) => `   - ${c.property}: ${c.before} -> ${c.after}`).join('\n');
      return `${i + 1}. Target: ${location}\n${changes}`;
    });
    return {
      type: 'animation-changes',
      markdown: `## Animation Changes\n\n${lines.join('\n\n')}`,
      itemCount: diffs.length,
    };
  }

  private compilePromptSteps(steps: PromptStep[]): PromptSection {
    const lines = steps.map((s, i) => {
      const target = s.targetSourceFile
        ? `\`<${s.targetComponentName}>\` (${s.targetSourceFile}:${s.targetSourceLine})`
        : `\`${s.targetSelector}\``;
      let instruction = `${i + 1}. ${s.verb} ${target}`;
      if (s.value) instruction += ` ${s.preposition || 'to'} ${s.value}`;
      if (s.referenceSourceFile) {
        instruction += `\n   Reference: \`<${s.referenceComponentName}>\` (${s.referenceSourceFile}:${s.referenceSourceLine})`;
      }
      return instruction;
    });
    return {
      type: 'instructions',
      markdown: `## Instructions\n\n${lines.join('\n\n')}`,
      itemCount: steps.length,
    };
  }
}

export const promptCompiler = new PromptCompiler();
```

**Test:** `packages/extension/src/services/__tests__/promptCompiler.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { PromptCompiler } from '../promptCompiler';

describe('PromptCompiler', () => {
  const compiler = new PromptCompiler();

  it('compiles empty input to empty output', () => {
    const result = compiler.compile({
      annotations: [],
      textEdits: [],
      mutationDiffs: [],
      designerChanges: [],
      animationDiffs: [],
      promptSteps: [],
    });
    expect(result.markdown).toBe('');
    expect(result.sections).toHaveLength(0);
  });

  it('compiles annotations with source locations', () => {
    const result = compiler.compile({
      annotations: [
        {
          id: '1',
          componentName: 'HeroSection',
          sourceFile: 'src/components/Hero.tsx',
          sourceLine: 23,
          text: 'Padding feels too tight on mobile',
          selector: '.hero',
          timestamp: Date.now(),
        },
      ],
      textEdits: [],
      mutationDiffs: [],
      designerChanges: [],
      animationDiffs: [],
      promptSteps: [],
    });
    expect(result.markdown).toContain('## Annotations');
    expect(result.markdown).toContain('`<HeroSection>`');
    expect(result.markdown).toContain('src/components/Hero.tsx:23');
    expect(result.markdown).toContain('Padding feels too tight on mobile');
  });

  it('compiles text edits with before/after', () => {
    const result = compiler.compile({
      annotations: [],
      textEdits: [
        {
          id: '1',
          sourceFile: 'src/components/Hero.tsx',
          sourceLine: 31,
          selector: '.hero h1',
          before: 'Welcome to our platform',
          after: 'Ship faster with Flow',
          timestamp: Date.now(),
        },
      ],
      mutationDiffs: [],
      designerChanges: [],
      animationDiffs: [],
      promptSteps: [],
    });
    expect(result.markdown).toContain('## Text Changes');
    expect(result.markdown).toContain('Before: "Welcome to our platform"');
    expect(result.markdown).toContain('After: "Ship faster with Flow"');
  });

  it('compiles mutation diffs with property changes', () => {
    const result = compiler.compile({
      annotations: [],
      textEdits: [],
      mutationDiffs: [
        {
          id: '1',
          element: {
            selector: '.card',
            componentName: 'Card',
            sourceFile: 'src/components/Card.tsx',
            sourceLine: 15,
          },
          type: 'style',
          changes: [
            { property: 'padding', oldValue: '16px', newValue: '24px' },
            { property: 'border-radius', oldValue: '4px', newValue: '8px' },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
      designerChanges: [],
      animationDiffs: [],
      promptSteps: [],
    });
    expect(result.markdown).toContain('## Style Mutations');
    expect(result.markdown).toContain('padding: `16px` -> `24px`');
  });

  it('compiles prompt builder steps with source refs', () => {
    const result = compiler.compile({
      annotations: [],
      textEdits: [],
      mutationDiffs: [],
      designerChanges: [],
      animationDiffs: [],
      promptSteps: [
        {
          id: '1',
          verb: 'Change',
          targetComponentName: 'HeroSection',
          targetSourceFile: 'src/components/Hero.tsx',
          targetSourceLine: 23,
          targetSelector: '.hero',
          value: 'flex-row',
          preposition: 'to',
          timestamp: Date.now(),
        },
      ],
    });
    expect(result.markdown).toContain('## Instructions');
    expect(result.markdown).toContain('Change `<HeroSection>` (src/components/Hero.tsx:23) to flex-row');
  });

  it('joins multiple sections with dividers', () => {
    const result = compiler.compile({
      annotations: [{ id: '1', componentName: 'A', text: 'note', selector: '.a', timestamp: 0 }],
      textEdits: [{ id: '1', selector: '.b', before: 'x', after: 'y', timestamp: 0 }],
      mutationDiffs: [],
      designerChanges: [],
      animationDiffs: [],
      promptSteps: [],
    });
    expect(result.sections).toHaveLength(2);
    expect(result.markdown).toContain('---');
  });

  it('counts unique source files in metadata', () => {
    const result = compiler.compile({
      annotations: [
        { id: '1', componentName: 'A', sourceFile: 'a.tsx', sourceLine: 1, text: 'x', selector: '.a', timestamp: 0 },
        { id: '2', componentName: 'B', sourceFile: 'b.tsx', sourceLine: 1, text: 'y', selector: '.b', timestamp: 0 },
      ],
      textEdits: [{ id: '1', sourceFile: 'a.tsx', sourceLine: 5, selector: '.a', before: 'x', after: 'y', timestamp: 0 }],
      mutationDiffs: [],
      designerChanges: [],
      animationDiffs: [],
      promptSteps: [],
    });
    expect(result.metadata.sourceFileCount).toBe(2); // a.tsx counted once
  });
});
```

**Commit:** `feat(flow2): add PromptCompiler service with tests`

---

## Task 2: Create shared types for all compiler inputs

Define the shared type contracts referenced by the compiler and all slices.

**Status:** Completed (Batch 1)

**File:** `packages/shared/src/types/annotations.ts`

```typescript
export interface Annotation {
  id: string;
  componentName?: string;
  sourceFile?: string;
  sourceLine?: number;
  selector: string;
  text: string;
  timestamp: number;
}
```

**File:** `packages/shared/src/types/textEdits.ts`

```typescript
export interface TextEdit {
  id: string;
  sourceFile?: string;
  sourceLine?: number;
  selector: string;
  before: string;
  after: string;
  timestamp: number;
}
```

**File:** `packages/shared/src/types/mutation.ts` (already defined in Phase 4)

Reuse `MutationDiff` and `PropertyMutation` from Phase 4 to avoid a second schema.

**File:** `packages/shared/src/types/designer.ts`

```typescript
import type { PropertyMutation } from './mutation';

export interface DesignerChange {
  id: string;
  componentName?: string;
  sourceFile?: string;
  sourceLine?: number;
  selector: string;
  section: 'layout' | 'spacing' | 'size' | 'typography' | 'colors' | 'borders' | 'shadows' | 'effects' | 'animations';
  changes: PropertyMutation[];
  timestamp: number;
}
```

**File:** `packages/shared/src/types/animations.ts`

```typescript
export interface AnimationPropertyChange {
  property: string;
  before: string;
  after: string;
}

export interface AnimationDiff {
  id: string;
  target: string;
  componentName?: string;
  sourceFile?: string;
  sourceLine?: number;
  changes: AnimationPropertyChange[];
  timestamp: number;
}
```

**File:** `packages/shared/src/types/promptBuilder.ts`

```typescript
export type PromptVerb = 'Change' | 'Add' | 'Remove' | 'Move' | 'Apply' | 'Set' | 'Replace';

export interface PromptStep {
  id: string;
  verb: PromptVerb;
  targetComponentName?: string;
  targetSourceFile?: string;
  targetSourceLine?: number;
  targetSelector: string;
  value?: string;
  preposition?: string;
  referenceComponentName?: string;
  referenceSourceFile?: string;
  referenceSourceLine?: number;
  referenceSelector?: string;
  timestamp: number;
}

export type LanguageAdapter = 'css' | 'tailwind' | 'figma';
```

**File:** `packages/shared/src/index.ts`

```typescript
export * from './messages';
export * from './constants';
export * from './types/inspection';
export * from './types/selection';
export * from './types/mutation';
export * from './types/annotations';
export * from './types/textEdits';
export * from './types/designer';
export * from './types/animations';
export * from './types/promptBuilder';
```

**Commit:** `feat(flow2): add shared types for prompt compiler inputs`

---

## Task 3: Create promptOutputSlice for Zustand store

This slice manages the compiled output state and coordinates compilation.

**Status:** Completed (Batch 1)

**File:** `packages/extension/src/panel/stores/slices/promptOutputSlice.ts`

```typescript
import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import type { CompiledPrompt } from '../../../services/promptCompiler';
import { promptCompiler } from '../../../services/promptCompiler';

export interface PromptOutputSlice {
  compiledPrompt: CompiledPrompt | null;
  isCompiling: boolean;
  lastCopiedAt: number | null;
  compilePrompt: () => void;
  copyToClipboard: () => Promise<void>;
  clearCompiledPrompt: () => void;
}

export const createPromptOutputSlice: StateCreator<AppState, [], [], PromptOutputSlice> = (set, get) => ({
  compiledPrompt: null,
  isCompiling: false,
  lastCopiedAt: null,

  compilePrompt: () => {
    set({ isCompiling: true });
    const state = get();
    const compiled = promptCompiler.compile({
      annotations: state.annotations ?? [],
      textEdits: state.textEdits ?? [],
      mutationDiffs: state.mutationDiffs ?? [],
      designerChanges: state.designerChanges ?? [],
      animationDiffs: state.animationDiffs ?? [],
      promptSteps: state.promptSteps ?? [],
    });
    set({ compiledPrompt: compiled, isCompiling: false });
  },

  copyToClipboard: async () => {
    const state = get();
    if (!state.compiledPrompt) {
      state.compilePrompt();
    }
    const prompt = get().compiledPrompt;
    if (prompt) {
      await navigator.clipboard.writeText(prompt.markdown);
      set({ lastCopiedAt: Date.now() });
    }
  },

  clearCompiledPrompt: () => {
    set({ compiledPrompt: null, lastCopiedAt: null });
  },
});
```

**Commit:** `feat(flow2): add promptOutputSlice to Zustand store`

---

## Task 4: Create promptBuilderSlice for Zustand store

Manages the visual query builder state: steps, active language, element slot selection.

**File:** `packages/extension/src/panel/stores/slices/promptBuilderSlice.ts`

```typescript
import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import type { PromptStep, PromptVerb, LanguageAdapter } from '@flow/shared';
import { nanoid } from 'nanoid';

export interface PromptBuilderSlice {
  promptSteps: PromptStep[];
  activeLanguage: LanguageAdapter;
  /** Which step + slot is awaiting an element click on the page */
  pendingSlot: { stepId: string; slot: 'target' | 'reference' } | null;

  addPromptStep: (verb?: PromptVerb) => void;
  removePromptStep: (stepId: string) => void;
  updatePromptStep: (stepId: string, updates: Partial<PromptStep>) => void;
  reorderPromptSteps: (fromIndex: number, toIndex: number) => void;
  setActiveLanguage: (lang: LanguageAdapter) => void;
  setPendingSlot: (slot: { stepId: string; slot: 'target' | 'reference' } | null) => void;
  /** Called when user clicks an element on the page while a slot is pending */
  fillSlot: (elementData: {
    componentName?: string;
    sourceFile?: string;
    sourceLine?: number;
    selector: string;
  }) => void;
  clearPromptSteps: () => void;
}

export const createPromptBuilderSlice: StateCreator<AppState, [], [], PromptBuilderSlice> = (set, get) => ({
  promptSteps: [],
  activeLanguage: 'css',
  pendingSlot: null,

  addPromptStep: (verb = 'Change') => {
    const step: PromptStep = {
      id: nanoid(),
      verb,
      targetSelector: '',
      timestamp: Date.now(),
    };
    set((s) => ({ promptSteps: [...s.promptSteps, step] }));
  },

  removePromptStep: (stepId) => {
    set((s) => ({ promptSteps: s.promptSteps.filter((st) => st.id !== stepId) }));
  },

  updatePromptStep: (stepId, updates) => {
    set((s) => ({
      promptSteps: s.promptSteps.map((st) => (st.id === stepId ? { ...st, ...updates } : st)),
    }));
  },

  reorderPromptSteps: (fromIndex, toIndex) => {
    set((s) => {
      const steps = [...s.promptSteps];
      const [moved] = steps.splice(fromIndex, 1);
      steps.splice(toIndex, 0, moved);
      return { promptSteps: steps };
    });
  },

  setActiveLanguage: (lang) => set({ activeLanguage: lang }),

  setPendingSlot: (slot) => set({ pendingSlot: slot }),

  fillSlot: (elementData) => {
    const { pendingSlot } = get();
    if (!pendingSlot) return;

    const prefix = pendingSlot.slot === 'target' ? 'target' : 'reference';
    get().updatePromptStep(pendingSlot.stepId, {
      [`${prefix}ComponentName`]: elementData.componentName,
      [`${prefix}SourceFile`]: elementData.sourceFile,
      [`${prefix}SourceLine`]: elementData.sourceLine,
      [`${prefix}Selector`]: elementData.selector,
    });
    set({ pendingSlot: null });
  },

  clearPromptSteps: () => set({ promptSteps: [], pendingSlot: null }),
});
```

**Commit:** `feat(flow2): add promptBuilderSlice to Zustand store`

---

## Task 5: Register new slices in appStore

Wire the two new slices into the combined store.

**File:** `packages/extension/src/panel/stores/appStore.ts`  
**Also update:** `packages/extension/src/panel/stores/types.ts`

Add imports and merge the new slices into the combined store creator. The exact edit depends on how phases 1-5 structured the store, but the pattern is:

```typescript
// In stores/types.ts (add to slice imports)
import type { PromptOutputSlice } from './slices/promptOutputSlice';
import type { PromptBuilderSlice } from './slices/promptBuilderSlice';

// Add to AppState interface
export interface AppState extends /* ...existing slices... */, PromptOutputSlice, PromptBuilderSlice {}

// In stores/appStore.ts (add to create() call)
...createPromptOutputSlice(...args),
...createPromptBuilderSlice(...args),
```

**Commit:** `feat(flow2): register prompt slices in appStore`

---

## Task 6: Language adapters — CSS, Tailwind, Figma translation tables

**File:** `packages/extension/src/services/languageAdapters.ts`

```typescript
import type { LanguageAdapter } from '@flow/shared';

export interface TranslationEntry {
  css: string;
  tailwind: string;
  figma: string;
}

/**
 * Bidirectional translation table per spec section 7.4.
 * Key is the canonical CSS property:value pair.
 */
const TRANSLATIONS: TranslationEntry[] = [
  { css: 'display: flex', tailwind: 'flex', figma: 'Auto layout' },
  { css: 'display: grid', tailwind: 'grid', figma: 'Grid layout' },
  { css: 'display: block', tailwind: 'block', figma: 'Frame' },
  { css: 'display: none', tailwind: 'hidden', figma: 'Hidden' },
  { css: 'flex: 1', tailwind: 'flex-1', figma: 'Fill container' },
  { css: 'flex-direction: row', tailwind: 'flex-row', figma: 'Horizontal' },
  { css: 'flex-direction: column', tailwind: 'flex-col', figma: 'Vertical' },
  { css: 'width: fit-content', tailwind: 'w-fit', figma: 'Hug contents' },
  { css: 'height: fit-content', tailwind: 'h-fit', figma: 'Hug contents' },
  { css: 'width: 100%', tailwind: 'w-full', figma: 'Fill container' },
  { css: 'align-items: center', tailwind: 'items-center', figma: 'Center (cross axis)' },
  { css: 'justify-content: center', tailwind: 'justify-center', figma: 'Center (main axis)' },
  { css: 'justify-content: space-between', tailwind: 'justify-between', figma: 'Space between' },
  { css: 'position: absolute', tailwind: 'absolute', figma: 'Absolute position' },
  { css: 'position: relative', tailwind: 'relative', figma: 'Relative' },
  { css: 'overflow: hidden', tailwind: 'overflow-hidden', figma: 'Clip content' },
];

/** Pixel-based gap/spacing translation for Tailwind */
const SPACING_SCALE: Record<number, string> = {
  0: '0', 1: 'px', 2: '0.5', 4: '1', 6: '1.5', 8: '2', 10: '2.5',
  12: '3', 14: '3.5', 16: '4', 20: '5', 24: '6', 28: '7', 32: '8',
  36: '9', 40: '10', 44: '11', 48: '12', 56: '14', 64: '16', 80: '20',
  96: '24', 112: '28', 128: '32', 144: '36', 160: '40', 176: '44',
  192: '48', 208: '52', 224: '56', 240: '60', 256: '64', 288: '72',
  320: '80', 384: '96',
};

/** Grid column translation for Tailwind */
function translateGridCols(css: string): string | null {
  const match = css.match(/^grid-template-columns:\s*repeat\((\d+),\s*1fr\)$/);
  if (match) return `grid-cols-${match[1]}`;
  return null;
}

/** Translate a gap value like "gap: 16px" to Tailwind "gap-4" */
function translateGap(css: string): string | null {
  const match = css.match(/^gap:\s*(\d+)px$/);
  if (match) {
    const px = parseInt(match[1], 10);
    const tw = SPACING_SCALE[px];
    return tw ? `gap-${tw}` : `gap-[${px}px]`;
  }
  return null;
}

/** Translate padding/margin like "padding: 16px" to Tailwind "p-4" */
function translateSpacing(css: string): string | null {
  const match = css.match(/^(padding|margin):\s*(\d+)px$/);
  if (match) {
    const prefix = match[1] === 'padding' ? 'p' : 'm';
    const px = parseInt(match[2], 10);
    const tw = SPACING_SCALE[px];
    return tw ? `${prefix}-${tw}` : `${prefix}-[${px}px]`;
  }
  return null;
}

export function translate(cssDeclaration: string, target: LanguageAdapter): string {
  if (target === 'css') return cssDeclaration;

  // Check exact matches first
  const entry = TRANSLATIONS.find((t) => t.css === cssDeclaration);
  if (entry) return entry[target];

  if (target === 'tailwind') {
    const grid = translateGridCols(cssDeclaration);
    if (grid) return grid;
    const gap = translateGap(cssDeclaration);
    if (gap) return gap;
    const spacing = translateSpacing(cssDeclaration);
    if (spacing) return spacing;
  }

  if (target === 'figma') {
    // Gap → Item spacing for Figma
    const gapMatch = cssDeclaration.match(/^gap:\s*(\d+)px$/);
    if (gapMatch) return `Item spacing: ${gapMatch[1]}`;

    const gridMatch = cssDeclaration.match(/^grid-template-columns:\s*repeat\((\d+),\s*1fr\)$/);
    if (gridMatch) return `${gridMatch[1]}-column grid`;
  }

  // Fallback: return raw CSS
  return cssDeclaration;
}

/**
 * Get dropdown options for a property in the active language.
 * Used by prompt builder dropdowns.
 */
export function getDropdownOptions(language: LanguageAdapter): { label: string; css: string }[] {
  return TRANSLATIONS.map((t) => ({
    label: t[language],
    css: t.css,
  }));
}
```

**Test:** `packages/extension/src/services/__tests__/languageAdapters.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { translate, getDropdownOptions } from '../languageAdapters';

describe('languageAdapters', () => {
  it('translates CSS to Tailwind', () => {
    expect(translate('display: flex', 'tailwind')).toBe('flex');
    expect(translate('flex: 1', 'tailwind')).toBe('flex-1');
    expect(translate('gap: 16px', 'tailwind')).toBe('gap-4');
    expect(translate('gap: 24px', 'tailwind')).toBe('gap-6');
    expect(translate('padding: 32px', 'tailwind')).toBe('p-8');
  });

  it('translates CSS to Figma', () => {
    expect(translate('display: flex', 'figma')).toBe('Auto layout');
    expect(translate('flex: 1', 'figma')).toBe('Fill container');
    expect(translate('width: fit-content', 'figma')).toBe('Hug contents');
    expect(translate('gap: 16px', 'figma')).toBe('Item spacing: 16');
  });

  it('translates grid columns', () => {
    expect(translate('grid-template-columns: repeat(3, 1fr)', 'tailwind')).toBe('grid-cols-3');
    expect(translate('grid-template-columns: repeat(3, 1fr)', 'figma')).toBe('3-column grid');
  });

  it('returns raw CSS for unknown declarations', () => {
    expect(translate('z-index: 50', 'tailwind')).toBe('z-index: 50');
  });

  it('CSS adapter is identity', () => {
    expect(translate('display: flex', 'css')).toBe('display: flex');
  });

  it('generates dropdown options', () => {
    const opts = getDropdownOptions('tailwind');
    expect(opts.length).toBeGreaterThan(0);
    expect(opts.find((o) => o.label === 'flex')).toBeDefined();
  });

  it('handles arbitrary gap with bracket notation', () => {
    expect(translate('gap: 13px', 'tailwind')).toBe('gap-[13px]');
  });
});
```

**Commit:** `feat(flow2): add CSS/Tailwind/Figma language adapters with tests`

---

## Task 7: Prompt Builder UI — PromptBuilderPanel component

**File:** `packages/extension/src/panel/components/PromptBuilderPanel.tsx`

```tsx
import React from 'react';
import { useAppStore } from '../stores/appStore';
import { translate, getDropdownOptions } from '../../services/languageAdapters';
import type { PromptVerb, LanguageAdapter } from '@flow/shared';

const VERBS: PromptVerb[] = ['Change', 'Add', 'Remove', 'Move', 'Apply', 'Set', 'Replace'];

export function PromptBuilderPanel() {
  const {
    promptSteps,
    activeLanguage,
    pendingSlot,
    addPromptStep,
    removePromptStep,
    updatePromptStep,
    setActiveLanguage,
    setPendingSlot,
  } = useAppStore();

  const dropdownOptions = getDropdownOptions(activeLanguage);

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-main">Prompt Builder</h2>
        <LanguageSelector active={activeLanguage} onChange={setActiveLanguage} />
      </div>

      <div className="flex flex-col gap-2">
        {promptSteps.map((step, index) => (
          <div
            key={step.id}
            className="flex items-center gap-2 rounded-md border border-line bg-inv p-2 text-sm"
          >
            <span className="text-sub font-mono text-xs w-6">{index + 1}.</span>

            {/* Verb selector */}
            <select
              value={step.verb}
              onChange={(e) => updatePromptStep(step.id, { verb: e.target.value as PromptVerb })}
              className="rounded border border-line bg-page px-2 py-1 text-main text-xs"
            >
              {VERBS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>

            {/* Target element slot */}
            <ElementSlot
              label={step.targetComponentName ? `<${step.targetComponentName}>` : 'Select element'}
              isActive={pendingSlot?.stepId === step.id && pendingSlot?.slot === 'target'}
              onClick={() => setPendingSlot({ stepId: step.id, slot: 'target' })}
              filled={!!step.targetSelector}
            />

            {/* Value dropdown */}
            {step.verb !== 'Remove' && (
              <>
                <span className="text-sub text-xs">{step.preposition || 'to'}</span>
                <select
                  value={step.value || ''}
                  onChange={(e) => updatePromptStep(step.id, { value: e.target.value })}
                  className="rounded border border-line bg-page px-2 py-1 text-main text-xs flex-1"
                >
                  <option value="">Select value...</option>
                  {dropdownOptions.map((opt) => (
                    <option key={opt.css} value={opt.label}>{opt.label}</option>
                  ))}
                </select>
              </>
            )}

            {/* Reference element slot (for Move, Apply) */}
            {(step.verb === 'Move' || step.verb === 'Apply') && (
              <ElementSlot
                label={step.referenceComponentName ? `<${step.referenceComponentName}>` : 'Select ref'}
                isActive={pendingSlot?.stepId === step.id && pendingSlot?.slot === 'reference'}
                onClick={() => setPendingSlot({ stepId: step.id, slot: 'reference' })}
                filled={!!step.referenceSelector}
              />
            )}

            <button
              onClick={() => removePromptStep(step.id)}
              className="ml-auto text-sub hover:text-main text-xs"
              aria-label="Remove step"
            >
              x
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => addPromptStep()}
        className="flex items-center gap-1 rounded border border-dashed border-line px-3 py-2 text-xs text-sub hover:text-main hover:border-main transition-colors"
      >
        + Add Step
      </button>
    </div>
  );
}

function ElementSlot({
  label,
  isActive,
  onClick,
  filled,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  filled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs font-mono border transition-colors ${
        isActive
          ? 'border-blue-500 bg-blue-500/10 text-blue-400 animate-pulse'
          : filled
            ? 'border-line bg-page text-main'
            : 'border-dashed border-line text-sub hover:border-main'
      }`}
    >
      {isActive ? 'Click element on page...' : `@ ${label}`}
    </button>
  );
}

function LanguageSelector({
  active,
  onChange,
}: {
  active: LanguageAdapter;
  onChange: (lang: LanguageAdapter) => void;
}) {
  const languages: { value: LanguageAdapter; label: string }[] = [
    { value: 'css', label: 'CSS' },
    { value: 'tailwind', label: 'Tailwind' },
    { value: 'figma', label: 'Figma' },
  ];

  return (
    <div className="flex gap-1">
      {languages.map((lang) => (
        <button
          key={lang.value}
          onClick={() => onChange(lang.value)}
          className={`rounded px-2 py-1 text-xs transition-colors ${
            active === lang.value
              ? 'bg-page text-main border border-line'
              : 'text-sub hover:text-main'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
```

**Commit:** `feat(flow2): add PromptBuilderPanel UI component`

---

## Task 8: Context Output Panel — copy prompt button and output preview

**File:** `packages/extension/src/panel/components/ContextOutputPanel.tsx`

```tsx
import React, { useCallback } from 'react';
import { useAppStore } from '../stores/appStore';

export function ContextOutputPanel() {
  const {
    compiledPrompt,
    isCompiling,
    lastCopiedAt,
    compilePrompt,
    copyToClipboard,
  } = useAppStore();

  const handleCopy = useCallback(async () => {
    await copyToClipboard();
  }, [copyToClipboard]);

  const recentlyCopied = lastCopiedAt && Date.now() - lastCopiedAt < 2000;

  // Count total items across all session data
  const annotations = useAppStore((s) => s.annotations?.length ?? 0);
  const textEdits = useAppStore((s) => s.textEdits?.length ?? 0);
  const mutationDiffs = useAppStore((s) => s.mutationDiffs?.length ?? 0);
  const designerChanges = useAppStore((s) => s.designerChanges?.length ?? 0);
  const animationDiffs = useAppStore((s) => s.animationDiffs?.length ?? 0);
  const promptSteps = useAppStore((s) => s.promptSteps?.length ?? 0);
  const totalItems = annotations + textEdits + mutationDiffs + designerChanges + animationDiffs + promptSteps;

  return (
    <div className="flex flex-col gap-2 border-t border-line p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-sub uppercase tracking-wider">
          Context Output
        </h3>
        <span className="text-xs text-sub">
          {totalItems} item{totalItems !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          disabled={totalItems === 0 || isCompiling}
          className="flex-1 rounded bg-page border border-line px-3 py-2 text-xs font-medium text-main hover:bg-inv disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isCompiling ? 'Compiling...' : recentlyCopied ? 'Copied!' : 'Copy Prompt'}
        </button>
        <button
          onClick={compilePrompt}
          disabled={totalItems === 0}
          className="rounded border border-line px-3 py-2 text-xs text-sub hover:text-main disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Preview
        </button>
      </div>

      {compiledPrompt && (
        <div className="mt-2 max-h-64 overflow-y-auto rounded border border-line bg-page p-3">
          <pre className="whitespace-pre-wrap text-xs text-main font-mono leading-relaxed">
            {compiledPrompt.markdown}
          </pre>
        </div>
      )}
    </div>
  );
}
```

**Commit:** `feat(flow2): add ContextOutputPanel with copy prompt button`

---

## Task 9: Session data slices — annotations, text edits, designer changes, animation diffs

These slices back the PromptCompiler inputs and session persistence. Text edits, designer changes, and animation diffs were missing from the original plan and are now explicitly covered here.

### 9a: Annotation slice

**File:** `packages/extension/src/panel/stores/slices/annotationSlice.ts`

```typescript
import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import type { Annotation } from '@flow/shared';
import { nanoid } from 'nanoid';

export interface AnnotationSlice {
  annotations: Annotation[];
  isAnnotationMode: boolean;

  toggleAnnotationMode: () => void;
  addAnnotation: (data: Omit<Annotation, 'id' | 'timestamp'>) => void;
  updateAnnotation: (id: string, text: string) => void;
  removeAnnotation: (id: string) => void;
  clearAnnotations: () => void;
}

export const createAnnotationSlice: StateCreator<AppState, [], [], AnnotationSlice> = (set) => ({
  annotations: [],
  isAnnotationMode: false,

  toggleAnnotationMode: () => set((s) => ({ isAnnotationMode: !s.isAnnotationMode })),

  addAnnotation: (data) => {
    const annotation: Annotation = {
      ...data,
      id: nanoid(),
      timestamp: Date.now(),
    };
    set((s) => ({ annotations: [...s.annotations, annotation] }));
  },

  updateAnnotation: (id, text) => {
    set((s) => ({
      annotations: s.annotations.map((a) => (a.id === id ? { ...a, text } : a)),
    }));
  },

  removeAnnotation: (id) => {
    set((s) => ({ annotations: s.annotations.filter((a) => a.id !== id) }));
  },

  clearAnnotations: () => set({ annotations: [] }),
});
```

### 9b: Text edits slice

**File:** `packages/extension/src/panel/stores/slices/textEditsSlice.ts`

```typescript
import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import type { TextEdit } from '@flow/shared';

export interface TextEditsSlice {
  textEdits: TextEdit[];
  addTextEdit: (data: Omit<TextEdit, 'id' | 'timestamp'>) => void;
  updateTextEdit: (id: string, updates: Partial<TextEdit>) => void;
  removeTextEdit: (id: string) => void;
  clearTextEdits: () => void;
}

export const createTextEditsSlice: StateCreator<AppState, [], [], TextEditsSlice> = (set) => ({
  textEdits: [],

  addTextEdit: (data) => {
    const edit: TextEdit = { ...data, id: crypto.randomUUID(), timestamp: Date.now() };
    set((s) => ({ textEdits: [...s.textEdits, edit] }));
  },

  updateTextEdit: (id, updates) => {
    set((s) => ({
      textEdits: s.textEdits.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  },

  removeTextEdit: (id) => {
    set((s) => ({ textEdits: s.textEdits.filter((e) => e.id !== id) }));
  },

  clearTextEdits: () => set({ textEdits: [] }),
});
```

### 9c: Designer changes slice

**File:** `packages/extension/src/panel/stores/slices/designerChangesSlice.ts`

```typescript
import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import type { DesignerChange } from '@flow/shared';

export interface DesignerChangesSlice {
  designerChanges: DesignerChange[];
  addDesignerChange: (data: Omit<DesignerChange, 'id' | 'timestamp'>) => void;
  updateDesignerChange: (id: string, updates: Partial<DesignerChange>) => void;
  removeDesignerChange: (id: string) => void;
  clearDesignerChanges: () => void;
}

export const createDesignerChangesSlice: StateCreator<AppState, [], [], DesignerChangesSlice> = (set) => ({
  designerChanges: [],

  addDesignerChange: (data) => {
    const change: DesignerChange = { ...data, id: crypto.randomUUID(), timestamp: Date.now() };
    set((s) => ({ designerChanges: [...s.designerChanges, change] }));
  },

  updateDesignerChange: (id, updates) => {
    set((s) => ({
      designerChanges: s.designerChanges.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  },

  removeDesignerChange: (id) => {
    set((s) => ({ designerChanges: s.designerChanges.filter((c) => c.id !== id) }));
  },

  clearDesignerChanges: () => set({ designerChanges: [] }),
});
```

### 9d: Animation diffs slice

**File:** `packages/extension/src/panel/stores/slices/animationDiffsSlice.ts`

```typescript
import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import type { AnimationDiff } from '@flow/shared';

export interface AnimationDiffsSlice {
  animationDiffs: AnimationDiff[];
  addAnimationDiff: (diff: AnimationDiff) => void;
  removeAnimationDiff: (id: string) => void;
  clearAnimationDiffs: () => void;
}

export const createAnimationDiffsSlice: StateCreator<AppState, [], [], AnimationDiffsSlice> = (set) => ({
  animationDiffs: [],

  addAnimationDiff: (diff) => set((s) => ({ animationDiffs: [...s.animationDiffs, diff] })),
  removeAnimationDiff: (id) =>
    set((s) => ({ animationDiffs: s.animationDiffs.filter((d) => d.id !== id) })),
  clearAnimationDiffs: () => set({ animationDiffs: [] }),
});
```

**Wiring notes:**
- `textEdits`: derive from `mutation:diff` where `diff.type === 'text'` (e.g., in `Panel.tsx` `handleMutationDiff`).
- `designerChanges`: append from Designer UI handlers (e.g., `RightPanel` sections) using selected element metadata + property changes.
- `animationDiffs`: emit from content-side `animationCapture` and forward to panel via a new message type (or sidecar push) before adding to store.

**Commit:** `feat(flow2): add session data slices for prompt compiler`

---

## Task 10: Comment mode — badge rendering in content script (Shadow DOM)

The content script renders numbered annotation badges on annotated elements.

**File:** `packages/extension/src/content/annotationBadges.ts`

```typescript
const BADGE_HOST_ID = '__flow-annotation-badges__';

interface BadgeData {
  id: string;
  selector: string;
  index: number;
  text: string;
}

let shadowRoot: ShadowRoot | null = null;

function ensureShadowHost(): ShadowRoot {
  if (shadowRoot) return shadowRoot;

  let host = document.getElementById(BADGE_HOST_ID);
  if (!host) {
    host = document.createElement('div');
    host.id = BADGE_HOST_ID;
    host.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:2147483647;';
    document.documentElement.appendChild(host);
  }
  shadowRoot = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = `
    .flow-badge {
      position: fixed;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #3b82f6;
      color: white;
      font-size: 11px;
      font-weight: 700;
      font-family: system-ui, sans-serif;
      pointer-events: auto;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      transform: translate(-50%, -100%);
      transition: transform 0.15s ease-out;
      z-index: 2147483647;
    }
    .flow-badge:hover {
      transform: translate(-50%, -100%) scale(1.2);
    }
  `;
  shadowRoot.appendChild(style);
  return shadowRoot;
}

export function renderBadges(badges: BadgeData[]): void {
  const root = ensureShadowHost();

  // Remove existing badges
  root.querySelectorAll('.flow-badge').forEach((el) => el.remove());

  for (const badge of badges) {
    const el = document.querySelector(badge.selector);
    if (!el) continue;

    const rect = el.getBoundingClientRect();
    const badgeEl = document.createElement('div');
    badgeEl.className = 'flow-badge';
    badgeEl.textContent = String(badge.index + 1);
    badgeEl.title = badge.text;
    badgeEl.style.left = `${rect.right}px`;
    badgeEl.style.top = `${rect.top}px`;
    badgeEl.dataset.annotationId = badge.id;

    root.appendChild(badgeEl);
  }
}

export function clearBadges(): void {
  if (shadowRoot) {
    shadowRoot.querySelectorAll('.flow-badge').forEach((el) => el.remove());
  }
}

/** Call on scroll/resize to reposition badges */
export function repositionBadges(badges: BadgeData[]): void {
  if (!shadowRoot) return;
  for (const badge of badges) {
    const el = document.querySelector(badge.selector);
    const badgeEl = shadowRoot.querySelector(`[data-annotation-id="${badge.id}"]`) as HTMLElement;
    if (!el || !badgeEl) continue;
    const rect = el.getBoundingClientRect();
    badgeEl.style.left = `${rect.right}px`;
    badgeEl.style.top = `${rect.top}px`;
  }
}
```

**Commit:** `feat(flow2): add Shadow DOM annotation badge rendering in content script`

---

## Task 11: Wire annotation mode — content script click handler + message passing

When annotation mode is active, clicking an element in the content script sends its identity to the panel, which opens an input for the annotation text.

**File:** `packages/extension/src/content/annotationHandler.ts`

```typescript
import type { Annotation } from '@flow/shared';
import { renderBadges, clearBadges, repositionBadges } from './annotationBadges';

let isActive = false;
let port: chrome.runtime.Port | null = null;
let currentBadges: { id: string; selector: string; index: number; text: string }[] = [];

function handleClick(e: MouseEvent) {
  if (!isActive) return;
  e.preventDefault();
  e.stopPropagation();

  const target = e.target as HTMLElement;
  // Build a reasonable CSS selector for the element
  const selector = buildSelector(target);

  // Request component identity from agent script
  window.postMessage(
    { source: 'flow-content', type: 'resolve-element', selector },
    window.location.origin,
  );

  // Notify panel that an element was clicked for annotation
  port?.postMessage({
    type: 'annotation-element-selected',
    payload: { selector, tagName: target.tagName.toLowerCase() },
  });
}

function buildSelector(el: HTMLElement): string {
  if (el.id) return `#${el.id}`;
  const classes = Array.from(el.classList).slice(0, 2).join('.');
  const tag = el.tagName.toLowerCase();
  return classes ? `${tag}.${classes}` : tag;
}

export function activateAnnotationMode(connectionPort: chrome.runtime.Port) {
  isActive = true;
  port = connectionPort;
  document.addEventListener('click', handleClick, true);
  document.body.style.cursor = 'crosshair';
}

export function deactivateAnnotationMode() {
  isActive = false;
  document.removeEventListener('click', handleClick, true);
  document.body.style.cursor = '';
}

export function updateBadges(annotations: Annotation[]) {
  currentBadges = annotations.map((a, i) => ({
    id: a.id,
    selector: a.selector,
    index: i,
    text: a.text,
  }));
  renderBadges(currentBadges);
}

// Reposition on scroll/resize
let rafId: number | null = null;
function onScrollOrResize() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    repositionBadges(currentBadges);
  });
}

window.addEventListener('scroll', onScrollOrResize, { passive: true });
window.addEventListener('resize', onScrollOrResize, { passive: true });
```

**Commit:** `feat(flow2): wire annotation click handler with message passing`

---

## Task 12: MCP output — get_mutation_diffs returns compiled context

Extend the sidecar's `get_mutation_diffs` MCP tool to return the full compiled prompt from the extension's session.

**File:** `packages/server/src/tools/getMutationDiffs.ts`

```typescript
import type { McpTool } from '../types';

/**
 * MCP tool: get_mutation_diffs
 * Returns all accumulated visual changes from the current browser session,
 * compiled into structured actionable instructions (spec section 12.2).
 *
 * The sidecar receives compiled prompt data from the extension via WebSocket.
 * This tool returns the latest compiled state.
 */
export const getMutationDiffs: McpTool = {
  name: 'get_mutation_diffs',
  description:
    'Returns all accumulated visual changes from the current Flow session, structured as source-resolved instructions for an LLM.',
  parameters: {
    type: 'object',
    properties: {
      tabId: {
        type: 'number',
        description: 'Browser tab ID to get diffs from. Omit for the most recently active tab.',
      },
      format: {
        type: 'string',
        enum: ['markdown', 'json'],
        description: 'Output format. Default: markdown.',
      },
    },
  },
  handler: async (params, context) => {
    const tabId = params.tabId ?? context.activeTabId;
    const sessionData = context.sessionStore.get(tabId);

    if (!sessionData) {
      return { content: [{ type: 'text', text: 'No active Flow session found for this tab.' }] };
    }

    const format = params.format ?? 'markdown';

    if (format === 'json') {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                annotations: sessionData.annotations,
                textEdits: sessionData.textEdits,
                mutationDiffs: sessionData.mutationDiffs,
                designerChanges: sessionData.designerChanges,
                animationDiffs: sessionData.animationDiffs,
                promptSteps: sessionData.promptSteps,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    // Markdown format — use the compiled prompt from the extension
    return {
      content: [
        {
          type: 'text',
          text: sessionData.compiledMarkdown || 'No changes accumulated in this session yet.',
        },
      ],
    };
  },
};
```

**File:** `packages/server/src/websocket/sessionSync.ts`

```typescript
/**
 * WebSocket handler for receiving compiled session data from the extension.
 * The extension pushes updated session state whenever the user compiles or
 * when data changes.
 */
import type { WebSocket } from 'ws';
import type { SessionStore } from '../stores/sessionStore';

export interface SessionSyncMessage {
  type: 'session-update';
  tabId: number;
  compiledMarkdown: string;
  annotations: unknown[];
  textEdits: unknown[];
  mutationDiffs: unknown[];
  designerChanges: unknown[];
  animationDiffs: unknown[];
  promptSteps: unknown[];
}

export function handleSessionSync(ws: WebSocket, sessionStore: SessionStore) {
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString()) as SessionSyncMessage;
      if (msg.type === 'session-update') {
        sessionStore.set(msg.tabId, {
          compiledMarkdown: msg.compiledMarkdown,
          annotations: msg.annotations,
          textEdits: msg.textEdits,
          mutationDiffs: msg.mutationDiffs,
          designerChanges: msg.designerChanges,
          animationDiffs: msg.animationDiffs,
          promptSteps: msg.promptSteps,
          lastUpdated: Date.now(),
        });
      }
    } catch {
      // Ignore malformed messages
    }
  });
}
```

**Commit:** `feat(flow2): implement get_mutation_diffs MCP tool with WebSocket session sync`

---

## Task 13: Session persistence — chrome.storage.session with per-tab isolation

**File:** `packages/extension/src/services/sessionPersistence.ts`

```typescript
import type { Annotation } from '@flow/shared';
import type { TextEdit } from '@flow/shared';
import type { MutationDiff } from '@flow/shared';
import type { DesignerChange } from '@flow/shared';
import type { AnimationDiff } from '@flow/shared';
import type { PromptStep, LanguageAdapter } from '@flow/shared';

export interface SessionData {
  annotations: Annotation[];
  textEdits: TextEdit[];
  mutationDiffs: MutationDiff[];
  designerChanges: DesignerChange[];
  animationDiffs: AnimationDiff[];
  promptSteps: PromptStep[];
  activeLanguage: LanguageAdapter;
  savedAt: number;
}

function sessionKey(tabId: number): string {
  return `flow-session-${tabId}`;
}

/**
 * Save session to chrome.storage.session (survives panel close, cleared on browser restart).
 */
export async function saveSession(tabId: number, data: SessionData): Promise<void> {
  const key = sessionKey(tabId);
  await chrome.storage.session.set({ [key]: data });
}

/**
 * Load session from chrome.storage.session.
 */
export async function loadSession(tabId: number): Promise<SessionData | null> {
  const key = sessionKey(tabId);
  const result = await chrome.storage.session.get(key);
  return result[key] ?? null;
}

/**
 * Clear session for a tab.
 */
export async function clearSession(tabId: number): Promise<void> {
  const key = sessionKey(tabId);
  await chrome.storage.session.remove(key);
}

/**
 * Save session to chrome.storage.local (persists across browser restarts).
 * User opt-in only.
 */
export async function saveSessionLocal(tabId: number, data: SessionData): Promise<void> {
  const key = `flow-local-${tabId}`;
  await chrome.storage.local.set({ [key]: data });
}

/**
 * Load session from chrome.storage.local.
 */
export async function loadSessionLocal(tabId: number): Promise<SessionData | null> {
  const key = `flow-local-${tabId}`;
  const result = await chrome.storage.local.get(key);
  return result[key] ?? null;
}

/**
 * Auto-save middleware for Zustand. Call in a store subscriber.
 */
export function createAutoSaver(tabId: number, debounceMs = 1000) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (data: SessionData) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      saveSession(tabId, data);
    }, debounceMs);
  };
}
```

**Commit:** `feat(flow2): add session persistence via chrome.storage with per-tab isolation`

---

## Task 14: Export/import session state as JSON

**File:** `packages/extension/src/services/sessionExport.ts`

```typescript
import type { SessionData } from './sessionPersistence';

const EXPORT_VERSION = 1;

export interface ExportedSession {
  version: number;
  exportedAt: string;
  tabUrl: string;
  data: SessionData;
}

export function exportSession(tabUrl: string, data: SessionData): string {
  const exported: ExportedSession = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    tabUrl,
    data,
  };
  return JSON.stringify(exported, null, 2);
}

export function importSession(json: string): { data: SessionData; tabUrl: string } {
  const parsed = JSON.parse(json) as ExportedSession;

  if (!parsed.version || parsed.version > EXPORT_VERSION) {
    throw new Error(`Unsupported session export version: ${parsed.version}`);
  }
  if (!parsed.data || !Array.isArray(parsed.data.annotations)) {
    throw new Error('Invalid session export format');
  }

  return { data: parsed.data, tabUrl: parsed.tabUrl };
}

/**
 * Trigger a file download of the session JSON in the browser.
 */
export function downloadSession(tabUrl: string, data: SessionData): void {
  const json = exportSession(tabUrl, data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flow-session-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Open a file picker and import a session JSON.
 */
export function openImportDialog(): Promise<{ data: SessionData; tabUrl: string }> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('No file selected'));
      const text = await file.text();
      try {
        resolve(importSession(text));
      } catch (e) {
        reject(e);
      }
    };
    input.click();
  });
}
```

**Test:** `packages/extension/src/services/__tests__/sessionExport.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { exportSession, importSession } from '../sessionExport';
import type { SessionData } from '../sessionPersistence';

const mockSession: SessionData = {
  annotations: [{ id: '1', selector: '.a', text: 'test', timestamp: 0 }],
  textEdits: [],
  mutationDiffs: [],
  designerChanges: [],
  animationDiffs: [],
  promptSteps: [],
  activeLanguage: 'css',
  savedAt: Date.now(),
};

describe('sessionExport', () => {
  it('roundtrips export/import', () => {
    const json = exportSession('http://localhost:3000', mockSession);
    const result = importSession(json);
    expect(result.tabUrl).toBe('http://localhost:3000');
    expect(result.data.annotations).toHaveLength(1);
    expect(result.data.annotations[0].text).toBe('test');
  });

  it('rejects invalid format', () => {
    expect(() => importSession('{}')).toThrow('Invalid session export format');
  });

  it('rejects future versions', () => {
    const json = JSON.stringify({ version: 999, data: { annotations: [] } });
    expect(() => importSession(json)).toThrow('Unsupported session export version');
  });
});
```

**Commit:** `feat(flow2): add session export/import as JSON`

---

## Task 15: Clipboard output integration — wire "Copy Prompt" end-to-end

Connect the ContextOutputPanel's copy button to the full compilation pipeline. Ensure the store subscriber auto-compiles when data changes.

**File:** `packages/extension/src/panel/hooks/usePromptAutoCompile.ts`

```typescript
import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

/**
 * Auto-recompile the prompt whenever any source data changes.
 * Debounced to avoid thrashing on rapid edits.
 */
export function usePromptAutoCompile() {
  const annotations = useAppStore((s) => s.annotations);
  const textEdits = useAppStore((s) => s.textEdits);
  const mutationDiffs = useAppStore((s) => s.mutationDiffs);
  const designerChanges = useAppStore((s) => s.designerChanges);
  const animationDiffs = useAppStore((s) => s.animationDiffs);
  const promptSteps = useAppStore((s) => s.promptSteps);
  const compilePrompt = useAppStore((s) => s.compilePrompt);

  useEffect(() => {
    const totalItems =
      (annotations?.length ?? 0) +
      (textEdits?.length ?? 0) +
      (mutationDiffs?.length ?? 0) +
      (designerChanges?.length ?? 0) +
      (animationDiffs?.length ?? 0) +
      (promptSteps?.length ?? 0);

    if (totalItems === 0) return;

    const timer = setTimeout(() => {
      compilePrompt();
    }, 300);

    return () => clearTimeout(timer);
  }, [annotations, textEdits, mutationDiffs, designerChanges, animationDiffs, promptSteps, compilePrompt]);
}
```

**File:** `packages/extension/src/panel/hooks/useSessionAutoSave.ts`

```typescript
import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { createAutoSaver } from '../../services/sessionPersistence';
import type { SessionData } from '../../services/sessionPersistence';

/**
 * Auto-save session to chrome.storage.session whenever data changes.
 */
export function useSessionAutoSave(tabId: number) {
  const annotations = useAppStore((s) => s.annotations);
  const textEdits = useAppStore((s) => s.textEdits);
  const mutationDiffs = useAppStore((s) => s.mutationDiffs);
  const designerChanges = useAppStore((s) => s.designerChanges);
  const animationDiffs = useAppStore((s) => s.animationDiffs);
  const promptSteps = useAppStore((s) => s.promptSteps);
  const activeLanguage = useAppStore((s) => s.activeLanguage);

  useEffect(() => {
    const autoSave = createAutoSaver(tabId);
    const data: SessionData = {
      annotations: annotations ?? [],
      textEdits: textEdits ?? [],
      mutationDiffs: mutationDiffs ?? [],
      designerChanges: designerChanges ?? [],
      animationDiffs: animationDiffs ?? [],
      promptSteps: promptSteps ?? [],
      activeLanguage: activeLanguage ?? 'css',
      savedAt: Date.now(),
    };
    autoSave(data);
  }, [tabId, annotations, textEdits, mutationDiffs, designerChanges, animationDiffs, promptSteps, activeLanguage]);
}
```

**Commit:** `feat(flow2): wire auto-compile and auto-save hooks for prompt output`

---

## Task 16: Push compiled session to sidecar via WebSocket

When the prompt is compiled, push it to the sidecar so MCP clients can access it via `get_mutation_diffs`.

**File:** `packages/extension/src/services/sidecarSync.ts`

```typescript
let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

const SIDECAR_WS_URL = 'ws://localhost:3737/__flow/ws';

export function connectToSidecar(): void {
  if (ws?.readyState === WebSocket.OPEN) return;

  try {
    ws = new WebSocket(SIDECAR_WS_URL);

    ws.onclose = () => {
      ws = null;
      // Reconnect after 5s
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connectToSidecar, 5000);
    };

    ws.onerror = () => {
      ws?.close();
    };
  } catch {
    // Sidecar not running — this is normal in extension-only mode
  }
}

export function pushSessionToSidecar(
  tabId: number,
  compiledMarkdown: string,
  sessionData: {
    annotations: unknown[];
    textEdits: unknown[];
    mutationDiffs: unknown[];
    designerChanges: unknown[];
    animationDiffs: unknown[];
    promptSteps: unknown[];
  },
): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  ws.send(
    JSON.stringify({
      type: 'session-update',
      tabId,
      compiledMarkdown,
      ...sessionData,
    }),
  );
}

export function disconnectFromSidecar(): void {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  ws?.close();
  ws = null;
}
```

**Commit:** `feat(flow2): add sidecar WebSocket sync for MCP session delivery`

---

## Task 17: Session restore on panel open

**Status:** Completed (Batch 6)

When the DevTools panel opens, restore session from `chrome.storage.session`.

**File:** `packages/extension/src/panel/hooks/useSessionRestore.ts`

```typescript
import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { loadSession } from '../../services/sessionPersistence';

export function useSessionRestore(tabId: number) {
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    if (restored) return;

    loadSession(tabId).then((data) => {
      if (!data) {
        setRestored(true);
        return;
      }

      const store = useAppStore.getState();
      // Restore each slice's data
      // This assumes each slice exposes its array on the store directly
      useAppStore.setState({
        annotations: data.annotations,
        textEdits: data.textEdits,
        mutationDiffs: data.mutationDiffs,
        designerChanges: data.designerChanges,
        animationDiffs: data.animationDiffs,
        promptSteps: data.promptSteps,
        activeLanguage: data.activeLanguage,
      });

      setRestored(true);
    });
  }, [tabId, restored]);

  return restored;
}
```

**Commit:** `feat(flow2): restore session from chrome.storage on panel open`

---

## Task 18: Register session data slices in appStore + wire to content script

**Status:** Completed (Batch 6 — slices were already registered in Batch 4; annotation-element-selected handler wired in Panel.tsx)

Add the session data slices to the store and set up the content script message handler that triggers `addAnnotation` when the user submits annotation text.

Edit `packages/extension/src/panel/stores/appStore.ts` and `packages/extension/src/panel/stores/types.ts` to include:

```typescript
import { createAnnotationSlice } from './slices/annotationSlice';
import { createTextEditsSlice } from './slices/textEditsSlice';
import { createDesignerChangesSlice } from './slices/designerChangesSlice';
import { createAnimationDiffsSlice } from './slices/animationDiffsSlice';
import type { AnnotationSlice } from './slices/annotationSlice';
import type { TextEditsSlice } from './slices/textEditsSlice';
import type { DesignerChangesSlice } from './slices/designerChangesSlice';
import type { AnimationDiffsSlice } from './slices/animationDiffsSlice';

// Add to AppState interface in stores/types.ts
export interface AppState
  extends /* ...existing... */,
    AnnotationSlice,
    TextEditsSlice,
    DesignerChangesSlice,
    AnimationDiffsSlice {}

// Add to create() call in stores/appStore.ts
...createAnnotationSlice(...args),
...createTextEditsSlice(...args),
...createDesignerChangesSlice(...args),
...createAnimationDiffsSlice(...args),
```

Add message handler in the panel's message listener (currently `packages/extension/src/entrypoints/panel/Panel.tsx` inside the `onContentMessage` switch):

```typescript
// When content script reports an element selected for annotation:
case 'annotation-element-selected': {
  const { selector, tagName } = msg.payload;
  // Show annotation input in panel UI (e.g., set a pending annotation state)
  useAppStore.getState().setPendingAnnotationElement({ selector, tagName });
  break;
}
```

**Commit:** `feat(flow2): register annotationSlice and wire content script messages`

---

## Task 19: Run all tests, verify compilation

**Status:** Completed (Batch 6 — 39 test files, 219 tests passing, zero TypeScript errors)

```bash
cd packages/extension && pnpm test
cd packages/shared && pnpm typecheck
cd packages/server && pnpm typecheck
```

Verify:
- `promptCompiler.test.ts` passes (5+ test cases)
- `languageAdapters.test.ts` passes (7+ test cases)
- `sessionExport.test.ts` passes (3 test cases)
- TypeScript compiles with no errors across all packages

**Commit:** `test(flow2): verify all phase 6 tests pass`

---

## Task 20: Final integration test — end-to-end prompt compilation

**Status:** Completed (Batch 6 — manual checklist documented below, ready for manual verification)

Manual verification checklist (no automated test — requires browser extension context):

1. Open DevTools panel on a React page
2. Add 2 annotations via comment mode -> badges render on page
3. Make 1 text edit -> live DOM update
4. Make 1 designer change (e.g., padding) -> live DOM update
5. Add 2 prompt builder steps with element slots filled
6. Switch language adapter to Tailwind -> verify dropdown labels change
7. Click "Preview" -> compiled markdown appears in output panel
8. Click "Copy Prompt" -> paste into text editor -> verify all 6 items present with source refs
9. Close and reopen panel -> session data persists
10. Export session -> import into fresh tab -> data restored
11. If sidecar running: verify `get_mutation_diffs()` returns compiled markdown

**Commit:** `docs(flow2): add phase 6 integration test checklist`
