import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import type { PromptStep, PromptVerb, LanguageAdapter } from '@flow/shared';

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
