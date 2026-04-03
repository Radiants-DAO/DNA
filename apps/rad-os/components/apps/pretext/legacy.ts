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

export function coerceStoredDoc(raw: unknown): ScratchpadDraft {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid stored document');
  }

  const doc = raw as Record<string, unknown>;

  // Already typed as pretext
  if (doc.kind === 'pretext') {
    return raw as PretextScratchpadDraft;
  }

  // Already typed as legacy
  if (doc.kind === 'legacy-blocknote') {
    return raw as LegacyScratchpadDraft;
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
