// app/intern/types/typefully.ts

// ============================================================================
// Typefully API Response Types
// ============================================================================

export type DraftStatus = 'draft' | 'scheduled' | 'published' | 'publishing' | 'error';

export interface TypefullyDraft {
  id: number;
  social_set_id: number;
  status: DraftStatus;
  created_at: string;
  updated_at: string | null;
  scheduled_date: string | null;
  published_at: string | null;
  draft_title: string | null;
  preview: string;
  tags: string[];
  share_url: string | null;
  private_url: string;
  x_published_url: string | null;
  x_post_published_at: string | null;
  scratchpad_text: string | null;
}

export interface TypefullyDraftsResponse {
  results: TypefullyDraft[];
  count: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

export interface TypefullyTag {
  slug: string;
  name: string;
  created_at: string;
}

export interface TypefullyTagsResponse {
  results: TypefullyTag[];
  count: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

// ============================================================================
// Draft Create/Update Request Types
// ============================================================================

export interface CreateDraftRequest {
  platforms: {
    x: {
      enabled: true;
      posts: { text: string; media_ids?: string[] }[];
      settings?: Record<string, unknown>;
    };
  };
  draft_title?: string;
  scratchpad_text?: string;
  tags?: string[];
  publish_at?: string; // ISO datetime or "now" or "next-free-slot"
}

export interface UpdateDraftRequest {
  draft_title?: string;
  scratchpad_text?: string;
  tags?: string[];
  publish_at?: string;
}

// ============================================================================
// Dashboard Types (transformed from Typefully)
// ============================================================================

export interface Task {
  id: string;
  text: string;
  assignee: string | null; // parsed from @mention
  completed: boolean;
}

export interface DashboardDraft {
  id: number;
  title: string;
  preview: string;
  status: DraftStatus;
  scheduledDate: string | null; // YYYY-MM-DD
  scheduledTime: string | null; // HH:MM
  publishedAt: string | null;
  publishedUrl: string | null;
  editUrl: string;
  tasks: Task[];
  tags: string[];
}

export type UserRole = 'reviewer' | 'editor';

// ============================================================================
// Assignee Colors
// ============================================================================

export const ASSIGNEE_COLORS: Record<string, string> = {
  rizzy: '#14f1b2',   // green
  kemo: '#6939ca',    // ultraviolet
  cronus: '#fd8f3a',  // amber
};

export const DEFAULT_TASK_TEMPLATE = `[ ] Create content @rizzy
[ ] Review @kemo`;
