import { useCallback, useState } from 'react';
import { DEFAULT_CONTENT } from './default-content';

// ============================================================================
// Types
// ============================================================================

export interface ScratchpadDoc {
  id: string;
  title: string;
  content: unknown[];
  updatedAt: number;
}

// ============================================================================
// localStorage helpers
// ============================================================================

const DOCS_KEY = 'rados-scratchpad-docs';
const ACTIVE_KEY = 'rados-scratchpad-active';

function generateId(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadDocs(): ScratchpadDoc[] {
  try {
    const raw = localStorage.getItem(DOCS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* corrupted */ }
  return [];
}

function saveDocs(docs: ScratchpadDoc[]) {
  localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
}

function loadActiveId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

function saveActiveId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
}

// Migrate legacy single-doc format → multi-doc
function migrateLegacy(): ScratchpadDoc[] {
  const legacyKey = 'rados-scratchpad';
  const raw = localStorage.getItem(legacyKey);
  if (!raw) return [];
  try {
    const content = JSON.parse(raw);
    if (Array.isArray(content) && content.length > 0) {
      const doc: ScratchpadDoc = {
        id: generateId(),
        title: 'Untitled',
        content,
        updatedAt: Date.now(),
      };
      localStorage.removeItem(legacyKey);
      return [doc];
    }
  } catch { /* ignore */ }
  return [];
}

// ============================================================================
// Hook
// ============================================================================

export function useScratchpadDocs() {
  const [docs, setDocs] = useState<ScratchpadDoc[]>(() => {
    const existing = loadDocs();
    if (existing.length > 0) return existing;

    // Try legacy migration
    const migrated = migrateLegacy();
    if (migrated.length > 0) {
      saveDocs(migrated);
      saveActiveId(migrated[0]!.id);
      return migrated;
    }

    // First time — create spec page
    const specDoc: ScratchpadDoc = {
      id: generateId(),
      title: 'Spec Page',
      content: JSON.parse(JSON.stringify(DEFAULT_CONTENT)) as unknown[],
      updatedAt: Date.now(),
    };
    saveDocs([specDoc]);
    saveActiveId(specDoc.id);
    return [specDoc];
  });

  const [activeId, setActiveId] = useState<string>(() => {
    const saved = loadActiveId();
    if (saved && docs.some((d) => d.id === saved)) return saved;
    return docs[0]?.id ?? '';
  });

  const activeDoc = docs.find((d) => d.id === activeId) ?? docs[0]!;

  // ── Actions ──

  const switchDoc = useCallback((id: string) => {
    setActiveId(id);
    saveActiveId(id);
  }, []);

  const newDoc = useCallback(() => {
    const doc: ScratchpadDoc = {
      id: generateId(),
      title: 'Untitled',
      content: [],
      updatedAt: Date.now(),
    };
    setDocs((prev) => {
      const next = [...prev, doc];
      saveDocs(next);
      return next;
    });
    setActiveId(doc.id);
    saveActiveId(doc.id);
  }, []);

  const newSpecPage = useCallback(() => {
    const doc: ScratchpadDoc = {
      id: generateId(),
      title: 'Spec Page',
      content: JSON.parse(JSON.stringify(DEFAULT_CONTENT)) as unknown[],
      updatedAt: Date.now(),
    };
    setDocs((prev) => {
      const next = [...prev, doc];
      saveDocs(next);
      return next;
    });
    setActiveId(doc.id);
    saveActiveId(doc.id);
  }, []);

  const saveContent = useCallback(
    (content: unknown[]) => {
      setDocs((prev) => {
        const next = prev.map((d) =>
          d.id === activeId ? { ...d, content, updatedAt: Date.now() } : d,
        );
        saveDocs(next);
        return next;
      });
    },
    [activeId],
  );

  const renameDoc = useCallback(
    (title: string) => {
      setDocs((prev) => {
        const next = prev.map((d) =>
          d.id === activeId ? { ...d, title } : d,
        );
        saveDocs(next);
        return next;
      });
    },
    [activeId],
  );

  const deleteDoc = useCallback(() => {
    setDocs((prev) => {
      const next = prev.filter((d) => d.id !== activeId);
      if (next.length === 0) {
        // Always keep at least one doc
        const fresh: ScratchpadDoc = {
          id: generateId(),
          title: 'Untitled',
          content: [],
          updatedAt: Date.now(),
        };
        next.push(fresh);
      }
      saveDocs(next);
      const newActive = next[0]!.id;
      setActiveId(newActive);
      saveActiveId(newActive);
      return next;
    });
  }, [activeId]);

  return {
    docs,
    activeDoc,
    activeId,
    switchDoc,
    newDoc,
    newSpecPage,
    saveContent,
    renameDoc,
    deleteDoc,
  };
}
