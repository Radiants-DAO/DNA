// app/intern/DetailsPanel.tsx
'use client';

import { CrtAccordion } from '../components/CrtAccordion';
import {
  DayPlan,
  ContentPost,
  Question,
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
