import { useEffect, useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { connectToSidecar, pushSessionToSidecar } from '../../services/sidecarSync';

/**
 * Connects to sidecar on mount and pushes session data
 * whenever the compiled prompt changes.
 */
export function useSessionSync() {
  const compiledPrompt = useAppStore((s) => s.compiledPrompt);
  const annotations = useAppStore((s) => s.annotations);
  const textEdits = useAppStore((s) => s.textEdits);
  const mutationDiffs = useAppStore((s) => s.mutationDiffs);
  const animationDiffs = useAppStore((s) => s.animationDiffs);
  const promptSteps = useAppStore((s) => s.promptSteps);
  const comments = useAppStore((s) => s.comments);
  const lastPushedHash = useRef<string>('');

  // Connect on mount
  useEffect(() => {
    connectToSidecar();
  }, []);

  // Push when compiled prompt changes
  useEffect(() => {
    if (!compiledPrompt) return;

    const payload = {
      annotations: annotations ?? [],
      textEdits: textEdits ?? [],
      mutationDiffs: mutationDiffs ?? [],
      animationDiffs: animationDiffs ?? [],
      promptSteps: promptSteps ?? [],
      comments: comments ?? [],
    };

    // Content hash (not timestamp) to avoid duplicate pushes
    const hash = JSON.stringify({
      tabId: compiledPrompt.metadata.tabId,
      compiledMarkdown: compiledPrompt.markdown,
      payload,
    });
    if (hash === lastPushedHash.current) return;
    lastPushedHash.current = hash;

    pushSessionToSidecar(
      compiledPrompt.metadata.tabId,
      compiledPrompt.markdown,
      payload,
    );
  }, [compiledPrompt, annotations, textEdits, mutationDiffs, animationDiffs, promptSteps, comments]);
}
