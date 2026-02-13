import { useEffect, useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { connectToSidecar, pushSessionToSidecar, onSidecarStatus, onAgentMessage } from '../../services/sidecarSync';

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
  const promptDraft = useAppStore((s) => s.promptDraft);
  const promptSteps = useAppStore((s) => s.promptSteps);
  const comments = useAppStore((s) => s.comments);
  const lastPushedHash = useRef<string>('');
  const panelTabId =
    typeof chrome !== 'undefined' && chrome.devtools?.inspectedWindow
      ? chrome.devtools.inspectedWindow.tabId
      : null;

  // Connect on mount and subscribe to status changes
  useEffect(() => {
    connectToSidecar(panelTabId ?? undefined);
    const unsubStatus = onSidecarStatus((status) => {
      useAppStore.getState().setSidecarStatus(status);
    });
    const unsubAgent = onAgentMessage((msg) => {
      if (panelTabId !== null && msg.payload.tabId !== panelTabId) return;

      const store = useAppStore.getState();
      switch (msg.type) {
        case 'agent-feedback':
          store.addAgentFeedback(msg.payload);
          break;
        case 'agent-resolve':
          store.resolveByAgent(msg.payload.tabId, msg.payload.targetId, msg.payload.summary);
          break;
        case 'agent-thread-reply':
          store.addThreadReply(msg.payload.tabId, msg.payload.targetId, msg.payload.message);
          break;
      }
    });
    return () => {
      unsubStatus();
      unsubAgent();
    };
  }, [panelTabId]);

  // Push when compiled prompt changes
  useEffect(() => {
    if (!compiledPrompt) return;

    const payload = {
      annotations: annotations ?? [],
      textEdits: textEdits ?? [],
      mutationDiffs: mutationDiffs ?? [],
      animationDiffs: animationDiffs ?? [],
      promptDraft: promptDraft ?? [],
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
  }, [compiledPrompt, annotations, textEdits, mutationDiffs, animationDiffs, promptDraft, promptSteps, comments]);
}
