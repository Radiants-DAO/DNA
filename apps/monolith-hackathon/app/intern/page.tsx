// app/intern/page.tsx
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { CalendarGrid, CalendarEvent } from './CalendarGrid';
import { DetailsPanel } from './DetailsPanel';
import { PLANNING_DATA, CONTENT } from './data';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'intern-auth';
const PASSWORD = process.env.NEXT_PUBLIC_INTERN_PASSWORD || 'monolith2026';

// ============================================================================
// Helpers
// ============================================================================

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ============================================================================
// Password Gate Component
// ============================================================================

function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true');
      onSuccess();
    } else {
      setError(true);
      setInput('');
    }
  };

  return (
    <div className="intern-gate">
      <div className="intern-gate-container">
        <h1 className="intern-gate-title">ACCESS REQUIRED</h1>
        <p className="intern-gate-desc">This area is restricted to authorized personnel.</p>
        <form onSubmit={handleSubmit} className="intern-gate-form">
          <input
            type="password"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
            placeholder="Enter access code"
            className={`intern-gate-input ${error ? 'intern-gate-input--error' : ''}`}
            autoFocus
          />
          <button type="submit" className="intern-gate-btn">
            AUTHENTICATE
          </button>
        </form>
        {error && <p className="intern-gate-error">ACCESS DENIED</p>}
      </div>
    </div>
  );
}

// ============================================================================
// Page Component
// ============================================================================

export default function InternPage() {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const todayKey = toDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [refreshKey, setRefreshKey] = useState(0);

  // Check auth on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setIsAuthed(stored === 'true');
  }, []);

  // Build events map from calendar content
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

  // Build post count map from planning data
  const postCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const [date, plan] of Object.entries(PLANNING_DATA)) {
      if (plan.posts.length > 0) {
        map.set(date, plan.posts.length);
      }
    }
    return map;
  }, []);

  // Get current day's data
  const currentDayPlan = PLANNING_DATA[selectedDate] || null;
  const currentEvents = eventsByDate.get(selectedDate) || [];

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Loading state while checking auth
  if (isAuthed === null) {
    return (
      <div className="intern-page">
        <div className="intern-loading">INITIALIZING...</div>
      </div>
    );
  }

  // Show password gate if not authenticated
  if (!isAuthed) {
    return <PasswordGate onSuccess={() => setIsAuthed(true)} />;
  }

  return (
    <div className="intern-page">
      <header className="intern-header">
        <h1 className="intern-title">INTERN.exe</h1>
        <p className="intern-subtitle">Content Planning Dashboard</p>
      </header>

      <main className="intern-main" key={refreshKey}>
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
          <DetailsPanel
            selectedDate={selectedDate}
            dayPlan={currentDayPlan}
            events={currentEvents}
            onRefresh={handleRefresh}
          />
        </div>
      </main>
    </div>
  );
}
