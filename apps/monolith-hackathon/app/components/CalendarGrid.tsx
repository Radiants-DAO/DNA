// =============================================================================
// @rdna/monolith - CalendarGrid Component
// Monthly calendar grid with event indicators and category-based styling
// =============================================================================

'use client';

import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

// ============================================================================
// Constants
// ============================================================================

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Category colors mapped to CSS custom properties defined in tokens.css
 * Uses --color-category-* tokens for consistent theming
 */
export const CATEGORY_COLORS: Record<string, string> = {
  launch: 'var(--color-category-launch)',
  vibecoding: 'var(--color-category-vibecoding)',
  devshop: 'var(--color-category-devshop)',
  deadline: 'var(--color-category-deadline)',
  milestone: 'var(--color-category-milestone)',
  mtndao: 'var(--color-category-mtndao)',
};

/** Special category background colors (inline) */
const SPECIAL_BG_STYLES: Record<string, string> = {
  launch: 'rgba(20, 241, 178, 0.15)',
  deadline: 'rgba(239, 92, 111, 0.15)',
  milestone: 'rgba(180, 148, 247, 0.15)',
  mtndao: 'rgba(141, 255, 240, 0.12)',
};

/** Categories that receive special background treatment */
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

export interface CalendarGridProps {
  /** Year to display (e.g., 2026) */
  year: number;
  /** Month to display (0-indexed: 0 = January) */
  month: number;
  /** Map of date keys (YYYY-MM-DD) to arrays of events */
  eventsByDate: Map<string, CalendarEvent[]>;
  /** Map of date keys (YYYY-MM-DD) to post counts */
  postCountByDate: Map<string, number>;
  /** Currently selected date key (YYYY-MM-DD) */
  selectedDate: string | null;
  /** Callback when a date is selected */
  onSelectDate: (date: string) => void;
  /** Optional additional CSS classes */
  className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ============================================================================
// Style constants
// ============================================================================

const CELL_BASE = 'bg-[rgba(0,0,0,0.6)] p-[0.4em_0.25em] min-h-[2.5em] flex flex-col items-center gap-[0.2em]';
const CELL_HEADER = 'min-h-0 p-[0.25em] bg-[rgba(0,0,0,0.8)] text-[0.625em] uppercase font-sans text-[rgba(255,255,255,0.55)]';
const CELL_DAY = 'relative cursor-pointer';

const TODAY_STYLE: React.CSSProperties = {
  background: 'var(--panel-accent-15)',
  boxShadow: [
    'inset 0 0 0.75em var(--panel-accent-40)',
    '0 0 1em var(--panel-accent-30)',
    '0 0 2em rgba(105, 57, 202, 0.3)',
  ].join(', '),
  position: 'relative',
  zIndex: 2,
};

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
  className = '',
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
    <div className={`flex flex-col gap-[0.5em] ${className}`.trim()}>
      {/* Month header */}
      <div className="font-[family-name:var(--font-mono)] text-[0.875em] text-[var(--panel-accent-65)] uppercase">
        {MONTH_NAMES[month]} {year}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-[var(--panel-accent-08)] border border-[rgba(180,148,247,0.8)] border-b-[var(--color-bevel-lo)] border-r-[var(--color-bevel-lo)]">
        {/* Day-of-week headers */}
        {DAY_NAMES.map((d) => (
          <div key={d} className={`${CELL_BASE} ${CELL_HEADER}`}>
            {d}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} className={CELL_BASE} />;

          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEvents = eventsByDate.get(key);
          const postCount = postCountByDate.get(key) || 0;
          const isToday = key === todayKey;
          const isPast = key < todayKey;
          const isSelected = key === selectedDate;

          const specialEvent = dayEvents?.find((ev) => SPECIAL_BG_CATEGORIES.has(ev.category));
          const specialBg = specialEvent ? SPECIAL_BG_STYLES[specialEvent.category] : undefined;

          const cellClasses = [
            CELL_BASE,
            CELL_DAY,
            isPast && 'opacity-40 hover:opacity-60',
            isToday && 'animate-today-glow',
            isSelected && 'outline outline-1 outline-[var(--panel-accent)] -outline-offset-1',
          ].filter(Boolean).join(' ');

          const cellStyle: React.CSSProperties = {
            ...(isToday ? TODAY_STYLE : {}),
            ...(specialBg ? { background: specialBg } : {}),
          };

          return (
            <div
              key={key}
              className={cellClasses}
              onClick={() => onSelectDate(key)}
              onMouseEnter={dayEvents ? () => setHoverKey(key) : undefined}
              onMouseMove={dayEvents ? handleMouseMove : undefined}
              onMouseLeave={() => setHoverKey(null)}
              style={cellStyle}
            >
              <span
                className={[
                  'font-[family-name:var(--font-ui)] text-[0.75em] text-[rgba(255,255,255,0.7)]',
                  specialEvent && 'font-bold text-[rgba(255,255,255,0.95)]',
                  isToday && 'font-bold text-white',
                ].filter(Boolean).join(' ')}
                style={isToday ? { textShadow: '0 0 0.5em var(--panel-accent)' } : undefined}
              >
                {day}
              </span>
              {postCount > 0 && (
                <span
                  className={[
                    'font-[family-name:var(--font-mono)] text-[0.625rem] bg-[var(--color-amber)] text-[var(--color-black)] px-[0.3em] py-[0.1em] rounded-[2px] font-bold transition-opacity duration-200',
                    isPast && 'bg-[rgba(253,143,58,0.5)]',
                  ].filter(Boolean).join(' ')}
                  style={isToday ? { boxShadow: '0 0 0.5em rgba(253, 143, 58, 0.5)' } : undefined}
                >
                  {postCount}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Tooltip (portal to document.body) */}
      {hoverEvents && typeof document !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          className="block fixed z-[9999] min-w-[14em] max-w-[18em] p-[0.6em_0.75em] bg-[rgba(1,1,1,0.95)] border border-[rgba(180,148,247,0.8)] border-b-[var(--color-bevel-lo)] border-r-[var(--color-bevel-lo)] shadow-[0_0_1em_rgba(180,148,247,0.08)] pointer-events-none"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          {hoverEvents.map((ev, j) => (
            <div
              key={j}
              className={[
                'flex flex-col gap-[0.25em]',
                j > 0 && 'mt-[0.5em] pt-[0.5em] border-t border-t-[var(--panel-accent-15)]',
              ].filter(Boolean).join(' ')}
            >
              <div className="flex items-center gap-[0.35em] font-[family-name:var(--font-ui)] text-[0.75em] text-[rgba(255,255,255,0.95)] uppercase">
                <span
                  className="w-[0.375em] h-[0.375em] rounded-full shrink-0"
                  style={{ background: CATEGORY_COLORS[ev.category] || 'var(--color-category-milestone)' }}
                />
                <strong>{ev.label}</strong>
              </div>
              {ev.time && (
                <div className="font-[family-name:var(--font-mono)] text-[0.625em] text-[var(--panel-accent-65)]">
                  {ev.time}
                </div>
              )}
              {ev.description && (
                <div className="font-[family-name:var(--font-sans)] text-[0.6875em] text-[rgba(255,255,255,0.75)] leading-[1.4]">
                  {ev.description}
                </div>
              )}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

export default CalendarGrid;
