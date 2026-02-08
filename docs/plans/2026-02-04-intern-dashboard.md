# Intern Dashboard & 404 Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a password-protected `/intern` page with 2-pane calendar/content layout and a CRT glitch 404 page.

**Architecture:** Full-page layout at `/intern` with calendar grid (left) and collapsible date-specific sections (right). Data merged from existing calendar events + content planning JSON. 404 page uses existing CRT styling with glitch animation.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, existing CRT theme tokens

---

## Task 1: Create Planning Data Types and Initial Data

**Files:**
- Create: `app/intern/data.ts`

**Step 1: Create the data file with types and initial content**

```ts
// app/intern/data.ts

// Re-export calendar events from InfoWindow for merging
export { CONTENT } from '../components/InfoWindow';

// ============================================================================
// Types
// ============================================================================

export type ContentStatus = 'SENT' | 'Scheduled' | 'Ready' | 'Waiting';

export type AssetStatus = 'pending' | 'in-progress' | 'pending-review' | 'approved';

export interface Asset {
  name: string;
  url?: string;
  status: AssetStatus;
}

export interface Question {
  q: string;
  answered: boolean;
  answer?: string;
}

export interface ContentPost {
  status: ContentStatus;
  time?: string;
  title: string;
  topic?: string;
  caption?: string;
  todos?: string[];
  notes?: string;
  assets?: Asset[];
}

export interface DayPlan {
  day: string;
  posts: ContentPost[];
  questions: Question[];
  links: { label: string; url: string }[];
}

// ============================================================================
// Status Colors (matches theme tokens)
// ============================================================================

export const STATUS_COLORS: Record<ContentStatus, string> = {
  SENT: '#14f1b2',      // --green
  Scheduled: '#fd8f3a', // --amber
  Ready: '#6939ca',     // --ultraviolet
  Waiting: '#0e151a',   // --slate (muted)
};

export const ASSET_STATUS_COLORS: Record<AssetStatus, string> = {
  pending: '#0e151a',
  'in-progress': '#fd8f3a',
  'pending-review': '#6939ca',
  approved: '#14f1b2',
};

// ============================================================================
// Planning Data (keyed by date YYYY-MM-DD)
// ============================================================================

export const PLANNING_DATA: Record<string, DayPlan> = {
  '2026-02-03': {
    day: 'Tuesday',
    posts: [
      {
        status: 'SENT',
        time: '6 PM UTC',
        title: 'REMINDER: Hackathon kickoff event',
        topic: 'Kickoff reminder 30 min before',
        caption: 'REMINDER:\n\nThe hackathon kickoff event starts in 30 minutes!\n\n@somemobiledev will be giving you the full download of all important infos and we\'ll follow it up w/ some project scope planning w/ Claude Code & @KEMOS4BE.\n\nLink below',
      },
    ],
    questions: [],
    links: [{ label: 'Typefully', url: 'https://typefully.com' }],
  },
  '2026-02-04': {
    day: 'Wednesday',
    posts: [
      {
        status: 'SENT',
        time: '6 PM UTC',
        title: 'Lets cook, Devshop teaches us how!',
        topic: 'Remind people of day and time of Devshop on Thursday and what to expect',
      },
    ],
    questions: [],
    links: [],
  },
  '2026-02-05': {
    day: 'Thursday',
    posts: [
      {
        status: 'Waiting',
        time: '4 PM UTC',
        title: 'DEVSHOP REMINDER',
        topic: 'DEVSHOP STARTING IN TWO HOURS!',
      },
      {
        status: 'Waiting',
        time: '6 PM UTC',
        title: 'Glory, money and more.',
        topic: 'What prizes are up for offer. Focus not only money but the support and go to market strategy.',
        caption: '$125k prizes, SKR tokens, Featured dApp store placement, A CALL WITH TOLY. OOMMGGGGG',
      },
    ],
    questions: [],
    links: [],
  },
  '2026-02-06': {
    day: 'Friday',
    posts: [
      {
        status: 'Scheduled',
        time: '6 PM UTC',
        title: 'Its always more fun in a team',
        topic: 'Join discord to meet other builders, encourage teams to collaborate',
        caption: 'Have a dream, find a friend, build something they can\'t move. It all happens here https://discord.com/channels/1024891059135852604/1467511533377687673',
      },
    ],
    questions: [],
    links: [],
  },
  '2026-02-08': {
    day: 'Sunday',
    posts: [
      {
        status: 'Waiting',
        title: 'If you seek answers, look no further.',
        topic: 'Guide to FAQ\'s for all silly questions that the public may have.',
        caption: 'The answers you seek, may be closer than one would expect. Look here https://solanamobile.radiant.nexus/?panel=faq',
      },
    ],
    questions: [],
    links: [],
  },
  '2026-02-09': {
    day: 'Monday',
    posts: [
      {
        status: 'Waiting',
        title: 'A word from our creators',
        topic: 'A word from the team, maybe a quick edited video from Solana and Radiants about what this hackathon is about and what it means to us?',
        caption: 'Ever wondered how the Monolith came about? So did we, now we get to hear it from the creators themselves @kemo @ross @mike @akshay @magellan',
      },
    ],
    questions: [],
    links: [],
  },
  '2026-02-10': {
    day: 'Tuesday',
    posts: [
      {
        status: 'Waiting',
        title: 'Meet the Judges',
        topic: 'Introducing the judges who they are and their titles. F1 animation idea where the Judges transition in and out with their names and small bio.',
        caption: 'Some old, some new. We keeping it fresh and fair.',
        todos: ['F1-style animation with judge transitions'],
        notes: 'Cronus - please cook this ser',
        assets: [{ name: 'Judge intro video', status: 'pending' }],
      },
      {
        status: 'Waiting',
        title: 'Never Forget',
        topic: 'Reminder Do\'s and don\'ts, important deadlines or dates',
        caption: 'These may or may not be incredibly important. Up to you.',
      },
    ],
    questions: [],
    links: [{ label: 'F1 Animation Reference', url: 'https://www.youtube.com/watch?v=7U_fFy9vOyY' }],
  },
  '2026-02-11': {
    day: 'Wednesday',
    posts: [
      {
        status: 'Waiting',
        title: 'Show us what you got!',
        topic: 'Bait engagement, Get contestants to show previews or submissions',
        caption: 'We have built Solitaire on Claude. What have you done?',
      },
    ],
    questions: [],
    links: [],
  },
  '2026-02-12': {
    day: 'Thursday',
    posts: [
      {
        status: 'Waiting',
        title: 'You\'re being judged.',
        topic: 'Judging criteria What we looking for, dont forget about your presentation. Its easy to build, difficult to convey value',
        caption: 'What would Toly say?',
      },
    ],
    questions: [],
    links: [],
  },
  '2026-02-13': {
    day: 'Friday',
    posts: [
      {
        status: 'Waiting',
        title: 'Update from the giant Stone',
        topic: 'Update on the hackathon, how many entries, countries submissions etc. Bonus prize SKR integration',
        caption: 'Numbers dont lie.',
        todos: ['Worldmap animation with stats'],
        notes: 'Cronus - please cook this ser',
      },
    ],
    questions: [
      { q: 'Can we get current submission stats for the post?', answered: false },
    ],
    links: [],
  },
};
```

