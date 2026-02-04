// app/intern/hooks/useDrafts.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DashboardDraft } from '../types/typefully';
import { useAuth } from '../context/AuthContext';

interface UseDraftsReturn {
  drafts: DashboardDraft[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createStub: (data: CreateStubData) => Promise<DashboardDraft | null>;
  toggleTask: (draftId: number, taskIndex: number) => Promise<void>;
  reschedule: (draftId: number, newDate: string) => Promise<void>;
}

interface CreateStubData {
  title: string;
  brief?: string;
  scheduledDate?: string;
  tags?: string[];
}

export function useDrafts(): UseDraftsReturn {
  const { editorPassword } = useAuth();
  const [drafts, setDrafts] = useState<DashboardDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = useCallback((): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (editorPassword) {
      headers['x-intern-auth'] = editorPassword;
    }
    return headers;
  }, [editorPassword]);

  const fetchDrafts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch('/api/typefully/drafts');
      if (!res.ok) {
        throw new Error('Failed to fetch drafts');
      }

      const data = await res.json();
      setDrafts(data.drafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const createStub = useCallback(
    async (data: CreateStubData): Promise<DashboardDraft | null> => {
      try {
        const res = await fetch('/api/typefully/drafts', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create stub');
        }

        const created = await res.json();
        setDrafts((prev) => [...prev, created]);
        return created;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return null;
      }
    },
    [getAuthHeaders]
  );

  const toggleTask = useCallback(
    async (draftId: number, taskIndex: number) => {
      try {
        const res = await fetch(`/api/typefully/drafts/${draftId}`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ action: 'toggle_task', taskIndex }),
        });

        if (!res.ok) {
          throw new Error('Failed to toggle task');
        }

        const updated = await res.json();
        setDrafts((prev) =>
          prev.map((d) => (d.id === draftId ? updated : d))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    },
    [getAuthHeaders]
  );

  const reschedule = useCallback(
    async (draftId: number, newDate: string) => {
      try {
        const res = await fetch(`/api/typefully/drafts/${draftId}`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ scheduledDate: newDate }),
        });

        if (!res.ok) {
          throw new Error('Failed to reschedule');
        }

        const updated = await res.json();
        setDrafts((prev) =>
          prev.map((d) => (d.id === draftId ? updated : d))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    },
    [getAuthHeaders]
  );

  return {
    drafts,
    isLoading,
    error,
    refetch: fetchDrafts,
    createStub,
    toggleTask,
    reschedule,
  };
}
