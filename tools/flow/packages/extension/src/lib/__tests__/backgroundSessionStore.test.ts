import { describe, it, expect, beforeEach } from 'vitest';
import {
  getOrCreateSession,
  getSession,
  clearSession,
  addComment,
  updateComment,
  updateSessionFromPanelSync,
  markClean,
  getActiveTabIds,
} from '../backgroundSessionStore';
import type { Feedback } from '@flow/shared';

function makeFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: crypto.randomUUID(),
    type: 'comment',
    elementSelector: '.btn',
    componentName: 'Button',
    devflowId: null,
    source: null,
    content: 'Test comment',
    coordinates: { x: 0, y: 0 },
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('backgroundSessionStore', () => {
  beforeEach(() => {
    // Clear all sessions between tests
    for (const id of getActiveTabIds()) {
      clearSession(id);
    }
  });

  it('creates empty session on first access', () => {
    const session = getOrCreateSession(1);
    expect(session.tabId).toBe(1);
    expect(session.comments).toEqual([]);
    expect(session.dirty).toBe(false);
  });

  it('returns same session on repeated access', () => {
    const a = getOrCreateSession(1);
    const b = getOrCreateSession(1);
    expect(a).toBe(b);
  });

  it('getSession returns undefined for unknown tab', () => {
    expect(getSession(999)).toBeUndefined();
  });

  it('clearSession removes session', () => {
    getOrCreateSession(1);
    clearSession(1);
    expect(getSession(1)).toBeUndefined();
  });

  it('addComment deduplicates by id', () => {
    const comment = makeFeedback({ id: 'c1' });
    addComment(1, comment);
    addComment(1, comment);
    const session = getOrCreateSession(1);
    expect(session.comments).toHaveLength(1);
    expect(session.dirty).toBe(true);
  });

  it('addComment creates session if needed', () => {
    const comment = makeFeedback({ id: 'c1' });
    addComment(42, comment);
    expect(getSession(42)).toBeDefined();
    expect(getSession(42)!.comments).toHaveLength(1);
  });

  it('updateComment modifies content', () => {
    const comment = makeFeedback({ id: 'c1', content: 'original' });
    addComment(1, comment);
    updateComment(1, 'c1', 'updated');
    expect(getSession(1)!.comments[0].content).toBe('updated');
  });

  it('updateComment is a no-op for unknown tab', () => {
    updateComment(999, 'c1', 'updated');
    expect(getSession(999)).toBeUndefined();
  });

  it('updateSessionFromPanelSync bulk-replaces data and marks dirty', () => {
    getOrCreateSession(1);
    updateSessionFromPanelSync(1, {
      comments: [makeFeedback({ id: 'c1' })],
    });
    const session = getSession(1)!;
    expect(session.comments).toHaveLength(1);
    expect(session.dirty).toBe(true);
  });

  it('markClean sets dirty to false', () => {
    addComment(1, makeFeedback());
    expect(getSession(1)!.dirty).toBe(true);
    markClean(1);
    expect(getSession(1)!.dirty).toBe(false);
  });

  it('getActiveTabIds returns all tab ids', () => {
    getOrCreateSession(1);
    getOrCreateSession(2);
    getOrCreateSession(3);
    expect(getActiveTabIds().sort()).toEqual([1, 2, 3]);
  });
});
