import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import type {
  PromptStep,
  PromptVerb,
  LanguageAdapter,
  PromptDraftNode,
  PromptChip,
} from '@flow/shared';

export interface PromptBuilderSlice {
  promptSteps: PromptStep[];
  promptDraft: PromptDraftNode[];
  activeLanguage: LanguageAdapter;
  /** Which step + slot is awaiting an element click on the page */
  pendingSlot: { stepId: string; slot: 'target' | 'reference' } | null;

  setPromptDraft: (nodes: PromptDraftNode[]) => void;
  insertPromptDraftText: (text: string, index?: number) => void;
  updatePromptDraftText: (nodeId: string, text: string) => void;
  insertPromptDraftChip: (chip: Omit<PromptChip, 'id'> & { id?: string }, index?: number) => void;
  removePromptDraftNode: (nodeId: string) => void;
  clearPromptDraft: () => void;

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

function getClampedInsertIndex(nodes: PromptDraftNode[], index?: number): number {
  if (typeof index !== 'number' || Number.isNaN(index)) return nodes.length;
  return Math.max(0, Math.min(index, nodes.length));
}

export const createPromptBuilderSlice: StateCreator<AppState, [], [], PromptBuilderSlice> = (set, get) => ({
  promptSteps: [],
  promptDraft: [],
  activeLanguage: 'css',
  pendingSlot: null,

  setPromptDraft: (nodes) => {
    set({ promptDraft: [...nodes] });
  },

  insertPromptDraftText: (text, index) => {
    set((s) => {
      const node: PromptDraftNode = {
        id: crypto.randomUUID(),
        type: 'text',
        text,
      };
      const next = [...s.promptDraft];
      const insertIndex = getClampedInsertIndex(next, index);
      next.splice(insertIndex, 0, node);
      return { promptDraft: next };
    });
  },

  updatePromptDraftText: (nodeId, text) => {
    set((s) => ({
      promptDraft: s.promptDraft.map((node) => {
        if (node.id !== nodeId || node.type !== 'text') return node;
        return { ...node, text };
      }),
    }));
  },

  insertPromptDraftChip: (chip, index) => {
    set((s) => {
      const chipId = chip.id ?? crypto.randomUUID();
      const node: PromptDraftNode = {
        id: crypto.randomUUID(),
        type: 'chip',
        chip: {
          ...chip,
          id: chipId,
        },
      };
      const next = [...s.promptDraft];
      const insertIndex = getClampedInsertIndex(next, index);
      next.splice(insertIndex, 0, node);
      return { promptDraft: next };
    });
  },

  removePromptDraftNode: (nodeId) => {
    set((s) => ({
      promptDraft: s.promptDraft.filter((node) => node.id !== nodeId),
    }));
  },

  clearPromptDraft: () => set({ promptDraft: [] }),

  addPromptStep: (verb = 'Change') => {
    const step: PromptStep = {
      id: crypto.randomUUID(),
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
