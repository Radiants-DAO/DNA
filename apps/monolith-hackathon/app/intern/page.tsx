// app/intern/page.tsx
'use client';

import { useState, useMemo, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useDrafts } from './hooks/useDrafts';
import { groupDraftsByDate } from './lib/transforms';
import { CalendarGrid, CalendarEvent } from './CalendarGrid';
import { PasswordGate } from './components/PasswordGate';
import { DraftCard } from './components/DraftCard';
import { CreateStubForm } from './components/CreateStubForm';
import { CONTENT } from './data';

// ============================================================================
// Helpers
// ============================================================================

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ============================================================================
// Dashboard Content Component
// ============================================================================

function DashboardContent() {
  const { role, logout } = useAuth();
  const { drafts, isLoading, error, refetch, createStub, toggleTask } = useDrafts();

  const todayKey = toDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const isEditor = role === 'editor';

  // Build events map from calendar content (hackathon events)
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    const calendarData = CONTENT.calendar;
    if (calendarData?.type === 'calendar') {
      for (const ev of calendarData.events) {
        const existing = map.get(ev.date) || [];
        existing.push({
          label: ev.label,
          category: ev.category,
          time: ev.time,
          description: ev.description,
          link: ev.link,
        });
        map.set(ev.date, existing);
      }
    }
    return map;
  }, []);

  // Group drafts by date for calendar
  const draftsByDate = useMemo(() => {
    return groupDraftsByDate(drafts);
  }, [drafts]);

  // Get drafts for selected date
  const selectedDrafts = useMemo(() => {
    return draftsByDate.get(selectedDate) || [];
  }, [draftsByDate, selectedDate]);

  // Build post count map for calendar dots
  const postCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const [date, dayDrafts] of draftsByDate) {
      if (date !== 'unscheduled') {
        map.set(date, dayDrafts.length);
      }
    }
    return map;
  }, [draftsByDate]);

  const handleCreateStub = useCallback(
    async (data: { title: string; brief: string; scheduledDate: string }) => {
      await createStub(data);
      setShowCreateForm(false);
    },
    [createStub]
  );

  const handleToggleTask = useCallback(
    (draftId: number, taskIndex: number) => {
      toggleTask(draftId, taskIndex);
    },
    [toggleTask]
  );

  const formattedDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );

  return (
    <div className="intern-page">
      <header className="intern-header">
        <div className="intern-header-left">
          <h1 className="intern-title">INTERN.exe</h1>
          <p className="intern-subtitle">
            {isEditor ? 'Editor Dashboard' : 'Content Review'}
          </p>
        </div>
        <div className="intern-header-right">
          <span className="intern-role-badge">
            {role?.toUpperCase()}
          </span>
          <button onClick={logout} className="intern-logout-btn">
            LOGOUT
          </button>
        </div>
      </header>

      <main className="intern-main">
        <div className="intern-calendar-pane">
          <CalendarGrid
            year={2026}
            month={1}
            eventsByDate={eventsByDate}
            postCountByDate={postCountByDate}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          <CalendarGrid
            year={2026}
            month={2}
            eventsByDate={eventsByDate}
            postCountByDate={postCountByDate}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        <div className="intern-details-pane">
          <div className="intern-details-panel">
            <div className="intern-details-header">
              <div>
                <h2 className="intern-details-date">{formattedDate}</h2>
              </div>
              <div className="intern-details-actions">
                {isEditor && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="intern-create-btn"
                  >
                    + Create Stub
                  </button>
                )}
                <button onClick={refetch} className="intern-refresh-btn">
                  Refresh
                </button>
              </div>
            </div>

            {showCreateForm && isEditor && (
              <CreateStubForm
                selectedDate={selectedDate}
                onSubmit={handleCreateStub}
                onCancel={() => setShowCreateForm(false)}
              />
            )}

            {isLoading && (
              <div className="intern-loading">Loading drafts...</div>
            )}

            {error && (
              <div className="intern-error">Error: {error}</div>
            )}

            {!isLoading && !error && selectedDrafts.length === 0 && (
              <div className="intern-empty-state">
                <p>No drafts scheduled for this date.</p>
                {isEditor && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="intern-empty-create-btn"
                  >
                    Create a stub draft
                  </button>
                )}
              </div>
            )}

            {!isLoading && !error && selectedDrafts.length > 0 && (
              <div className="intern-drafts-list">
                {selectedDrafts.map((draft) => (
                  <DraftCard
                    key={draft.id}
                    draft={draft}
                    role={role!}
                    onToggleTask={isEditor ? handleToggleTask : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

function InternPageInner() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="intern-page">
        <div className="intern-loading">INITIALIZING...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordGate />;
  }

  return <DashboardContent />;
}

export default function InternPage() {
  return (
    <AuthProvider>
      <InternPageInner />
    </AuthProvider>
  );
}
