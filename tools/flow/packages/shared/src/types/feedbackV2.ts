/**
 * FeedbackV2 — Unified feedback record that replaces the competing
 * Feedback (human) and AgentFeedback (agent) shapes.
 *
 * Both human comments/questions and agent feedback map into this
 * single record via adapter functions below.
 */

import type { Feedback } from './feedback';
import type { AgentFeedback, ThreadMessage } from './agentFeedback';

// Intent: superset of human FeedbackType and agent FeedbackIntent
export type FeedbackV2Intent = 'comment' | 'question' | 'issue' | 'suggestion' | 'fix' | 'approve';
export type FeedbackV2Severity = 'low' | 'medium' | 'high';
export type FeedbackV2Status = 'open' | 'acknowledged' | 'dismissed' | 'resolved';
export type FeedbackV2Author = 'human' | 'agent';

export interface FeedbackV2 {
  id: string;
  threadId: string;
  author: FeedbackV2Author;
  intent: FeedbackV2Intent;
  severity: FeedbackV2Severity;
  status: FeedbackV2Status;
  selector: string | null;
  componentName: string | null;
  content: string;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

/** Map legacy agent severity to unified severity. */
const SEVERITY_MAP: Record<string, FeedbackV2Severity> = {
  blocking: 'high',
  important: 'medium',
  suggestion: 'low',
};

/** Convert a human Feedback record to FeedbackV2. */
export function feedbackToV2(f: Feedback): FeedbackV2 {
  return {
    id: f.id,
    threadId: f.id, // human comments start their own thread
    author: 'human',
    intent: f.type, // 'comment' | 'question'
    severity: 'medium',
    status: 'open',
    selector: f.elementSelector,
    componentName: f.componentName,
    content: f.content,
    createdAt: f.timestamp,
    metadata: f.richContext ? { richContext: f.richContext } : undefined,
  };
}

/** Convert an AgentFeedback record (plus its thread) to FeedbackV2[]. */
export function agentFeedbackToV2(af: AgentFeedback): FeedbackV2[] {
  const root: FeedbackV2 = {
    id: af.id,
    threadId: af.id,
    author: 'agent',
    intent: af.intent as FeedbackV2Intent,
    severity: SEVERITY_MAP[af.severity] ?? 'medium',
    status: af.status === 'pending' ? 'open' : af.status as FeedbackV2Status,
    selector: af.selector,
    componentName: af.componentName ?? null,
    content: af.content,
    createdAt: af.timestamp,
    metadata: af.sourceFile
      ? { sourceFile: af.sourceFile, sourceLine: af.sourceLine }
      : undefined,
  };

  const replies: FeedbackV2[] = af.thread.map((msg: ThreadMessage) => ({
    id: msg.id,
    threadId: af.id,
    author: msg.role as FeedbackV2Author,
    intent: af.intent as FeedbackV2Intent,
    severity: SEVERITY_MAP[af.severity] ?? 'medium',
    status: af.status === 'pending' ? 'open' : af.status as FeedbackV2Status,
    selector: af.selector,
    componentName: af.componentName ?? null,
    content: msg.content,
    createdAt: msg.timestamp,
  }));

  return [root, ...replies];
}

/** Group FeedbackV2[] by threadId, sorted by createdAt within each thread. */
export function groupByThread(items: FeedbackV2[]): Map<string, FeedbackV2[]> {
  const threads = new Map<string, FeedbackV2[]>();
  for (const item of items) {
    const existing = threads.get(item.threadId) ?? [];
    existing.push(item);
    threads.set(item.threadId, existing);
  }
  // Sort each thread by timestamp
  for (const entries of threads.values()) {
    entries.sort((a, b) => a.createdAt - b.createdAt);
  }
  return threads;
}