**Step 2: Export CONTENT from InfoWindow**

Edit `app/components/InfoWindow.tsx` to export the CONTENT constant:

Find line ~49:
```ts
const CONTENT: Record<string, WindowContent> = {
```

Change to:
```ts
export const CONTENT: Record<string, WindowContent> = {
```

**Step 3: Verify the file compiles**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/apps/monolith-hackathon && pnpm exec tsc --noEmit`

Expected: No errors

**Step 4: Commit**

```bash
git add app/intern/data.ts app/components/InfoWindow.tsx
git commit -m "feat(intern): add planning data types and initial content

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create Calendar Grid Component (Extracted)

**Files:**
- Create: `app/intern/CalendarGrid.tsx`

**Step 1: Create simplified calendar grid component**

```tsx
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
```

**Step 2: Verify no errors**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/apps/monolith-hackathon && pnpm exec tsc --noEmit`

**Step 3: Commit**

```bash
git add app/intern/CalendarGrid.tsx
git commit -m "feat(intern): add CalendarGrid component

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create Details Panel Component

**Files:**
- Create: `app/intern/DetailsPanel.tsx`

**Step 1: Create the details panel with collapsible sections**

```tsx
// app/intern/DetailsPanel.tsx
'use client';

import { CrtAccordion } from '../components/CrtAccordion';
import {
  DayPlan,
  ContentPost,
  Question,
  Asset,
  STATUS_COLORS,
  ASSET_STATUS_COLORS,
} from './data';
import { CalendarEvent, CATEGORY_COLORS } from './CalendarGrid';

// ============================================================================
// Types
// ============================================================================

interface DetailsPanelProps {
  selectedDate: string;
  dayPlan: DayPlan | null;
  events: CalendarEvent[];
  onRefresh: () => void;
}

// ============================================================================
// Sub-components
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#0e151a';
  return (
    <span
      className="intern-status-badge"
      style={{ background: color, color: color === '#0e151a' ? '#666' : '#000' }}
    >
      {status}
    </span>
  );
}

function AssetStatusBadge({ status }: { status: string }) {
  const color = ASSET_STATUS_COLORS[status as keyof typeof ASSET_STATUS_COLORS] || '#0e151a';
  return (
    <span
      className="intern-asset-badge"
      style={{ background: color, color: color === '#0e151a' ? '#666' : '#000' }}
    >
      {status}
    </span>
  );
}

function PostCard({ post }: { post: ContentPost }) {
  return (
    <div className="intern-post-card">
      <div className="intern-post-header">
        <StatusBadge status={post.status} />
        {post.time && <span className="intern-post-time">{post.time}</span>}
      </div>
      <h4 className="intern-post-title">{post.title}</h4>
      {post.topic && <p className="intern-post-topic">{post.topic}</p>}
      {post.caption && (
        <pre className="intern-post-caption">{post.caption}</pre>
      )}
      {post.todos && post.todos.length > 0 && (
        <ul className="intern-post-todos">
          {post.todos.map((todo, i) => (
            <li key={i}>{todo}</li>
          ))}
        </ul>
      )}
      {post.notes && (
        <p className="intern-post-notes">
          <strong>Notes:</strong> {post.notes}
        </p>
      )}
      {post.assets && post.assets.length > 0 && (
        <div className="intern-post-assets">
          {post.assets.map((asset, i) => (
            <div key={i} className="intern-asset-item">
              <span>{asset.name}</span>
              <AssetStatusBadge status={asset.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: CalendarEvent }) {
  return (
    <div className="intern-event-card">
      <div className="intern-event-header">
        <span
          className="cal-dot"
          style={{ background: CATEGORY_COLORS[event.category] || '#b494f7' }}
        />
        <span className="intern-event-label">{event.label}</span>
        <span className="intern-event-category">{event.category}</span>
      </div>
      {event.time && <span className="intern-event-time">{event.time}</span>}
      {event.description && <p className="intern-event-desc">{event.description}</p>}
      {event.link && (
        <a href={event.link} target="_blank" rel="noopener noreferrer" className="intern-event-link">
          View Link
        </a>
      )}
    </div>
  );
}

function QuestionCard({ question }: { question: Question }) {
  return (
    <div className={`intern-question-card ${question.answered ? 'intern-question--answered' : ''}`}>
      <p className="intern-question-text">{question.q}</p>
      {question.answered && question.answer && (
        <p className="intern-question-answer">{question.answer}</p>
      )}
      {!question.answered && (
        <span className="intern-question-pending">Pending</span>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DetailsPanel({ selectedDate, dayPlan, events, onRefresh }: DetailsPanelProps) {
  const formattedDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const hasPosts = dayPlan && dayPlan.posts.length > 0;
  const hasEvents = events.length > 0;
  const hasQuestions = dayPlan && dayPlan.questions.length > 0;
  const hasLinks = dayPlan && dayPlan.links.length > 0;
  const hasContent = hasPosts || hasEvents || hasQuestions || hasLinks;

  // Default expanded sections
  const defaultExpanded = ['posts', 'events'];

  return (
    <div className="intern-details-panel">
      <div className="intern-details-header">
        <div>
          <h2 className="intern-details-date">{formattedDate}</h2>
          {dayPlan?.day && <span className="intern-details-day">{dayPlan.day}</span>}
        </div>
        <button onClick={onRefresh} className="intern-refresh-btn" title="Refresh data">
          Refresh
        </button>
      </div>

      {!hasContent ? (
        <div className="intern-empty-state">
          <p>No content planned for this date.</p>
        </div>
      ) : (
        <CrtAccordion type="multiple" defaultValue={defaultExpanded} className="intern-accordion">
          {hasPosts && (
            <CrtAccordion.Item value="posts">
              <CrtAccordion.Trigger>
                Content Posts ({dayPlan!.posts.length})
              </CrtAccordion.Trigger>
              <CrtAccordion.Content>
                <div className="intern-section-content">
                  {dayPlan!.posts.map((post, i) => (
                    <PostCard key={i} post={post} />
                  ))}
                </div>
              </CrtAccordion.Content>
            </CrtAccordion.Item>
          )}

          {hasEvents && (
            <CrtAccordion.Item value="events">
              <CrtAccordion.Trigger>
                Calendar Events ({events.length})
              </CrtAccordion.Trigger>
              <CrtAccordion.Content>
                <div className="intern-section-content">
                  {events.map((event, i) => (
                    <EventCard key={i} event={event} />
                  ))}
                </div>
              </CrtAccordion.Content>
            </CrtAccordion.Item>
          )}

          {hasQuestions && (
            <CrtAccordion.Item value="questions">
              <CrtAccordion.Trigger>
                Questions for Solana Mobile ({dayPlan!.questions.length})
              </CrtAccordion.Trigger>
              <CrtAccordion.Content>
                <div className="intern-section-content">
                  {dayPlan!.questions.map((q, i) => (
                    <QuestionCard key={i} question={q} />
                  ))}
                </div>
              </CrtAccordion.Content>
            </CrtAccordion.Item>
          )}

          {hasLinks && (
            <CrtAccordion.Item value="links">
              <CrtAccordion.Trigger>
                Links ({dayPlan!.links.length})
              </CrtAccordion.Trigger>
              <CrtAccordion.Content>
                <div className="intern-section-content intern-links-list">
                  {dayPlan!.links.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="intern-link-item"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </CrtAccordion.Content>
            </CrtAccordion.Item>
          )}
        </CrtAccordion>
      )}
    </div>
  );
}

export default DetailsPanel;
```

