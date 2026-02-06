import type { Annotation } from '@flow/shared';
import type { TextEdit } from '@flow/shared';
import type { MutationDiff } from '@flow/shared';
import type { DesignerChange } from '@flow/shared';
import type { AnimationDiff } from '@flow/shared';
import type { PromptStep, LanguageAdapter } from '@flow/shared';

export interface SessionData {
  annotations: Annotation[];
  textEdits: TextEdit[];
  mutationDiffs: MutationDiff[];
  designerChanges: DesignerChange[];
  animationDiffs: AnimationDiff[];
  promptSteps: PromptStep[];
  activeLanguage: LanguageAdapter;
  savedAt: number;
}

function sessionKey(tabId: number): string {
  return `flow-session-${tabId}`;
}

/**
 * Save session to chrome.storage.session (survives panel close, cleared on browser restart).
 */
export async function saveSession(tabId: number, data: SessionData): Promise<void> {
  const key = sessionKey(tabId);
  await chrome.storage.session.set({ [key]: data });
}

/**
 * Load session from chrome.storage.session.
 */
export async function loadSession(tabId: number): Promise<SessionData | null> {
  const key = sessionKey(tabId);
  const result = await chrome.storage.session.get(key);
  return result[key] ?? null;
}

/**
 * Clear session for a tab.
 */
export async function clearSession(tabId: number): Promise<void> {
  const key = sessionKey(tabId);
  await chrome.storage.session.remove(key);
}

/**
 * Save session to chrome.storage.local (persists across browser restarts).
 * User opt-in only.
 */
export async function saveSessionLocal(tabId: number, data: SessionData): Promise<void> {
  const key = `flow-local-${tabId}`;
  await chrome.storage.local.set({ [key]: data });
}

/**
 * Load session from chrome.storage.local.
 */
export async function loadSessionLocal(tabId: number): Promise<SessionData | null> {
  const key = `flow-local-${tabId}`;
  const result = await chrome.storage.local.get(key);
  return result[key] ?? null;
}

/**
 * Auto-save middleware for Zustand. Call in a store subscriber.
 */
export function createAutoSaver(tabId: number, debounceMs = 1000) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (data: SessionData) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      saveSession(tabId, data);
    }, debounceMs);
  };
}
