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
      await navigator.clipboard.writeText(prompt.markdown);
      set({ lastCopiedAt: Date.now() });
    }
  },

  clearCompiledPrompt: () => {
    set({ compiledPrompt: null, lastCopiedAt: null });
  },
});
