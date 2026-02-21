/**
 * Background Compiler
 *
 * Debounced prompt compilation + push to sidecar.
 * Runs in the background service worker context.
 */

import { PromptCompiler } from '../services/promptCompiler.js';
import { getSession, markClean } from './backgroundSessionStore.js';
import type { SidecarClient } from './sidecar-client.js';

const compiler = new PromptCompiler();
const debounceTimers = new Map<number, ReturnType<typeof setTimeout>>();
const DEBOUNCE_MS = 300;

export function scheduleCompileAndPush(tabId: number, sidecar: SidecarClient): void {
  // Clear existing debounce for this tab
  const existing = debounceTimers.get(tabId);
  if (existing) clearTimeout(existing);

  debounceTimers.set(
    tabId,
    setTimeout(() => {
      debounceTimers.delete(tabId);
      compileAndPush(tabId, sidecar);
    }, DEBOUNCE_MS),
  );
}

function compileAndPush(tabId: number, sidecar: SidecarClient): void {
  const session = getSession(tabId);
  if (!session || !session.dirty) return;
  if (!sidecar.connected) return;

  const compiled = compiler.compile({
    annotations: session.annotations,
    textEdits: session.textEdits,
    mutationDiffs: session.mutationDiffs,
    animationDiffs: session.animationDiffs,
    promptDraft: session.promptDraft,
    promptSteps: session.promptSteps,
    comments: session.comments,
  });

  compiled.metadata.tabId = tabId;

  sidecar.pushSessionUpdate(tabId, compiled.markdown, {
    annotations: session.annotations,
    textEdits: session.textEdits,
    mutationDiffs: session.mutationDiffs,
    animationDiffs: session.animationDiffs,
    promptDraft: session.promptDraft,
    promptSteps: session.promptSteps,
    comments: session.comments,
  });

  markClean(tabId);
}
