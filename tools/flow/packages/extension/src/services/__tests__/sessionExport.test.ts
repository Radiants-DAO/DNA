import { describe, it, expect } from 'vitest';
import { exportSession, importSession } from '../sessionExport';
import type { SessionData } from '../sessionPersistence';

const mockSession: SessionData = {
  textEdits: [],
  mutationDiffs: [],
  animationDiffs: [],
  promptDraft: [],
  promptSteps: [],
  comments: [],
  activeLanguage: 'css',
  savedAt: Date.now(),
};

describe('sessionExport', () => {
  it('roundtrips export/import', () => {
    const json = exportSession('http://localhost:3000', mockSession);
    const result = importSession(json);
    expect(result.tabUrl).toBe('http://localhost:3000');
    expect(result.data.textEdits).toHaveLength(0);
  });

  it('rejects invalid format', () => {
    expect(() => importSession('{}')).toThrow('Invalid session export format');
  });

  it('rejects future versions', () => {
    const json = JSON.stringify({ version: 999, data: { textEdits: [] } });
    expect(() => importSession(json)).toThrow('Unsupported session export version');
  });
});
