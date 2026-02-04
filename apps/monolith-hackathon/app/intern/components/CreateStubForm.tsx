// app/intern/components/CreateStubForm.tsx
'use client';

import { useState } from 'react';

interface CreateStubFormProps {
  selectedDate: string;
  onSubmit: (data: {
    title: string;
    brief: string;
    scheduledDate: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export function CreateStubForm({
  selectedDate,
  onSubmit,
  onCancel,
}: CreateStubFormProps) {
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    await onSubmit({
      title: title.trim(),
      brief: brief.trim(),
      scheduledDate: selectedDate,
    });
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="intern-stub-form">
      <h3 className="intern-stub-form-title">Create Stub Draft</h3>
      <p className="intern-stub-form-date">
        Scheduled for: {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </p>

      <div className="intern-stub-field">
        <label htmlFor="stub-title" className="intern-stub-label">
          Title *
        </label>
        <input
          id="stub-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Meet the Judges"
          className="intern-stub-input"
          required
          autoFocus
        />
      </div>

      <div className="intern-stub-field">
        <label htmlFor="stub-brief" className="intern-stub-label">
          Brief / Content Direction
        </label>
        <textarea
          id="stub-brief"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="What should this post be about? Any specific notes for Rizzy..."
          className="intern-stub-textarea"
          rows={4}
        />
      </div>

      <p className="intern-stub-note">
        Default tasks will be added: Create content (@rizzy), Review (@kemo)
      </p>

      <div className="intern-stub-actions">
        <button
          type="button"
          onClick={onCancel}
          className="intern-stub-btn intern-stub-btn--cancel"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="intern-stub-btn intern-stub-btn--submit"
          disabled={isSubmitting || !title.trim()}
        >
          {isSubmitting ? 'Creating...' : 'Create Stub'}
        </button>
      </div>
    </form>
  );
}
