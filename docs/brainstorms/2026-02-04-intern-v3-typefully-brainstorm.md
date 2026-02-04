# Intern Dashboard v3: Typefully Integration Brainstorm

**Date:** 2026-02-04
**Status:** Implemented

## What We're Building

A two-tier /intern dashboard powered by the Typefully API. Reviewers (Solana Mobile) get a clean view to preview upcoming content and see embedded published tweets. Editors (Rizzy/Kemo/Cronus) get a full task management view with the ability to create stub drafts, reschedule posts, and track per-draft tasks via checkboxes synced to Typefully's scratchpad.

## User Experiences

### Reviewer (Solana Mobile)
- **Access:** Reviewer password
- **Primary goal:** Review upcoming content before it posts
- **View:** Clean, current-day focused
- **Features:**
  - See all drafts on calendar
  - Embedded tweet previews for published posts
  - "Review on Typefully" button → opens `private_url` to leave comments
  - No task/checkbox clutter

### Editor (Rizzy/Kemo/Cronus)
- **Access:** Editor password
- **Primary goal:** Manage content calendar, track task progress
- **View:** Full task management
- **Features:**
  - Calendar with assignee color bubbles
  - Create stub drafts (date + title + brief + default tasks)
  - Reschedule drafts (change `publish_at` via API)
  - Task checkboxes synced to Typefully `scratchpad_text`
  - "Edit in Typefully" for content editing

## Key Decisions

### Data Source
- **Typefully API as primary** — real status, published URLs, scheduled dates
- **No Google Sheet** — eliminates dual data source complexity

### Task System
- **Storage:** Typefully `scratchpad_text` field per draft
- **Format:** Markdown-style checkboxes with @mentions
  ```
  [ ] Create content @rizzy
  [ ] Create animation @cronus
  [ ] Review @kemo
  ```
- **Sync:** Dashboard parses scratchpad, checkbox updates PATCH the draft

### Stub Draft Creation
- **Purpose:** River creates placeholder drafts for Rizzy to flesh out
- **Fields:** Date, Title, Brief/description
- **Default template:**
  ```
  [ ] Create content @rizzy
  [ ] Review @kemo
  ```
- **Workflow:** Create stub → Rizzy sees on dashboard → "Edit in Typefully" → completes content

### Assignee Tracking
- **Method:** Typefully tags (`rizzy`, `kemo`, `cronus`)
- **Colors:** Distinct bubble colors per assignee on calendar
- **Filtering:** Can filter dashboard by tag/assignee

### Authentication
- **Two passwords:**
  - `INTERN_REVIEWER_PASSWORD` → clean reviewer view
  - `INTERN_EDITOR_PASSWORD` → full editor view
- **Server-side API routes** — Typefully API key never exposed to client

### What Happens Where

| Action | Dashboard | Typefully |
|--------|-----------|-----------|
| View calendar/status | ✅ | |
| See published tweets (embedded) | ✅ | |
| Create stub drafts | ✅ | |
| Reschedule (change date) | ✅ | |
| Check off tasks | ✅ | |
| Write/edit post content | | ✅ |
| Upload media | | ✅ |
| Create threads | | ✅ |
| Leave review comments | | ✅ |
| Publish immediately | | ✅ |

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    /intern (Client)                         │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │ Reviewer View   │    │ Editor View                     │ │
│  │ - Calendar      │    │ - Calendar + task bubbles       │ │
│  │ - Embedded tweets│   │ - Create stub form              │ │
│  │ - Review button │    │ - Task checkboxes               │ │
│  └─────────────────┘    │ - Reschedule controls           │ │
│                         └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                    /api/typefully/*
                              │
┌─────────────────────────────────────────────────────────────┐
│              Next.js API Routes (Vercel)                    │
│  - GET  /api/typefully/drafts     → list all drafts         │
│  - POST /api/typefully/drafts     → create stub             │
│  - PATCH /api/typefully/drafts/[id] → reschedule, tasks     │
│  - Server-only: TYPEFULLY_API_KEY                           │
└─────────────────────────────────────────────────────────────┘
                              │
                    api.typefully.com
```

## Env Variables

```bash
# Server-only (Vercel)
TYPEFULLY_API_KEY=xxx
TYPEFULLY_SOCIAL_SET_ID=xxx
INTERN_EDITOR_PASSWORD=xxx

# Client-accessible
NEXT_PUBLIC_INTERN_REVIEWER_PASSWORD=xxx
```

## Open Questions

- Should the stub creation form have a "post brief" textarea or is title + scratchpad enough?
- Do we want email/Slack notifications when someone is @mentioned in a new task?
- Should completed tasks ([x]) be hidden or shown with strikethrough?

## Research Notes

- Typefully API: `scratchpad_text` is plain text, survives draft edits
- Typefully API: `private_url` opens draft in editor with commenting
- Typefully API: Tags can be created via `POST /tags` and assigned to drafts
- Embedded tweets: Use Twitter's oEmbed API or `react-tweet` package
