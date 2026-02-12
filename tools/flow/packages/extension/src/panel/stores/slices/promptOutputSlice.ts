import type { StateCreator } from 'zustand';
import type { AppState } from '../types';
import type { CompiledPrompt, PromptSection } from '../../../services/promptCompiler';
import { promptCompiler } from '../../../services/promptCompiler';

export type SectionType = PromptSection['type'];

const DEFAULT_SECTIONS: Record<SectionType, boolean> = {
  annotations: true,
  'text-changes': true,
  'style-mutations': true,
  'animation-changes': true,
  instructions: true,
  comments: true,
};

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

export const createPromptOutputSlice: StateCreator<AppState, [], [], PromptOutputSlice> = (set, get) => ({
  compiledPrompt: null,
  isCompiling: false,
  lastCopiedAt: null,
  enabledSections: { ...DEFAULT_SECTIONS },

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

  clearCompiledPrompt: () => {
    set({ compiledPrompt: null, lastCopiedAt: null });
  },

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
