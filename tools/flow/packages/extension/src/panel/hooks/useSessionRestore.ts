import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { loadSession } from '../../services/sessionPersistence';

/**
 * Restore session from chrome.storage.session on panel open.
 * Returns true once restoration is complete (or if no saved session exists).
 */
export function useSessionRestore(tabId: number) {
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    if (restored) return;

    loadSession(tabId).then((data) => {
      if (!data) {
        setRestored(true);
        return;
      }

      useAppStore.setState({
        annotations: data.annotations,
        textEdits: data.textEdits,
        mutationDiffs: data.mutationDiffs,
        animationDiffs: data.animationDiffs,
        promptDraft: data.promptDraft ?? [],
        promptSteps: data.promptSteps,
        comments: data.comments ?? [],
        activeLanguage: data.activeLanguage,
      });

      setRestored(true);
    });
  }, [tabId, restored]);

  return restored;
}
