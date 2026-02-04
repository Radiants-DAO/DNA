// app/intern/components/DraftCard.tsx
'use client';

import type { DashboardDraft, UserRole } from '../types/typefully';
import { TaskList } from './TaskList';
import { TweetEmbed } from './TweetEmbed';

interface DraftCardProps {
  draft: DashboardDraft;
  role: UserRole;
  onToggleTask?: (draftId: number, taskIndex: number) => void;
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#666',
  scheduled: '#fd8f3a',
  published: '#14f1b2',
  publishing: '#6939ca',
  error: '#ef5c6f',
};

export function DraftCard({ draft, role, onToggleTask }: DraftCardProps) {
  const isEditor = role === 'editor';
  const isPublished = draft.status === 'published';

  return (
    <div className="intern-draft-card">
      <div className="intern-draft-header">
        <span
          className="intern-draft-status"
          style={{ backgroundColor: STATUS_COLORS[draft.status] || '#666' }}
        >
          {draft.status}
        </span>
        {draft.scheduledTime && (
          <span className="intern-draft-time">{draft.scheduledTime} UTC</span>
        )}
      </div>

      <h4 className="intern-draft-title">{draft.title}</h4>

      {draft.preview && (
        <p className="intern-draft-preview">{draft.preview}</p>
      )}

      {/* Show embedded tweet for published drafts */}
      {isPublished && draft.publishedUrl && (
        <TweetEmbed url={draft.publishedUrl} />
      )}

      {/* Show tasks only for editors */}
      {isEditor && draft.tasks.length > 0 && (
        <div className="intern-draft-tasks">
          <h5 className="intern-draft-tasks-title">Tasks</h5>
          <TaskList
            tasks={draft.tasks}
            onToggle={(taskIndex) => onToggleTask?.(draft.id, taskIndex)}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="intern-draft-actions">
        <a
          href={draft.editUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="intern-draft-btn intern-draft-btn--edit"
        >
          {isPublished ? 'View on Typefully' : 'Edit on Typefully'}
        </a>

        {isPublished && draft.publishedUrl && (
          <a
            href={draft.publishedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="intern-draft-btn intern-draft-btn--view"
          >
            View Post
          </a>
        )}
      </div>
    </div>
  );
}