**Step 2: Verify no errors**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/apps/monolith-hackathon && pnpm exec tsc --noEmit`

**Step 3: Commit**

```bash
git add app/intern/DetailsPanel.tsx
git commit -m "feat(intern): add DetailsPanel with collapsible sections

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create Intern Page

**Files:**
- Create: `app/intern/page.tsx`

**Step 1: Create the main intern page**

```tsx
// app/intern/page.tsx
'use client';

import { useState, useMemo, useCallback } from 'react';
import { CalendarGrid, CalendarEvent } from './CalendarGrid';
import { DetailsPanel } from './DetailsPanel';
import { PLANNING_DATA, CONTENT } from './data';

// ============================================================================
// Helpers
// ============================================================================

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ============================================================================
// Page Component
// ============================================================================

export default function InternPage() {
  const todayKey = toDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [refreshKey, setRefreshKey] = useState(0);

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
```

**Step 2: Verify no errors**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/apps/monolith-hackathon && pnpm exec tsc --noEmit`

**Step 3: Commit**

```bash
git add app/intern/page.tsx
git commit -m "feat(intern): add main intern dashboard page

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Add Intern Page Styles

**Files:**
- Modify: `app/globals.css`

**Step 1: Add intern page styles to globals.css**

Append the following to the end of `app/globals.css` (before the final closing comment if there is one):

