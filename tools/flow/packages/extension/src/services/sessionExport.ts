import type { SessionData } from './sessionPersistence';

const EXPORT_VERSION = 1;

export interface ExportedSession {
  version: number;
  exportedAt: string;
  tabUrl: string;
  data: SessionData;
}

export function exportSession(tabUrl: string, data: SessionData): string {
  const exported: ExportedSession = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    tabUrl,
    data,
  };
  return JSON.stringify(exported, null, 2);
}

export function importSession(json: string): { data: SessionData; tabUrl: string } {
  const parsed = JSON.parse(json) as ExportedSession;

  if (!parsed.data || !Array.isArray(parsed.data.annotations)) {
    throw new Error('Invalid session export format');
  }
  if (!parsed.version || parsed.version > EXPORT_VERSION) {
    throw new Error(`Unsupported session export version: ${parsed.version}`);
  }

  return { data: parsed.data, tabUrl: parsed.tabUrl };
}

/**
 * Trigger a file download of the session JSON in the browser.
 */
export function downloadSession(tabUrl: string, data: SessionData): void {
  const json = exportSession(tabUrl, data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flow-session-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Open a file picker and import a session JSON.
 */
export function openImportDialog(): Promise<{ data: SessionData; tabUrl: string }> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('No file selected'));
      const text = await file.text();
      try {
        resolve(importSession(text));
      } catch (e) {
        reject(e);
      }
    };
    input.click();
  });
}
