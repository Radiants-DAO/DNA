# Intern Dashboard & 404 Page Brainstorm

**Date:** 2026-02-04
**Status:** Implemented

## What We're Building

A password-protected `/intern` page for internal content planning, serving both the creative team and Solana Mobile stakeholders. Features a 2-pane layout with calendar on the left and date-specific collapsible sections on the right (tasks, questions for Solana Mobile, assets, links). Also building a custom CRT glitch-style 404 page.

## Why This Approach

**Approach A: Modular Data-Driven Layout** — Creates a self-contained `/intern` route without bloating the existing InfoWindow component. Uses a date-keyed JSON structure that maps cleanly to the workflow: click a date, see everything relevant to that day.

Vercel password protection handles auth without any code changes — just configure in Vercel dashboard for the `/intern` path.

## Key Decisions

- **Full-page layout** — No orbital nav, dedicated internal interface
- **Collapsible sections** — Tasks, Questions, Assets, Links per date; defaults to "today"
- **Hardcoded JSON** — Same pattern as existing calendar, manual updates
- **Vercel password protection** — No custom auth code needed
- **404 page** — CRT glitch error aesthetic (scanlines, flickering, ERROR: FILE_NOT_FOUND)

## Data Structure

Based on the Typefully CSV export, the data structure maps directly to content calendar fields:

```ts
// app/intern/data.ts

type ContentStatus = 'SENT' | 'Scheduled' | 'Ready' | 'Waiting';

interface ContentPost {
  status: ContentStatus;
  time?: string;              // "6 PM UTC"
  title: string;              // Post Title
  topic?: string;             // Internal context/reminder
  caption?: string;           // Full social copy
  todos?: string[];           // To-Do items
  notes?: string;             // Assignee notes (e.g., "Cronus - please cook this ser")
  assets?: Asset[];           // Linked files/media
}

interface Asset {
  name: string;
  url?: string;
  status: 'pending' | 'in-progress' | 'pending-review' | 'approved';
}

interface Question {
  q: string;
  answered: boolean;
  answer?: string;
}

interface DayPlan {
  day: string;                // "Tuesday"
  events: CalendarEvent[];    // From existing calendar
  posts: ContentPost[];       // Content calendar items
  questions: Question[];      // Questions for Solana Mobile
  links: { label: string; url: string }[];
}

export const PLANNING_DATA: Record<string, DayPlan> = {
  "2026-02-04": {
    day: "Wednesday",
    events: [/* from existing calendar */],
    posts: [
      {
        status: "SENT",
        time: "6 PM UTC",
        title: "Lets cook, Devshop teaches us how!",
        topic: "Remind people of day and time of Devshop on Thursday and what to expect",
        caption: "",
        todos: [],
        notes: ""
      }
    ],
    questions: [],
    links: [
      { label: "Typefully Calendar", url: "https://typefully.com/..." }
    ]
  },
  "2026-02-10": {
    day: "Tuesday",
    events: [],
    posts: [
      {
        status: "Waiting",
        title: "Meet the Judges",
        topic: "introducing the judges who they are and their titles",
        caption: "Some old, some new. We keeping it fresh and fair.",
        todos: ["F1-style animation with judge transitions"],
        notes: "Cronus - please cook this ser",
        assets: [
          { name: "Judge intro video", status: "pending" }
        ]
      },
      {
        status: "Waiting",
        title: "Never Forget",
        topic: "Reminder Do's and don'ts, important deadlines or dates",
        caption: "These may or may not be incredibly important. Up to you."
      }
    ],
    questions: [],
    links: []
  }
}
```

### Status Color Mapping

| Status | Color | Token |
|--------|-------|-------|
| SENT | Green | --green (#14f1b2) |
| Scheduled | Amber | --amber (#fd8f3a) |
| Ready | Purple | --ultraviolet (#6939ca) |
| Waiting | Muted | --slate (#0e151a) |
```

## Deliverables

1. **`/intern` page** — `app/intern/page.tsx` with 2-pane layout
2. **Planning data** — `app/intern/data.ts` with typed JSON structure
3. **404 page** — `app/not-found.tsx` with CRT glitch styling
4. **Vercel config** — Password protection for `/intern` path (manual step)

## Research Notes

- Existing calendar in `app/components/InfoWindow.tsx` with category colors: launch (#14f1b2), vibecoding (#fd8f3a), devshop (#6939ca), deadline (#ef5c6f), milestone (#b494f7), mtndao (#8dfff0)
- Theme tokens in `app/globals.css`: --green, --ultraviolet, --magma, --amber, --ocean, --slate
- No existing auth — Vercel password protection is the right fit
- Current 404 uses Next.js defaults — no custom error pages yet

## Additional Decisions

- **Questions section** — Team → Solana Mobile direction (questions we need answered)
- **SENT posts** — Visible when that date is selected, not hidden
- **Data sources** — Merge CSV content + existing calendar events from InfoWindow
- **Solana Mobile access** — View-only for v1, comments as future feature
- **Day indicators** — Count badge showing number of posts per day
- **Refresh** — Soft refresh button to reload data without full page reload

## Open Questions

- None — ready for implementation

## Vercel Password Protection Setup

After deployment:
1. Vercel Dashboard → Project → Settings → Deployment Protection
2. Enable "Password Protection"
3. Add `/intern` to protected paths (or protect entire preview deployments)
4. Share password with team + Solana Mobile stakeholders
