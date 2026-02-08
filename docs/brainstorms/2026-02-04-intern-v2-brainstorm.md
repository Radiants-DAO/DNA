# Intern Dashboard v2 Brainstorm

**Date:** 2026-02-04
**Status:** Decided

## What We're Building

Upgrade the /intern dashboard to pull content data from a Google Sheet (one-way sync), add a dedicated "Completed Content" section for Solana Mobile stakeholders, and improve the detail panel organization while keeping the current day-focus layout.

## Why This Approach

**Google Sheet as data source** — Rizzy can edit content in a familiar interface without touching code. One-way sync (Sheet → Dashboard) is simple to implement with public sheet access, no OAuth required.

**Keep day-focus layout** — Current 2-pane calendar + detail panel works for daily planning. Improvements focus on better organization within that structure.

**Dedicated Completed Content section** — Solana Mobile needs quick access to all published content with Typefully links. Separate section filtered to SENT status serves this need without cluttering the daily view.

## Key Decisions

- **Data source:** Google Sheet (public or link-shared) fetched at page load
- **Sync direction:** One-way (Sheet → Dashboard), Rizzy edits Sheet only
- **Layout:** Keep current day-focus, improve detail panel
- **New section:** "Completed Content" tab/panel for Solana Mobile
- **Sheet URL:** https://docs.google.com/spreadsheets/d/1aZ6R5qGNBM3Yb_JnOdCqjgvK73tAMdOV3CqHFtmbRYY/edit

## Users & Their Needs

| User | Primary Need |
|------|--------------|
| Rizzy + Cronus | See daily tasks/prep, edit content in Sheet |
| Solana Mobile | Quick access to completed content links |

## Data Mapping (Sheet → Dashboard)

| Sheet Column | Maps To |
|--------------|---------|
| Status | post.status (SENT/Scheduled/Ready/Waiting) |
| Date | date key (YYYY-MM-DD) |
| Day | dayPlan.day |
| Time | post.time |
| Post Title | post.title |
| Topic | post.topic |
| Post Caption | post.caption |
| To-Do | post.todos (split by newline) |
| Notes | post.notes |
| **New: Typefully Link** | post.link (for SENT posts) |
| **New: Image URLs** | post.images[] |

## Implementation Approach

1. **Fetch Sheet as JSON** — Use Google Sheets published CSV or JSON export URL
2. **Parse at runtime** — Transform sheet rows into existing DayPlan structure
3. **Cache briefly** — Avoid rate limits, maybe 5-min cache or on-demand refresh
4. **Add Completed tab** — Filter all posts where status === 'SENT', show links prominently
5. **Add columns to Sheet** — Typefully Link, Image URLs for Rizzy to fill in

## Open Questions

- Should we add a "Refresh from Sheet" button for manual sync?
- Do we need image preview in the dashboard or just URLs?
- Should empty Waiting days (Feb 14+) show in calendar or hide them?

## Research Notes

- Current data in `app/intern/data.ts` covers Feb 3-13 from original CSV
- Google Sheets can be fetched as JSON via: `https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:json`
- No backend needed — can fetch client-side with CORS-friendly export URL
