// app/intern/data.ts

// Re-export calendar events from InfoWindow for event overlay on calendar
export { CONTENT } from '../components/InfoWindow';

// Legacy types kept for reference - new types in types/typefully.ts
export type ContentStatus = 'SENT' | 'Scheduled' | 'Ready' | 'Waiting';

// Status colors (kept for backward compatibility with CalendarGrid)
export const STATUS_COLORS: Record<ContentStatus, string> = {
  SENT: '#14f1b2',      // --green
  Scheduled: '#fd8f3a', // --amber
  Ready: '#6939ca',     // --ultraviolet
  Waiting: '#0e151a',   // --slate
};

// Note: PLANNING_DATA has been removed.
// Content calendar data now comes from Typefully API via /api/typefully/drafts
