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
  const comments = useAppStore((s) => s.comments);
  const compilePrompt = useAppStore((s) => s.compilePrompt);

  useEffect(() => {
    const totalItems =
      (annotations?.length ?? 0) +
      (textEdits?.length ?? 0) +
      (mutationDiffs?.length ?? 0) +
      (designerChanges?.length ?? 0) +
      (animationDiffs?.length ?? 0) +
      (promptSteps?.length ?? 0) +
      (comments?.length ?? 0);

    if (totalItems === 0) return;

    const timer = setTimeout(() => {
      compilePrompt();
    }, 300);

    return () => clearTimeout(timer);
  }, [annotations, textEdits, mutationDiffs, designerChanges, animationDiffs, promptSteps, comments, compilePrompt]);
}