```css
/* =============================================================================
   Intern Dashboard Styles
   ============================================================================= */

.intern-page {
  min-height: 100dvh;
  background: linear-gradient(180deg, #060b0a 0%, #0a1210 100%);
  color: var(--white);
  font-family: 'Pixeloid Sans', sans-serif;
  padding: 2rem;
}

.intern-header {
  text-align: center;
  margin-bottom: 2rem;
}

.intern-title {
  font-family: 'Mondwest', serif;
  font-size: clamp(2rem, 5vw, 3rem);
  color: var(--white);
  text-shadow: 0 0 0.5em rgba(180, 148, 247, 0.5);
  margin: 0 0 0.25rem;
}

.intern-subtitle {
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.875rem;
  color: var(--panel-accent-65, rgba(180, 148, 247, 0.65));
  text-transform: uppercase;
  margin: 0;
}

.intern-main {
  display: grid;
  grid-template-columns: minmax(300px, 400px) 1fr;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 900px) {
  .intern-main {
    grid-template-columns: 1fr;
  }
}

/* Calendar Pane */
.intern-calendar-pane {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.intern-post-count {
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.625rem;
  background: var(--amber);
  color: var(--black);
  padding: 0.1em 0.3em;
  border-radius: 2px;
  font-weight: 700;
}

/* Details Pane */
.intern-details-pane {
  min-height: 400px;
}

.intern-details-panel {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(180, 148, 247, 0.3);
  padding: 1.5rem;
  height: 100%;
}

.intern-details-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(180, 148, 247, 0.2);
}

.intern-details-date {
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 1.25rem;
  color: var(--white);
  margin: 0;
}

.intern-details-day {
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.75rem;
  color: var(--panel-accent-40, rgba(180, 148, 247, 0.4));
  text-transform: uppercase;
}

.intern-refresh-btn {
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 0.75rem;
  text-transform: uppercase;
  background: transparent;
  border: 1px solid rgba(180, 148, 247, 0.5);
  color: var(--panel-accent-65, rgba(180, 148, 247, 0.65));
  padding: 0.5em 1em;
  cursor: pointer;
  transition: all 0.2s var(--ease-drift);
}

.intern-refresh-btn:hover {
  background: rgba(105, 57, 202, 0.2);
  border-color: rgba(180, 148, 247, 0.8);
  color: var(--white);
}

.intern-empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--panel-accent-40, rgba(180, 148, 247, 0.4));
  font-family: 'PP Mori', sans-serif;
}

/* Accordion Overrides for Intern */
.intern-accordion {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.intern-section-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 0.5rem;
}

/* Post Card */
.intern-post-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(180, 148, 247, 0.15);
  padding: 1rem;
}

.intern-post-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.intern-status-badge {
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.625rem;
  text-transform: uppercase;
  padding: 0.2em 0.5em;
  font-weight: 700;
}

.intern-post-time {
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.75rem;
  color: var(--panel-accent-65);
}

.intern-post-title {
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 1rem;
  color: var(--white);
  margin: 0 0 0.5rem;
}

.intern-post-topic {
  font-family: 'PP Mori', sans-serif;
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 0.5rem;
  line-height: 1.4;
}

.intern-post-caption {
  font-family: 'PP Mori', sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(0, 0, 0, 0.3);
  padding: 0.75rem;
  margin: 0.5rem 0;
  white-space: pre-wrap;
  line-height: 1.5;
  border-left: 2px solid var(--ultraviolet);
}

.intern-post-todos {
  margin: 0.5rem 0;
  padding-left: 1.25rem;
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 0.8125rem;
  color: var(--amber);
}

.intern-post-todos li {
  margin-bottom: 0.25rem;
}

.intern-post-notes {
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.75rem;
  color: var(--magma);
  margin: 0.5rem 0 0;
}

.intern-post-assets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.intern-asset-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
}

.intern-asset-badge {
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.5rem;
  text-transform: uppercase;
  padding: 0.15em 0.4em;
  font-weight: 700;
}

/* Event Card */
.intern-event-card {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(180, 148, 247, 0.1);
  padding: 0.75rem;
}

.intern-event-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.intern-event-label {
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 0.875rem;
  color: var(--white);
}

.intern-event-category {
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.625rem;
  color: var(--panel-accent-40);
  text-transform: uppercase;
  margin-left: auto;
}

.intern-event-time {
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.75rem;
  color: var(--panel-accent-65);
  display: block;
  margin-top: 0.25rem;
}

.intern-event-desc {
  font-family: 'PP Mori', sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0.5rem 0 0;
  line-height: 1.4;
}

.intern-event-link {
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.625rem;
  color: var(--green);
  text-decoration: none;
  display: inline-block;
  margin-top: 0.5rem;
}

.intern-event-link:hover {
  text-decoration: underline;
}

/* Question Card */
.intern-question-card {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(239, 92, 111, 0.2);
  padding: 0.75rem;
}

.intern-question--answered {
  border-color: rgba(20, 241, 178, 0.2);
}

.intern-question-text {
  font-family: 'PP Mori', sans-serif;
  font-size: 0.875rem;
  color: var(--white);
  margin: 0;
}

.intern-question-answer {
  font-family: 'PP Mori', sans-serif;
  font-size: 0.8125rem;
  color: var(--green);
  margin: 0.5rem 0 0;
  padding-left: 1rem;
  border-left: 2px solid var(--green);
}

.intern-question-pending {
  font-family: 'Pixeloid Mono', monospace;
  font-size: 0.625rem;
  color: var(--magma);
  text-transform: uppercase;
  display: inline-block;
  margin-top: 0.5rem;
}

/* Links */
.intern-links-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.intern-link-item {
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 0.75rem;
  color: var(--panel-accent);
  text-decoration: none;
  padding: 0.4em 0.8em;
  border: 1px solid rgba(180, 148, 247, 0.3);
  transition: all 0.2s var(--ease-drift);
}

.intern-link-item:hover {
  background: rgba(105, 57, 202, 0.2);
  border-color: rgba(180, 148, 247, 0.6);
  color: var(--white);
}
```

