import { validateSettings } from './serialization';
import type { PretextDocumentSettings } from './types';

export interface LegacyScratchpadDraft {
  kind: 'legacy-blocknote';
  id: string;
  title: string;
  content: unknown[];
  updatedAt: number;
}

export interface PretextScratchpadDraft {
  kind: 'pretext';
  id: string;
  title: string;
  markdown: string;
  settings: PretextDocumentSettings;
  updatedAt: number;
}

export type ScratchpadDraft = LegacyScratchpadDraft | PretextScratchpadDraft;

function requireString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function requireNumber(value: unknown, fallback: number) {
  return typeof value === 'number' ? value : fallback;
}

export function coerceStoredDoc(raw: unknown): ScratchpadDraft {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid stored document');
  }

  const doc = raw as Record<string, unknown>;

  // Already typed as pretext
  if (doc.kind === 'pretext') {
    return {
      kind: 'pretext',
      id: requireString(doc.id, crypto.randomUUID()),
      title: requireString(doc.title, 'Untitled'),
      markdown: requireString(doc.markdown, ''),
      settings: validateSettings(doc.settings),
      updatedAt: requireNumber(doc.updatedAt, Date.now()),
    };
  }

  // Already typed as legacy
  if (doc.kind === 'legacy-blocknote') {
    return {
      kind: 'legacy-blocknote',
      id: requireString(doc.id, crypto.randomUUID()),
      title: requireString(doc.title, 'Untitled'),
      content: Array.isArray(doc.content) ? doc.content : [],
      updatedAt: requireNumber(doc.updatedAt, Date.now()),
    };
  }

  // Untyped old BlockNote doc — wrap as legacy
  return {
    kind: 'legacy-blocknote',
    id: (doc.id as string) || crypto.randomUUID(),
    title: (doc.title as string) || 'Untitled',
    content: Array.isArray(doc.content) ? doc.content : [],
    updatedAt: (doc.updatedAt as number) || Date.now(),
  };
}
