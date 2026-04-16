import { useCallback, useState } from 'react';

export interface ScratchpadDoc {
  id: string;
  title: string;
  content: unknown[];
  updatedAt: number;
}

const DOCS_KEY = 'rados-scratchpad-docs';
const ACTIVE_KEY = 'rados-scratchpad-active';
const LEGACY_KEY = 'rados-scratchpad';

function generateId(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isScratchpadDoc(value: unknown): value is ScratchpadDoc {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const doc = value as Record<string, unknown>;
  return (
    typeof doc.id === 'string' &&
    typeof doc.title === 'string' &&
    Array.isArray(doc.content) &&
    typeof doc.updatedAt === 'number'
  );
}

function createDoc(title = 'Untitled', content: unknown[] = []): ScratchpadDoc {
  return {
    id: generateId(),
    title,
    content,
    updatedAt: Date.now(),
  };
}

function loadDocs(): ScratchpadDoc[] {
  try {
    const raw = localStorage.getItem(DOCS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isScratchpadDoc);
  } catch {
    return [];
  }
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

function migrateLegacy(): ScratchpadDoc[] {
  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw) {
    return [];
  }

  try {
    const content = JSON.parse(raw);
    if (Array.isArray(content) && content.length > 0) {
      const doc = createDoc('Untitled', content);
      localStorage.removeItem(LEGACY_KEY);
      return [doc];
    }
  } catch {
    return [];
  }

  return [];
}

export function useScratchpadDocs() {
  const [docs, setDocs] = useState<ScratchpadDoc[]>(() => {
    const existing = loadDocs();
    if (existing.length > 0) {
      return existing;
    }

    const migrated = migrateLegacy();
    if (migrated.length > 0) {
      saveDocs(migrated);
      saveActiveId(migrated[0]!.id);
      return migrated;
    }

    const firstDoc = createDoc();
    saveDocs([firstDoc]);
    saveActiveId(firstDoc.id);
    return [firstDoc];
  });

  const [activeId, setActiveId] = useState<string>(() => {
    const saved = loadActiveId();
    if (saved && docs.some((doc) => doc.id === saved)) {
      return saved;
    }

    return docs[0]!.id;
  });

  const activeDoc = docs.find((doc) => doc.id === activeId) ?? docs[0]!;

  const switchDoc = useCallback((id: string) => {
    setActiveId(id);
    saveActiveId(id);
  }, []);

  const newDoc = useCallback(() => {
    const doc = createDoc();
    setDocs((prev) => {
      const next = [...prev, doc];
      saveDocs(next);
      return next;
    });
    setActiveId(doc.id);
    saveActiveId(doc.id);
  }, []);

  const newSpecPage = useCallback(() => {
    const doc = createDoc('Spec Page');
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
        const next = prev.map((doc) =>
          doc.id === activeId
            ? { ...doc, content, updatedAt: Date.now() }
            : doc,
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
        const next = prev.map((doc) =>
          doc.id === activeId ? { ...doc, title } : doc,
        );
        saveDocs(next);
        return next;
      });
    },
    [activeId],
  );

  const deleteDoc = useCallback(() => {
    setDocs((prev) => {
      const next = prev.filter((doc) => doc.id !== activeId);
      if (next.length === 0) {
        const fresh = createDoc();
        next.push(fresh);
      }

      saveDocs(next);
      const nextActiveId = next[0]!.id;
      setActiveId(nextActiveId);
      saveActiveId(nextActiveId);
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