**Step 2: Verify page loads**

Run: `cd /Users/rivermassey/Desktop/dev/DNA/apps/monolith-hackathon && pnpm dev`

Navigate to: `http://localhost:3002/intern`

Expected: 2-pane layout with calendar on left, details on right

**Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(intern): add dashboard styles

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Create CRT 404 Page

**Files:**
- Create: `app/not-found.tsx`

**Step 1: Create the 404 page with CRT glitch styling**

```tsx
// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="error-page">
      <div className="error-container">
        <div className="error-glitch" data-text="404">404</div>
        <div className="error-message">
          <span className="error-label">ERROR:</span> FILE_NOT_FOUND
        </div>
        <p className="error-desc">
          The requested resource could not be located in this dimension.
        </p>
        <Link href="/" className="error-link">
          RETURN TO MONOLITH
        </Link>
      </div>
      <div className="error-scanlines" />
    </div>
  );
}
```

**Step 2: Add 404 styles to globals.css**

Append the following to `app/globals.css`:

```css
/* =============================================================================
   404 Error Page Styles
   ============================================================================= */

.error-page {
  min-height: 100dvh;
  background: linear-gradient(180deg, #060b0a 0%, #0a0505 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.error-container {
  text-align: center;
  z-index: 10;
  padding: 2rem;
}

.error-glitch {
  font-family: 'Mondwest', serif;
  font-size: clamp(6rem, 20vw, 12rem);
  color: var(--magma);
  text-shadow:
    0.05em 0 0 var(--green),
    -0.025em -0.05em 0 var(--ultraviolet),
    0.025em 0.05em 0 var(--amber);
  position: relative;
  animation: glitch 2s infinite;
  line-height: 1;
  margin-bottom: 1rem;
}

.error-glitch::before,
.error-glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.error-glitch::before {
  color: var(--green);
  animation: glitch-1 0.3s infinite;
  clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
  transform: translate(-0.025em, -0.0125em);
}

.error-glitch::after {
  color: var(--ultraviolet);
  animation: glitch-2 0.3s infinite;
  clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
  transform: translate(0.025em, 0.0125em);
}

@keyframes glitch {
  0%, 100% {
    text-shadow:
      0.05em 0 0 var(--green),
      -0.025em -0.05em 0 var(--ultraviolet),
      0.025em 0.05em 0 var(--amber);
  }
  25% {
    text-shadow:
      -0.05em -0.025em 0 var(--green),
      0.025em 0.025em 0 var(--ultraviolet),
      -0.05em -0.05em 0 var(--amber);
  }
  50% {
    text-shadow:
      0.025em 0.05em 0 var(--green),
      0.05em 0 0 var(--ultraviolet),
      0 -0.05em 0 var(--amber);
  }
  75% {
    text-shadow:
      -0.05em 0 0 var(--green),
      -0.05em -0.025em 0 var(--ultraviolet),
      -0.025em 0.05em 0 var(--amber);
  }
}

@keyframes glitch-1 {
  0%, 100% { transform: translate(-0.025em, -0.0125em); }
  25% { transform: translate(0.0125em, 0.025em); }
  50% { transform: translate(-0.05em, -0.025em); }
  75% { transform: translate(0.025em, 0.0125em); }
}

@keyframes glitch-2 {
  0%, 100% { transform: translate(0.025em, 0.0125em); }
  25% { transform: translate(-0.025em, -0.0125em); }
  50% { transform: translate(0.05em, 0.025em); }
  75% { transform: translate(-0.0125em, -0.025em); }
}

.error-message {
  font-family: 'Pixeloid Mono', monospace;
  font-size: clamp(1rem, 3vw, 1.5rem);
  color: var(--white);
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.error-label {
  color: var(--magma);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.error-desc {
  font-family: 'PP Mori', sans-serif;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 2rem;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.error-link {
  display: inline-block;
  font-family: 'Pixeloid Sans', sans-serif;
  font-size: 0.875rem;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--white);
  background: linear-gradient(76deg, #fc8e43, #ef5c6f 46%, #6939c9);
  padding: 0.75em 1.5em;
  border: 1px solid rgba(180, 148, 247, 0.8);
  border-bottom-color: var(--bevel-lo);
  border-right-color: var(--bevel-lo);
  box-shadow: 0 0.125em 0 0 var(--black);
  transition: all 0.2s var(--ease-drift);
}

.error-link:hover {
  transform: translateY(-0.125em);
  box-shadow: 0 0 2em 0 var(--magma), 0 0.25em 0 0 var(--black);
}

.error-link:active {
  transform: translateY(0.125em);
  box-shadow: none;
}

.error-scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.15) 2px,
    rgba(0, 0, 0, 0.15) 4px
  );
  pointer-events: none;
  z-index: 20;
  animation: scanline-flicker 0.1s infinite;
}

@keyframes scanline-flicker {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 0.85; }
}
```

