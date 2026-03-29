'use client';

import { useState } from 'react';
import { Button, Input } from '@rdna/radiants/components/core';

export function CommentPopoverRdna() {
  const [note, setNote] = useState('');

  return (
    <div className="flex flex-col gap-3 w-full">
      <span className="font-heading text-xs uppercase tracking-wide text-mute">
        Comment
      </span>

      {/* Popover */}
      <div className="bg-card pixel-rounded-sm border border-line shadow-floating w-full flex flex-col">
        {/* Top accent bar */}
        <div className="h-0.5 bg-accent pixel-rounded-sm" />

        {/* Compact entry row */}
        <div className="flex items-center gap-1.5 p-2">
          <Input
            size="sm"
            placeholder="Add a note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="flex-1 font-mono text-xs"
          />
          <Button
            mode="flat"
            size="sm"
            compact
            onClick={() => setNote('')}
          >
            &rarr;
          </Button>
        </div>
      </div>
    </div>
  );
}
