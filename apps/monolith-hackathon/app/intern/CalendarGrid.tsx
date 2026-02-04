// app/intern/CalendarGrid.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

// ============================================================================
// Constants
// ============================================================================

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CATEGORY_COLORS: Record<string, string> = {
  launch: '#14f1b2',
  vibecoding: '#fd8f3a',
  devshop: '#6939ca',
  deadline: '#ef5c6f',
  milestone: '#b494f7',
  mtndao: '#8dfff0',
};

const SPECIAL_BG_CATEGORIES = new Set(['launch', 'deadline', 'milestone', 'mtndao']);

// ============================================================================
// Types
// ============================================================================

export interface CalendarEvent {
  label: string;
  category: string;
  time?: string;
  description?: string;
  link?: string;
}

interface CalendarGridProps {
  year: number;
  month: number;
  eventsByDate: Map<string, CalendarEvent[]>;
  postCountByDate: Map<string, number>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

// ============================================================================
// Helpers
// ============================================================================

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ============================================================================
// Component
// ============================================================================

export function CalendarGrid({
  year,
  month,
  eventsByDate,
  postCountByDate,
  selectedDate,
  onSelectDate,
}: CalendarGridProps) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = toDateKey(new Date());

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const tt = tooltipRef.current;
    if (!tt) {
      setMousePos({ x: e.clientX, y: e.clientY });
      return;
    }
    const w = tt.offsetWidth;
    const h = tt.offsetHeight;
    const pad = 12;
    let x = e.clientX + pad;
    let y = e.clientY - h - pad;
    if (x + w > window.innerWidth - pad) x = e.clientX - w - pad;
    if (y < pad) y = e.clientY + pad;
    setMousePos({ x, y });
  }, []);

  const hoverEvents = hoverKey ? eventsByDate.get(hoverKey) : null;

  return (
    <div className="cal-month">
      <div className="cal-month-header panel-label">{MONTH_NAMES[month]} {year}</div>
      <div className="cal-grid">
        {DAY_NAMES.map((d) => (
          <div key={d} className="cal-cell cal-cell--header panel-muted">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} className="cal-cell" />;

          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEvents = eventsByDate.get(key);
          const postCount = postCountByDate.get(key) || 0;
          const isToday = key === todayKey;
          const isSelected = key === selectedDate;
          const hasContent = dayEvents || postCount > 0;

          const specialEvent = dayEvents?.find((ev) => SPECIAL_BG_CATEGORIES.has(ev.category));
          const specialClass = specialEvent ? ` cal-cell--${specialEvent.category}` : '';

          return (
            <div
              key={key}
              className={`cal-cell cal-cell--day${isToday ? ' cal-cell--today' : ''}${hasContent ? ' cal-cell--has-event' : ''}${specialClass}${isSelected ? ' cal-cell--selected' : ''}`}
              onClick={() => onSelectDate(key)}
              onMouseEnter={dayEvents ? () => setHoverKey(key) : undefined}
              onMouseMove={dayEvents ? handleMouseMove : undefined}
              onMouseLeave={() => setHoverKey(null)}
              style={{ cursor: 'pointer' }}
            >
              <span className={`cal-date${specialEvent ? ' cal-date--bold' : ''}`}>{day}</span>
              {postCount > 0 && (
                <span className="intern-post-count">{postCount}</span>
              )}
            </div>
          );
        })}
      </div>
      {hoverEvents && typeof document !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          className="cal-tooltip cal-tooltip--visible"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          {hoverEvents.map((ev, j) => (
            <div key={j} className="cal-tooltip-event">
              <div className="cal-tooltip-header">
                <span className="cal-dot" style={{ background: CATEGORY_COLORS[ev.category] || '#b494f7' }} />
                <strong>{ev.label}</strong>
              </div>
              {ev.time && <div className="cal-tooltip-time">{ev.time}</div>}
              {ev.description && <div className="cal-tooltip-desc">{ev.description}</div>}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

export default CalendarGrid;