**Step 3: Verify 404 page**

Navigate to: `http://localhost:3002/nonexistent-page`

Expected: CRT glitch 404 page with scanlines and animation

**Step 4: Commit**

```bash
git add app/not-found.tsx app/globals.css
git commit -m "feat: add CRT glitch 404 page

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Final Verification & Documentation

**Step 1: Test all functionality**

1. Visit `http://localhost:3002/intern`
   - Calendar shows Feb and Mar 2026
   - Post count badges appear on days with content
   - Clicking a date updates the details panel
   - Collapsible sections work (Posts, Events, Questions, Links)
   - Refresh button works
   - Today is selected by default

2. Visit `http://localhost:3002/anything-invalid`
   - 404 page displays with glitch effect
   - Scanlines animate
   - "Return to Monolith" link works

**Step 2: Update brainstorm doc status**

Edit `docs/brainstorms/2026-02-04-intern-dashboard-brainstorm.md`:

Change `**Status:** Decided` to `**Status:** Implemented`

**Step 3: Final commit**

```bash
git add docs/brainstorms/2026-02-04-intern-dashboard-brainstorm.md
git commit -m "docs: mark intern dashboard brainstorm as implemented

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Post-Implementation: Vercel Password Protection

After deploying to Vercel:

1. Go to Vercel Dashboard → Project → Settings → Deployment Protection
2. Enable "Password Protection"
3. Under "Protected Paths", add `/intern`
4. Set a password and share with team + Solana Mobile stakeholders

Alternatively, protect all preview deployments and keep production public.

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Planning data types & content | `app/intern/data.ts` |
| 2 | Calendar grid component | `app/intern/CalendarGrid.tsx` |
| 3 | Details panel component | `app/intern/DetailsPanel.tsx` |
| 4 | Main intern page | `app/intern/page.tsx` |
| 5 | Intern page styles | `app/globals.css` |
| 6 | CRT 404 page | `app/not-found.tsx`, `app/globals.css` |
| 7 | Verification & docs | `docs/brainstorms/*.md` |
