import { useEffect, useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { createAutoSaver } from '../../services/sessionPersistence';
import type { SessionData } from '../../services/sessionPersistence';

/**
 * Auto-save session to chrome.storage.session whenever data changes.
 */
export function useSessionAutoSave(tabId: number) {
  const textEdits = useAppStore((s) => s.textEdits);
  const mutationDiffs = useAppStore((s) => s.mutationDiffs);
  const animationDiffs = useAppStore((s) => s.animationDiffs);
  const promptDraft = useAppStore((s) => s.promptDraft);
  const promptSteps = useAppStore((s) => s.promptSteps);
  const comments = useAppStore((s) => s.comments);
  const activeLanguage = useAppStore((s) => s.activeLanguage);

  // Hoist auto-saver into ref so debounce closure is preserved across renders
  const autoSaveRef = useRef<ReturnType<typeof createAutoSaver> | null>(null);
  const tabIdRef = useRef(tabId);

  if (!autoSaveRef.current || tabIdRef.current !== tabId) {
    autoSaveRef.current = createAutoSaver(tabId);
    tabIdRef.current = tabId;
  }

  useEffect(() => {
    const data: SessionData = {
      textEdits: textEdits ?? [],
      mutationDiffs: mutationDiffs ?? [],
      animationDiffs: animationDiffs ?? [],
      promptDraft: promptDraft ?? [],
      promptSteps: promptSteps ?? [],
      comments: comments ?? [],
      activeLanguage: activeLanguage ?? 'css',
      savedAt: Date.now(),
    };
    autoSaveRef.current!(data);
  }, [textEdits, mutationDiffs, animationDiffs, promptDraft, promptSteps, comments, activeLanguage]);
}
