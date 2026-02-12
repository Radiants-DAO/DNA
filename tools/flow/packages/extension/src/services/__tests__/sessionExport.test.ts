import { describe, it, expect } from 'vitest';
import { exportSession, importSession } from '../sessionExport';
import type { SessionData } from '../sessionPersistence';

const mockSession: SessionData = {
  annotations: [{ id: '1', selector: '.a', text: 'test', timestamp: 0 }],
  textEdits: [],
  mutationDiffs: [],
  animationDiffs: [],
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
    expect(result.data.annotations).toHaveLength(1);
    expect(result.data.annotations[0].text).toBe('test');
  });

  it('rejects invalid format', () => {
    expect(() => importSession('{}')).toThrow('Invalid session export format');
  });

  it('rejects future versions', () => {
    const json = JSON.stringify({ version: 999, data: { annotations: [] } });
    expect(() => importSession(json)).toThrow('Unsupported session export version');
  });
});
