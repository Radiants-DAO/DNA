// app/intern/lib/transforms.ts
import type { TypefullyDraft, DashboardDraft } from '../types/typefully';
import { parseTasks } from './tasks';

/**
 * Transform Typefully draft to dashboard-friendly format
 */
export function transformDraft(draft: TypefullyDraft): DashboardDraft {
  // Parse scheduled date and time
  let scheduledDate: string | null = null;
  let scheduledTime: string | null = null;

  if (draft.scheduled_date) {
    const date = new Date(draft.scheduled_date);
    scheduledDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
    scheduledTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    });
  }

  return {
    id: draft.id,
    title: draft.draft_title || 'Untitled Draft',
    preview: draft.preview || '',
    status: draft.status,
    scheduledDate,
    scheduledTime,
    publishedAt: draft.published_at,
    publishedUrl: draft.x_published_url,
    editUrl: draft.private_url,
    tasks: parseTasks(draft.scratchpad_text),
    tags: draft.tags || [],
  };
}

/**
 * Group drafts by scheduled date
 */
export function groupDraftsByDate(
  drafts: DashboardDraft[]
): Map<string, DashboardDraft[]> {
  const grouped = new Map<string, DashboardDraft[]>();

  for (const draft of drafts) {
    const key = draft.scheduledDate || 'unscheduled';
    const existing = grouped.get(key) || [];
    existing.push(draft);
    grouped.set(key, existing);
  }

  // Sort drafts within each day by time
  for (const [, dayDrafts] of grouped) {
    dayDrafts.sort((a, b) => {
      if (!a.scheduledTime) return 1;
      if (!b.scheduledTime) return -1;
      return a.scheduledTime.localeCompare(b.scheduledTime);
    });
  }

  return grouped;
}

/**
 * Extract tweet ID from X published URL
 * URL format: https://x.com/username/status/1234567890
 */
export function extractTweetId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Get unique assignees from drafts (for filtering)
 */
export function getUniqueAssignees(drafts: DashboardDraft[]): string[] {
  const assignees = new Set<string>();
  for (const draft of drafts) {
    for (const task of draft.tasks) {
      if (task.assignee) {
        assignees.add(task.assignee);
      }
    }
  }
  return Array.from(assignees).sort();
}
