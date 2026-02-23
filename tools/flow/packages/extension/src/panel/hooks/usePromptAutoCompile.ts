import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

/**
 * Auto-recompile the prompt whenever any source data changes.
 * Debounced to avoid thrashing on rapid edits.
 */
export function usePromptAutoCompile() {
  const textEdits = useAppStore((s) => s.textEdits);
  const mutationDiffs = useAppStore((s) => s.mutationDiffs);
  const animationDiffs = useAppStore((s) => s.animationDiffs);
  const promptDraft = useAppStore((s) => s.promptDraft);
  const promptSteps = useAppStore((s) => s.promptSteps);
  const comments = useAppStore((s) => s.comments);
  const compilePrompt = useAppStore((s) => s.compilePrompt);
  const clearCompiledPrompt = useAppStore((s) => s.clearCompiledPrompt);

  useEffect(() => {
    const totalItems =
      (textEdits?.length ?? 0) +
      (mutationDiffs?.length ?? 0) +
      (animationDiffs?.length ?? 0) +
      (promptDraft?.length ?? 0) +
      (promptSteps?.length ?? 0) +
      (comments?.length ?? 0);

    if (totalItems === 0) {
      clearCompiledPrompt();
      return;
    }

    const timer = setTimeout(() => {
      compilePrompt();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    textEdits,
    mutationDiffs,
    animationDiffs,
    promptDraft,
    promptSteps,
    comments,
    compilePrompt,
    clearCompiledPrompt,
  ]);
}
