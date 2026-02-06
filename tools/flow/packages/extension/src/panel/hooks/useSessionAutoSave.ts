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
