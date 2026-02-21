/**
 * Background Session Store
 *
 * Plain Map<number, TabSession> store for the background service worker.
 * No Zustand, no React — just data accumulation for prompt compilation.
 */

import type {
  Annotation,
  TextEdit,
  MutationDiff,
  AnimationDiff,
  PromptStep,
  PromptDraftNode,
  Feedback,
} from '@flow/shared';

export interface TabSession {
  tabId: number;
  annotations: Annotation[];
  textEdits: TextEdit[];
  mutationDiffs: MutationDiff[];
  animationDiffs: AnimationDiff[];
  promptDraft: PromptDraftNode[];
  promptSteps: PromptStep[];
  comments: Feedback[];
  dirty: boolean;
}

const sessions = new Map<number, TabSession>();

function createEmpty(tabId: number): TabSession {
  return {
    tabId,
    annotations: [],
    textEdits: [],
    mutationDiffs: [],
    animationDiffs: [],
    promptDraft: [],
    promptSteps: [],
    comments: [],
    dirty: false,
  };
}

export function getOrCreateSession(tabId: number): TabSession {
  let session = sessions.get(tabId);
  if (!session) {
    session = createEmpty(tabId);
    sessions.set(tabId, session);
  }
  return session;
}

export function getSession(tabId: number): TabSession | undefined {
  return sessions.get(tabId);
}

export function clearSession(tabId: number): void {
  sessions.delete(tabId);
}

/** Add a comment, deduplicating by id. */
export function addComment(tabId: number, comment: Feedback): void {
  const session = getOrCreateSession(tabId);
  const exists = session.comments.some((c) => c.id === comment.id);
  if (!exists) {
    session.comments.push(comment);
    session.dirty = true;
  }
}

/** Update a comment's content by id. */
export function updateComment(tabId: number, commentId: string, content: string): void {
  const session = sessions.get(tabId);
  if (!session) return;
  const comment = session.comments.find((c) => c.id === commentId);
  if (comment) {
    comment.content = content;
    session.dirty = true;
  }
}

/** Bulk-replace session data from panel sync. */
export function updateSessionFromPanelSync(
  tabId: number,
  data: {
    annotations?: Annotation[];
    textEdits?: TextEdit[];
    mutationDiffs?: MutationDiff[];
    animationDiffs?: AnimationDiff[];
    promptDraft?: PromptDraftNode[];
    promptSteps?: PromptStep[];
    comments?: Feedback[];
  },
): void {
  const session = getOrCreateSession(tabId);
  if (data.annotations !== undefined) session.annotations = data.annotations;
  if (data.textEdits !== undefined) session.textEdits = data.textEdits;
  if (data.mutationDiffs !== undefined) session.mutationDiffs = data.mutationDiffs;
  if (data.animationDiffs !== undefined) session.animationDiffs = data.animationDiffs;
  if (data.promptDraft !== undefined) session.promptDraft = data.promptDraft;
  if (data.promptSteps !== undefined) session.promptSteps = data.promptSteps;
  if (data.comments !== undefined) session.comments = data.comments;
  session.dirty = true;
}

export function markClean(tabId: number): void {
  const session = sessions.get(tabId);
  if (session) session.dirty = false;
}

/** Get all active tab IDs. */
export function getActiveTabIds(): number[] {
  return [...sessions.keys()];
}
